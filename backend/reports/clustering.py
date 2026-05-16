import math
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN
from typing import List, Dict, Any
from reports.models import  IncidentCluster

TIME_WINDOW_HOURS = 3
GEO_RADIUS_KM = 3.0
MIN_CLUSTER_REPORTS = 3
DBSCAN_EPS = 0.82
DBSCAN_MIN_SAMPLES = 3
GUIDE_WEIGHT = 1.5


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def build_geo_matrix(lats, lons):
    n = len(lats)
    m = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                m[i][j] = haversine_km(lats[i], lons[i], lats[j], lons[j])
    return m


def build_cosine_matrix(descriptions, roles):
    n = len(descriptions)
    vec = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 1),
        min_df=1,
        max_df=0.95,
        sublinear_tf=True,
    )
    tfidf = vec.fit_transform(descriptions)
    cos_raw = cosine_similarity(tfidf)
    weights = np.ones((n, n))
    for i in range(n):
        for j in range(n):
            if roles[i] == "GUIDE" or roles[j] == "GUIDE":
                weights[i][j] = GUIDE_WEIGHT
    cos_weighted = np.clip(cos_raw * weights, 0.0, 1.0)
    np.fill_diagonal(cos_weighted, 1.0)
    return cos_weighted


def get_top_keywords(descriptions, idxs, top_n=5):
    try:
        subset = [descriptions[i] for i in idxs]
        vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 1), max_features=50)
        mat = vec.fit_transform(subset)
        scores = np.asarray(mat.sum(axis=0)).flatten()
        top_i = scores.argsort()[::-1][:top_n]
        return list(vec.get_feature_names_out()[top_i])
    except Exception:
        return []


def severity_from_confidence(score):
    if score >= 0.75:
        return "CRITICAL"
    if score >= 0.55:
        return "HIGH"
    if score >= 0.35:
        return "MEDIUM"
    return "LOW"


def run_clustering_pipeline(reports_queryset) -> List[Dict[str, Any]]:
    reports = list(reports_queryset)
    if len(reports) < MIN_CLUSTER_REPORTS:
        return []

    descriptions = [r.description for r in reports]
    lats = [r.latitude for r in reports]
    lons = [r.longitude for r in reports]
    roles = [getattr(r.user, "role", "TOURIST") for r in reports]
    categories = [r.category for r in reports]
    n = len(reports)

    geo_dist = build_geo_matrix(lats, lons)
    cos_sim = build_cosine_matrix(descriptions, roles)

    for i in range(n):
        for j in range(n):
            if geo_dist[i][j] > GEO_RADIUS_KM:
                cos_sim[i][j] = 0.0

    dist_matrix = 1.0 - cos_sim
    np.fill_diagonal(dist_matrix, 0.0)

    labels = DBSCAN(
        eps=DBSCAN_EPS,
        min_samples=DBSCAN_MIN_SAMPLES,
        metric="precomputed",
    ).fit_predict(dist_matrix)

    clusters = []
    unique_labels = set(labels)

    for cluster_label in sorted(unique_labels):
        if cluster_label == -1:
            continue

        idxs = [i for i, lbl in enumerate(labels) if lbl == cluster_label]
        if len(idxs) < MIN_CLUSTER_REPORTS:
            continue

        c_reps = [
            (lats[i], lons[i], descriptions[i], roles[i], categories[i]) for i in idxs
        ]
        n_rep = len(c_reps)

        c_lat = sum(lats[i] for i in idxs) / len(idxs)
        c_lon = sum(lons[i] for i in idxs) / len(idxs)

        dominant_cat = Counter(categories[i] for i in idxs).most_common(1)[0][0]
        n_guides = sum(1 for i in idxs if roles[i] == "GUIDE")
        guide_ratio = n_guides / n_rep
        confidence = round(min(0.7, n_rep / 10) + guide_ratio * 0.3, 4)
        keywords = get_top_keywords(descriptions, idxs)
        severity = severity_from_confidence(confidence)

        report_ids = [reports[i].id for i in idxs]

        clusters.append(
            {
                "report_ids": report_ids,
                "center_latitude": c_lat,
                "center_longitude": c_lon,
                "dominant_category": dominant_cat,
                "confidence_score": confidence,
                "top_keywords": keywords,
                "severity": severity,
                "report_count": n_rep,
            }
        )

    return clusters


def save_clusters_to_db(cluster_data_list: List[Dict]) -> List[IncidentCluster]:
    created_clusters = []

    for data in cluster_data_list:
        cluster = IncidentCluster.objects.create(
            center_latitude=data["center_latitude"],
            center_longitude=data["center_longitude"],
            dominant_category=data["dominant_category"],
            confidence_score=data["confidence_score"],
            top_keywords=data["top_keywords"],
            is_alert_triggered=data["confidence_score"] >= 0.7
            and data["report_count"] >= 3,
        )

        cluster.reports.set(data["report_ids"])
        created_clusters.append(cluster)

        if cluster.is_alert_triggered:
            from reports.models import AlertBroadcast, Notification

            alert = AlertBroadcast.objects.create(
                cluster=cluster,
                message=f"Auto-alert: {data['dominant_category']} incident detected with {data['severity']} severity.",
                severity=data["severity"],
                trigger_type="AUTO",
                broadcasted_by=None,
            )

            for report in cluster.reports.all():
                Notification.objects.create(
                    recipient=report.user,
                    notification_type="AUTO_ALERT",
                    title=f"Alert: {data['dominant_category'].replace('_', ' ').title()}",
                    message=alert.message,
                    incident_report=report,
                )

    return created_clusters

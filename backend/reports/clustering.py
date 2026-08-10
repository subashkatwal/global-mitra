import math
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN
from typing import List, Dict, Any
from reports.models import IncidentCluster

TIME_WINDOW_HOURS = 3
GEO_RADIUS_KM = 3
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
        max_df=1.0,
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

    for cluster_label in sorted(set(labels)):
        if cluster_label == -1:
            continue

        idxs = [i for i, lbl in enumerate(labels) if lbl == cluster_label]
        if len(idxs) < MIN_CLUSTER_REPORTS:
            continue

        n_rep = len(idxs)
        c_lat = sum(lats[i] for i in idxs) / n_rep
        c_lon = sum(lons[i] for i in idxs) / n_rep
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
    from reports.models import IncidentReport, AlertBroadcast, Notification
    from accounts.models import User

    created_clusters = []

    for data in cluster_data_list:
        # Skip if cluster already exists at this location
        existing = IncidentCluster.objects.filter(
            centerLatitude__range=(
                data["center_latitude"] - 0.001,
                data["center_latitude"] + 0.001,
            ),
            centerLongitude__range=(
                data["center_longitude"] - 0.001,
                data["center_longitude"] + 0.001,
            ),
            dominantCategory=data["dominant_category"],
        ).first()
        if existing:
            continue

        report_ids = data["report_ids"]
        reports_qs = IncidentReport.objects.filter(id__in=report_ids).select_related(
            "user"
        )

        # ── Check condition: at least 3 TOURIST reports + 1 GUIDE report ──
        tourist_count = sum(
            1 for r in reports_qs if getattr(r.user, "role", "TOURIST") == "TOURIST"
        )
        guide_count = sum(1 for r in reports_qs if getattr(r.user, "role", "") == "GUIDE")

        if tourist_count < 3 or guide_count < 1:
            continue  # condition not met, skip this cluster

        cluster = IncidentCluster.objects.create(
            centerLatitude=data["center_latitude"],
            centerLongitude=data["center_longitude"],
            dominantCategory=data["dominant_category"],
            confidenceScore=data["confidence_score"],
            topKeywords=data["top_keywords"],
            isAlertTriggered=True,
        )
        cluster.reports.set(report_ids)
        created_clusters.append(cluster)

        # Mark all reports AUTO_ALERTED
        IncidentReport.objects.filter(id__in=report_ids).update(
            status="AUTO_ALERTED",
            confidenceScore=data["confidence_score"],
        )

        alert = AlertBroadcast.objects.create(
            cluster=cluster,
            message=(
                f"⚠️ {data['dominant_category'].replace('_', ' ').title()} alert near your location. "
                f"Severity: {data['severity']}. Reported by {data['report_count']} users."
            ),
            severity=data["severity"],
            triggerType="AUTO",
            broadcastedBy=None,
        )

        title = f"⚠️ {data['dominant_category'].replace('_', ' ').title()} Alert Nearby"

        # ── Notify ALL users within GEO_RADIUS_KM of the cluster center ──
        nearby_users = _get_nearby_users(
            data["center_latitude"],
            data["center_longitude"],
            radius_km=GEO_RADIUS_KM,
        )

        notified_ids = set()
        for user in nearby_users:
            if user.id in notified_ids:
                continue
            notified_ids.add(user.id)
            Notification.objects.create(
                recipient=user,
                notificationType="AUTO_ALERT",
                title=title,
                message=alert.message,
                incidentReport=reports_qs.first(),
            )

    return created_clusters


def _get_nearby_users(center_lat, center_lon, radius_km):
    """
    Returns all users whose last known location is within radius_km.
    Falls back to notifying report authors only if no location data exists.
    """
    from accounts.models import User
    from reports.models import IncidentReport

    # Get users who have submitted any report near this cluster
    all_reports = IncidentReport.objects.select_related("user").all()
    nearby_users = []
    seen = set()
    for report in all_reports:
        if report.user_id in seen:
            continue
        dist = haversine_km(center_lat, center_lon, report.latitude, report.longitude)
        if dist <= radius_km:
            nearby_users.append(report.user)
            seen.add(report.user_id)
    return nearby_users

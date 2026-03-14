import math
import logging
import numpy as np
from datetime import timedelta
from collections import Counter

from django.utils import timezone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN

logger = logging.getLogger(__name__)

TIME_WINDOW_HOURS = 3
GEO_RADIUS_KM = 3.0
MIN_CLUSTER_REPORTS = 3
DBSCAN_MIN_SAMPLES = 3
DBSCAN_EPS = 0.85
GUIDE_WEIGHT = 1.5


def _haversine_km(lat1, lon1, lat2, lon2):
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


def _geo_matrix(lats, lons):
    n = len(lats)
    m = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                m[i][j] = _haversine_km(lats[i], lons[i], lats[j], lons[j])
    return m


def _cosine_matrix(descriptions, roles):
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


def _top_keywords(descriptions, idxs, top_n=5):
    try:
        subset = [descriptions[i] for i in idxs]
        vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 1), max_features=50)
        mat = vec.fit_transform(subset)
        scores = np.asarray(mat.sum(axis=0)).flatten()
        top_i = scores.argsort()[::-1][:top_n]
        return list(vec.get_feature_names_out()[top_i])
    except Exception:
        return []


def _severity_from_confidence(score):
    if score >= 0.75:
        return "CRITICAL"
    if score >= 0.55:
        return "HIGH"
    if score >= 0.35:
        return "MEDIUM"
    return "LOW"


def _build_alert_message(category, n_rep, keywords, lat, lon):
    kw = ", ".join(keywords[:3]) if keywords else "incident"
    return (
        f"A {category.replace('_', ' ').lower()} cluster has been auto-detected "
        f"from {n_rep} nearby reports near ({lat:.4f}, {lon:.4f}). "
        f"Key terms: {kw}. Please take necessary precautions."
    )


def run_clustering():
    from reports.models import (
        IncidentReport,
        IncidentCluster,
        AlertBroadcast,
        Notification,
    )

    cutoff = timezone.now() - timedelta(hours=TIME_WINDOW_HOURS)
    reports = list(
        IncidentReport.objects.filter(
            status="PENDING",
            createdAt__gte=cutoff,
        ).select_related("user")
    )

    if len(reports) < DBSCAN_MIN_SAMPLES:
        logger.info(
            "run_clustering: %d report(s) in window - need >= %d, skipping.",
            len(reports),
            DBSCAN_MIN_SAMPLES,
        )
        return {"skipped": True, "reason": "not_enough_reports", "count": len(reports)}

    descriptions = [r.description for r in reports]
    lats = [float(r.latitude) for r in reports]
    lons = [float(r.longitude) for r in reports]
    roles = [r.user.role.upper() for r in reports]
    n = len(reports)

    geo_dist = _geo_matrix(lats, lons)
    cos_sim = _cosine_matrix(descriptions, roles)

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

    clusters_created = []
    clusters_skipped = 0

    for cluster_label in sorted(set(labels)):
        if cluster_label == -1:
            continue

        idxs = [i for i, lbl in enumerate(labels) if lbl == cluster_label]
        c_reps = [reports[i] for i in idxs]
        n_rep = len(c_reps)

        if n_rep < MIN_CLUSTER_REPORTS:
            clusters_skipped += 1
            continue

        c_lat = sum(lats[i] for i in idxs) / len(idxs)
        c_lon = sum(lons[i] for i in idxs) / len(idxs)

        dominant_cat = Counter(r.category for r in c_reps).most_common(1)[0][0]
        n_guides = sum(1 for r in c_reps if r.user.role.upper() == "GUIDE")
        guide_ratio = n_guides / n_rep
        confidence = round(min(0.7, n_rep / 10) + guide_ratio * 0.3, 4)
        keywords = _top_keywords(descriptions, idxs)
        severity = _severity_from_confidence(confidence)

        try:
            cluster_obj = IncidentCluster.objects.create(
                centerLatitude=round(c_lat, 6),
                centerLongitude=round(c_lon, 6),
                topKeywords=keywords,
                confidenceScore=confidence,
                dominantCategory=dominant_cat,
                isAlertTriggered=True,
            )
            cluster_obj.reports.set(c_reps)

            for r in c_reps:
                r.status = "AUTO_VERIFIED"
                r.confidenceScore = confidence
                r.save(update_fields=["status", "confidenceScore"])

            AlertBroadcast.objects.create(
                cluster=cluster_obj,
                message=_build_alert_message(
                    dominant_cat, n_rep, keywords, c_lat, c_lon
                ),
                severity=severity,
                triggerType="AUTO",
            )

            for r in c_reps:
                Notification.objects.create(
                    recipient=r.user,
                    notificationType="CLUSTER_FORMED",
                    title=f"Alert: {dominant_cat.replace('_', ' ').title()} Detected Near You",
                    message=(
                        f"Your report has been grouped into a verified incident cluster "
                        f"({n_rep} reports nearby). "
                        f"A {severity.lower()} severity alert has been auto-triggered."
                    ),
                    incidentReport=r,
                )

            clusters_created.append(
                {
                    "cluster_id": str(cluster_obj.id),
                    "report_count": n_rep,
                    "centroid": (round(c_lat, 6), round(c_lon, 6)),
                    "category": dominant_cat,
                    "confidence": confidence,
                    "severity": severity,
                    "keywords": keywords,
                }
            )

            logger.info(
                "Cluster %s | %d reports | %s | confidence=%.4f | severity=%s",
                cluster_obj.id,
                n_rep,
                dominant_cat,
                confidence,
                severity,
            )

        except Exception as e:
            logger.exception(
                "run_clustering: failed to save cluster %d: %s", cluster_label, e
            )
            clusters_skipped += 1
            continue

    logger.info(
        "run_clustering done - %d created | %d skipped | %d noise",
        len(clusters_created),
        clusters_skipped,
        list(labels).count(-1),
    )

    return {
        "skipped": False,
        "total_reports": n,
        "clusters_created": clusters_created,
        "clusters_skipped": clusters_skipped,
        "noise_count": list(labels).count(-1),
    }

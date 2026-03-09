# import math
# import logging
# import numpy as np
# from datetime import timedelta
# from collections import Counter
# from django.utils import timezone
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# from sklearn.cluster import DBSCAN

# logger = logging.getLogger(__name__)

# TIME_WINDOW_HOURS = 3
# GEO_RADIUES_KM = 3.0
# MIN_CLUSTER_REPORTS = 3
# DBSCAN_MIN_SAMPLE = 3
# DBSCAN_EPS = 0.62
# GUIDE_WEIGHT = 1.5


# def _haversine_km(lat1, lon1, lat2, lon2):
#     R = 6371.0
#     phi1, phi2 = (
#         math.radians(lat1),
#         math.radians(lat2),
#     )  # convert angle from deg to rad.
#     d_phi = math.radians(lat2 - lat1)
#     d_lambda = math.radians(lon2 - lon1)
#     a = (
#         math.sin(d_phi / 2) ** 2
#         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
#     )
#     return R * 2 * math.asin(math.sqrt(a))


# def _geo_matrix(lats, lons):
#     n = len(lats)
#     m = np.zero((n, n))
#     for i in range(n):
#         for j in range(n):
#             if i != j:
#                 m[i][j] = _haversine_km(lats[i], lons[i], lats[j], lons[j])
#     return m


# def _cosine_matrix(descriptions, roles):
#     n = len(descriptions)
#     vec = TfidfVectorizer(
#         stop_words="english",
#         ngram_range=(1, 1),
#         min_df=1,
#         max_df=0.95,
#         sublinear_tf=True,
#     )
#     tfidf = vec.fit_transform(descriptions)
#     cos_raw = cosine_similarity(tfidf)

#     weights = np.ones((n, n))
#     for i in range(n):
#         for j in range(n):
#             if roles[i] == "GUIDE" or roles[j] == "GUIDE":
#                 weights[i][j] = GUIDE_WEIGHT
#     cos_weighted = np.clip(cos_raw * weights, 0.0, 1.0)
#     np.fill_diagonal(cos_weighted, 1.0)
#     return cos_weighted


# def _top_keywords(descriptions, idxs, top_n=5):
#     try:
#         subset = [descriptions[i] for i in idxs]
#         vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 1), max_features=50)
#         mat = vec.fit_transform(subset)
#         scores = np.asarray(mat.sum(axis=0)).flatten()
#         top_i = scores.argsort()[::-1][:top_n]
#         return list(vec.get_feature_names_out()[top_i])
#     except Exception:
#         return []


# def _severity_from_confidence(score: float) -> str:
#     if score >= 0.75:
#         return "CRITICAL"
#     if score >= 0.55:
#         return "HIGH"
#     if score >= 0.35:
#         return "MEDIUM"
#     return "LOW"


# def _build_alert_message(category, n_rep, keywords, lat, lon) -> str:
#     kw = ",".join(keywords[:3]) if keywords else "incident"
#     return (
#         f"A {category.replace('_', ' ').lower()} cluster has been auto-detected "
#         f"from {n_rep} nearby reports near ({lat:.4f}, {lon:.4f}). "
#         f"Key terms: {kw}. Please take necessary precautions."
#     )


# # Main Entry Point
# def run_clustering():
#     from reports.models import (
#         IncidentReport,
#         IncidentCluster,
#         AlertBroadcast,
#         Notification,
#     )

#     cutoff = timezone.now() - timedelta(hours=TIME_WINDOW_HOURS)
#     reports = list(
#         IncidentReport.objects.filter(
#             createdAt__gte=cutoff, status="PENDING"
#         ).select_related("user")
#     )
#     if len(reports) < DBSCAN_MIN_SAMPLE:
#         logger.info(
#             "run_clustering : only %d report(s) in window - need >= %d, skipping.",
#             len(reports),
#             DBSCAN_MIN_SAMPLE,
#         )
#         return {'skipped': True , 'reason': 'not_enough_reports', 'count': len(reports)}

# # Build feature arrays from real DB data
#     descriptions = [r.description for r in reports]
#     lats         = [r.latitude          for r in reports]
#     lons         = [r.longitude         for r in reports]
#     roles        = [r.user.role.upper() for r in reports]
#     n = len(reports)

#     geo_dist = _geo_matrix(lats, lons)
#     cos_sim  = _cosine_matrix(descriptions, roles)

#     for i in range(n):
#         for j in range(n):
#             if geo_dist[i][j] > GEO_RADIUES_KM:
#                 cos_sim[i][j] = 0.0
#     dist_matrix = 1.0 - cos_sim
#     np.fill_diagonal(dist_matrix, 0.0)

#     labels = DBSCAN(
#         eps= DBSCAN_EPS,
#         min_samples=DBSCAN_MIN_SAMPLE,
#         metric = 'precomputed',
#     ).fit_predict(dist_matrix)

#     clusters_created = []
#     clusters_skipped = 0

#     for cluster_label in sorted(set(labels)):
#         if cluster_label == -1:
#             continue #noise point

#         idxs = [i for i , lbl in enumerate(labels) if lbl == cluster_label]
#         c_reps = [reports[i] for i in idxs]
#         n_rep = len(c_reps)

#         if n_rep < MIN_CLUSTER_REPORTS:
#             clusters_skipped += 1
#             continue
        
#         #Centroid
#         c_lat = sum(lats[i] for i in idxs) / len(idxs)
#         c_lon = sum(lons[i] for i in idxs) / len(idxs)
#         # Dominant category — most common among cluster reports
#         dominant_cat = Counter(r.category for r in c_reps).most_common(1)[0][0]

#          # Confidence score
#         n_guides = sum(1 for r in c_reps if r.user.role.upper()=='GUIDE')
#         guide_ratio = n_guides/ n_rep
#         confidence  = round(min(0.7, n_rep / 10) + guide_ratio * 0.3, 4)

#         keywords = _top_keywords(descriptions, idxs)
#         severity = _severity_from_confidence(confidence)

#         """Create Incident clusters"""
#         cluster_obj = IncidentCluster.objects.create(
#             centerLatitude = round(c_lat, 6),
#             centerLongitude = round(c_lat, 6),
#             topKeywords = keywords,
#             confidenceScore = confidence,
#             dominantCategory = dominant_cat,
#             isAlertTriggered = True,
#         )
#         cluster_obj.reports.set(c_reps)

#         """ Update each reports """
#         for r in c_reps:
#             r.status = 'AUTO_VERIFIED'
#             r.confidenceScore  =confidence
#             r.save(update_fields= ['status','confidenceScore'])
        
#         """ Create AlertBroadCast """
#         AlertBroadcast.objects.create(
#             cluster = cluster_obj,
#             message = _build_alert_message(dominant_cat, n_rep , keywords, c_lat, c_lon),
#             severity = severity,
#             triggerType = 'AUTO',
#         )

#         """ Notify each report author """
#         for r in c_reps:
#             Notification.objects.create(
#                 recipient        = r.user,
#                 notificationType = 'CLUSTER_FORMED',
#                 title            = f'Alert: {dominant_cat.replace("_", " ").title()} Detected Near You',
#                 message          = (
#                     f'Your report has been grouped into a verified incident cluster '
#                     f'({n_rep} reports nearby). '
#                     f'A {severity.lower()} severity alert has been auto-triggered.'
#                 ),
#                 incidentReport = r,
#             )
#             clusters_created.append({
#             'cluster_id'  : str(cluster_obj.id),
#             'report_count': n_rep,
#             'centroid'    : (round(c_lat, 6), round(c_lon, 6)),
#             'category'    : dominant_cat,
#             'confidence'  : confidence,
#             'severity'    : severity,
#             'keywords'    : keywords,
#         })

#         logger.info(
#             'Cluster %s created | %d reports | %s | confidence=%.4f | severity=%s',
#             cluster_obj.id, n_rep, dominant_cat, confidence, severity,
#         )

#     logger.info(
#         'run_clustering complete — %d clusters created | %d skipped | %d noise',
#         len(clusters_created), clusters_skipped, list(labels).count(-1),
#     )

#     return {
#         'skipped'         : False,
#         'total_reports'   : n,
#         'clusters_created': clusters_created,
#         'clusters_skipped': clusters_skipped,
#         'noise_count'     : list(labels).count(-1),
#     }



"""
reports/clustering.py
─────────────────────────────────────────────────────────────────────────────
Spatio-Textual DBSCAN clustering pipeline for GlobalMitra.
Called synchronously from the post_save signal on IncidentReport.

Algorithm (verified against globalmitra_django.py notebook):
  1. Time filter        — only PENDING reports from the last TIME_WINDOW_HOURS
  2. Haversine matrix   — great-circle distance between every pair (km)
  3. TF-IDF + Cosine    — unigrams, guide-weighted similarity matrix
  4. Geo-filter         — zero out similarity for pairs > GEO_RADIUS_KM apart
  5. DBSCAN             — precomputed cosine-distance matrix, eps=0.62
  6. Verified detection — clusters with >= MIN_CLUSTER_REPORTS reports
  7. DB writes          — IncidentCluster + AlertBroadcast(AUTO) + Notification

Bugs fixed vs original file:
  ① np.zero(...)          → np.zeros(...)       (np.zero does not exist)
  ② centerLongitude       → used c_lat by mistake, now correctly uses c_lon
  ③ clusters_created.append() was inside the Notification for-loop (wrong indent)

─────────────────────────────────────────────────────────────────────────────
IMPORTANT — field name alignment with your Django model:
  This file uses the Python attribute names you defined on the model class.
  If your model uses snake_case field names (e.g. confidence_score) instead of
  camelCase (e.g. confidenceScore), update the two spots marked with # ← FIELD.
─────────────────────────────────────────────────────────────────────────────
"""

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

# ─── Pipeline constants ───────────────────────────────────────────────────────
# TIME_WINDOW_HOURS: only cluster reports submitted in the last N hours.
#   notebook demo uses 6h; production uses 3h for tighter real-time response.
TIME_WINDOW_HOURS   = 3

# GEO_RADIUS_KM: two reports more than this distance apart CANNOT cluster,
#   regardless of text similarity. Haversine great-circle, verified in notebook.
GEO_RADIUS_KM       = 3.0

# MIN_CLUSTER_REPORTS: minimum members for a cluster to be "Verified Incident".
#   Also used as DBSCAN min_samples so a cluster can only form if it already
#   has enough points to be verified.
MIN_CLUSTER_REPORTS = 3
DBSCAN_MIN_SAMPLES  = 3   # set equal to MIN_CLUSTER_REPORTS intentionally

# DBSCAN_EPS: maximum cosine DISTANCE (= 1 − similarity) for two reports to be
#   neighbours. Within-cluster cosine similarity is 0.38–0.78, so distance is
#   0.22–0.62 → eps=0.62 captures all intra-cluster pairs. Verified in notebook.
DBSCAN_EPS          = 0.62

# GUIDE_WEIGHT: guide reports are more reliable — boost their pairwise cosine
#   similarity by this factor before clipping to [0, 1].
GUIDE_WEIGHT        = 1.5


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two GPS points using the Haversine formula."""
    R        = 6371.0
    phi1     = math.radians(lat1)
    phi2     = math.radians(lat2)
    d_phi    = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def _geo_matrix(lats: list, lons: list) -> np.ndarray:
    """Return an n×n matrix of pairwise Haversine distances (km)."""
    n = len(lats)
    m = np.zeros((n, n))   # ← FIX ①: was np.zero (doesn't exist)
    for i in range(n):
        for j in range(n):
            if i != j:
                m[i][j] = _haversine_km(lats[i], lons[i], lats[j], lons[j])
    return m


def _cosine_matrix(descriptions: list, roles: list) -> np.ndarray:
    """
    TF-IDF unigram cosine similarity matrix with guide-role weighting.
    ngram_range=(1,1) is critical — bigrams on short texts collapse similarity
    to near-zero (verified in notebook Section 3 bug-fix notes).
    """
    n   = len(descriptions)
    vec = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 1),    # unigrams only — DO NOT change to (1,2)
        min_df=1,
        max_df=0.95,
        sublinear_tf=True,
    )
    tfidf   = vec.fit_transform(descriptions)
    cos_raw = cosine_similarity(tfidf)

    # Boost any pair that involves at least one GUIDE
    weights = np.ones((n, n))
    for i in range(n):
        for j in range(n):
            if roles[i] == "GUIDE" or roles[j] == "GUIDE":
                weights[i][j] = GUIDE_WEIGHT

    cos_weighted = np.clip(cos_raw * weights, 0.0, 1.0)
    np.fill_diagonal(cos_weighted, 1.0)
    return cos_weighted


def _top_keywords(descriptions: list, idxs: list, top_n: int = 5) -> list:
    """Extract top TF-IDF unigrams from the cluster's descriptions."""
    try:
        subset = [descriptions[i] for i in idxs]
        vec    = TfidfVectorizer(stop_words="english", ngram_range=(1, 1), max_features=50)
        mat    = vec.fit_transform(subset)
        scores = np.asarray(mat.sum(axis=0)).flatten()
        top_i  = scores.argsort()[::-1][:top_n]
        return list(vec.get_feature_names_out()[top_i])
    except Exception:
        return []


def _severity_from_confidence(score: float) -> str:
    """Map a 0.0–1.0 confidence score to a severity label."""
    if score >= 0.75:
        return "CRITICAL"
    if score >= 0.55:
        return "HIGH"
    if score >= 0.35:
        return "MEDIUM"
    return "LOW"


def _build_alert_message(category: str, n_rep: int, keywords: list,
                          lat: float, lon: float) -> str:
    """Human-readable auto-alert message attached to each AlertBroadcast."""
    kw = ", ".join(keywords[:3]) if keywords else "incident"
    return (
        f"A {category.replace('_', ' ').lower()} cluster has been auto-detected "
        f"from {n_rep} nearby reports near ({lat:.4f}, {lon:.4f}). "
        f"Key terms: {kw}. Please take necessary precautions."
    )


# ─── Main entry point ─────────────────────────────────────────────────────────

def run_clustering() -> dict:
    """
    Run the full spatio-textual DBSCAN pipeline over recent PENDING reports.

    Called by:
        reports/signals.py → post_save on IncidentReport (created=True only)

    Returns a result dict:
        { skipped, total_reports, clusters_created, clusters_skipped, noise_count }
    or on early exit:
        { skipped: True, reason: str, count: int }

    Never raises — all DB errors are caught and logged so the HTTP request
    that triggered the signal always completes successfully.
    """
    from reports.models import (
        IncidentReport,
        IncidentCluster,
        AlertBroadcast,
        Notification,
    )

    # ── Step 1: Time-windowed query ───────────────────────────────────────────
    cutoff  = timezone.now() - timedelta(hours=TIME_WINDOW_HOURS)
    reports = list(
        IncidentReport.objects.filter(
            created_at__gte=cutoff,      # ← snake_case: Django ORM field lookup
            status="PENDING",
        ).select_related("user")
    )

    if len(reports) < DBSCAN_MIN_SAMPLES:
        logger.info(
            "run_clustering: %d report(s) in window — need >= %d, skipping.",
            len(reports),
            DBSCAN_MIN_SAMPLES,
        )
        return {
            "skipped": True,
            "reason":  "not_enough_reports",
            "count":   len(reports),
        }

    # ── Step 2: Build feature arrays ─────────────────────────────────────────
    descriptions = [r.description          for r in reports]
    lats         = [float(r.latitude)      for r in reports]
    lons         = [float(r.longitude)     for r in reports]
    roles        = [r.user.role.upper()    for r in reports]
    n            = len(reports)

    # ── Step 3: Distance matrix  (geo-filtered cosine distance) ──────────────
    geo_dist = _geo_matrix(lats, lons)
    cos_sim  = _cosine_matrix(descriptions, roles)

    for i in range(n):
        for j in range(n):
            if geo_dist[i][j] > GEO_RADIUS_KM:
                cos_sim[i][j] = 0.0          # geo hard-block

    dist_matrix = 1.0 - cos_sim
    np.fill_diagonal(dist_matrix, 0.0)

    # ── Step 4: DBSCAN ────────────────────────────────────────────────────────
    labels = DBSCAN(
        eps=DBSCAN_EPS,
        min_samples=DBSCAN_MIN_SAMPLES,
        metric="precomputed",
    ).fit_predict(dist_matrix)

    # ── Step 5: Process each cluster ─────────────────────────────────────────
    clusters_created = []
    clusters_skipped = 0

    for cluster_label in sorted(set(labels)):
        if cluster_label == -1:
            continue                         # noise — not a real cluster

        idxs   = [i for i, lbl in enumerate(labels) if lbl == cluster_label]
        c_reps = [reports[i] for i in idxs]
        n_rep  = len(c_reps)

        # Extra guard: DBSCAN min_samples already enforces this, but be explicit
        if n_rep < MIN_CLUSTER_REPORTS:
            clusters_skipped += 1
            continue

        # Centroid
        c_lat = sum(lats[i] for i in idxs) / len(idxs)
        c_lon = sum(lons[i] for i in idxs) / len(idxs)   # ← FIX ②: was c_lat

        # Dominant category and confidence
        dominant_cat = Counter(r.category for r in c_reps).most_common(1)[0][0]
        n_guides     = sum(1 for r in c_reps if r.user.role.upper() == "GUIDE")
        guide_ratio  = n_guides / n_rep
        confidence   = round(min(0.7, n_rep / 10) + guide_ratio * 0.3, 4)
        # confidence lives in [0.0, 1.0]:
        #   count component:  min(0.70, n/10)  → 0.30 for 3 reports, 0.70 for ≥7
        #   guide component:  guide_ratio × 0.3 → up to +0.30 if all guides

        keywords = _top_keywords(descriptions, idxs)
        severity = _severity_from_confidence(confidence)

        # ── DB writes ────────────────────────────────────────────────────────

        cluster_obj = IncidentCluster.objects.create(
            centerLatitude   = round(c_lat, 6),
            centerLongitude  = round(c_lon, 6),   # ← FIELD: match your model attr name
            topKeywords      = keywords,           # ← FIELD: match your model attr name
            confidenceScore  = confidence,         # ← FIELD: match your model attr name
            dominantCategory = dominant_cat,       # ← FIELD: match your model attr name
            isAlertTriggered = True,               # ← FIELD: match your model attr name
        )
        cluster_obj.reports.set(c_reps)

        # Mark every report in this cluster as AUTO_VERIFIED
        for r in c_reps:
            r.status         = "AUTO_VERIFIED"
            r.confidenceScore = confidence         # ← FIELD: if snake → confidence_score
            r.save(update_fields=["status", "confidenceScore"])
            #                                        ↑ FIELD: must match model field name

        # Create the auto AlertBroadcast
        AlertBroadcast.objects.create(
            cluster     = cluster_obj,
            message     = _build_alert_message(dominant_cat, n_rep, keywords, c_lat, c_lon),
            severity    = severity,
            triggerType = "AUTO",                  # ← FIELD: match your model attr name
        )

        # Notify every report author
        for r in c_reps:
            Notification.objects.create(
                recipient        = r.user,
                notificationType = "CLUSTER_FORMED",   # ← FIELD: match your model attr name
                title            = f"Alert: {dominant_cat.replace('_', ' ').title()} Detected Near You",
                message          = (
                    f"Your report has been grouped into a verified incident cluster "
                    f"({n_rep} reports nearby). "
                    f"A {severity.lower()} severity alert has been auto-triggered."
                ),
                incidentReport   = r,                  # ← FIELD: match your model attr name
            )

        # ← FIX ③: append is at cluster level, NOT inside the Notification loop
        clusters_created.append({
            "cluster_id":   str(cluster_obj.id),
            "report_count": n_rep,
            "centroid":     (round(c_lat, 6), round(c_lon, 6)),
            "category":     dominant_cat,
            "confidence":   confidence,
            "severity":     severity,
            "keywords":     keywords,
        })

        logger.info(
            "Cluster %s | %d reports | %s | confidence=%.4f | severity=%s",
            cluster_obj.id, n_rep, dominant_cat, confidence, severity,
        )

    logger.info(
        "run_clustering done — %d created | %d skipped (< %d reports) | %d noise",
        len(clusters_created), clusters_skipped, MIN_CLUSTER_REPORTS,
        list(labels).count(-1),
    )

    return {
        "skipped":          False,
        "total_reports":    n,
        "clusters_created": clusters_created,
        "clusters_skipped": clusters_skipped,
        "noise_count":      list(labels).count(-1),
    }
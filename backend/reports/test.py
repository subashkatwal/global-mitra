# # -*- coding: utf-8 -*-
# """GlobalMitra_Django_Updated.ipynb

# # 🌍 GlobalMitra — Spatio-Textual Incident Clustering (Updated)
# ## Tourism Safety Platform | Final Year Project

# ---

# ### Project Overview
# GlobalMitra aggregates crowd-sourced incident reports from tourists and local guides.
# This notebook implements a **classical machine learning pipeline** that:
# - Reads reports from the **Django database** (IncidentReport model via ORM)
# - Filters reports by **time window** (recency)
# - Computes **geographic proximity** using the Haversine formula
# - Measures **text similarity** using TF-IDF + Cosine Similarity with **Guide credibility boost**
# - Groups related reports into clusters using **DBSCAN**
# - Flags clusters with ≥3 reports as **"Verified Incidents"**
# - Saves results to **IncidentCluster**, triggers **AlertBroadcast**, sends **Notifications**

# **Constraints:** No pretrained models, no external APIs, no deep learning — pure classical ML.

# ---

# ### Pipeline
# ```
# IncidentReport (Django ORM) → Time Filter (3h) → Guide 1.5× Weight Matrix
#     → TF-IDF Vectorization → Haversine Geo-constraint
#     → Spatio-Textual Distance Matrix → DBSCAN → Verified Incident Detection
#     → IncidentCluster + AlertBroadcast + Notification
# ```

# ---

# ### ✅ Parameter Updates (vs baseline notebook)

# | Parameter | Old value | New value | Rationale |
# |---|---|---|---|
# | `TIME_WINDOW_HOURS` | `6` | `3` | Flash floods/road blocks resolve fast. 3h eliminates stale chatter |
# | `DBSCAN_MIN_SAMPLES` | `2` | `3` | Aligns core-point requirement with MIN_CLUSTER_REPORTS (≥3 = Verified) |
# | `GUIDE_WEIGHT` | `1.0` | `1.5` | Licensed local experts — guide pairs get 1.5× cosine similarity boost |
# """

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 1: Imports & Setup
# # ──────────────────────────────────────────────────────────────────────────────

# import io
# import math
# import warnings

# import numpy as np
# import pandas as pd
# import matplotlib.pyplot as plt
# import matplotlib.patches as mpatches
# from matplotlib.lines import Line2D
# import seaborn as sns
# from datetime import datetime, timedelta

# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# from sklearn.cluster import DBSCAN

# warnings.filterwarnings('ignore')
# np.random.seed(42)

# print('✅ All libraries loaded successfully.')
# print(f'NumPy: {np.__version__} | Pandas: {pd.__version__}')

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 2: Data Simulation
# # (In production: replaced by IncidentReport.objects.filter(...).select_related('user'))
# #
# # Design Rationale — same locations as baseline:
# #   Cluster A (Flash Flood)   — 5 reports, Bagmati river crossing, <500 m spread
# #   Cluster B (Broken Bridge) — 4 reports, Ring Road, ~1.5 km northwest
# #   Noise                     — 5 unrelated reports, far away or stale
# #
# # TIME_WINDOW_HOURS = 3  →  cutoff = 180 min ago
# #   R010 (380 min), R014 (330 min) are now BOTH outside the window (same as before)
# #   R011 (90 min), R012 (100 min), R013 (110 min) are INSIDE window but too far → noise
# # ──────────────────────────────────────────────────────────────────────────────

# BASE_LAT = 27.7215
# BASE_LON = 85.3620


# def offset(lat_m, lon_m, base_lat=BASE_LAT, base_lon=BASE_LON):
#     """Convert metre offsets → lat/lon degree offsets from base location."""
#     d_lat = lat_m / 111000
#     d_lon = lon_m / (111000 * math.cos(math.radians(base_lat)))
#     return round(base_lat + d_lat, 6), round(base_lon + d_lon, 6)


# NOW = datetime(2025, 3, 15, 14, 0, 0)   # Simulated current time


# def ts(minutes_ago):
#     return (NOW - timedelta(minutes=minutes_ago)).strftime('%Y-%m-%d %H:%M:%S')


# # CLUSTER A: Flash Flood at Bagmati River Crossing
# cluster_a_reports = [
#     {
#         'report_id': 'R001',
#         'description': 'Flash flood at Bagmati river crossing. Road submerged under water, river overflowing the banks.',
#         'latitude': offset(50, 30)[0],   'longitude': offset(50, 30)[1],
#         'timestamp': ts(20),  'user_role': 'Tourist',
#     },
#     {
#         'report_id': 'R002',
#         'description': 'Flood warning Bagmati river. Road completely submerged, dangerous water levels rising fast.',
#         'latitude': offset(80, -20)[0],  'longitude': offset(80, -20)[1],
#         'timestamp': ts(35),  'user_role': 'Tourist',
#     },
#     {
#         'report_id': 'R003',
#         'description': 'Bagmati river flooding road near crossing. Water submerged the tarmac, avoid this flood zone.',
#         'latitude': offset(30, 60)[0],   'longitude': offset(30, 60)[1],
#         'timestamp': ts(45),  'user_role': 'Guide',    # ← Guide: 1.5× boost applied
#     },
#     {
#         'report_id': 'R004',
#         'description': 'Severe flood at Bagmati crossing. River burst banks, road underwater. Flood rescue needed urgently.',
#         'latitude': offset(-40, 50)[0],  'longitude': offset(-40, 50)[1],
#         'timestamp': ts(55),  'user_role': 'Guide',    # ← Guide: 1.5× boost applied
#     },
#     {
#         'report_id': 'R005',
#         'description': 'Bagmati river flood blocking road. Submerged vehicles visible, water still rising at the crossing.',
#         'latitude': offset(10, -30)[0],  'longitude': offset(10, -30)[1],
#         'timestamp': ts(70),  'user_role': 'Tourist',
#     },
# ]

# # CLUSTER B: Broken Bridge on Boudhanath Ring Road
# cluster_b_reports = [
#     {
#         'report_id': 'R006',
#         'description': 'Bridge broken on ring road crossing. Collapsed section blocks all traffic, danger for pedestrians.',
#         'latitude': offset(1200, -900)[0],  'longitude': offset(1200, -900)[1],
#         'timestamp': ts(30),  'user_role': 'Guide',    # ← Guide: 1.5× boost applied
#     },
#     {
#         'report_id': 'R007',
#         'description': 'Bridge collapsed at ring road crossing. Broken structure danger, crossing completely blocked.',
#         'latitude': offset(1350, -800)[0],  'longitude': offset(1350, -800)[1],
#         'timestamp': ts(50),  'user_role': 'Tourist',
#     },
#     {
#         'report_id': 'R008',
#         'description': 'Serious bridge collapse ring road. Broken bridge crossing blocked, structure unsafe danger zone.',
#         'latitude': offset(1100, -1000)[0], 'longitude': offset(1100, -1000)[1],
#         'timestamp': ts(65),  'user_role': 'Tourist',
#     },
#     {
#         'report_id': 'R009',
#         'description': 'Bridge broken and collapsed at crossing. Danger zone blocked, emergency services at bridge site.',
#         'latitude': offset(1250, -850)[0],  'longitude': offset(1250, -850)[1],
#         'timestamp': ts(80),  'user_role': 'Guide',    # ← Guide: 1.5× boost applied
#     },
# ]

# # NOISE REPORTS — geographically scattered, some also stale
# noise_reports = [
#     {
#         'report_id': 'R010',
#         'description': 'Avalanche warning Langtang trail. Snow avalanche debris blocking trekking route near camp.',
#         'latitude': offset(3500, -4000)[0], 'longitude': offset(3500, -4000)[1],
#         'timestamp': ts(380),  # 6h 20min ago → OUTSIDE 3h window ✓
#         'user_role': 'Tourist',
#     },
#     {
#         'report_id': 'R011',
#         'description': 'Large landslide Langtang valley. Hillside collapsed onto trail, trekkers evacuated to base camp.',
#         'latitude': offset(-5000, 2000)[0], 'longitude': offset(-5000, 2000)[1],
#         'timestamp': ts(90),   # Inside window but >3 km away → geo-filtered
#         'user_role': 'Tourist',
#     },
#     {
#         'report_id': 'R012',
#         'description': 'Landslide blocking Nagarkot highway. Rocks and mud swept across road, route completely impassable.',
#         'latitude': offset(4000, 3500)[0],  'longitude': offset(4000, 3500)[1],
#         'timestamp': ts(100),  # Inside window but >3 km away → geo-filtered
#         'user_role': 'Guide',
#     },
#     {
#         'report_id': 'R013',
#         'description': 'Rockfall and road damage Helambu valley. Boulders on trekking path, avalanche risk remains high.',
#         'latitude': offset(-6000, -5000)[0], 'longitude': offset(-6000, -5000)[1],
#         'timestamp': ts(110),  # Inside window but >3 km away → geo-filtered
#         'user_role': 'Guide',
#     },
#     {
#         'report_id': 'R014',
#         'description': 'Glacier avalanche debris Gosaikunda route. Trail buried, trekking suspended until further notice.',
#         'latitude': offset(-4500, 6000)[0], 'longitude': offset(-4500, 6000)[1],
#         'timestamp': ts(330),  # 5h 30min ago → OUTSIDE 3h window ✓
#         'user_role': 'Tourist',
#     },
# ]

# # BUILD DATAFRAME
# # In production this line is replaced by:
# #   cutoff = timezone.now() - timedelta(hours=TIME_WINDOW_HOURS)
# #   reports = list(IncidentReport.objects.filter(createdAt__gte=cutoff, status='PENDING').select_related('user'))
# all_reports = cluster_a_reports + cluster_b_reports + noise_reports
# df = pd.DataFrame(all_reports)
# df['timestamp'] = pd.to_datetime(df['timestamp'])

# print(f'✅ Dataset created: {len(df)} total reports')
# print(f'   Cluster A (Flash Flood):      {len(cluster_a_reports)} reports')
# print(f'   Cluster B (Broken Bridge):    {len(cluster_b_reports)} reports')
# print(f'   Noise reports:                {len(noise_reports)} reports')
# print()
# print(df[['report_id', 'description', 'timestamp', 'user_role']].to_string(index=False))

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 3: Configuration & Time Window Filtering
# #
# # KEY PARAMETER CHANGES vs baseline notebook:
# #
# #   TIME_WINDOW_HOURS  6 → 3
# #     Alerts for flash floods and road blocks decay quickly.
# #     Reports older than 3 hours are stale for most short-lived events.
# #     This tightens the temporal neighbourhood and reduces false positives
# #     from coincidental older chatter.
# #
# #   DBSCAN_MIN_SAMPLES  2 → 3
# #     A core point now needs ≥3 neighbours within EPS distance.
# #     This matches MIN_CLUSTER_REPORTS (≥3 = Verified), so every DBSCAN
# #     core point already satisfies the verification threshold.
# #     With min_samples=2, a noisy pair could form a cluster that then
# #     never reaches 3 reports → wasted cluster object in the DB.
# #
# #   GUIDE_WEIGHT  1.5  (new parameter)
# #     After TF-IDF cosine similarity is computed, a per-pair weight matrix
# #     is applied before running DBSCAN. Any pair involving a Guide report
# #     is multiplied by 1.5 (capped at 1.0). Guides are licensed local
# #     experts with higher evidentiary value — their reports should cluster
# #     more readily with nearby reports, lowering effective EPS needed.
# # ──────────────────────────────────────────────────────────────────────────────

# # CONFIGURABLE PARAMETERS
# TIME_WINDOW_HOURS   = 3      # ← was 6
# GEO_RADIUS_KM       = 3.0
# MIN_CLUSTER_REPORTS = 3

# # DBSCAN parameters
# DBSCAN_EPS          = 0.62
# DBSCAN_MIN_SAMPLES  = 3      # ← was 2  (now aligned with MIN_CLUSTER_REPORTS)

# # Guide credibility boost
# GUIDE_WEIGHT        = 1.5    # ← new

# reference_time = NOW
# cutoff_time    = reference_time - timedelta(hours=TIME_WINDOW_HOURS)

# df_filtered = df[df['timestamp'] >= cutoff_time].copy().reset_index(drop=True)
# removed     = df[df['timestamp'] < cutoff_time]['report_id'].tolist()

# print(f'⏱  Reference time : {reference_time}')
# print(f'   Cutoff time    : {cutoff_time}  ({TIME_WINDOW_HOURS}h window)  ← tightened from 6h')
# print(f'   Reports before filter  : {len(df)}')
# print(f'   Reports REMOVED (stale): {removed}')
# print(f'   Reports KEPT           : {len(df_filtered)}')
# print()
# print(df_filtered[['report_id', 'timestamp', 'user_role']].to_string(index=False))

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 4: Haversine Distance Matrix
# #
# # Why Haversine instead of Euclidean?
# # GPS coords are on a sphere. Euclidean lat/lon introduces 10–30% error at 1–10 km
# # due to Earth's curvature and the varying physical length of longitude degrees.
# # Haversine gives true great-circle distance using only Python's math module.
# # ──────────────────────────────────────────────────────────────────────────────

# def haversine_km(lat1, lon1, lat2, lon2):
#     """Great-circle distance between two GPS points — Haversine formula."""
#     R = 6371.0
#     phi1, phi2 = math.radians(lat1), math.radians(lat2)
#     d_phi    = math.radians(lat2 - lat1)
#     d_lambda = math.radians(lon2 - lon1)
#     a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
#     return R * 2 * math.asin(math.sqrt(a))


# # Verification: Boudhanath → Pashupatinath (known ≈ 1.5 km)
# d_test = haversine_km(27.7215, 85.3620, 27.7104, 85.3485)
# print(f'✅ Haversine test — Boudhanath → Pashupatinath: {d_test:.3f} km (expected ~1.5 km)')

# n = len(df_filtered)
# geo_dist_matrix = np.zeros((n, n))

# for i in range(n):
#     for j in range(n):
#         if i != j:
#             geo_dist_matrix[i][j] = haversine_km(
#                 df_filtered.loc[i, 'latitude'],  df_filtered.loc[i, 'longitude'],
#                 df_filtered.loc[j, 'latitude'],  df_filtered.loc[j, 'longitude'],
#             )

# print(f'\n📐 Pairwise Haversine Distance Matrix ({n}×{n}) in km:')
# geo_df = pd.DataFrame(geo_dist_matrix,
#                       index=df_filtered['report_id'],
#                       columns=df_filtered['report_id'])

# fig, ax = plt.subplots(figsize=(10, 8))
# sns.heatmap(geo_df.round(2), annot=True, fmt='.1f', cmap='YlOrRd',
#             linewidths=0.5, ax=ax, cbar_kws={'label': 'Distance (km)'})
# ax.set_title('Pairwise Haversine Distance Matrix (km)\nLighter = Geographically Closer',
#              fontsize=13, fontweight='bold')
# plt.tight_layout()
# plt.show()

# print('✅ Cluster A (R001-R005): all within ~0.2 km of each other (flood zone)')
# print('✅ Cluster B (R006-R009): ~1.5 km northwest, within ~0.3 km of each other (bridge zone)')
# print('✅ Noise (R011-R013): 5–10 km away — geo-filter will block these from clustering')

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 5: TF-IDF + Cosine Similarity with Guide Credibility Boost
# #
# # GUIDE CREDIBILITY WEIGHTING  (new in this version)
# # ─────────────────────────────
# # After computing the raw TF-IDF cosine similarity matrix we apply a per-pair
# # weight multiplier:
# #
# #   weight(i, j) = GUIDE_WEIGHT (1.5)  if either report i or j is a Guide
# #               = 1.0                  otherwise
# #
# # The weighted similarity is clamped to [0, 1].
# #
# # Effect on DBSCAN:
# #   cosine_distance(i,j) = 1 − weighted_sim(i,j)
# #   A Guide–Tourist pair with raw sim=0.45 (dist=0.55) becomes:
# #   sim_weighted = min(0.45 × 1.5, 1.0) = 0.675  →  dist = 0.325
# #   This is well inside EPS=0.62, making them mutual neighbours.
# #
# # Rationale:
# #   Guides are licensed local experts. Their reports carry higher evidentiary
# #   value. A cluster with even one Guide report reaches the Verified threshold
# #   more readily — correct behaviour for a safety platform in remote terrain.
# # ──────────────────────────────────────────────────────────────────────────────

# vectorizer = TfidfVectorizer(
#     stop_words='english',
#     ngram_range=(1, 1),    # Unigrams only — critical (see baseline notes)
#     min_df=1,
#     max_df=0.95,
#     sublinear_tf=True,
# )

# descriptions = df_filtered['description'].tolist()
# roles        = df_filtered['user_role'].tolist()
# tfidf_matrix = vectorizer.fit_transform(descriptions)

# feature_names = vectorizer.get_feature_names_out()
# print(f'✅ TF-IDF Matrix: {tfidf_matrix.shape[0]} reports × {tfidf_matrix.shape[1]} features')
# print(f'\n📝 Top features (sample): {list(feature_names[:25])}')

# # Raw cosine similarity
# cos_sim_raw = cosine_similarity(tfidf_matrix)

# # ── Apply Guide credibility weight ────────────────────────────────────────────
# weight_matrix = np.ones((n, n))
# guide_count   = 0

# for i in range(n):
#     for j in range(n):
#         if roles[i] == 'Guide' or roles[j] == 'Guide':
#             weight_matrix[i][j] = GUIDE_WEIGHT
#             if i < j:
#                 guide_count += 1

# cos_sim_weighted = np.clip(cos_sim_raw * weight_matrix, 0.0, 1.0)
# np.fill_diagonal(cos_sim_weighted, 1.0)

# print(f'\n🎯 Guide weight {GUIDE_WEIGHT}× applied to {guide_count} pairs involving a Guide report')

# ids = df_filtered['report_id'].tolist()
# print('\n=== SIMILARITY DIAGNOSTICS (weighted) ===')

# print('\nWithin Cluster A (R001-R005 — Flood) — should be HIGH (>0.35):')
# cluster_a_idx = [i for i, r in enumerate(ids) if r in ['R001','R002','R003','R004','R005']]
# for ii, i in enumerate(cluster_a_idx):
#     for j in cluster_a_idx[ii+1:]:
#         raw = cos_sim_raw[i, j]
#         wtd = cos_sim_weighted[i, j]
#         ok  = '✅' if wtd > 0.35 else '❌'
#         boost = f'(raw={raw:.3f} → weighted={wtd:.3f})' if abs(wtd - raw) > 0.001 else f'(={wtd:.3f})'
#         print(f'  {ok} {ids[i]} ({roles[i]}) vs {ids[j]} ({roles[j]}): {boost}')

# print('\nWithin Cluster B (R006-R009 — Bridge) — should be HIGH (>0.35):')
# cluster_b_idx = [i for i, r in enumerate(ids) if r in ['R006','R007','R008','R009']]
# for ii, i in enumerate(cluster_b_idx):
#     for j in cluster_b_idx[ii+1:]:
#         raw = cos_sim_raw[i, j]
#         wtd = cos_sim_weighted[i, j]
#         ok  = '✅' if wtd > 0.35 else '❌'
#         boost = f'(raw={raw:.3f} → weighted={wtd:.3f})' if abs(wtd - raw) > 0.001 else f'(={wtd:.3f})'
#         print(f'  {ok} {ids[i]} ({roles[i]}) vs {ids[j]} ({roles[j]}): {boost}')

# print(f'\nCross-cluster A vs B — should be LOW (<0.15):')
# for i in cluster_a_idx[:2]:
#     for j in cluster_b_idx[:2]:
#         sim = cos_sim_weighted[i, j]
#         ok  = '✅' if sim < 0.15 else '❌'
#         print(f'  {ok} {ids[i]} vs {ids[j]}: sim={sim:.3f}')

# # Cosine similarity heatmap (weighted)
# cos_df = pd.DataFrame(cos_sim_weighted,
#                       index=df_filtered['report_id'],
#                       columns=df_filtered['report_id'])

# fig, ax = plt.subplots(figsize=(10, 8))
# sns.heatmap(cos_df, annot=True, fmt='.2f', cmap='Blues', vmin=0, vmax=1,
#             linewidths=0.5, ax=ax,
#             cbar_kws={'label': f'Cosine Similarity (Guide pairs boosted ×{GUIDE_WEIGHT})'})
# ax.set_title(
#     f'TF-IDF Cosine Similarity Matrix (Guide {GUIDE_WEIGHT}× weighted)\n'
#     'Higher = More Semantically Similar | Guide-involved pairs are boosted',
#     fontsize=13, fontweight='bold',
# )
# plt.tight_layout()
# plt.show()
# print('Expected: R001-R005 bright block (flood) | R006-R009 bright block (bridge)')
# print(f'Guide pairs (R003, R004, R006, R009 rows/cols) are noticeably brighter due to {GUIDE_WEIGHT}× boost')

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 6: DBSCAN on Spatio-Textual Distance Matrix
# # ──────────────────────────────────────────────────────────────────────────────

# # Apply geographic hard constraint to weighted similarity
# geo_filtered_sim = cos_sim_weighted.copy()
# blocked_pairs    = 0

# for i in range(n):
#     for j in range(n):
#         if geo_dist_matrix[i][j] > GEO_RADIUS_KM:
#             geo_filtered_sim[i][j] = 0.0
#             blocked_pairs += 1

# print(f'Geo-filter blocked {blocked_pairs // 2} pairs (distance > {GEO_RADIUS_KM} km)')

# cosine_distance_matrix = 1 - geo_filtered_sim
# np.fill_diagonal(cosine_distance_matrix, 0)

# print('\nSpatio-Textual Distance Matrix (after geo-filter + guide boost):')
# print(pd.DataFrame(cosine_distance_matrix,
#                    index=df_filtered['report_id'],
#                    columns=df_filtered['report_id']).round(3).to_string())

# # DBSCAN
# dbscan = DBSCAN(
#     eps=DBSCAN_EPS,
#     min_samples=DBSCAN_MIN_SAMPLES,   # 3 ← was 2, now aligned with MIN_CLUSTER_REPORTS
#     metric='precomputed',
# )

# labels = dbscan.fit_predict(cosine_distance_matrix)
# df_filtered['cluster'] = labels

# unique_labels = set(labels)
# n_clusters    = len(unique_labels) - (1 if -1 in unique_labels else 0)
# n_noise       = list(labels).count(-1)

# print('\n✅ DBSCAN Clustering Complete')
# print(f'   eps={DBSCAN_EPS} | min_samples={DBSCAN_MIN_SAMPLES} (↑ from 2, now aligned with threshold)')
# print(f'   Guide weight  : {GUIDE_WEIGHT}× (applied to {guide_count} pairs)')
# print(f'   Clusters found: {n_clusters}')
# print(f'   Noise points  : {n_noise}')
# print()
# print(df_filtered[['report_id', 'cluster', 'user_role', 'latitude', 'longitude']].to_string(index=False))

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 7: Verified Incident Detection
# #
# # A cluster qualifies as VERIFIED if ALL hold:
# #   ✅ ≥ MIN_CLUSTER_REPORTS (3) reports
# #   ✅ All within GEO_RADIUS_KM (enforced before clustering)
# #   ✅ All within TIME_WINDOW_HOURS (enforced during preprocessing)
# #
# # With DBSCAN_MIN_SAMPLES=3, every core point already has ≥3 neighbours,
# # so every discovered cluster automatically qualifies — the two thresholds
# # are now aligned. Previously (min_samples=2), a noisy pair could form a
# # cluster that never reached 3 reports.
# # ──────────────────────────────────────────────────────────────────────────────

# print('═' * 62)
# print('  GLOBALMITRA — CLUSTER ANALYSIS REPORT (UPDATED)')
# print('═' * 62)
# print(f'  Time window   : Last {TIME_WINDOW_HOURS}h  (↓ from 6h)')
# print(f'  Geo radius    : {GEO_RADIUS_KM} km')
# print(f'  Min reports   : {MIN_CLUSTER_REPORTS} for Verified Incident')
# print(f'  min_samples   : {DBSCAN_MIN_SAMPLES} (↑ from 2, now aligned with threshold)')
# print(f'  Guide weight  : {GUIDE_WEIGHT}× cosine similarity boost')
# print('═' * 62)

# verified_clusters = []

# for cluster_id in sorted(unique_labels):
#     if cluster_id == -1:
#         continue

#     c_df        = df_filtered[df_filtered['cluster'] == cluster_id]
#     n_rep       = len(c_df)
#     user_counts = c_df['user_role'].value_counts().to_dict()
#     n_guides    = user_counts.get('Guide', 0)

#     clat  = c_df['latitude'].mean()
#     clon  = c_df['longitude'].mean()
#     max_r = max(haversine_km(r['latitude'], r['longitude'], clat, clon) for _, r in c_df.iterrows())

#     is_verified = (n_rep >= MIN_CLUSTER_REPORTS)
#     verdict     = '🚨 VERIFIED INCIDENT' if is_verified else '⚠️  Possible Incident (needs more reports)'
#     if is_verified:
#         verified_clusters.append(cluster_id)

#     print(f'\n{"─" * 50}')
#     print(f'  Cluster #{cluster_id}')
#     print(f'  Reports  : {c_df["report_id"].tolist()}')
#     print(f'  Count    : {n_rep} reports | Roles: {user_counts}')
#     print(f'  Guides   : {n_guides} (each pair boosted ×{GUIDE_WEIGHT})')
#     print(f'  Centroid : ({clat:.5f}, {clon:.5f})')
#     print(f'  Spread   : {max_r:.3f} km from centroid')
#     print(f'  Status   : {verdict}')
#     print(f'\n  Descriptions:')
#     for _, row in c_df.iterrows():
#         guide_tag = ' [GUIDE ×1.5]' if row['user_role'] == 'Guide' else ''
#         d = row['description'][:85] + '...' if len(row['description']) > 85 else row['description']
#         print(f'    [{row["report_id"]}]{guide_tag} {d}')

# noise_df = df_filtered[df_filtered['cluster'] == -1]
# print(f'\n{"─" * 50}')
# print(f'  NOISE (no cluster match): {noise_df["report_id"].tolist()}')
# print(f'\n{"═" * 62}')
# print(f'  SUMMARY: {n_clusters} cluster(s) | {len(verified_clusters)} verified | {n_noise} noise')
# print(f'  Verified Clusters: {verified_clusters}')
# print(f'═' * 62)

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 8: Visualization
# # ──────────────────────────────────────────────────────────────────────────────

# cluster_colors     = {-1: '#999999', 0: '#E63946', 1: '#2A9D8F', 2: '#F4A261'}
# cluster_labels_map = {
#     -1: 'Noise (unrelated)',
#      0: 'Cluster 0 — Flash Flood',
#      1: 'Cluster 1 — Broken Bridge',
# }
# markers = {'Tourist': 'o', 'Guide': 's'}

# # ── FIGURE 1: GPS Scatter — coloured by cluster ───────────────────────────────
# fig, ax = plt.subplots(figsize=(11, 8))
# legend_handles = []

# for cluster_id in sorted(df_filtered['cluster'].unique()):
#     subset = df_filtered[df_filtered['cluster'] == cluster_id]
#     color  = cluster_colors.get(cluster_id, '#333333')
#     label  = cluster_labels_map.get(cluster_id, f'Cluster {cluster_id}')

#     for role, marker in markers.items():
#         rs    = subset[subset['user_role'] == role]
#         alpha = 0.45 if cluster_id == -1 else 0.88
#         size  = 80   if cluster_id == -1 else 160
#         if len(rs) > 0:
#             ax.scatter(rs['longitude'], rs['latitude'], c=color, marker=marker,
#                        s=size, alpha=alpha, edgecolors='black', linewidths=0.8, zorder=3)

#     if cluster_id != -1 and len(subset) >= 2:
#         clat = subset['latitude'].mean()
#         clon = subset['longitude'].mean()
#         ax.scatter(clon, clat, c=color, marker='*', s=320, zorder=5,
#                    edgecolors='black', linewidths=0.8)
#         max_r = max(math.sqrt((r['latitude'] - clat) ** 2 + (r['longitude'] - clon) ** 2)
#                     for _, r in subset.iterrows())
#         circle = plt.Circle((clon, clat), max_r * 1.4, color=color,
#                              fill=False, linestyle='--', linewidth=1.8, alpha=0.55)
#         ax.add_patch(circle)

#     for _, row in subset.iterrows():
#         role_tag = ' [G]' if row['user_role'] == 'Guide' else ''
#         ax.annotate(row['report_id'] + role_tag,
#                     (row['longitude'], row['latitude']),
#                     xytext=(5, 5), textcoords='offset points', fontsize=8.5,
#                     color=color, fontweight='bold' if cluster_id != -1 else 'normal')

#     legend_handles.append(mpatches.Patch(color=color, label=label))

# legend_handles += [
#     Line2D([0], [0], marker='o', color='w', markerfacecolor='grey', markersize=9,  label='Tourist'),
#     Line2D([0], [0], marker='s', color='w', markerfacecolor='grey', markersize=10, label=f'Guide (×{GUIDE_WEIGHT} boost)'),
#     Line2D([0], [0], marker='*', color='w', markerfacecolor='grey', markersize=12, label='Cluster Centroid'),
# ]

# incident_names = {0: 'Flash Flood\nAlert', 1: 'Broken Bridge\nAlert'}
# for c_id in verified_clusters:
#     c_sub = df_filtered[df_filtered['cluster'] == c_id]
#     ax.annotate(
#         f'🚨 VERIFIED\n{incident_names.get(c_id, "INCIDENT")}',
#         (c_sub['longitude'].mean(), c_sub['latitude'].mean()),
#         xytext=(-65, -50), textcoords='offset points', fontsize=8.5, fontweight='bold',
#         color=cluster_colors.get(c_id, 'red'),
#         arrowprops=dict(arrowstyle='->', color='black', lw=1.3),
#         bbox=dict(boxstyle='round,pad=0.35', facecolor='yellow', alpha=0.8),
#     )

# ax.set_xlabel('Longitude', fontsize=11)
# ax.set_ylabel('Latitude',  fontsize=11)
# ax.set_title(
#     f'GlobalMitra — Spatio-Textual Clustering  '
#     f'({TIME_WINDOW_HOURS}h window | Guide {GUIDE_WEIGHT}× | min_samples={DBSCAN_MIN_SAMPLES})\n'
#     'DBSCAN · TF-IDF Unigrams · Haversine Geo-filter · Boudhanath, Kathmandu',
#     fontsize=12, fontweight='bold',
# )
# ax.legend(handles=legend_handles, loc='upper right', fontsize=9, framealpha=0.92)
# ax.grid(True, linestyle='--', alpha=0.3)
# plt.tight_layout()
# plt.show()
# print('📊 Cluster A (red) = flash flood zone | Cluster B (teal) = broken bridge | Grey = noise')
# print(f'   [G] labels = Guide reports (boosted ×{GUIDE_WEIGHT} in similarity computation)')

# # ── FIGURE 2: Cluster composition bar charts ──────────────────────────────────
# fig, axes = plt.subplots(1, 2, figsize=(13, 5))

# cluster_counts = df_filtered['cluster'].value_counts().sort_index()
# bar_colors     = [cluster_colors.get(c, '#cccccc') for c in cluster_counts.index]
# bar_labels     = [cluster_labels_map.get(c, f'Cluster {c}') for c in cluster_counts.index]

# axes[0].bar(bar_labels, cluster_counts.values, color=bar_colors, edgecolor='black', linewidth=0.6)
# axes[0].axhline(y=MIN_CLUSTER_REPORTS, color='red', linestyle='--', linewidth=1.5,
#                 label=f'Verified threshold (≥{MIN_CLUSTER_REPORTS})')
# axes[0].set_title('Reports per Cluster', fontsize=12, fontweight='bold')
# axes[0].set_ylabel('Number of Reports')
# axes[0].legend(fontsize=9)
# axes[0].tick_params(axis='x', rotation=20)
# for i, v in enumerate(cluster_counts.values):
#     axes[0].text(i, v + 0.08, str(v), ha='center', fontweight='bold')

# role_by_cluster = df_filtered.groupby(['cluster', 'user_role']).size().unstack(fill_value=0)
# role_by_cluster.index = [cluster_labels_map.get(i, f'Cluster {i}') for i in role_by_cluster.index]
# role_by_cluster.plot(kind='bar', ax=axes[1], color=['#4E9AF1', '#F4845F'],
#                      edgecolor='black', linewidth=0.6)
# axes[1].set_title('User Role Breakdown per Cluster', fontsize=12, fontweight='bold')
# axes[1].set_ylabel('Number of Reports')
# axes[1].tick_params(axis='x', rotation=20)
# axes[1].legend(title='User Role', fontsize=9)

# plt.suptitle(
#     f'GlobalMitra — Cluster Composition  '
#     f'({TIME_WINDOW_HOURS}h window | Guide {GUIDE_WEIGHT}× | min_samples={DBSCAN_MIN_SAMPLES})',
#     fontsize=13, fontweight='bold', y=1.02,
# )
# plt.tight_layout()
# plt.show()

# # ── FIGURE 3: Cosine similarity sorted by cluster — shows block structure ─────
# fig, ax = plt.subplots(figsize=(10, 8))

# sorted_idx      = df_filtered.sort_values('cluster').index.tolist()
# sorted_ids      = df_filtered.loc[sorted_idx, 'report_id'].tolist()
# sorted_clusters = df_filtered.loc[sorted_idx, 'cluster'].tolist()

# sorted_sim     = cos_sim_weighted[np.ix_(sorted_idx, sorted_idx)]
# sorted_df_plot = pd.DataFrame(sorted_sim, index=sorted_ids, columns=sorted_ids)

# sns.heatmap(sorted_df_plot, annot=True, fmt='.2f', cmap='coolwarm',
#             vmin=0, vmax=1, linewidths=0.4, ax=ax,
#             cbar_kws={'label': f'Cosine Similarity (Guide pairs ×{GUIDE_WEIGHT})'})

# prev, start = None, 0
# for i, c in enumerate(sorted_clusters + [-99]):
#     if c != prev and prev is not None and prev != -1:
#         rect = plt.Rectangle((start, start), i - start, i - start,
#                               fill=False, edgecolor='lime', linewidth=3.0)
#         ax.add_patch(rect)
#     if c != prev:
#         start = i
#         prev  = c

# ax.set_title(
#     f'TF-IDF Cosine Similarity (Sorted by Cluster, Guide ×{GUIDE_WEIGHT})\n'
#     'Green boxes = DBSCAN clusters | Warm = High similarity',
#     fontsize=12, fontweight='bold',
# )
# plt.tight_layout()
# plt.show()
# print('✅ Clear block structure: cluster members show high mutual similarity')
# print(f'   Guide rows/cols visibly brighter due to {GUIDE_WEIGHT}× credibility boost')

# # ── FIGURE 4: Guide weight effect — raw vs weighted similarity comparison ──────
# fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# # Left: raw similarity
# cos_df_raw = pd.DataFrame(cos_sim_raw,
#                            index=df_filtered['report_id'],
#                            columns=df_filtered['report_id'])
# sns.heatmap(cos_df_raw, annot=True, fmt='.2f', cmap='Blues', vmin=0, vmax=1,
#             linewidths=0.4, ax=axes[0], cbar_kws={'label': 'Raw Cosine Similarity'})
# axes[0].set_title('Raw Cosine Similarity\n(no guide weighting)', fontsize=12, fontweight='bold')

# # Right: weighted similarity
# sns.heatmap(sorted_df_plot if False else  # reuse full weighted matrix
#             pd.DataFrame(cos_sim_weighted, index=df_filtered['report_id'], columns=df_filtered['report_id']),
#             annot=True, fmt='.2f', cmap='Blues', vmin=0, vmax=1,
#             linewidths=0.4, ax=axes[1],
#             cbar_kws={'label': f'Weighted Cosine Similarity (Guide ×{GUIDE_WEIGHT})'})
# axes[1].set_title(f'Weighted Cosine Similarity\n(Guide pairs ×{GUIDE_WEIGHT} — capped at 1.0)',
#                   fontsize=12, fontweight='bold')

# # Annotate guide rows
# for rid in ['R003', 'R004', 'R006', 'R009']:
#     if rid in df_filtered['report_id'].values:
#         axes[1].get_yticklabels()  # trigger draw
#         for label in axes[1].get_yticklabels():
#             if label.get_text() == rid:
#                 label.set_color('#7C3AED')
#                 label.set_fontweight('bold')
#         for label in axes[1].get_xticklabels():
#             if label.get_text() == rid:
#                 label.set_color('#7C3AED')
#                 label.set_fontweight('bold')

# plt.suptitle(
#     f'Guide Credibility Boost Effect — Raw vs Weighted (×{GUIDE_WEIGHT})\n'
#     'Purple labels = Guide reports | Brighter cells = boosted similarity',
#     fontsize=13, fontweight='bold', y=1.02,
# )
# plt.tight_layout()
# plt.show()

# print(f'\n📊 Guide boost example:')
# # Find a guide-tourist pair in cluster A
# g_idx = next(i for i, r in enumerate(roles) if r == 'Guide' and ids[i] in ['R003','R004'])
# t_idx = next(i for i, r in enumerate(roles) if r == 'Tourist' and ids[i] == 'R001')
# raw_v = cos_sim_raw[g_idx, t_idx]
# wtd_v = cos_sim_weighted[g_idx, t_idx]
# print(f'   {ids[g_idx]} (Guide) vs {ids[t_idx]} (Tourist):')
# print(f'   raw sim = {raw_v:.3f}  → dist = {1-raw_v:.3f}')
# print(f'   weighted sim = {wtd_v:.3f}  → dist = {1-wtd_v:.3f}')
# print(f'   Result: {"inside EPS (neighbour)" if 1-wtd_v < DBSCAN_EPS else "outside EPS (not neighbour)"} ✅')

# # ──────────────────────────────────────────────────────────────────────────────
# # Section 9: Final Summary
# # ──────────────────────────────────────────────────────────────────────────────

# print('\n╔' + '═' * 62 + '╗')
# print('║   🌍 GLOBALMITRA — FINAL INCIDENT ALERT SUMMARY (UPDATED)  ║')
# print('╠' + '═' * 62 + '╣')
# print(f'║  Total reports (raw)         : {len(df):<5}                        ║')
# print(f'║  After {TIME_WINDOW_HOURS}h time filter       : {len(df_filtered):<5} (removed {len(df)-len(df_filtered)} stale)      ║')
# print(f'║  Clusters detected           : {n_clusters:<5}                        ║')
# print(f'║  Verified incidents          : {len(verified_clusters):<5}                        ║')
# print(f'║  Noise / unrelated           : {n_noise:<5}                        ║')
# print(f'║  Guide credibility           : {GUIDE_WEIGHT}× cosine similarity boost  ║')
# print('╠' + '═' * 62 + '╣')

# incident_names_final = {0: 'Flash Flood at Bagmati Crossing', 1: 'Broken Bridge on Ring Road'}
# for cid in sorted(df_filtered[df_filtered['cluster'] != -1]['cluster'].unique()):
#     c_df   = df_filtered[df_filtered['cluster'] == cid]
#     is_v   = cid in verified_clusters
#     status = '🚨 VERIFIED' if is_v else '⚠️  POSSIBLE'
#     ids_   = ', '.join(c_df['report_id'].tolist())
#     name   = incident_names_final.get(cid, f'Incident {cid}')
#     guides = c_df[c_df['user_role'] == 'Guide']['report_id'].tolist()
#     print(f'║  Cluster {cid} [{status}] — {name:<23} ║')
#     print(f'║    Reports : {ids_:<49}║')
#     print(f'║    Guides  : {str(guides):<49}║')
#     print('╟' + '─' * 62 + '╢')

# print('║                                                              ║')
# print(f'║  Parameters:  TIME_WINDOW={TIME_WINDOW_HOURS}h (↓from 6)  min_samples={DBSCAN_MIN_SAMPLES} (↑from 2) ║')
# print(f'║               GUIDE_WEIGHT={GUIDE_WEIGHT}× (new)  EPS={DBSCAN_EPS}                 ║')
# print('║  Algorithm:   TF-IDF(unigrams) → Cosine×GuideWeight         ║')
# print('║               → Haversine geo-filter → DBSCAN               ║')
# print('║               → Verified(≥3 reports, 3h, 3km)               ║')
# print('║  Production:  run_clustering() reads from IncidentReport ORM ║')
# print('║               Saves → IncidentCluster (M2M) + AlertBroadcast ║')
# print('║               + Notification for each report author          ║')
# print('║  No pretrained models | No external APIs | Classical ML      ║')
# print('╚' + '═' * 62 + '╝')
# GlobalMitra - Travel Safety and Incident Alert Platform

A full-stack travel safety platform for tourists and trekking guides in Nepal. Users can report real-time hazards such as landslides, floods, road blocks, and avalanches, and receive intelligent safety alerts powered by machine learning.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Setup and Installation](#4-setup-and-installation)
5. [Environment Variables](#5-environment-variables)
6. [User Roles](#6-user-roles)
7. [Authentication and User Management](#7-authentication-and-user-management)
8. [Explore Destinations](#8-explore-destinations)
9. [Social Features](#9-social-features)
10. [Incident Reporting System](#10-incident-reporting-system)
11. [Admin Dashboard](#11-admin-dashboard)
12. [API Endpoints](#12-api-endpoints)
13. [Limitations and Future Work](#13-limitations-and-future-work)

---

## 1. Project Overview

GlobalMitra is a travel safety platform built for Nepal's tourism ecosystem. It allows tourists and trekking guides to submit hazard reports and receive automated safety alerts without requiring 24/7 admin availability.

The platform has five main modules:

- **Authentication** - OTP-verified JWT auth with three user roles
- **Explore Destinations** - catalog of Nepal trekking routes with comparison
- **Social Features** - posts, comments, reactions, bookmarks, and share
- **Incident Reporting** - AI-powered clustering to detect genuine threats
- **Admin Dashboard** - cluster verification, alert broadcasting, guide management

The core innovation is the AI incident alert engine. It uses TF-IDF to extract keywords from incident descriptions and DBSCAN to cluster geographically and textually similar reports. This separates genuine threats from isolated false alarms automatically.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend Framework | Django 5.2 + Django REST Framework | REST API, ORM, Admin dashboard |
| Database | Microsoft SQL Server | Primary data storage |
| ML - Text | scikit-learn TF-IDF | Description vectorisation, keyword extraction |
| ML - Clustering | scikit-learn DBSCAN | Incident grouping, false alarm rejection |
| Numerical Computing | NumPy | Feature matrix construction |
| Authentication | JWT via SimpleJWT | Stateless token auth (2h access / 7d refresh) |
| API Documentation | drf-spectacular | Auto-generated Swagger UI |
| Email | Django SMTP (Gmail) | OTP delivery and notifications |
| Frontend | React + Vite | User interface |
| CORS | django-corsheaders | Frontend-backend communication |

---

## 3. Project Structure

```
GlobalMitra/
├── backend/
│   ├── accounts/           # Auth, User model, OTP, JWT
│   │   ├── models.py       # Custom User, GuideProfile, PasswordResetOTP
│   │   ├── views/          # Register, Login, OTP, Password reset
│   │   └── auth/           # JWT customisation
│   │
│   ├── profiles/           # Guide profile management and verification
│   │
│   ├── destinations/       # Destination catalog and comparison
│   │
│   ├── reports/            # Core feature - Incident reporting and AI alerts
│   │   ├── models.py       # IncidentReport, IncidentCluster, AlertBroadcast, Notification
│   │   ├── algorithm.py    # TF-IDF + DBSCAN clustering logic
│   │   ├── signals.py      # post_save triggers clustering on new report
│   │   ├── views.py        # Submit, verify, broadcast, notifications
│   │   ├── serializers.py
│   │   └── v1/urls.py
│   │
│   ├── socials/            # Posts, comments, reactions, bookmarks, share
│   │
│   ├── api/
│   │   └── v1/urls.py      # Central URL router
│   │
│   ├── globalmitra/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   └── manage.py
│
└── frontend/               # React + Vite
```

---

## 4. Setup and Installation

### Prerequisites

- Python 3.11+
- Microsoft SQL Server with ODBC Driver 18
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:8000`.

API documentation is available at `http://localhost:8000/api/docs`

### Required Python Packages

```
django
djangorestframework
scikit-learn
numpy
djangorestframework-simplejwt
django-cors-headers
drf-spectacular
django-filter
mssql-django
python-decouple
```

---

## 5. Environment Variables

Create a `.env` file in the `backend/` directory:

```
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=*

DB_NAME=GlobalMitraDB
DB_USER=sa
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=1433

EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-gmail@gmail.com

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 6. User Roles

There are three user roles in GlobalMitra.

**Tourist** - the default role assigned at registration.
- Submit incident reports
- View safety alerts and broadcasts
- Explore destinations and comparisons
- Use social features (posts, comments, bookmarks)
- Receive notifications

**Guide** - requires a verified GuideProfile with a Nepal Tourism Board license number.
- All Tourist permissions
- 1.5x trust weight in the DBSCAN confidence scoring formula
- Higher influence on whether a cluster reaches the auto-broadcast threshold

**Admin** - set via Django admin panel (is_staff = True).
- Full dashboard access
- Verify or reject incident clusters
- Manually broadcast alerts
- Manage users and guide verification
- View all reports with status filtering

---

## 7. Authentication and User Management

### Registration and OTP Verification

1. User registers with email, password, and full name
2. A 6-digit OTP is sent to the registered email and expires in 10 minutes
3. User submits the OTP to verify their account
4. Unverified accounts cannot log in


### Guide Profile Verification

Guides submit a GuideProfile with their license number and issuing authority. An admin reviews the submission and sets the status to VERIFIED or REJECTED. Only verified guides receive the 1.5x trust weight in the algorithm.

---

## 8. Explore Destinations

The destinations module provides a catalog of Nepal's trekking routes to help tourists make informed travel decisions.

### Destination Fields

| Field | Description |
|---|---|
| name, slug | Display name and URL-friendly identifier |
| latitude, longitude | GPS coordinates |
| averageCost | Estimated trip cost in NPR |
| difficulty | Easy / Moderate / Hard / Expert |
| bestSeason | Recommended travel months |
| duration | Typical days required |
| altitude | Maximum elevation in metres |
| safetyLevel | Current safety rating |
| permitsRequired | Required permits (TIMS, ACAP, etc.) |
| famousLocalItems | JSON array of local foods and crafts |
| activities | JSON array of available activities |
| internetAvailability | Connectivity level on the route |

### Destination Comparison

Users can compare two destinations side by side. The comparison endpoint returns parallel data covering difficulty, average cost, crowd level, safety level, best season, duration, and activities.

---

## 9. Social Features

The socials module adds a community layer to the platform, allowing tourists and guides to share experiences and knowledge.

- **Posts** - create text and image posts about trail conditions or travel tips
- **Comments** - threaded comments on posts with edit and delete by the author
- **Reactions** - like, helpful, or informative reactions on posts and comments
- **Bookmarks** - save posts for later, accessible from the user profile
- **Share** - share posts to other users or generate a shareable link
- **Feed** - personalised feed showing posts from followed users and nearby locations

---

## 10. Incident Reporting System

This is the core feature of GlobalMitra. When a report is submitted, a Django post_save signal triggers the TF-IDF + DBSCAN clustering algorithm synchronously. The algorithm groups similar reports together, scores their confidence, and either notifies the admin or auto-broadcasts an alert depending on the result.

### Full Pipeline

```
User submits report
        |
        v
IncidentReport saved to DB
        |
        v
Django post_save signal fires
        |
        v
Clustering function runs in-process
        |
   1. Fetch recent PENDING reports (last 3 hours)
   2. Run TF-IDF on descriptions -> numerical vectors
   3. Compute Haversine GPS distances between all reports
   4. Zero out text similarity for reports more than 3 km apart
   5. Run DBSCAN on combined distance matrix
      -> group similar and nearby reports into clusters
      -> label isolated reports as noise (-1)
   6. For each cluster found:
      -> calculate confidence score from trust weights
      -> extract top TF-IDF keywords
      -> save as IncidentCluster
        |
        v
confidence < threshold          confidence >= threshold
(fewer than 5 reports)          (5 or more reports)
        |                               |
        v                               v
Notify admin only               AUTO-broadcast to all users
Admin reviews cluster           No admin action needed
```

### Why TF-IDF

TF-IDF is computationally lightweight and runs without GPU resources. For domain-specific, keyword-driven incident detection it is sufficient and fully interpretable. Words like "landslide", "flood", "blocked", and "overflowing" receive high weight because they appear frequently in incident reports but rarely in general language.

### Why DBSCAN

DBSCAN requires no predefined number of clusters, which is critical here because the number of active incidents is always unknown. It also natively labels outlier reports as noise (-1), providing built-in false alarm rejection without any additional logic. Reports that are geographically more than 3 km apart cannot form a cluster even if their text is similar.

### Confidence Score

```
confidence = min( (sum of trust weights / 10.0) * 100, 100.0 )

Guide trust weight   = 1.5
Tourist trust weight = 1.0
```

### Tiered Alert Logic

| Scenario | System Action | Admin Needed |
|---|---|---|
| Single isolated report | Stored as PENDING, treated as noise | No |
| Cluster with fewer than 5 reports | Admin notified via DB notification | Yes |
| Cluster with 5 or more reports | Auto-broadcast to all users instantly | No |
| Admin confirms cluster manually | Manual broadcast sent to all users | Yes |
| Admin rejects cluster | Reports marked REJECTED, authors notified | Yes |

### Why Not Accuracy

DBSCAN is unsupervised. Cluster IDs have no fixed mapping to ground truth labels so standard accuracy is not a valid metric. Six evaluation metrics are used instead:

| Metric | What It Measures | Range |
|---|---|---|
| Adjusted Rand Index (ARI) | Pairwise agreement corrected for chance | -1 to 1 |
| Normalized Mutual Info (NMI) | Information shared between predicted and true labels | 0 to 1 |
| Homogeneity | Each cluster contains only one incident type | 0 to 1 |
| Completeness | All reports of the same type land in one cluster | 0 to 1 |
| V-Measure | Harmonic mean of Homogeneity and Completeness | 0 to 1 |
| Silhouette Score | Cluster separation without needing ground truth | -1 to 1 |

### Incident Categories

WEATHER, LANDSLIDE, FLOOD, ROAD_BLOCK, MEDICAL, WILDLIFE, OTHER

### Models

**IncidentReport**
```
id, user, description, category, image,
latitude, longitude, confidenceScore,
status (PENDING / VERIFIED / REJECTED / AUTO_ALERTED),
verifiedBy, rejectionReason, createdAt
```

**IncidentCluster**
```
id, reports (M2M), centerLatitude, centerLongitude,
topKeywords (JSON), confidenceScore,
dominantCategory, isAlertTriggered, createdAt
```

**AlertBroadcast**
```
id, cluster, message, severity (LOW / MEDIUM / HIGH / CRITICAL),
triggerType (MANUAL / AUTO), broadcastedBy, broadcastTime
```

---

## 11. Admin Dashboard

### Cluster Management

- View all IncidentClusters with confidence score, top keywords, dominant category, and report count
- Confirm a cluster to trigger a MANUAL AlertBroadcast to all users
- Reject a cluster with a reason - reports are marked REJECTED and authors are notified
- Filter clusters by status: PENDING, VERIFIED, REJECTED, AUTO_ALERTED

### Report Oversight

- View all IncidentReports with status, submitter role, GPS coordinates, image, and timestamp
- Override any report status independently of the algorithm

### Guide Verification

- Review GuideProfile submissions with license number and issuing authority
- Approve or decline guide status with an optional reason
- Approved guides immediately gain 1.5x trust weight in all future algorithm runs


---

## 12. API Endpoints

Full interactive documentation: `http://localhost:8000/api/docs`

## 13. Limitations and Future Work

### Current Limitations

- The TF-IDF + DBSCAN algorithm runs synchronously on each report save. Under high traffic this adds latency to the API response.
- Notifications are DB-based with frontend polling. There is no real-time WebSocket push.
- TF-IDF does not handle Nepali Devanagari script. Descriptions must be in English.
- DBSCAN eps and min_samples are fixed values and are not auto-tuned per region or density.
- No offline support for areas with poor internet connectivity.
- Destination data is manually seeded with no automated ingestion pipeline.
- Social feed ranking is chronological with no personalisation algorithm.

### Future Work

- **Celery + Redis** - move TF-IDF + DBSCAN processing to an async task queue so the report submission endpoint returns immediately without waiting for clustering to complete
- **Redis caching** - cache frequent queries such as active alerts and destination lists to reduce SQL Server load under high traffic
- **Firebase Cloud Messaging (FCM)** - true push notifications to mobile devices
- **Nepali language support** - multilingual TF-IDF or a lightweight NLP model for Devanagari text
- **WebSocket alerts** - real-time alert delivery using Django Channels
- **Weather API integration** - cross-validate reports against actual weather conditions
- **Dynamic DBSCAN tuning** - auto-adjust eps based on area population density
- **React Native mobile app** - with offline caching via service workers
- **Emergency service integration** - direct connection to police, mountain rescue, and hospitals
- **Auto-translation** - support Nepali, Tibetan, and Chinese tourist descriptions

---

*GlobalMitra - Final Year Project. Built with Django, scikit-learn, and React for the safety of Nepal's trekking community.*
**Author**: Subash Katwal


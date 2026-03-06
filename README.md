# GlobalMitra - Travel Safety and Incident Alert Platform

A full-stack travel safety platform for tourists and trekking guides in Nepal. Users can report real-time hazards such as landslides, floods, road blocks, and avalanches, and receive intelligent safety alerts powered by machine learning.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Setup and Installation](#4-setup-and-installation)
5. [Docker](#5-docker)
6. [Environment Variables](#6-environment-variables)
7. [User Roles](#7-user-roles)
8. [Authentication and User Management](#8-authentication-and-user-management)
9. [Explore Destinations](#9-explore-destinations)
10. [Social Features](#10-social-features)
11. [Incident Reporting System](#11-incident-reporting-system)
12. [Admin Dashboard](#12-admin-dashboard)
13. [API Endpoints](#13-api-endpoints)
14. [Limitations and Future Work](#14-limitations-and-future-work)

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
| Containerisation | Docker + Docker Compose | Consistent dev and production environment |

---

## 3. Project Structure

```
GlobalMitra/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
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
    └── Dockerfile
```

---

## 4. Setup and Installation

### Prerequisites

- Docker and Docker Compose installed
- Git

Clone the repository:

```bash
git clone https://github.com/your-username/globalmitra.git
cd globalmitra
```

Copy the environment file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Then follow the Docker section below to start everything.

If you prefer to run without Docker, you need:

- Python 3.11+
- Microsoft SQL Server with ODBC Driver 18
- Node.js 18+

### Manual Backend Setup (without Docker)

```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Manual Frontend Setup (without Docker)

```bash
cd frontend
npm install
npm run dev
```

---

## 5. Docker

The entire application runs with a single command. Docker Compose starts the backend, frontend, and database together.

### Start Everything

```bash
docker-compose up
```

### Start in Detached Mode (background)

```bash
docker-compose up -d
```

### Stop All Services

```bash
docker-compose down
```

### Stop and Remove Volumes (wipes database data)

```bash
docker-compose down -v
```

### Rebuild Images After Code Changes

```bash
docker-compose up --build
```

### Rebuild a Specific Service

```bash
docker-compose up --build backend
docker-compose up --build frontend
```

---

### Running Django Management Commands

Open a shell inside the running backend container:

```bash
docker-compose exec backend bash
```

From inside the container you can run any Django command:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py makemigrations
python manage.py collectstatic
python manage.py shell
```

Or run a command directly without opening a shell:

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py collectstatic --noinput
```

---

### Database Commands

Open an interactive SQL Server session:

```bash
docker-compose exec db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P your-db-password
```

---

### Viewing Logs

View logs for all services:

```bash
docker-compose logs
```

Follow live logs for a specific service:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

---

### Checking Running Containers

```bash
docker-compose ps
```

---

### Installing a New Package Inside the Container

If you add a package to `requirements.txt` and want to install it without rebuilding:

```bash
docker-compose exec backend pip install <package-name>
```

To make it permanent, add it to `requirements.txt` and rebuild:

```bash
docker-compose up --build backend
```

---

### Service URLs (after docker-compose up)

| Service | URL |
|---|---|
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/api/docs |
| Django Admin | http://localhost:8000/admin |
| Frontend | http://localhost:5173 |

---

## 6. Environment Variables

Create a `.env` file in the `backend/` directory before running Docker:

```
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=*

DB_NAME=GlobalMitraDB
DB_USER=sa
DB_PASSWORD=your-db-password
DB_HOST=db
DB_PORT=1433

EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-gmail@gmail.com

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Note: When using Docker Compose, `DB_HOST` should be set to `db` (the service name in docker-compose.yml), not `localhost`.

---

## 7. User Roles

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

## 8. Authentication and User Management

### Registration and OTP Verification

1. User registers with email, password, and full name
2. A 6-digit OTP is sent to the registered email and expires in 10 minutes
3. User submits the OTP to verify their account
4. Unverified accounts cannot log in

### JWT Login

- `POST /api/v1/auth/login` returns an access token (valid 2 hours) and a refresh token (valid 7 days)
- All protected endpoints require the header: `Authorization: Bearer <access_token>`
- `POST /api/v1/auth/token/refresh` rotates the access token without re-login

### Password Reset

1. `POST /api/v1/auth/forgot-password` sends a reset OTP to the registered email
2. The OTP is stored as a SHA-256 hash
3. `POST /api/v1/auth/reset-password` validates the OTP and updates the password

### Guide Profile Verification

Guides submit a GuideProfile with their license number and issuing authority. An admin reviews the submission and sets the status to VERIFIED or REJECTED. Only verified guides receive the 1.5x trust weight in the algorithm.

---

## 9. Explore Destinations

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

## 10. Social Features

The socials module adds a community layer to the platform, allowing tourists and guides to share experiences and knowledge.

- **Posts** - create text and image posts about trail conditions or travel tips
- **Comments** - threaded comments on posts with edit and delete by the author
- **Reactions** - like, helpful, or informative reactions on posts and comments
- **Bookmarks** - save posts for later, accessible from the user profile
- **Share** - share posts to other users or generate a shareable link
- **Feed** - personalised feed showing posts from followed users and nearby locations

---

## 11. Incident Reporting System

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

## 12. Admin Dashboard

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

## 13. API Endpoints

Full interactive documentation: `http://localhost:8000/api/docs`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login, returns JWT pair |
| POST | /api/v1/auth/token/refresh | Refresh access token |
| POST | /api/v1/auth/verify-otp | Verify email OTP |
| POST | /api/v1/auth/forgot-password | Send reset OTP to email |
| POST | /api/v1/auth/reset-password | Reset password with OTP token |

### Incident Reports

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /api/v1/reports/submit | Tourist / Guide | Submit new incident report |
| GET | /api/v1/reports/my | Tourist / Guide | View own submitted reports |
| GET | /api/v1/reports/alerts | All | View active alert broadcasts |
| GET | /api/v1/reports/admin/clusters | Admin | View clusters pending review |
| POST | /api/v1/reports/admin/clusters/\<id\>/verify | Admin | Confirm or reject a cluster |
| GET | /api/v1/reports/admin/reports | Admin | View all reports with status filter |
| GET | /api/v1/reports/notifications | All | Fetch unread notifications |
| POST | /api/v1/reports/notifications/read | All | Mark all notifications as read |

### Destinations

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/destinations/ | List all destinations |
| GET | /api/v1/destinations/\<slug\>/ | Get destination details |
| GET | /api/v1/destinations/compare/ | Compare two destinations |

### Social Features

| Method | Endpoint | Description |
|---|---|---|
| GET / POST | /api/v1/socials/posts/ | List feed or create post |
| GET / PATCH / DELETE | /api/v1/socials/posts/\<id\>/ | View, edit, or delete post |
| POST | /api/v1/socials/posts/\<id\>/comment/ | Add comment to post |
| POST | /api/v1/socials/posts/\<id\>/react/ | React to post |
| POST | /api/v1/socials/posts/\<id\>/bookmark/ | Bookmark or unbookmark post |
| GET | /api/v1/socials/bookmarks/ | List all bookmarked posts |

---

## 14. Limitations and Future Work

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

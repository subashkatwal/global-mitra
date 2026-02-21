## 🌏 Global Mitra - Travel Safety & Incident Alert Platform

> A full-stack travel safety platform for tourists and trekking guides in Nepal, featuring a real-time AI-powered incident detection system using TF-IDF and DBSCAN clustering.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Environment Variables](#5-environment-variables)
6. [Authentication & User Management](#6-authentication--user-management)
7. [Profile Management](#7-profile-management)
8. [Incident Reporting System (Core Feature)](#8-incident-reporting-system-core-feature)
9. [Destinations](#9-destinations)
10. [Social Features](#10-social-features)
11. [Notification System](#11-notification-system)
12. [Celery & Redis Architecture](#12-celery--redis-architecture)
13. [API Endpoints Reference](#13-api-endpoints-reference)
14. [Testing & Simulation](#14-testing--simulation)
15. [Limitations & Future Work](#15-limitations--future-work)

---

## 1. Project Overview

**Global Mitra** is a travel safety platform designed for Nepal's tourism ecosystem. It enables tourists and trekking guides to report hazards in real time — such as sudden weather changes, landslides, road blocks, or floods — and receive intelligent safety alerts.

The core innovation is an **AI-powered incident alert engine** that:
- Uses **TF-IDF** to extract meaningful keywords from user-submitted incident descriptions
- Uses **DBSCAN** to cluster geographically and textually similar reports
- Automatically distinguishes genuine threats from false alarms
- Broadcasts alerts without requiring 24/7 admin availability

The system is built for the practical realities of Nepal's trekking context — unreliable internet, diverse languages, and the need for trustworthy, fast safety information.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend Framework | Django 5.2 + Django REST Framework | REST API, ORM, Admin dashboard |
| Database | Microsoft SQL Server | Primary data storage |
| Async Task Queue | Celery | Background ML processing |
| Message Broker | Redis | Celery broker + Django cache |
| ML Algorithm | scikit-learn (TF-IDF + DBSCAN) | Incident clustering & false alarm reduction |
| Numerical Computing | NumPy | Feature matrix construction |
| Authentication | JWT via SimpleJWT | Stateless token-based auth |
| API Documentation | drf-spectacular (Swagger UI) | Auto-generated interactive API docs |
| CORS | django-corsheaders | Frontend-backend communication |
| Email | Django SMTP (Gmail) | OTP delivery & notifications |
| Frontend | React + Vite | User interface |

---

## 3. Project Structure

```
Global Mitra/
├── backend/
│   ├── accounts/           # Auth, User model, OTP, JWT
│   │   ├── models.py       # Custom User, GuideProfile, PasswordResetOTP
│   │   ├── views/          # Register, Login, OTP verify, Password reset
│   │   ├── serializers/
│   │   └── auth/           # JWT customization
│   │
│   ├── profiles/           # Guide profile management & verification
│   │   ├── models.py
│   │   └── views/
│   │
│   ├── destinations/       # Destination catalog & comparison
│   │   ├── models.py
│   │   └── views/
│   │
│   ├── reports/            # ⭐ Core Feature — Incident reporting & alerts
│   │   ├── models.py       # IncidentReport, IncidentCluster, AlertBroadcast, Notification
│   │   ├── tasks.py        # Celery task — TF-IDF + DBSCAN algorithm
│   │   ├── signals.py      # Triggers Celery task on new report
│   │   ├── views.py        # Submit, verify, broadcast, notifications
│   │   ├── serializers.py
│   │   ├── admin.py
│   │   └── v1/urls.py
│   │
│   ├── socials/            # Social features (implemented)
│   │
│   ├── api/
│   │   └── v1/urls.py      # Central URL router
│   │
│   ├── globalmitra/
│   │   ├── settings.py
│   │   ├── celery.py       # Celery app configuration
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   └── manage.py
│
└── frontend/               # React + Vite
```

---

## 4. Setup & Installation

### Prerequisites
- Python 3.11+
- Microsoft SQL Server + ODBC Driver 18
- Redis (for Celery broker)
- Node.js 18+ (for frontend)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (see Section 5)
cp .env.example .env

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

### Start Celery Worker (separate terminal)

```bash
celery -A globalmitra worker --loglevel=info
```

> Celery must be running for the TF-IDF + DBSCAN algorithm to process reports. Without it, reports are saved but not clustered.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Required Python Packages

```bash
pip install django djangorestframework celery redis
pip install scikit-learn numpy
pip install djangorestframework-simplejwt
pip install django-cors-headers drf-spectacular
pip install django-filter mssql-django
pip install python-decouple python-dotenv
```

---

## 5. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=*

# SQL Server
DB_NAME=GlobalMitraDB
DB_USER=sa
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=1433

# Redis
REDIS_URL=redis://127.0.0.1:6379/0

# Email (Gmail SMTP)
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-gmail@gmail.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 6. Authentication & User Management

### User Roles

| Role | Access | Notes |
|---|---|---|
| TOURIST | Submit reports, view alerts, view destinations | Default on registration |
| GUIDE | Same as tourist + 1.5x trust weight in algorithm | Requires GuideProfile with license |
| ADMIN | Verify clusters, broadcast alerts, manage users | Set via Django admin (is_staff) |

### Authentication Flow

1. User registers with email, password, full name
2. OTP sent to email for verification (expires in 10 minutes)
3. After verification, user logs in with email + password
4. Server returns **JWT Access Token** (valid 2 hours) + **Refresh Token** (valid 7 days)
5. All protected endpoints require `Authorization: Bearer <access_token>` header
6. Password reset via OTP with SHA-256 hashed reset token

### Key Fields — User Model

```python
id            # UUID primary key
email         # Login identifier (unique)
username      # Auto-generated from email
fullName      # Display name
phoneNumber   # Optional, unique
role          # TOURIST / GUIDE / ADMIN
verified      # Email verification status
isActive      # Account status
```

---

## 7. Profile Management

### Guide Profile

Guides require a verified `GuideProfile` linked to their user account via OneToOneField.

| Field | Description |
|---|---|
| licenseNumber | Official Nepal Tourism Board guide license number |
| licenseIssuedBy | Issuing authority (e.g. Nepal Tourism Board) |
| verificationStatus | PENDING → VERIFIED / REJECTED |
| bio | Short introduction visible to tourists |

### Trust Score Impact on Algorithm

In the clustering algorithm, **Guides carry 1.5x trust weight** compared to Tourists (1.0x). This means:
- A cluster of 4 verified guide reports reaches higher confidence faster
- Guides submitting false reports are penalized more heavily in future weighting
- Admin sees confidence scores influenced by reporter credibility

---

## 8. Incident Reporting System (Core Feature)

This is the heart of Global Mitra. The system uses **TF-IDF + DBSCAN** running asynchronously via **Celery** to intelligently cluster reports and detect genuine safety threats.

### 8.1 How It Works — Full Pipeline

```
User submits report (POST /api/v1/reports/submit/)
         │
         ▼
IncidentReport saved to DB
         │
         ▼
Django Signal (post_save) fires
         │
         ▼
Celery task dispatched to Redis queue (non-blocking)
         │
         ▼
Celery Worker picks up task
         │
    ┌────▼─────────────────────────────────┐
    │  1. Fetch recent PENDING reports      │
    │     (last 3 hours)                   │
    │                                      │
    │  2. Run TF-IDF on descriptions        │
    │     → numerical feature vectors      │
    │                                      │
    │  3. Normalize GPS coordinates         │
    │     → combine with TF-IDF matrix     │
    │                                      │
    │  4. Run DBSCAN                        │
    │     → cluster similar+nearby reports │
    │     → label outliers as noise (-1)   │
    │                                      │
    │  5. For each cluster found:           │
    │     → calculate confidence score     │
    │     → extract top TF-IDF keywords    │
    │     → create IncidentCluster         │
    └────────────────────────────────────┬─┘
                                         │
              ┌──────────────────────────▼──────────────────────────┐
              │                                                       │
         confidence < threshold                            confidence ≥ threshold
         (< 5 reports)                                    (≥ 5 reports)
              │                                                       │
              ▼                                                       ▼
    Notify admin only                                   AUTO-broadcast alert
    Admin reviews cluster                               Notify ALL users
    Admin: CONFIRM or REJECT                            No admin needed
```

### 8.2 TF-IDF (Term Frequency-Inverse Document Frequency)

TF-IDF converts text descriptions into numerical vectors. Words that appear frequently in incident reports but are rare in general language (e.g. "landslide", "flood", "blocked", "खतरा") receive high weight. Common English stop words are filtered out. Both single words and two-word phrases (bigrams) are extracted for richer context.

**Why TF-IDF over BERT or other LLMs?**
TF-IDF is computationally lightweight and runs in real-time without GPU resources. For domain-specific, keyword-driven incident detection, it is sufficient and fully interpretable — committee members can see exactly which keywords drove each clustering decision.

### 8.3 DBSCAN (Density-Based Spatial Clustering of Applications with Noise)

DBSCAN groups reports that are both **geographically close** and **textually similar** into clusters. It requires no predefined number of clusters (unlike K-Means), making it ideal for real-time incident detection where the number of active incidents is unknown.

**Critical advantage:** Reports that don't belong to any cluster are automatically labeled as **noise (label = -1)** and treated as potential false alarms. No additional false alarm logic is needed — DBSCAN handles it natively.

**Why DBSCAN over K-Means?**
K-Means requires you to define K (number of clusters) upfront, which is impossible here. DBSCAN discovers clusters of arbitrary shape and size and naturally handles outliers — perfect for this use case.

### 8.4 Confidence Scoring

```
confidence = min((trust_weighted_sum / 10.0) * 100, 100.0)

where trust_weight:
  GUIDE   = 1.5
  TOURIST = 1.0
```

### 8.5 Tiered Alert Logic

| Scenario | System Action | Admin Needed? |
|---|---|---|
| Single isolated report (noise) | Stored as PENDING, no alert | No |
| Cluster with < 5 reports | Admin notified via DB notification | Yes — admin reviews |
| Cluster with ≥ 5 reports | Alert auto-broadcast to all users | No — system handles it |
| Admin confirms cluster manually | Alert broadcast with MANUAL trigger | Yes — admin action |
| Admin rejects cluster | Reports marked REJECTED, reporters notified | Yes — admin action |

This tiered system solves the **"admin sleeping at midnight"** problem — high-confidence clusters broadcast automatically without human intervention.

### 8.6 Models

**IncidentReport**
```
id, user, description, category, image,
latitude, longitude, confidenceScore,
status (PENDING/VERIFIED/REJECTED/AUTO_ALERTED),
verifiedBy, rejectionReason, createdAt
```

**IncidentCluster** (DBSCAN output)
```
id, reports (M2M), centerLatitude, centerLongitude,
topKeywords (JSON), confidenceScore,
dominantCategory, isAlertTriggered, createdAt
```

**AlertBroadcast**
```
id, cluster, message, severity (LOW/MEDIUM/HIGH/CRITICAL),
triggerType (MANUAL/AUTO), broadcastedBy, broadcastTime
```

**Notification**
```
id, recipient, notificationType, title, message,
incidentReport (FK), isRead, createdAt
```

### 8.7 Incident Categories

`WEATHER` `LANDSLIDE` `FLOOD` `ROAD_BLOCK` `MEDICAL` `WILDLIFE` `OTHER`

---

## 9. Destinations

The destinations module provides a catalog of trekking routes and tourist locations in Nepal.

### Destination Fields

```
name, slug, description,
latitude, longitude,
averageCost, difficulty, bestSeason, duration,
famousLocalItems (JSON), activities (JSON),
altitude, climate, safetyLevel,
permitsRequired, crowdLevel, internetAvailability
```

### Destination Comparison

Users can compare two destinations side-by-side — showing difficulty, average cost, crowd level, safety level, best season, and activities in a parallel layout to help tourists make informed decisions.

---

## 10. Social Features

The `socials` app is implemented in the backend but not included in the primary demo. It provides community features including posts, comments, and interactions between tourists and guides. It is planned for a future release after core safety features are stabilized.

---

## 11. Notification System

Global Mitra uses a **DB-based notification system** instead of Firebase FCM for simplicity and reliability. The frontend polls the notifications endpoint to fetch unread notifications.

| Notification Type | Trigger | Recipient |
|---|---|---|
| NEW_INCIDENT | Report submitted | Admin |
| CLUSTER_FORMED | DBSCAN finds a cluster | Admin |
| AUTO_ALERT | Auto-broadcast triggered (≥5 reports) | All tourists & guides |
| ALERT_BROADCAST | Admin confirms a cluster | All tourists & guides |
| REPORT_VERIFIED | Admin confirms cluster | Report author |
| REPORT_REJECTED | Admin rejects cluster | Report author |

Frontend polls: `GET /api/v1/reports/notifications/` for unread count and content.

---

## 12. Celery & Redis Architecture

```
Django (report saved)
       │
       │ .delay()  ← non-blocking
       ▼
   Redis Queue
       │
       ▼
  Celery Worker
  ┌─────────────────────┐
  │  TF-IDF vectorize   │
  │  GPS normalize      │
  │  DBSCAN cluster     │
  │  Score confidence   │
  │  Create cluster     │
  │  Notify / broadcast │
  └─────────────────────┘
```

| Component | Role |
|---|---|
| Redis (Broker) | Receives task messages from Django, queues them for workers |
| Redis (Result Backend) | Stores Celery task results and status |
| Redis (Cache) | Django cache layer for frequent queries |
| Celery Worker | Picks up tasks and runs TF-IDF + DBSCAN |
| Django Signal | Fires `post_save` on IncidentReport → dispatches task |

### Configuration (settings.py additions)

```python
CELERY_BROKER_URL = 'redis://127.0.0.1:6379/0'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/0'
INCIDENT_CLUSTER_WINDOW_HOURS = 3
CLUSTER_MIN_REPORTS = 3
CLUSTER_AUTO_BROADCAST_THRESHOLD = 5
DBSCAN_EPS = 0.5
DBSCAN_MIN_SAMPLES = 3
```

---

## 13. API Endpoints Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register/` | Register new user |
| POST | `/api/v1/auth/login/` | Login, returns JWT pair |
| POST | `/api/v1/auth/token/refresh/` | Refresh access token |
| POST | `/api/v1/auth/verify-otp/` | Verify email OTP |
| POST | `/api/v1/auth/forgot-password/` | Send reset OTP to email |
| POST | `/api/v1/auth/reset-password/` | Reset password with OTP token |

### Reports (Incident System)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/v1/reports/submit/` | Tourist/Guide | Submit new incident report |
| GET | `/api/v1/reports/my/` | Tourist/Guide | View own submitted reports |
| GET | `/api/v1/reports/alerts/` | All | View active alert broadcasts |
| GET | `/api/v1/reports/admin/clusters/` | Admin | View clusters pending review |
| POST | `/api/v1/reports/admin/clusters/<id>/verify/` | Admin | Confirm or reject a cluster |
| GET | `/api/v1/reports/admin/reports/` | Admin | View all reports with status filter |
| GET | `/api/v1/reports/notifications/` | All | Fetch unread notifications |
| POST | `/api/v1/reports/notifications/read/` | All | Mark all notifications as read |

### API Documentation

Swagger UI available at: `http://localhost:8000/api/schema/swagger-ui/`

---

## 14. Testing & Simulation

For defense demonstration, a simulation script bulk-creates realistic incident reports from multiple users to showcase the full TF-IDF + DBSCAN pipeline.

### What the simulation demonstrates

- TF-IDF picking up high-frequency incident keywords
- DBSCAN clustering geographically close + textually similar reports
- Single isolated reports treated as noise (false alarm reduction working)
- Cluster with 3+ reports notifying admin
- Cluster with 5+ reports auto-broadcasting without admin
- Admin dashboard showing clusters with confidence scores and keywords

### Running the simulation

```bash
cd backend
python simulate_incidents.py
```

The script creates reports with GPS coordinates clustered around real Nepal trekking locations (Langtang, Annapurna, Everest Base Camp area) with realistic incident keywords, and also includes intentional noise reports to demonstrate false alarm rejection.

---

## 15. Limitations & Future Work

### Current Limitations

- Notifications are DB-based (polling); no real-time WebSocket push
- TF-IDF does not handle Nepali language (Devanagari) — English descriptions only
- DBSCAN parameters (eps, min_samples) are fixed; not auto-tuned per area
- No offline support for areas with poor internet connectivity
- Destination data is seeded manually; no automated data pipeline

### Future Work

- Firebase Cloud Messaging (FCM) for true push notifications
- Nepali language support using multilingual TF-IDF or NLP models
- WebSocket-based real-time alert delivery (Django Channels)
- Weather API integration for cross-referencing reports against actual conditions
- Dynamic DBSCAN parameter tuning based on area density
- Mobile app (React Native)
- Public emergency service integration (police, rescue teams)

---

## License

This project was developed as a Final Year Project. All rights reserved.

---

*Built with Django, Celery, Redis, scikit-learn, and React — for the safety of Nepal's trekking community.*

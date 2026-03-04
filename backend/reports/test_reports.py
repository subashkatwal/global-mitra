import requests
import json

# --------------------------
# Configuration
BASE_URL = "http://localhost:8005/api/reports"

# --------------------------
# Tokens for 4 users
# --------------------------
TOKENS = {
    "guide1": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcxNzYwNzg1LCJpYXQiOjE3NzE3NTM1ODUsImp0aSI6IjVhODlkYjZkNDk4MDQ1NzBhODJiZTgwYzk4NGNiOThkIiwidXNlcl9pZCI6IjZlNjA2OGVkLWU5NWUtNGM2Ni05ZjkxLWIyMDlhYzU3NDY0NyJ9.yU-qT111VOw8FZO8RBOJut-uxnRQnZF6HhqQUZ6XLHs",
    "guide2": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcxNzYwODMzLCJpYXQiOjE3NzE3NTM2MzMsImp0aSI6ImFhNGRjNTRkODNkZDQxZTc4ZmRjYTJiNDkwODNlMTI0IiwidXNlcl9pZCI6ImU4MjA4NDFjLTBjOTItNDhlYi1iODJiLTU0NDA3MzdlYWJjMiJ9.1_9rbd9WNaUlUSUaFSwSskTNadCbfOGI7PioKYwI_4I",
    "user1": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcxNzYxMDc2LCJpYXQiOjE3NzE3NTM4NzYsImp0aSI6ImRhMjJmOTg5MjRmYzRkMjg5OTEyN2M5NzM0YmQyMTc1IiwidXNlcl9pZCI6IjE0YzEzNTUyLWJkZTItNDg0Ny05NjcyLTQ0NGVhMWUwZWFiZiJ9.f8khIBFbUywkwY0_QkMGWny0RBU_tAQ6hhtT9msLx7A",
    "user2": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcxNzYxMjkzLCJpYXQiOjE3NzE3NTQwOTMsImp0aSI6IjFiY2Q5Y2QxNDE4OTQ5YjRhMDhkYjg0ZGFmMzQ3N2Y0IiwidXNlcl9pZCI6IjQ1NGVkYzUyLTRlNDUtNDE5My1hNmIzLWVmNzlhOTk1ZTFhMiJ9.-JuPHF5Wv9CTXwqI7_2JYNJJRiUbdNNKxtO68jXYn1U",
}

# --------------------------
# Sample test data
# --------------------------
test_incidents = [
    {
        "description": "Large landslide blocking main road near Langtang. Cannot pass.",
        "category": "LANDSLIDE",
        "latitude": 28.2140,
        "longitude": 85.5190,
    },
    {
        "description": "Flash flood blocking trail. Water level rising fast.",
        "category": "FLOOD",
        "latitude": 27.7172,
        "longitude": 85.3140,
    },
]

test_alerts = [
    {"message": "Road closed due to flood", "severity": "HIGH"},
    {"message": "Maintenance in power grid", "severity": "MEDIUM"},
]

test_notifications = [
    {"message": "New incident reported near your location"},
    {"message": "Alert: Power outage scheduled tomorrow"},
]

# --------------------------
# Helper
# --------------------------
def print_response(resp):
    print(f"Status: {resp.status_code}")
    try:
        print(json.dumps(resp.json(), indent=2))
    except:
        print(resp.text)
    print("-" * 50)

# --------------------------
# Test per user
# --------------------------
def test_user(token, username):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print(f"\n=== TESTING FOR {username} ===\n")

    # --------------------------
    # INCIDENTS
    # --------------------------
    incident_ids = []

    for incident in test_incidents:
        resp = requests.post(f"/{BASE_URL}/incidents", json=incident, headers=headers)
        print_response(resp)
        if resp.status_code in [200, 201]:
            incident_ids.append(resp.json().get("id"))

    resp = requests.get(f"/{BASE_URL}/incidents", headers=headers)
    print_response(resp)

    if incident_ids:
        resp = requests.get(f"/{BASE_URL}/incidents/{incident_ids[0]}", headers=headers)
        print_response(resp)

        resp = requests.patch(f"/{BASE_URL}/incidents/{incident_ids[0]}", json={"description": "Updated description"}, headers=headers)
        print_response(resp)

        resp = requests.post(f"/{BASE_URL}/incidents/{incident_ids[0]}/verify", headers=headers)
        print_response(resp)

        resp = requests.post(f"/{BASE_URL}/incidents/{incident_ids[0]}/reject", headers=headers)
        print_response(resp)

        resp = requests.delete(f"/{BASE_URL}/incidents/{incident_ids[0]}", headers=headers)
        print_response(resp)

    # --------------------------
    # CLUSTERS
    # --------------------------
    resp = requests.get(f"/{BASE_URL}/clusters", headers=headers)
    print_response(resp)

    clusters = resp.json() if resp.status_code == 200 else []
    if isinstance(clusters, dict):
        clusters = clusters.get("results", [])
    if clusters:
        cluster_id = clusters[0].get("id")
        resp = requests.get(f"/{BASE_URL}/clusters/{cluster_id}", headers=headers)
        print_response(resp)

    # --------------------------
    # ALERTS
    # --------------------------
    alert_ids = []

    for alert in test_alerts:
        resp = requests.post(f"/{BASE_URL}/alerts", json=alert, headers=headers)
        print_response(resp)
        if resp.status_code in [200, 201]:
            alert_ids.append(resp.json().get("id"))

    resp = requests.get(f"/{BASE_URL}/alerts", headers=headers)
    print_response(resp)

    if alert_ids:
        resp = requests.patch(f"/{BASE_URL}/alerts/{alert_ids[0]}", json={"message": "Updated alert message"}, headers=headers)
        print_response(resp)

        resp = requests.get(f"/{BASE_URL}/alerts/{alert_ids[0]}", headers=headers)
        print_response(resp)

        resp = requests.delete(f"/{BASE_URL}/alerts/{alert_ids[0]}", headers=headers)
        print_response(resp)

    # --------------------------
    # NOTIFICATIONS
    # --------------------------
    notification_ids = []

    for notif in test_notifications:
        resp = requests.post(f"/{BASE_URL}/notifications", json=notif, headers=headers)
        print_response(resp)
        if resp.status_code in [200, 201]:
            notification_ids.append(resp.json().get("id"))

    resp = requests.get(f"/{BASE_URL}/notifications", headers=headers)
    print_response(resp)

    resp = requests.get(f"/{BASE_URL}/notifications/unread_count", headers=headers)
    print_response(resp)

    if notification_ids:
        resp = requests.patch(f"/{BASE_URL}/notifications/{notification_ids[0]}/mark_read", headers=headers)
        print_response(resp)

    resp = requests.post(f"/{BASE_URL}/notifications/mark_all_read", headers=headers)
    print_response(resp)

    if notification_ids:
        resp = requests.patch(f"/{BASE_URL}/notifications/{notification_ids[0]}", json={"isRead": True}, headers=headers)
        print_response(resp)

        resp = requests.delete(f"/{BASE_URL}/notifications/{notification_ids[0]}", headers=headers)
        print_response(resp)

# --------------------------
# Run tests for all users
# --------------------------
for username, token in TOKENS.items():
    test_user(token, username)
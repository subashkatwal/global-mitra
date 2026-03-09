from django.urls import path
from reports.views import (
    ReportListCreateView,
    ReportDetailView,
    ReportVerifyView,
    ReportRejectView,
    ReportsOverviewView,
    ClusterListView,
    ClusterDetailView,
    ClusterBroadcastView,
    AlertListView,
    AlertDetailView,
    NotificationListView,
    NotificationDetailView,
    MarkAllNotificationsReadView,
)

urlpatterns = [
    # Reports
    path("", ReportListCreateView.as_view(), name="report-list-create"),
    path("overview", ReportsOverviewView.as_view(), name="reports-overview"),
    path("<uuid:pk>", ReportDetailView.as_view(), name="report-detail"),
    path("<uuid:pk>/verify", ReportVerifyView.as_view(), name="report-verify"),
    path("<uuid:pk>/reject", ReportRejectView.as_view(), name="report-reject"),
    # Clusters
    path("clusters", ClusterListView.as_view(), name="cluster-list"),
    path("clusters/<uuid:pk>", ClusterDetailView.as_view(), name="cluster-detail"),
    path(
        "clusters/<uuid:pk>/broadcast",
        ClusterBroadcastView.as_view(),
        name="cluster-broadcast",
    ),
    # Alerts
    path("alerts", AlertListView.as_view(), name="alert-list"),
    path("alerts/<uuid:pk>", AlertDetailView.as_view(), name="alert-detail"),
    # Notifications
    path("notifications", NotificationListView.as_view(), name="notification-list"),
    path(
        "notifications/read-all",
        MarkAllNotificationsReadView.as_view(),
        name="notification-read-all",
    ),
    path(
        "notifications/<uuid:pk>",
        NotificationDetailView.as_view(),
        name="notification-detail",
    ),
]

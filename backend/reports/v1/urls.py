"""
URL Configuration for Global Mitra Incident Report & Alert System.
"""

from django.urls import path
from reports.views import (
    IncidentReportViewSet,
    IncidentClusterViewSet,
    AlertBroadcastViewSet,
    NotificationViewSet
)

# IncidentReportViewSet actions
incident_list = IncidentReportViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
incident_detail = IncidentReportViewSet.as_view({
    'get': 'retrieve',
    'patch': 'partial_update',
    'delete': 'destroy'
})
incident_verify = IncidentReportViewSet.as_view({
    'post': 'verify'
})
incident_reject = IncidentReportViewSet.as_view({
    'post': 'reject'
})

# IncidentClusterViewSet actions
cluster_list = IncidentClusterViewSet.as_view({
    'get': 'list'
})
cluster_detail = IncidentClusterViewSet.as_view({
    'get': 'retrieve'
})

# AlertBroadcastViewSet actions
alert_list = AlertBroadcastViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
alert_detail = AlertBroadcastViewSet.as_view({
    'get': 'retrieve',
    'patch': 'partial_update',
    'delete': 'destroy'
})

# NotificationViewSet actions
notification_list = NotificationViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
notification_detail = NotificationViewSet.as_view({
    'get': 'retrieve',
    'patch': 'partial_update',
    'delete': 'destroy'
})
notification_mark_all = NotificationViewSet.as_view({
    'post': 'mark_all_read'
})
notification_mark_read = NotificationViewSet.as_view({
    'patch': 'mark_read'
})
notification_unread_count = NotificationViewSet.as_view({
    'get': 'unread_count'
})

urlpatterns = [
    # Incidents
    path('/incidents', incident_list, name='incident-list'),
    path('/incidents/<int:pk>', incident_detail, name='incident-detail'),
    path('/incidents/<int:pk>/verify', incident_verify, name='incident-verify'),
    path('/incidents/<int:pk>/reject', incident_reject, name='incident-reject'),

    # Clusters
    path('/clusters', cluster_list, name='cluster-list'),
    path('/clusters/<int:pk>', cluster_detail, name='cluster-detail'),

    # Alerts
    path('/alerts', alert_list, name='alert-list'),
    path('/alerts/<int:pk>', alert_detail, name='alert-detail'),

    # Notifications
    path('/notifications', notification_list, name='notification-list'),
    path('/notifications/<int:pk>', notification_detail, name='notification-detail'),
    path('/notifications/mark_all_read', notification_mark_all, name='notification-mark-all'),
    path('/notifications/<int:pk>/mark_read', notification_mark_read, name='notification-mark-read'),
    path('/notifications/unread_count', notification_unread_count, name='notification-unread-count'),
]
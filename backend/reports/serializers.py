"""
DRF Serializers for Global Mitra Incident Report & Alert System.
"""

from rest_framework import serializers
from .models import IncidentReport, IncidentCluster, AlertBroadcast, Notification


class IncidentReportSerializer(serializers.ModelSerializer):
    """Serializer for incident reports with read-only status tracking."""
    
    cluster_id = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(read_only=True)
    
    
    class Meta:
        model = IncidentReport
        fields = [
            'id', 'description', 'category', 'latitude', 'longitude',
            'confidenceScore', 'status', 'cluster_id',
            'createdAt'
        ]
        read_only_fields = ['status', 'cluster_id', 'createdAt' ]
    
    def get_cluster_id(self, obj: IncidentReport) -> int:
        """Return the ID of the cluster this report belongs to, if any."""
        cluster = obj.incidentcluster_set.first()  # ManyToMany reverse lookup
        return cluster.id if cluster else None
    
    def validate_latitude(self, value: float) -> float:
        if not -90 <= value <= 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value
    
    def validate_longitude(self, value: float) -> float:
        if not -180 <= value <= 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value
    
    def validate_confidenceScore(self, value: float) -> float:
        if not 0 <= value <= 1:
            raise serializers.ValidationError("Confidence score must be between 0 and 1.")
        return value


class IncidentReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    
    class Meta:
        model = IncidentReport
        fields = ['id', 'description', 'category', 'status', 'latitude', 'longitude', 'createdAt']


class IncidentClusterSerializer(serializers.ModelSerializer):
    """Serializer for incident clusters with nested reports."""
    
    reports = IncidentReportListSerializer(many=True, read_only=True)
    report_count = serializers.SerializerMethodField()
    alert_broadcast = serializers.SerializerMethodField()
    
    class Meta:
        model = IncidentCluster
        fields = [
            'id', 'reports', 'report_count', 'centerLatitude', 'centerLongitude',
            'topKeywords', 'confidenceScore', 'dominantCategory', 'isAlertTriggered',
            'alert_broadcast', 'createdAt'
        ]
    
    def get_report_count(self, obj: IncidentCluster) -> int:
        return obj.reports.count()
    
    def get_alert_broadcast(self, obj: IncidentCluster) -> dict:
        """Return associated alert broadcast if exists."""
        try:
            alert = obj.alertbroadcast
            return {
                'id': alert.id,
                'message': alert.message,
                'severity': alert.severity,
                'triggerType': alert.triggerType,
                'createdAt': alert.createdAt
            }
        except AlertBroadcast.DoesNotExist:
            return None


class AlertBroadcastSerializer(serializers.ModelSerializer):
    """Serializer for alert broadcasts."""
    
    cluster_details = IncidentClusterSerializer(source='cluster', read_only=True)
    triggered_by = serializers.SerializerMethodField()
    
    class Meta:
        model = AlertBroadcast
        fields = [
            'id', 'cluster', 'cluster_details', 'message', 'severity',
            'triggerType', 'triggered_by'
        ]
        read_only_fields = ['triggerType']
    
    def get_triggered_by(self, obj: AlertBroadcast) -> str:
        """Show who triggered the alert (system or admin)."""
        return "System (Auto)" if obj.triggerType == "AUTO" else "Admin (Manual)"
    
    def validate_severity(self, value: str) -> str:
        valid_severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        if value not in valid_severities:
            raise serializers.ValidationError(f"Severity must be one of: {valid_severities}")
        return value


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications."""
    
    incident_details = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'notificationType', 'title', 'message',
            'incidentReport', 'incident_details', 'isRead', 'createdAt', 'time_ago'
        ]
        read_only_fields = ['recipient', 'createdAt', 'isRead']
    
    def get_incident_details(self, obj: Notification) -> dict:
        """Include minimal incident details if linked."""
        if obj.incidentReport:
            return {
                'id': obj.incidentReport.id,
                'description': obj.incidentReport.description[:100] + '...' if len(obj.incidentReport.description) > 100 else obj.incidentReport.description,
                'category': obj.incidentReport.category,
                'status': obj.incidentReport.status
            }
        return None
    
    def get_time_ago(self, obj: Notification) -> str:
        """Human-readable time difference."""
        from django.utils import timesince
        return timesince.timesince(obj.createdAt) + " ago"


class NotificationMarkReadSerializer(serializers.ModelSerializer):
    """Simple serializer for marking notifications as read."""
    
    class Meta:
        model = Notification
        fields = ['isRead']
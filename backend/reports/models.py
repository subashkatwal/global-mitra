from django.db import models
from accounts.models import User
import uuid


class IncidentReport(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
        ('AUTO_ALERTED', 'Auto Alerted'),  # system triggered without admin
    )
    CATEGORY_CHOICES = (
        ('WEATHER', 'Weather'),
        ('LANDSLIDE', 'Landslide'),
        ('FLOOD', 'Flood'),
        ('ROAD_BLOCK', 'Road Block'),
        ('MEDICAL', 'Medical Emergency'),
        ('WILDLIFE', 'Wildlife'),
        ('OTHER', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incidentReports')

    description = models.TextField()
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='OTHER')
    image = models.ImageField(
        upload_to='incident_images/',
        blank=True,
        null=True
    )

    latitude = models.FloatField()
    longitude = models.FloatField()

    confidenceScore = models.FloatField(default=0.0)  # assigned by DBSCAN

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    verifiedBy = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verifiedReports'
    )
    rejectionReason = models.TextField(blank=True, null=True)

    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} by {self.user.email} at ({self.latitude}, {self.longitude})"


class IncidentCluster(models.Model):
    """
    Created by DBSCAN when 3+ reports cluster together.
    Admin reviews this, not individual reports.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    reports = models.ManyToManyField(IncidentReport, related_name='cluster')

    # GPS center of the cluster (average of all report coordinates)
    centerLatitude = models.FloatField()
    centerLongitude = models.FloatField()

    # Top keywords from TFIDF across all report descriptions in this cluster
    topKeywords = models.JSONField(default=list)

    confidenceScore = models.FloatField(default=0.0)
    dominantCategory = models.CharField(max_length=100, blank=True)

    isAlertTriggered = models.BooleanField(default=False)

    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cluster ({self.centerLatitude:.4f}, {self.centerLongitude:.4f}) - {self.confidenceScore:.2f} confidence"


class AlertBroadcast(models.Model):
    SEVERITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )

    TRIGGER_CHOICES = (
        ('MANUAL', 'Manual by Admin'),
        ('AUTO', 'Auto by Algorithm'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    cluster = models.OneToOneField(
        IncidentCluster,
        on_delete=models.CASCADE,
        related_name='alert'
    )

    message = models.TextField()
    severity = models.CharField(max_length=50, choices=SEVERITY_CHOICES, default='MEDIUM')
    triggerType = models.CharField(max_length=20, choices=TRIGGER_CHOICES, default='MANUAL')

    broadcastedBy = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='broadcastedAlerts'
    )

    broadcastTime = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.severity} alert - {self.triggerType}"


class Notification(models.Model):
    NOTIFICATION_TYPE = (
        ('NEW_INCIDENT', 'New Incident Reported'),
        ('CLUSTER_FORMED', 'Cluster Formed - Review Needed'),
        ('ALERT_BROADCAST', 'Alert Broadcasted'),
        ('REPORT_VERIFIED', 'Your Report Was Verified'),
        ('REPORT_REJECTED', 'Your Report Was Rejected'),
        ('AUTO_ALERT', 'Auto Alert Triggered'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')

    notificationType = models.CharField(max_length=50, choices=NOTIFICATION_TYPE)
    title = models.CharField(max_length=255)
    message = models.TextField()

    incidentReport = models.ForeignKey(
        IncidentReport, on_delete=models.SET_NULL, null=True, blank=True
    )

    isRead = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-createdAt']

    def __str__(self):
        return f"{self.notificationType} → {self.recipient.email}"
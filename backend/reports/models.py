from django.db import models
from profiles.models import User
from destinations.models import Destination
import uuid

class IncidentReport(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE)

    description = models.TextField()
    category = models.CharField(max_length=100)
    images = models.JSONField(default=list)

    latitude = models.FloatField()
    longitude = models.FloatField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    verifiedBy = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verifiedReports'
    )

    createdAt = models.DateTimeField(auto_now_add=True)


class AlertBroadcast(models.Model):
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE)
    message = models.TextField()
    severity = models.CharField(max_length=50)
    broadcastTime = models.DateTimeField(auto_now_add=True)

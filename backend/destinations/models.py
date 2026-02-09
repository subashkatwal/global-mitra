from django.db import models
import uuid
class Destination(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()

    latitude = models.FloatField()
    longitude = models.FloatField()

    averageCost = models.DecimalField(max_digits=10, decimal_places=2)
    difficulty = models.CharField(max_length=50)
    bestSeason = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)

    famousLocalItems = models.JSONField(default=list)
    activities = models.JSONField(default=list)

    altitude = models.IntegerField(null=True, blank=True)
    climate = models.CharField(max_length=100, null=True, blank=True)
    safetyLevel = models.CharField(max_length=50, null=True, blank=True)

    permitsRequired = models.BooleanField(default=False)

    crowdLevel = models.CharField(max_length=50)
    internetAvailability = models.CharField(max_length=50)

    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

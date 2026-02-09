from django.db import models
import uuid

class User(models.Model):
    ROLE_CHOICES = (
        ('TOURIST', 'Tourist'),
        ('GUIDE', 'Guide'),
        ('ADMIN', 'Admin'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    fullName = models.CharField(max_length=150)
    photo = models.URLField(blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    isActive = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

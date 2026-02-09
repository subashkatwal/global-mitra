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
    phoneNumber = models.CharField(max_length=10,unique=True,null=True,blank=True)
    photo = models.URLField(blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    isActive = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email



class GuideProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='guideProfile')
    phone = models.CharField(max_length=20)
    age = models.IntegerField()
    address = models.TextField()
    documentId = models.CharField(max_length=100)
    verificationStatus = models.BooleanField(default=False)

    def __str__(self):
        return self.user.fullName

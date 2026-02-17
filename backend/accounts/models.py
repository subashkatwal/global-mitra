from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone
import uuid


class User(AbstractUser):

    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('TOURIST', 'Tourist'),
        ('GUIDE', 'Guide'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)

    fullName = models.CharField(max_length=150)
    phoneNumber = models.CharField(max_length=10, unique=True, null=True, blank=True)
    photo = models.URLField(blank=True, null=True)

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='TOURIST')
    verified = models.BooleanField(default=False)
    isActive = models.BooleanField(default=True)

    createdAt = models.DateTimeField(default=timezone.now)
    updatedAt = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'fullName'] 

    groups = models.ManyToManyField(
        Group,
        related_name='tour_user_set',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='tour_user_set',
        blank=True
    )

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email.split('@')[0]
        if self.is_staff or self.is_superuser:
            self.role = 'ADMIN'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

class GuideProfile(models.Model):
    VERIFICATION_STATUS = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='guideProfile'
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)


    licenseNumber = models.CharField(max_length=100,unique=True,help_text="Official guide license number (format varies in Nepal)",default='PENDING-001')

    licenseIssuedBy = models.CharField(max_length=150,help_text="e.g. Nepal Tourism Board", default='Nepal Tourism Board', )
    verificationStatus = models.CharField(max_length=20,choices=VERIFICATION_STATUS,default='PENDING')
    bio = models.TextField(blank=True,help_text="Short introduction for Users and admins")
    createdAt = models.DateTimeField(default=timezone.now)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.fullName

import hashlib
import secrets
from datetime import timedelta

class PasswordResetOTP(models.Model):

    PURPOSE_CHOICES = (
        ('reset_password', 'Reset Password'),
        ('registration', 'Registration Verification'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='otps')
    otp_hash = models.CharField(max_length=64)  # SHA256 hash
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='reset_password')
    createdAt = models.DateTimeField(default=timezone.now)
    expiresAt = models.DateTimeField()
    isUsed = models.BooleanField(default=False)
    reset_token_hash = models.CharField(max_length=64, blank=True, null=True)
    reset_token_expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'password_reset_otp'

    def save(self, *args, **kwargs):
        if not self.expiresAt:
            self.expiresAt = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expiresAt

    def __str__(self):
        return f"OTP for {self.user.email} - {self.purpose}"
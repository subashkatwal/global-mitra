
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import RegexValidator
from django.db import transaction
from accounts.models import GuideProfile, PasswordResetOTP
from accounts.utils import generate_otp, hash_otp, send_otp_email

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    phoneNumber = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(
                regex=r'^\d{10}$',
                message='Phone number must be exactly 10 digits.',
            )
        ],
    )

    class Meta:
        model = User
        # Only email + password + fullName + role required at signup
        # Guide license details collected later in ProfileCompletion step
        fields = ['email', 'password', 'fullName', 'phoneNumber', 'role']
        extra_kwargs = {
            'email':    {'required': True},
            'fullName': {'required': True},
            'role':     {'required': True},
        }

    def create(self, validated_data):
        phone_number = validated_data.pop('phoneNumber', None)
        role         = validated_data.get('role')
        email        = validated_data.get('email')
        password     = validated_data.pop('password')
        validated_data['username'] = email

        with transaction.atomic():
            user = User.objects.create_user(password=password, **validated_data)
            user.isActive = False
            user.verified = False
            if phone_number:
                user.phoneNumber = phone_number
            user.save()

            # Placeholder GuideProfile — real details filled via /guides/profile/complete
            if role == 'GUIDE':
                GuideProfile.objects.create(
                    user=user,
                    licenseNumber='PENDING',
                    licenseIssuedBy='Nepal Tourism Board',
                    verificationStatus='PENDING',
                )

            otp      = generate_otp()
            otp_hash = hash_otp(otp)
            PasswordResetOTP.objects.create(user=user, otp_hash=otp_hash, purpose='registration')
            send_otp_email(user, otp, purpose='registration')

        return user


class VerifyRegistrationOTPSerializer(serializers.Serializer):
    userId = serializers.UUIDField(required=True)
    otp    = serializers.CharField(required=True, max_length=6, min_length=6)

    def validate(self, attrs):
        try:
            user = User.objects.get(id=attrs['userId'])
        except User.DoesNotExist:
            raise serializers.ValidationError({"userId": "User not found."})

        if user.verified:
            raise serializers.ValidationError({"detail": "Already verified. Please login."})

        otp_hash = hash_otp(attrs['otp'])
        try:
            otp_record = PasswordResetOTP.objects.filter(
                user=user, otp_hash=otp_hash, purpose='registration', isUsed=False
            ).latest('createdAt')
        except PasswordResetOTP.DoesNotExist:
            raise serializers.ValidationError({"otp": "Invalid OTP."})

        if otp_record.is_expired():
            raise serializers.ValidationError({"otp": "OTP has expired. Please request a new one."})

        attrs['user']       = user
        attrs['otp_record'] = otp_record
        return attrs

    def create(self, validated_data):
        user       = validated_data['user']
        otp_record = validated_data['otp_record']

        with transaction.atomic():
            otp_record.isUsed = True
            otp_record.save()

            user.verified = True
            if user.role == 'TOURIST':
                user.isActive = True
            else:
                user.isActive = False   # guide waits for admin approval
                if hasattr(user, 'guideProfile'):
                    user.guideProfile.verificationStatus = 'PENDING'
                    user.guideProfile.save()
            user.save()

        return user


class ResendRegistrationOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User not found."})

        if user.verified:
            raise serializers.ValidationError({"detail": "Already verified. Please login."})

        attrs['user'] = user
        return attrs

    def create(self, validated_data):
        user = validated_data['user']
        PasswordResetOTP.objects.filter(user=user, purpose='registration', isUsed=False).update(isUsed=True)
        otp      = generate_otp()
        otp_hash = hash_otp(otp)
        PasswordResetOTP.objects.create(user=user, otp_hash=otp_hash, purpose='registration')
        send_otp_email(user, otp, purpose='registration')
        return user


class TouristProfileCompleteSerializer(serializers.ModelSerializer):
    """
    PATCH /auth/profile/complete
    Tourist fills in phone number and/or uploads a photo after OTP verification.
    Both fields are optional so the user can skip.
    """
    phoneNumber = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(regex=r'^\d{10}$', message='Phone number must be exactly 10 digits.')
        ],
    )
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['phoneNumber', 'photo']

    def update(self, instance, validated_data):
        if 'phoneNumber' in validated_data and validated_data['phoneNumber']:
            instance.phoneNumber = validated_data['phoneNumber']
        if 'photo' in validated_data and validated_data['photo']:
            instance.photo = validated_data['photo']
        instance.save()
        return instance


class GuideProfileCompleteSerializer(serializers.Serializer):
    """
    POST /guides/profile/complete
    Guide fills in their real license details after OTP verification.
    Also optionally updates photo and phone on the User model.
    """
    # Guide-specific (required)
    licenseNumber   = serializers.CharField(required=True)
    licenseIssuedBy = serializers.CharField(required=False, default='Nepal Tourism Board')
    bio             = serializers.CharField(required=False, allow_blank=True)

    # Common profile fields (optional — same as tourist)
    phoneNumber = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(regex=r'^\d{10}$', message='Phone number must be exactly 10 digits.')
        ],
    )
    photo = serializers.ImageField(required=False, allow_null=True)

    def validate_licenseNumber(self, value):
        user = self.context['request'].user
        qs = GuideProfile.objects.filter(licenseNumber=value).exclude(user=user)
        if qs.exists():
            raise serializers.ValidationError("This license number is already registered.")
        return value

    def update(self, instance, validated_data):
        """instance = GuideProfile"""
        user = instance.user

        # Update GuideProfile fields
        instance.licenseNumber   = validated_data.get('licenseNumber', instance.licenseNumber)
        instance.licenseIssuedBy = validated_data.get('licenseIssuedBy', instance.licenseIssuedBy)
        instance.bio             = validated_data.get('bio', instance.bio)
        instance.save()

        # Update User fields
        phone = validated_data.get('phoneNumber')
        photo = validated_data.get('photo')
        if phone:
            user.phoneNumber = phone
        if photo:
            user.photo = photo
        if phone or photo:
            user.save()

        return instance



class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True)
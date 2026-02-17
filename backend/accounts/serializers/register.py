from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import RegexValidator
from django.db import transaction
from accounts.models import GuideProfile, PasswordResetOTP
from accounts.utils import generate_otp, hash_otp, send_otp_email

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration (TOURIST or GUIDE)
    
    - TOURIST: Registers, verifies via OTP, then can login
    - GUIDE: Registers, verifies via OTP, then admin approval required
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
        help_text="Password must be at least 8 characters long"
    )
    
    
    # Guide-specific fields (only required for GUIDE role)
    licenseNumber = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text="Required for GUIDE role. Official guide license number"
    )
    licenseIssuedBy = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text="Required for GUIDE role. e.g. Nepal Tourism Board"
    )
    
    # Custom phone number validation
    phoneNumber = serializers.CharField(
        required=True,
        validators=[
            RegexValidator(
                regex=r'^\d{10}$',
                message='Phone number must be exactly 10 digits.',
                code='invalid_phone'
            )
        ],
        help_text="10-digit phone number (e.g., 9749459199)"
    )
    
    class Meta:
        model = User
        fields = [
            'email',
            'password',
           
            'fullName',
            'phoneNumber',
            'role',
            'licenseNumber',
            'licenseIssuedBy',
        ]
        extra_kwargs = {
            'email': {'required': True},
            'fullName': {'required': True},
            'role': {'required': True},
        }

    def validate(self, attrs):
        role = attrs.get('role')
        if role == 'GUIDE':
            if not attrs.get('licenseNumber'):
                raise serializers.ValidationError({
                    "licenseNumber": "License number is required for guides"
                })
            if not attrs.get('licenseIssuedBy'):
                raise serializers.ValidationError({
                    "licenseIssuedBy": "License issuing authority is required for guides"
                })

        return attrs

    def create(self, validated_data):
        
        license_number = validated_data.pop('licenseNumber', None)
        license_issued_by = validated_data.pop('licenseIssuedBy', None)
        
        role = validated_data.get('role')
        email = validated_data.get('email')
        password = validated_data.pop('password')
        validated_data['username'] = email
        
        # Create user as INACTIVE until OTP verification
        with transaction.atomic():
            user = User.objects.create_user(
                password=password,
                **validated_data
                            )
            user.isActive = False  
            user.verified = False 
            user.save()
            
            if role == 'GUIDE':
                GuideProfile.objects.create(
                    user=user,
                    licenseNumber=license_number,
                    licenseIssuedBy=license_issued_by,
                    verificationStatus='PENDING'
                )
            
            # Generate and send OTP
            otp = generate_otp()
            otp_hash = hash_otp(otp)
            
            PasswordResetOTP.objects.create(
                user=user,
                otp_hash=otp_hash,
                purpose='registration'
            )
            
            # Send OTP email
            send_otp_email(user, otp, purpose='registration')
        
        return user


class VerifyRegistrationOTPSerializer(serializers.Serializer):
    """
    Serializer for verifying registration OTP
    
    - Verifies user email
    - TOURIST: Activates account immediately
    - GUIDE: Sets account as verified but pending admin approval
    """
    userId = serializers.UUIDField(required=True)
    otp = serializers.CharField(required=True, max_length=6, min_length=6)
    
    def validate(self, attrs):
        userId = attrs.get('userId')
        otp = attrs.get('otp')
        
        try:
            user = User.objects.get(id=userId)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "email": "User with this email does not exist."
            })
        
        # Check if already verified
        if user.verified:
            raise serializers.ValidationError({
                "detail": "User is already verified. Please login."
            })
        
        # Verify OTP
        otp_hash = hash_otp(otp)
        try:
            otp_record = PasswordResetOTP.objects.filter(
                user=user,
                otp_hash=otp_hash,
                purpose='registration',
                isUsed=False
            ).latest('createdAt')
        except PasswordResetOTP.DoesNotExist:
            raise serializers.ValidationError({
                "otp": "Invalid OTP."
            })
        
        if otp_record.is_expired():
            raise serializers.ValidationError({
                "otp": "OTP has expired. Please request a new one."
            })
        
        attrs['user'] = user
        attrs['otp_record'] = otp_record
        return attrs
    
    def create(self, validated_data):
        user = validated_data['user']
        otp_record = validated_data['otp_record']
        
        with transaction.atomic():
            # Mark OTP as used
            otp_record.isUsed = True
            otp_record.save()
            

            user.verified = True
            if user.role == 'TOURIST':
                user.isActive = True  
            else: 
                user.isActive = False  
                if hasattr(user, 'guideProfile'):
                    user.guideProfile.verificationStatus = 'PENDING'
                    user.guideProfile.save()
            
            user.save()
        
        return user


class ResendRegistrationOTPSerializer(serializers.Serializer):
    """Serializer for resending registration OTP"""
    email = serializers.EmailField(required=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "email": "User with this email does not exist."
            })
        
        if user.verified:
            raise serializers.ValidationError({
                "detail": "User is already verified. Please login."
            })
        
        attrs['user'] = user
        return attrs
    
    def create(self, validated_data):
        user = validated_data['user']
        
        # Invalidate old OTPs
        PasswordResetOTP.objects.filter(
            user=user,
            purpose='registration',
            isUsed=False
        ).update(isUsed=True)
        
        # Generate and send new OTP
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        
        PasswordResetOTP.objects.create(
            user=user,
            otp_hash=otp_hash,
            purpose='registration'
        )
        
        send_otp_email(user, otp, purpose='registration')
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login with email and password"""
    email = serializers.EmailField(
        required=True,
        help_text="User's registered email address"
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="User's password"
    )


class LogoutSerializer(serializers.Serializer):
    """Serializer for user logout - blacklists the refresh token"""
    refresh = serializers.CharField(
        required=True,
        help_text="Refresh token to be blacklisted"
    )
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for requesting password reset OTP"""
    email = serializers.EmailField(required=True)


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying password reset OTP"""
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, max_length=6, min_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting password with reset token"""
    email = serializers.EmailField(required=True)
    resetToken = serializers.CharField(required=True)
    newPassword = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirmPassword = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['newPassword'] != attrs['confirmPassword']:
            raise serializers.ValidationError({
                "confirmPassword": "Passwords do not match"
            })
        return attrs
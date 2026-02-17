import hashlib
import secrets
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from accounts.models import User, PasswordResetOTP
from accounts.serializers.password_reset import (
    ForgotPasswordSerializer,
    VerifyOTPSerializer,
    ResetPasswordSerializer,
)
from accounts.utils import generate_otp, hash_otp, send_otp_email


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Request password reset OTP",
        description="Send a 6-digit OTP to user's email for password reset. OTP is valid for 10 minutes. Returns success even if email doesn't exist (security best practice).",
        request=ForgotPasswordSerializer,
        responses={
            200: OpenApiResponse(
                description="OTP sent successfully",
                examples=[
                    OpenApiExample(
                        name="Success",
                        value={"detail": "OTP sent to your email. Valid for 10 minutes."}
                    )
                ]
            ),
            400: OpenApiResponse(description="Validation errors"),
            500: OpenApiResponse(description="Email sending failed"),
        },
        tags=["Password Reset"]
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "If this email exists, an OTP has been sent."},
                status=status.HTTP_200_OK
            )

        PasswordResetOTP.objects.filter(
            user=user,
            purpose='reset_password',
            isUsed=False
        ).delete()

        otp = generate_otp()
        otp_hash = hash_otp(otp)

        PasswordResetOTP.objects.create(
            user=user,
            otp_hash=otp_hash,
            purpose='reset_password',
            expiresAt=timezone.now() + timedelta(minutes=10)
        )

        email_sent = send_otp_email(user, otp, purpose='reset_password')

        if not email_sent:
            return Response(
                {"detail": "Failed to send email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"detail": "OTP sent to your email. Valid for 10 minutes."},
            status=status.HTTP_200_OK
        )


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Verify password reset OTP",
        description="Verify the 6-digit OTP and receive a reset token for password reset. Reset token is valid for 15 minutes.",
        request=VerifyOTPSerializer,
        responses={
            200: OpenApiResponse(
                description="OTP verified successfully",
                examples=[
                    OpenApiExample(
                        name="Success",
                        value={
                            "detail": "OTP verified successfully. Use the reset token to set new password.",
                            "resetToken": "a1b2c3d4e5f6..."
                        }
                    )
                ]
            ),
            400: OpenApiResponse(description="Invalid or expired OTP"),
        },
        tags=["Password Reset"]
    )
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp_hash = hash_otp(otp)

        otp_record = PasswordResetOTP.objects.filter(
            user=user,
            otp_hash=otp_hash,
            purpose='reset_password',
            isUsed=False,
            expiresAt__gt=timezone.now()
        ).last()

        if not otp_record:
            return Response(
                {"detail": "Invalid or expired OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        reset_token = secrets.token_hex(32)
        reset_token_hash = hashlib.sha256(reset_token.encode()).hexdigest()

        otp_record.reset_token_hash = reset_token_hash
        otp_record.reset_token_expires_at = timezone.now() + timedelta(minutes=15)
        otp_record.isUsed = True
        otp_record.save()

        return Response({
            "detail": "OTP verified successfully. Use the reset token to set new password.",
            "resetToken": reset_token
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Reset password",
        description="Reset password using the reset token obtained from OTP verification. Token is valid for 15 minutes.",
        request=ResetPasswordSerializer,
        responses={
            200: OpenApiResponse(
                description="Password reset successful",
                examples=[
                    OpenApiExample(
                        name="Success",
                        value={"detail": "Password reset successful. You can now login with your new password."}
                    )
                ]
            ),
            400: OpenApiResponse(description="Invalid or expired reset token / Validation errors"),
        },
        tags=["Password Reset"]
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        reset_token = serializer.validated_data['resetToken']
        new_password = serializer.validated_data['newPassword']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid request"},
                status=status.HTTP_400_BAD_REQUEST
            )

        reset_token_hash = hashlib.sha256(reset_token.encode()).hexdigest()

        otp_record = PasswordResetOTP.objects.filter(
            user=user,
            purpose='reset_password',
            reset_token_hash=reset_token_hash,
            reset_token_expires_at__gt=timezone.now()
        ).last()

        if not otp_record:
            return Response(
                {"detail": "Invalid or expired reset token"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        PasswordResetOTP.objects.filter(
            user=user,
            purpose='reset_password'
        ).delete()

        return Response({
            "detail": "Password reset successful. You can now login with your new password."
        }, status=status.HTTP_200_OK)
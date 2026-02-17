from django.conf import settings
from django.contrib.auth import get_user_model, authenticate

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse

from accounts.serializers.register import (
    RegisterSerializer,
    VerifyRegistrationOTPSerializer,
    ResendRegistrationOTPSerializer,
    LoginSerializer,
    LogoutSerializer,
)
from accounts.serializers.users import UserSerializer
from accounts.utils import send_welcome_email

User = get_user_model()


@extend_schema(
    tags=['Authentication'],
    auth=[],
    summary="Register new user",
    description="""
    Register a new user as TOURIST or GUIDE.
    
    **Flow:**
    1. User submits registration data
    2. System creates INACTIVE account
    3. OTP sent to email
    4. User verifies OTP to activate account
    
    **TOURIST**: After OTP verification, can login immediately.
    
    **GUIDE**: After OTP verification, account is verified but requires admin approval.
    
    **Phone Number**: Must be exactly 10 digits (unique).
    
    **Password**: Must be at least 8 characters.
    """,
    request=RegisterSerializer,
    responses={
        201: OpenApiResponse(
            description="Registration initiated - OTP sent",
            examples=[
                OpenApiExample(
                    "Success",
                    value={
                        "success": True,
                        "message": "Registration successful! Please check your email for OTP verification.",
                        "user": {
                            "id": "uuid",
                            "email": "user@example.com",
                            "fullName": "John Doe",
                            "phoneNumber": "9749459199",
                            "role": "TOURIST",
                            "verified": False,
                            "isActive": False
                        }
                    },
                    response_only=True,
                ),
            ],
        ),
        400: OpenApiResponse(description="Validation error"),
    },
)
class RegisterView(generics.GenericAPIView):
    """
    Register a new user
    
    Creates inactive account and sends OTP for verification.
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        return Response({
            "success": True,
            "message": "Registration successful! Please check your email for OTP verification.",
            "userId": str(user.id), 
            "email": user.email,
            "role": user.role
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['Authentication'],
    auth=[],
    summary="Verify registration OTP",
    description="""
    Verify registration OTP to activate account.
    
    **TOURIST**: Account activated immediately, returns JWT tokens.
    
    **GUIDE**: Account verified but pending admin approval. Cannot login yet.
    """,
    request=VerifyRegistrationOTPSerializer,
    responses={
        200: OpenApiResponse(
            description="Verification successful",
            examples=[
                OpenApiExample(
                    "Tourist Verified",
                    value={
                        "success": True,
                        "message": "Email verified successfully! You can now login.",
                        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "user": {
                            "id": "uuid",
                            "email": "tourist@example.com",
                            "fullName": "John Doe",
                            "role": "TOURIST",
                            "verified": True,
                            "isActive": True
                        }
                    },
                    response_only=True,
                ),
                OpenApiExample(
                    "Guide Verified",
                    value={
                        "success": True,
                        "message": "Email verified successfully! Your guide account is pending admin approval.",
                        "user": {
                            "id": "uuid",
                            "email": "guide@example.com",
                            "fullName": "Jane Guide",
                            "role": "GUIDE",
                            "verified": True,
                            "isActive": False
                        }
                    },
                    response_only=True,
                ),
            ],
        ),
        400: OpenApiResponse(description="Invalid or expired OTP"),
    },
)
class VerifyRegistrationOTPView(generics.GenericAPIView):
    """
    Verify registration OTP and activate account
    """
    serializer_class = VerifyRegistrationOTPSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        response_data = {
            "success": True,
            "message": "Email verified successfully!",
            "user": UserSerializer(user).data
        }
        
        # TOURIST: Provide tokens immediately
        if user.role == 'TOURIST':
            refresh = RefreshToken.for_user(user)
            response_data["message"] = "Email verified successfully! You can now login."
            
        else:
            response_data["message"] = (
                "Email verified successfully! Your guide account is pending admin verification. "
                "You will receive an email notification once your account is approved."
            )
            # Send guide notification email
            try:
                send_welcome_email(user)
            except Exception as e:
                print(f"Error sending welcome email: {str(e)}")
        
        return Response(response_data, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Authentication'],
    auth=[],
    summary="Resend registration OTP",
    description="Resend OTP to user's email for registration verification.",
    request=ResendRegistrationOTPSerializer,
    responses={
        200: OpenApiResponse(
            description="OTP resent",
            examples=[
                OpenApiExample(
                    "Success",
                    value={
                        "success": True,
                        "message": "OTP has been resent to your email."
                    },
                    response_only=True,
                ),
            ],
        ),
        400: OpenApiResponse(description="User not found or already verified"),
    },
)
class ResendRegistrationOTPView(generics.GenericAPIView):
    """
    Resend registration OTP
    """
    serializer_class = ResendRegistrationOTPSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        serializer.save()
        
        return Response({
            "success": True,
            "message": "OTP has been resent to your email."
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Authentication'],
    auth=[],
    summary="User login",
    description="""
    Authenticate user and return JWT tokens.
    
    **Requirements:**
    - Valid email and password
    - Email must be verified (OTP verified)
    - Account must be active
    
    **For TOURIST**: Active immediately after OTP verification.
    **For GUIDE**: Active only after admin approval.
    """,
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(
            description="Login successful",
            examples=[
                OpenApiExample(
                    "Success",
                    value={
                        "success": True,
                        "message": "Login successful",
                        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "user": {
                            "id": "uuid",
                            "email": "user@example.com",
                            "fullName": "John Doe",
                            "role": "TOURIST",
                            "verified": True,
                            "isActive": True
                        }
                    },
                    response_only=True,
                ),
            ],
        ),
        401: OpenApiResponse(description="Invalid credentials"),
        403: OpenApiResponse(
            description="Account issues",
            examples=[
                OpenApiExample(
                    "Not Verified",
                    value={"error": "Please verify your email first. Check your inbox for OTP."},
                    response_only=True,
                ),
                OpenApiExample(
                    "Guide Pending",
                    value={"error": "Your guide account is pending admin verification. Please wait for approval."},
                    response_only=True,
                ),
                OpenApiExample(
                    "Account Inactive",
                    value={"error": "Your account is inactive. Please contact support."},
                    response_only=True,
                ),
            ],
        ),
    },
)
class LoginView(generics.GenericAPIView):
    """
    Authenticate user and return JWT tokens
    """
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(request, email=email, password=password)
        
        if not user:
            return Response(
                {"error": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if email is verified
        if not user.verified and not (user.is_superuser or user.is_staff):
            return Response(
                {"error": "Please verify your email first. Check your inbox for OTP."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if account is active
        if not user.isActive:
            if user.role == 'GUIDE':
                return Response(
                    {
                        "error": "Your guide account is pending admin verification. "
                                "Please wait for approval before logging in."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            else:
                return Response(
                    {"error": "Your account is inactive. Please contact support."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        userData = UserSerializer(user).data
        return Response({
            "success": True,
            "message": "Login successful",
            "user": userData, 
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Authentication'],
    summary="Logout user",
    description="Logout user by blacklisting the refresh token.",
    request=LogoutSerializer,
    responses={
        200: OpenApiResponse(description="Logout successful"),
        400: OpenApiResponse(description="Invalid token"),
    },
)
class LogoutView(generics.GenericAPIView):
    """
    Logout user by blacklisting refresh token
    """
    serializer_class = LogoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh_token = serializer.validated_data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {
                    "success": True,
                    "message": "Successfully logged out"
                },
                status=status.HTTP_200_OK
            )
        except TokenError:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(
    tags=['Authentication'],
    summary="Get current user",
    description="Retrieve currently authenticated user details.",
    responses={
        200: OpenApiResponse(description="Current user details"),
    },
)
class CurrentUserView(APIView):
    """
    Retrieve currently authenticated user details
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            "success": True,
            "user": serializer.data
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Authentication'],
    auth=[],
    summary="Refresh access token",
    description="Obtain new access token using refresh token.",
)
class TokenRefreshView(BaseTokenRefreshView):
    """
    Obtain new access token using refresh token
    """
    pass
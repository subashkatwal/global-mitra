from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from drf_spectacular.utils import extend_schema, OpenApiResponse
from accounts.models import GuideProfile
from profiles.serializers import (
    UserProfileSerializer, UpdateUserProfileSerializer,
    GuideProfileDetailSerializer, UpdateGuideProfileSerializer,
    AdminUserListSerializer, AdminUserDetailSerializer,
    AdminGuideProfileListSerializer, AdminGuideProfileDetailSerializer
)
from globalmitra.permissions import IsAdminUser
from accounts.utils import (
    send_guide_verification_approved_email,
    send_guide_verification_rejected_email
)

User = get_user_model()


# --------------------- User Profile ---------------------
class UserProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        return UpdateUserProfileSerializer if self.request.method == 'PATCH' else UserProfileSerializer

    @extend_schema(
        summary="Get current user's profile",
        responses={200: UserProfileSerializer, 401: OpenApiResponse(description="Unauthorized")},
        tags=["Profile Management – User"]
    )
    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update current user's profile",
        description="Update fullName, phoneNumber, address. Photo must be uploaded via POST /profile/users/me/photo.",
        request=UpdateUserProfileSerializer,
        responses={200: UserProfileSerializer, 400: OpenApiResponse(description="Validation errors"), 401: OpenApiResponse(description="Unauthorized")},
        tags=["Profile Management – User"]
    )
    def patch(self, request):
        serializer = UpdateUserProfileSerializer(
            request.user, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            response_serializer = UserProfileSerializer(request.user, context={'request': request})
            return Response({"success": True, "message": "Profile updated successfully", "data": response_serializer.data}, status=status.HTTP_200_OK)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete current user's account",
        description="Permanently delete the authenticated user's account and all associated data.",
        responses={200: OpenApiResponse(description="Account deleted successfully"), 401: OpenApiResponse(description="Unauthorized")},
        tags=["Profile Management – User"]
    )
    def delete(self, request):
        user  = request.user
        email = user.email
        if user.photo:
            try:
                user.photo.delete(save=False)
            except Exception:
                pass
        user.delete()
        return Response({"success": True, "message": f"Account {email} deleted successfully."}, status=status.HTTP_200_OK)


# --------------------- User Photo Upload ---------------------
class UserPhotoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload profile photo",
        description="Upload a profile photo (JPEG, PNG, WebP, GIF — max 5 MB). Replaces any existing photo. Returns the absolute photo URL.",
        responses={200: OpenApiResponse(description="Photo uploaded successfully"), 400: OpenApiResponse(description="Invalid file or missing photo field"), 401: OpenApiResponse(description="Unauthorized")},
        tags=["Profile Management – User"]
    )
    def post(self, request):
        photo = request.FILES.get('photo')
        if not photo:
            return Response({"success": False, "error": "No photo file provided. Send field name 'photo'."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if photo.content_type not in allowed_types:
            return Response({"success": False, "error": "Invalid file type. Allowed: JPEG, PNG, WebP, GIF."}, status=status.HTTP_400_BAD_REQUEST)

        if photo.size > 5 * 1024 * 1024:
            return Response({"success": False, "error": "File too large. Maximum allowed size is 5 MB."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.photo:
            try:
                user.photo.delete(save=False)
            except Exception:
                pass

        user.photo = photo
        user.save(update_fields=['photo'])
        photo_url = request.build_absolute_uri(user.photo.url)
        return Response({"success": True, "message": "Photo uploaded successfully.", "photo": photo_url}, status=status.HTTP_200_OK)


# --------------------- Guide Profile ---------------------
class GuideProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        return UpdateGuideProfileSerializer if self.request.method == 'PATCH' else GuideProfileDetailSerializer

    @extend_schema(
        summary="Get current guide's profile",
        responses={200: GuideProfileDetailSerializer, 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Only guides can access this endpoint"), 404: OpenApiResponse(description="Guide profile does not exist")},
        tags=["Profile Management – Guide"]
    )
    def get(self, request):
        if request.user.role != 'GUIDE':
            return Response({"success": False, "error": "Only guides can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)
        guide_profile = get_object_or_404(GuideProfile, user=request.user)
        serializer = GuideProfileDetailSerializer(guide_profile, context={'request': request})
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update current guide's profile",
        description="Update bio, licenseIssuedBy, phoneNumber, fullName, photo. licenseNumber and verificationStatus cannot be changed by guides.",
        request=UpdateGuideProfileSerializer,
        responses={200: GuideProfileDetailSerializer, 400: OpenApiResponse(description="Validation errors"), 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Only guides can access this endpoint"), 404: OpenApiResponse(description="Guide profile does not exist")},
        tags=["Profile Management – Guide"]
    )
    def patch(self, request):
        if request.user.role != 'GUIDE':
            return Response({"success": False, "error": "Only guides can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)
        if 'licenseNumber' in request.data:
            return Response({"success": False, "error": "License number cannot be changed directly. Please contact support@globalmitra.com.", "field": "licenseNumber"}, status=status.HTTP_400_BAD_REQUEST)

        guide_profile = get_object_or_404(GuideProfile, user=request.user)
        serializer = UpdateGuideProfileSerializer(guide_profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            response_serializer = GuideProfileDetailSerializer(guide_profile, context={'request': request})
            return Response({"success": True, "message": "Guide profile updated successfully", "data": response_serializer.data}, status=status.HTTP_200_OK)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# --------------------- Admin User ---------------------
class AdminUserListView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = AdminUserListSerializer

    @extend_schema(
        summary="List all users",
        responses={200: AdminUserListSerializer(many=True), 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Admin privileges required")},
        tags=["Admin – Profile Management – Users"]
    )
    def get(self, request):
        users = User.objects.all().order_by('-createdAt')
        serializer = AdminUserListSerializer(users, many=True, context={'request': request})
        return Response({"success": True, "count": users.count(), "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Create a new user",
        description=(
            "Admin creates a new user directly, bypassing the OTP registration flow. "
            "Required: email, password, fullName. "
            "Optional: phoneNumber, role (TOURIST / GUIDE / ADMIN, default TOURIST), verified, isActive."
        ),
        request=AdminUserDetailSerializer,
        responses={
            201: AdminUserDetailSerializer,
            400: OpenApiResponse(description="Validation errors"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
        },
        tags=["Admin – Profile Management – Users"]
    )
    def post(self, request):
        # password is not on AdminUserDetailSerializer — handle separately
        password = request.data.get('password', '').strip()
        if not password:
            return Response(
                {"success": False, "errors": {"password": ["This field is required."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response(
                {"success": False, "errors": {"password": list(e.messages)}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate all other fields with the existing serializer
        serializer = AdminUserDetailSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        vd = serializer.validated_data
        user = User(
            email       = vd.get('email', '').lower(),
            fullName    = vd.get('fullName', ''),
            phoneNumber = vd.get('phoneNumber', None),
            role        = vd.get('role', 'TOURIST'),
            verified    = vd.get('verified', False),
            isActive    = vd.get('isActive', True),
        )
        user.set_password(password)
        user.save()

        response_serializer = AdminUserDetailSerializer(user, context={'request': request})
        return Response(
            {"success": True, "message": "User created successfully.", "data": response_serializer.data},
            status=status.HTTP_201_CREATED
        )


class AdminUserDetailView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = AdminUserDetailSerializer

    @extend_schema(
        summary="Get user by ID",
        responses={200: AdminUserDetailSerializer, 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Admin privileges required"), 404: OpenApiResponse(description="User does not exist")},
        tags=["Admin – Profile Management – Users"]
    )
    def get(self, request, id):
        user = get_object_or_404(User, id=id)
        serializer = AdminUserDetailSerializer(user, context={'request': request})
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update user by ID",
        request=AdminUserDetailSerializer,
        responses={200: AdminUserDetailSerializer, 400: OpenApiResponse(description="Validation errors"), 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Admin privileges required"), 404: OpenApiResponse(description="User does not exist")},
        tags=["Admin – Profile Management – Users"]
    )
    def patch(self, request, id):
        user = get_object_or_404(User, id=id)
        serializer = AdminUserDetailSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "User updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete user by ID",
        responses={200: OpenApiResponse(description="User deleted successfully"), 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Cannot delete superuser or own account"), 404: OpenApiResponse(description="User does not exist")},
        tags=["Admin – Profile Management – Users"]
    )
    def delete(self, request, id):
        user = get_object_or_404(User, id=id)
        if user.is_superuser:
            return Response({"success": False, "error": "Cannot delete superuser account"}, status=status.HTTP_403_FORBIDDEN)
        if user.id == request.user.id:
            return Response({"success": False, "error": "Cannot delete your own account"}, status=status.HTTP_403_FORBIDDEN)
        email = user.email
        if user.photo:
            try:
                user.photo.delete(save=False)
            except Exception:
                pass
        user.delete()
        return Response({"success": True, "message": f"User {email} deleted successfully"}, status=status.HTTP_200_OK)


# --------------------- Admin Guide ---------------------
class AdminGuideListView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = AdminGuideProfileListSerializer

    @extend_schema(
        summary="List all guide profiles",
        responses={200: AdminGuideProfileListSerializer(many=True), 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Admin privileges required")},
        tags=["Admin – Profile Management – Guides"]
    )
    def get(self, request):
        guides = GuideProfile.objects.all().order_by('-createdAt')
        serializer = AdminGuideProfileListSerializer(guides, many=True, context={'request': request})
        return Response({"success": True, "count": guides.count(), "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Create a guide profile",
        description=(
            "Admin creates a GuideProfile for an existing user. "
            "Required: userId (UUID of an existing user), licenseNumber, licenseIssuedBy. "
            "Optional: bio, verificationStatus (PENDING / VERIFIED / REJECTED, default PENDING). "
            "The user's role is automatically promoted to GUIDE if it isn't already."
        ),
        request=AdminGuideProfileDetailSerializer,
        responses={
            201: AdminGuideProfileDetailSerializer,
            400: OpenApiResponse(description="Validation errors"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
            404: OpenApiResponse(description="User does not exist"),
        },
        tags=["Admin – Profile Management – Guides"]
    )
    def post(self, request):
        # Resolve user
        user_id = request.data.get('userId') or request.data.get('user_id')
        if not user_id:
            return Response(
                {"success": False, "errors": {"userId": ["This field is required."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = get_object_or_404(User, id=user_id)

        if GuideProfile.objects.filter(user=user).exists():
            return Response(
                {"success": False, "errors": {"userId": ["A guide profile already exists for this user."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        license_number = request.data.get('licenseNumber', '').strip()
        if not license_number:
            return Response(
                {"success": False, "errors": {"licenseNumber": ["This field is required."]}},
                status=status.HTTP_400_BAD_REQUEST
            )
        if GuideProfile.objects.filter(licenseNumber=license_number).exists():
            return Response(
                {"success": False, "errors": {"licenseNumber": ["A guide with this license number already exists."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        license_issued_by = request.data.get('licenseIssuedBy', '').strip()
        if not license_issued_by:
            return Response(
                {"success": False, "errors": {"licenseIssuedBy": ["This field is required."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Promote role if needed
        if user.role != 'GUIDE':
            user.role = 'GUIDE'
            user.save(update_fields=['role'])

        guide_profile = GuideProfile.objects.create(
            user               = user,
            licenseNumber      = license_number,
            licenseIssuedBy    = license_issued_by,
            bio                = request.data.get('bio', ''),
            verificationStatus = request.data.get('verificationStatus', 'PENDING'),
        )

        response_serializer = AdminGuideProfileDetailSerializer(guide_profile, context={'request': request})
        return Response(
            {"success": True, "message": "Guide profile created successfully.", "data": response_serializer.data},
            status=status.HTTP_201_CREATED
        )


class AdminGuideDetailView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = AdminGuideProfileDetailSerializer

    @extend_schema(
        summary="Get guide profile by ID",
        responses={200: AdminGuideProfileDetailSerializer, 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Admin privileges required"), 404: OpenApiResponse(description="Guide profile does not exist")},
        tags=["Admin – Profile Management – Guides"]
    )
    def get(self, request, id):
        guide_profile = get_object_or_404(GuideProfile, id=id)
        serializer = AdminGuideProfileDetailSerializer(guide_profile, context={'request': request})
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update guide profile by ID (including verification status)",
        request=AdminGuideProfileDetailSerializer,
        responses={200: AdminGuideProfileDetailSerializer, 400: OpenApiResponse(description="Validation errors"), 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Admin privileges required"), 404: OpenApiResponse(description="Guide profile does not exist")},
        tags=["Admin – Profile Management – Guides"]
    )
    def patch(self, request, id):
        guide_profile = get_object_or_404(GuideProfile, id=id)
        serializer = AdminGuideProfileDetailSerializer(guide_profile, data=request.data, partial=True, context={'request': request})

        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        guide_profile = serializer.save()
        user          = guide_profile.user
        new_status    = guide_profile.verificationStatus

        try:
            if new_status == "VERIFIED":
                updated = False
                if not user.isActive:
                    user.isActive = True
                    updated = True
                if not user.verified:
                    user.verified = True
                    updated = True
                if updated:
                    user.save(update_fields=["isActive", "verified"])
                send_guide_verification_approved_email(user)

            elif new_status == "REJECTED":
                if user.isActive:
                    user.isActive = False
                    user.save(update_fields=["isActive"])
                rejection_reason = request.data.get("rejection_reason", "").strip() or "No reason provided"
                send_guide_verification_rejected_email(user, reason=rejection_reason)

        except Exception as email_err:
            print(f"Email notification failed for guide {guide_profile.id}: {email_err}")

        return Response({"success": True, "message": "Guide profile updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete guide profile by ID",
        responses={200: OpenApiResponse(description="Guide profile deleted successfully"), 401: OpenApiResponse(description="Unauthorized"), 403: OpenApiResponse(description="Admin privileges required"), 404: OpenApiResponse(description="Guide profile does not exist")},
        tags=["Admin – Profile Management – Guides"]
    )
    def delete(self, request, id):
        guide_profile = get_object_or_404(GuideProfile, id=id)
        user_email    = guide_profile.user.email
        guide_profile.delete()
        return Response({"success": True, "message": f"Guide profile for {user_email} deleted successfully"}, status=status.HTTP_200_OK)
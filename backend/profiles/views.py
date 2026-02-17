from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from drf_spectacular.utils import extend_schema, OpenApiResponse
from accounts.models import GuideProfile
from profiles.serializers import (
    UserProfileSerializer, UpdateUserProfileSerializer,
    GuideProfileDetailSerializer, UpdateGuideProfileSerializer,
    AdminUserListSerializer, AdminUserDetailSerializer,
    AdminGuideProfileListSerializer, AdminGuideProfileDetailSerializer
)
from globalmitra.permissions import IsAdminUser
User = get_user_model()


class UserProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return UpdateUserProfileSerializer
        return UserProfileSerializer

    @extend_schema(
        summary="Get current user's profile",
        description="Retrieve the authenticated user's profile information",
        responses={
            200: UserProfileSerializer,
            401: OpenApiResponse(description="Unauthorized"),
        },
        tags=["Profile Management – User"]
    )
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update current user's profile",
        description="Update the authenticated user's profile. Only fullName, phoneNumber, and photo can be updated.",
        request=UpdateUserProfileSerializer,
        responses={
            200: UserProfileSerializer,
            400: OpenApiResponse(description="Validation errors"),
            401: OpenApiResponse(description="Unauthorized"),
        },
        tags=["Profile Management – User"]
    )
    def patch(self, request):
        serializer = UpdateUserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = UserProfileSerializer(request.user)
            return Response({
                "success": True,
                "message": "Profile updated successfully",
                "data": response_serializer.data
            }, status=status.HTTP_200_OK)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class GuideProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return UpdateGuideProfileSerializer
        return GuideProfileDetailSerializer

    @extend_schema(
        summary="Get current guide's profile",
        description="Retrieve the authenticated guide's profile including user information and guide-specific details. Only accessible by users with GUIDE role.",
        responses={
            200: GuideProfileDetailSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Only guides can access this endpoint"),
            404: OpenApiResponse(description="Guide profile does not exist"),
        },
        tags=["Profile Management – Guide"]
    )
    def get(self, request):
        if request.user.role != 'GUIDE':
            return Response({"success": False, "error": "Only guides can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)

        guide_profile = get_object_or_404(GuideProfile, user=request.user)
        serializer = GuideProfileDetailSerializer(guide_profile)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update current guide's profile",
        description="Update the authenticated guide's bio. License information cannot be modified by guides. Only accessible by users with GUIDE role.",
        request=UpdateGuideProfileSerializer,
        responses={
            200: GuideProfileDetailSerializer,
            400: OpenApiResponse(description="Validation errors"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Only guides can access this endpoint"),
            404: OpenApiResponse(description="Guide profile does not exist"),
        },
        tags=["Profile Management – Guide"]
    )
    def patch(self, request):
        if request.user.role != 'GUIDE':
            return Response({"success": False, "error": "Only guides can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)

        guide_profile = get_object_or_404(GuideProfile, user=request.user)
        serializer = UpdateGuideProfileSerializer(guide_profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = GuideProfileDetailSerializer(guide_profile)
            return Response({
                "success": True,
                "message": "Guide profile updated successfully",
                "data": response_serializer.data
            }, status=status.HTTP_200_OK)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AdminUserListView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserListSerializer

    @extend_schema(
        summary="List all users",
        description="Get a list of all registered users. Admin only.",
        responses={
            200: AdminUserListSerializer(many=True),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
        },
        tags=["Admin – Profile Management – Users"]
    )
    def get(self, request):
        users = User.objects.all().order_by('-createdAt')
        serializer = AdminUserListSerializer(users, many=True)
        return Response({"success": True, "count": users.count(), "data": serializer.data}, status=status.HTTP_200_OK)


class AdminUserDetailView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserDetailSerializer

    @extend_schema(
        summary="Get user by ID",
        description="Retrieve detailed information about a specific user. Admin only.",
        responses={
            200: AdminUserDetailSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
            404: OpenApiResponse(description="User does not exist"),
        },
        tags=["Admin – Profile Management – Users"]
    )
    def get(self, request, id):
        user = get_object_or_404(User, id=id)
        serializer = AdminUserDetailSerializer(user)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update user by ID",
        description="Update a specific user's information. Admin can update: fullName, phoneNumber, photo, role, verified, isActive. Admin only.",
        request=AdminUserDetailSerializer,
        responses={
            200: AdminUserDetailSerializer,
            400: OpenApiResponse(description="Validation errors"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
            404: OpenApiResponse(description="User does not exist"),
        },
        tags=["Admin – Profile Management – Users"]
    )
    def patch(self, request, id):
        user = get_object_or_404(User, id=id)
        serializer = AdminUserDetailSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "User updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete user by ID",
        description="Permanently delete a user account. Cannot delete superuser accounts or self. Admin only.",
        responses={
            200: OpenApiResponse(description="User deleted successfully"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Cannot delete superuser or own account"),
            404: OpenApiResponse(description="User does not exist"),
        },
        tags=["Admin – Profile Management – Users"]
    )
    def delete(self, request, id):
        user = get_object_or_404(User, id=id)

        if user.is_superuser:
            return Response({"success": False, "error": "Cannot delete superuser account"}, status=status.HTTP_403_FORBIDDEN)

        if user.id == request.user.id:
            return Response({"success": False, "error": "Cannot delete your own account"}, status=status.HTTP_403_FORBIDDEN)

        email = user.email
        user.delete()
        return Response({"success": True, "message": f"User {email} deleted successfully"}, status=status.HTTP_200_OK)


class AdminGuideListView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminGuideProfileListSerializer

    @extend_schema(
        summary="List all guide profiles",
        description="Get a list of all guide profiles with basic information. Admin only.",
        responses={
            200: AdminGuideProfileListSerializer(many=True),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
        },
        tags=["Admin – Profile Management – Guides"]
    )
    def get(self, request):
        guides = GuideProfile.objects.all().order_by('-createdAt')
        serializer = AdminGuideProfileListSerializer(guides, many=True)
        return Response({"success": True, "count": guides.count(), "data": serializer.data}, status=status.HTTP_200_OK)


class AdminGuideDetailView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminGuideProfileDetailSerializer

    @extend_schema(
        summary="Get guide profile by ID",
        description="Retrieve detailed information about a specific guide profile including user information. Admin only.",
        responses={
            200: AdminGuideProfileDetailSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
            404: OpenApiResponse(description="Guide profile does not exist"),
        },
        tags=["Admin – Profile Management – Guides"]
    )
    def get(self, request, id):
        guide_profile = get_object_or_404(GuideProfile, id=id)
        serializer = AdminGuideProfileDetailSerializer(guide_profile)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Update guide profile by ID",
        description="Update a specific guide profile. Admin can update: licenseNumber, licenseIssuedBy, verificationStatus, bio. Admin only.",
        request=AdminGuideProfileDetailSerializer,
        responses={
            200: AdminGuideProfileDetailSerializer,
            400: OpenApiResponse(description="Validation errors"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
            404: OpenApiResponse(description="Guide profile does not exist"),
        },
        tags=["Admin – Profile Management – Guides"]
    )
    def patch(self, request, id):
        guide_profile = get_object_or_404(GuideProfile, id=id)
        serializer = AdminGuideProfileDetailSerializer(guide_profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Guide profile updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete guide profile by ID",
        description="Permanently delete a guide profile. This does not delete the associated user account. Admin only.",
        responses={
            200: OpenApiResponse(description="Guide profile deleted successfully"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Admin privileges required"),
            404: OpenApiResponse(description="Guide profile does not exist"),
        },
        tags=["Admin – Profile Management – Guides"]
    )
    def delete(self, request, id):
        guide_profile = get_object_or_404(GuideProfile, id=id)
        user_email = guide_profile.user.email
        guide_profile.delete()
        return Response({"success": True, "message": f"Guide profile for {user_email} deleted successfully"}, status=status.HTTP_200_OK)
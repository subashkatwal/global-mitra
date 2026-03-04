
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from accounts.serializers.register import TouristProfileCompleteSerializer, GuideProfileCompleteSerializer
from accounts.models import GuideProfile


class ProfileCompleteView(APIView):
    """
    PATCH /auth/profile/complete
    Handles photo + phone update for ANY user (tourist or guide).
    Accepts multipart/form-data so photo uploads work.
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        serializer = TouristProfileCompleteSerializer(
            instance=request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            "success": True,
            "message": "Profile updated successfully.",
            "user": {
                "id":          str(user.id),
                "email":       user.email,
                "fullName":    user.fullName,
                "phoneNumber": user.phoneNumber,
                "photo":       user.photo.name if user.photo else None,
                "role":        user.role,
                "verified":    user.verified,
            }
        }, status=status.HTTP_200_OK)


class GuideProfileCompleteView(APIView):
    """
    PATCH /guides/profile/complete
    Guide submits real license number, licenseIssuedBy, bio.
    Also accepts photo + phoneNumber (same as tourist).
    Accepts multipart/form-data.
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        if request.user.role != 'GUIDE':
            return Response(
                {"detail": "Only guides can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            guide_profile = request.user.guideProfile
        except GuideProfile.DoesNotExist:
            return Response(
                {"detail": "Guide profile not found. Please contact support."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GuideProfileCompleteSerializer(
            instance=guide_profile,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        guide_profile = serializer.save()
        user          = guide_profile.user

        return Response({
            "success": True,
            "message": "Guide profile completed successfully. Pending admin verification.",
            "user": {
                "id":          str(user.id),
                "email":       user.email,
                "fullName":    user.fullName,
                "phoneNumber": user.phoneNumber,
                "photo":       user.photo.name if user.photo else None,
                "role":        user.role,
                "verified":    user.verified,
            },
            "guideProfile": {
                "id":                 str(guide_profile.id),
                "licenseNumber":      guide_profile.licenseNumber,
                "licenseIssuedBy":    guide_profile.licenseIssuedBy,
                "bio":                guide_profile.bio,
                "verificationStatus": guide_profile.verificationStatus,
            }
        }, status=status.HTTP_200_OK)

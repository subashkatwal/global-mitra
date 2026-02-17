from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from accounts.models import GuideProfile
from accounts.serializers.users import UserSerializer
from accounts.serializers.admin_guide import ApproveRejectGuideSerializer, GuideApprovalResponseSerializer

Users = get_user_model()


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


@extend_schema(
    tags=['Admin - Guide Management'],
    summary="List pending guide verifications",
    description="Get all guide accounts pending admin approval. Requires admin/staff permissions.",
    responses={
        200: UserSerializer(many=True),
        403: OpenApiResponse(description="Not authorized - Admin only"),
    },
)
class PendingGuidesListView(generics.ListAPIView):
    """
    List all guides pending admin verification
    
    Filters:
    - Role: GUIDE
    - Verification Status: PENDING
    - Active: False (not yet approved)
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        # Get guides with PENDING status that are not yet active
        return Users.objects.filter(
            role='GUIDE',
            isActive=False,
        ).select_related('guideProfile').filter(
            guideProfile__verificationStatus='PENDING'
        ).order_by('-createdAt')


@extend_schema(
    tags=['Admin - Guide Management'],
    summary="Approve or reject guide application",
    description="""
    Admin endpoint to approve or reject guide account applications.
    
    **Actions:**
    - `approve`: Activates guide account, allows login
    - `reject`: Keeps account inactive, sends rejection email
    
    **Permissions:** Admin/Staff only
    
    **Email Notifications:** Automatic email sent to guide with decision
    """,
    request=ApproveRejectGuideSerializer,
    responses={
        200: OpenApiResponse(
            description="Action successful",
            examples=[
                OpenApiExample(
                    "Guide Approved",
                    value={
                        "success": True,
                        "message": "Guide approved successfully. User can now login.",
                        "user": {
                            "id": "uuid-here",
                            "email": "guide@example.com",
                            "fullName": "John Guide",
                            "role": "GUIDE",
                            "isActive": True,
                            "guideProfile": {
                                "verificationStatus": "VERIFIED",
                                "licenseNumber": "GUIDE12345"
                            }
                        }
                    },
                    response_only=True,
                ),
                OpenApiExample(
                    "Guide Rejected",
                    value={
                        "success": True,
                        "message": "Guide rejected.",
                        "user": {
                            "id": "uuid-here",
                            "email": "guide@example.com",
                            "fullName": "John Guide",
                            "role": "GUIDE",
                            "isActive": False,
                            "guideProfile": {
                                "verificationStatus": "REJECTED",
                                "licenseNumber": "GUIDE12345"
                            }
                        }
                    },
                    response_only=True,
                ),
            ],
        ),
        400: OpenApiResponse(description="Invalid action or guide not eligible"),
        403: OpenApiResponse(description="Not authorized - Admin only"),
        404: OpenApiResponse(description="Guide not found"),
    },
)
class ApproveRejectGuideView(APIView):
    """
    Admin endpoint to approve or reject guide accounts
    
    Requires admin/staff permissions
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        # Validate request data
        serializer = ApproveRejectGuideSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '')
        
        # Get guide user
        try:
            user = Users.objects.select_related('guideProfile').get(
                id=user_id,
                role='GUIDE'
            )
        except Users.DoesNotExist:
            return Response(
                {"error": "Guide not found or user is not a guide."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if guide has a profile
        if not hasattr(user, 'guideProfile'):
            return Response(
                {"error": "Guide profile not found."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        guide_profile = user.guideProfile
        
        # Check if already processed
        if guide_profile.verificationStatus in ['VERIFIED', 'REJECTED']:
            return Response(
                {
                    "error": f"Guide has already been {guide_profile.verificationStatus.lower()}. "
                            f"Current status: {guide_profile.verificationStatus}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process action
        if action == 'approve':
            user.isActive = True
            guide_profile.verificationStatus = 'VERIFIED'
            message = "Guide approved successfully. User can now login."
            email_subject = '✅ Guide Account Approved - Tourist Alert System'
            email_body = f"""
Hi {user.fullName},

Great news! Your guide account has been approved! 🎉

📋 Application Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: {user.email}
License Number: {guide_profile.licenseNumber}
Status: VERIFIED ✓

✅ What You Can Do Now:
- Login to your account
- Complete your profile
- Contribute to reports and incidents
- Connect with tourists

🔐 Login Here:
Visit our platform and use your registered email and password to login.

Thank you for joining Tourist Alert System!

Best regards,
Tourist Alert System Team
"""
        else:  # reject
            user.isActive = False
            guide_profile.verificationStatus = 'REJECTED'
            message = "Guide application rejected."
            email_subject = '❌ Guide Application Update - Tourist Alert System'
            email_body = f"""
Hi {user.fullName},

Thank you for your interest in becoming a guide with Tourist Alert System.

After careful review, we regret to inform you that we cannot approve your application at this time.

{f'Reason: {reason}' if reason else ''}

📋 Application Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: {user.email}
License Number: {guide_profile.licenseNumber}
Status: NOT APPROVED

If you believe this is an error or would like to reapply in the future, please contact our support team.

Best regards,
Tourist Alert System Team
"""
        
        # Save changes
        user.save()
        guide_profile.save()
        
        # Send email notification
        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't fail the approval process
            print(f"Error sending {action} email to {user.email}: {str(e)}")
        
        return Response({
            "success": True,
            "message": message,
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Admin - Guide Management'],
    summary="List all guides",
    description="Get all guide accounts with optional filtering by verification status.",
    responses={
        200: UserSerializer(many=True),
        403: OpenApiResponse(description="Not authorized - Admin only"),
    },
)
class AllGuidesListView(generics.ListAPIView):
    """
    List all guide accounts (admin only)
    
    Query parameters:
    - status: Filter by verification status (PENDING, VERIFIED, REJECTED)
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        queryset = Users.objects.filter(
            role='GUIDE'
        ).select_related('guideProfile').order_by('-createdAt')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(
                guideProfile__verificationStatus=status_filter.upper()
            )
        
        return queryset


@extend_schema(
    tags=['Admin - Guide Management'],
    summary="Get guide details",
    description="Get detailed information about a specific guide account.",
    responses={
        200: UserSerializer,
        403: OpenApiResponse(description="Not authorized - Admin only"),
        404: OpenApiResponse(description="Guide not found"),
    },
)
class GuideDetailView(generics.RetrieveAPIView):
    """
    Get detailed information about a specific guide
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'

    def get_queryset(self):
        return Users.objects.filter(
            role='GUIDE'
        ).select_related('guideProfile')
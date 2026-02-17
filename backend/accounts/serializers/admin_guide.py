from rest_framework import serializers
from django.contrib.auth import get_user_model

Users = get_user_model()


class ApproveRejectGuideSerializer(serializers.Serializer):
    """Serializer for approving or rejecting guide accounts"""
    action = serializers.ChoiceField(
        choices=['approve', 'reject'],
        required=True,
        help_text="Action to perform: 'approve' to activate guide account, 'reject' to decline"
    )
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Optional reason for rejection (sent in email to guide)"
    )


class GuideApprovalResponseSerializer(serializers.Serializer):
    """Response serializer for guide approval/rejection"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    user = serializers.DictField()
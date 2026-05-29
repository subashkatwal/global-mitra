from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from accounts.models import User, GuideProfile, PasswordResetOTP
# from destinations.models import Destination
# from socials.models import Post, Comment, Bookmark, Share
# from reports.models import IncidentReport, AlertBroadcast
from django.utils.html import format_html
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'email', 'fullName', 'role', 'photo_preview', 'is_active', 'is_staff', 'is_superuser', 'verified')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('id', 'email', 'fullName', 'phoneNumber')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions')

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {
            'fields': ('fullName', 'phoneNumber', 'photo', 'photo_preview_detail', 'address', 'role', 'verified', 'isActive'),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Profile', {
            'fields': ('fullName', 'phoneNumber', 'photo', 'address', 'role'),
        }),
    )

    readonly_fields = ('photo_preview_detail',)

    def photo_preview(self, obj):
        if obj.photo:
            return format_html(
                '<img src="{}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb;" />',
                obj.photo.url
            )
        return format_html(
            '<div style="width:36px;height:36px;border-radius:50%;background:#6366f1;'
            'display:flex;align-items:center;justify-content:center;'
            'color:white;font-weight:bold;font-size:14px;">{}</div>',
            (obj.fullName or obj.email or '?')[0].upper()
        )
    photo_preview.short_description = 'Photo'

    def photo_preview_detail(self, obj):
        if obj.photo:
            return format_html(
                '<img src="{}" style="width:100px;height:100px;border-radius:12px;object-fit:cover;border:2px solid #e5e7eb;" />'
                '<p style="margin-top:6px;font-size:12px;color:#6b7280;">Current photo — upload a new one below to replace it.</p>',
                obj.photo.url
            )
        return format_html('<p style="color:#9ca3af;font-size:12px;">No photo uploaded yet.</p>')
    photo_preview_detail.short_description = 'Current Photo'

@admin.register(GuideProfile)
class GuideProfileAdmin(admin.ModelAdmin):
    list_display = ('id','user', 'licenseNumber', 'verificationStatus')
    list_filter = ('verificationStatus',)
    search_fields = ('id','user__email', 'licenseNumber')
    readonly_fields = ('createdAt', 'updatedAt')

    actions = ['approve_guides', 'reject_guides']

    def approve_guides(self, request, queryset):
        for guide in queryset:
            guide.verificationStatus = 'VERIFIED'
            guide.user.isActive = True
            guide.user.save()
            guide.save()
        self.message_user(request, f"{queryset.count()} guide(s) approved successfully.")
    approve_guides.short_description = "Approve selected guides"

    def reject_guides(self, request, queryset):
        for guide in queryset:
            guide.verificationStatus = 'REJECTED'
            guide.user.isActive = False
            guide.user.save()
            guide.save()
        self.message_user(request, f"{queryset.count()} guide(s) rejected successfully.")
    reject_guides.short_description = "Reject selected guides"

@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'isUsed', 'createdAt', 'expiresAt')
    list_filter = ('purpose', 'isUsed')
    search_fields = ('user__email',)
    readonly_fields = ('createdAt', 'expiresAt')


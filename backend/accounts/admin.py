from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from accounts.models import User, GuideProfile, PasswordResetOTP
from destinations.models import Destination
from socials.models import Post, Comment, Bookmark, Share
from reports.models import IncidentReport, AlertBroadcast


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id','email', 'fullName', 'role', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('id','email', 'fullName', 'phoneNumber')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions',)

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


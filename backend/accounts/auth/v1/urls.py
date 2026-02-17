from django.urls import path
from accounts.views.register import (
    RegisterView,
    VerifyRegistrationOTPView,
    ResendRegistrationOTPView,
    LoginView,
    LogoutView,
    CurrentUserView,
    TokenRefreshView,
)

from accounts.views.admin_guide import (
    PendingGuidesListView,
    ApproveRejectGuideView,
    AllGuidesListView,
    GuideDetailView,
)
from accounts.views.password_reset import (
    ForgotPasswordView,
    VerifyOTPView,
    ResetPasswordView,
)
urlpatterns = [
    # Authentication
    path('/register', RegisterView.as_view(), name='register'),
    path('/verify-otp', VerifyRegistrationOTPView.as_view(), name='verify-otp'),
    path('/resend-otp', ResendRegistrationOTPView.as_view(), name='resend-otp'),
    path('/login', LoginView.as_view(), name='login'),
    path('/logout', LogoutView.as_view(), name='logout'),
    path('/refresh', TokenRefreshView.as_view(), name='token-refresh'),
    path('/me', CurrentUserView.as_view(), name='current-user'),
    
    path('/guides/pending', PendingGuidesListView.as_view(), name='pending_guides'),
    path('/guides', AllGuidesListView.as_view(), name='all_guides'),
    path('/guides/<uuid:user_id>', GuideDetailView.as_view(), name='guide_detail'),
    path('/guides/<uuid:user_id>/approve', ApproveRejectGuideView.as_view(), name='approve_reject_guide'),
    path('/forgot-password', ForgotPasswordView.as_view(), name='forgot-password'),
    path('/verify-reset-otp', VerifyOTPView.as_view(), name='verify-reset-otp'),
    path('/reset-password', ResetPasswordView.as_view(), name='reset-password'),
]
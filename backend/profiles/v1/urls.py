from django.urls import path
from profiles.views import (
    UserProfileView,
    GuideProfileView,
    AdminUserListView,
    AdminUserDetailView,
    AdminGuideListView,
    AdminGuideDetailView,
)

urlpatterns = [
    path('/users/me', UserProfileView.as_view(), name='user-profile'),
    path('/guides/me', GuideProfileView.as_view(), name='guide-profile'),
    path('/users', AdminUserListView.as_view(), name='admin-user-list'),
    path('/users/<uuid:id>', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('/guides/', AdminGuideListView.as_view(), name='admin-guide-list'),
    path('/guides/<uuid:id>', AdminGuideDetailView.as_view(), name='admin-guide-detail'),
]
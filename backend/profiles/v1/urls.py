from django.urls import path
from django.conf.urls.static import static
from django.conf import settings
from profiles.views import (
    UserProfileView,
    GuideProfileView,
    AdminUserListView,
    AdminUserDetailView,
    AdminGuideListView,
    AdminGuideDetailView,
    UserPhotoUploadView
)
from profiles.Profilecompletion import ProfileCompleteView, GuideProfileCompleteView
urlpatterns = [
    path('/complete',     ProfileCompleteView.as_view(), name='profile-complete'),       
    path('/complete/guide', GuideProfileCompleteView.as_view(), name='guide-profile-complete'), 
    path('/users/me', UserProfileView.as_view(), name='user-profile'),
    path('/guides/me', GuideProfileView.as_view(), name='guide-profile'),
    path('/users', AdminUserListView.as_view(), name='admin-user-list'),
    path('/users/<uuid:id>', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('/guides/', AdminGuideListView.as_view(), name='admin-guide-list'),
    path('/guides/<uuid:id>', AdminGuideDetailView.as_view(), name='admin-guide-detail'),
     path('api/v1/profile/users/me/photo', UserPhotoUploadView.as_view()),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
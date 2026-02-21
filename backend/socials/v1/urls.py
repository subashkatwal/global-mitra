from django.urls import path
from socials.views import (
    PostListCreateView, PostDetailView,
    PostBookmarkView, MyBookmarksView, PostShareView,
    CommentListCreateView, CommentDetailView
)

app_name = "socials"

urlpatterns = [

    path("/posts", PostListCreateView.as_view(), name="post-list-create"),
    path("/posts/<uuid:pk>", PostDetailView.as_view(), name="post-detail"),
    path("/posts/<uuid:pk>/bookmark", PostBookmarkView.as_view(), name="post-bookmark"),
    path("/posts/my-bookmarks", MyBookmarksView.as_view(), name="my-bookmarks"),
    path("/posts/<uuid:pk>/share", PostShareView.as_view(), name="post-share"),
    path("/posts/<uuid:pk>/comments", CommentListCreateView.as_view(), name="comment-list-create"),
    path("/comments/<uuid:pk>", CommentDetailView.as_view(), name="comment-detail"),
]
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from django.db.models import Count
from socials.models import Post, Comment, Bookmark, Share
from socials.serializers import PostSerializer, CommentSerializer, ShareSerializer
from globalmitra.permissions import IsOwnerOrReadOnly



@extend_schema(
    tags=["Posts"],
    description="List all tourism posts or create a new one. Anyone can view, authenticated users can post.",
    responses={
        200: PostSerializer(many=True),
        201: PostSerializer,
        401: OpenApiResponse(description="Authentication required.")
    }
)
class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return Post.objects.select_related('user').prefetch_related(
            'comments', 'bookmarkedBy', 'sharedBy'
        ).order_by('-createdAt')

    def get_serializer_context(self):
        return {'request': self.request}

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'message': 'Posts retrieved successfully.',
            'count': queryset.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'message': 'Post created successfully.',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["Posts"],
    description="Retrieve, update or delete a post. Only owner can update/delete.",
    responses={
        200: PostSerializer,
        403: OpenApiResponse(description="Not your post."),
        404: OpenApiResponse(description="Post not found.")
    }
)
class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.select_related('user').prefetch_related('comments', 'bookmarkedBy', 'sharedBy')
    serializer_class = PostSerializer
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['get', 'patch', 'delete']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_serializer_context(self):
        return {'request': self.request}

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response({'message': 'Post retrieved successfully.', 'data': serializer.data})

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Post updated successfully.', 'data': serializer.data})

    def delete(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({'message': 'Post deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=["Posts"],
    description="Toggle bookmark on a post. First click bookmarks, second click removes bookmark.",
    parameters=[
        OpenApiParameter(name='pk', description='UUID of the post', required=True, type=str, location=OpenApiParameter.PATH)
    ],
    responses={
        200: OpenApiResponse(description="Bookmark removed."),
        201: OpenApiResponse(description="Post bookmarked."),
        404: OpenApiResponse(description="Post not found.")
    }
)
class PostBookmarkView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'message': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            bookmark.delete()
            return Response({
                'message': 'Bookmark removed.',
                'isBookmarked': False,
                'bookmarkCount': post.bookmarkedBy.count()
            }, status=status.HTTP_200_OK)

        return Response({
            'message': 'Post bookmarked.',
            'isBookmarked': True,
            'bookmarkCount': post.bookmarkedBy.count()
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["Posts"],
    description="Get all posts bookmarked by the logged-in user.",
    responses={200: PostSerializer(many=True)}
)
class MyBookmarksView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(bookmarkedBy__user=self.request.user).select_related('user').prefetch_related(
            'comments', 'bookmarkedBy', 'sharedBy'
        ).order_by('-bookmarkedBy__createdAt')

    def get_serializer_context(self):
        return {'request': self.request}

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'message': 'Bookmarked posts retrieved successfully.',
            'count': queryset.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=["Posts"],
    description="Share a post on a platform (facebook, twitter, whatsapp, etc.) or get share stats.",
    parameters=[
        OpenApiParameter(name='pk', description='UUID of the post', required=True, type=str, location=OpenApiParameter.PATH)
    ],
    responses={
        200: OpenApiResponse(description="Share stats returned."),
        201: ShareSerializer,
        404: OpenApiResponse(description="Post not found.")
    }
)
class PostShareView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShareSerializer

    def get_post(self, pk):
        try:
            return Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return None

    def get(self, request, pk):
        post = self.get_post(pk)
        if not post:
            return Response({'message': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

        shares = post.sharedBy.select_related('user').order_by('-createdAt')
        platform_stats = list(shares.values('platform').annotate(count=Count('id')).order_by('-count'))
        return Response({
            'message': 'Share stats retrieved successfully.',
            'totalShares': shares.count(),
            'platformStats': platform_stats,
            'data': ShareSerializer(shares, many=True, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        post = self.get_post(pk)
        if not post:
            return Response({'message': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ShareSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, post=post)
        return Response({
            'message': f"Shared on {serializer.validated_data['platform']} successfully.",
            'shareUrl': serializer.data['shareUrl'],
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────
# COMMENTS
# ──────────────────────────────────────────
@extend_schema(
    tags=["Comments"],
    description="List all comments for a post or add a new comment.",
    parameters=[
        OpenApiParameter(name='pk', description='UUID of the post', required=True, type=str, location=OpenApiParameter.PATH)
    ],
    responses={
        200: CommentSerializer(many=True),
        201: CommentSerializer,
        404: OpenApiResponse(description="Post not found.")
    }
)
class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs['pk']).select_related('user').order_by('-createdAt')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response({'message': 'No comments found for this post.', 'data': []}, status=status.HTTP_200_OK)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'message': 'Comments retrieved successfully.',
            'count': queryset.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        try:
            post = Post.objects.get(pk=self.kwargs['pk'])
        except Post.DoesNotExist:
            return Response({'message': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, post=post)
        return Response({
            'message': 'Comment added successfully.',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["Comments"],
    description="Retrieve, update or delete a comment. Only owner can update/delete.",
    responses={
        200: CommentSerializer,
        403: OpenApiResponse(description="Not your comment."),
        404: OpenApiResponse(description="Comment not found.")
    }
)
class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.select_related('user')
    serializer_class = CommentSerializer
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['get', 'patch', 'delete']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_serializer_context(self):
        return {'request': self.request}

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response({'message': 'Comment retrieved successfully.', 'data': serializer.data})

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Comment updated successfully.', 'data': serializer.data})

    def delete(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({'message': 'Comment deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from .models import Post, Comment, Bookmark, Share
from .serializers import PostSerializer, CommentSerializer, BookmarkSerializer, ShareSerializer
from .permissions import IsOwnerOrReadOnly


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Post model with all CRUD operations
    
    Endpoints:
    - GET /api/posts/ - List all posts
    - GET /api/posts/{id}/ - Retrieve a specific post
    - POST /api/posts/ - Create a new post (authenticated users only)
    - PATCH /api/posts/{id}/ - Update a post (owner only)
    - DELETE /api/posts/{id}/ - Delete a post (owner only)
    """
    queryset = Post.objects.all().select_related('user', 'destination').prefetch_related('comments', 'bookmarkedBy', 'sharedBy')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by destination
        destination_id = self.request.query_params.get('destination_id')
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by authenticated user's posts
        my_posts = self.request.query_params.get('my_posts')
        if my_posts and self.request.user.is_authenticated:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset.order_by('-createdAt')

    def list(self, request, *args, **kwargs):
        """GET /api/posts/ - List all posts"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'count': queryset.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        """GET /api/posts/{id}/ - Retrieve a specific post"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """POST /api/posts/ - Create a new post"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Post created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        """PATCH /api/posts/{id}/ - Update a post"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Post updated successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/posts/{id}/ - Delete a post"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Post deleted successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """GET /api/posts/{id}/comments/ - Get all comments for a post"""
        post = self.get_object()
        comments = post.comments.all().order_by('-createdAt')
        serializer = CommentSerializer(comments, many=True)
        return Response({
            'success': True,
            'count': comments.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def bookmarks(self, request, pk=None):
        """GET /api/posts/{id}/bookmarks/ - Get all bookmarks for a post"""
        post = self.get_object()
        bookmarks = post.bookmarkedBy.all().order_by('-createdAt')
        serializer = BookmarkSerializer(bookmarks, many=True)
        return Response({
            'success': True,
            'count': bookmarks.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Comment model with all CRUD operations
    
    Endpoints:
    - GET /api/comments/ - List all comments
    - GET /api/comments/{id}/ - Retrieve a specific comment
    - POST /api/comments/ - Create a new comment (authenticated users only)
    - PATCH /api/comments/{id}/ - Update a comment (owner only)
    - DELETE /api/comments/{id}/ - Delete a comment (owner only)
    """
    queryset = Comment.objects.all().select_related('user', 'post')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by post
        post_id = self.request.query_params.get('post_id')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('-createdAt')

    def list(self, request, *args, **kwargs):
        """GET /api/comments/ - List all comments"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'count': queryset.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        """GET /api/comments/{id}/ - Retrieve a specific comment"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """POST /api/comments/ - Create a new comment"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Comment created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        """PATCH /api/comments/{id}/ - Update a comment"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Comment updated successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/comments/{id}/ - Delete a comment"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Comment deleted successfully'
        }, status=status.HTTP_200_OK)


class BookmarkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Bookmark model with all CRUD operations
    
    Endpoints:
    - GET /api/bookmarks/ - List all bookmarks
    - GET /api/bookmarks/{id}/ - Retrieve a specific bookmark
    - POST /api/bookmarks/ - Create a new bookmark (authenticated users only)
    - PATCH /api/bookmarks/{id}/ - Update a bookmark (owner only)
    - DELETE /api/bookmarks/{id}/ - Delete a bookmark (owner only)
    """
    queryset = Bookmark.objects.all().select_related('user', 'post')
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by authenticated user's bookmarks
        my_bookmarks = self.request.query_params.get('my_bookmarks')
        if my_bookmarks and self.request.user.is_authenticated:
            queryset = queryset.filter(user=self.request.user)
        
        # Filter by post
        post_id = self.request.query_params.get('post_id')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('-createdAt')

    def list(self, request, *args, **kwargs):
        """GET /api/bookmarks/ - List all bookmarks"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'count': queryset.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        """GET /api/bookmarks/{id}/ - Retrieve a specific bookmark"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """POST /api/bookmarks/ - Create a new bookmark"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Bookmark created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        """PATCH /api/bookmarks/{id}/ - Update a bookmark"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Bookmark updated successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/bookmarks/{id}/ - Delete a bookmark"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Bookmark removed successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """POST /api/bookmarks/toggle/ - Toggle bookmark for a post"""
        post_id = request.data.get('post_id')
        
        if not post_id:
            return Response({
                'success': False,
                'message': 'post_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if bookmark exists
            bookmark = Bookmark.objects.filter(user=request.user, post_id=post_id).first()
            
            if bookmark:
                # Remove bookmark
                bookmark.delete()
                return Response({
                    'success': True,
                    'message': 'Bookmark removed successfully',
                    'bookmarked': False
                }, status=status.HTTP_200_OK)
            else:
                # Create bookmark
                bookmark = Bookmark.objects.create(user=request.user, post_id=post_id)
                serializer = self.get_serializer(bookmark)
                return Response({
                    'success': True,
                    'message': 'Bookmark added successfully',
                    'bookmarked': True,
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ShareViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Share model with all CRUD operations
    
    Endpoints:
    - GET /api/shares/ - List all shares
    - GET /api/shares/{id}/ - Retrieve a specific share
    - POST /api/shares/ - Create a new share (authenticated users only)
    - PATCH /api/shares/{id}/ - Update a share (owner only)
    - DELETE /api/shares/{id}/ - Delete a share (owner only)
    """
    queryset = Share.objects.all().select_related('user', 'post')
    serializer_class = ShareSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by post
        post_id = self.request.query_params.get('post_id')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by platform
        platform = self.request.query_params.get('platform')
        if platform:
            queryset = queryset.filter(platform=platform)
        
        return queryset.order_by('-createdAt')

    def list(self, request, *args, **kwargs):
        """GET /api/shares/ - List all shares"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'count': queryset.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        """GET /api/shares/{id}/ - Retrieve a specific share"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """POST /api/shares/ - Create a new share"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Share recorded successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        """PATCH /api/shares/{id}/ - Update a share"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Share updated successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/shares/{id}/ - Delete a share"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Share deleted successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """GET /api/shares/stats/ - Get share statistics by platform"""
        post_id = request.query_params.get('post_id')
        
        queryset = self.get_queryset()
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        # Get share counts by platform
        from django.db.models import Count
        stats = queryset.values('platform').annotate(count=Count('id')).order_by('-count')
        
        return Response({
            'success': True,
            'total_shares': queryset.count(),
            'platform_stats': list(stats)
        }, status=status.HTTP_200_OK)
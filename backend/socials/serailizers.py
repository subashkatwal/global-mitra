from rest_framework import serializers
from .models import Post, Comment, Bookmark, Share
from accounts.serializers import UserSerializer
from destinations.serializers import DestinationSerializer


class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    destination = DestinationSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    destination_id = serializers.UUIDField(write_only=True)
    comments_count = serializers.SerializerMethodField()
    bookmarks_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'user',
            'user_id',
            'destination',
            'destination_id',
            'textContent',
            'image',
            'createdAt',
            'comments_count',
            'bookmarks_count',
            'shares_count',
            'is_bookmarked'
        ]
        read_only_fields = ['id', 'createdAt']

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_bookmarks_count(self, obj):
        return obj.bookmarkedBy.count()

    def get_shares_count(self, obj):
        return obj.sharedBy.count()

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarkedBy.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        # Get user from context (authenticated user)
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    post_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Comment
        fields = [
            'id',
            'post_id',
            'user',
            'user_id',
            'textContent',
            'image',
            'createdAt'
        ]
        read_only_fields = ['id', 'createdAt']

    def create(self, validated_data):
        # Get user from context (authenticated user)
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


class BookmarkSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    post_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Bookmark
        fields = [
            'id',
            'user',
            'user_id',
            'post',
            'post_id',
            'createdAt'
        ]
        read_only_fields = ['id', 'createdAt']

    def create(self, validated_data):
        # Get user from context (authenticated user)
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)

    def validate(self, data):
        request = self.context.get('request')
        post_id = data.get('post_id')
        
        # Check if bookmark already exists
        if Bookmark.objects.filter(user=request.user, post_id=post_id).exists():
            raise serializers.ValidationError("You have already bookmarked this post.")
        
        return data


class ShareSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    post_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Share
        fields = [
            'id',
            'user',
            'user_id',
            'post',
            'post_id',
            'platform',
            'createdAt'
        ]
        read_only_fields = ['id', 'createdAt']

    def create(self, validated_data):
        # Get user from context (authenticated user)
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)

    def validate_platform(self, value):
        allowed_platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy_link']
        if value.lower() not in allowed_platforms:
            raise serializers.ValidationError(f"Platform must be one of: {', '.join(allowed_platforms)}")
        return value.lower()
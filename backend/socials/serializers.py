from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Post, Comment, Bookmark, Share


class CommentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    userPhoto = serializers.SerializerMethodField()
    postId = serializers.UUIDField(source='post.id', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'postId', 'full_name', 'userPhoto',
            'textContent', 'image', 'createdAt'
        ]
        read_only_fields = ['id', 'postId', 'full_name', 'userPhoto', 'createdAt']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_full_name(self, obj):
        if not obj.user:
            return None
        full_name = obj.user.get_full_name()
        return full_name.strip() if full_name and full_name.strip() else obj.user.email

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_userPhoto(self, obj):
        if not obj.user:
            return None
        request = self.context.get('request')
        if hasattr(obj.user, 'photo') and obj.user.photo:
            return request.build_absolute_uri(obj.user.photo.url) if request else obj.user.photo.url
        if hasattr(obj.user, 'profile_image') and obj.user.profile_image:
            return obj.user.profile_image
        return None


class PostSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    full_name = serializers.SerializerMethodField()
    userPhoto = serializers.SerializerMethodField()
    commentCount = serializers.SerializerMethodField()
    likeCount = serializers.SerializerMethodField()
    shareCount = serializers.SerializerMethodField()
    isBookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'full_name', 'userPhoto', 'textContent', 'image',
            'commentCount', 'likeCount', 'shareCount', 'isBookmarked', 'createdAt'
        ]
        read_only_fields = [
            'id', 'full_name', 'userPhoto',
            'commentCount', 'likeCount', 'shareCount', 'isBookmarked', 'createdAt'
        ]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_full_name(self, obj):
        if not obj.user:
            return None
        full_name = obj.user.get_full_name()
        return full_name.strip() if full_name and full_name.strip() else obj.user.email

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_userPhoto(self, obj):
        if not obj.user:
            return None
        request = self.context.get('request')
        if hasattr(obj.user, 'photo') and obj.user.photo:
            return request.build_absolute_uri(obj.user.photo.url) if request else obj.user.photo.url
        if hasattr(obj.user, 'profile_image') and obj.user.profile_image:
            return obj.user.profile_image
        return None

    @extend_schema_field(serializers.IntegerField())
    def get_commentCount(self, obj):
        return obj.comments.count()

    @extend_schema_field(serializers.IntegerField())
    def get_likeCount(self, obj):
        return obj.bookmarkedBy.count()

    @extend_schema_field(serializers.IntegerField())
    def get_shareCount(self, obj):
        return obj.sharedBy.count()

    @extend_schema_field(serializers.BooleanField())
    def get_isBookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarkedBy.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        request = self.context.get('request')
        return Post.objects.create(user=request.user, **validated_data)


class ShareSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    shareUrl = serializers.SerializerMethodField()

    class Meta:
        model = Share
        fields = ['id', 'full_name', 'platform', 'shareUrl', 'createdAt']
        read_only_fields = ['id', 'full_name', 'createdAt']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_full_name(self, obj):
        if not obj.user:
            return None
        full_name = obj.user.get_full_name()
        return full_name.strip() if full_name and full_name.strip() else obj.user.email

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_shareUrl(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f"/api/socials/posts/{obj.post.id}/")
        return None

    def validate_platform(self, value):
        allowed = [p[0] for p in Share.PLATFORM_CHOICES]
        if value.lower() not in allowed:
            raise serializers.ValidationError(f"Must be one of: {', '.join(allowed)}")
        return value.lower()
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from accounts.models import GuideProfile

User = get_user_model()


# ── User serializers ──────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only profile returned on GET /profile/users/me"""

    # Returns absolute URL (e.g. http://localhost:8000/media/profile_photos/x.jpg)
    # Falls back gracefully if request context is not provided
    photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'fullName', 'phoneNumber',
            'photo', 'address', 'role', 'verified', 'isActive',
            'createdAt', 'updatedAt'
        ]
        read_only_fields = [
            'id', 'email', 'username', 'role', 'verified',
            'isActive', 'createdAt', 'updatedAt'
        ]

    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.photo.url)
        return obj.photo.url


class UpdateUserProfileSerializer(serializers.ModelSerializer):
    """
    PATCH /profile/users/me
    Allows updating: fullName, phoneNumber, address.
    Photo is intentionally excluded — use POST /profile/users/me/photo instead.
    """

    phoneNumber = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        validators=[
            RegexValidator(
                regex=r'^\d{10}$',
                message='Phone number must be exactly 10 digits.',
                code='invalid_phone'
            )
        ]
    )
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['fullName', 'phoneNumber', 'address']

    def validate_phoneNumber(self, value):
        if not value:
            return value
        user = self.instance
        if User.objects.exclude(id=user.id).filter(phoneNumber=value).exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value


# ── Guide serializers ─────────────────────────────────────────────────────────

class GuideProfileDetailSerializer(serializers.ModelSerializer):
    """
    Read-only guide profile returned on GET /profile/guides/me.
    Nests the full user profile (with absolute photo URL).
    """

    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = GuideProfile
        fields = [
            'id', 'user', 'licenseNumber', 'licenseIssuedBy',
            'verificationStatus', 'bio', 'createdAt', 'updatedAt'
        ]
        read_only_fields = [
            'id', 'user', 'verificationStatus', 'licenseNumber',
            'createdAt', 'updatedAt'
        ]


class UpdateGuideProfileSerializer(serializers.ModelSerializer):
    """
    PATCH /profile/guides/me
    Guide can update: bio, licenseIssuedBy (guide profile fields)
                      + fullName, phoneNumber, photo (user fields — proxied through)
    licenseNumber and verificationStatus are blocked at the view level.
    """

    # User fields proxied through this serializer
    fullName    = serializers.CharField(required=False)
    phoneNumber = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        validators=[
            RegexValidator(
                regex=r'^\d{10}$',
                message='Phone number must be exactly 10 digits.',
                code='invalid_phone'
            )
        ]
    )
    # Accept file upload for photo
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = GuideProfile
        fields = ['bio', 'licenseIssuedBy', 'fullName', 'phoneNumber', 'photo']

    def validate_phoneNumber(self, value):
        if not value:
            return value
        user = self.instance.user
        if User.objects.exclude(id=user.id).filter(phoneNumber=value).exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value

    def update(self, instance, validated_data):
        # ── Extract user fields ───────────────────────────────────────────────
        user_fields = {}
        for field in ['fullName', 'phoneNumber', 'photo']:
            if field in validated_data:
                user_fields[field] = validated_data.pop(field)

        # ── Update GuideProfile fields (bio, licenseIssuedBy) ─────────────────
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # ── Update User fields ────────────────────────────────────────────────
        if user_fields:
            user = instance.user
            # Delete old photo file before replacing
            if 'photo' in user_fields and user.photo:
                try:
                    user.photo.delete(save=False)
                except Exception:
                    pass
            for attr, value in user_fields.items():
                setattr(user, attr, value)
            user.save()

        return instance


# ── Admin serializers ─────────────────────────────────────────────────────────

class AdminUserListSerializer(serializers.ModelSerializer):
    """Admin: list all users (no photo — keeps response lean)"""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'fullName', 'phoneNumber',
            'role', 'verified', 'isActive', 'createdAt'
        ]


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """Admin: view/update a specific user. Photo returned as absolute URL."""

    photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'fullName', 'phoneNumber', 'photo',
            'role', 'verified', 'isActive', 'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'email', 'username', 'createdAt', 'updatedAt']

    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.photo.url)
        return obj.photo.url


class AdminGuideProfileListSerializer(serializers.ModelSerializer):
    """Admin: list all guide profiles"""

    userEmail    = serializers.EmailField(source='user.email',    read_only=True)
    userFullName = serializers.CharField(source='user.fullName',  read_only=True)

    class Meta:
        model = GuideProfile
        fields = [
            'id', 'userEmail', 'userFullName', 'licenseNumber',
            'verificationStatus', 'createdAt'
        ]


class AdminGuideProfileDetailSerializer(serializers.ModelSerializer):
    """Admin: view/update a specific guide profile with nested user info"""

    user = AdminUserDetailSerializer(read_only=True)

    class Meta:
        model = GuideProfile
        fields = [
            'id', 'user', 'licenseNumber', 'licenseIssuedBy',
            'verificationStatus', 'bio', 'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'user', 'createdAt', 'updatedAt']
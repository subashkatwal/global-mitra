from rest_framework import serializers
from django.contrib.auth import get_user_model
from accounts.models import GuideProfile

User = get_user_model()


class GuideProfileSerializer(serializers.ModelSerializer):
    """Serializer for Guide Profile"""
    
    class Meta:
        model = GuideProfile
        fields = [
            'licenseNumber',
            'licenseIssuedBy',
            'verificationStatus',
            'bio',
            'createdAt',
            'updatedAt'
        ]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User details"""
    photo = serializers.SerializerMethodField() 
    guideProfile = GuideProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'fullName',
            'phoneNumber',
            'photo',
            'role',
            'verified',
            'isActive',
            'createdAt',
            'updatedAt',
            'guideProfile'
        ]
        read_only_fields = ['id', 'verified', 'isActive', 'createdAt', 'updatedAt']
        
    def get_photo(self, obj):
        if not obj.photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.photo.url)
        return obj.photo.url


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating User details"""
    
    class Meta:
        model = User
        fields = [
            'fullName',
            'phoneNumber',
            'photo',
        ]
        
    def validate_phoneNumber(self, value):
        """Validate phone number is 10 digits"""
        if value and not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value
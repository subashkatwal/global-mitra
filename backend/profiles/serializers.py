from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from accounts.models import GuideProfile

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user to view their profile"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'fullName', 'phoneNumber', 
            'photo', 'role', 'verified', 'isActive', 
            'createdAt', 'updatedAt'
        ]
        read_only_fields = [
            'id', 'email', 'username', 'role', 'verified', 
            'isActive', 'createdAt', 'updatedAt'
        ]

class UpdateUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user to update their own profile"""
    phoneNumber = serializers.CharField( required= False, validators=[
        RegexValidator(
            regex=r'^\d{10}$',
            message='Phone number must be exactly 10 digits.',
                code='invalid_phone'
        )
    ])

    class Meta:
        model = User
        fields = ['fullName', 'phoneNumber', 'photo']
        
    def validate_phoneNumber(self, value):
        user= self.instance
        if User.objects.exclude(id = user.id).filter(phoneNumber= value).exists():
            raise serializers.ValidationError("This phone number is already in use.")



class GuideProfileDetailSerializer(serializers.ModelSerializer):
    """Serializer for guide to view their profile with user info"""
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = GuideProfile
        fields = [
            'id', 'user', 'licenseNumber', 'licenseIssuedBy',
            'verificationStatus', 'bio', 'createdAt', 'updatedAt'
        ]
        read_only_fields = [
            'id', 'user', 'verificationStatus', 'createdAt', 'updatedAt','licenseNumber', 'licenseIssuedBy'
        ]

class UpdateGuideProfileSerializer(serializers.ModelSerializer):
    """Serializer for guide to update their guide profile"""
    
    class Meta:
        model = GuideProfile
        fields = ['bio']
        
    def validate_licenseNumber(self, value):
        guide_profile = self.instance
        if GuideProfile.objects.exclude(id=guide_profile.id).filter(licenseNumber=value).exists():
            raise serializers.ValidationError("This license number is already registered.")
        return value
    
class AdminUserListSerializer(serializers.ModelSerializer):
    """Serializer for admin to list users"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'fullName', 'phoneNumber',
            'role', 'verified', 'isActive', 'createdAt'
        ]


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """Serializer for admin to view/update user details"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'fullName', 'phoneNumber', 'photo',
            'role', 'verified', 'isActive', 'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'email', 'username', 'createdAt', 'updatedAt']


class AdminGuideProfileListSerializer(serializers.ModelSerializer):
    """Serializer for admin to list guide profiles"""
    userEmail = serializers.EmailField(source='user.email', read_only=True)
    userFullName = serializers.CharField(source='user.fullName', read_only=True)
    
    class Meta:
        model = GuideProfile
        fields = [
            'id', 'userEmail', 'userFullName', 'licenseNumber',
            'verificationStatus', 'createdAt'
        ]


class AdminGuideProfileDetailSerializer(serializers.ModelSerializer):
    """Serializer for admin to view/update guide profile details"""
    user = AdminUserDetailSerializer(read_only=True)
    
    class Meta:
        model = GuideProfile
        fields = [
            'id', 'user', 'licenseNumber', 'licenseIssuedBy',
            'verificationStatus', 'bio', 'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'user', 'createdAt', 'updatedAt']
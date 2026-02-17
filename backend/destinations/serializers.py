from rest_framework import serializers
from destinations.models import Destination


class DestinationListSerializer(serializers.ModelSerializer):
    """Serializer for listing destinations (lighter, fewer fields)"""
    
    class Meta:
        model = Destination
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'latitude',
            'longitude',
            'averageCost',
            'difficulty',
            'bestSeason',
            'duration',
            'altitude',
            'crowdLevel',
            'safetyLevel',
            'createdAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt']


class DestinationDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed destination view (all fields)"""
    
    class Meta:
        model = Destination
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'latitude',
            'longitude',
            'averageCost',
            'difficulty',
            'bestSeason',
            'duration',
            'famousLocalItems',
            'activities',
            'altitude',
            'climate',
            'safetyLevel',
            'permitsRequired',
            'crowdLevel',
            'internetAvailability',
            'createdAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt']


class DestinationCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating destinations"""
    
    slug = serializers.SlugField(required=False)
    
    class Meta:
        model = Destination
        fields = [
            'name',
            'slug',
            'description',
            'latitude',
            'longitude',
            'averageCost',
            'difficulty',
            'bestSeason',
            'duration',
            'famousLocalItems',
            'activities',
            'altitude',
            'climate',
            'safetyLevel',
            'permitsRequired',
            'crowdLevel',
            'internetAvailability',
        ]
        
    def validate_latitude(self, value):
        """Validate latitude is between -90 and 90"""
        if not -90 <= value <= 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        """Validate longitude is between -180 and 180"""
        if not -180 <= value <= 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value
    
    def validate_averageCost(self, value):
        """Validate average cost is positive"""
        if value < 0:
            raise serializers.ValidationError("Average cost cannot be negative")
        return value
    
    def validate_difficulty(self, value):
        """Validate difficulty level"""
        valid_difficulties = ['EASY', 'MODERATE', 'CHALLENGING', 'DIFFICULT', 'EXTREME']
        if value.upper() not in valid_difficulties:
            raise serializers.ValidationError(
                f"Difficulty must be one of: {', '.join(valid_difficulties)}"
            )
        return value.upper()
    
    def validate_crowdLevel(self, value):
        """Validate crowd level"""
        valid_levels = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']
        if value.upper() not in valid_levels:
            raise serializers.ValidationError(
                f"Crowd level must be one of: {', '.join(valid_levels)}"
            )
        return value.upper()
    
    def validate_safetyLevel(self, value):
        """Validate safety level"""
        if value:
            valid_levels = ['VERY_SAFE', 'SAFE', 'MODERATE', 'CAUTION', 'HIGH_RISK']
            if value.upper() not in valid_levels:
                raise serializers.ValidationError(
                    f"Safety level must be one of: {', '.join(valid_levels)}"
                )
            return value.upper()
        return value
    
    def validate_internetAvailability(self, value):
        """Validate internet availability"""
        valid_options = ['EXCELLENT', 'GOOD', 'LIMITED', 'POOR', 'NONE']
        if value.upper() not in valid_options:
            raise serializers.ValidationError(
                f"Internet availability must be one of: {', '.join(valid_options)}"
            )
        return value.upper()
    
    def create(self, validated_data):
        """Auto-generate slug from name if not provided"""
        if 'slug' not in validated_data or not validated_data['slug']:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update slug if name changes and slug not explicitly provided"""
        if 'name' in validated_data and 'slug' not in validated_data:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        
        return super().update(instance, validated_data)
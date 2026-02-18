from rest_framework import serializers
from .models import Destination


class DestinationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used in the paginated list response."""

    class Meta:
        model = Destination
        fields = [
            "id",
            "name",
            "slug",
            "difficulty",
            "bestSeason",
            "averageCost",
            "crowdLevel",
            "safetyLevel",
            "duration",
            "createdAt",
        ]
        read_only_fields = ["id", "createdAt"]


class DestinationSerializer(serializers.ModelSerializer):
    """Full serializer used for create / retrieve / update."""

    class Meta:
        model = Destination
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "latitude",
            "longitude",
            "averageCost",
            "difficulty",
            "bestSeason",
            "duration",
            "famousLocalItems",
            "activities",
            "altitude",
            "climate",
            "safetyLevel",
            "permitsRequired",
            "crowdLevel",
            "internetAvailability",
            "createdAt",
        ]
        read_only_fields = ["id", "createdAt"]


    def validate_latitude(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError(
                "Latitude must be between -90 and 90."
            )
        return value

    def validate_longitude(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError(
                "Longitude must be between -180 and 180."
            )
        return value

    def validate_averageCost(self, value):
        if value < 0:
            raise serializers.ValidationError("Average cost cannot be negative.")
        return value

    def validate_difficulty(self, value):
        allowed = {"Easy", "Moderate", "Hard", "Extreme"}
        if value not in allowed:
            raise serializers.ValidationError(
                f"Must be one of: {', '.join(sorted(allowed))}."
            )
        return value

    def validate_crowdLevel(self, value):
        allowed = {"Low", "Medium", "High"}
        if value not in allowed:
            raise serializers.ValidationError(
                f"Must be one of: {', '.join(sorted(allowed))}."
            )
        return value

    def validate_safetyLevel(self, value):
        if value is None:
            return value
        allowed = {"Safe", "Moderate", "Dangerous"}
        if value not in allowed:
            raise serializers.ValidationError(
                f"Must be one of: {', '.join(sorted(allowed))}."
            )
        return value

    def validate_internetAvailability(self, value):
        allowed = {"None", "Limited", "Moderate", "Good", "Excellent"}
        if value not in allowed:
            raise serializers.ValidationError(
                f"Must be one of: {', '.join(sorted(allowed))}."
            )
        return value

    def validate_famousLocalItems(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list of strings.")
        if not all(isinstance(i, str) for i in value):
            raise serializers.ValidationError("Each item must be a string.")
        return value

    def validate_activities(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list of strings.")
        if not all(isinstance(i, str) for i in value):
            raise serializers.ValidationError("Each item must be a string.")
        return value
    


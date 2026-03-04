from rest_framework import serializers
from destinations.models import Destination   # adjust import path if needed


class DestinationCompareSerializer(serializers.ModelSerializer):
    """
    Full-detail serializer used exclusively by the comparison endpoint.
    Field names are camelCase to match the React component's expectations.
    """

    # Rename snake_case model fields → camelCase for the frontend
    bestSeason   = serializers.CharField(source="best_season",    read_only=True)
    averageCost  = serializers.DecimalField(
                       source="average_cost",
                       max_digits=10, decimal_places=2,
                       read_only=True
                   )
    crowdLevel   = serializers.CharField(source="crowd_level",   read_only=True)
    safetyLevel  = serializers.CharField(source="safety_level",  read_only=True)
    safetyRating = serializers.FloatField( source="safety_score", read_only=True)
    costPerDay   = serializers.DecimalField(
                       source="average_cost",
                       max_digits=10, decimal_places=2,
                       read_only=True
                   )
    trendScore   = serializers.IntegerField(source="trend_score", read_only=True, default=0)
    reviewCount  = serializers.IntegerField(source="review_count",read_only=True, default=0)
    createdAt    = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model  = Destination
        fields = [
            # identifiers
            "id", "name", "slug",
            # display
            "image", "description",
            # core attributes
            "difficulty", "duration", "altitude",
            "bestSeason", "averageCost", "costPerDay",
            "crowdLevel", "safetyLevel", "safetyRating",
            "trendScore", "rating", "reviewCount",
            # location details
            "district", "country",
            # meta
            "createdAt",
        ]
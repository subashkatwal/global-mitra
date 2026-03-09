from rest_framework import serializers
from reports.models import IncidentReport, IncidentCluster, AlertBroadcast, Notification


class IncidentReportCreateSerializer(serializers.ModelSerializer):
    """
    POST /api/v1/incidents/reports
    Accepts multipart/form-data.
    `user` is injected by the view — never sent by the client.
    `image` is optional (blank=True, null=True in model).
    """

    class Meta:
        model = IncidentReport
        fields = [
            "id",
            "description",
            "category",
            "latitude",
            "longitude",
            "image",
        ]
        read_only_fields = ["id"]

    def validate_description(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters."
            )
        return value.strip()

    def validate_latitude(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def create(self, validated_data):
        # view calls serializer.save(user=request.user)
        return IncidentReport.objects.create(**validated_data)


class IncidentReportReadSerializer(serializers.ModelSerializer):
    """
    Used in cluster detail, admin list, and POST response.
    Exposes author info alongside report fields.
    """

    authorName = serializers.SerializerMethodField()
    authorEmail = serializers.SerializerMethodField()
    authorRole = serializers.SerializerMethodField()

    class Meta:
        model = IncidentReport
        fields = [
            "id",
            "description",
            "category",
            "image",
            "latitude",
            "longitude",
            "confidenceScore",
            "status",
            "createdAt",
            "authorName",
            "authorEmail",
            "authorRole",
        ]

    def get_authorName(self, obj):
        u = obj.user
        return getattr(u, "fullName", None) or getattr(u, "full_name", None) or u.email

    def get_authorEmail(self, obj):
        return obj.user.email

    def get_authorRole(self, obj):
        return obj.user.role


class IncidentClusterSerializer(serializers.ModelSerializer):
    """
    GET /api/v1/incidents/clusters
    Returns all fields the frontend ReportPage needs:
    status label, report count, centroid, keywords, alert flag.
    """

    status = serializers.SerializerMethodField()
    reportCount = serializers.SerializerMethodField()

    class Meta:
        model = IncidentCluster
        fields = [
            "id",
            "reportCount",
            "centerLatitude",
            "centerLongitude",
            "topKeywords",
            "dominantCategory",
            "confidenceScore",
            "isAlertTriggered",
            "status",
            "createdAt",
        ]

    def get_status(self, obj):
        return "Verified" if obj.isAlertTriggered else "Possible"

    def get_reportCount(self, obj):
        # Use annotated value if present (from queryset), else hit M2M
        return getattr(obj, "_report_count", None) or obj.reports.count()


class IncidentClusterDetailSerializer(IncidentClusterSerializer):
    """
    Cluster detail — includes the individual reports inside.
    Used by admin when reviewing a cluster.
    """

    reports = IncidentReportReadSerializer(many=True, read_only=True)

    class Meta(IncidentClusterSerializer.Meta):
        fields = IncidentClusterSerializer.Meta.fields + ["reports"]


class AlertBroadcastSerializer(serializers.ModelSerializer):
    clusterId = serializers.UUIDField(source="cluster.id", read_only=True)
    dominantCategory = serializers.CharField(
        source="cluster.dominantCategory", read_only=True
    )
    centerLatitude = serializers.FloatField(
        source="cluster.centerLatitude", read_only=True
    )
    centerLongitude = serializers.FloatField(
        source="cluster.centerLongitude", read_only=True
    )
    broadcastedByEmail = serializers.SerializerMethodField()

    class Meta:
        model = AlertBroadcast
        fields = [
            "id",
            "clusterId",
            "dominantCategory",
            "centerLatitude",
            "centerLongitude",
            "message",
            "severity",
            "triggerType",
            "broadcastedByEmail",
            "broadcastTime",
        ]

    def get_broadcastedByEmail(self, obj):
        return obj.broadcastedBy.email if obj.broadcastedBy else "AUTO"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "notificationType",
            "title",
            "message",
            "isRead",
            "createdAt",
        ]

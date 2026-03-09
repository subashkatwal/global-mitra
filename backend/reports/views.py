from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from globalmitra.permissions import IsAdminUser

from reports.models import (
    IncidentReport,
    IncidentCluster,
    AlertBroadcast,
    Notification,
)
from reports.serializers import (
    IncidentReportCreateSerializer,
    IncidentReportReadSerializer,
    IncidentClusterSerializer,
    IncidentClusterDetailSerializer,
    AlertBroadcastSerializer,
    NotificationSerializer,
)


# ─────────────────────────────────────────────────────────────────────────────
# REPORTS  →  GET /reports  |  POST /reports
# ─────────────────────────────────────────────────────────────────────────────


class ReportListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    # GET /reports  — admin list with filters + status_counts
    def get(self, request):
        qs = IncidentReport.objects.select_related("user").order_by("-createdAt")

        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status__iexact=s)

        cat = request.query_params.get("category")
        if cat:
            qs = qs.filter(category__iexact=cat)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(description__icontains=search)

        status_counts = dict(
            IncidentReport.objects.values_list("status").annotate(n=Count("id"))
        )
        counts = {
            "PENDING": status_counts.get("PENDING", 0),
            "VERIFIED": status_counts.get("VERIFIED", 0),
            "REJECTED": status_counts.get("REJECTED", 0),
            "AUTO_VERIFIED": status_counts.get("AUTO_VERIFIED", 0),
        }

        serializer = IncidentReportReadSerializer(
            qs, many=True, context={"request": request}
        )
        return Response({"results": serializer.data, "status_counts": counts})

    # POST /reports  — any authenticated user submits a report
    def post(self, request):
        serializer = IncidentReportCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        read = IncidentReportReadSerializer(
            serializer.instance, context={"request": request}
        )
        return Response(read.data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# REPORTS  →  GET /reports/<pk>  |  PATCH /reports/<pk>  |  DELETE /reports/<pk>
# ─────────────────────────────────────────────────────────────────────────────


class ReportDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_object(self, pk):
        try:
            return IncidentReport.objects.select_related("user").get(pk=pk)
        except IncidentReport.DoesNotExist:
            return None

    # GET /reports/<pk>
    def get(self, request, pk):
        report = self.get_object(pk)
        if not report:
            return Response(
                {"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(
            IncidentReportReadSerializer(report, context={"request": request}).data
        )

    # PATCH /reports/<pk>  — admin sets status / rejectionReason
    def patch(self, request, pk):
        report = self.get_object(pk)
        if not report:
            return Response(
                {"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        allowed = {"VERIFIED", "REJECTED", "PENDING"}

        if new_status not in allowed:
            return Response(
                {"status": f"Must be one of: {', '.join(allowed)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report.status = new_status
        update_fields = ["status"]

        if new_status == "REJECTED":
            reason = request.data.get("rejectionReason", "")
            report.rejectionReason = reason
            update_fields.append("rejectionReason")

        report.verifiedBy = request.user
        update_fields.append("verifiedBy")
        report.save(update_fields=update_fields)

        notif_type = (
            "REPORT_VERIFIED" if new_status == "VERIFIED" else "REPORT_REJECTED"
        )
        notif_msg = (
            "Your incident report has been verified by an admin."
            if new_status == "VERIFIED"
            else f"Your incident report was rejected. Reason: {report.rejectionReason or 'N/A'}"
        )
        Notification.objects.create(
            recipient=report.user,
            notificationType=notif_type,
            title=f"Report {new_status.title()}",
            message=notif_msg,
            incidentReport=report,
        )

        return Response(
            IncidentReportReadSerializer(report, context={"request": request}).data
        )

    # DELETE /reports/<pk>
    def delete(self, request, pk):
        report = self.get_object(pk)
        if not report:
            return Response(
                {"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND
            )
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
# REPORTS  →  POST /reports/<pk>/verify  |  POST /reports/<pk>/reject
# ─────────────────────────────────────────────────────────────────────────────


class ReportVerifyView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            report = IncidentReport.objects.select_related("user").get(pk=pk)
        except IncidentReport.DoesNotExist:
            return Response(
                {"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND
            )

        report.status = "VERIFIED"
        report.verifiedBy = request.user
        report.save(update_fields=["status", "verifiedBy"])

        Notification.objects.create(
            recipient=report.user,
            notificationType="REPORT_VERIFIED",
            title="Report Verified",
            message="Your incident report has been verified by an admin.",
            incidentReport=report,
        )

        return Response(
            IncidentReportReadSerializer(report, context={"request": request}).data
        )


class ReportRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            report = IncidentReport.objects.select_related("user").get(pk=pk)
        except IncidentReport.DoesNotExist:
            return Response(
                {"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND
            )

        reason = request.data.get("rejectionReason", "")
        report.status = "REJECTED"
        report.rejectionReason = reason
        report.verifiedBy = request.user
        report.save(update_fields=["status", "rejectionReason", "verifiedBy"])

        Notification.objects.create(
            recipient=report.user,
            notificationType="REPORT_REJECTED",
            title="Report Rejected",
            message=f"Your incident report was rejected. Reason: {reason or 'N/A'}",
            incidentReport=report,
        )

        return Response(
            IncidentReportReadSerializer(report, context={"request": request}).data
        )


# ─────────────────────────────────────────────────────────────────────────────
# OVERVIEW  →  GET /reports/overview
# ─────────────────────────────────────────────────────────────────────────────


class ReportsOverviewView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        this_week = now - timedelta(days=7)
        last_week = now - timedelta(days=14)

        total = IncidentReport.objects.count()
        this_w = IncidentReport.objects.filter(createdAt__gte=this_week).count()
        last_w = IncidentReport.objects.filter(
            createdAt__gte=last_week,
            createdAt__lt=this_week,
        ).count()

        weekly_change = (
            round(((this_w - last_w) / last_w) * 100, 1) if last_w > 0 else 0
        )

        weekly_data = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            weekly_data.append(
                {
                    "day": day.strftime("%a"),
                    "count": IncidentReport.objects.filter(
                        createdAt__date=day.date()
                    ).count(),
                }
            )

        by_category = list(
            IncidentReport.objects.values("category")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        status_map = dict(
            IncidentReport.objects.values_list("status").annotate(n=Count("id"))
        )

        return Response(
            {
                "total_reports": total,
                "pending_count": status_map.get("PENDING", 0),
                "verified_count": status_map.get("VERIFIED", 0),
                "rejected_count": status_map.get("REJECTED", 0),
                "auto_alerted_count": status_map.get("AUTO_VERIFIED", 0),
                "active_clusters": IncidentCluster.objects.count(),
                "alerts_sent": AlertBroadcast.objects.count(),
                "weekly_change": weekly_change,
                "weekly_data": weekly_data,
                "by_category": by_category,
            }
        )


# ─────────────────────────────────────────────────────────────────────────────
# CLUSTERS  →  GET /clusters  |  GET /clusters/<pk>  |  DELETE /clusters/<pk>
# ─────────────────────────────────────────────────────────────────────────────


class ClusterListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = IncidentCluster.objects.annotate(_report_count=Count("reports")).order_by(
            "-createdAt"
        )

        status_param = request.query_params.get("status")
        if status_param == "Verified":
            qs = qs.filter(isAlertTriggered=True)
        elif status_param == "Possible":
            qs = qs.filter(isAlertTriggered=False)

        category_param = request.query_params.get("category")
        if category_param:
            qs = qs.filter(dominantCategory__iexact=category_param)

        serializer = IncidentClusterSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)


class ClusterDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_object(self, pk):
        try:
            return IncidentCluster.objects.prefetch_related("reports__user").get(pk=pk)
        except IncidentCluster.DoesNotExist:
            return None

    # GET /clusters/<pk>
    def get(self, request, pk):
        cluster = self.get_object(pk)
        if not cluster:
            return Response(
                {"detail": "Cluster not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(
            IncidentClusterDetailSerializer(cluster, context={"request": request}).data
        )

    # DELETE /clusters/<pk>
    def delete(self, request, pk):
        cluster = self.get_object(pk)
        if not cluster:
            return Response(
                {"detail": "Cluster not found."}, status=status.HTTP_404_NOT_FOUND
            )
        cluster.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
# CLUSTERS  →  POST /clusters/<pk>/broadcast
# ─────────────────────────────────────────────────────────────────────────────


class ClusterBroadcastView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            cluster = IncidentCluster.objects.prefetch_related("reports__user").get(
                pk=pk
            )
        except IncidentCluster.DoesNotExist:
            return Response(
                {"detail": "Cluster not found."}, status=status.HTTP_404_NOT_FOUND
            )

        severity = request.data.get("severity", "MEDIUM").upper()
        message = request.data.get("message", "").strip()

        if not message:
            return Response(
                {"detail": "message is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        if severity not in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
            return Response(
                {"detail": "severity must be LOW, MEDIUM, HIGH, or CRITICAL."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        alert = AlertBroadcast.objects.create(
            cluster=cluster,
            message=message,
            severity=severity,
            triggerType="MANUAL",
            broadcastedBy=request.user,
        )

        cluster.isAlertTriggered = True
        cluster.save(update_fields=["isAlertTriggered"])

        for report in cluster.reports.select_related("user").all():
            Notification.objects.create(
                recipient=report.user,
                notificationType="ALERT_BROADCAST",
                title=f"Alert: {cluster.dominantCategory.replace('_', ' ').title()}",
                message=message,
                incidentReport=report,
            )

        return Response(
            AlertBroadcastSerializer(alert, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# ALERTS  →  GET /alerts  |  GET /alerts/<pk>  |  DELETE /alerts/<pk>
# ─────────────────────────────────────────────────────────────────────────────


class AlertListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = AlertBroadcast.objects.select_related("cluster", "broadcastedBy").order_by(
            "-broadcastTime"
        )

        severity = request.query_params.get("severity")
        if severity:
            qs = qs.filter(severity__iexact=severity)

        trigger = request.query_params.get("trigger")
        if trigger:
            qs = qs.filter(triggerType__iexact=trigger)

        serializer = AlertBroadcastSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)


class AlertDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_object(self, pk):
        try:
            return AlertBroadcast.objects.select_related(
                "cluster", "broadcastedBy"
            ).get(pk=pk)
        except AlertBroadcast.DoesNotExist:
            return None

    # GET /alerts/<pk>
    def get(self, request, pk):
        alert = self.get_object(pk)
        if not alert:
            return Response(
                {"detail": "Alert not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(
            AlertBroadcastSerializer(alert, context={"request": request}).data
        )

    # DELETE /alerts/<pk>
    def delete(self, request, pk):
        alert = self.get_object(pk)
        if not alert:
            return Response(
                {"detail": "Alert not found."}, status=status.HTTP_404_NOT_FOUND
            )
        alert.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS  →  GET /notifications  |  PATCH /notifications/<pk>  |  POST /notifications/read-all
# ─────────────────────────────────────────────────────────────────────────────


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user).order_by("-createdAt")
        unread = qs.filter(isRead=False).count()
        serializer = NotificationSerializer(qs, many=True, context={"request": request})
        response = Response(serializer.data)
        response["X-Unread-Count"] = unread
        return response


class NotificationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Notification.objects.get(pk=pk, recipient=user)
        except Notification.DoesNotExist:
            return None

    # GET /notifications/<pk>
    def get(self, request, pk):
        notif = self.get_object(pk, request.user)
        if not notif:
            return Response(
                {"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(
            NotificationSerializer(notif, context={"request": request}).data
        )

    # PATCH /notifications/<pk>  — mark single notification as read
    def patch(self, request, pk):
        notif = self.get_object(pk, request.user)
        if not notif:
            return Response(
                {"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND
            )
        notif.isRead = True
        notif.save(update_fields=["isRead"])
        return Response(
            NotificationSerializer(notif, context={"request": request}).data
        )

    # DELETE /notifications/<pk>
    def delete(self, request, pk):
        notif = self.get_object(pk, request.user)
        if not notif:
            return Response(
                {"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND
            )
        notif.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user, isRead=False
        ).update(isRead=True)
        return Response({"marked_read": updated})

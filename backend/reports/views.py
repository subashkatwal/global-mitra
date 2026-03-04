"""
DRF Views for Global Mitra Incident Report & Alert System.
All processing is synchronous - no background workers.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q, Count
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import IncidentReport, IncidentCluster, AlertBroadcast, Notification
from .serializers import (
    IncidentReportSerializer, 
    IncidentReportListSerializer,
    IncidentClusterSerializer,
    AlertBroadcastSerializer,
    NotificationSerializer,
    NotificationMarkReadSerializer
)
from .tfidf_dbscan import process_new_incident
from globalmitra.permissions import IsAdminOrReadOnly, IsOwnerOrReadOnly


class IncidentReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for incident reports.
    POST creates incident and triggers synchronous TF-IDF + DBSCAN processing.
    """
    
    queryset = IncidentReport.objects.all()
    serializer_class = IncidentReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user role."""
        user = self.request.user
        if user.is_staff:
            return IncidentReport.objects.all().order_by('-created_at')
        return IncidentReport.objects.filter(
            Q(status='VERIFIED') | Q(status='AUTO_ALERTED')
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return IncidentReportListSerializer
        return IncidentReportSerializer
    
    @transaction.atomic
    def perform_create(self, serializer):
        """
        Create incident and immediately run ML clustering pipeline.
        This is synchronous - request waits for clustering to complete.
        """
        # Save the incident first
        incident = serializer.save(
            status='PENDING',
            confidenceScore=serializer.validated_data.get('confidenceScore', 0.5)
        )
        
        # Create notification for admins about new incident
        self._notify_admins_new_incident(incident)
        
        # Run TF-IDF + DBSCAN clustering synchronously
        self._process_clustering(incident)
        
        return incident
    
    def _notify_admins_new_incident(self, incident: IncidentReport):
        """Create notifications for all admin users."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        admins = User.objects.filter(is_staff=True)
        notifications = [
            Notification(
                recipient=admin,
                notificationType='NEW_INCIDENT',
                title='New Incident Reported',
                message=f'New {incident.category} incident requires review.',
                incidentReport=incident
            )
            for admin in admins
        ]
        Notification.objects.bulk_create(notifications)
    
    def _process_clustering(self, new_incident: IncidentReport):
        """
        Synchronous ML processing.
        Fetches all relevant reports, runs clustering, updates database.
        """
        # Get all reports eligible for clustering (exclude REJECTED)
        eligible_reports = IncidentReport.objects.filter(
            ~Q(status='REJECTED')
        ).select_related()
        
        try:
            # Run ML pipeline
            result = process_new_incident(eligible_reports, new_incident.id)
            
            # Update database with clustering results
            self._update_clusters(result, eligible_reports)
            
        except Exception as e:
            # Log error but don't fail the request
            # In production, use proper logging
            print(f"Clustering error: {str(e)}")
            # Could also create an admin notification about clustering failure
    
    def _update_clusters(self, result: dict, reports_queryset):
        """
        Update database based on clustering results.
        Creates/updates IncidentCluster records.
        """
        clustering = result['clustering_result']
        actions = result['actions']
        report_map = result['report_index_map']
        
        # Build ID to object map for efficient lookup
        reports_by_id = {r.id: r for r in reports_queryset}
        
        # Clear existing cluster assignments for affected reports
        # (Simplification: we rebuild clusters on each new incident)
        affected_report_ids = set()
        for cluster_data in clustering['clusters'].values():
            affected_report_ids.update(cluster_data['report_ids'])
        
        # Remove reports from existing clusters
        for report_id in affected_report_ids:
            report = reports_by_id.get(report_id)
            if report:
                # Remove from all current clusters
                report.incidentcluster_set.clear()
        
        # Delete empty clusters (optional cleanup)
        IncidentCluster.objects.filter(reports__isnull=True).delete()
        
        # Create/update clusters
        newly_formed_clusters = []
        
        for cluster_label, cluster_data in clustering['clusters'].items():
            # Check if cluster exists
            cluster, created = IncidentCluster.objects.get_or_create(
                id=cluster_label,  # Using label as ID for simplicity
                defaults={
                    'centerLatitude': cluster_data['centerLatitude'],
                    'centerLongitude': cluster_data['centerLongitude'],
                    'topKeywords': cluster_data['topKeywords'],
                    'confidenceScore': cluster_data['confidenceScore'],
                    'dominantCategory': cluster_data['dominantCategory'],
                    'isAlertTriggered': False
                }
            )
            
            if not created:
                # Update existing cluster
                cluster.centerLatitude = cluster_data['centerLatitude']
                cluster.centerLongitude = cluster_data['centerLongitude']
                cluster.topKeywords = cluster_data['topKeywords']
                cluster.confidenceScore = cluster_data['confidenceScore']
                cluster.dominantCategory = cluster_data['dominantCategory']
                cluster.save()
            
            # Add reports to cluster
            report_objs = [
                reports_by_id[rid] for rid in cluster_data['report_ids']
                if rid in reports_by_id
            ]
            cluster.reports.add(*report_objs)
            
            # Track newly formed clusters (size exactly 3)
            if created and cluster_data['size'] == 3:
                newly_formed_clusters.append(cluster)
            
            # Check auto-alert threshold
            if cluster_data['confidenceScore'] > 0.75 and not cluster.isAlertTriggered:
                self._trigger_auto_alert(cluster, cluster_data)
        
        # Notify admins about newly formed clusters
        for cluster in newly_formed_clusters:
            self._notify_cluster_formed(cluster)
    
    def _notify_cluster_formed(self, cluster: IncidentCluster):
        """Notify admins when a new cluster is formed."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        admins = User.objects.filter(is_staff=True)
        keywords = ', '.join(cluster.topKeywords[:3]) if cluster.topKeywords else 'N/A'
        
        notifications = [
            Notification(
                recipient=admin,
                notificationType='CLUSTER_FORMED',
                title='New Incident Cluster Detected',
                message=f'Cluster of {cluster.reports.count()} reports detected. '
                        f'Category: {cluster.dominantCategory}, '
                        f'Keywords: {keywords}, '
                        f'Confidence: {cluster.confidenceScore:.0%}',
            )
            for admin in admins
        ]
        Notification.objects.bulk_create(notifications)
    
    def _trigger_auto_alert(self, cluster: IncidentCluster, cluster_data: dict):
        """Create automatic alert broadcast for high-confidence cluster."""
        # Create alert broadcast
        alert = AlertBroadcast.objects.create(
            cluster=cluster,
            message=f"AUTO-ALERT: High-confidence incident cluster detected. "
                    f"Category: {cluster.dominantCategory}. "
                    f"Location: ({cluster.centerLatitude:.4f}, {cluster.centerLongitude:.4f}). "
                    f"Keywords: {', '.join(cluster.topKeywords[:3])}. "
                    f"Confidence: {cluster.confidenceScore:.0%}",
            severity='HIGH' if cluster.confidenceScore > 0.85 else 'MEDIUM',
            triggerType='AUTO'
        )
        
        # Mark cluster as alerted
        cluster.isAlertTriggered = True
        cluster.save()
        
        # Update all reports in cluster to AUTO_ALERTED status
        cluster.reports.update(status='AUTO_ALERTED')
        
        # Create notifications
        self._notify_auto_alert(cluster, alert)
    
    def _notify_auto_alert(self, cluster: IncidentCluster, alert: AlertBroadcast):
        """Notify relevant users about auto-alert."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Notify admins
        admins = User.objects.filter(is_staff=True)
        admin_notifications = [
            Notification(
                recipient=admin,
                notificationType='AUTO_ALERT',
                title=f'Auto-Alert Triggered: {alert.severity}',
                message=f'Cluster {cluster.id} auto-alert: {alert.message[:200]}...',
            )
            for admin in admins
        ]
        
        # Notify users who submitted reports in this cluster
        submitters = User.objects.filter(
            incidentreport__in=cluster.reports.all()
        ).distinct()
        
        user_notifications = [
            Notification(
                recipient=submitter,
                notificationType='ALERT_BROADCAST',
                title='Incident Alert in Your Area',
                message=f'Your reported incident is part of a verified cluster. '
                        f'Authorities have been notified. Severity: {alert.severity}',
            )
            for submitter in submitters
        ]
        
        Notification.objects.bulk_create(admin_notifications + user_notifications)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def verify(self, request, pk=None):
        """Admin action to verify an incident report."""
        incident = self.get_object()
        
        if incident.status == 'REJECTED':
            return Response(
                {'error': 'Cannot verify a rejected report'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        incident.status = 'VERIFIED'
        incident.save()
        
        # Notify submitter
        if hasattr(incident, 'submitter') and incident.submitter:
            Notification.objects.create(
                recipient=incident.submitter,
                notificationType='REPORT_VERIFIED',
                title='Report Verified',
                message='Your incident report has been verified by administrators.',
                incidentReport=incident
            )
        
        return Response({'status': 'Report verified'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def reject(self, request, pk=None):
        """Admin action to reject an incident report."""
        incident = self.get_object()
        
        # Remove from any clusters
        incident.incidentcluster_set.clear()
        
        incident.status = 'REJECTED'
        incident.save()
        
        # Notify submitter
        if hasattr(incident, 'submitter') and incident.submitter:
            Notification.objects.create(
                recipient=incident.submitter,
                notificationType='REPORT_REJECTED',
                title='Report Rejected',
                message='Your incident report has been rejected by administrators.',
                incidentReport=incident
            )
        
        return Response({'status': 'Report rejected'})


class IncidentClusterViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing incident clusters.
    Read-only for all users, admin can see all details.
    """
    
    queryset = IncidentCluster.objects.annotate(
        report_count=Count('reports')
    ).filter(report_count__gte=3)  # Only show valid clusters (3+ reports)
    
    serializer_class = IncidentClusterSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter clusters based on user role."""
        base_query = IncidentCluster.objects.annotate(
            report_count=Count('reports')
        ).filter(report_count__gte=3).prefetch_related('reports')
        
        if self.request.user.is_staff:
            return base_query.order_by('-confidenceScore')
        
        # Regular users only see clusters with verified/auto-alerted incidents
        return base_query.filter(
            reports__status__in=['VERIFIED', 'AUTO_ALERTED']
        ).distinct().order_by('-created_at')


class AlertBroadcastViewSet(viewsets.ModelViewSet):
    """
    ViewSet for alert broadcasts.
    Admins can create manual alerts, everyone can read.
    """
    
    queryset = AlertBroadcast.objects.all().select_related('cluster')
    serializer_class = AlertBroadcastSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    @transaction.atomic
    def perform_create(self, serializer):
        """Create manual alert broadcast."""
        # Ensure triggerType is MANUAL for admin-created alerts
        alert = serializer.save(triggerType='MANUAL')
        
        # Mark cluster as alerted if linked
        if alert.cluster:
            alert.cluster.isAlertTriggered = True
            alert.cluster.save()
        
        # Create notifications for affected users
        self._notify_manual_alert(alert)
        
        return alert
    
    def _notify_manual_alert(self, alert: AlertBroadcast):
        """Notify users about manual alert."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        recipients = User.objects.all()  # Or filter by geography/role
        
        notifications = [
            Notification(
                recipient=user,
                notificationType='ALERT_BROADCAST',
                title=f'Alert: {alert.severity}',
                message=alert.message,
            )
            for user in recipients
        ]
        Notification.objects.bulk_create(notifications)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notifications.
    Users can only see their own notifications.
    Frontend polls this endpoint every 15-30 seconds.
    """
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return only current user's notifications."""
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications (for badge)."""
        count = self.get_queryset().filter(isRead=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        self.get_queryset().update(isRead=True)
        return Response({'status': 'All notifications marked as read'})
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark single notification as read."""
        notification = self.get_object()
        serializer = NotificationMarkReadSerializer(
            notification, 
            data={'isRead': True}, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
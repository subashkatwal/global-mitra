from django.contrib import admin
from .models import IncidentReport, AlertBroadcast, IncidentCluster, Notification


@admin.register(IncidentReport)
class IncidentReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'status', 'confidenceScore', 'createdAt')
    search_fields = ('description', 'category', 'user__email')
    list_filter = ('status', 'category')
    readonly_fields = ('createdAt', 'confidenceScore')


@admin.register(IncidentCluster)
class IncidentClusterAdmin(admin.ModelAdmin):
    list_display = ('id', 'dominantCategory', 'confidenceScore', 'isAlertTriggered', 'createdAt')
    list_filter = ('isAlertTriggered', 'dominantCategory')
    readonly_fields = ('createdAt', 'topKeywords', 'confidenceScore')


@admin.register(AlertBroadcast)
class AlertBroadcastAdmin(admin.ModelAdmin):
    list_display = ('id', 'severity', 'triggerType', 'broadcastedBy', 'broadcastTime')
    search_fields = ('message',)
    list_filter = ('severity', 'triggerType')
    readonly_fields = ('broadcastTime',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'notificationType', 'title', 'isRead', 'createdAt')
    list_filter = ('notificationType', 'isRead')
    readonly_fields = ('createdAt',)
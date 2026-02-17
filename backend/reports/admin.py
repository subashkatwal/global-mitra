from django.contrib import admin
from .models import IncidentReport, AlertBroadcast

@admin.register(IncidentReport)
class IncidentReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'destination', 'status', 'createdAt')
    search_fields = ('id','description', 'category')
    list_filter = ('status', 'destination')
    readonly_fields = ('createdAt',)

@admin.register(AlertBroadcast)
class AlertBroadcastAdmin(admin.ModelAdmin):
    list_display = ('id','destination', 'severity', 'broadcastTime')
    search_fields = ('message',)
    list_filter = ('id','severity', 'destination')
    readonly_fields = ('broadcastTime',)

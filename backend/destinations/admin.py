from django.contrib import admin
from .models import Destination

@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ('id','name', 'latitude', 'longitude', 'bestSeason', 'difficulty', 'crowdLevel')
    search_fields = ('id','name', 'description')
    list_filter = ('difficulty', 'bestSeason', 'crowdLevel')
    readonly_fields = ('createdAt',)

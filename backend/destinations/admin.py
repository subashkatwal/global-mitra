from django.contrib import admin
from .models import Destination

@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ('id','name', 'latitude', 'longitude', 'bestSeason', 'difficulty', 'crowdLevel','image','district','country')
    search_fields = ('id','name', 'description','district','country')
    list_filter = ('difficulty', 'bestSeason', 'crowdLevel')
    readonly_fields = ('createdAt',)

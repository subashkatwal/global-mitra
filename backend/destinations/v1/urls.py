from django.urls import path
from destinations.views import DestinationListCreateView, DestinationDetailView,DestinationBulkUpload

app_name = "destinations"

urlpatterns = [
    path("", DestinationListCreateView.as_view(), name="destination-list-create"),
    path("/<uuid:pk>", DestinationDetailView.as_view(), name="destination-detail"),
    path('/destinations/bulk-upload', DestinationBulkUpload.as_view(), name='destination-bulk-upload'),

]
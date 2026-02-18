from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from .models import Destination
from .serializers import DestinationSerializer, DestinationListSerializer
from .filters import DestinationFilter
from globalmitra.permissions import IsAdminUser

ALLOWED_ORDERING = {
    "name", "-name",
    "averageCost", "-averageCost",
    "createdAt", "-createdAt",
    "altitude", "-altitude",
}


@extend_schema(tags=["Destinations"])
class DestinationListCreateView(GenericAPIView):
    queryset = Destination.objects.all()
    filterset_class = DestinationFilter

    def get_serializer_class(self):
        return DestinationSerializer if self.request.method == "POST" else DestinationListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [AllowAny()]

    @extend_schema(
        summary="List destinations",
        parameters=[
            OpenApiParameter("search",               OpenApiTypes.STR,      OpenApiParameter.QUERY, required=False, description="Search name, description, climate, bestSeason, difficulty."),
            OpenApiParameter("ordering",             OpenApiTypes.STR,      OpenApiParameter.QUERY, required=False, enum=sorted(ALLOWED_ORDERING)),
            OpenApiParameter("page",                 OpenApiTypes.INT,      OpenApiParameter.QUERY, required=False),
            OpenApiParameter("page_size",            OpenApiTypes.INT,      OpenApiParameter.QUERY, required=False),
            OpenApiParameter("difficulty",           OpenApiTypes.STR,      OpenApiParameter.QUERY, required=False, enum=["Easy", "Moderate", "Hard", "Extreme"]),
            OpenApiParameter("bestSeason",           OpenApiTypes.STR,      OpenApiParameter.QUERY, required=False),
            OpenApiParameter("crowdLevel",           OpenApiTypes.STR,      OpenApiParameter.QUERY, required=False, enum=["Low", "Medium", "High"]),
            OpenApiParameter("safetyLevel",          OpenApiTypes.STR,      OpenApiParameter.QUERY, required=False, enum=["Safe", "Moderate", "Dangerous"]),
            OpenApiParameter("internetAvailability", OpenApiTypes.STR,      OpenApiParameter.QUERY, required=False, enum=["None", "Limited", "Moderate", "Good", "Excellent"]),
            OpenApiParameter("permitsRequired",      OpenApiTypes.BOOL,     OpenApiParameter.QUERY, required=False),
            OpenApiParameter("climate",              OpenApiTypes.STR,      OpenApiParameter.QUERY, required=False),
            OpenApiParameter("averageCost_min",      OpenApiTypes.NUMBER,   OpenApiParameter.QUERY, required=False),
            OpenApiParameter("averageCost_max",      OpenApiTypes.NUMBER,   OpenApiParameter.QUERY, required=False),
            OpenApiParameter("altitude_min",         OpenApiTypes.INT,      OpenApiParameter.QUERY, required=False),
            OpenApiParameter("altitude_max",         OpenApiTypes.INT,      OpenApiParameter.QUERY, required=False),
            OpenApiParameter("createdAt_after",      OpenApiTypes.DATETIME, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("createdAt_before",     OpenApiTypes.DATETIME, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: DestinationListSerializer(many=True)},
    )
    def get(self, request):
        queryset = Destination.objects.all()

        # Filter
        filterset = DestinationFilter(request.query_params, queryset=queryset)
        if not filterset.is_valid():
            return Response(filterset.errors, status=status.HTTP_400_BAD_REQUEST)
        queryset = filterset.qs

        # Search
        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(climate__icontains=search)
                | Q(bestSeason__icontains=search)
                | Q(difficulty__icontains=search)
            )

        # Ordering
        ordering = request.query_params.get("ordering", "-createdAt").strip()
        if ordering not in ALLOWED_ORDERING:
            return Response(
                {"error": f"Invalid ordering '{ordering}'.", "allowed": sorted(ALLOWED_ORDERING)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = queryset.order_by(ordering)

        # Pagination — uses PAGE_SIZE + DEFAULT_PAGINATION_CLASS from settings
        page = self.paginate_queryset(queryset)
        return self.get_paginated_response(
            DestinationListSerializer(page, many=True).data
        )

    @extend_schema(
        summary="Create a destination (admin only)",
        request=DestinationSerializer,
        responses={
            201: DestinationSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Admin access required."),
        },
    )
    def post(self, request):
        serializer = DestinationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



_PATH_PARAM = OpenApiParameter("id", OpenApiTypes.UUID, OpenApiParameter.PATH, required=True)


@extend_schema(tags=["Destinations"])
class DestinationDetailView(GenericAPIView):
    queryset = Destination.objects.all()
    serializer_class = DestinationSerializer
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]

    def get_object(self, pk):
        try:
            return Destination.objects.get(pk=pk)
        except Destination.DoesNotExist:
            return None

    @extend_schema(
        summary="Retrieve a destination",
        parameters=[_PATH_PARAM],
        responses={200: DestinationSerializer, 404: OpenApiResponse(description="Not found.")},
    )
    def get(self, request, pk):
        destination = self.get_object(pk)
        if not destination:
            return Response({"error": "Destination not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DestinationSerializer(destination).data)

    @extend_schema(
        summary="Partially update a destination (admin only)",
        parameters=[_PATH_PARAM],
        request=DestinationSerializer,
        responses={
            200: DestinationSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Admin access required."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def patch(self, request, pk):
        destination = self.get_object(pk)
        if not destination:
            return Response({"error": "Destination not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = DestinationSerializer(destination, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a destination (admin only)",
        parameters=[_PATH_PARAM],
        responses={
            204: None,
            403: OpenApiResponse(description="Admin access required."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def delete(self, request, pk):
        destination = self.get_object(pk)
        if not destination:
            return Response({"error": "Destination not found."}, status=status.HTTP_404_NOT_FOUND)
        destination.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
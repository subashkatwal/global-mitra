from django.db.models import Q
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from globalmitra.permissions import IsAdminUser
from .models import Destination
from .filters import DestinationFilter
from destinations.serializers import (
    DestinationSerializer,
    DestinationListSerializer,
    DestinationUploadSerializers,
    DestinationFileUploadSerializer
)

import json
import io
import csv


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
        auth=[],
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("ordering", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, enum=sorted(ALLOWED_ORDERING)),
            OpenApiParameter("page", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("page_size", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("difficulty", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("bestSeason", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("crowdLevel", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("safetyLevel", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("internetAvailability", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("permitsRequired", OpenApiTypes.BOOL, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("climate", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("averageCost_min", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("averageCost_max", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("altitude_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("altitude_max", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("createdAt_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("createdAt_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: DestinationListSerializer(many=True)},
    )
    def get(self, request):
        queryset = Destination.objects.all()

        filterset = DestinationFilter(request.query_params, queryset=queryset)
        if not filterset.is_valid():
            return Response(filterset.errors, status=status.HTTP_400_BAD_REQUEST)

        queryset = filterset.qs

        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(climate__icontains=search) |
                Q(bestSeason__icontains=search) |
                Q(difficulty__icontains=search)
            )

        ordering = request.query_params.get("ordering", "-createdAt").strip()
        if ordering not in ALLOWED_ORDERING:
            return Response(
                {"error": f"Invalid ordering '{ordering}'.", "allowed": sorted(ALLOWED_ORDERING)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = queryset.order_by(ordering)

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
    serializer_class = DestinationSerializer

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


@extend_schema(tags=["Destinations"])
class DestinationBulkUpload(GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = DestinationFileUploadSerializer
    parser_classes = [MultiPartParser]

    @extend_schema(
        summary="Bulk upload destinations via CSV or JSON file (admin only)",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "file": {"type": "string", "format": "binary"}
                },
                "required": ["file"]
            }
        },
        responses={
            201: OpenApiResponse(description="Destinations uploaded successfully."),
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Admin access required."),
        },
    )
    def post(self, request):
        file_serializer = DestinationFileUploadSerializer(data=request.data)
        if not file_serializer.is_valid():
            return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "File is required."}, status=status.HTTP_400_BAD_REQUEST)

        ext = uploaded_file.name.split('.')[-1].lower()

        try:
            raw_data = self._parse_file(uploaded_file, ext)
        except Exception as e:
            return Response({"error": f"Failed to parse file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DestinationUploadSerializers(data=raw_data, many=True)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation failed.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            created = []
            for item in serializer.validated_data:
                obj, _ = Destination.objects.update_or_create(
                    slug=item["slug"],
                    defaults=item
                )
                created.append(obj)

        return Response(
            {"message": f"{len(created)} destinations processed successfully."},
            status=status.HTTP_201_CREATED
        )

    def _parse_file(self, uploaded_file, ext):
        if ext == "json":
            return self._parse_json(uploaded_file)
        return self._parse_csv(uploaded_file)

    def _parse_json(self, uploaded_file):
        content = uploaded_file.read().decode("utf-8")
        data = json.loads(content)
        if not isinstance(data, list):
            raise ValueError("JSON file must contain a list of destinations.")
        return data

    def _parse_csv(self, uploaded_file):
        content = uploaded_file.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        data = []

        for row in reader:
            for json_field in ("famousLocalItems", "activities"):
                if json_field in row and isinstance(row[json_field], str):
                    try:
                        row[json_field] = json.loads(row[json_field])
                    except json.JSONDecodeError:
                        raise ValueError(
                            f"Invalid JSON in column '{json_field}' at row: {row.get('name', '?')}"
                        )

            if "permitsRequired" in row:
                row["permitsRequired"] = row["permitsRequired"].strip().lower() in ("true", "1", "yes")

            if row.get("altitude"):
                row["altitude"] = int(row["altitude"])

            data.append(dict(row))

        return data
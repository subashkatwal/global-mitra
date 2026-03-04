
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from destinations.models import Destination
from destinations.serializers.compare import DestinationCompareSerializer   


class DestinationCompareView(APIView):
    """
    Return comparison data for up to 4 destinations identified by slug.

    Query params
    ------------
    slugs   Comma-separated list of destination slugs, e.g.
            ?slugs=everest-base-camp,pokhara,manang
            (1–4 slugs; extra ones are ignored)
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Compare destinations by slug",
        description=(
            "Pass 1–4 comma-separated slugs via ?slugs=. "
            "Returns full destination detail for each matched slug in the "
            "same order supplied. Unknown slugs are silently skipped."
        ),
        parameters=[
            OpenApiParameter(
                name="slugs",
                description="Comma-separated destination slugs (max 4)",
                required=True,
                type=str,
                location=OpenApiParameter.QUERY,
            )
        ],
        responses={
            200: OpenApiResponse(description="List of matched destination objects"),
            400: OpenApiResponse(description="No valid slugs supplied"),
        },
        tags=["Destinations"],
    )
    def get(self, request):
        raw = request.query_params.get("slugs", "").strip()
        if not raw:
            return Response(
                {"success": False, "error": "Query parameter 'slugs' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse, deduplicate, cap at 4
        slugs = [s.strip() for s in raw.split(",") if s.strip()][:4]
        if not slugs:
            return Response(
                {"success": False, "error": "No valid slugs provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch all in one query, then re-order to match the requested slug order
        qs = Destination.objects.filter(slug__in=slugs).select_related("location")
        dest_map = {d.slug: d for d in qs}

        ordered = [dest_map[s] for s in slugs if s in dest_map]

        serializer = DestinationCompareSerializer(
            ordered, many=True, context={"request": request}
        )
        return Response(
            {"success": True, "count": len(ordered), "data": serializer.data},
            status=status.HTTP_200_OK,
        )

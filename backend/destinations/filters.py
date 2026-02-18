import django_filters
from .models import Destination


class DestinationFilter(django_filters.FilterSet):
    """
    FilterSet for Destination.

    Query parameters
    ----------------
    difficulty              exact          ?difficulty=Moderate
    bestSeason              icontains      ?bestSeason=spring
    crowdLevel              exact          ?crowdLevel=Low
    safetyLevel             exact          ?safetyLevel=Safe
    internetAvailability    exact          ?internetAvailability=Good
    permitsRequired         boolean        ?permitsRequired=true
    climate                 icontains      ?climate=tropical
    averageCost_min         >=             ?averageCost_min=500
    averageCost_max         <=             ?averageCost_max=3000
    altitude_min            >=             ?altitude_min=1000
    altitude_max            <=             ?altitude_max=8000
    createdAt_after         >=             ?createdAt_after=2024-01-01
    createdAt_before        <=             ?createdAt_before=2024-12-31
    """

    difficulty = django_filters.CharFilter(
        field_name="difficulty", lookup_expr="exact"
    )
    bestSeason = django_filters.CharFilter(
        field_name="bestSeason", lookup_expr="icontains"
    )
    crowdLevel = django_filters.CharFilter(
        field_name="crowdLevel", lookup_expr="exact"
    )
    safetyLevel = django_filters.CharFilter(
        field_name="safetyLevel", lookup_expr="exact"
    )
    internetAvailability = django_filters.CharFilter(
        field_name="internetAvailability", lookup_expr="exact"
    )
    permitsRequired = django_filters.BooleanFilter(field_name="permitsRequired")
    climate = django_filters.CharFilter(
        field_name="climate", lookup_expr="icontains"
    )

    averageCost_min = django_filters.NumberFilter(
        field_name="averageCost", lookup_expr="gte"
    )
    averageCost_max = django_filters.NumberFilter(
        field_name="averageCost", lookup_expr="lte"
    )
    altitude_min = django_filters.NumberFilter(
        field_name="altitude", lookup_expr="gte"
    )
    altitude_max = django_filters.NumberFilter(
        field_name="altitude", lookup_expr="lte"
    )

    createdAt_after = django_filters.DateTimeFilter(
        field_name="createdAt", lookup_expr="gte"
    )
    createdAt_before = django_filters.DateTimeFilter(
        field_name="createdAt", lookup_expr="lte"
    )

    class Meta:
        model = Destination
        fields = [
            "difficulty",
            "bestSeason",
            "crowdLevel",
            "safetyLevel",
            "internetAvailability",
            "permitsRequired",
            "climate",
        ]
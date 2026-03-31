# Run this in your container:
# python manage.py shell < seed_reports.py

from django.utils import timezone
from accounts.models import User
from reports.models import IncidentReport

#  grab any existing user (or the first one) 
user = User.objects.first()
if not user:
    raise Exception("No users in DB. Create one first with createsuperuser.")

now = timezone.now()

REPORTS = [
    #  Cluster 1: LANDSLIDE near Balaju (~27.737, 85.295) 
    {"category": "LANDSLIDE", "description": "Major landslide blocking the road near Balaju. Rocks and mud covering the highway completely.", "latitude": 27.7370, "longitude": 85.2950},
    {"category": "LANDSLIDE", "description": "Landslide near Balaju area. Huge boulders on road, vehicles cannot pass.", "latitude": 27.7375, "longitude": 85.2955},
    {"category": "LANDSLIDE", "description": "Road blocked by landslide close to Balaju industrial area. Mud and debris everywhere.", "latitude": 27.7368, "longitude": 85.2948},
    {"category": "LANDSLIDE", "description": "Landslide reported on Balaju bypass. Emergency crews needed urgently.", "latitude": 27.7372, "longitude": 85.2952},

    # Cluster 2: FLOOD near Thamel (~27.715, 85.312) 
    {"category": "FLOOD",     "description": "Flash flood in Thamel streets. Water level rising rapidly, shops submerged.", "latitude": 27.7150, "longitude": 85.3120},
    {"category": "FLOOD",     "description": "Flooding in Thamel area. Drainage system overflowing, roads impassable.", "latitude": 27.7153, "longitude": 85.3125},
    {"category": "FLOOD",     "description": "Severe flooding near Thamel. Several vehicles stuck in knee-deep water.", "latitude": 27.7148, "longitude": 85.3118},
    {"category": "FLOOD",     "description": "Thamel flooded after heavy rain. Tourist hotels reporting water entering ground floor.", "latitude": 27.7155, "longitude": 85.3122},

    # ── Cluster 3: ROAD_BLOCK near Koteshwor (~27.681, 85.348) 
    {"category": "ROAD_BLOCK","description": "Road blocked at Koteshwor junction due to vehicle accident. Traffic backed up for 2km.", "latitude": 27.6810, "longitude": 85.3480},
    {"category": "ROAD_BLOCK","description": "Major road blockage at Koteshwor. Overturned truck blocking both lanes.", "latitude": 27.6813, "longitude": 85.3483},
    {"category": "ROAD_BLOCK","description": "Koteshwor road completely blocked. Police on scene but traffic not moving.", "latitude": 27.6808, "longitude": 85.3478},
    {"category": "ROAD_BLOCK","description": "Vehicle breakdown causing road block near Koteshwor ring road intersection.", "latitude": 27.6815, "longitude": 85.3485},

    # Noise / scattered (won't cluster) 
    {"category": "MEDICAL",   "description": "Person injured near Patan hospital entrance.", "latitude": 27.6710, "longitude": 85.3190},
    {"category": "WILDLIFE",  "description": "Wild monkey spotted near Swayambhu stupa area.", "latitude": 27.7147, "longitude": 85.2906},
    {"category": "WEATHER",   "description": "Heavy hailstorm in Bhaktapur Durbar Square area.", "latitude": 27.6710, "longitude": 85.4298},
]

created = 0
for r in REPORTS:
    IncidentReport.objects.create(
        user=user,
        category=r["category"],
        description=r["description"],
        latitude=r["latitude"],
        longitude=r["longitude"],
        status="PENDING",
        createdAt=now,
    )
    created += 1

print(f" {created} reports seeded. Now run: python manage.py shell -c \"from reports.tasks import run_clustering; print(run_clustering())\"")
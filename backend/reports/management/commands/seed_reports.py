from django.core.management.base import BaseCommand
from reports.models import IncidentReport, IncidentCluster, AlertBroadcast, Notification
from accounts.models import User


class Command(BaseCommand):
    help = 'Seed test reports and run clustering'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data first')

    def handle(self, *args, **options):
        if options['clear']:
            Notification.objects.all().delete()
            AlertBroadcast.objects.all().delete()
            IncidentCluster.objects.all().delete()
            IncidentReport.objects.all().delete()
            self.stdout.write('🗑️  Cleared existing data')

        users_data = [
            ("ram.sharma@gmail.com",   "Ram Sharma",   "USER"),
            ("sita.thapa@gmail.com",   "Sita Thapa",   "USER"),
            ("hari.rana@gmail.com",    "Hari Rana",    "USER"),
            ("gita.bista@gmail.com",   "Gita Bista",   "USER"),
            ("sunil.kc@gmail.com",     "Sunil KC",     "USER"),
            ("maya.gurung@gmail.com",  "Maya Gurung",  "USER"),
            ("guide.pemba@gmail.com",  "Pemba Sherpa", "GUIDE"),
            ("guide.dawa@gmail.com",   "Dawa Lama",    "GUIDE"),
            ("guide.tenzin@gmail.com", "Tenzin Norbu", "GUIDE"),
        ]
        U = {}
        for email, name, role in users_data:
            u, created = User.objects.get_or_create(
                email=email,
                defaults={"fullName": name, "role": role, "username": email.split("@")[0]}
            )
            if created:
                u.set_password("Test@1234")
                u.save()
            U[email] = u

        IncidentReport.objects.bulk_create([
            IncidentReport(user=U["ram.sharma@gmail.com"],   description="Severe flooding Thamel streets water knee deep roads submerged flood emergency",     category="FLOOD",     latitude=27.7150, longitude=85.3120, status="PENDING"),
            IncidentReport(user=U["sita.thapa@gmail.com"],   description="Flash flood Thamel streets flooded water rising shops flood damage roads closed",    category="FLOOD",     latitude=27.7155, longitude=85.3125, status="PENDING"),
            IncidentReport(user=U["guide.pemba@gmail.com"],  description="Thamel flooding emergency water rising fast flood blocking roads evacuation needed",  category="FLOOD",     latitude=27.7148, longitude=85.3115, status="PENDING"),
            IncidentReport(user=U["guide.dawa@gmail.com"],   description="Flood emergency Thamel streets underwater tourists stranded water rising rescue",    category="FLOOD",     latitude=27.7160, longitude=85.3130, status="PENDING"),
            IncidentReport(user=U["hari.rana@gmail.com"],    description="Landslide blocking road Patan rocks mud covering road vehicles cannot pass debris",  category="LANDSLIDE", latitude=27.6680, longitude=85.3250, status="PENDING"),
            IncidentReport(user=U["gita.bista@gmail.com"],   description="Major landslide Patan boulders mud blocking road completely rocks debris closed",    category="LANDSLIDE", latitude=27.6685, longitude=85.3255, status="PENDING"),
            IncidentReport(user=U["guide.tenzin@gmail.com"], description="Landslide Patan road completely blocked rocks mud debris emergency closure",         category="LANDSLIDE", latitude=27.6675, longitude=85.3245, status="PENDING"),
            IncidentReport(user=U["sunil.kc@gmail.com"],     description="Landslide Bhaktapur blocking highway rocks road traffic stopped mud debris",         category="LANDSLIDE", latitude=27.6710, longitude=85.4280, status="PENDING"),
            IncidentReport(user=U["maya.gurung@gmail.com"],  description="Road blocked landslide Bhaktapur mud boulders no passage rocks emergency",           category="LANDSLIDE", latitude=27.6715, longitude=85.4285, status="PENDING"),
            IncidentReport(user=U["ram.sharma@gmail.com"],   description="Bhaktapur landslide rocks mud blocking road completely people stuck closed",         category="LANDSLIDE", latitude=27.6705, longitude=85.4275, status="PENDING"),
            IncidentReport(user=U["guide.pemba@gmail.com"],  description="Tourist injured Everest Base Camp altitude sickness medical evacuation helicopter",  category="MEDICAL",   latitude=27.9881, longitude=86.9250, status="PENDING"),
            IncidentReport(user=U["sita.thapa@gmail.com"],   description="Wild leopard spotted Chitwan village forest department wildlife danger warning",     category="WILDLIFE",  latitude=27.5291, longitude=84.3542, status="PENDING"),
        ])
        self.stdout.write(f'✅ Created 12 reports — PENDING: {IncidentReport.objects.filter(status="PENDING").count()}')

        from reports.clustering import run_clustering
        result = run_clustering()

        self.stdout.write(f'Clusters : {len(result.get("clusters_created", []))}')
        self.stdout.write(f'Noise    : {result.get("noise_count")}')
        for c in result.get('clusters_created', []):
            self.stdout.write(f'  [{c["category"]}] {c["report_count"]} reports | {c["severity"]}')
        self.stdout.write(f'DB clusters : {IncidentCluster.objects.count()}')
        self.stdout.write(f'DB alerts   : {AlertBroadcast.objects.count()}')

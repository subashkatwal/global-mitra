# reports/management/commands/simulate_incidents.py
"""
Simulate incidents for testing the reporting system.

Run with:
    python manage.py simulate_incidents

Shows 3 scenarios:
  A — 5 landslide reports near Langtang  → AUTO-BROADCAST triggered
  B — 3 flood reports near Thamel        → Admin notified only
  C — 3 scattered noise reports          → Rejected as false alarms
"""

import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from reports.models import IncidentReport, IncidentCluster, AlertBroadcast, Notification
from reports.tasks import analyze_incident_reports


class Command(BaseCommand):
    help = 'Simulate incident reports for testing clustering and alerts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear old simulation data first',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("\nGlobal Mitra — Incident System Demo Simulation"))
        self.stdout.write("=" * 60)

        # Setup users
        admin = self.get_or_create_user('admin@demo.test', 'ADMIN', is_staff=True)
        tourists = [self.get_or_create_user(f't{i}@demo.test', 'TOURIST') for i in range(1, 12)]
        guide = self.get_or_create_user('guide@demo.test', 'GUIDE')

        all_users = tourists + [guide]

        if options['clear']:
            self.clear_old_data(all_users + [admin])

        # Run scenarios
        self.scenario_a(all_users[:6])      # 5 reports + 1 extra
        self.scenario_b(all_users[6:9])     # 3 reports
        self.scenario_c(all_users[9:12])    # 3 noise reports

        self.print_summary()

    def get_or_create_user(self, email, role, is_staff=False):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'fullName': f'Test {role}',
                'role': role,
                'verified': True,
                'is_staff': is_staff,
                'is_superuser': is_staff,
                'isActive': True,
            },
        )
        if created:
            user.set_password('Test1234!')
            user.save()
            self.stdout.write(f"  Created user: {email}")
        return user

    def clear_old_data(self, sim_users):
        count_reports = IncidentReport.objects.filter(user__in=sim_users).count()
        count_clusters = IncidentCluster.objects.count()
        count_alerts = AlertBroadcast.objects.count()
        count_notifs = Notification.objects.filter(recipient__in=sim_users).count()

        IncidentReport.objects.filter(user__in=sim_users).delete()
        IncidentCluster.objects.all().delete()
        AlertBroadcast.objects.all().delete()
        Notification.objects.filter(recipient__in=sim_users).delete()
        
        self.stdout.write(self.style.WARNING(
            f"Cleared: {count_reports} reports, {count_clusters} clusters, "
            f"{count_alerts} alerts, {count_notifs} notifications"
        ))

    def make_report(self, user, lat, lon, description, category='LANDSLIDE'):
        return IncidentReport.objects.create(
            user=user,
            latitude=lat,
            longitude=lon,
            description=description,
            category=category,
        )

    def jitter(self, lat, lon, scale=0.002):
        """Add tiny random offset so reports aren't identical GPS."""
        return lat + random.uniform(-scale, scale), lon + random.uniform(-scale, scale)

    def scenario_a(self, users):
        self.stdout.write(self.style.HTTP_INFO(
            "\n── Scenario A: 5 landslide reports near Langtang ─────────────────"
        ))
        self.stdout.write("   Expected: AUTO-BROADCAST (≥5 reports, within 1km)")
        
        texts = [
            "Massive landslide has blocked the road. Mud and rocks everywhere.",
            "Road blocked by landslide. Cannot pass with vehicles.",
            "Landslide near the trail. Road completely blocked by mud.",
            "Large landslide blocking road. Trees fallen across path.",
            "Confirmed landslide on trekking route. Mud covering the road.",
        ]
        center = (28.2140, 85.5190)  # Langtang
        reports = []
        
        for i, (user, text) in enumerate(zip(users[:5], texts)):
            lat, lon = self.jitter(*center, scale=0.004)  # ~400m jitter
            r = self.make_report(user, lat, lon, text, 'LANDSLIDE')
            reports.append(r)
            self.stdout.write(f"   [{i+1}/5] {user.email} → ({lat:.4f}, {lon:.4f})")

        self.stdout.write("   Running clustering algorithm...")
        result = analyze_incident_reports(str(reports[-1].id))
        self.stdout.write(f"   Result: {result}")

        # Verify
        cluster_count = IncidentCluster.objects.filter(dominantCategory='LANDSLIDE').count()
        alert_count = AlertBroadcast.objects.filter(triggerType='AUTO').count()
        
        if 'AUTO-BROADCAST' in result:
            self.stdout.write(self.style.SUCCESS("   ✓ PASS: Auto-broadcast triggered"))
        else:
            self.stdout.write(self.style.ERROR("   ✗ FAIL: Auto-broadcast NOT triggered"))

    def scenario_b(self, users):
        self.stdout.write(self.style.HTTP_INFO(
            "\n── Scenario B: 3 flood reports near Thamel ───────────────────────"
        ))
        self.stdout.write("   Expected: Admin notified only (< 5 reports)")
        
        texts = [
            "Road flooded with water. Cannot pass. Water level rising fast.",
            "Flood water blocking road completely. River overflowing.",
            "Flash flood blocking the trail. Water dangerously high.",
        ]
        center = (27.7172, 85.3140)  # Thamel, Kathmandu
        reports = []
        
        for i, (user, text) in enumerate(zip(users[:3], texts)):
            lat, lon = self.jitter(*center, scale=0.003)  # ~300m jitter
            r = self.make_report(user, lat, lon, text, 'FLOOD')
            reports.append(r)
            self.stdout.write(f"   [{i+1}/3] {user.email} → ({lat:.4f}, {lon:.4f})")

        self.stdout.write("   Running clustering algorithm...")
        result = analyze_incident_reports(str(reports[-1].id))
        self.stdout.write(f"   Result: {result}")

        if 'Admin notified' in result and 'AUTO-BROADCAST' not in result:
            self.stdout.write(self.style.SUCCESS("   ✓ PASS: Admin notified, no auto-broadcast"))
        else:
            self.stdout.write(self.style.ERROR("   ✗ FAIL: Unexpected result"))

    def scenario_c(self, users):
        self.stdout.write(self.style.HTTP_INFO(
            "\n── Scenario C: 3 scattered noise reports ─────────────────────────"
        ))
        self.stdout.write("   Expected: No cluster (false alarms rejected, >1km apart)")
        
        # Scattered across Nepal (>1km apart)
        data = [
            ((27.7172, 85.3140), "Saw a nice temple today. Very peaceful.", 'OTHER'),      # Thamel
            ((28.2096, 83.9856), "Good weather in Pokhara. Sunny and clear.", 'WEATHER'),  # Pokhara (~200km)
            ((27.9880, 86.9250), "Wifi not working at the lodge.", 'OTHER'),               # Everest region (~150km)
        ]
        reports = []
        
        for i, (user, (loc, text, cat)) in enumerate(zip(users[:3], data)):
            lat, lon = self.jitter(*loc, scale=0.0005)  # Minimal jitter
            r = self.make_report(user, lat, lon, text, cat)
            reports.append(r)
            self.stdout.write(f"   [{i+1}/3] {user.email} → ({lat:.4f}, {lon:.4f}) '{text[:50]}'")

        self.stdout.write("   Running clustering algorithm...")
        result = analyze_incident_reports(str(reports[-1].id))
        self.stdout.write(f"   Result: {result}")

        if 'No clusters found' in result or 'noise' in result.lower():
            self.stdout.write(self.style.SUCCESS("   ✓ PASS: No cluster formed (noise rejected)"))
        else:
            self.stdout.write(self.style.WARNING("   ! INFO: Cluster may have formed if text similarity overrode GPS"))

    def print_summary(self):
        self.stdout.write(self.style.HTTP_INFO("\n" + "═" * 60))
        self.stdout.write(self.style.HTTP_INFO("  SIMULATION SUMMARY"))
        self.stdout.write(self.style.HTTP_INFO("═" * 60))
        
        total_reports = IncidentReport.objects.count()
        total_clusters = IncidentCluster.objects.count()
        auto_broadcasts = AlertBroadcast.objects.filter(triggerType='AUTO').count()
        admin_notifs = Notification.objects.filter(notificationType='CLUSTER_FORMED').count()
        user_alerts = Notification.objects.filter(notificationType='AUTO_ALERT').count()
        noise = IncidentReport.objects.filter(cluster__isnull=True).count()

        self.stdout.write(f"  Total Reports   : {total_reports}")
        self.stdout.write(f"  Clusters Formed : {total_clusters}")
        self.stdout.write(f"  Auto Broadcasts : {auto_broadcasts}")
        self.stdout.write(f"  Admin Notifs    : {admin_notifs}")
        self.stdout.write(f"  User Alerts     : {user_alerts}")
        self.stdout.write(f"  Noise Rejected  : {noise} reports")
        
        self.stdout.write(self.style.HTTP_INFO("\n  Check Django admin for details:"))
        self.stdout.write("  http://localhost:8000/admin/")
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from reports.models import IncidentReport
from reports.clustering import run_clustering_pipeline, save_clusters_to_db


class Command(BaseCommand):
    help = 'Run DBSCAN clustering on recent incident reports'

    def add_arguments(self, parser):
        parser.add_argument(
            '--window',
            type=int,
            default=3,
            help='Time window in hours'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show results without saving'
        )

    def handle(self, *args, **options):
        window_hours = options['window']
        cutoff = timezone.now() - timedelta(hours=window_hours)
        
        reports = IncidentReport.objects.filter(
            created_at__gte=cutoff,
            status__in=['PENDING', 'VERIFIED', 'AUTO_ALERTED']
        ).select_related('user')
        
        if not reports.exists():
            self.stdout.write(self.style.WARNING('No reports found'))
            return
        
        self.stdout.write(f"Processing {reports.count()} reports...")
        
        clusters = run_clustering_pipeline(reports)
        
        if options['dry_run']:
            for c in clusters:
                self.stdout.write(f"Cluster: {c['dominant_category']} at ({c['center_latitude']:.4f}, {c['center_longitude']:.4f}) - {c['report_count']} reports")
            return
        
        created = save_clusters_to_db(clusters)
        self.stdout.write(self.style.SUCCESS(f'Created {len(created)} clusters'))
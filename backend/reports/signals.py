import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender="reports.IncidentReport")
def trigger_clustering_on_new_report(sender, instance, created, **kwargs):
    if not created:
        return

    logger.info("IncidentReport %s created - triggering clustering.", instance.id)

    try:
        from django.utils import timezone
        from datetime import timedelta
        from reports.models import IncidentReport
        from reports.clustering import run_clustering_pipeline, save_clusters_to_db

        cutoff = timezone.now() - timedelta(hours=3)
        reports = IncidentReport.objects.filter(
            createdAt__gte=cutoff, status__in=["PENDING", "VERIFIED"]
        ).select_related("user")

        if reports.count() < 3:
            logger.info("Clustering skipped: fewer than 3 reports in window.")
            return

        clusters = run_clustering_pipeline(reports)
        created_clusters = save_clusters_to_db(clusters)
        logger.info("Clustering done - %d cluster(s) created.", len(created_clusters))

    except Exception as exc:
        logger.exception(
            "Clustering failed after IncidentReport %s: %s", instance.id, exc
        )

# incidents/signals.py
"""
post_save on IncidentReport → run_clustering()

The signal fires every time a new IncidentReport row is inserted.
Only NEW reports trigger clustering (created=True guard).

For high-volume production, swap the direct call for a Celery task:
    from incidents.tasks import run_clustering_task
    run_clustering_task.delay()
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender='reports.IncidentReport')
def trigger_clustering_on_new_report(sender, instance, created, **kwargs):
    """
    Only runs on INSERT (created=True).
    Status updates (e.g. admin VERIFIED/REJECTED) do NOT re-trigger clustering.
    """
    if not created:
        return

    logger.info(
        'IncidentReport %s created by user %s — triggering clustering.',
        instance.id,
        instance.user_id,
    )

    try:
        from reports.clustering import run_clustering
        result = run_clustering()

        if result.get('skipped'):
            logger.info('Clustering skipped: %s', result.get('reason'))
        else:
            logger.info(
                'Clustering done — %d cluster(s) created, %d noise points.',
                len(result.get('clusters_created', [])),
                result.get('noise_count', 0),
            )

    except Exception as exc:
        # Never crash the HTTP request because clustering failed
        logger.exception(
            'Clustering failed after IncidentReport %s: %s', instance.id, exc
        )
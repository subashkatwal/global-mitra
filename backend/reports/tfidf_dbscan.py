"""
TF-IDF + DBSCAN Clustering Engine for Global Mitra Incident Reports.
Synchronous processing - no background workers.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Tuple, Optional
import re
from collections import Counter


class IncidentClusteringEngine:
    def __init__(
        self,
        eps: float = 0.5,
        min_samples: int = 3,
        geo_weight: float = 0.3,
        max_features: int = 1000,
        min_df: int = 1,        # Add this
        max_df: float = 0.9     # Change default to 0.9
    ):
        self.eps = eps
        self.min_samples = min_samples
        self.geo_weight = geo_weight
        self.max_features = max_features
        self.min_df = min_df    # Store it
        self.max_df = max_df 
        
        # State
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_matrix: Optional[np.ndarray] = None
        self.labels: Optional[np.ndarray] = None
    
    def preprocess_text(self, text: str) -> str:
        """Clean and normalize incident descriptions."""
        if not text:
            return ""
        # Lowercase, remove special chars, keep alphanumeric and spaces
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', '', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text
    
    def extract_top_keywords(
        self, 
        descriptions: List[str], 
        cluster_indices: List[int],
        top_n: int = 5
    ) -> List[str]:
        """Extract top TF-IDF keywords for a specific cluster."""
        if not cluster_indices or self.vectorizer is None:
            return []
        
        # Get TF-IDF matrix for cluster documents
        cluster_descriptions = [descriptions[i] for i in cluster_indices]
        tfidf_matrix = self.vectorizer.transform(cluster_descriptions)
        
        # Sum TF-IDF scores across documents
        mean_scores = np.array(tfidf_matrix.mean(axis=0)).flatten()
        
        # Get feature names
        feature_names = self.vectorizer.get_feature_names_out()
        
        # Sort by score and return top N
        top_indices = mean_scores.argsort()[-top_n:][::-1]
        return [feature_names[i] for i in top_indices if mean_scores[i] > 0]
    
    def compute_cluster_confidence(
        self,
        reports: List[Dict],
        cluster_indices: List[int]
    ) -> float:
        """
        Compute confidence score based on:
        - Report confidence scores (if available)
        - Cluster density (cohesion)
        - Category consistency
        """
        if not cluster_indices:
            return 0.0
        
        cluster_reports = [reports[i] for i in cluster_indices]
        
        # Average confidence score
        confidences = [
            r.get('confidenceScore', 0.5) 
            for r in cluster_reports 
            if r.get('confidenceScore') is not None
        ]
        avg_confidence = np.mean(confidences) if confidences else 0.5
        
        # Category consistency (higher if dominant category > 60%)
        categories = [r.get('category', 'UNKNOWN') for r in cluster_reports]
        if categories:
            most_common = Counter(categories).most_common(1)[0]
            category_ratio = most_common[1] / len(categories)
        else:
            category_ratio = 0.0
        
        # Combined score (0-1 scale)
        confidence = (avg_confidence * 0.6) + (category_ratio * 0.4)
        return round(min(confidence, 1.0), 3)
    
    def get_dominant_category(self, reports: List[Dict], cluster_indices: List[int]) -> str:
        """Determine the most frequent category in a cluster."""
        if not cluster_indices:
            return "UNKNOWN"
        
        categories = [
            reports[i].get('category', 'UNKNOWN') 
            for i in cluster_indices
        ]
        
        if not categories or all(c == "UNKNOWN" for c in categories):
            return "MIXED"
        
        most_common = Counter(categories).most_common(1)[0]
        # Only return if clearly dominant (>40%), otherwise MIXED
        if most_common[1] / len(categories) > 0.4:
            return most_common[0]
        return "MIXED"
    
    def compute_cluster_center(
        self,
        reports: List[Dict],
        cluster_indices: List[int]
    ) -> Tuple[float, float]:
        """Calculate geographic center of cluster."""
        if not cluster_indices:
            return (0.0, 0.0)
        
        lats = []
        lons = []
        
        for i in cluster_indices:
            report = reports[i]
            lat = report.get('latitude')
            lon = report.get('longitude')
            if lat is not None and lon is not None:
                lats.append(lat)
                lons.append(lon)
        
        if not lats:
            return (0.0, 0.0)
        
        return (round(np.mean(lats), 6), round(np.mean(lons), 6))
    
    def fit_predict(self, reports: List[Dict]) -> Dict:
        """
        Main clustering pipeline.
        
        Args:
            reports: List of dicts with keys: id, description, category, 
                     latitude, longitude, confidenceScore
        
        Returns:
            Dict with cluster assignments and metadata
        """
        if len(reports) < self.min_samples:
            # Not enough data for clustering
            return {
                'labels': [-1] * len(reports),
                'clusters': {},
                'noise': list(range(len(reports)))
            }
        
        # Preprocess descriptions
        descriptions = [self.preprocess_text(r.get('description', '')) for r in reports]
        
        # TF-IDF Vectorization
       
        self.vectorizer = TfidfVectorizer(
            max_features=self.max_features,
            min_df=self.min_df,      # Use the parameter
            max_df=self.max_df,      # Use the parameter
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        text_features = self.vectorizer.fit_transform(descriptions)
        
        # Normalize text features (sparse to dense for concatenation)
        text_dense = text_features.toarray()
        
        # Geographic features (normalize to 0-1 scale roughly)
        geo_features = []
        for r in reports:
            lat = r.get('latitude', 0) or 0
            lon = r.get('longitude', 0) or 0
            # Normalize lat/lon to roughly same scale as TF-IDF (0-1)
            # Lat: -90 to 90 -> 0 to 1
            # Lon: -180 to 180 -> 0 to 1
            norm_lat = (lat + 90) / 180 if lat else 0.5
            norm_lon = (lon + 180) / 360 if lon else 0.5
            geo_features.append([norm_lat, norm_lon])
        
        geo_features = np.array(geo_features)
        
        # Scale geo features to match text feature variance
        self.scaler = StandardScaler()
        geo_scaled = self.scaler.fit_transform(geo_features)
        
        # Combine features: text (1-geo_weight) + geo (geo_weight)
        # Weight text more heavily by default (0.7 text, 0.3 geo)
        text_weight = 1 - self.geo_weight
        combined_features = np.hstack([
            text_dense * text_weight,
            geo_scaled * self.geo_weight
        ])
        
        # DBSCAN Clustering
        dbscan = DBSCAN(
            eps=self.eps,
            min_samples=self.min_samples,
            metric='euclidean',
            n_jobs=1  # Ensure synchronous single-threaded execution
        )
        
        self.labels = dbscan.fit_predict(combined_features)
        
        # Organize results
        clusters = {}
        noise_indices = []
        
        unique_labels = set(self.labels)
        for label in unique_labels:
            if label == -1:
                # Noise points (unclustered)
                noise_indices = np.where(self.labels == -1)[0].tolist()
            else:
                # Valid cluster
                cluster_indices = np.where(self.labels == label)[0].tolist()
                
                # Compute cluster metadata
                center_lat, center_lon = self.compute_cluster_center(reports, cluster_indices)
                top_keywords = self.extract_top_keywords(descriptions, cluster_indices)
                dominant_category = self.get_dominant_category(reports, cluster_indices)
                confidence = self.compute_cluster_confidence(reports, cluster_indices)
                
                clusters[int(label)] = {
                    'indices': cluster_indices,
                    'report_ids': [reports[i]['id'] for i in cluster_indices],
                    'centerLatitude': center_lat,
                    'centerLongitude': center_lon,
                    'topKeywords': top_keywords,
                    'dominantCategory': dominant_category,
                    'confidenceScore': confidence,
                    'size': len(cluster_indices)
                }
        
        return {
            'labels': self.labels.tolist(),
            'clusters': clusters,
            'noise': noise_indices,
            'total_reports': len(reports),
            'n_clusters': len(clusters),
            'n_noise': len(noise_indices)
        }
    
    def get_cluster_for_report(self, report_index: int) -> Optional[int]:
        """Get cluster label for a specific report index."""
        if self.labels is None or report_index >= len(self.labels):
            return None
        label = self.labels[report_index]
        return None if label == -1 else int(label)


def process_new_incident(all_reports_queryset, new_report_id: int) -> Dict:
    """
    High-level function to process a new incident.
    Called synchronously from Django view after saving new report.
    
    Args:
        all_reports_queryset: Django QuerySet of relevant reports (PENDING, VERIFIED, AUTO_ALERTED)
        new_report_id: ID of the newly created report
    
    Returns:
        Dict with clustering results and alert triggers
    """
    # Convert queryset to list of dicts for ML processing
    reports = []
    report_index_map = {}  # Map report ID to index in array
    
    for idx, report in enumerate(all_reports_queryset):
        reports.append({
            'id': report.id,
            'description': report.description or '',
            'category': report.category or 'UNKNOWN',
            'latitude': report.latitude,
            'longitude': report.longitude,
            'confidenceScore': report.confidenceScore or 0.5,
            'status': report.status
        })
        report_index_map[report.id] = idx
    
    # Ensure new report is in the list
    if new_report_id not in report_index_map:
        raise ValueError(f"New report {new_report_id} not found in queryset")
    
    # Run clustering
    engine = IncidentClusteringEngine(
        eps=0.6,  # Tuned for mixed text+geo similarity
        min_samples=3,
        geo_weight=0.25  # 75% text, 25% location
    )
    
    result = engine.fit_predict(reports)
    
    # Find which cluster (if any) the new report belongs to
    new_report_idx = report_index_map[new_report_id]
    new_report_cluster = engine.get_cluster_for_report(new_report_idx)
    
    # Determine actions needed
    actions = {
        'cluster_formed': False,
        'cluster_updated': False,
        'auto_alert_triggered': False,
        'affected_cluster_id': None,
        'cluster_confidence': 0.0
    }
    
    if new_report_cluster is not None:
        cluster_data = result['clusters'][new_report_cluster]
        actions['affected_cluster_id'] = new_report_cluster
        actions['cluster_confidence'] = cluster_data['confidenceScore']
        
        # Check if this is a new cluster formation (size exactly 3 means just formed)
        if cluster_data['size'] == 3:
            actions['cluster_formed'] = True
        
        # Check auto-alert threshold (confidence > 0.75)
        if cluster_data['confidenceScore'] > 0.75:
            actions['auto_alert_triggered'] = True
        
        actions['cluster_updated'] = True
    
    return {
        'clustering_result': result,
        'new_report_cluster': new_report_cluster,
        'actions': actions,
        'report_index_map': report_index_map
    }
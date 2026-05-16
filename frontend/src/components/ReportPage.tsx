
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, MapPin, Navigation, Send, RefreshCw,
  Shield, Loader2, X, Bell, Radio, Hash, CheckCircle,
  ImagePlus, Crosshair, Clock, BarChart2, Lock,
  AlertOctagon, Info, ShieldAlert, MapPinned, Cloud, Waves
} from 'lucide-react';

const C = {
  bg:        '#F8FAFC',
  card:      '#FFFFFF',
  inputBg:   '#F1F5F9',
  border:    '#E2E8F0',
  borderFocus:'#3B82F6',
  primary:   '#2563EB',
  primaryD:  '#1D4ED8',
  primaryL:  '#DBEAFE',
  success:   '#059669',
  successBg: '#D1FAE5',
  error:     '#DC2626',
  errorBg:   '#FEE2E2',
  warning:   '#D97706',
  warningBg: '#FEF3C7',
  textMain:  '#0F172A',
  textSub:   '#475569',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  verified:  { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '#DC2626' },
  possible:  { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: '#D97706' },
};

const PIPELINE = {
  TIME_WINDOW_HOURS:   3,
  GEO_RADIUS_KM:       3.0,
  MIN_CLUSTER_REPORTS: 3,
  DBSCAN_EPS:          0.62,
  DBSCAN_MIN_SAMPLES:  3,
};

const API_BASE =
  (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_API_URL) ||
  (import.meta as any).env?.VITE_API_URL || '/api/v1';

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) { 
    const e = await res.json().catch(() => ({})); 
    throw { status: res.status, data: e }; 
  }
  return res.json();
}

async function apiFetchForm(path: string, body: FormData) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  if (!res.ok) { 
    const e = await res.json().catch(() => ({})); 
    throw { status: res.status, data: e }; 
  }
  return res.json();
}

function parseErr(e: any): string {
  const d = e?.data || e;
  if (!d) return 'Something went wrong. Please try again.';
  if (d.errors && typeof d.errors === 'object') {
    const msgs = Object.entries(d.errors).flatMap(([, v]) => 
      Array.isArray(v) ? v as string[] : [String(v)]
    );
    if (msgs.length) return msgs.join(' • ');
  }
  return d.detail || d.error || d.message || e?.message || 'Something went wrong.';
}

const CATEGORIES = [
  { value: 'WEATHER',    label: 'Weather',           icon: Cloud },
  { value: 'LANDSLIDE',  label: 'Landslide',         icon: AlertOctagon },
  { value: 'FLOOD',      label: 'Flood',             icon: Waves },
  { value: 'ROAD_BLOCK', label: 'Road Block',        icon: AlertTriangle },
  { value: 'MEDICAL',    label: 'Medical Emergency', icon: ShieldAlert },
  { value: 'WILDLIFE',   label: 'Wildlife',          icon: AlertTriangle },
  { value: 'OTHER',      label: 'Other',             icon: Info },
];

interface Cluster {
  id:               string;
  reportCount:      number;
  location:         string;
  keywords:         string[];
  dominantCategory: string;
  confidenceScore:  number;
  isAlertTriggered: boolean;
}

type LocState = 'idle' | 'requesting' | 'denied' | 'granted' | 'unavailable' | 'error';
function LocationGate({ state, onRetry, onClose }: { state: LocState; onRetry: () => void; onClose: () => void }) {
  const getIcon = () => {
    switch (state) {
      case 'requesting': return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'granted': return <CheckCircle className="w-8 h-8 text-emerald-500" />;
      case 'denied': return <Lock className="w-8 h-8 text-amber-500" />;
      default: return <MapPin className="w-8 h-8 text-red-500" />;
    }
  };

  const content = {
    requesting: { title: 'Requesting Location Access', desc: 'Please allow location access when prompted. High-accuracy GPS is required for incident reporting.', showButtons: false },
    granted: { title: 'Location Access Granted', desc: 'Your location has been successfully acquired.', showButtons: true },
    denied: { title: 'Location Access Denied', desc: 'Location access is required to submit incident reports. GPS coordinates help us cluster nearby incidents.', showButtons: true },
    unavailable: { title: 'Location Unavailable', desc: 'Unable to access your location. Please check your device settings and try again.', showButtons: true },
    error: { title: 'Location Error', desc: 'An error occurred while accessing your location. Please try again.', showButtons: true },
    idle: { title: 'Location Required', desc: 'Please enable location access to continue.', showButtons: true },
  }[state] || content.idle;

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}>
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-blue-500" />
        <div className="p-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            {getIcon()}
          </div>
          <h2 className="text-xl font-bold text-center text-slate-900 mb-3">{content.title}</h2>
          <p className="text-sm text-center text-slate-600 mb-6 leading-relaxed">{content.desc}</p>
          
          {state === 'denied' && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">How to enable:</p>
              <ol className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  Click the lock icon in your browser address bar
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  Find "Location" and set to "Allow"
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  Refresh the page and try again
                </li>
              </ol>
            </div>
          )}

          {content.showButtons && (
            <div className="flex gap-3">
              {state !== 'granted' && (
                <button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <Navigation className="w-4 h-4" />
                  {state === 'granted' ? 'Continue' : 'Try Again'}
                </button>
              )}
              <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MapEmbed({ lat, lng, clusters }: { lat: number; lng: number; clusters: Cluster[] }) {
  const bbox = `${lng - 0.07},${lat - 0.05},${lng + 0.07},${lat + 0.05}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const labels = clusters.slice(0, 3).map((c) => ({
    label: c.location,
    color: (c.isAlertTriggered || c.reportCount >= PIPELINE.MIN_CLUSTER_REPORTS) ? C.error : C.warning,
  }));

  return (
    <div className="relative w-full h-full bg-slate-100">
      <iframe title="Incident Map" src={src} className="w-full h-full border-0" loading="lazy" />
      {labels.length > 0 && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {labels.map((m, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-xs font-medium text-slate-700">{m.label}</span>
            </div>
          ))}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-slate-200">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Verified
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Possible
          </span>
        </div>
        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          Open Full Map
        </a>
      </div>
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const verified = cluster.isAlertTriggered || cluster.reportCount >= PIPELINE.MIN_CLUSTER_REPORTS;
  const style = verified ? C.verified : C.possible;

  return (
    <div className="rounded-xl border p-4 transition-shadow hover:shadow-md" style={{ background: style.bg, borderColor: style.border }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: verified ? '#FEE2E2' : '#FEF3C7' }}>
          {verified ? <ShieldAlert className="w-5 h-5" style={{ color: style.icon }} /> : <AlertTriangle className="w-5 h-5" style={{ color: style.icon }} />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: style.text }}>
            {verified ? 'Verified Incident' : 'Possible Incident'}
          </span>
          {!verified && <p className="text-xs text-slate-500 mb-2 italic">Awaiting additional reports for verification</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {cluster.reportCount} reports</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {cluster.location}</span>
            {cluster.confidenceScore > 0 && <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> {Math.round(cluster.confidenceScore * 100)}% confidence</span>}
          </div>
          {cluster.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cluster.keywords.slice(0, 5).map((k) => (
                <span key={k} className="px-2.5 py-1 rounded-md text-xs font-medium border bg-white" style={{ borderColor: style.border, color: C.textSub }}>
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineStrip() {
  const items = [
    { icon: Clock, label: `${PIPELINE.TIME_WINDOW_HOURS}h window` },
    { icon: Crosshair, label: `${PIPELINE.GEO_RADIUS_KM}km radius` },
    { icon: Hash, label: `Min ${PIPELINE.MIN_CLUSTER_REPORTS} reports` },
    { icon: BarChart2, label: `DBSCAN ε=${PIPELINE.DBSCAN_EPS}` },
  ];

  return (
    <div className="flex flex-wrap gap-2 px-6 pb-4">
      {items.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-slate-50 text-slate-600 border-slate-200">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
      ))}
    </div>
  );
}

interface ReportPageProps {
  isOpen: boolean;
  onClose: () => void;
  placeId?: string | null;
}

export function ReportPage({ isOpen, onClose, placeId }: ReportPageProps) {
  const [locState, setLocState] = useState<LocState>('idle');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [category, setCategory] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const photoRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mapLat = lat ?? 27.7172;
  const mapLng = lng ?? 85.3240;
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocState('unavailable');
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setLocState('requesting');
    setLocationError(null);

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (permissionStatus.state === 'denied') {
          setLocState('denied');
          setLocationError('Location permission denied.');
          return;
        }
      } catch (e) {

      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));
        setLocState('granted');
        setLocationError(null);
      },
      (err) => {
        console.error('Geolocation error:', err);
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            setLocState('denied');
            setLocationError('Location access denied by user or browser.');
            break;
          case 2: // POSITION_UNAVAILABLE
            setLocState('unavailable');
            setLocationError('Unable to determine location. Check GPS settings.');
            break;
          case 3: // TIMEOUT
            setLocState('error');
            setLocationError('Location request timed out.');
            break;
          default:
            setLocState('error');
            setLocationError('An unknown error occurred.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // Request location when opened
  useEffect(() => {
    if (isOpen && locState === 'idle') {
      requestLocation();
    }
  }, [isOpen, locState, requestLocation]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // Load clusters
  const loadClusters = useCallback(async () => {
    setAlertsLoading(true);
    try {
      let data: any;
      try { data = await apiFetch('/clusters'); } catch { data = await apiFetch('/reports/alerts'); }
      const items: any[] = data.results ?? data.clusters ?? data.data ?? (Array.isArray(data) ? data : []);
      setClusters(items.map((r: any): Cluster => ({
        id: r.id,
        reportCount: r.reportCount ?? r.report_count ?? r.reports_count ?? r.reports?.length ?? 1,
        location: r.place ?? r.location ?? r.area ?? (r.centerLatitude != null ? `${Number(r.centerLatitude).toFixed(4)}, ${Number(r.centerLongitude).toFixed(4)}` : 'Unknown'),
        keywords: r.topKeywords ?? r.top_keywords ?? r.keywords ?? [],
        dominantCategory: r.dominantCategory ?? r.dominant_category ?? '',
        confidenceScore: r.confidenceScore ?? r.confidence_score ?? 0,
        isAlertTriggered: r.isAlertTriggered ?? r.is_alert_triggered ?? false,
      })));
    } catch (err) {
      console.error('Failed to load clusters:', err);
    } finally { setAlertsLoading(false); }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadClusters();
    intervalRef.current = setInterval(loadClusters, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isOpen, loadClusters]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!category) errs.category = 'Please select a category.';
    if (!description.trim()) errs.description = 'Description is required.';
    else if (description.trim().split(/\s+/).filter(Boolean).length < 10) errs.description = 'Please provide at least 10 words.';
    if (!photoFile) errs.photo = 'Photo evidence is required.';
    if (lat === null || lng === null) errs.location = 'Location is required.';
    setFieldErrs(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('description', description);
      fd.append('category', category);
      fd.append('latitude', String(lat));
      fd.append('longitude', String(lng));
      fd.append('image', photoFile!);
      if (placeId) fd.append('placeId', placeId);

      await apiFetchForm('/reports/', fd);

      setSuccessMsg('Report submitted successfully. Thank you for helping keep travelers safe.');
      setDescription('');
      setCategory('OTHER');
      setPhotoFile(null);
      setPhotoPreview(null);
      setFieldErrs({});
      loadClusters();
    } catch (e: any) {
      setErrorMsg(parseErr(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const showGate = locState !== 'granted';

  return (
    <AnimatePresence>
      <motion.div key="report-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-slate-900">Incident Reporting</h1>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                <Radio className="w-3 h-3 animate-pulse" />
                Live System
              </span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Submit Incident Report</p>
                  <p className="text-xs text-slate-500">Help keep the community informed</p>
                </div>
              </div>

              <PipelineStrip />

              <div className="px-6 py-6 space-y-6">
                {/* Alerts */}
                {successMsg && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-800">{successMsg}</p>
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                    <AlertOctagon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{errorMsg}</p>
                  </div>
                )}

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Incident Category <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const active = category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => { setCategory(cat.value); setFieldErrs((p) => ({ ...p, category: '' })); }}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                          <Icon className="w-4 h-4" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrs.category && <p className="text-xs text-red-600">{fieldErrs.category}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setFieldErrs((p) => ({ ...p, description: '' })); }}
                    rows={4}
                    placeholder="Describe the incident in detail. Include what happened, when, and any potential risks to other travelers."
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm resize-none transition-all outline-none focus:ring-2 ${fieldErrs.description ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={fieldErrs.description ? 'text-red-600' : 'text-slate-500'}>{fieldErrs.description || 'Minimum 10 words required'}</span>
                    <span className={wordCount >= 10 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>{wordCount} words</span>
                  </div>
                </div>

                {/* Photo */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Photo Evidence <span className="text-red-500">*</span></label>
                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img src={photoPreview} alt="Evidence preview" className="max-h-48 rounded-xl border border-slate-200 object-cover" />
                      <button
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); setFieldErrs((p) => ({ ...p, photo: '' })); }}
                        className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-slate-900 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => photoRef.current?.click()}
                      className={`w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed transition-colors ${fieldErrs.photo ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <ImagePlus className={`w-6 h-6 ${fieldErrs.photo ? 'text-red-500' : 'text-slate-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${fieldErrs.photo ? 'text-red-600' : 'text-slate-600'}`}>{fieldErrs.photo ? 'Photo is required' : 'Click to upload photo'}</p>
                        <p className="text-xs text-slate-400 mt-1">JPG, PNG or WebP up to 5MB</p>
                      </div>
                    </button>
                  )}
                  <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); setFieldErrs((p) => ({ ...p, photo: '' })); }
                  }} />
                </div>

                {/* Location */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${locState === 'granted' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${locState === 'granted' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <MapPinned className={`w-5 h-5 ${locState === 'granted' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      {locState === 'granted' && lat !== null ? (
                        <>
                          <p className="text-sm font-semibold text-emerald-800">Location Acquired</p>
                          <p className="text-xs font-mono text-emerald-600">{lat.toFixed(6)}, {lng!.toFixed(6)}{accuracy && <span className="text-emerald-500 ml-2">±{accuracy}m</span>}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-700">Location Required</p>
                          <p className="text-xs text-slate-500">{locationError || 'Waiting for GPS...'}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {locState !== 'granted' && (
                    <button onClick={requestLocation} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors">
                      <Navigation className="w-4 h-4" />
                      Retry
                    </button>
                  )}
                </div>

                {/* Submit */}
                <button onClick={handleSubmit} disabled={submitting || locState !== 'granted'} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                  {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</> : <><Send className="w-5 h-5" />Submit Report</>}
                </button>
              </div>
            </div>

            {/* Right: Map & Alerts */}
            <div className="space-y-6">
              <div className="h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <MapEmbed lat={mapLat} lng={mapLng} clusters={clusters} />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">Nearby Safety Alerts</h3>
                    {clusters.length > 0 && <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">{clusters.length}</span>}
                  </div>
                  <button onClick={loadClusters} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Refresh alerts">
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${alertsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                  {alertsLoading && clusters.length === 0 ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                  ) : clusters.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                      <p className="text-sm text-slate-500">No active alerts in this area</p>
                    </div>
                  ) : (
                    clusters.map((c) => <ClusterCard key={c.id} cluster={c} />)
                  )}
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">Auto-refreshes every 10 seconds • DBSCAN + TF-IDF clustering</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Gate */}
        <AnimatePresence>
          {showGate && <LocationGate state={locState} onRetry={requestLocation} onClose={onClose} />}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

export default ReportPage;
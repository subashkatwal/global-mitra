/**
 * ReportPage — GlobalMitra Incident Reporting
 *
 * IncidentReport fields sent: description, category, image (REQUIRED), latitude, longitude
 * user_role is NOT sent — resolved from authenticated user on backend
 *
 * DBSCAN pipeline constants (from globalmitra_django.py):
 *   TIME_WINDOW_HOURS   = 6
 *   GEO_RADIUS_KM       = 3.0  (Haversine great-circle)
 *   MIN_CLUSTER_REPORTS = 3    → VERIFIED if count >= 3
 *   DBSCAN_EPS          = 0.62 (cosine distance, TF-IDF unigrams)
 *   DBSCAN_MIN_SAMPLES  = 2
 *
 * Rules:
 *   - Location is REQUIRED → show blocking gate screen if denied/not yet granted
 *   - Image is REQUIRED (IncidentReport.image = ImageField, not null)
 *   - No user role field
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, MapPin, Navigation, Send, RefreshCw,
  Shield, Loader2, X, Bell, Radio, Hash, CheckCircle,
  ImagePlus, Crosshair, Clock, BarChart2,
} from 'lucide-react';

// ─── Palette (project theme — no extra green) ─────────────────────────────────
const C = {
  bg:        '#F1F5F9',
  card:      '#FFFFFF',
  border:    '#CBD5E1',
  borderSm:  '#E2E8F0',
  primary:   '#3B82F6',
  primaryD:  '#1D4ED8',
  textMain:  '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  verified:  { bg: '#FFF5F5', border: '#FECACA', text: '#DC2626', iconBg: '#FEE2E2' },
  possible:  { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', iconBg: '#FEF3C7' },
};

// DBSCAN pipeline constants — mirror globalmitra_django.py
const PIPELINE = {
  TIME_WINDOW_HOURS:   3,
  GEO_RADIUS_KM:       3.0,
  MIN_CLUSTER_REPORTS: 3,
  DBSCAN_EPS:          0.62,
  DBSCAN_MIN_SAMPLES:  3,
};

// ─── API ──────────────────────────────────────────────────────────────────────
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
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw { status: res.status, data: e }; }
  return res.json();
}

async function apiFetchForm(path: string, body: FormData) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw { status: res.status, data: e }; }
  return res.json();
}

function parseErr(e: any): string {
  const d = e?.data || e;
  if (!d) return 'Something went wrong.';
  if (d.errors && typeof d.errors === 'object') {
    const msgs = Object.entries(d.errors).flatMap(([, v]) => Array.isArray(v) ? v as string[] : [String(v)]);
    if (msgs.length) return msgs.join(' • ');
  }
  return d.detail || d.error || d.message || e?.message || 'Something went wrong.';
}

// ─── CATEGORY_CHOICES from IncidentReport model ───────────────────────────────
const CATEGORIES = [
  { value: 'WEATHER',    label: 'Weather'           },
  { value: 'LANDSLIDE',  label: 'Landslide'         },
  { value: 'FLOOD',      label: 'Flood'             },
  { value: 'ROAD_BLOCK', label: 'Road Block'        },
  { value: 'MEDICAL',    label: 'Medical Emergency' },
  { value: 'WILDLIFE',   label: 'Wildlife'          },
  { value: 'OTHER',      label: 'Other'             },
];

// ─── IncidentCluster shape (Django model) ─────────────────────────────────────
interface Cluster {
  id:               string;
  reportCount:      number;       // reports M2M count — VERIFIED if >= MIN_CLUSTER_REPORTS (3)
  location:         string;       // place name or derived from centerLatitude/centerLongitude
  keywords:         string[];     // topKeywords JSONField — TF-IDF unigrams from pipeline
  dominantCategory: string;       // dominantCategory CharField
  confidenceScore:  number;       // confidenceScore FloatField
  isAlertTriggered: boolean;      // isAlertTriggered BooleanField
}

// ─── Location gate states ─────────────────────────────────────────────────────
type LocState = 'requesting' | 'denied' | 'granted' | 'unavailable';

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATION GATE — shown as full-page overlay until GPS is granted
// ═══════════════════════════════════════════════════════════════════════════════
function LocationGate({
  state, onRetry, onClose,
}: {
  state: LocState;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

        {/* top colour bar */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${C.primaryD}, ${C.primary})` }} />

        <div className="p-7">
          {/* icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: state === 'requesting' ? '#EFF6FF' : '#FFF7ED' }}>
            {state === 'requesting'
              ? <Loader2      className="w-8 h-8 animate-spin text-blue-500" />
              : <MapPin       className="w-8 h-8 text-orange-500" />}
          </div>

          {state === 'requesting' && (
            <>
              <h2 className="text-lg font-black text-center mb-2" style={{ color: C.textMain }}>
                Getting your location…
              </h2>
              <p className="text-sm text-center" style={{ color: C.textSub }}>
                Please allow location access when your browser asks. High-accuracy GPS is used to
                place your report on the DBSCAN clustering map.
              </p>
            </>
          )}

          {(state === 'denied' || state === 'unavailable') && (
            <>
              <h2 className="text-lg font-black text-center mb-2" style={{ color: C.textMain }}>
                Location access required
              </h2>
              <p className="text-sm text-center mb-5" style={{ color: C.textSub }}>
                You need to <strong>turn on your location</strong> to submit incident reports.
                GPS coordinates are required by the DBSCAN pipeline to cluster nearby reports
                within a <strong>{PIPELINE.GEO_RADIUS_KM} km radius</strong>.
              </p>

              {/* how-to steps */}
              <div className="rounded-2xl border p-4 mb-5 space-y-2 text-xs"
                style={{ borderColor: C.border, background: C.bg }}>
                <p className="font-bold text-xs mb-1" style={{ color: C.textMain }}>
                  How to enable location:
                </p>
                {[
                  'Click the lock 🔒 or ⓘ icon in your browser address bar',
                  'Find "Location" and set it to Allow',
                  'Refresh this page and try again',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ color: C.textSub }}>
                    <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: C.primary, color: '#fff' }}>
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={onRetry}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                    text-white text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${C.primaryD}, ${C.primary})` }}>
                  <Navigation className="w-4 h-4" /> Try Again
                </button>
                <button onClick={onClose}
                  className="px-4 py-3 rounded-xl border text-sm font-semibold hover:bg-slate-50 transition-colors"
                  style={{ borderColor: C.border, color: C.textSub }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}


function MapEmbed({ lat, lng, clusters }: { lat: number; lng: number; clusters: Cluster[] }) {
  const bbox = `${lng - 0.07},${lat - 0.05},${lng + 0.07},${lat + 0.05}`;
  const src  = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  // pick up to 3 cluster labels for the overlay
  const labels = clusters.slice(0, 3).map((c) => ({
    label: c.location,
    color: (c.isAlertTriggered || c.reportCount >= PIPELINE.MIN_CLUSTER_REPORTS) ? '#EF4444' : '#F59E0B',
  }));

  return (
    <div className="relative w-full h-full">
      <iframe title="incident-map" src={src}
        className="w-full h-full" style={{ border: 'none' }} loading="lazy" />

      {/* cluster zone labels */}
      {labels.length > 0 && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {labels.map(m => (
            <div key={m.label}
              className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1
                rounded-lg shadow text-xs font-semibold text-gray-800">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
              {m.label}
            </div>
          ))}
        </div>
      )}

      {/* bottom legend */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between
        px-3 py-2 bg-white/90 backdrop-blur-sm border-t border-gray-100 pointer-events-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Verified
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Possible
          </span>
        </div>
        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`}
          target="_blank" rel="noreferrer"
          className="text-[11px] text-blue-600 underline"
          style={{ pointerEvents: 'auto' }}>
          Open full map
        </a>
      </div>
    </div>
  );
}

// ─── Cluster alert card ───────────────────────────────────────────────────────
// VERIFIED = isAlertTriggered OR reportCount >= MIN_CLUSTER_REPORTS (3)
function ClusterCard({ c }: { c: Cluster }) {
  const verified = c.isAlertTriggered || c.reportCount >= PIPELINE.MIN_CLUSTER_REPORTS;
  const s = verified ? C.verified : C.possible;
  return (
    <div className="rounded-2xl border p-4" style={{ background: s.bg, borderColor: s.border }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: s.iconBg }}>
          {verified
            ? <Shield        className="w-4 h-4" style={{ color: s.text }} />
            : <AlertTriangle className="w-4 h-4" style={{ color: s.text }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: s.text }}>
            {verified ? 'Verified Incident' : 'Possible Incident'}
          </p>
          {!verified && (
            <p className="text-[11px] italic mb-1" style={{ color: C.textMuted }}>
              Waiting for additional reports
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs mt-1 mb-2" style={{ color: C.textMuted }}>
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" /> {c.reportCount} reports
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {c.location}
            </span>
            {c.confidenceScore > 0 && (
              <span className="flex items-center gap-1">
                <BarChart2 className="w-3 h-3" /> {Math.round(c.confidenceScore * 100)}% confidence
              </span>
            )}
          </div>
          {c.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {c.keywords.slice(0, 6).map(k => (
                <span key={k}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                  style={{ background: 'white', borderColor: s.border, color: C.textSub }}>
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

// ─── Pipeline info strip ──────────────────────────────────────────────────────
function PipelineStrip() {
  const items = [
    { icon: Clock,      label: `${PIPELINE.TIME_WINDOW_HOURS}h window`         },
    { icon: Crosshair,  label: `${PIPELINE.GEO_RADIUS_KM} km radius`           },
    { icon: Hash,       label: `≥${PIPELINE.MIN_CLUSTER_REPORTS} = verified`   },
    { icon: BarChart2,  label: `ε=${PIPELINE.DBSCAN_EPS} DBSCAN`               },
  ];
  return (
    <div className="flex flex-wrap gap-2 px-6 pb-4">
      {items.map(({ icon: Icon, label }) => (
        <div key={label}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium"
          style={{ borderColor: C.borderSm, background: C.bg, color: C.textMuted }}>
          <Icon className="w-3 h-3" /> {label}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
interface ReportPageProps {
  isOpen:   boolean;
  onClose:  () => void;
  placeId?: string | null;
}

export function ReportPage({ isOpen, onClose, placeId }: ReportPageProps) {

  // ── location state ────────────────────────────────────────────────────────
  const [locState,  setLocState]  = useState<LocState>('requesting');
  const [lat,       setLat]       = useState<number | null>(null);
  const [lng,       setLng]       = useState<number | null>(null);
  const [accuracy,  setAccuracy]  = useState<number | null>(null);

  // ── form state ────────────────────────────────────────────────────────────
  const [category,     setCategory]    = useState('OTHER');
  const [description,  setDescription] = useState('');
  const [photoFile,    setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview]= useState<string | null>(null);

  // ── submission state ──────────────────────────────────────────────────────
  const [submitting,  setSubmitting]  = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [fieldErrs,   setFieldErrs]   = useState<Record<string, string>>({});

  // ── clusters (IncidentCluster) ────────────────────────────────────────────
  const [clusters,      setClusters]      = useState<Cluster[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const photoRef    = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mapLat = lat ?? 27.7172;
  const mapLng = lng ?? 85.3240;

  // ── GPS request (high accuracy, maximumAge:0 = fresh fix) ─────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocState('unavailable'); return; }
    setLocState('requesting');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));
        setLocState('granted');
      },
      err => {
        // code 1 = PERMISSION_DENIED, code 2 = POSITION_UNAVAILABLE
        setLocState(err.code === 1 ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, []);

  // ask immediately when page opens
  useEffect(() => {
    if (isOpen) requestLocation();
  }, [isOpen, requestLocation]);

  // close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // ── load IncidentClusters ─────────────────────────────────────────────────
  const loadClusters = useCallback(async () => {
    setAlertsLoading(true);
    try {
      let data: any;
      try       { data = await apiFetch('/clusters'); }
      catch (_) { data = await apiFetch('/reports/alerts'); }
      const items: any[] = data.results ?? data.clusters ?? data.data ?? (Array.isArray(data) ? data : []);
      setClusters(items.map((r: any): Cluster => ({
        id:               r.id,
        reportCount:      r.reportCount        ?? r.report_count        ?? r.reports_count ?? r.reports?.length ?? 1,
        location:
          r.place ?? r.location ?? r.area ??
          (r.centerLatitude != null
            ? `${Number(r.centerLatitude).toFixed(4)}, ${Number(r.centerLongitude).toFixed(4)}`
            : 'Unknown'),
        keywords:         r.topKeywords        ?? r.top_keywords        ?? r.keywords ?? [],
        dominantCategory: r.dominantCategory   ?? r.dominant_category   ?? '',
        confidenceScore:  r.confidenceScore    ?? r.confidence_score    ?? 0,
        isAlertTriggered: r.isAlertTriggered   ?? r.is_alert_triggered  ?? false,
      })));
    } catch { /* silent */ }
    finally { setAlertsLoading(false); }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadClusters();
    intervalRef.current = setInterval(loadClusters, 10_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isOpen, loadClusters]);

  // ── validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!category)                                                      errs.category    = 'Select a category.';
    if (!description.trim())                                            errs.description = 'Description is required.';
    else if (description.trim().split(/\s+/).filter(Boolean).length < 10) errs.description = 'Please use at least 10 words.';
    if (!photoFile)                                                     errs.photo       = 'Photo evidence is required.';
    // location is gated before form renders — if somehow null, block
    if (lat === null || lng === null)                                   errs.location    = 'Location unavailable.';
    setFieldErrs(errs);
    return Object.keys(errs).length === 0;
  };

  // ── submit → POST /incidents/reports (multipart — image always required) ──
  const handleSubmit = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('description', description);
      fd.append('category',    category);
      fd.append('latitude',    String(lat));
      fd.append('longitude',   String(lng));
      fd.append('image',       photoFile!);
      if (placeId) fd.append('placeId', placeId);

      await apiFetchForm('/reports', fd);

      setSuccessMsg('Report submitted! Thank you for keeping travellers safe.');
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

  const wordCount   = description.trim().split(/\s+/).filter(Boolean).length;
  const showGate    = locState === 'requesting' || locState === 'denied' || locState === 'unavailable';

  return (
    <AnimatePresence>
      <motion.div key="report-page"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{ background: C.bg, fontFamily: "'Inter','DM Sans',system-ui,sans-serif" }}>

        {/* ── sticky top bar ── */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm" style={{ borderColor: C.border }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black" style={{ color: C.textMain }}>
                  Incident Reporting
                </h1>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]
                  font-bold bg-red-50 text-red-600 border border-red-200">
                  <Radio className="w-3 h-3 animate-pulse" /> Live
                </span>
              </div>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: C.textSub }}>
                Reports are analyzed with DBSCAN (TF-IDF + Haversine, {PIPELINE.TIME_WINDOW_HOURS}h window)
                to identify and verify emerging threats.
              </p>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── body ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* ══ LEFT: form card ══ */}
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden"
              style={{ borderColor: C.border }}>

              {/* card header */}
              <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: C.textMain }}>Report an Incident</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>Help keep travelers safe with real-time reports</p>
                </div>
              </div>

              {/* pipeline param chips */}
              <PipelineStrip />

              <div className="border-t px-6 py-6 space-y-5" style={{ borderColor: C.borderSm }}>

                {/* success / error banners */}
                {successMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {errorMsg}
                  </div>
                )}

                {/* ── Incident Category ── */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: C.textMain }}>
                    Incident Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => {
                      const active = category === cat.value;
                      return (
                        <button key={cat.value}
                          onClick={() => { setCategory(cat.value); setFieldErrs(p => ({ ...p, category: '' })); }}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-semibold
                            text-center transition-all ${active ? 'text-white' : 'bg-white hover:bg-slate-50'}`}
                          style={active
                            ? { background: C.primary, borderColor: C.primary }
                            : { borderColor: C.border, color: C.textSub }}>
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrs.category && <p className="text-xs text-red-600">{fieldErrs.category}</p>}
                </div>

                {/* ── Description ── */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold" style={{ color: C.textMain }}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => { setDescription(e.target.value); setFieldErrs(p => ({ ...p, description: '' })); }}
                    rows={4}
                    placeholder="Describe what you are seeing so others can stay safe"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-slate-50 outline-none
                      focus:ring-2 resize-none transition-all
                      ${fieldErrs.description ? 'border-red-400 focus:ring-red-100' : 'focus:ring-blue-100'}`}
                    style={fieldErrs.description ? {} : { borderColor: C.border }}
                  />
                  <div className="flex justify-between text-xs">
                    <span style={{ color: fieldErrs.description ? '#DC2626' : C.textMuted }}>
                      {fieldErrs.description ?? 'Natural language — TF-IDF unigrams used for clustering'}
                    </span>
                    <span className={wordCount >= 10 ? 'text-emerald-600 font-semibold' : ''}
                      style={{ color: wordCount >= 10 ? undefined : C.textMuted }}>
                      {wordCount}/10 min
                    </span>
                  </div>
                </div>

                {/* ── Photo Evidence — REQUIRED ── */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: C.textMain }}>
                    Photo Evidence <span className="text-red-500">*</span>
                  </label>

                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img src={photoPreview} alt="evidence"
                        className="max-h-44 rounded-2xl object-cover border"
                        style={{ borderColor: C.border }} />
                      <button
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); setFieldErrs(p => ({ ...p, photo: '' })); }}
                        className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 hover:bg-black/70 transition-colors">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => photoRef.current?.click()}
                      className={`w-full flex flex-col items-center justify-center gap-2.5 py-8 rounded-2xl
                        border-2 border-dashed transition-colors hover:bg-slate-50
                        ${fieldErrs.photo ? 'border-red-400 bg-red-50' : ''}`}
                      style={fieldErrs.photo ? {} : { borderColor: C.border }}>
                      <ImagePlus className="w-8 h-8"
                        style={{ color: fieldErrs.photo ? '#DC2626' : C.textMuted }} />
                      <div className="text-center">
                        <p className="text-sm font-semibold"
                          style={{ color: fieldErrs.photo ? '#DC2626' : C.textSub }}>
                          {fieldErrs.photo ? 'Photo is required' : 'Click to upload photo evidence'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                          JPG, PNG or WebP · max 5 MB
                        </p>
                      </div>
                    </button>
                  )}

                  <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setPhotoFile(f);
                        setPhotoPreview(URL.createObjectURL(f));
                        setFieldErrs(p => ({ ...p, photo: '' }));
                      }
                    }} />
                </div>

                {/* ── Location info (read-only — acquired via GPS gate) ── */}
                <div className="flex items-center justify-between p-3 rounded-xl border"
                  style={{ background: locState === 'granted' ? '#F0FDF4' : C.bg,
                           borderColor: locState === 'granted' ? '#BBF7D0' : C.border }}>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 flex-shrink-0"
                      style={{ color: locState === 'granted' ? '#16A34A' : C.textMuted }} />
                    <div>
                      {locState === 'granted' && lat !== null ? (
                        <>
                          <p className="text-xs font-semibold text-emerald-700">Location acquired</p>
                          <p className="text-[11px] font-mono text-emerald-600">
                            {lat.toFixed(6)}, {lng!.toFixed(6)}
                          </p>
                          {accuracy !== null && (
                            <p className="text-[11px] text-emerald-500">±{accuracy} m accuracy</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs font-semibold" style={{ color: C.textMuted }}>
                          Waiting for GPS…
                        </p>
                      )}
                    </div>
                  </div>
                  {locState !== 'granted' && (
                    <button onClick={requestLocation}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg
                        border transition-colors hover:bg-blue-50"
                      style={{ borderColor: C.primary, color: C.primary }}>
                      <Navigation className="w-3.5 h-3.5" /> Retry
                    </button>
                  )}
                </div>

                {/* ── Submit ── */}
                <button onClick={handleSubmit}
                  disabled={submitting || locState !== 'granted'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                    text-white font-bold text-sm shadow-sm transition-all
                    disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${C.primaryD}, ${C.primary})` }}>
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send    className="w-4 h-4" />}
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>

              </div>
            </div>

            {/* ══ RIGHT: map + cluster alerts ══ */}
            <div className="space-y-4">

              {/* map */}
              <div className="relative rounded-3xl overflow-hidden border shadow-sm"
                style={{ height: 380, borderColor: C.border }}>
                <MapEmbed lat={mapLat} lng={mapLng} clusters={clusters} />
              </div>

              {/* IncidentCluster feed */}
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden"
                style={{ borderColor: C.border }}>
                <div className="flex items-center justify-between px-5 py-4 border-b"
                  style={{ borderColor: C.borderSm }}>
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-sm" style={{ color: C.textMain }}>
                      Nearby Safety Alerts
                    </h3>
                    {clusters.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100"
                        style={{ color: C.textMuted }}>
                        {clusters.length}
                      </span>
                    )}
                  </div>
                  <button onClick={loadClusters}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${alertsLoading ? 'animate-spin' : ''}`}
                      style={{ color: C.textMuted }} />
                  </button>
                </div>

                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {alertsLoading && clusters.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    </div>
                  ) : clusters.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      <p className="text-sm" style={{ color: C.textMuted }}>No alerts in this area</p>
                    </div>
                  ) : (
                    clusters.map(c => <ClusterCard key={c.id} c={c} />)
                  )}
                </div>

                <div className="px-5 py-3 border-t text-center text-[11px]"
                  style={{ borderColor: C.borderSm, color: C.textMuted }}>
                  Auto-refreshes every 10 s · Powered by DBSCAN + TF-IDF clustering
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Location gate — blocks entire page until GPS granted ── */}
        <AnimatePresence>
          {showGate && (
            <LocationGate
              state={locState}
              onRetry={requestLocation}
              onClose={onClose}
            />
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
}

export default ReportPage;
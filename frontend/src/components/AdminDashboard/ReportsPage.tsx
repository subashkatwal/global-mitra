/**
 * ReportsPage — Admin Dashboard
 *
 * Django API endpoints (matching reports/urls.py conventions):
 *   GET    /reports/                           → paginated IncidentReport list
 *   GET    /reports/?status=PENDING&page=1     → filtered list
 *   POST   /reports/{id}/verify/               → set status=VERIFIED
 *   POST   /reports/{id}/reject/               → set status=REJECTED
 *   DELETE /reports/{id}/                      → hard delete
 *   GET    /reports/overview/                  → stats + weekly + by-category
 *
 *   GET    /reports/clusters/                  → IncidentCluster list
 *   POST   /reports/clusters/{id}/broadcast/   → create AlertBroadcast (manual)
 *
 *   GET    /reports/alerts/                    → AlertBroadcast list
 *
 * Django model field names (DRF default = snake_case):
 *   IncidentReport  → id, description, category, latitude, longitude,
 *                     status, confidence_score, image, created_at,
 *                     user { full_name, email }
 *
 *   IncidentCluster → id, center_latitude, center_longitude,
 *                     top_keywords, confidence_score, dominant_category,
 *                     is_alert_triggered, created_at, report_count
 *
 *   AlertBroadcast  → id, message, severity, trigger_type,
 *                     cluster { dominant_category,
 *                               center_latitude, center_longitude },
 *                     created_at, sent_by (email string)
 *
 * Clustering (reports/clustering.py constants):
 *   TIME_WINDOW_HOURS   = 3
 *   GEO_RADIUS_KM       = 3.0
 *   MIN_CLUSTER_REPORTS = 3
 *   DBSCAN_EPS          = 0.62
 *   confidence_score stored as 0.0–1.0  → ×100 for display
 *
 * Signal: post_save on IncidentReport → run_clustering() synchronously
 * Status flow: PENDING → VERIFIED | REJECTED | AUTO_VERIFIED (via clustering)
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  RefreshCw, Search, Eye, Trash2, Check, X, MapPin, Clock,
  AlertTriangle, Radio, Bell, BarChart2, FileText, ChevronDown,
  Loader2, Shield, User, Activity, Filter,
} from 'lucide-react';
import { T, apiFetch, parseErr } from './utils';
import { Spinner, ErrMsg, Empty, Confirm, Pagination } from './ui';
import type { ToastFn } from './types';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  text:      T.textMain,
  textSub:   T.textSub,
  textMuted: T.textMuted,
  border:    T.border,
  borderSm:  T.borderSm,
  bg:        '#F7F9FC',
  cardBg:    '#FFFFFF',
  pill:      '#F1F5F9',
};

// ─── Category config (matches IncidentReport.CATEGORY_CHOICES) ────────────────
const CATEGORIES: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  ROAD_BLOCK: { label: 'Road Block', color: '#B45309', bg: '#FEF3C7', emoji: '🚧' },
  WEATHER:    { label: 'Weather',    color: '#0369A1', bg: '#E0F2FE', emoji: '🌦️' },
  MEDICAL:    { label: 'Medical',    color: '#BE185D', bg: '#FCE7F3', emoji: '🏥' },
  FLOOD:      { label: 'Flood',      color: '#0E7490', bg: '#CFFAFE', emoji: '🌊' },
  LANDSLIDE:  { label: 'Landslide',  color: '#7C3AED', bg: '#EDE9FE', emoji: '⛰️' },
  WILDLIFE:   { label: 'Wildlife',   color: '#166534', bg: '#DCFCE7', emoji: '🐾' },
  OTHER:      { label: 'Other',      color: '#475569', bg: '#F1F5F9', emoji: '📋' },
};
function catCfg(cat?: string) {
  const k = (cat ?? '').toUpperCase().replace(/\s+/g, '_');
  return CATEGORIES[k] ?? CATEGORIES.OTHER;
}

// ─── Status config (IncidentReport.STATUS_CHOICES) ────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:       { label: 'Pending',       color: '#D97706', bg: '#FEF3C7' },
  verified:      { label: 'Verified',      color: '#059669', bg: '#D1FAE5' },
  rejected:      { label: 'Rejected',      color: '#DC2626', bg: '#FEE2E2' },
  auto_verified: { label: 'Auto Verified', color: '#7C3AED', bg: '#EDE9FE' },
  auto_alerted:  { label: 'Auto Alerted',  color: '#7C3AED', bg: '#EDE9FE' },
};
function stCfg(s?: string) {
  return STATUS_CFG[(s ?? '').toLowerCase()] ?? STATUS_CFG.pending;
}

// ─── Severity config (AlertBroadcast.SEVERITY_CHOICES) ───────────────────────
const SEV_CFG: Record<string, { color: string; bg: string }> = {
  LOW:      { color: '#0369A1', bg: '#E0F2FE' },
  MEDIUM:   { color: '#D97706', bg: '#FEF3C7' },
  HIGH:     { color: '#EA580C', bg: '#FFF7ED' },
  CRITICAL: { color: '#DC2626', bg: '#FEE2E2' },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Report {
  id:             string;
  category?:      string;
  description?:   string;
  location?:      string | { name?: string; lat?: number; lng?: number };
  latitude?:      number;
  longitude?:     number;
  reporter?:      { fullName?: string; full_name?: string; name?: string; email?: string };
  reporterName?:  string;
  status?:        string;
  confidenceScore?: number;
  image?:         string | null;
  verifiedBy?:    string;
  createdAt?:     string;
}

interface Cluster {
  id:               string;
  dominantCategory?: string;
  centerLatitude?:   number;
  centerLongitude?:  number;
  topKeywords?:      string[];
  confidenceScore?:  number;
  isAlertTriggered?: boolean;
  reportCount?:      number;
  detectedAt?:       string;
  createdAt?:        string;
}

interface AlertItem {
  id:          string;
  severity?:   string;
  triggerType?: string;
  message?:    string;
  cluster?:    { dominantCategory?: string; centerLatitude?: number; centerLongitude?: number };
  sentBy?:     string;
  createdAt?:  string;
}

interface Overview {
  totalReports?:    number;
  pendingCount?:    number;
  verifiedCount?:   number;
  rejectedCount?:   number;
  autoAlertedCount?: number;
  activeClusters?:  number;
  alertsSent?:      number;
  weeklyData?:      { day: string; count: number }[];
  byCategory?:      { category: string; count: number }[];
  weeklyChange?:    number;
}

// ─── Normalise snake_case → camelCase from DRF ───────────────────────────────
function normReport(r: any): Report {
  return {
    id:             r.id,
    category:       r.category,
    description:    r.description,
    location:       r.location,
    latitude:       r.latitude,
    longitude:      r.longitude,
    reporter:       r.user ?? r.reporter,
    reporterName:   r.reporter_name ?? r.reporterName,
    status:         r.status,
    confidenceScore: parseFloat(r.confidence_score ?? r.confidenceScore ?? '0'),
    image:          r.image ?? r.evidence ?? null,
    verifiedBy:     r.verified_by ?? r.verifiedBy,
    createdAt:      r.created_at ?? r.createdAt,
  };
}

function normCluster(c: any): Cluster {
  return {
    id:               c.id,
    dominantCategory: c.dominant_category  ?? c.dominantCategory,
    centerLatitude:   parseFloat(c.center_latitude  ?? c.centerLatitude  ?? 0),
    centerLongitude:  parseFloat(c.center_longitude ?? c.centerLongitude ?? 0),
    topKeywords:      c.top_keywords        ?? c.topKeywords        ?? [],
    confidenceScore:  parseFloat(c.confidence_score ?? c.confidenceScore ?? '0'),
    isAlertTriggered: c.is_alert_triggered  ?? c.isAlertTriggered   ?? false,
    reportCount:      c.report_count        ?? c.reportCount        ?? c.reports_count ?? 0,
    detectedAt:       c.detected_at         ?? c.detectedAt,
    createdAt:        c.created_at          ?? c.createdAt,
  };
}

function normAlert(a: any): AlertItem {
  const cl = a.cluster;
  return {
    id:          a.id,
    severity:    a.severity,
    triggerType: a.trigger_type  ?? a.triggerType,
    message:     a.message,
    cluster: cl ? {
      dominantCategory: cl.dominant_category ?? cl.dominantCategory,
      centerLatitude:   parseFloat(cl.center_latitude  ?? cl.centerLatitude  ?? 0),
      centerLongitude:  parseFloat(cl.center_longitude ?? cl.centerLongitude ?? 0),
    } : undefined,
    sentBy:      a.sent_by   ?? a.sentBy,
    createdAt:   a.created_at ?? a.createdAt,
  };
}

function normOverview(raw: any): Overview {
  const o = raw.data ?? raw;
  return {
    totalReports:     o.total_reports      ?? o.totalReports      ?? 0,
    pendingCount:     o.pending_count      ?? o.pendingCount      ?? 0,
    verifiedCount:    o.verified_count     ?? o.verifiedCount     ?? 0,
    rejectedCount:    o.rejected_count     ?? o.rejectedCount     ?? 0,
    autoAlertedCount: o.auto_alerted_count ?? o.autoAlertedCount  ?? 0,
    activeClusters:   o.active_clusters    ?? o.activeClusters    ?? 0,
    alertsSent:       o.alerts_sent        ?? o.alertsSent        ?? 0,
    weeklyData:       o.weekly_data        ?? o.weeklyData        ?? [],
    byCategory:       o.by_category        ?? o.byCategory        ?? [],
    weeklyChange:     o.weekly_change      ?? o.weeklyChange      ?? 0,
  };
}

// ─── Display helpers ──────────────────────────────────────────────────────────
function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 30)    return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function locName(r: Report): string {
  if (!r.location) {
    return r.latitude ? `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}` : '—';
  }
  if (typeof r.location === 'string') return r.location;
  return r.location.name ?? `${r.location.lat ?? 0}, ${r.location.lng ?? 0}`;
}

function rName(r: Report): string {
  const p = r.reporter as any;
  return p?.fullName ?? p?.full_name ?? p?.name ?? r.reporterName ?? '—';
}

function rEmail(r: Report): string {
  return (r.reporter as any)?.email ?? '';
}

// confidence_score is 0.0–1.0 from Python — multiply × 100 for %
function confPct(score?: number): number {
  if (!score) return 0;
  return score <= 1 ? Math.round(score * 100) : Math.round(score);
}

function shortId(id: string): string {
  return `rpt-${id.replace(/-/g, '').slice(-4).toUpperCase()}`;
}

// ─── Shared components ────────────────────────────────────────────────────────

function CatPill({ cat }: { cat?: string }) {
  const c = catCfg(cat);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap"
      style={{ color: c.color, background: c.bg }}>
      <span>{c.emoji}</span>
      {c.label.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const s = stCfg(status);
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ color: s.color, background: s.bg }}>
      {s.label.toUpperCase()}
    </span>
  );
}

function ConfBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon: Icon }:
  { label: string; value: number | string; sub?: string; accent?: string; icon: any }) {
  return (
    <div className="bg-white rounded-2xl border p-5 flex flex-col gap-2"
      style={{ borderColor: C.border }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: C.textMuted }}>{label}</span>
        <div className="p-2 rounded-xl" style={{ background: (accent ?? T.primary) + '18' }}>
          <Icon className="w-4 h-4" style={{ color: accent ?? T.primary }} />
        </div>
      </div>
      <p className="text-3xl font-bold" style={{ color: accent ?? C.text }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: C.textMuted }}>{sub}</p>}
    </div>
  );
}

// ─── Report Detail Modal ──────────────────────────────────────────────────────
function ReportDetailModal({ report, onClose, onVerify, onReject }:
  { report: Report; onClose: () => void; onVerify: () => void; onReject: () => void }) {

  const cat       = catCfg(report.category);
  const pct       = confPct(report.confidenceScore);
  const confColor = pct >= 75 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';
  const img       = report.image ?? null;
  const date      = report.createdAt ? new Date(report.createdAt) : null;
  const isPending = (report.status ?? '').toLowerCase() === 'pending';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: C.borderSm }}>
          <span className="text-xl">{cat.emoji}</span>
          <h2 className="font-bold text-base flex-1" style={{ color: C.text }}>Report Detail</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" style={{ color: C.textMuted }} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4"
          style={{ maxHeight: 'calc(90vh - 130px)' }}>

          {/* Status + ID row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={report.status} />
              <CatPill cat={report.category} />
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded-lg"
              style={{ background: C.pill, color: C.textMuted }}>
              {shortId(report.id)}
            </span>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl" style={{ background: C.bg }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: C.textMuted }}>
              Description
            </p>
            <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>
              {report.description ?? '—'}
            </p>
          </div>

          {/* Location + Confidence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: C.bg }}>
              <p className="text-xs font-semibold mb-2" style={{ color: C.textMuted }}>Location</p>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                  style={{ color: T.primary }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>
                    {locName(report)}
                  </p>
                  {report.latitude && (
                    <p className="text-[11px] mt-0.5 font-mono" style={{ color: C.textMuted }}>
                      {Number(report.latitude).toFixed(5)},&nbsp;
                      {Number(report.longitude).toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: C.bg }}>
              <p className="text-xs font-semibold mb-2" style={{ color: C.textMuted }}>
                Confidence Score
              </p>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: confColor }} />
                </div>
                <span className="text-sm font-bold" style={{ color: confColor }}>{pct}%</span>
              </div>
              <p className="text-[10px]" style={{ color: C.textMuted }}>
                DBSCAN geo + TF-IDF score
              </p>
            </div>
          </div>

          {/* Reporter + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: C.bg }}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: C.textMuted }}>
                Reporter
              </p>
              <p className="text-sm font-bold" style={{ color: C.text }}>{rName(report)}</p>
              {rEmail(report) && (
                <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                  {rEmail(report)}
                </p>
              )}
            </div>
            <div className="p-4 rounded-xl" style={{ background: C.bg }}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: C.textMuted }}>
                Reported On
              </p>
              {date ? (
                <>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>
                    {date.toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                    {date.toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </>
              ) : (
                <p className="text-sm" style={{ color: C.textMuted }}>—</p>
              )}
            </div>
          </div>

          {/* Evidence image */}
          {img && (
            <div>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: C.textMuted }}>
                <FileText className="w-3.5 h-3.5" /> Evidence
              </p>
              <img src={img} alt="evidence"
                className="w-full rounded-xl object-cover max-h-56" />
            </div>
          )}

          {/* Verified by */}
          {report.verifiedBy && (
            <div className="p-3 rounded-xl border flex items-center gap-2"
              style={{ borderColor: T.primary + '40', background: T.primary + '0C' }}>
              <Shield className="w-4 h-4 flex-shrink-0" style={{ color: T.primary }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: T.primary }}>
                  Verified By
                </p>
                <p className="text-xs" style={{ color: C.textSub }}>{report.verifiedBy}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pending actions */}
        {isPending && (
          <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: C.borderSm }}>
            <button onClick={onVerify}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                text-white text-sm font-semibold"
              style={{ background: '#059669' }}>
              <Check className="w-4 h-4" /> Verify
            </button>
            <button onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                text-sm font-semibold border"
              style={{ borderColor: '#DC2626', color: '#DC2626' }}>
              <X className="w-4 h-4" /> Reject
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Broadcast Modal ──────────────────────────────────────────────────────────
function BroadcastModal({ cluster, onClose, onBroadcast }:
  { cluster: Cluster; onClose: () => void; onBroadcast: (sev: string, msg: string) => Promise<void> }) {

  const [severity, setSeverity] = useState('MEDIUM');
  const [message,  setMessage]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    await onBroadcast(severity, message);
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: '#FEE2E2' }}>
          <Shield className="w-6 h-6" style={{ color: '#DC2626' }} />
        </div>

        <h2 className="text-lg font-bold mb-1" style={{ color: C.text }}>
          Broadcast Alert
        </h2>
        <p className="text-sm mb-5" style={{ color: C.textMuted }}>
          This will notify all users in the affected area.
        </p>

        {/* Severity */}
        <label className="block text-xs font-semibold mb-2" style={{ color: C.textSub }}>
          Severity Level
        </label>
        <div className="flex gap-2 mb-5">
          {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(s => (
            <button key={s} onClick={() => setSeverity(s)}
              className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
              style={severity === s
                ? { borderColor: SEV_CFG[s].color, color: SEV_CFG[s].color, background: SEV_CFG[s].bg }
                : { borderColor: C.border, color: C.textMuted, background: '#fff' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Message */}
        <label className="block text-xs font-semibold mb-2" style={{ color: C.textSub }}>
          Alert Message
        </label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
          placeholder="Describe the danger and recommended actions…"
          className="w-full resize-none text-sm outline-none rounded-xl px-3 py-2.5
            border focus:ring-2 mb-5"
          style={{ borderColor: C.border, background: C.bg }} />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-gray-50"
            style={{ borderColor: C.border, color: C.textSub }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: '#DC2626' }}>
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Radio   className="w-4 h-4" />}
            Broadcast
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

type TabKey = 'overview' | 'reports' | 'clusters' | 'alerts';

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ data, onTabSwitch }:
  { data: Overview | null; onTabSwitch: (t: TabKey) => void }) {

  if (!data) return <Spinner />;

  const weekly = data.weeklyData  ?? [];
  const bycat  = data.byCategory  ?? [];
  const maxW   = Math.max(...weekly.map(d => d.count), 1);
  const maxC   = Math.max(...bycat.map(d => d.count),  1);
  const total  = data.totalReports ?? 1;
  const pct    = (n: number) => Math.round(((n ?? 0) / total) * 100);

  return (
    <div className="space-y-5">

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports"   value={data.totalReports ?? 0}
          sub={data.weeklyChange ? `+${data.weeklyChange}% vs last week` : 'All time'}
          icon={FileText} accent={T.primary} />
        <StatCard label="Pending Review"  value={data.pendingCount ?? 0}
          sub="Requires admin action" icon={Clock} accent="#D97706" />
        <StatCard label="Active Clusters" value={data.activeClusters ?? 0}
          sub="DBSCAN detected" icon={Radio} accent="#0E7490" />
        <StatCard label="Alerts Sent"     value={data.alertsSent ?? 0}
          sub="AlertBroadcast total" icon={Bell} accent="#DC2626" />
      </div>

      {/* Weekly chart + by-category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 bg-white rounded-2xl border p-5"
          style={{ borderColor: C.border }}>
          <p className="font-semibold text-sm mb-4" style={{ color: C.text }}>
            Reports This Week
          </p>
          {weekly.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: C.textMuted }}>
              No data available
            </p>
          ) : (
            <div className="flex items-end gap-3 h-36">
              {weekly.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold" style={{ color: C.textSub }}>
                    {d.count}
                  </span>
                  <div className="w-full rounded-t-lg"
                    style={{
                      height: `${Math.max((d.count / maxW) * 100, 6)}%`,
                      background: T.primary,
                      opacity: 0.85,
                    }} />
                  <span className="text-[11px]" style={{ color: C.textMuted }}>{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: C.border }}>
          <p className="font-semibold text-sm mb-4" style={{ color: C.text }}>By Category</p>
          <div className="space-y-3">
            {bycat.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: C.textMuted }}>
                No data
              </p>
            ) : bycat.map((d, i) => {
              const cfg = catCfg(d.category);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold flex items-center gap-1"
                      style={{ color: C.textSub }}>
                      <span>{cfg.emoji}</span>
                      {d.category.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: C.text }}>
                      {d.count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${(d.count / maxC) * 100}%`, background: cfg.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status distribution */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: C.border }}>
        <p className="font-semibold text-sm mb-4" style={{ color: C.text }}>
          Status Distribution
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'pending',       label: 'Pending',      n: data.pendingCount      ?? 0 },
            { key: 'verified',      label: 'Verified',     n: data.verifiedCount     ?? 0 },
            { key: 'rejected',      label: 'Rejected',     n: data.rejectedCount     ?? 0 },
            { key: 'auto_verified', label: 'Auto Alerted', n: data.autoAlertedCount  ?? 0 },
          ].map(({ key, label, n }) => {
            const s = stCfg(key);
            return (
              <div key={key}
                className="rounded-2xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: s.bg + '80' }}
                onClick={() => onTabSwitch('reports')}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{n}</p>
                <p className="text-xs font-bold mt-1" style={{ color: s.color }}>
                  {label.toUpperCase()}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: s.color + 'CC' }}>
                  {pct(n)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent pending */}
      <RecentPendingCard onViewAll={() => onTabSwitch('reports')} />
    </div>
  );
}

// ─── Recent Pending Card ──────────────────────────────────────────────────────
function RecentPendingCard({ onViewAll }: { onViewAll: () => void }) {
  const [items,   setItems]   = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiFetch('/reports/?status=PENDING&page_size=5')
      .then(d => setItems((d.results ?? d.data ?? []).map(normReport)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'verify' | 'reject') => {
    try {
      await apiFetch(`/reports/${id}/${action}/`, { method: 'POST' });
      setItems(p => p.filter(r => r.id !== id));
    } catch { /* silent */ }
  };

  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: C.border }}>
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-sm" style={{ color: C.text }}>
          Recent Pending Reports
        </p>
        <button onClick={onViewAll}
          className="text-xs font-semibold" style={{ color: T.primary }}>
          View all
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: T.primary }} />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm py-4" style={{ color: C.textMuted }}>
          No pending reports
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: C.borderSm }}>
          {items.map(r => (
            <div key={r.id}
              className="flex items-start gap-3 py-3 hover:bg-gray-50 rounded-xl px-2 -mx-2 transition-colors">
              <span className="text-xl mt-0.5">{catCfg(r.category).emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-1" style={{ color: C.textSub }}>
                  {r.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: C.textMuted }} />
                  <span className="text-[11px]" style={{ color: C.textMuted }}>
                    {locName(r)}
                  </span>
                  <span className="text-[11px]" style={{ color: C.textMuted }}>
                    {timeAgo(r.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => act(r.id, 'verify')}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center
                    hover:bg-green-50 transition-colors"
                  style={{ borderColor: '#059669' }} title="Verify">
                  <Check className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                </button>
                <button onClick={() => act(r.id, 'reject')}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center
                    hover:bg-red-50 transition-colors"
                  style={{ borderColor: '#DC2626' }} title="Reject">
                  <X className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ toast }: { toast: ToastFn }) {
  const [reports,      setReports]      = useState<Report[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [err,          setErr]          = useState('');
  const [search,       setSearch]       = useState('');
  const [status,       setStatus]       = useState('all');
  const [category,     setCategory]     = useState('all');
  const [page,         setPage]         = useState(1);
  const [viewing,      setViewing]      = useState<Report | null>(null);
  const [confirmId,    setConfirmId]    = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (search.trim())    qs.set('search',   search.trim());
      if (status !== 'all') qs.set('status',   status.toUpperCase());
      if (category !== 'all') qs.set('category', category);

      const data = await apiFetch(`/reports/?${qs}`);
      const raw  = data.results ?? data.data ?? [];
      setReports(raw.map(normReport));
      setTotal(data.count ?? data.total ?? raw.length);

      // status counts may come in the envelope
      const sc = data.status_counts ?? data.statusCounts;
      if (sc) {
        setStatusCounts({
          pending:       sc.PENDING       ?? sc.pending       ?? 0,
          verified:      sc.VERIFIED      ?? sc.verified      ?? 0,
          rejected:      sc.REJECTED      ?? sc.rejected      ?? 0,
          auto_verified: sc.AUTO_VERIFIED ?? sc.auto_verified ?? 0,
        });
      }
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, [page, search, status, category]);

  useEffect(() => { load(); }, [load]);

  // POST /reports/{id}/verify/   or   /reports/{id}/reject/
  const act = async (id: string, action: 'verify' | 'reject') => {
    try {
      await apiFetch(`/reports/${id}/${action}/`, { method: 'POST' });
      toast(action === 'verify' ? 'Report verified.' : 'Report rejected.', 'success');
      load();
      if (viewing?.id === id) setViewing(null);
    } catch (e: any) { toast(parseErr(e), 'error'); }
  };

  // DELETE /reports/{id}/
  const del = async (id: string) => {
    try {
      await apiFetch(`/reports/${id}/`, { method: 'DELETE' });
      toast('Report deleted.', 'success');
      load();
    } catch (e: any) { toast(parseErr(e), 'error'); }
    setConfirmId(null);
  };

  const statusTabs = [
    { key: 'all',          label: `All (${total})` },
    { key: 'pending',      label: `Pending (${statusCounts.pending      ?? 0})` },
    { key: 'verified',     label: `Verified (${statusCounts.verified     ?? 0})` },
    { key: 'rejected',     label: `Rejected (${statusCounts.rejected     ?? 0})` },
    { key: 'auto_verified',label: `Auto Alerted (${statusCounts.auto_verified ?? 0})` },
  ];

  return (
    <>
      {/* Search + category */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: C.textMuted }} />
          <input value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reports by description, category, reporter, location…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm outline-none"
            style={{ borderColor: C.border }} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: C.textMuted }} />
          <select value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="pl-8 pr-8 py-2.5 rounded-xl border bg-white text-sm
              outline-none appearance-none cursor-pointer"
            style={{ borderColor: C.border, color: C.textSub }}>
            <option value="all">All Categories</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5
            pointer-events-none" style={{ color: C.textMuted }} />
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusTabs.map(t => (
          <button key={t.key} onClick={() => { setStatus(t.key); setPage(1); }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
            style={status === t.key
              ? { background: T.primary, borderColor: T.primary, color: '#fff' }
              : { background: '#fff', borderColor: C.border, color: C.textSub }}>
            {t.label}
          </button>
        ))}
      </div>

      {!loading && total > 0 && (
        <p className="text-xs mb-3" style={{ color: C.textMuted }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–
          {Math.min(page * PAGE_SIZE, total)} of {total} reports
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm"
        style={{ borderColor: C.border }}>
        {loading ? <Spinner /> : err ? <ErrMsg msg={err} onRetry={load} /> :
         reports.length === 0 ? <Empty msg="No reports found." /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: C.bg }}>
                    {['#', 'Category', 'Description', 'Location', 'Reporter',
                      'Status', 'Confidence', 'Date', 'Actions'].map(h => (
                      <th key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold
                          uppercase tracking-wide"
                        style={{ color: C.textMuted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr key={r.id}
                      className="border-t hover:bg-gray-50 transition-colors"
                      style={{ borderColor: C.borderSm }}>
                      <td className="px-4 py-3 text-sm" style={{ color: C.textMuted }}>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="px-4 py-3"><CatPill cat={r.category} /></td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="text-sm line-clamp-2 block" style={{ color: C.textSub }}>
                          {r.description ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: T.primary }} />
                          <span className="text-sm" style={{ color: C.textSub }}>{locName(r)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm whitespace-nowrap" style={{ color: C.textSub }}>
                          {rName(r)}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        <ConfBar pct={confPct(r.confidenceScore)} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium whitespace-nowrap"
                          style={{ color: C.textSub }}>
                          {timeAgo(r.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setViewing(r)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="View">
                            <Eye className="w-4 h-4" style={{ color: '#6366F1' }} />
                          </button>
                          {(r.status ?? '').toLowerCase() === 'pending' && (
                            <>
                              <button onClick={() => act(r.id, 'verify')}
                                className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                                title="Verify">
                                <Check className="w-4 h-4" style={{ color: '#059669' }} />
                              </button>
                              <button onClick={() => act(r.id, 'reject')}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Reject">
                                <X className="w-4 h-4" style={{ color: '#DC2626' }} />
                              </button>
                            </>
                          )}
                          <button onClick={() => setConfirmId(r.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete">
                            <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>

      <AnimatePresence>
        {viewing && (
          <ReportDetailModal
            report={viewing}
            onClose={() => setViewing(null)}
            onVerify={() => act(viewing.id, 'verify')}
            onReject={() => act(viewing.id, 'reject')}
          />
        )}
        {confirmId && (
          <Confirm
            msg="Delete this report? This cannot be undone."
            onConfirm={() => del(confirmId)}
            onCancel={() => setConfirmId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Clusters Tab ─────────────────────────────────────────────────────────────
function ClustersTab({ toast }: { toast: ToastFn }) {
  const [clusters,  setClusters]  = useState<Cluster[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState('');
  const [broadcast, setBroadcast] = useState<Cluster | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      // GET /reports/clusters/
      const d = await apiFetch('/reports/clusters/');
      setClusters((d.results ?? d.data ?? d ?? []).map(normCluster));
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // POST /reports/clusters/{id}/broadcast/
  // Django creates AlertBroadcast(cluster=cluster_obj, trigger_type='MANUAL', severity, message)
  // Django creates AlertBroadcast(cluster=cluster_obj, trigger_type='MANUAL', severity, message)
  const doBroadcast = async (cluster: Cluster, severity: string, msg: string) => {
    try {
      await apiFetch(`/reports/clusters/${cluster.id}/broadcast/`, {
        method: 'POST',
        body: JSON.stringify({ severity, message: msg }),
      });
      setClusters(p => p.map(c =>
        c.id === cluster.id ? { ...c, isAlertTriggered: true } : c
      ));
      toast('Alert broadcasted to all nearby users', 'success');
      setBroadcast(null);
    } catch (e: any) { toast(parseErr(e), 'error'); }
  };

  if (loading) return <Spinner />;
  if (err)     return <ErrMsg msg={err} onRetry={load} />;
  if (clusters.length === 0) return <Empty msg="No active clusters detected." />;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: C.textMuted }}>
          {clusters.length} cluster{clusters.length !== 1 ? 's' : ''} detected by DBSCAN pipeline
        </p>
        <button onClick={load}
          className="p-2 rounded-xl border hover:bg-gray-50 transition-colors"
          style={{ borderColor: C.border }}>
          <RefreshCw className="w-4 h-4" style={{ color: C.textMuted }} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clusters.map((cl, i) => {
          const alerted = cl.isAlertTriggered;
          const pct     = confPct(cl.confidenceScore);
          const confCol = pct >= 75 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';
          const keys    = cl.topKeywords ?? [];
          const count   = cl.reportCount ?? 0;

          return (
            <div key={cl.id}
              className="bg-white rounded-2xl border p-5 flex flex-col gap-3"
              style={{ borderColor: C.border }}>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4" style={{ color: T.primary }} />
                  <span className="font-bold text-sm" style={{ color: C.text }}>
                    Cluster #{String(i + 1).padStart(3, '0')}
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={alerted
                    ? { background: '#FEE2E2', color: '#DC2626' }
                    : { background: '#FEF3C7', color: '#D97706' }}>
                  {alerted ? 'ALERTED' : 'REVIEW'}
                </span>
              </div>

              {cl.centerLatitude != null && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: C.textMuted }} />
                  <span className="text-xs font-mono" style={{ color: C.textMuted }}>
                    {Number(cl.centerLatitude).toFixed(4)},&nbsp;
                    {Number(cl.centerLongitude).toFixed(4)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <CatPill cat={cl.dominantCategory} />
                <span className="text-xs" style={{ color: C.textMuted }}>
                  {count} report{count !== 1 ? 's' : ''}
                </span>
              </div>

              {/* top_keywords from TF-IDF */}
              {keys.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {keys.map(k => (
                    <span key={k}
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: C.pill, color: C.textSub }}>
                      {k}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: C.textMuted }}>
                      Confidence:
                    </span>
                    <span className="text-xs font-bold" style={{ color: confCol }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: confCol }} />
                  </div>
                </div>
                {/* Only show broadcast if not yet alerted */}
                {!alerted && (
                  <button onClick={() => setBroadcast(cl)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white
                      text-xs font-bold flex-shrink-0"
                    style={{ background: '#DC2626' }}>
                    <Radio className="w-3.5 h-3.5" /> Broadcast
                  </button>
                )}
              </div>

              <p className="text-[11px]" style={{ color: C.textMuted }}>
                Detected {timeAgo(cl.detectedAt ?? cl.createdAt)}
              </p>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {broadcast && (
          <BroadcastModal
            cluster={broadcast}
            onClose={() => setBroadcast(null)}
            onBroadcast={(sev, msg) => doBroadcast(broadcast, sev, msg)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────
function AlertsTab() {
  const [alerts,  setAlerts]  = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    // GET /reports/alerts/  →  AlertBroadcast list
    apiFetch('/reports/alerts/')
      .then(d => setAlerts((d.results ?? d.data ?? []).map(normAlert)))
      .catch(e => setErr(parseErr(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (err) return <ErrMsg msg={err} onRetry={() => window.location.reload()} />;
  if (alerts.length === 0) return <Empty msg="No alerts have been sent yet." />;

  return (
    <div className="space-y-3">
      {alerts.map(a => {
        const sev     = (a.severity ?? 'MEDIUM').toUpperCase();
        const sevCfg  = SEV_CFG[sev] ?? SEV_CFG.MEDIUM;
        const cat     = a.cluster?.dominantCategory;
        const isAuto  = (a.triggerType ?? '').toUpperCase() === 'AUTO';
        const date    = a.createdAt;
        const lat     = a.cluster?.centerLatitude;
        const lng     = a.cluster?.centerLongitude;

        return (
          <div key={a.id}
            className="bg-white rounded-2xl border p-4 flex items-start gap-4"
            style={{ borderColor: C.border }}>

            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: sevCfg.bg }}>
              <AlertTriangle className="w-5 h-5" style={{ color: sevCfg.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: sevCfg.color, background: sevCfg.bg }}>
                  {sev}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full
                  flex items-center gap-1"
                  style={{ background: C.pill, color: C.textSub }}>
                  {isAuto
                    ? <><Activity className="w-3 h-3" /> Auto</>
                    : <><User    className="w-3 h-3" /> Manual</>}
                </span>
                {cat && <CatPill cat={cat} />}
              </div>

              <p className="text-sm leading-relaxed mb-2" style={{ color: C.textSub }}>
                {a.message ?? '—'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px]"
                style={{ color: C.textMuted }}>
                {lat != null && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                  </span>
                )}
                {date && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {' at '}
                    {new Date(date).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
                {a.sentBy && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {a.sentBy}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function ReportsPage({ toast }: { toast: ToastFn }) {
  const [tab,      setTab]      = useState<'overview' | 'reports' | 'clusters' | 'alerts'>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [counts,   setCounts]   = useState({ reports: 0, clusters: 0, alerts: 0 });
  const [live,     setLive]     = useState(true);

  // GET /reports/overview/
  const loadMeta = useCallback(async () => {
    try {
      const d  = await apiFetch('/reports/overview/');
      const ov = normOverview(d);
      setOverview(ov);
      setCounts({
        reports:  ov.totalReports   ?? 0,
        clusters: ov.activeClusters ?? 0,
        alerts:   ov.alertsSent     ?? 0,
      });
    } catch { /* overview failing should not break the page */ }
  }, []);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  // Live polling every 30 s
  useEffect(() => {
    if (!live) return;
    const iv = setInterval(loadMeta, 30_000);
    return () => clearInterval(iv);
  }, [live, loadMeta]);

  const tabs = [
    { key: 'overview', label: 'Overview',                      icon: BarChart2 },
    { key: 'reports',  label: `Reports (${counts.reports})`,   icon: FileText  },
    { key: 'clusters', label: `Clusters (${counts.clusters})`, icon: Radio     },
    { key: 'alerts',   label: `Alerts (${counts.alerts})`,     icon: Bell      },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>
              Report Management
            </h1>
            <p className="text-sm mt-1" style={{ color: C.textMuted }}>
              Monitor, verify, and manage incident reports across all regions
            </p>
          </div>
          <button onClick={() => setLive(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border
              text-xs font-semibold transition-colors"
            style={live
              ? { borderColor: T.primary + '60', background: T.primary + '0F', color: T.primary }
              : { borderColor: C.border, color: C.textMuted, background: '#fff' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'animate-pulse' : ''}`}
              style={{ background: live ? T.primary : C.textMuted }} />
            Live
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-2xl border mb-6 bg-white w-fit"
          style={{ borderColor: C.border }}>
          {tabs.map(t => {
            const Icon   = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                  font-semibold transition-all"
                style={active
                  ? { background: T.primary, color: '#fff' }
                  : { color: C.textSub }}>
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === 'overview'  && <OverviewTab data={overview} onTabSwitch={setTab} />}
        {tab === 'reports'   && <ReportsTab  toast={toast} />}
        {tab === 'clusters'  && <ClustersTab toast={toast} />}
        {tab === 'alerts'    && <AlertsTab />}
      </div>
    </div>
  );
}
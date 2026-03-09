import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Star, BarChart3,
  Mountain, Clock, Calendar, DollarSign,
  Wifi, FileText, Activity, ShoppingBag, Globe,
  Loader2, AlertCircle, Heart, Share2
} from 'lucide-react';
import { usePlaceStore } from '@/store/placeStore';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';
function publicFetch(path: string) {
  return fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' } });
}

interface PlaceDetailsProps {
  placeId: string;
  onBack: () => void;
  onReportClick: () => void;
}

interface FullDestination {
  id: string;
  name: string;
  slug: string;
  description: string;
  latitude: number;
  longitude: number;
  averageCost: number;
  difficulty: string;
  bestSeason: string;
  duration: string;
  famousLocalItems: string[];
  activities: string[];
  altitude?: number;
  climate?: string;
  safetyLevel?: string;
  permitsRequired: boolean;
  image?: string;
  crowdLevel: string;
  internetAvailability: string;
  district: string;
  country: string;
  createdAt: string;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:     'bg-emerald-100 text-emerald-700',
  Moderate: 'bg-yellow-100  text-yellow-700',
  Hard:     'bg-orange-100  text-orange-700',
  Extreme:  'bg-red-100     text-red-700',
};
const CROWD_COLOR: Record<string, string> = {
  Low:    'bg-blue-100   text-blue-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High:   'bg-red-100    text-red-700',
};
const SAFETY_COLOR: Record<string, string> = {
  Safe:      'bg-emerald-100 text-emerald-700',
  Moderate:  'bg-amber-100   text-amber-700',
  Dangerous: 'bg-red-100     text-red-700',
  Low:       'bg-red-100     text-red-700',
  Medium:    'bg-amber-100   text-amber-700',
  High:      'bg-emerald-100 text-emerald-700',
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

function InfoRow({ label, value, badge }: { label: string; value?: string | null; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      {badge ?? <span className="text-sm font-bold text-gray-800">{value ?? '—'}</span>}
    </div>
  );
}


export function PlaceDetails({ placeId, onBack, onReportClick }: PlaceDetailsProps) {
  const [destination, setDestination] = useState<FullDestination | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [imgError,    setImgError]    = useState(false);

  const { savedPlaces, toggleSavePlace, addToComparison, comparisonList } = usePlaceStore();
  const isSaved        = savedPlaces.includes(placeId);
  const isInComparison = comparisonList.some(p => p.id === placeId);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setImgError(false);
    publicFetch(`/destinations/${placeId}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: FullDestination) => setDestination(data))
      .catch(() => setError('Could not load destination details.'))
      .finally(() => setIsLoading(false));
  }, [placeId]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Loading destination…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !destination) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-base font-semibold text-gray-700">{error ?? 'Destination not found'}</p>
          <button onClick={onBack} className="px-5 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const d = destination;
  const location = [d.district, d.country].filter(Boolean).join(', ');
  const safetyLabel =
    d.safetyLevel === 'Low'  ? '🔵 Low Risk'  :
    d.safetyLevel === 'Safe' ? '🟢 Safe'      :
    d.safetyLevel === 'Dangerous' ? '🔴 High Risk' :
    d.safetyLevel ?? null;

  return (
    <div className="min-h-screen bg-[#F3F6FA]">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSavePlace(d.id)}
            className={`p-2 rounded-lg border transition-colors ${
              isSaved ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { if (!isInComparison && comparisonList.length < 4) addToComparison(d as any); }}
            disabled={isInComparison || comparisonList.length >= 4}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
              isInComparison
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : comparisonList.length >= 4
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-700 hover:border-[#1B4332] hover:text-[#1B4332]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {isInComparison ? 'Added' : '+ Add to Compare'}
          </button>
        </div>
      </div>

      {/* ── Hero image ── */}
      <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[480px] bg-gray-200 overflow-hidden">
        {d.image && !imgError ? (
          <img
            src={d.image}
            alt={d.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <Mountain className="w-20 h-20 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* Overlaid title */}
        <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-10 pb-7">
          <div className="flex items-center gap-2 mb-2.5">
            {safetyLabel && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                {safetyLabel}
              </span>
            )}
            
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow">{d.name}</h1>
          {location && (
            <p className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
              <MapPin className="w-4 h-4" />
              {location}
            </p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row gap-7">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* 4 stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { icon: Mountain,   label: 'Altitude',    value: d.altitude != null ? `${d.altitude}m` : '—' },
                { icon: Clock,      label: 'Duration',    value: d.duration || '—' },
                { icon: Calendar,   label: 'Best Season', value: d.bestSeason || '—' },
                { icon: DollarSign, label: 'Avg. Cost',   value: `NPR ${Math.round(d.averageCost)}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-[#EBF5FB] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#1B9AD2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h2 className="text-base font-bold text-gray-800 mb-3">About</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{d.description}</p>
            </motion.div>

            {/* Activities */}
            {d.activities?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1B9AD2]" />
                  Activities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {d.activities.map(act => (
                    <div key={act} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3">
                      <span className="w-2 h-2 rounded-full bg-[#1B9AD2] flex-shrink-0" />
                      <span className="text-sm text-gray-600">{act}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Famous local items */}
            {d.famousLocalItems?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#1B9AD2]" />
                  Famous Local Items
                </h2>
                <div className="flex flex-wrap gap-2">
                  {d.famousLocalItems.map(item => (
                    <span key={item} className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 bg-white hover:border-gray-300 transition-colors">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1B9AD2]" />
                Location
              </h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="relative w-full h-44 bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer group">
                  <MapPin className="w-8 h-8 text-[#1B9AD2]" />
                  <p className="text-sm font-semibold text-gray-600">
                    {d.latitude.toFixed(4)}°N, {d.longitude.toFixed(4)}°E
                  </p>
                  <p className="text-xs text-gray-400">{location}</p>
                  <span className="absolute bottom-3 right-4 text-xs text-[#1B9AD2] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Open in Maps →
                  </span>
                </div>
              </a>
            </motion.div>

          </div>

          {/* ── Right sidebar ── */}
          <div className="w-full lg:w-[290px] xl:w-[310px] flex-shrink-0 space-y-4">

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h3 className="text-base font-bold text-gray-800 mb-0.5">Quick Info</h3>
              <InfoRow
                label="Difficulty"
                badge={<Badge label={d.difficulty} colorClass={DIFFICULTY_COLOR[d.difficulty] ?? 'bg-gray-100 text-gray-600'} />}
              />
              <InfoRow label="Climate" value={d.climate} />
              <InfoRow
                label="Crowd Level"
                badge={<Badge label={d.crowdLevel} colorClass={CROWD_COLOR[d.crowdLevel] ?? 'bg-gray-100 text-gray-600'} />}
              />
              {d.safetyLevel && (
                <InfoRow
                  label="Safety Level"
                  badge={<Badge label={d.safetyLevel} colorClass={SAFETY_COLOR[d.safetyLevel] ?? 'bg-gray-100 text-gray-600'} />}
                />
              )}
            </motion.div>

            {/* Essentials */}
            <motion.div
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h3 className="text-base font-bold text-gray-800 mb-0.5">Essentials</h3>
              <InfoRow
                label="Permits Required"
                badge={
                  <Badge
                    label={d.permitsRequired ? 'Yes' : 'No'}
                    colorClass={d.permitsRequired ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}
                  />
                }
              />
              <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <Wifi className="w-3.5 h-3.5 text-gray-400" />
                  Internet
                </span>
                <span className="text-sm font-bold text-gray-800">{d.internetAvailability}</span>
              </div>
              <InfoRow label="Climate" value={d.climate} />
            </motion.div>

            {/* Add to Compare */}
            <motion.button
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.2 }}
              onClick={() => { if (!isInComparison && comparisonList.length < 4) addToComparison(d as any); }}
              disabled={isInComparison || comparisonList.length >= 4}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                isInComparison
                  ? 'bg-emerald-500 text-white cursor-default'
                  : comparisonList.length >= 4
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#1B9AD2] hover:bg-[#1585BA] text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              {isInComparison ? '✓ Added to Compare' : '+ Add to Compare'}
            </motion.button>

            {/* Report */}
            <motion.button
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.25 }}
              onClick={onReportClick}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-white transition-all"
            >
              <FileText className="w-4 h-4" />
              Submit a Report
            </motion.button>

          </div>
        </div>
      </div>
    </div>
  );
}
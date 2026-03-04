import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,  Search, TrendingUp, Mountain,
  Heart, Clock, Wifi, WifiOff, AlertCircle, X,
  SlidersHorizontal, ChevronDown, TreePine, ChevronLeft, ChevronRight,
  Key
} from 'lucide-react';
// import { apiFetch } from '@/services/api';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

function publicFetch(path: string) {
  return fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
}
import { usePlaceStore } from '@/store/placeStore';
import type { PaginatedResponse } from '@/types';

// ── Backend Destination shape (matches your Django model exactly) ─────────────

export interface BackendDestination {
  id: string;
  name: string;
  slug: string;
  description: string;
  latitude: number;
  longitude: number;
  district: string;
  country: string;
  averageCost: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  bestSeason: string;
  duration: string;
  famousLocalItems: string[];
  activities: string[];
  altitude?: number;
  climate?: string;
  safetyLevel?: string;       // 'Safe' | 'Moderate' | 'Dangerous'
  permitsRequired: boolean;
  image?: string;             // single URL field (not images[])
  crowdLevel: string;         // 'Low' | 'Medium' | 'High'
  internetAvailability: string; // 'None' | 'Limited' | 'Moderate' | 'Good' | 'Excellent'
  createdAt: string;
}

// ── Filter params (mirror backend query params exactly) ───────────────────────

interface FilterParams {
  search: string;
  difficulty: string;
  safetyLevel: string;
  crowdLevel: string;
  internetAvailability: string;
  permitsRequired: string;
  averageCost_min: string;
  averageCost_max: string;
  altitude_min: string;
  altitude_max: string;
  ordering: string;
  page: number;
}

const DEFAULT_FILTERS: FilterParams = {
  search: '',
  difficulty: '',
  safetyLevel: '',
  crowdLevel: '',
  internetAvailability: '',
  permitsRequired: '',
  averageCost_min: '',
  averageCost_max: '',
  altitude_min: '',
  altitude_max: '',
  ordering: '-createdAt',
  page: 1,
};

// ── Style maps ────────────────────────────────────────────────────────────────

const SAFETY_COLORS: Record<string, string> = {
  Safe:      'bg-emerald-100 text-emerald-700',
  Moderate:  'bg-amber-100   text-amber-700',
  Dangerous: 'bg-red-100     text-red-700',
};

const CROWD_COLORS: Record<string, string> = {
  Low:    'bg-blue-100   text-blue-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High:   'bg-red-100    text-red-700',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:     'bg-emerald-500',
  Moderate: 'bg-yellow-500',
  Hard:     'bg-orange-500',
  Extreme:  'bg-red-600',
};

const DIFFICULTY_OPTIONS = ['Easy', 'Moderate', 'Hard', 'Extreme'];
const SAFETY_OPTIONS     = ['Safe', 'Moderate', 'Dangerous'];
const CROWD_OPTIONS      = ['Low', 'Medium', 'High'];
const INTERNET_OPTIONS   = ['None', 'Limited', 'Moderate', 'Good', 'Excellent'];
const ORDERING_OPTIONS   = [
  { value: '-createdAt',   label: 'Newest'   },
  { value:  'createdAt',   label: 'Oldest'   },
  { value:  'name',        label: 'Name A–Z' },
  { value: '-name',        label: 'Name Z–A' },
  { value:  'averageCost', label: 'Cost ↑'   },
  { value: '-averageCost', label: 'Cost ↓'   },
  { value:  'altitude',    label: 'Altitude ↑'},
  { value: '-altitude',    label: 'Altitude ↓'},
];

// ── Build query string ────────────────────────────────────────────────────────

function buildQuery(f: FilterParams): string {
  const p = new URLSearchParams();
  if (f.search)               p.set('search',               f.search);
  if (f.difficulty)           p.set('difficulty',           f.difficulty);
  if (f.safetyLevel)          p.set('safetyLevel',          f.safetyLevel);
  if (f.crowdLevel)           p.set('crowdLevel',           f.crowdLevel);
  if (f.internetAvailability) p.set('internetAvailability', f.internetAvailability);
  if (f.permitsRequired)      p.set('permitsRequired',      f.permitsRequired);
  if (f.averageCost_min)      p.set('averageCost_min',      f.averageCost_min);
  if (f.averageCost_max)      p.set('averageCost_max',      f.averageCost_max);
  if (f.altitude_min)         p.set('altitude_min',         f.altitude_min);
  if (f.altitude_max)         p.set('altitude_max',         f.altitude_max);
  if (f.ordering)             p.set('ordering',             f.ordering);
  p.set('page', String(f.page));
  return p.toString();
}


export function ExplorePage({ onDestinationClick }: { onDestinationClick: (id: string) => void }) {
  const [destinations, setDestinations] = useState<BackendDestination[]>([]);
  const [totalCount,   setTotalCount]   = useState(0);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [filters,      setFilters]      = useState<FilterParams>(DEFAULT_FILTERS);
  const [showFilters,  setShowFilters]  = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { savedPlaces, toggleSavePlace, addToComparison, comparisonList } = usePlaceStore();

  const PAGE_SIZE  = 12;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ── Fetch from backend ────────────────────────────────────────────────────

  const fetchDestinations = useCallback(async (params: FilterParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const qs  = buildQuery(params);
      const res = await publicFetch(`/destinations?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PaginatedResponse<BackendDestination> = await res.json();
      setDestinations(data.results);
      setTotalCount(data.count);
    } catch {
      setError('Failed to load destinations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDestinations(filters); }, [filters, fetchDestinations]);

  // ── Filter helpers ────────────────────────────────────────────────────────

  const updateFilter = (key: keyof FilterParams, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  const toggleFilter = (key: keyof FilterParams, value: string) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 400);
  };

  const clearAllFilters = () => setFilters(DEFAULT_FILTERS);

  const activeFilterCount = [
    filters.difficulty, filters.safetyLevel, filters.crowdLevel,
    filters.internetAvailability, filters.permitsRequired,
    filters.averageCost_min, filters.averageCost_max,
    filters.altitude_min, filters.altitude_max,
  ].filter(Boolean).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F0FBF5]">

      {/* Header — Blue/Navy theme */}
      <div className="bg-gradient-to-br from-[#1A3D2B] via-[#2D8F6A] to-[#3CA37A] text-white px-4 sm:px-8 lg:px-16 pt-10 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
          <p className="text-[#6FCFA8] text-sm font-semibold tracking-widest uppercase mb-2">Discover Nepal</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight text-white">
            Explore <span className="text-[#F59E0B]">Destinations</span>
          </h1>
          <p className="text-white/80 text-lg">
            {isLoading ? 'Loading...' : `${totalCount} destination${totalCount !== 1 ? 's' : ''} found`}
          </p>
          {/* Search bar — no icon */}
          <div className="relative mt-8 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6FCFA8]" />
            <input
              type="text"
              defaultValue={filters.search}
              placeholder="Search by name, difficulty, season, climate..."
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#F59E0B] transition-all text-base"
            />
          </div>
        </motion.div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[60px] sm:top-[68px] z-30 bg-white border-b border-[#A8DFC8]/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">

          {/* All pill — no Compass icon */}
          <button onClick={() => updateFilter('difficulty', '')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              !filters.difficulty ? 'bg-[#3CA37A] text-white shadow-md' : 'bg-[#F0FBF5] text-[#3CA37A] border border-[#A8DFC8] hover:bg-[#D0F0E4]'
            }`}>
            All
          </button>

          {/* Difficulty pills — no icons */}
          {DIFFICULTY_OPTIONS.map(d => (
            <button key={d} onClick={() => toggleFilter('difficulty', d)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                filters.difficulty === d ? 'bg-[#3CA37A] text-white shadow-md' : 'bg-[#F0FBF5] text-[#3CA37A] border border-[#A8DFC8] hover:bg-[#D0F0E4]'
              }`}>
              {d}
            </button>
          ))}

          <div className="h-6 w-px bg-[#A8DFC8] flex-shrink-0 mx-1" />

          {/* Sort */}
          <select value={filters.ordering} onChange={e => updateFilter('ordering', e.target.value)}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-[#1A3D2B] bg-[#F0FBF5] border border-[#A8DFC8] focus:outline-none focus:border-[#3CA37A] flex-shrink-0 cursor-pointer">
            {ORDERING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* More filters toggle */}
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 border transition-all ml-auto ${
              showFilters || activeFilterCount > 0 ? 'bg-[#1A3D2B] text-white border-[#1A3D2B]' : 'bg-white text-[#1A3D2B] border-[#A8DFC8] hover:bg-[#F0FBF5]'
            }`}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[#1A3D2B] text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#A8DFC8]/60 bg-[#F0FBF5]">
              <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <FilterGroup label="Safety Level">
                  {SAFETY_OPTIONS.map(s => (
                    <FilterPill key={s} label={s} active={filters.safetyLevel === s}
                      onClick={() => toggleFilter('safetyLevel', s)} />
                  ))}
                </FilterGroup>

                <FilterGroup label="Crowd Level">
                  {CROWD_OPTIONS.map(c => (
                    <FilterPill key={c} label={c} active={filters.crowdLevel === c}
                      onClick={() => toggleFilter('crowdLevel', c)} />
                  ))}
                </FilterGroup>

                <FilterGroup label="Internet">
                  {INTERNET_OPTIONS.map(i => (
                    <FilterPill key={i} label={i} active={filters.internetAvailability === i}
                      onClick={() => toggleFilter('internetAvailability', i)} />
                  ))}
                </FilterGroup>

                <div className="space-y-4">
                  <FilterGroup label="Permits Required">
                    <FilterPill label="Required"     active={filters.permitsRequired === 'true'}
                      onClick={() => toggleFilter('permitsRequired', 'true')} />
                    <FilterPill label="Not Required"  active={filters.permitsRequired === 'false'}
                      onClick={() => toggleFilter('permitsRequired', 'false')} />
                  </FilterGroup>

                  <div>
                    <p className="text-xs font-bold text-[#1A3D2B] uppercase tracking-wider mb-2">Cost/day (Rs)</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filters.averageCost_min}
                        onChange={e => updateFilter('averageCost_min', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg text-sm border border-[#A8DFC8] focus:outline-none focus:border-[#3CA37A] bg-white" />
                      <input type="number" placeholder="Max" value={filters.averageCost_max}
                        onChange={e => updateFilter('averageCost_max', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg text-sm border border-[#A8DFC8] focus:outline-none focus:border-[#3CA37A] bg-white" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#1A3D2B] uppercase tracking-wider mb-2">Altitude (m)</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filters.altitude_min}
                        onChange={e => updateFilter('altitude_min', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg text-sm border border-[#A8DFC8] focus:outline-none focus:border-[#3CA37A] bg-white" />
                      <input type="number" placeholder="Max" value={filters.altitude_max}
                        onChange={e => updateFilter('altitude_max', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg text-sm border border-[#A8DFC8] focus:outline-none focus:border-[#3CA37A] bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 pb-4">
                  <button onClick={clearAllFilters}
                    className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors">
                    <X className="w-3.5 h-3.5" /> Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-10">

        {/* Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="flex gap-2"><div className="h-5 bg-gray-100 rounded-full w-16" /><div className="h-5 bg-gray-100 rounded-full w-16" /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[#1A3D2B] mb-2">Something went wrong</h3>
            <p className="text-[#4A7A62] mb-6">{error}</p>
            <button onClick={() => fetchDestinations(filters)}
              className="px-6 py-3 rounded-xl bg-[#3CA37A] text-white font-semibold hover:bg-[#2D8F6A] transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && destinations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#D0F0E4] flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-[#3CA37A]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A3D2B] mb-2">No destinations found</h3>
            <p className="text-[#4A7A62] mb-6">Try adjusting your search or filters</p>
            <button onClick={clearAllFilters}
              className="px-6 py-3 rounded-xl bg-[#D0F0E4] text-[#1A3D2B] font-semibold hover:bg-[#A8DFC8] transition-colors">
              Clear Filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && destinations.length > 0 && (
          <>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial="hidden" animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
              {destinations.map(dest => (
                <motion.div key={dest.id}
                  variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.35 }}>
                  <DestinationCard
                    destination={dest}
                    onClick={() => onDestinationClick(dest.id)}
                    isSaved={savedPlaces.includes(dest.id)}
                    isInComparison={comparisonList.some(p => p.id === dest.id)}
                    canCompare={comparisonList.length < 4}
                    onSave={() => toggleSavePlace(dest.id)}
                    onCompare={() => {
                      if (!comparisonList.some(p => p.id === dest.id) && comparisonList.length < 4) {
                        addToComparison(dest as any);
                      }
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
                <button onClick={() => updateFilter('page', filters.page - 1)} disabled={filters.page <= 1}
                  className="p-2 rounded-lg border border-[#A8DFC8] text-[#3CA37A] hover:bg-[#D0F0E4] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (i === 0) {
                    page = 1;
                  } else if (i === 6) {
                    page = totalPages;
                  } else {
                    page = Math.max(2, Math.min(filters.page - 2 + i, totalPages - 1));
                  }
                  return (
                    <button key={`pg-${page}`} onClick={() => updateFilter('page', page)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                        filters.page === page ? 'bg-[#3CA37A] text-white shadow-md' : 'border border-[#A8DFC8] text-[#3CA37A] hover:bg-[#D0F0E4]'
                      }`}>
                      {page}
                    </button>
                  );
                })}

                <button onClick={() => updateFilter('page', filters.page + 1)} disabled={filters.page >= totalPages}
                  className="p-2 rounded-lg border border-[#A8DFC8] text-[#3CA37A] hover:bg-[#D0F0E4] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="text-sm text-[#4A7A62] ml-2">
                  Page {filters.page} of {totalPages} · {totalCount} total
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#1A3D2B] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active ? 'bg-[#3CA37A] text-white' : 'bg-white border border-[#A8DFC8] text-[#3CA37A] hover:bg-[#D0F0E4]'
      }`}>
      {label}
    </button>
  );
}

// ── DestinationCard ───────────────────────────────────────────────────────────

interface CardProps {
  destination: BackendDestination;
  onClick: () => void;
  isSaved: boolean;
  isInComparison: boolean;
  canCompare: boolean;
  onSave: () => void;
  onCompare: () => void;
}

function DestinationCard({ destination, onClick, isSaved, isInComparison, canCompare, onSave, onCompare }: CardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-[#A8DFC8]/30 hover:border-[#3CA37A]/20 hover:-translate-y-1">

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#D0F0E4]">
        {destination.image && !imgError ? (
          <img src={destination.image} alt={destination.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-[#3CA37A]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {destination.difficulty && (
          <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-wide ${DIFFICULTY_COLORS[destination.difficulty] ?? 'bg-gray-500'}`}>
            {destination.difficulty}
          </div>
        )}

        {/* <button onClick={e => { e.stopPropagation(); onSave(); }}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-all ${
            isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500 hover:bg-white hover:text-red-500'
          }`}>
          { <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />}
        </button> */}

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-[12px] font-semibold backdrop-blur-sm">
            {destination.averageCost ? `Rs ${Math.round(destination.averageCost)}/day` : 'Free'}
          </span>
          {destination.permitsRequired && (
            <span className="px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold flex items-center gap-1">
              <Key className="w-2.5 h-2.5" /> Permit
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-[#1A3D2B] text-base mb-1 group-hover:text-[#3CA37A] transition-colors line-clamp-1">
          {destination.name}
        </h3>

        <p className="text-[#4A7A62] text-xs mb-2.5 flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {[destination.district, destination.country].filter(Boolean).join(', ')}
          {destination.altitude != null && <span className="ml-1">· {destination.altitude}m</span>}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {destination.safetyLevel && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SAFETY_COLORS[destination.safetyLevel] ?? 'bg-gray-100 text-gray-600'}`}>
              {destination.safetyLevel}
            </span>
          )}
          {destination.crowdLevel && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CROWD_COLORS[destination.crowdLevel] ?? 'bg-gray-100 text-gray-600'}`}>
              {destination.crowdLevel} Crowd
            </span>
          )}
          {destination.internetAvailability && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#F0FBF5] text-[#3CA37A] flex items-center gap-0.5">
              {destination.internetAvailability === 'None' ? <WifiOff className="w-2.5 h-2.5" /> : <Wifi className="w-2.5 h-2.5" />}
              {destination.internetAvailability}
            </span>
          )}
        </div>

        {destination.activities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {destination.activities.slice(0, 3).map(a => (
              <span key={a} className="text-[10px] px-2 py-0.5 bg-[#F0FBF5] text-[#1A3D2B] rounded-full">{a}</span>
            ))}
            {destination.activities.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">+{destination.activities.length - 3}</span>
            )}
          </div>
        )}

        {destination.bestSeason && (
          <p className="text-[10px] text-[#4A7A62] mb-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3CA37A] inline-block" />
            Best: {destination.bestSeason}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[#F0FBF5]">
          <div className="flex items-center gap-1 text-xs text-[#4A7A62]">
            <Clock className="w-3 h-3" />
            <span>{destination.duration || 'Flexible'}</span>
          </div>
          <button onClick={e => { e.stopPropagation(); onCompare(); }}
            disabled={isInComparison || !canCompare}
            className={`text-xs font-semibold transition-colors ${
              isInComparison ? 'text-blue-500'
              : !canCompare ? 'text-gray-300 cursor-not-allowed'
              : 'text-[#3CA37A] hover:text-[#1A3D2B]'
            }`}>
            {isInComparison ? '✓ Added' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}
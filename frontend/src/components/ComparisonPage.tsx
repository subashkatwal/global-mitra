import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, X, Plus, ChevronDown, ChevronUp,
  MapPin, Star, Clock, ThumbsUp, Zap, Mountain,
  Droplets, Sun, Users, DollarSign, Wifi, Shield,
  ArrowLeftRight, Search, Trash2, Info, TrendingUp,
  CheckCircle, XCircle, Minus
} from 'lucide-react';

// Types 
interface Destination {
  id: string;
  name: string;
  region: string;
  image: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  duration: string;
  bestSeason: string;
  altitude: string;
  weather: string;
  crowdLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  costPerDay: number;
  wifi: boolean;
  safetyRating: number;
  highlights: string[];
  permits: string[];
  tags: string[];
  trendScore: number;
}

//  Mock destinations 
const DESTINATIONS: Destination[] = [
  {
    id: '1', name: 'Everest Base Camp', region: 'Khumbu, Solukhumbu',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    tagline: 'The ultimate trekker\'s pilgrimage to the roof of the world',
    rating: 4.9, reviewCount: 3842, difficulty: 'Hard', duration: '12–14 days',
    bestSeason: 'Mar–May, Sep–Nov', altitude: '5,364 m', weather: '−10°C to 15°C',
    crowdLevel: 'High', costPerDay: 85, wifi: true, safetyRating: 4.2,
    highlights: ['Kala Patthar viewpoint', 'Sherpa culture', 'Namche Bazaar', 'Tengboche Monastery'],
    permits: ['Sagarmatha NP Entry', 'TIMS Card'],
    tags: ['Iconic', 'World Heritage', 'High Altitude'],
    trendScore: 98,
  },
  {
    id: '2', name: 'Annapurna Circuit', region: 'Gandaki Province',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80',
    tagline: 'A full circle journey through Nepal\'s most diverse landscapes',
    rating: 4.8, reviewCount: 2917, difficulty: 'Moderate', duration: '15–20 days',
    bestSeason: 'Oct–Nov, Mar–Apr', altitude: '5,416 m', weather: '−5°C to 22°C',
    crowdLevel: 'Moderate', costPerDay: 65, wifi: true, safetyRating: 4.4,
    highlights: ['Thorong La Pass', 'Muktinath Temple', 'Poon Hill', 'Manang Valley'],
    permits: ['ACAP Permit', 'TIMS Card'],
    tags: ['Diverse', 'Cultural', 'Long Trail'],
    trendScore: 91,
  },
  {
    id: '3', name: 'Pokhara Valley', region: 'Gandaki Province',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    tagline: 'Nepal\'s adventure capital with mirror lakes and mountain views',
    rating: 4.7, reviewCount: 5621, difficulty: 'Easy', duration: '3–5 days',
    bestSeason: 'Year-round', altitude: '827 m', weather: '10°C to 30°C',
    crowdLevel: 'Very High', costPerDay: 40, wifi: true, safetyRating: 4.7,
    highlights: ['Phewa Lake', 'Sarangkot Sunrise', 'Davis Falls', 'World Peace Pagoda'],
    permits: [],
    tags: ['Family Friendly', 'Lakeside', 'Gateway City'],
    trendScore: 88,
  },
  {
    id: '4', name: 'Langtang Valley', region: 'Bagmati Province',
    image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&q=80',
    tagline: 'The valley of glaciers, closest to Kathmandu',
    rating: 4.6, reviewCount: 1243, difficulty: 'Moderate', duration: '7–10 days',
    bestSeason: 'Mar–May, Oct–Nov', altitude: '4,984 m', weather: '−8°C to 18°C',
    crowdLevel: 'Low', costPerDay: 55, wifi: false, safetyRating: 4.3,
    highlights: ['Kyanjin Gompa', 'Tserko Ri', 'Langtang Village', 'Gosaikunda Lake'],
    permits: ['Langtang NP Entry', 'TIMS Card'],
    tags: ['Off the beaten path', 'Yaks', 'Glaciers'],
    trendScore: 74,
  },
  {
    id: '5', name: 'Upper Mustang', region: 'Gandaki Province',
    image: 'https://images.unsplash.com/photo-1571127236794-81c72e55c3a2?w=600&q=80',
    tagline: 'The forbidden kingdom — ancient Tibetan culture frozen in time',
    rating: 4.8, reviewCount: 876, difficulty: 'Hard', duration: '10–14 days',
    bestSeason: 'Jun–Aug (monsoon-safe)', altitude: '4,000 m', weather: '0°C to 20°C',
    crowdLevel: 'Low', costPerDay: 120, wifi: false, safetyRating: 4.5,
    highlights: ['Lo Manthang', 'Sky Caves', 'Choser Cave', 'Muktinath'],
    permits: ['Restricted Area Permit ($500)', 'ACAP'],
    tags: ['Restricted', 'Ancient Kingdom', 'Desert Landscape'],
    trendScore: 82,
  },
  {
    id: '6', name: 'Chitwan National Park', region: 'Bagmati Province',
    image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&q=80',
    tagline: 'Walk among rhinos and tigers in Nepal\'s oldest national park',
    rating: 4.5, reviewCount: 4102, difficulty: 'Easy', duration: '2–4 days',
    bestSeason: 'Oct–Mar', altitude: '150 m', weather: '15°C to 35°C',
    crowdLevel: 'High', costPerDay: 90, wifi: true, safetyRating: 4.6,
    highlights: ['Jungle Safari', 'Elephant Breeding Center', 'Tharu Culture', 'Canoeing'],
    permits: ['Chitwan NP Entry'],
    tags: ['Wildlife', 'Jungle', 'UNESCO Heritage'],
    trendScore: 79,
  },
];

//  Helper components 
function DifficultyBadge({ level }: { level: Destination['difficulty'] }) {
  const config = {
    Easy:    { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Moderate:{ bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
    Hard:    { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
    Extreme: { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
  }[level];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {level}
    </span>
  );
}

function CrowdBadge({ level }: { level: Destination['crowdLevel'] }) {
  const bars = { Low: 1, Moderate: 2, High: 3, 'Very High': 4 }[level];
  const color = { Low: '#3CA37A', Moderate: '#F59E0B', High: '#F97316', 'Very High': '#EF4444' }[level];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
      <span className="flex gap-0.5 items-end">
        {[1,2,3,4].map(i => (
          <span key={i} className="w-1.5 rounded-sm transition-all"
            style={{ height: `${6 + i * 3}px`, background: i <= bars ? color : '#E5E7EB' }} />
        ))}
      </span>
      {level}
    </span>
  );
}

function StarRating({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const stars = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i}
          className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </span>
  );
}


const COMPARE_ROWS = [
  { key: 'rating',       label: 'Rating',       icon: Star,          format: (d: Destination) => `${d.rating} / 5`,           better: 'higher' },
  { key: 'difficulty',   label: 'Difficulty',   icon: Mountain,      format: (d: Destination) => d.difficulty,                 better: 'lower'  },
  { key: 'duration',     label: 'Duration',     icon: Clock,         format: (d: Destination) => d.duration,                   better: null      },
  { key: 'altitude',     label: 'Max Altitude', icon: Zap,           format: (d: Destination) => d.altitude,                   better: null      },
  { key: 'bestSeason',   label: 'Best Season',  icon: Sun,           format: (d: Destination) => d.bestSeason,                 better: null      },
  { key: 'weather',      label: 'Temperature',  icon: Droplets,      format: (d: Destination) => d.weather,                    better: null      },
  { key: 'crowdLevel',   label: 'Crowd Level',  icon: Users,         format: (d: Destination) => d.crowdLevel,                 better: 'lower'  },
  { key: 'costPerDay',   label: 'Cost / Day',   icon: DollarSign,    format: (d: Destination) => `$${d.costPerDay} USD`,        better: 'lower'  },
  { key: 'wifi',         label: 'WiFi Access',  icon: Wifi,          format: (d: Destination) => d.wifi ? 'Available' : 'None',better: null      },
  { key: 'safetyRating', label: 'Safety',       icon: Shield,        format: (d: Destination) => `${d.safetyRating} / 5`,      better: 'higher' },
  { key: 'trendScore',   label: 'Trending',     icon: TrendingUp,    format: (d: Destination) => `${d.trendScore}%`,           better: 'higher' },
] as const;

//  Main Component 
interface ComparisonPageProps {
  initialDestinations?: string[];
  onNavigate?: (view: string) => void;
}

export function ComparisonPage({ initialDestinations = [], onNavigate }: ComparisonPageProps) {
  const MAX_COMPARE = 3;
  const [selected,    setSelected]    = useState<Destination[]>(() =>
    DESTINATIONS.filter(d => initialDestinations.includes(d.id)).slice(0, MAX_COMPARE)
  );
  const [search,      setSearch]      = useState('');
  const [pickOpen,    setPickOpen]    = useState(false);
  const [highlight,   setHighlight]   = useState<string | null>(null);
  const [collapsed,   setCollapsed]   = useState<Record<string, boolean>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = DESTINATIONS.filter(d =>
    !selected.find(s => s.id === d.id) &&
    (d.name.toLowerCase().includes(search.toLowerCase()) ||
     d.region.toLowerCase().includes(search.toLowerCase()) ||
     d.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const addDest = (d: Destination) => {
    if (selected.length >= MAX_COMPARE) return;
    setSelected(prev => [...prev, d]);
    setSearch('');
    setPickOpen(false);
  };

  const removeDest = (id: string) => setSelected(prev => prev.filter(d => d.id !== id));

  // Determine which column "wins" for numeric/ordinal rows
  const getWinner = (row: typeof COMPARE_ROWS[number], dests: Destination[]): string | null => {
    if (!row.better || dests.length < 2) return null;
    const vals = dests.map(d => {
      const raw = d[row.key as keyof Destination];
      if (typeof raw === 'number') return raw;
      if (typeof raw === 'boolean') return raw ? 1 : 0;
      const order: Record<string, number> = { Easy: 1, Moderate: 2, Hard: 3, Extreme: 4, Low: 1, Moderate2: 2, High: 3, 'Very High': 4 };
      return order[String(raw)] ?? 0;
    });
    const best = row.better === 'higher' ? Math.max(...vals) : Math.min(...vals);
    // Only highlight if there's a clear winner
    const winners = dests.filter((_d, i) => vals[i] === best);
    if (winners.length === dests.length) return null; // all tied
    return winners[0]?.id ?? null;
  };

  const SECTION_KEYS = [
    { title: 'Overview',     rows: ['rating', 'difficulty', 'duration', 'bestSeason'] },
    { title: 'Conditions',   rows: ['altitude', 'weather', 'crowdLevel'] },
    { title: 'Practicalities', rows: ['costPerDay', 'wifi', 'safetyRating', 'trendScore'] },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F5] pt-[68px]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#1A3D2B] flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1A3D2B] tracking-tight">Compare Destinations</h1>
            </div>
            <p className="text-sm text-gray-500 ml-10">
              Pick up to {MAX_COMPARE} destinations to compare side by side
            </p>
          </div>
          {selected.length > 0 && (
            <button onClick={() => setSelected([])}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors self-start sm:self-auto">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </motion.div>

        {/* ── Destination Picker Cards ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

          {selected.map((dest, idx) => (
            <motion.div key={dest.id}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }} layout
              className={`relative rounded-2xl overflow-hidden shadow-md cursor-default transition-all duration-200 ${
                highlight === dest.id ? 'ring-2 ring-[#3CA37A] ring-offset-2' : ''
              }`}
              onMouseEnter={() => setHighlight(dest.id)}
              onMouseLeave={() => setHighlight(null)}
            >
              {/* Image */}
              <div className="h-44 relative">
                <img src={dest.image} alt={dest.name}
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* Remove button */}
                <button onClick={() => removeDest(dest.id)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center transition-colors backdrop-blur-sm">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                {/* Index badge */}
                <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-[#3CA37A] flex items-center justify-center text-white text-xs font-bold">
                  {idx + 1}
                </div>
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-bold text-base leading-tight">{dest.name}</h3>
                  <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {dest.region}
                  </p>
                </div>
              </div>
              {/* Mini stats */}
              <div className="bg-white px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <StarRating value={dest.rating} />
                  <span className="text-xs font-bold text-gray-700 ml-1">{dest.rating}</span>
                </div>
                <DifficultyBadge level={dest.difficulty} />
                <span className="text-xs font-semibold text-[#2D8F6A]">${dest.costPerDay}/day</span>
              </div>
            </motion.div>
          ))}

          {/* Add slot(s) */}
          {selected.length < MAX_COMPARE && (
            <motion.div layout
              className="relative rounded-2xl border-2 border-dashed border-[#A8DFC8] bg-white hover:bg-[#F0FBF5] transition-colors min-h-[200px] flex flex-col items-center justify-center gap-3 cursor-pointer group"
              onClick={() => { setPickOpen(true); setTimeout(() => searchRef.current?.focus(), 80); }}
            >
              <div className="w-12 h-12 rounded-full bg-[#D0F0E4] group-hover:bg-[#3CA37A] flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-[#3CA37A] group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#1A3D2B]">Add Destination</p>
                <p className="text-xs text-gray-400 mt-0.5">{MAX_COMPARE - selected.length} slot{MAX_COMPARE - selected.length !== 1 ? 's' : ''} remaining</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── Destination Search Dropdown ── */}
        <AnimatePresence>
          {pickOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl border border-[#A8DFC8] shadow-xl p-4 mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-[#1A3D2B] flex-1">Choose a destination</h3>
                <button onClick={() => setPickOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, region, or tag…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#3CA37A] focus:ring-2 focus:ring-[#3CA37A]/20"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="col-span-full text-center text-sm text-gray-400 py-6">No more destinations to add</p>
                ) : filtered.map(d => (
                  <button key={d.id} onClick={() => addDest(d)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#3CA37A] hover:bg-[#F0FBF5] transition-all text-left group">
                    <img src={d.image} alt={d.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1A3D2B] truncate group-hover:text-[#3CA37A] transition-colors">{d.name}</p>
                      <p className="text-xs text-gray-400 truncate">{d.region}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={d.rating} />
                        <DifficultyBadge level={d.difficulty} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Comparison Table ── */}
        {selected.length >= 2 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="space-y-4">

            {SECTION_KEYS.map((section) => {
              const isCollapsed = collapsed[section.title];
              const sectionRows = COMPARE_ROWS.filter(r => section.rows.includes(r.key));
              return (
                <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Section header */}
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [section.title]: !prev[section.title] }))}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-bold text-[#1A3D2B]">{section.title}</span>
                    {isCollapsed
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronUp   className="w-4 h-4 text-gray-400" />
                    }
                  </button>

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>

                        {/* Column headers */}
                        <div className={`grid border-t border-gray-50 bg-[#F8FAF9]`}
                          style={{ gridTemplateColumns: `180px repeat(${selected.length}, 1fr)` }}>
                          <div className="px-4 py-2" />
                          {selected.map((d, i) => (
                            <div key={d.id}
                              className="px-4 py-2 flex items-center gap-1.5 border-l border-gray-100">
                              <span className="w-5 h-5 rounded-full bg-[#3CA37A] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <span className="text-xs font-bold text-[#1A3D2B] truncate">{d.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Rows */}
                        {sectionRows.map((row, rowIdx) => {
                          const winnerId = getWinner(row as any, selected);
                          const Icon = row.icon;
                          return (
                            <div key={row.key}
                              className={`grid border-t border-gray-50 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFCFB]'}`}
                              style={{ gridTemplateColumns: `180px repeat(${selected.length}, 1fr)` }}
                            >
                              {/* Row label */}
                              <div className="px-4 py-3.5 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[#EBF7F1] flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-3 h-3 text-[#3CA37A]" />
                                </div>
                                <span className="text-xs font-semibold text-gray-600">{row.label}</span>
                              </div>
                              {/* Values */}
                              {selected.map(d => {
                                const isWinner = winnerId === d.id;
                                const val = row.format(d);
                                const isWifi = row.key === 'wifi';
                                return (
                                  <div key={d.id}
                                    className={`px-4 py-3.5 border-l border-gray-50 flex items-center gap-2 ${
                                      isWinner ? 'bg-[#F0FBF5]' : ''
                                    }`}
                                    onMouseEnter={() => setHighlight(d.id)}
                                    onMouseLeave={() => setHighlight(null)}
                                  >
                                    {isWifi ? (
                                      d.wifi
                                        ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                            <CheckCircle className="w-3.5 h-3.5" /> Available
                                          </span>
                                        : <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                                            <XCircle className="w-3.5 h-3.5" /> None
                                          </span>
                                    ) : row.key === 'difficulty' ? (
                                      <DifficultyBadge level={d.difficulty} />
                                    ) : row.key === 'crowdLevel' ? (
                                      <CrowdBadge level={d.crowdLevel} />
                                    ) : row.key === 'rating' || row.key === 'safetyRating' ? (
                                      <div className="flex items-center gap-1.5">
                                        <StarRating value={Number(String(d[row.key as keyof Destination]))} />
                                        <span className="text-xs font-bold text-gray-700">{val}</span>
                                      </div>
                                    ) : row.key === 'trendScore' ? (
                                      <div className="flex items-center gap-2 w-full">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full bg-[#3CA37A]"
                                            style={{ width: `${d.trendScore}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700 flex-shrink-0">{val}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-700 font-medium">{val}</span>
                                    )}
                                    {isWinner && !isWifi && (
                                      <ThumbsUp className="w-3 h-3 text-[#3CA37A] ml-auto flex-shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* ── Highlights & Permits ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50">
                <span className="text-sm font-bold text-[#1A3D2B]">Highlights & Permits</span>
              </div>
              <div className={`grid`} style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
                {selected.map((d, i) => (
                  <div key={d.id} className={`p-4 ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-[#3CA37A] text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-xs font-bold text-[#1A3D2B] truncate">{d.name}</span>
                    </div>

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Highlights</p>
                    <ul className="space-y-1.5 mb-4">
                      {d.highlights.map(h => (
                        <li key={h} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-[#3CA37A] flex-shrink-0 mt-0.5" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Required Permits</p>
                    {d.permits.length === 0 ? (
                      <p className="text-xs text-gray-400 italic flex items-center gap-1">
                        <Minus className="w-3 h-3" /> No permits required
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {d.permits.map(p => (
                          <li key={p} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {d.tags.map(t => (
                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF7F1] text-[#2D8F6A]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Verdict banner ── */}
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-[#1A3D2B] to-[#2D8F6A] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Comparison complete!</p>
                <p className="text-white/70 text-xs mt-0.5">
                  You've compared {selected.length} destinations. Green highlights indicate the stronger option for each metric.
                  Add more destinations or explore each one below.
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('explore')}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-white text-[#1A3D2B] text-sm font-bold hover:bg-[#D0F0E4] transition-colors">
                Explore More →
              </button>
            </motion.div>
          </motion.div>
        ) : (
          /* ── Empty state ── */
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#D0F0E4] flex items-center justify-center mb-4">
              <ArrowLeftRight className="w-8 h-8 text-[#3CA37A]" />
            </div>
            <h2 className="text-lg font-bold text-[#1A3D2B] mb-2">Select at least 2 destinations</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Click the <strong>Add Destination</strong> cards above to pick places you'd like to compare side by side.
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
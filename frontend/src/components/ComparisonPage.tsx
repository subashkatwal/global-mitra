import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, X, Plus, ChevronDown, ChevronUp, MapPin, Star, Clock,
  Mountain, Users, DollarSign, Wifi, Shield, ArrowLeft, ArrowRight,
  CheckCircle, XCircle, Sparkles, Info, Minus, TrendingUp, Thermometer,
  Compass, Calendar, AlertCircle, Trash2, Check
} from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  region: string;
  image: string;
  rating: number;
  reviewCount?: number;
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
  trendScore?: number;
  description?: string;
}

interface ComparisonPageProps {
  destinations: Destination[];
  availableDestinations: Destination[];
  onRemove: (id: string) => void;
  onAdd: (destination: Destination) => void;
  onClear: () => void;
  onDestinationClick: (id: string) => void;
  onBack: () => void;
}

const MIN_COMPARE = 2;

// Helper components
function DifficultyBadge({ level }: { level: Destination['difficulty'] }) {
  const config = {
    Easy:    { bg: 'bg-[#2ECC71]', text: 'text-white' },
    Moderate:{ bg: 'bg-[#F7B801]', text: 'text-white' },
    Hard:    { bg: 'bg-[#FF6B35]', text: 'text-white' },
    Extreme: { bg: 'bg-red-600',   text: 'text-white' },
  }[level];
  
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${config.bg} ${config.text}`}>
      {level}
    </span>
  );
}

function CrowdBadge({ level }: { level: Destination['crowdLevel'] }) {
  const bars = { Low: 1, Moderate: 2, High: 3, 'Very High': 4 }[level];
  const color = { 
    Low: '#2ECC71', 
    Moderate: '#F7B801', 
    High: '#FF6B35', 
    'Very High': '#EF4444' 
  }[level];
  
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7F8C8D]">
      <span className="flex gap-0.5 items-end">
        {[1, 2, 3, 4].map(i => (
          <span 
            key={i} 
            className="w-1.5 rounded-sm transition-all"
            style={{ 
              height: `${6 + i * 3}px`, 
              background: i <= (bars || 1) ? color : '#E5E7EB' 
            }} 
          />
        ))}
      </span>
      {level}
    </span>
  );
}

function StarRating({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const stars = Math.round(value);
  const sizeClasses = { 
    sm: 'w-3 h-3', 
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star 
          key={i}
          className={`${sizeClasses[size]} ${i <= stars ? 'text-[#F7B801] fill-[#F7B801]' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </span>
  );
}

// Comparison configuration
const COMPARE_ROWS = [
  { key: 'rating',       label: 'Rating',       icon: Star,          format: (d: Destination) => `${d.rating} / 5`,           better: 'higher', category: 'Overview' },
  { key: 'difficulty',   label: 'Difficulty',   icon: Mountain,      format: (d: Destination) => d.difficulty,                 better: 'lower',  category: 'Overview' },
  { key: 'duration',     label: 'Duration',     icon: Clock,         format: (d: Destination) => d.duration,                   better: null,     category: 'Overview' },
  { key: 'bestSeason',   label: 'Best Season',  icon: Calendar,      format: (d: Destination) => d.bestSeason,                 better: null,     category: 'Overview' },
  { key: 'altitude',     label: 'Max Altitude', icon: Compass,       format: (d: Destination) => d.altitude,                   better: null,     category: 'Conditions' },
  { key: 'weather',      label: 'Temperature',  icon: Thermometer,   format: (d: Destination) => d.weather,                    better: null,     category: 'Conditions' },
  { key: 'crowdLevel',   label: 'Crowd Level',  icon: Users,         format: (d: Destination) => d.crowdLevel,                 better: 'lower',  category: 'Conditions' },
  { key: 'costPerDay',   label: 'Cost / Day',   icon: DollarSign,    format: (d: Destination) => `$${d.costPerDay}`,            better: 'lower',  category: 'Practicalities' },
  { key: 'wifi',         label: 'WiFi Access',  icon: Wifi,          format: (d: Destination) => d.wifi ? 'Available' : 'None',better: null,     category: 'Practicalities' },
  { key: 'safetyRating', label: 'Safety Score', icon: Shield,        format: (d: Destination) => `${d.safetyRating} / 5`,      better: 'higher', category: 'Practicalities' },
  { key: 'trendScore',   label: 'Trending',     icon: TrendingUp,    format: (d: Destination) => `${d.trendScore || 0}%`,     better: 'higher', category: 'Practicalities' },
] as const;

export function ComparisonPage({ 
  destinations, 
  availableDestinations,
  onRemove, 
  onAdd,
  onClear, 
  onDestinationClick, 
  onBack 
}: ComparisonPageProps) {
  const [highlight, setHighlight] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Group rows by category
  const groupedRows = useMemo(() => {
    return COMPARE_ROWS.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = [];
      acc[row.category].push(row);
      return acc;
    }, {} as Record<string, typeof COMPARE_ROWS>);
  }, []);

  // FIXED: Separate order maps for difficulty and crowd to avoid duplicate keys
  const getWinner = (row: typeof COMPARE_ROWS[number], dests: Destination[]): string | null => {
    if (!row.better || dests.length < 2) return null;
    
    const vals = dests.map(d => {
      const raw = d[row.key as keyof Destination];
      if (typeof raw === 'number') return raw;
      if (typeof raw === 'boolean') return raw ? 1 : 0;
      
      // FIXED: Use separate order objects to avoid duplicate "Moderate" key
      const difficultyOrder: Record<string, number> = { 
        Easy: 1, Moderate: 2, Hard: 3, Extreme: 4 
      };
      const crowdOrder: Record<string, number> = { 
        Low: 1, Moderate: 2, High: 3, 'Very High': 4 
      };
      
      if (row.key === 'difficulty') {
        return difficultyOrder[String(raw)] ?? 0;
      }
      if (row.key === 'crowdLevel') {
        return crowdOrder[String(raw)] ?? 0;
      }
      return 0;
    });
    
    const best = row.better === 'higher' ? Math.max(...vals) : Math.min(...vals);
    const winners = dests.filter((_d, i) => vals[i] === best);
    
    if (winners.length === dests.length) return null;
    return winners[0]?.id ?? null;
  };

  // Filter available destinations
  const availableToAdd = useMemo(() => {
    const selectedIds = new Set(destinations.map(d => d.id));
    return availableDestinations.filter(d => !selectedIds.has(d.id));
  }, [destinations, availableDestinations]);

  if (destinations.length < MIN_COMPARE) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <BarChart3 className="w-16 h-16 text-[#74A58A] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">Not enough destinations</h2>
          <p className="text-[#7F8C8D] mb-6">Select at least {MIN_COMPARE} destinations to compare</p>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold hover:bg-[#E55A2B] transition-colors"
          >
            Browse Destinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -16 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-end gap-4 mb-8"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-[#D8F3DC] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#2C3E50]" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#2C3E50] flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] tracking-tight">
                  Compare Destinations
                </h1>
                <p className="text-sm text-[#7F8C8D]">
                  Side-by-side analysis of {destinations.length} destinations
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAddPanel(!showAddPanel)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D8F3DC] text-[#2C3E50] text-sm font-semibold hover:bg-[#74A58A] hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Destination
            </button>
            <button 
              onClick={onClear}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        </motion.div>

        {/* Add Destination Panel */}
        <AnimatePresence>
          {showAddPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-[#D8F3DC] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#2C3E50]">Add another destination</h3>
                  <button 
                    onClick={() => setShowAddPanel(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-[#7F8C8D]" />
                  </button>
                </div>
                {availableToAdd.length === 0 ? (
                  <p className="text-sm text-[#7F8C8D]">No more destinations available</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {availableToAdd.slice(0, 12).map(dest => (
                      <button
                        key={dest.id}
                        onClick={() => {
                          onAdd(dest);
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 hover:border-[#74A58A] hover:bg-[#D8F3DC]/30 transition-all text-left"
                      >
                        <img 
                          src={dest.image} 
                          alt={dest.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2C3E50] truncate">{dest.name}</p>
                          <p className="text-[10px] text-[#7F8C8D] truncate">{dest.region}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Destination Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex gap-4 overflow-x-auto pb-4 mb-8 scrollbar-hide"
        >
          {destinations.map((dest, idx) => (
            <motion.div 
              key={dest.id}
              layout
              className={`relative flex-shrink-0 w-64 rounded-2xl overflow-hidden shadow-md transition-all duration-200 ${
                highlight === dest.id ? 'ring-2 ring-[#FF6B35] ring-offset-2' : ''
              }`}
              onMouseEnter={() => setHighlight(dest.id)}
              onMouseLeave={() => setHighlight(null)}
            >
              <div className="h-40 relative">
                <img 
                  src={dest.image} 
                  alt={dest.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <button 
                  onClick={() => onRemove(dest.id)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                
                <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {idx + 1}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 
                    className="text-white font-bold text-sm leading-tight truncate cursor-pointer hover:underline"
                    onClick={() => onDestinationClick(dest.id)}
                  >
                    {dest.name}
                  </h3>
                  <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {dest.region}
                  </p>
                </div>
              </div>
              
              <div className="bg-white px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <StarRating value={dest.rating} size="sm" />
                  <span className="text-xs font-bold text-[#2C3E50]">{dest.rating}</span>
                </div>
                <DifficultyBadge level={dest.difficulty} />
              </div>
            </motion.div>
          ))}

          {/* Add button card */}
          <button
            onClick={() => setShowAddPanel(true)}
            className="flex-shrink-0 w-64 rounded-2xl border-2 border-dashed border-[#74A58A] bg-white hover:bg-[#D8F3DC]/30 transition-colors min-h-[200px] flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#D8F3DC] group-hover:bg-[#74A58A] flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-[#74A58A] group-hover:text-white transition-colors" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-bold text-[#2C3E50]">Add Destination</p>
              <p className="text-xs text-[#7F8C8D] mt-0.5">No limit</p>
            </div>
          </button>
        </motion.div>

        {/* Comparison Table */}
        <div className="space-y-4">
          {Object.entries(groupedRows).map(([category, rows]) => {
            const isCollapsed = collapsed[category];
            
            return (
              <div 
                key={category} 
                className="bg-white rounded-2xl border border-[#D8F3DC] shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FDF8F3] transition-colors bg-[#FDF8F3]/50"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                    <span className="text-sm font-bold text-[#2C3E50]">{category}</span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-[#7F8C8D]" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-[#7F8C8D]" />
                  )}
                </button>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {rows.map((row, rowIdx) => {
                        const winnerId = getWinner(row as any, destinations);
                        const Icon = row.icon;
                        
                        return (
                          <div 
                            key={row.key}
                            className={`grid border-t border-[#D8F3DC] ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FDF8F3]/30'}`}
                            style={{ 
                              gridTemplateColumns: `200px repeat(${destinations.length}, minmax(150px, 1fr))` 
                            }}
                          >
                            <div className="px-5 py-4 flex items-center gap-3 border-r border-[#D8F3DC]">
                              <div className="w-8 h-8 rounded-lg bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-[#74A58A]" />
                              </div>
                              <span className="text-sm font-semibold text-[#2C3E50]">{row.label}</span>
                            </div>
                            
                            {destinations.map(d => {
                              const isWinner = winnerId === d.id;
                              const val = row.format(d);
                              const isWifi = row.key === 'wifi';
                              const isRating = row.key === 'rating' || row.key === 'safetyRating';
                              const isTrend = row.key === 'trendScore';
                              const isDifficulty = row.key === 'difficulty';
                              const isCrowd = row.key === 'crowdLevel';
                              
                              return (
                                <div 
                                  key={d.id}
                                  className={`px-4 py-4 border-l border-[#D8F3DC] flex items-center gap-2 ${
                                    isWinner ? 'bg-[#D8F3DC]/30' : ''
                                  }`}
                                  onMouseEnter={() => setHighlight(d.id)}
                                  onMouseLeave={() => setHighlight(null)}
                                >
                                  {isWifi ? (
                                    d.wifi ? (
                                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2ECC71]">
                                        <CheckCircle className="w-4 h-4" /> Available
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#7F8C8D]">
                                        <XCircle className="w-4 h-4" /> None
                                      </span>
                                    )
                                  ) : isDifficulty ? (
                                    <DifficultyBadge level={d.difficulty} />
                                  ) : isCrowd ? (
                                    <CrowdBadge level={d.crowdLevel} />
                                  ) : isRating ? (
                                    <div className="flex items-center gap-2">
                                      <StarRating value={Number(val.split(' ')[0])} size="sm" />
                                      <span className="text-sm font-bold text-[#2C3E50]">{val}</span>
                                    </div>
                                  ) : isTrend ? (
                                    <div className="flex items-center gap-2 w-full">
                                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${d.trendScore || 0}%` }}
                                          className="h-full rounded-full bg-[#FF6B35]"
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-[#2C3E50] flex-shrink-0">{val}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-[#2C3E50] font-medium truncate">{val}</span>
                                  )}
                                  
                                  {isWinner && !isWifi && (
                                    <motion.div 
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="ml-auto"
                                    >
                                      <Check className="w-4 h-4 text-[#2ECC71]" />
                                    </motion.div>
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

          {/* Highlights & Permits */}
          <div className="bg-white rounded-2xl border border-[#D8F3DC] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D8F3DC] bg-[#FDF8F3]/50">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-sm font-bold text-[#2C3E50]">Highlights & Requirements</span>
              </div>
            </div>
            
            <div 
              className="grid divide-x divide-[#D8F3DC] overflow-x-auto"
              style={{ gridTemplateColumns: `repeat(${destinations.length}, minmax(250px, 1fr))` }}
            >
              {destinations.map((d, i) => (
                <div key={d.id} className="p-5 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold text-[#2C3E50] truncate">{d.name}</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-[#7F8C8D] uppercase tracking-wider mb-2">
                      Top Highlights
                    </p>
                    <ul className="space-y-2">
                      {d.highlights?.slice(0, 4).map(h => (
                        <li key={h} className="flex items-start gap-2 text-xs text-[#2C3E50]">
                          <CheckCircle className="w-3.5 h-3.5 text-[#2ECC71] flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-[#7F8C8D] uppercase tracking-wider mb-2">
                      Required Permits
                    </p>
                    {d.permits?.length === 0 ? (
                      <p className="text-xs text-[#7F8C8D] italic flex items-center gap-1">
                        <Minus className="w-3 h-3" /> No permits required
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {d.permits?.map(p => (
                          <li 
                            key={p} 
                            className="flex items-start gap-1.5 text-xs text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-1.5 rounded-lg"
                          >
                            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {d.tags?.map(t => (
                      <span 
                        key={t} 
                        className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#D8F3DC] text-[#74A58A]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => onDestinationClick(d.id)}
                    className="w-full py-2.5 rounded-xl bg-[#2C3E50] text-white text-xs font-semibold hover:bg-[#1A252F] transition-colors flex items-center justify-center gap-1"
                  >
                    View Details <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Verdict Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-[#2C3E50] to-[#74A58A] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">Comparison Complete!</p>
              <p className="text-white/80 text-sm mt-1">
                You've compared {destinations.length} destinations. Green highlights indicate the best option for each metric.
              </p>
            </div>
            <button
              onClick={onBack}
              className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-[#2C3E50] text-sm font-bold hover:bg-[#D8F3DC] transition-colors flex items-center gap-2"
            >
              Explore More <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
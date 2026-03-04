import { motion } from 'framer-motion';
import { MapPin, Star, Mountain, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

function publicFetch(path: string) {
  return fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

interface MarqueeDestination {
  id: string;
  name: string;
  image?: string;
  difficulty: string;
  averageCost: number;
  crowdLevel: string;
  safetyLevel?: string;
  duration: string;
  bestSeason: string;
  internetAvailability: string;
  district: string;
  country: string;
}

interface DestinationMarqueeProps {
  onPlaceClick: (id: string) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:     'bg-emerald-500',
  Moderate: 'bg-yellow-500',
  Hard:     'bg-orange-500',
  Extreme:  'bg-red-600',
};

export function DestinationMarquee({ onPlaceClick }: DestinationMarqueeProps) {
  const [destinations, setDestinations] = useState<MarqueeDestination[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    publicFetch('/destinations?page_size=20&ordering=-createdAt')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const raw = data.results ?? [];
        if (raw.length > 0) {
          console.log('[Marquee] sample item:', JSON.stringify(raw[0], null, 2));
        }
        const items: MarqueeDestination[] = raw.map((d: any) => ({
          id:                   d.id,
          name:                 d.name,
          image:                d.image ?? undefined,
          difficulty:           d.difficulty,
          averageCost:          Number(d.averageCost),
          crowdLevel:           d.crowdLevel,
          safetyLevel:          d.safetyLevel,
          duration:             d.duration,
          bestSeason:           d.bestSeason,
          internetAvailability: d.internetAvailability,
          district:             d.district ?? '',
          country:              d.country ?? '',
        }));
        setDestinations(items);
      })
      .catch(err => {
        console.error('Marquee fetch error:', err);
        setError('Failed to load destinations.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-[#FDF8F3]">
        <div className="text-center mb-12 px-4">
          <span className="inline-block px-4 py-1.5 bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-medium rounded-full mb-4">Trending Destinations</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#2C3E50]">Explore Popular Places</h2>
        </div>
        <div className="flex gap-5 px-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 h-96 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error || destinations.length === 0) {
    return (
      <section className="py-16 bg-[#FDF8F3]">
        <div className="text-center">
          <p className="text-gray-500">{error ?? 'No destinations available.'}</p>
        </div>
      </section>
    );
  }

  // Split into 2 equal rows — if odd number, pad last row with first item
  const half = Math.ceil(destinations.length / 2);
  const row1Base = destinations.slice(0, half);
  const row2Base = destinations.slice(half);

  // Ensure row2 has same length as row1
  while (row2Base.length < row1Base.length) {
    row2Base.push(row1Base[row2Base.length % row1Base.length]);
  }

  // Triple each row so the marquee has no visible gap
  const row1 = [...row1Base, ...row1Base, ...row1Base];
  const row2 = [...row2Base, ...row2Base, ...row2Base];

  return (
    <section className="py-16 overflow-hidden bg-[#FDF8F3]">
      {/* Inject marquee CSS once */}
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(calc(-100% / 3)); }
          100% { transform: translateX(0); }
        }
        .marquee-left  { animation: marquee-left  38s linear infinite; }
        .marquee-right { animation: marquee-right 38s linear infinite; }
        .marquee-left:hover,
        .marquee-right:hover { animation-play-state: paused; }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="section-padding text-center mb-12"
      >
        <span className="inline-block px-4 py-1.5 bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-medium rounded-full mb-4">
          Trending Destinations
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#2C3E50]">
          Explore Popular Places
        </h2>
        <p className="text-[#7F8C8D] mt-2">{destinations.length} destinations from Nepal</p>
      </motion.div>

      {/* Row 1 — left */}
      <motion.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="relative mb-5"
      >
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FDF8F3] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FDF8F3] to-transparent z-10 pointer-events-none" />
        <div className="flex gap-5 marquee-left" style={{ width: 'max-content' }}>
          {row1.map((place, i) => (
            <MarqueeCard key={`r1-${place.id}-${i}`} place={place} tall onClick={() => onPlaceClick(place.id)} />
          ))}
        </div>
      </motion.div>

      {/* Row 2 — right */}
      <motion.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ delay: 0.15 }}
        className="relative"
      >
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FDF8F3] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FDF8F3] to-transparent z-10 pointer-events-none" />
        <div className="flex gap-5 marquee-right" style={{ width: 'max-content' }}>
          {row2.map((place, i) => (
            <MarqueeCard key={`r2-${place.id}-${i}`} place={place} tall={false} onClick={() => onPlaceClick(place.id)} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ── MarqueeCard ───────────────────────────────────────────────────────────────

function MarqueeCard({
  place, tall, onClick,
}: {
  place: MarqueeDestination;
  tall: boolean;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const height = tall ? 'h-96' : 'h-80';

  return (
    <div
      onClick={onClick}
      className={`flex-shrink-0 w-72 cursor-pointer group`}
    >
      <div className={`relative ${height} rounded-2xl overflow-hidden`}>
        {place.image && !imgError ? (
          <img
            src={place.image}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#D8F3DC] to-[#B7E4C7] flex items-center justify-center">
            <Mountain className="w-16 h-16 text-[#74A58A]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Difficulty badge */}
        {place.difficulty && (
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wide ${DIFFICULTY_COLORS[place.difficulty] ?? 'bg-gray-500'}`}>
            {place.difficulty}
          </div>
        )}

        {/* Internet badge */}
        <div className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white">
          {place.internetAvailability === 'None'
            ? <WifiOff className="w-3.5 h-3.5" />
            : <Wifi className="w-3.5 h-3.5" />
          }
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Star className="w-3.5 h-3.5 text-[#F7B801] fill-[#F7B801]" />
            <span className="text-white font-semibold text-sm">4.8</span>
            <span className="text-white/60 text-xs">· {place.duration}</span>
          </div>
          <h3 className="text-white font-bold text-xl mb-1 group-hover:text-[#FF6B35] transition-colors line-clamp-1">
            {place.name}
          </h3>
          <p className="text-white/80 text-sm flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {[place.district, place.country].filter(Boolean).join(', ')}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-xs">{place.bestSeason}</p>
            <span className="text-white font-semibold text-sm">
              Rs {Math.round(place.averageCost)}/day
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, Star, ArrowRight, Shield } from 'lucide-react';
// import { apiFetch } from '@/services/api';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

function publicFetch(path: string) {
  return fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

interface HeroSectionProps {
  onExploreClick: () => void;
  onPlaceClick: (id: string) => void;
}

interface HeroDestination {
  id: string;
  name: string;
  image?: string;
  difficulty: string;
  averageCost: number;
  latitude: number;
  longitude: number;
}

export function HeroSection({ onExploreClick, onPlaceClick }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState({ travelers: 0, places: 0, rating: 0 });
  const [heroDestinations, setHeroDestinations] = useState<HeroDestination[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], ['0%', '-50px']);

  // Counter animation
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCounters({
        travelers: Math.floor(50000 * easeOut),
        places: Math.floor(12000 * easeOut),
        rating: Math.floor(49 * easeOut) / 10,
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  // Fetch 3 destinations from API
  useEffect(() => {
    publicFetch('/destinations?page_size=3&ordering=-createdAt')
      .then(r => r.json())
      .then(data => {
        const items: HeroDestination[] = (data.results ?? []).slice(0, 3).map((d: any) => ({
          id: d.id,
          name: d.name,
          image: d.image ?? undefined,
          difficulty: d.difficulty,
          averageCost: Number(d.averageCost),
          latitude: d.latitude,
          longitude: d.longitude,
        }));
        setHeroDestinations(items);
      })
      .catch(() => {/* silently fail — hero still renders */});
  }, []);

  // Floating card positions (index 0, 1, 2)
  const cardPositions = [
    'top-0 right-0 w-64 xl:w-72',
    'top-36 left-0 w-56 xl:w-64',
    'bottom-0 right-8 xl:right-12 w-60 xl:w-[17rem]',
  ];

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Background with parallax */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: "url('/images/image.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C3E50]/85 via-[#2C3E50]/60 to-[#2C3E50]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDF8F3]/40 via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 min-h-screen flex items-center"
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 pt-20 sm:pt-24 pb-12 sm:pb-16">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Left */}
            <div className="text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5 sm:mb-6"
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2ECC71]" />
                <span className="text-xs sm:text-sm font-medium">Verified Travel Safety Reports</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6"
              >
                Discover the World Through{' '}
                <span className="bg-gradient-to-r from-[#FF6B35] to-[#F7B801] bg-clip-text text-transparent">
                  Trusted Travelers
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="text-base sm:text-lg text-white/80 mb-6 sm:mb-8 max-w-xl"
              >
                Join 50,000+ adventurers sharing real-time experiences, verified by our global community of local guides.
              </motion.p>

              {/* Search */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="relative max-w-lg mb-6 sm:mb-8"
              >
                <div className="flex items-center bg-white rounded-xl sm:rounded-2xl shadow-2xl p-1.5 sm:p-2">
                  <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Where do you want to explore?"
                      className="flex-1 py-2 sm:py-3 outline-none text-[#2C3E50] placeholder:text-gray-400 text-sm sm:text-base min-w-0"
                    />
                  </div>
                  <button onClick={onExploreClick} className="btn-primary px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base whitespace-nowrap flex-shrink-0">
                    Explore
                  </button>
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10"
              >
                <button onClick={onExploreClick} className="btn-primary flex items-center gap-2 text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3">
                  Start Your Journey <ArrowRight className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-colors text-sm sm:text-base">
                  Learn How It Works
                </button>
              </motion.div>

              {/* Trust counters */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-6 sm:gap-8"
              >
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#FF6B35]">{counters.travelers.toLocaleString()}+</div>
                  <div className="text-xs sm:text-sm text-white/70">Travelers</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#F7B801]">{counters.places.toLocaleString()}+</div>
                  <div className="text-xs sm:text-sm text-white/70">Verified Places</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-2xl sm:text-3xl font-bold text-[#2ECC71]">
                    {counters.rating}<Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                  </div>
                  <div className="text-xs sm:text-sm text-white/70">Average Rating</div>
                </div>
              </motion.div>
            </div>

            {/* Right — 3 floating destination cards from API */}
            <motion.div
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="hidden lg:block relative"
            >
              <div className="relative h-[480px] xl:h-[520px]">
                {heroDestinations.length > 0
                  ? heroDestinations.map((dest, index) => (
                      <FloatingCard
                        key={dest.id}
                        dest={dest}
                        index={index}
                        positionClass={cardPositions[index]}
                        onClick={() => onPlaceClick(dest.id)}
                      />
                    ))
                  : /* Skeleton placeholders while loading */
                    [0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`absolute ${cardPositions[i]} bg-white/10 rounded-2xl animate-pulse`}
                        style={{ height: 220 }}
                      />
                    ))
                }
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#FF6B35]/20 rounded-full blur-2xl" />
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#F7B801]/20 rounded-full blur-2xl" />
              </div>
            </motion.div>

            {/* Mobile card strip */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              className="lg:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory"
            >
              {heroDestinations.map(dest => (
                <div
                  key={dest.id}
                  onClick={() => onPlaceClick(dest.id)}
                  className="flex-shrink-0 w-52 bg-white rounded-2xl overflow-hidden shadow-xl cursor-pointer hover:scale-[1.02] transition-transform snap-start"
                >
                  <div className="relative h-28 bg-[#D8F3DC]">
                    {dest.image
                      ? <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-8 h-8 text-[#74A58A]" /></div>
                    }
                    {dest.difficulty && (
                      <span className={`absolute top-2 left-2 px-2 py-0.5 text-white text-[10px] font-bold uppercase rounded-full ${
                        dest.difficulty === 'Easy'     ? 'bg-emerald-500' :
                        dest.difficulty === 'Moderate' ? 'bg-yellow-500'  :
                        dest.difficulty === 'Hard'     ? 'bg-orange-500'  :
                        dest.difficulty === 'Extreme'  ? 'bg-red-600'     : 'bg-gray-500'
                      }`}>
                        {dest.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-[#2C3E50] text-sm mb-0.5 truncate">{dest.name}</h3>
                    <p className="text-[11px] text-[#7F8C8D] flex items-center gap-1 mb-1.5">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{dest.difficulty} · ${Math.round(dest.averageCost)}/day</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#F7B801] fill-[#F7B801]" />
                      <span className="font-semibold text-[#2C3E50] text-xs">4.8</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </motion.div>
    </section>
  );
}

//  Floating card sub-component 

function FloatingCard({
  dest, index, positionClass, onClick,
}: {
  dest: HeroDestination;
  index: number;
  positionClass: string;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { delay: 0.8 + index * 0.2, duration: 0.5 },
        y: { delay: 1 + index * 0.2, duration: 4, repeat: Infinity, ease: 'easeInOut' },
      }}
      className={`absolute ${positionClass} cursor-pointer hover:scale-105 transition-transform`}
      onClick={onClick}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative h-36 xl:h-40 bg-[#D8F3DC]">
          {dest.image && !imgError
            ? <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
            : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-8 h-8 text-[#74A58A]" /></div>
          }
          {dest.difficulty && (
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-wide ${
              dest.difficulty === 'Easy'     ? 'bg-emerald-500' :
              dest.difficulty === 'Moderate' ? 'bg-yellow-500'  :
              dest.difficulty === 'Hard'     ? 'bg-orange-500'  :
              dest.difficulty === 'Extreme'  ? 'bg-red-600'     : 'bg-gray-500'
            }`}>
              {dest.difficulty}
            </div>
          )}
        </div>
        <div className="p-3 xl:p-4">
          <h3 className="font-bold text-[#2C3E50] mb-1 text-sm xl:text-base truncate">{dest.name}</h3>
          <p className="text-xs xl:text-sm text-[#7F8C8D] flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{dest.difficulty} · Rs {Math.round(dest.averageCost)}/day</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#F7B801] fill-[#F7B801]" />
            <span className="font-semibold text-[#2C3E50] text-sm">4.8</span>
            <span className="text-xs text-[#7F8C8D]">Verified</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
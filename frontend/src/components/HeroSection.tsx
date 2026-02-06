import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Search, Play, MapPin, Star, ArrowRight,
  Shield
} from 'lucide-react';
import { getTrendingPlaces } from '@/data/destinations';

interface HeroSectionProps {
  onExploreClick: () => void;
  onPlaceClick: (id: string) => void;
}

export function HeroSection({ onExploreClick, onPlaceClick }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState({ travelers: 0, places: 0, rating: 0 });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
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
        rating: Math.floor(49 * easeOut) / 10
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  const trendingPlaces = getTrendingPlaces(3);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute inset-0 z-0"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&h=1080&fit=crop')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C3E50]/80 via-[#2C3E50]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDF8F3] via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div 
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 min-h-screen flex items-center"
      >
        <div className="section-padding w-full pt-24 pb-16">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
              >
                <Shield className="w-4 h-4 text-[#2ECC71]" />
                <span className="text-sm font-medium">Verified by 50,000+ travelers</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              >
                Discover the World Through{' '}
                <span className="text-gradient bg-gradient-to-r from-[#FF6B35] to-[#F7B801] bg-clip-text text-transparent">
                  Trusted Travelers
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-white/80 mb-8 max-w-xl"
              >
                Join 50,000+ adventurers sharing real-time experiences, verified by our global community of local guides.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="relative max-w-lg mb-8"
              >
                <div className="flex items-center bg-white rounded-2xl shadow-2xl p-2">
                  <div className="flex-1 flex items-center gap-3 px-4">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Where do you want to explore?"
                      className="flex-1 py-3 outline-none text-[#2C3E50] placeholder:text-gray-400"
                    />
                  </div>
                  <button 
                    onClick={onExploreClick}
                    className="btn-primary px-6 py-3 rounded-xl"
                  >
                    Explore
                  </button>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-4 mb-10"
              >
                <button 
                  onClick={onExploreClick}
                  className="btn-primary flex items-center gap-2"
                >
                  Start Your Journey
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-colors">
                  <Play className="w-4 h-4" />
                  Watch How It Works
                </button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-8"
              >
                <div>
                  <div className="text-3xl font-bold text-[#FF6B35]">
                    {counters.travelers.toLocaleString()}+
                  </div>
                  <div className="text-sm text-white/70">Travelers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#F7B801]">
                    {counters.places.toLocaleString()}+
                  </div>
                  <div className="text-sm text-white/70">Verified Places</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-3xl font-bold text-[#2ECC71]">
                    {counters.rating}
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-sm text-white/70">Average Rating</div>
                </div>
              </motion.div>
            </div>

            {/* Right Content - Featured Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="hidden lg:block relative"
            >
              <div className="relative h-[500px]">
                {/* Floating Cards */}
                {trendingPlaces.map((place, index) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ 
                      opacity: 1, 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      opacity: { delay: 0.8 + index * 0.2, duration: 0.5 },
                      y: { 
                        delay: 1 + index * 0.2, 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: 'easeInOut' 
                      }
                    }}
                    className={`absolute cursor-pointer hover:scale-105 transition-transform ${
                      index === 0 ? 'top-0 right-0 w-72' :
                      index === 1 ? 'top-32 left-0 w-64' :
                      'bottom-0 right-12 w-68'
                    }`}
                    onClick={() => onPlaceClick(place.id)}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                      <div className="relative h-40">
                        <img
                          src={place.images[0]}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-[#2ECC71] text-white text-xs font-medium rounded-full">
                            Verified
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-[#2C3E50] mb-1">{place.name}</h3>
                        <p className="text-sm text-[#7F8C8D] flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {place.location.city}, {place.location.country}
                        </p>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-[#F7B801] fill-[#F7B801]" />
                          <span className="font-semibold text-[#2C3E50]">{place.rating}</span>
                          <span className="text-sm text-[#7F8C8D]">({place.reviewCount})</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Decorative Elements */}
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#FF6B35]/20 rounded-full blur-2xl" />
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#F7B801]/20 rounded-full blur-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

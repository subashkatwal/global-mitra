import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { destinationsData } from '@/data/destinations';

interface DestinationMarqueeProps {
  onPlaceClick: (id: string) => void;
}

export function DestinationMarquee({ onPlaceClick }: DestinationMarqueeProps) {
  // Double the destinations for seamless loop
  const row1 = [...destinationsData.slice(0, 8), ...destinationsData.slice(0, 8)];
  const row2 = [...destinationsData.slice(8, 16), ...destinationsData.slice(8, 16)];

  return (
    <section className="py-16 overflow-hidden bg-[#FDF8F3]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="section-padding text-center mb-12"
      >
        <span className="inline-block px-4 py-1.5 bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-medium rounded-full mb-4">
          Trending Destinations
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#2C3E50]">
          Explore Popular Places
        </h2>
      </motion.div>

      {/* Row 1 - Moving Left */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mb-6"
      >
        {/* Gradient Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FDF8F3] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FDF8F3] to-transparent z-10" />
        
        <div className="flex gap-5 marquee">
          {row1.map((place, index) => (
            <div
              key={`row1-${place.id}-${index}`}
              onClick={() => onPlaceClick(place.id)}
              className="flex-shrink-0 w-72 cursor-pointer group"
            >
              <div className="relative h-96 rounded-2xl overflow-hidden">
                <img
                  src={place.images[0]}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-[#F7B801] fill-[#F7B801]" />
                    <span className="text-white font-semibold">{place.rating}</span>
                    <span className="text-white/70 text-sm">({place.reviewCount})</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-1 group-hover:text-[#FF6B35] transition-colors">
                    {place.name}
                  </h3>
                  <p className="text-white/70 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {place.location.city}, {place.location.country}
                  </p>
                </div>

                {/* Verified Badge */}
                {place.isVerified && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#2ECC71] text-white text-xs font-medium rounded-full">
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Row 2 - Moving Right */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        {/* Gradient Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FDF8F3] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FDF8F3] to-transparent z-10" />
        
        <div className="flex gap-5 marquee-reverse">
          {row2.map((place, index) => (
            <div
              key={`row2-${place.id}-${index}`}
              onClick={() => onPlaceClick(place.id)}
              className="flex-shrink-0 w-72 cursor-pointer group"
            >
              <div className="relative h-80 rounded-2xl overflow-hidden">
                <img
                  src={place.images[0]}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-[#F7B801] fill-[#F7B801]" />
                    <span className="text-white font-semibold">{place.rating}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1 group-hover:text-[#FF6B35] transition-colors">
                    {place.name}
                  </h3>
                  <p className="text-white/70 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {place.location.city}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

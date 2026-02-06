import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Heart, ArrowRight, CheckCircle, BarChart3 } from 'lucide-react';
import { getTrendingPlaces, getHiddenGems, getPlacesByCategory } from '@/data/destinations';
import type { Place } from '@/types';
import { usePlaceStore } from '@/store/placeStore';

interface PopularDestinationsProps {
  onPlaceClick: (id: string) => void;
}

const categories = [
  { id: 'trending', label: 'Trending' },
  { id: 'beach', label: 'Beaches' },
  { id: 'mountain', label: 'Mountains' },
  { id: 'hidden', label: 'Hidden Gems' }
];

export function PopularDestinations({ onPlaceClick }: PopularDestinationsProps) {
  const [activeCategory, setActiveCategory] = useState('trending');
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  
  const { savedPlaces, toggleSavePlace, addToComparison, comparisonList } = usePlaceStore();

  const getPlaces = () => {
    switch (activeCategory) {
      case 'trending':
        return getTrendingPlaces(6);
      case 'beach':
        return getPlacesByCategory('beach').slice(0, 6);
      case 'mountain':
        return getPlacesByCategory('mountain').slice(0, 6);
      case 'hidden':
        return getHiddenGems(6);
      default:
        return getTrendingPlaces(6);
    }
  };

  const places = getPlaces();

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-[#FDF8F3]"
    >
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
          >
            <div>
              <span className="inline-block px-4 py-1.5 bg-[#F7B801]/10 text-[#F7B801] text-sm font-medium rounded-full mb-4">
                Popular Destinations
              </span>
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-[#2C3E50]">
                Trending Places This Month
              </h2>
            </div>
            
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#2C3E50] text-white'
                      : 'bg-white text-[#7F8C8D] hover:text-[#2C3E50] border border-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Destinations Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {places.map((place, index) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DestinationCard 
                    place={place}
                    onClick={() => onPlaceClick(place.id)}
                    isSaved={savedPlaces.includes(place.id)}
                    isInComparison={comparisonList.some(p => p.id === place.id)}
                    onToggleSave={() => toggleSavePlace(place.id)}
                    onAddToComparison={() => addToComparison(place)}
                    comparisonCount={comparisonList.length}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12"
          >
            <button 
              onClick={() => onPlaceClick(places[0]?.id)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#2C3E50] text-white font-semibold hover:bg-[#1a252f] transition-colors"
            >
              View All Destinations
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface DestinationCardProps {
  place: Place;
  onClick: () => void;
  isSaved: boolean;
  isInComparison: boolean;
  onToggleSave: () => void;
  onAddToComparison: () => void;
  comparisonCount: number;
}

function DestinationCard({ 
  place, 
  onClick, 
  isSaved, 
  isInComparison, 
  onToggleSave, 
  onAddToComparison,
  comparisonCount
}: DestinationCardProps) {
  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
      {/* Image */}
      <div 
        onClick={onClick}
        className="relative h-64 overflow-hidden cursor-pointer"
      >
        <img
          src={place.images[0]}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {place.isVerified && (
            <span className="flex items-center gap-1 px-3 py-1 bg-[#2ECC71] text-white text-xs font-medium rounded-full">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className={`p-2.5 rounded-full transition-all ${
              isSaved 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Rating */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full">
            <Star className="w-4 h-4 text-[#F7B801] fill-[#F7B801]" />
            <span className="font-semibold text-[#2C3E50]">{place.rating}</span>
            <span className="text-sm text-[#7F8C8D]">({place.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div onClick={onClick} className="cursor-pointer">
          <h3 className="font-heading text-xl font-bold text-[#2C3E50] mb-2 group-hover:text-[#FF6B35] transition-colors">
            {place.name}
          </h3>
          <p className="text-[#7F8C8D] text-sm flex items-center gap-1 mb-4">
            <MapPin className="w-4 h-4" />
            {place.location.city}, {place.location.country}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {place.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="text-xs px-3 py-1 bg-[#FDF8F3] text-[#7F8C8D] rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-[#2C3E50]">${place.avgCostPerDay}</span>
            <span className="text-sm text-[#7F8C8D]">/day</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isInComparison && comparisonCount < 4) {
                onAddToComparison();
              }
            }}
            disabled={isInComparison || comparisonCount >= 4}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              isInComparison 
                ? 'bg-[#2ECC71]/10 text-[#2ECC71]' 
                : comparisonCount >= 4
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {isInComparison ? 'Added' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}

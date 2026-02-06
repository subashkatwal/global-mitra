import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Star, Heart, Share2,
  CheckCircle, Camera, BarChart3, Navigation,
  Sun, Cloud, Users, DollarSign, Shield,
  MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getPlaceById } from '@/data/destinations';
import { usePlaceStore } from '@/store/placeStore';
import { useAuthStore } from '@/store/authStore';

interface PlaceDetailsProps {
  placeId: string;
  onBack: () => void;
  onReportClick: () => void;
}

export function PlaceDetails({ placeId, onBack, onReportClick }: PlaceDetailsProps) {
  const place = getPlaceById(placeId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  
  const { savedPlaces, toggleSavePlace, addToComparison, comparisonList } = usePlaceStore();
  useAuthStore();
  
  const isSaved = savedPlaces.includes(placeId);
  const isInComparison = comparisonList.some(p => p.id === placeId);

  if (!place) {
    return (
      <div className="section-padding pt-32 text-center">
        <h2 className="text-2xl font-bold text-[#2C3E50]">Place not found</h2>
        <button onClick={onBack} className="mt-4 text-[#FF6B35]">Go back</button>
      </div>
    );
  }

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % place.images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + place.images.length) % place.images.length);
  };

  return (
    <div ref={sectionRef} className="min-h-screen bg-[#FDF8F3]">
      {/* Hero Gallery */}
      <div className="relative h-[50vh] md:h-[60vh]">
        <motion.img
          key={activeImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={place.images[activeImageIndex]}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Navigation */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Image Navigation */}
        {place.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {place.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeImageIndex ? 'w-8 bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => toggleSavePlace(place.id)}
            className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
              isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button className="p-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="section-padding -mt-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-8"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {place.isVerified && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-[#2ECC71]/10 text-[#2ECC71] text-sm font-medium rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      Verified by {place.verificationCount} guides
                    </span>
                  )}
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#2C3E50] mb-2">
                  {place.name}
                </h1>
                <p className="text-[#7F8C8D] flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {place.location.city}, {place.location.country}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-3xl font-bold text-[#2C3E50]">
                    {place.rating}
                    <Star className="w-6 h-6 text-[#F7B801] fill-[#F7B801]" />
                  </div>
                  <p className="text-sm text-[#7F8C8D]">{place.reviewCount} reviews</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-[#FDF8F3] rounded-xl">
                <Sun className="w-5 h-5 text-[#F7B801] mb-2" />
                <p className="text-sm text-[#7F8C8D]">Best Season</p>
                <p className="font-semibold text-[#2C3E50]">{place.bestSeason}</p>
              </div>
              <div className="p-4 bg-[#FDF8F3] rounded-xl">
                <DollarSign className="w-5 h-5 text-[#2ECC71] mb-2" />
                <p className="text-sm text-[#7F8C8D]">Avg. Cost/Day</p>
                <p className="font-semibold text-[#2C3E50]">${place.avgCostPerDay}</p>
              </div>
              <div className="p-4 bg-[#FDF8F3] rounded-xl">
                <Shield className="w-5 h-5 text-[#004E89] mb-2" />
                <p className="text-sm text-[#7F8C8D]">Safety Score</p>
                <p className="font-semibold text-[#2C3E50]">{place.safetyScore}/10</p>
              </div>
              <div className="p-4 bg-[#FDF8F3] rounded-xl">
                <Users className="w-5 h-5 text-[#FF6B35] mb-2" />
                <p className="text-sm text-[#7F8C8D]">Crowd Level</p>
                <p className="font-semibold text-[#2C3E50] capitalize">{place.crowdLevel}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-[#2C3E50] mb-2">About</h3>
              <p className="text-[#7F8C8D] leading-relaxed">
                {showFullDescription ? place.description : `${place.description.slice(0, 150)}...`}
              </p>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-[#FF6B35] text-sm font-medium mt-2 hover:underline"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-[#7F8C8D] text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (!isInComparison && comparisonList.length < 4) {
                    addToComparison(place);
                  }
                }}
                disabled={isInComparison || comparisonList.length >= 4}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  isInComparison
                    ? 'bg-[#2ECC71]/10 text-[#2ECC71]'
                    : comparisonList.length >= 4
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                {isInComparison ? 'Added to Compare' : 'Compare'}
              </button>
              
              <button
                onClick={onReportClick}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-[#2C3E50] font-medium hover:bg-gray-200 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Submit Report
              </button>
              
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2C3E50] text-white font-medium hover:bg-[#1a252f] transition-colors">
                <Navigation className="w-5 h-5" />
                Get Directions
              </button>
            </div>
          </motion.div>

          {/* Weather & Tips */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Weather Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h3 className="font-semibold text-[#2C3E50] mb-4 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-[#004E89]" />
                Current Weather
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F7B801] to-[#FF6B35] flex items-center justify-center">
                  <Sun className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#2C3E50]">{place.weather.temp}°C</p>
                  <p className="text-[#7F8C8D]">{place.weather.condition}</p>
                </div>
              </div>
            </motion.div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h3 className="font-semibold text-[#2C3E50] mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#FF6B35]" />
                Visitor Tips
              </h3>
              <ul className="space-y-2 text-sm text-[#7F8C8D]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                  Best time to visit is early morning to avoid crowds
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                  Bring comfortable walking shoes
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                  Don&apos;t forget your camera for amazing photos
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

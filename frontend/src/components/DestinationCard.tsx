
import { MapPin, Star, Clock, DollarSign, Plus, CheckCircle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useComparisonStore } from '../stores/comparisonStore';

interface Destination {
  id: string;
  name: string;
  region: string;
  image: string;
  rating: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  duration: string;
  costPerDay: number;
  tagline?: string;
}

interface DestinationCardProps {
  destination: Destination;
  showCompare?: boolean;
}

export function DestinationCard({ destination, showCompare = true }: DestinationCardProps) {
  const { isSelected, toggleComparison, canAddMore } = useComparisonStore();
  const selected = isSelected(destination.id);
  const canAdd = canAddMore() || selected;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={destination.image} 
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Compare Button - Top Right */}
        {showCompare && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!selected && !canAddMore()) {
                alert('You can compare up to 5 destinations at once');
                return;
              }
              toggleComparison(destination);
            }}
            className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-lg ${
              selected
                ? 'bg-[#3CA37A] text-white'
                : canAdd
                ? 'bg-white/90 text-[#1A3D2B] hover:bg-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {selected ? (
              <><CheckCircle className="w-3.5 h-3.5" /> Added</>
            ) : (
              <><Plus className="w-3.5 h-3.5" /> Compare</>
            )}
          </button>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg leading-tight mb-1">{destination.name}</h3>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {destination.region}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {destination.tagline && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{destination.tagline}</p>
        )}
        
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-amber-400" />
            <span className="font-bold text-gray-700">{destination.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{destination.duration}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold text-[#2D8F6A]">${destination.costPerDay}/day</span>
          </div>
        </div>

        <Link
          to={`/destinations/${destination.id}`}
          className="block w-full py-2.5 text-center rounded-xl bg-[#EBF7F1] text-[#2D8F6A] font-semibold text-sm hover:bg-[#D0F0E4] transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Thermometer, DollarSign, Shield, Users, CheckCircle, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { usePlaceStore } from '@/store/placeStore';

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceClick: (id: string) => void;
}

export function ComparisonDrawer({ isOpen, onClose, onPlaceClick }: ComparisonDrawerProps) {
  const { 
    comparisonList, 
    removeFromComparison, 
    clearComparison,
    filteredPlaces,
    addToComparison 
  } = usePlaceStore();

  const metrics = [
    { key: 'rating', label: 'Rating', icon: Star, format: (v: number) => `${v}★` },
    { key: 'bestSeason', label: 'Best Season', icon: Thermometer, format: (v: string) => v },
    { key: 'avgCostPerDay', label: 'Avg. Cost/Day', icon: DollarSign, format: (v: number) => `$${v}` },
    { key: 'safetyScore', label: 'Safety Score', icon: Shield, format: (v: number) => `${v}/10` },
    { key: 'crowdLevel', label: 'Crowd Level', icon: Users, format: (v: string) => v },
  ];

  // Get places not in comparison for adding
  const availablePlaces = filteredPlaces.filter(
    p => !comparisonList.find(c => c.id === p.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-5xl bg-[#FDF8F3] shadow-2xl z-50 overflow-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[#D8F3DC] p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-[#2C3E50]">Compare Destinations</h2>
                <p className="text-[#7F8C8D] text-sm">
                  {comparisonList.length} {comparisonList.length === 1 ? 'place' : 'places'} selected
                  {comparisonList.length < 2 && ' (add at least 2 to compare)'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {comparisonList.length > 0 && (
                  <button
                    onClick={clearComparison}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6 text-[#2C3E50]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {comparisonList.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-[#D8F3DC] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-10 h-10 text-[#74A58A]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">No destinations selected</h3>
                  <p className="text-[#7F8C8D] mb-6">Add destinations to compare them side by side</p>
                  
                  {/* Show available places to add */}
                  {availablePlaces.length > 0 && (
                    <div className="max-w-md mx-auto">
                      <p className="text-sm font-medium text-[#2C3E50] mb-3">Quick add:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {availablePlaces.slice(0, 5).map(place => (
                          <button
                            key={place.id}
                            onClick={() => addToComparison(place)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#D8F3DC] rounded-xl hover:bg-[#D8F3DC] transition-colors"
                          >
                            <img src={place.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-sm font-medium text-[#2C3E50]">{place.name}</span>
                            <Plus className="w-4 h-4 text-[#74A58A]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="mt-6 px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold hover:bg-[#e55a2b] transition-colors"
                  >
                    Explore Destinations
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Add more section */}
                  {availablePlaces.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[#D8F3DC] p-4">
                      <p className="text-sm font-medium text-[#2C3E50] mb-3">Add more destinations:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {availablePlaces.map(place => (
                          <button
                            key={place.id}
                            onClick={() => addToComparison(place)}
                            className="flex items-center gap-2 px-3 py-2 bg-[#FDF8F3] border border-[#D8F3DC] rounded-xl hover:bg-[#D8F3DC] transition-colors flex-shrink-0"
                          >
                            <img src={place.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-sm font-medium text-[#2C3E50]">{place.name}</span>
                            <Plus className="w-4 h-4 text-[#74A58A]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comparison Table */}
                  <div className="bg-white rounded-2xl border border-[#D8F3DC] overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      {/* Header Row */}
                      <thead>
                        <tr className="bg-[#2C3E50] text-white">
                          <th className="text-left p-4 font-semibold w-48">Feature</th>
                          {comparisonList.map((place, idx) => (
                            <th key={place.id} className="p-4 min-w-[200px] border-l border-white/20">
                              <div className="relative">
                                <button
                                  onClick={() => removeFromComparison(place.id)}
                                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 z-10"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <div 
                                  className="cursor-pointer"
                                  onClick={() => {
                                    onPlaceClick(place.id);
                                    onClose();
                                  }}
                                >
                                  <div className="relative">
                                    <img
                                      src={place.images[0]}
                                      alt={place.name}
                                      className="w-full h-32 object-cover rounded-xl mb-3"
                                    />
                                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#FF6B35] text-white text-xs font-bold flex items-center justify-center">
                                      {idx + 1}
                                    </div>
                                  </div>
                                  <h4 className="font-bold text-left">{place.name}</h4>
                                  <p className="text-sm text-white/70 text-left flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {place.location.city}
                                  </p>
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      
                      {/* Metrics Rows */}
                      <tbody>
                        {metrics.map((metric, rowIdx) => {
                          const Icon = metric.icon;
                          return (
                            <tr key={metric.key} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FDF8F3]/50'}>
                              <td className="p-4 border-r border-[#D8F3DC]">
                                <div className="flex items-center gap-2 text-[#7F8C8D]">
                                  <div className="w-8 h-8 rounded-lg bg-[#D8F3DC] flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-[#74A58A]" />
                                  </div>
                                  {metric.label}
                                </div>
                              </td>
                              {comparisonList.map((place) => (
                                <td key={place.id} className="p-4 border-l border-[#D8F3DC] text-center">
                                  <span className="font-semibold text-[#2C3E50]">
                                    {metric.format((place as unknown as Record<string, string | number>)[metric.key] as never)}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                        
                        {/* Verification Row */}
                        <tr className="border-t border-[#D8F3DC]">
                          <td className="p-4 border-r border-[#D8F3DC]">
                            <div className="flex items-center gap-2 text-[#7F8C8D]">
                              <div className="w-8 h-8 rounded-lg bg-[#D8F3DC] flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-[#74A58A]" />
                              </div>
                              Verified
                            </div>
                          </td>
                          {comparisonList.map((place) => (
                            <td key={place.id} className="p-4 border-l border-[#D8F3DC] text-center">
                              {place.isVerified ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#2ECC71]/10 text-[#2ECC71] text-sm rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  Yes
                                </span>
                              ) : (
                                <span className="text-[#7F8C8D]">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Action Row */}
                        <tr className="border-t border-[#D8F3DC]">
                          <td className="p-4 border-r border-[#D8F3DC]"></td>
                          {comparisonList.map((place) => (
                            <td key={place.id} className="p-4 border-l border-[#D8F3DC]">
                              <button
                                onClick={() => {
                                  onPlaceClick(place.id);
                                  onClose();
                                }}
                                className="w-full py-2.5 rounded-xl bg-[#FF6B35] text-white text-sm font-semibold hover:bg-[#e55a2b] transition-colors flex items-center justify-center gap-1"
                              >
                                View Details
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Min 2 warning */}
                  {comparisonList.length < 2 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-amber-700 text-sm">
                        Add at least one more destination to compare
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
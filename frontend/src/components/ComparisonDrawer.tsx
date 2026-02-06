import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Thermometer, DollarSign, Shield, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { usePlaceStore } from '@/store/placeStore';

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceClick: (id: string) => void;
}

export function ComparisonDrawer({ isOpen, onClose, onPlaceClick }: ComparisonDrawerProps) {
  const { comparisonList, removeFromComparison, clearComparison } = usePlaceStore();

  const metrics = [
    { key: 'rating', label: 'Rating', icon: Star, format: (v: number) => `${v}★` },
    { key: 'bestSeason', label: 'Best Season', icon: Thermometer, format: (v: string) => v },
    { key: 'avgCostPerDay', label: 'Avg. Cost/Day', icon: DollarSign, format: (v: number) => `$${v}` },
    { key: 'safetyScore', label: 'Safety Score', icon: Shield, format: (v: number) => `${v}/10` },
    { key: 'crowdLevel', label: 'Crowd Level', icon: Users, format: (v: string) => v },
  ];

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
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 overflow-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#2C3E50]">Compare Destinations</h2>
                <p className="text-[#7F8C8D] text-sm">
                  {comparisonList.length} of 4 places selected
                </p>
              </div>
              <div className="flex items-center gap-3">
                {comparisonList.length > 0 && (
                  <button
                    onClick={clearComparison}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {comparisonList.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">No destinations selected</h3>
                  <p className="text-[#7F8C8D] mb-6">Add up to 4 destinations to compare</p>
                  <button
                    onClick={onClose}
                    className="btn-primary"
                  >
                    Explore Destinations
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    {/* Header Row */}
                    <thead>
                      <tr>
                        <th className="text-left p-4 font-semibold text-[#2C3E50]">Feature</th>
                        {comparisonList.map((place) => (
                          <th key={place.id} className="p-4 min-w-[200px]">
                            <div className="relative">
                              <button
                                onClick={() => removeFromComparison(place.id)}
                                className="absolute -top-2 -right-2 p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div 
                                className="cursor-pointer"
                                onClick={() => {
                                  onPlaceClick(place.id);
                                  onClose();
                                }}
                              >
                                <img
                                  src={place.images[0]}
                                  alt={place.name}
                                  className="w-full h-32 object-cover rounded-xl mb-3"
                                />
                                <h4 className="font-bold text-[#2C3E50] text-left">{place.name}</h4>
                                <p className="text-sm text-[#7F8C8D] text-left flex items-center gap-1">
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
                      {metrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                          <tr key={metric.key} className="border-t border-gray-100">
                            <td className="p-4">
                              <div className="flex items-center gap-2 text-[#7F8C8D]">
                                <Icon className="w-4 h-4" />
                                {metric.label}
                              </div>
                            </td>
                            {comparisonList.map((place) => (
                              <td key={place.id} className="p-4 text-center">
                                <span className="font-semibold text-[#2C3E50]">
                                  {metric.format((place as unknown as Record<string, string | number>)[metric.key] as never)}
                                </span>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      
                      {/* Verification Row */}
                      <tr className="border-t border-gray-100">
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-[#7F8C8D]">
                            <CheckCircle className="w-4 h-4" />
                            Verified
                          </div>
                        </td>
                        {comparisonList.map((place) => (
                          <td key={place.id} className="p-4 text-center">
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
                      <tr className="border-t border-gray-100">
                        <td className="p-4"></td>
                        {comparisonList.map((place) => (
                          <td key={place.id} className="p-4">
                            <button
                              onClick={() => {
                                onPlaceClick(place.id);
                                onClose();
                              }}
                              className="w-full py-2 rounded-xl bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e55a2b] transition-colors flex items-center justify-center gap-1"
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
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

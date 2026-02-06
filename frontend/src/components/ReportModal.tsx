import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, AlertCircle, Lightbulb, AlertTriangle, Sparkles,
  MapPin, Upload, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useReportStore } from '@/store/reportStore';
import type { ReportType, CrowdLevel } from '@/types';
import { getPlaceById } from '@/data/destinations';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string | null;
}

const reportTypes: { id: ReportType; label: string; icon: any; color: string }[] = [
  { id: 'photo_update', label: 'Photo Update', icon: Camera, color: '#FF6B35' },
  { id: 'status_alert', label: 'Status Alert', icon: AlertCircle, color: '#F7B801' },
  { id: 'tip_share', label: 'Tip Share', icon: Lightbulb, color: '#2ECC71' },
  { id: 'emergency_warning', label: 'Emergency', icon: AlertTriangle, color: '#E74C3C' },
  { id: 'new_discovery', label: 'New Discovery', icon: Sparkles, color: '#004E89' },
];

const crowdLevels: { value: CrowdLevel; label: string }[] = [
  { value: 'empty', label: 'Empty' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'packed', label: 'Packed' },
];

export function ReportModal({ isOpen, onClose, placeId }: ReportModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>('moderate');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { user } = useAuthStore();
  const { submitReport } = useReportStore();
  const place = placeId ? getPlaceById(placeId) : null;

  const handleSubmit = async () => {
    if (!selectedType || !placeId || !user) return;

    setIsSubmitting(true);

    await submitReport({
      placeId,
      userId: user.id,
      user: user,
      type: selectedType,
      title,
      description,
      images,
      coordinates: place?.location.coordinates || { lat: 0, lng: 0 },
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      crowdLevel,
    });

    setIsSubmitting(false);
    setIsSuccess(true);

    setTimeout(() => {
      resetForm();
      onClose();
    }, 2000);
  };

  const resetForm = () => {
    setStep(1);
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setCrowdLevel('moderate');
    setTags('');
    setImages([]);
    setIsSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!user) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-3xl p-8 text-center max-w-md">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-[#FF6B35]" />
                </div>
                <h3 className="text-xl font-bold text-[#2C3E50] mb-2">Sign in Required</h3>
                <p className="text-[#7F8C8D] mb-6">Please sign in to submit a report</p>
                <button onClick={handleClose} className="btn-primary">
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="font-heading text-xl font-bold text-[#2C3E50]">
                    {isSuccess ? 'Report Submitted!' : 'Submit Report'}
                  </h2>
                  {place && (
                    <p className="text-sm text-[#7F8C8D] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {place.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-[#2ECC71]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-[#2ECC71]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#2C3E50] mb-2">Thank You!</h3>
                    <p className="text-[#7F8C8D]">
                      Your report has been submitted for verification. You&apos;ll earn +10 points when approved!
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* Step 1: Report Type */}
                    {step === 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <p className="text-[#7F8C8D] mb-4">What type of report are you submitting?</p>
                        <div className="grid grid-cols-2 gap-3">
                          {reportTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.id}
                                onClick={() => {
                                  setSelectedType(type.id);
                                  setStep(2);
                                }}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                  selectedType === type.id
                                    ? 'border-[#FF6B35] bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <Icon 
                                  className="w-6 h-6 mb-2" 
                                  style={{ color: type.color }}
                                />
                                <span className="font-medium text-[#2C3E50] text-sm">{type.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && selectedType && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <button
                          onClick={() => setStep(1)}
                          className="text-sm text-[#FF6B35] mb-4"
                        >
                          ← Back to report type
                        </button>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., New sunset viewpoint discovered"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                            Description
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Share details about your experience..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:outline-none transition-colors resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                            Current Crowd Level
                          </label>
                          <div className="flex gap-2">
                            {crowdLevels.map((level) => (
                              <button
                                key={level.value}
                                onClick={() => setCrowdLevel(level.value)}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                                  crowdLevel === level.value
                                    ? 'bg-[#FF6B35] text-white'
                                    : 'bg-gray-100 text-[#7F8C8D] hover:bg-gray-200'
                                }`}
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                            Tags (comma separated)
                          </label>
                          <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., sunset, photography, hidden-gem"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:outline-none transition-colors"
                          />
                        </div>

                        <button
                          onClick={() => setStep(3)}
                          disabled={!title || !description}
                          className="w-full py-3 rounded-xl gradient-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Continue
                        </button>
                      </motion.div>
                    )}

                    {/* Step 3: Photos & Submit */}
                    {step === 3 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <button
                          onClick={() => setStep(2)}
                          className="text-sm text-[#FF6B35] mb-4"
                        >
                          ← Back to details
                        </button>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                            Add Photos (optional)
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#FF6B35] transition-colors cursor-pointer">
                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-[#7F8C8D] text-sm">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              PNG, JPG up to 10MB
                            </p>
                          </div>
                        </div>

                        <div className="bg-[#FDF8F3] rounded-xl p-4">
                          <h4 className="font-medium text-[#2C3E50] mb-2">Report Summary</h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-[#7F8C8D]">
                              <span className="text-[#2C3E50]">Type:</span>{' '}
                              {reportTypes.find(t => t.id === selectedType)?.label}
                            </p>
                            <p className="text-[#7F8C8D]">
                              <span className="text-[#2C3E50]">Title:</span> {title}
                            </p>
                            <p className="text-[#7F8C8D]">
                              <span className="text-[#2C3E50]">Crowd:</span>{' '}
                              {crowdLevel}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="w-full py-3 rounded-xl gradient-primary text-white font-semibold disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            'Submit for Verification'
                          )}
                        </button>

                        <p className="text-center text-xs text-[#7F8C8D]">
                          Your report will be reviewed by our community guides
                        </p>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

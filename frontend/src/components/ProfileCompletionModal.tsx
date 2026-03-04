import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, CheckCircle, AlertCircle, Loader2, ArrowRight, User, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiFetchFormData } from '@/services/api';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function parseError(err: any): string {
  const data = err?.response?.data || err?.data || err;
  if (!data) return 'An error occurred. Please try again.';
  if (typeof data === 'object' && !Array.isArray(data)) {
    if (data.error)   return String(data.error);
    if (data.detail)  return String(data.detail);
    if (data.message) return String(data.message);
    const fieldErrors = Object.entries(data)
      .filter(([key]) => key !== 'success')
      .flatMap(([, msgs]) => (Array.isArray(msgs) ? msgs : [String(msgs)]));
    if (fieldErrors.length > 0) return fieldErrors.join(' ');
  }
  return err?.message || 'An error occurred. Please try again.';
}

export default function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const user    = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isGuide = user?.role === 'GUIDE';

  const [photoFile,        setPhotoFile]        = useState<File | null>(null);
  const [photoPreview,     setPhotoPreview]     = useState<string | null>(null);
  const [phoneNumber,      setPhoneNumber]      = useState('');
  const [licenseNumber,    setLicenseNumber]    = useState('');
  const [licenseIssuedBy,  setLicenseIssuedBy]  = useState('Nepal Tourism Board');
  const [bio,              setBio]              = useState('');
  const [isLoading,        setIsLoading]        = useState(false);
  const [error,            setError]            = useState('');
  const [success,          setSuccess]          = useState('');
  const [submitted,        setSubmitted]        = useState(false);
  const [showExitWarning,  setShowExitWarning]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhoneNumber('');
      setLicenseNumber('');
      setLicenseIssuedBy('Nepal Tourism Board');
      setBio('');
      setError('');
      setSuccess('');
      setSubmitted(false);
      setShowExitWarning(false);
    }
  }, [isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCloseAttempt = () => {
    if (isGuide) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isGuide && !licenseNumber.trim()) {
      setError('License number is required.');
      return;
    }

    setIsLoading(true);

    try {
      if (isGuide) {
        const formData = new FormData();
        formData.append('licenseNumber',   licenseNumber.trim());
        formData.append('licenseIssuedBy', licenseIssuedBy.trim() || 'Nepal Tourism Board');
        if (bio.trim())         formData.append('bio',         bio.trim());
        if (phoneNumber.trim()) formData.append('phoneNumber', phoneNumber.trim());
        if (photoFile)          formData.append('photo',       photoFile);

        const res  = await apiFetchFormData('/profile/complete/guide', formData, { method: 'PATCH' });
        const data = await res.json() as any;
        if (!res.ok) throw data;

        const updated = data.user ?? data.data;
        if (updated) setUser(updated);
        setSubmitted(true);

      } else {
        if (!phoneNumber.trim() && !photoFile) { onClose(); return; }

        const formData = new FormData();
        if (phoneNumber.trim()) formData.append('phoneNumber', phoneNumber.trim());
        if (photoFile)          formData.append('photo',       photoFile);

        const res  = await apiFetchFormData('/profile/complete', formData, { method: 'PATCH' });
        const data = await res.json() as any;
        if (!res.ok) throw data;

        const updated = data.user ?? data.data;
        if (updated) setUser(updated);
        setSuccess('Profile updated successfully!');
        setTimeout(onClose, 1200);
      }
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = `
    w-full py-2.5 px-3.5 rounded-xl
    bg-white border border-gray-200
    shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]
    focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 focus:shadow-none
    transition-all duration-200
    text-gray-900 placeholder-gray-400
    text-sm outline-none
  `;

  // ── Exit warning for guides ─────────────────────────────────────────────────
  if (showExitWarning) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-7 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Skip profile setup?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              You can come back later, but your guide account won't be sent for admin review until you complete this step.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Continue setup
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors text-sm"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Guide success screen ────────────────────────────────────────────────────
  if (submitted && isGuide) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#1B4332] mb-2">Profile Submitted!</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Your guide profile is{' '}
              <span className="font-semibold text-[#2D6A4F]">pending admin verification</span>.
              You'll receive an email once your account is approved.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#2D6A4F] hover:bg-[#1f4e38] text-white font-medium rounded-xl transition-colors text-sm"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={handleCloseAttempt}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── X button — everyone gets it, guides get warning ── */}
            <button
              onClick={handleCloseAttempt}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* ── Header ── */}
            <div className="pt-7 pb-4 px-7 text-center border-b border-gray-100">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#95D5B2] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GM</span>
                </div>
                <h1 className="text-lg font-bold text-[#1B4332]">Global Mitra</h1>
              </div>
              <h2 className="text-xl font-bold text-[#1B4332] mb-1">Complete Your Profile</h2>
              <p className="text-xs text-gray-500">
                {isGuide
                  ? 'Required before your account can be reviewed by admin'
                  : 'Add a few details to personalise your experience'}
              </p>
            </div>

            <div className="px-7 py-5">
              {/* ── Error banner ── */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {!error && success && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Photo Upload — centered ── */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="relative">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-full border-2 border-dashed border-[#2D6A4F]/40 overflow-hidden cursor-pointer bg-gray-50 flex items-center justify-center hover:border-[#2D6A4F]/70 hover:bg-gray-100 transition-all"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center shadow-lg hover:bg-[#1f4e38] transition-colors border-2 border-white"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {photoFile ? photoFile.name : 'Click to upload photo (optional)'}
                  </p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </div>

                {/* ── Phone Number ── */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9800000000"
                    className={inputStyle}
                  />
                  <p className="mt-1 text-xs text-gray-400">10 digits, no spaces</p>
                </div>

                {/* ── Guide-only fields ── */}
                {isGuide && (
                  <div className="pt-3 border-t border-gray-100 space-y-4">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider">
                        Guide Information
                      </p>
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        Required for review
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        License Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. NTB-2024-001"
                        className={inputStyle}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        License Issued By
                      </label>
                      <input
                        type="text"
                        value={licenseIssuedBy}
                        onChange={(e) => setLicenseIssuedBy(e.target.value)}
                        placeholder="e.g. Nepal Tourism Board"
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Bio <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Brief intro about your expertise and areas you guide..."
                        rows={2}
                        className={`${inputStyle} resize-none`}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#2D6A4F] hover:bg-[#1f4e38] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm mt-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isGuide ? 'Submit for Review' : 'Complete Profile'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {!isGuide && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Loader2, ChevronDown
} from 'lucide-react';

import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onGuideProfileNeeded: () => void;
}

type SignupStep = 'form' | 'verify-otp';

export default function SignupModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  onGuideProfileNeeded,
}: SignupModalProps) {
  const [step,         setStep]         = useState<SignupStep>('form');
  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [role,         setRole]         = useState<'TOURIST' | 'GUIDE'>('TOURIST');
  const [showPassword, setShowPassword] = useState(false);
  const [otp,          setOtp]          = useState(['', '', '', '', '', '']);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [userId,       setUserId]       = useState<string | null>(null);

  const login                  = useAuthStore((state) => state.login);
  const setPendingGuideTokens  = useAuthStore((state) => state.setPendingGuideTokens);
  const setUser                = useAuthStore((state) => state.setUser);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('TOURIST');
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess('');
      setRefreshToken('');
      setUserId(null);
    }
  }, [isOpen]);

  // ── Step 1: Register ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({ fullName, email, password, role });

      if (response.success) {
        if (response.userId) {
          setUserId(response.userId);
        } else {
          console.warn('Backend did not return userId in response');
        }

        if (response.tokens?.refresh) {
          setRefreshToken(response.tokens.refresh);
        }

        setError('');
        setSuccess('Registration successful! Please check your email for the OTP.');
        setStep('verify-otp');
      } else {
        setSuccess('');
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setSuccess('');
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        'An error occurred. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const otpString = otp.join('');

    if (!userId) {
      setError('User ID missing. Please try registering again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.verifyOtp(userId, otpString, refreshToken);

      if (response.success) {
        setError('');

        if (role === 'GUIDE') {
          // Store tokens without marking as fully authenticated —
          // guide still needs admin approval after profile completion.
          if (response.tokens) {
            setPendingGuideTokens(response.tokens);
          }
          // Store user so ProfileCompletionModal knows the role
          if (response.user) {
            setUser(response.user);
          }

          setSuccess('Email verified! Please complete your guide profile.');
          setTimeout(() => {
            onClose();
            onGuideProfileNeeded();
          }, 1200);

        } else {
          // TOURIST — log in immediately
          if (response.user && response.tokens) {
            login(response.user, response.tokens);
          }

          setSuccess(response.message || 'Account verified! You can now log in.');
          setTimeout(() => {
            onClose();
            onSwitchToLogin();
          }, 1500);
        }

      } else {
        setSuccess('');
        setError(response.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setSuccess('');
      const errorMsg =
        err.response?.data?.otp?.[0] ||
        err.response?.data?.userId?.[0] ||
        err.response?.data?.detail ||
        err.message ||
        'An error occurred. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await authApi.register({ fullName, email, password, role });

      if (response.tokens?.refresh) setRefreshToken(response.tokens.refresh);
      if (response.userId)          setUserId(response.userId);

      setError('');
      setSuccess('New code sent to your email!');
    } catch (err: any) {
      setSuccess('');
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP input helpers ───────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6 && /^\d$/.test(pastedData[i])) newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => !d);
    otpRefs.current[nextEmpty !== -1 ? nextEmpty : 5]?.focus();
  };

  if (!isOpen) return null;

  const inputStyle = `
    w-full py-3 sm:py-3.5 px-4 rounded-xl
    bg-white border border-gray-300
    shadow-[inset_0_1px_4px_rgba(0,0,0,0.07)]
    focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 focus:shadow-none
    transition-all duration-200
    text-gray-900 placeholder-gray-500
    text-sm sm:text-base
    outline-none
  `;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>

            {/* ── Header ── */}
            <div className="pt-8 sm:pt-10 pb-4 sm:pb-6 px-6 sm:px-10 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#95D5B2] flex items-center justify-center">
                  <span className="text-white font-bold text-lg sm:text-xl">GM</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1B4332]">Global Mitra</h1>
              </div>

              {step === 'form' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mb-1 sm:mb-2">
                    Create your account
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">Join the GlobalMitra community</p>
                </>
              )}

              {step === 'verify-otp' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mb-1 sm:mb-2">
                    Verify your account
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    We sent a code to{' '}
                    <span className="font-medium text-[#2D6A4F]">{email}</span>
                  </p>
                </>
              )}
            </div>

            <div className="px-6 sm:px-10 pb-8 sm:pb-10">
              {error && (
                <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {!error && success && (
                <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* ── Step: Registration Form ── */}
              {step === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className={`${inputStyle} pr-11`}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      I am a...
                    </label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'TOURIST' | 'GUIDE')}
                        className={`${inputStyle} appearance-none pr-10 cursor-pointer`}
                        required
                      >
                        <option value="TOURIST">Tourist — I'm exploring</option>
                        <option value="GUIDE">Guide — I'm a local expert</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 sm:py-3.5 bg-[#2D6A4F] hover:bg-[#1f4e38] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ── Step: OTP Verification ── */}
              {step === 'verify-otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      Enter 6-digit code
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          className="w-10 h-10 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 border-gray-300 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 outline-none transition-all"
                          style={{ borderColor: digit ? '#2D6A4F' : '#D1D5DB' }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.some((d) => !d)}
                    className="w-full py-3 sm:py-3.5 bg-[#2D6A4F] hover:bg-[#1f4e38] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Verify Account
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="text-center mt-3 sm:mt-4">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-sm text-[#2D6A4F] hover:underline font-medium disabled:opacity-60"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}

              {step === 'form' && (
                <div className="mt-5 sm:mt-6 pt-4 border-t text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-[#2D6A4F] font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
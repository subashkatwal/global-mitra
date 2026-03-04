import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

type LoginMode = 'login' | 'forgot' | 'verify-otp' | 'reset-password';

// Parses any backend error shape into a human-readable string
// Handles: {"error": "Your guide account is pending..."}   ← NEW
// Handles: {"email": ["user with this email already exists."]}
// Handles: {"detail": "..."} and {"message": "..."}
function parseError(err: any): string {
  const data = err?.response?.data || err?.data || err;
  if (!data) return 'An error occurred. Please try again.';

  if (typeof data === 'object' && !Array.isArray(data)) {
    // Check top-level message keys first — order matters
    if (data.error)   return String(data.error);
    if (data.detail)  return String(data.detail);
    if (data.message) return String(data.message);

    // Field-level validation errors like {"email": ["user with this email already exists."]}
    const fieldErrors = Object.entries(data)
      .filter(([key]) => !['success'].includes(key))
      .flatMap(([, msgs]) => (Array.isArray(msgs) ? msgs : [String(msgs)]));
    if (fieldErrors.length > 0) return fieldErrors.join(' ');
  }

  return err?.message || 'An error occurred. Please try again.';
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const login = useAuthStore((state) => state.login);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp(['', '', '', '', '', '']);
      setResetToken(null);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      // Login response is flat: { success, message, user, tokens }
      const res = response as any;
if (res.success) {
  const user = res.user ?? res.data?.user;
  const tokens = res.tokens ?? res.data?.tokens;

  if (user && tokens) {
    login(user, tokens);

    // Try common full name formats
    const fullName =
      user.full_name ||
      `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() ||
      user.name ||
      'User';

    setError('');
    setSuccess(`Welcome back, ${fullName}!`);
  } else {
    setSuccess('Welcome back!');
  }

  setTimeout(onClose, 1200);
} else {
        setSuccess('');
        // Use parseError so { error: "..." } shape is caught properly
        setError(parseError(res));
      }
    } catch (err: any) {
      setSuccess('');
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      const res = response as any;
      const detail: string = res?.detail || res?.message || '';

      if (detail.toLowerCase().includes('otp') || detail.toLowerCase().includes('sent')) {
        setError('');
        setSuccess('Reset code sent to your email! Check your inbox.');
        setMode('verify-otp');
      } else {
        setSuccess('');
        setError(detail || 'Failed to send reset code');
      }
    } catch (err: any) {
      setSuccess('');
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const otpString = otp.join('');

    try {
      const response = await authApi.verifyResetOtp(email, otpString);
      const res = response as any;
      const detail: string = res?.detail || res?.message || '';

      // Accept any positive signal: "otp verified", "verified", "success", or a resetToken present
      if (
        detail.toLowerCase().includes('verified') ||
        detail.toLowerCase().includes('success') ||
        res?.resetToken
      ) {
        if (res.resetToken) {
          setResetToken(res.resetToken);
        } else {
          console.warn('No resetToken returned from backend');
        }
        setError('');
        setSuccess('OTP verified! Set your new password below.');
        setMode('reset-password');
      } else {
        setSuccess('');
        setError(detail || 'Invalid or expired OTP');
      }
    } catch (err: any) {
      setSuccess('');
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!resetToken) {
      setError('Reset token missing. Please request a new reset code.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword(email, resetToken, newPassword,confirmPassword);
      const res = response as any;
      const detail: string = res?.detail || res?.message || '';

      if (detail.toLowerCase().includes('success') || detail.toLowerCase().includes('reset')) {
        setError('');
        setSuccess('Password reset successful! You can now sign in.');
        setTimeout(() => {
          setMode('login');
          setSuccess('');
          setResetToken(null);
          setNewPassword('');
          setConfirmPassword('');
          setOtp(['', '', '', '', '', '']);
        }, 1800);
      } else {
        setSuccess('');
        setError(detail || 'Failed to reset password');
      }
    } catch (err: any) {
      setSuccess('');
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
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
      if (i < 6 && /^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }

    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1) {
      otpRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpRefs.current[5]?.focus();
    }
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

            {/* Header */}
            <div className="pt-8 sm:pt-10 pb-4 sm:pb-6 px-6 sm:px-10 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#95D5B2] flex items-center justify-center">
                  <span className="text-white font-bold text-lg sm:text-xl">GM</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1B4332]">Global Mitra</h1>
              </div>

              {mode === 'login' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mb-1 sm:mb-2">Welcome Back</h2>
                  <p className="text-sm sm:text-base text-gray-600">Sign in to your account</p>
                </>
              )}
              {mode === 'forgot' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mb-1 sm:mb-2">Reset Password</h2>
                  <p className="text-sm sm:text-base text-gray-600">We'll email you a verification code</p>
                </>
              )}
              {mode === 'verify-otp' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mb-1 sm:mb-2">Verify OTP</h2>
                  <p className="text-sm sm:text-base text-gray-600">We sent a code to <span className="font-medium text-[#2D6A4F]">{email}</span></p>
                </>
              )}
              {mode === 'reset-password' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mb-1 sm:mb-2">Set New Password</h2>
                  <p className="text-sm sm:text-base text-gray-600">Enter and confirm your new password</p>
                </>
              )}
            </div>

            <div className="px-6 sm:px-10 pb-8 sm:pb-10">
              {/* Error always red, success always green — never shown together */}
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

              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className={`${inputStyle} pr-11`}
                        required
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

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      className="text-sm text-[#2D6A4F] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
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
                        Sign In
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {mode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className={inputStyle}
                      required
                    />
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
                        Send Reset Code
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="text-center mt-3 sm:mt-4">
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                      className="text-sm text-[#2D6A4F] hover:underline font-medium"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              )}

              {mode === 'verify-otp' && (
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
                        Verify OTP
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="text-center mt-3 sm:mt-4">
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                      className="text-sm text-[#2D6A4F] hover:underline font-medium"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              )}

              {mode === 'reset-password' && (
                <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={`${inputStyle} pr-11`}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={inputStyle}
                      required
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-600">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || newPassword !== confirmPassword || !newPassword}
                    className="w-full py-3 sm:py-3.5 bg-[#2D6A4F] hover:bg-[#1f4e38] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {mode === 'login' && (
                <div className="mt-5 sm:mt-6 pt-4 border-t text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={onSwitchToSignup}
                    className="text-[#2D6A4F] font-medium hover:underline"
                  >
                    Create one
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
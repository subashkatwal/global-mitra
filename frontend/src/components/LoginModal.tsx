import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// TODO: Backend Integration (Django REST Framework)
// API Endpoint: POST /api/auth/login/
// Swagger Documentation: /api/docs/
// 
// Expected Request Body:
// {
//   "email": string,
//   "password": string
// }
//
// Expected Response (Success 200):
// {
//   "user": {
//     "id": number,
//     "email": string,
//     "full_name": string,
//     "role": "tourist" | "guide",
//     "avatar": string | null,
//     "is_verified": boolean
//   },
//   "tokens": {
//     "access": string (JWT),
//     "refresh": string (JWT)
//   }
// }
//
// Expected Response (Error 401):
// {
//   "detail": "Invalid credentials" | "Account not verified" | "Account suspended"
// }
//
// TODO: Implement JWT refresh token rotation
// API Endpoint: POST /api/auth/refresh/
// Request: { "refresh": string }
// Response: { "access": string }

// TODO: Forgot Password Flow
// API Endpoint: POST /api/auth/password-reset/
// Request: { "email": string }
// Response: { "detail": "Password reset email sent" }
//
// Then user clicks link: /api/auth/password-reset-confirm/{uidb64}/{token}/
// POST: { "new_password": string, "confirm_password": string }

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSignupClick: () => void; // To switch to signup modal
}

type AuthMode = 'login' | 'forgot';

export function LoginModal({ isOpen, onClose, onSuccess, onSignupClick }: LoginModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ email: '', password: '' });
    setError('');
    setSuccess('');
    setErrors({});
    setMode('login');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (mode === 'login' && !formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (mode === 'login') {
        // TODO: Replace with actual Django API integration
        // const response = await authApi.login({
        //   email: formData.email,
        //   password: formData.password
        // });
        
        // TODO: Store tokens securely (httpOnly cookies preferred)
        // Cookies.set('access_token', response.tokens.access, { secure: true, sameSite: 'strict' });
        // Cookies.set('refresh_token', response.tokens.refresh, { secure: true, sameSite: 'strict' });
        
        // TODO: Update global auth state
        // useAuthStore.getState().setUser(response.user);
        // useAuthStore.getState().setAuthenticated(true);
        
        // TODO: Setup axios interceptors for automatic token refresh
        // setupAuthInterceptors(response.tokens.access);

        const success = await login(formData.email, formData.password);
        if (success) {
          setSuccess('Welcome back!');
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1000);
        } else {
          setError('Invalid email or password. Try demo@globalmitra.com / password');
        }
      } else {
        // Forgot password mode
        // TODO: Integrate with Django password reset endpoint
        // await authApi.requestPasswordReset(formData.email);
        
        setSuccess('Password reset link sent! Check your email.');
        setTimeout(() => {
          setMode('login');
          resetForm();
        }, 2000);
      }
    } catch (err: any) {
      // TODO: Handle specific Django error responses
      // if (err.response?.status === 401) {
      //   setError('Invalid email or password');
      // } else if (err.response?.status === 403) {
      //   setError('Account not verified. Please check your email.');
      // } else if (err.response?.data?.detail) {
      //   setError(err.response.data.detail);
      // }
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSignup = () => {
    handleClose();
    onSignupClick();
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="relative gradient-primary p-8 text-white">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {mode === 'forgot' && (
                  <button
                    onClick={() => setMode('login')}
                    className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                
                <h2 className="font-heading text-2xl font-bold mb-2">
                  {mode === 'login' ? 'Welcome Back!' : 'Reset Password'}
                </h2>
                <p className="text-white/80 text-sm">
                  {mode === 'login' 
                    ? 'Sign in to continue your journey' 
                    : 'We\'ll send you a link to reset your password'}
                </p>
              </div>

              {/* Form */}
              <div className="p-8">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {success}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-colors ${
                          errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#FF6B35]'
                        } focus:outline-none`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs ml-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password - Only show in login mode */}
                  {mode === 'login' && (
                    <div className="space-y-1">
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-colors ${
                            errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#FF6B35]'
                          } focus:outline-none`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-xs ml-1">{errors.password}</p>
                      )}
                    </div>
                  )}

                  {/* Forgot Password Link - Only in login mode */}
                  {mode === 'login' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-sm text-[#FF6B35] hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Please wait...
                      </span>
                    ) : (
                      mode === 'login' ? 'Sign In' : 'Send Reset Link'
                    )}
                  </button>
                </form>

                {/* Demo Credentials */}
                {mode === 'login' && (
                  <div className="mt-4 p-3 rounded-xl bg-blue-50 text-blue-600 text-xs text-center">
                    <strong>Demo:</strong> demo@globalmitra.com / password
                  </div>
                )}

                {/* Footer - Sign Up Link */}
                {mode === 'login' && (
                  <div className="mt-6 text-center text-sm">
                    <p className="text-[#7F8C8D]">
                      Don&apos;t have an account?{' '}
                      <button
                        onClick={switchToSignup}
                        className="text-[#FF6B35] font-semibold hover:underline"
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                )}

                {mode === 'forgot' && (
                  <div className="mt-6 text-center text-sm">
                    <button
                      onClick={() => setMode('login')}
                      className="text-[#7F8C8D] hover:text-[#2C3E50]"
                    >
                      Remember your password?{' '}
                      <span className="text-[#FF6B35] font-semibold hover:underline">
                        Sign in
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
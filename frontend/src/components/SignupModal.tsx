import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, CheckCircle, Shield, MapPin } from 'lucide-react';

// TODO: Backend Integration (Django REST Framework)
// API Endpoint: POST /api/auth/register/
// Swagger Documentation: /api/docs/
// 
// Expected Request Body:
// {
//   "full_name": string,
//   "email": string,
//   "password": string,
//   "role": "tourist" | "guide",
//   "password_confirm": string
// }
//
// Expected Response:
// {
//   "user": {
//     "id": number,
//     "email": string,
//     "full_name": string,
//     "role": string,
//     "avatar": string | null
//   },
//   "tokens": {
//     "access": string (JWT),
//     "refresh": string (JWT)
//   }
// }

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onLoginClick: () => void; // To switch to login modal
}

type UserRole = 'tourist' | 'guide';

export function SignupModal({ isOpen, onClose, onSuccess, onLoginClick }: SignupModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('tourist');
  
  // TODO: Replace with actual API call to Django backend
  // import { authApi } from '@/services/api';
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
    setSelectedRole('tourist');
    setError('');
    setSuccess('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      // TODO: Replace with actual Django API integration
      // const response = await authApi.register({
      //   full_name: formData.fullName,
      //   email: formData.email,
      //   password: formData.password,
      //   role: selectedRole,
      //   password_confirm: formData.confirmPassword
      // });
      
      // TODO: Store tokens in localStorage or httpOnly cookies
      // localStorage.setItem('access_token', response.tokens.access);
      // localStorage.setItem('refresh_token', response.tokens.refresh);
      
      // TODO: Update global auth state with user data
      // useAuthStore.getState().setUser(response.user);
      // useAuthStore.getState().setAuthenticated(true);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('Account created successfully! Welcome to Global Mitra.');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
      
    } catch (err: any) {
      // TODO: Handle specific Django error responses
      // if (err.response?.data?.email) {
      //   setError('This email is already registered.');
      // } else if (err.response?.data?.detail) {
      //   setError(err.response.data.detail);
      // }
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
              {/* Header */}
              <div className="relative gradient-primary p-8 text-white">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h2 className="font-heading text-2xl font-bold mb-2">
                  Join Global Mitra
                </h2>
                <p className="text-white/80 text-sm">
                  Start your journey as a {selectedRole === 'guide' ? 'local guide' : 'traveler'}
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
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#2C3E50]">
                      I want to join as
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('tourist')}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedRole === 'tourist'
                            ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                            : 'border-gray-200 hover:border-gray-300 text-[#7F8C8D]'
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold text-sm">Tourist</div>
                          <div className="text-xs opacity-70">Explore destinations</div>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedRole('guide')}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedRole === 'guide'
                            ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                            : 'border-gray-200 hover:border-gray-300 text-[#7F8C8D]'
                        }`}
                      >
                        <Shield className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold text-sm">Guide</div>
                          <div className="text-xs opacity-70">Host experiences</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-colors ${
                          errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#FF6B35]'
                        } focus:outline-none`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-red-500 text-xs ml-1">{errors.fullName}</p>
                    )}
                  </div>

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

                  {/* Password */}
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
                    <p className="text-xs text-gray-400 ml-1">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-colors ${
                          errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#FF6B35]'
                        } focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs ml-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      `Create ${selectedRole === 'guide' ? 'Guide' : 'Tourist'} Account`
                    )}
                  </button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center text-sm">
                  <p className="text-[#7F8C8D]">
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        handleClose();
                        onLoginClick();
                      }}
                      className="text-[#FF6B35] font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>

                {/* Terms */}
                <p className="mt-4 text-xs text-center text-gray-400">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-[#FF6B35] hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#FF6B35] hover:underline">Privacy Policy</a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
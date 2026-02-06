import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login, register } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
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
      } else if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        const success = await register(formData.email, formData.password, formData.name);
        if (success) {
          setSuccess('Account created successfully!');
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1000);
        }
      } else {
        setSuccess('Password reset link sent!');
        setTimeout(() => {
          setMode('login');
          resetForm();
        }, 2000);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
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
                
                <h2 className="font-heading text-2xl font-bold mb-2">
                  {mode === 'login' && 'Welcome Back!'}
                  {mode === 'register' && 'Join Global Mitra'}
                  {mode === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-white/80 text-sm">
                  {mode === 'login' && 'Sign in to continue your journey'}
                  {mode === 'register' && 'Start sharing your travel experiences'}
                  {mode === 'forgot' && 'We\'ll send you a reset link'}
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
                  {mode === 'register' && (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  {mode !== 'forgot' && (
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:outline-none transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  )}

                  {mode === 'register' && (
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FF6B35] focus:outline-none transition-colors"
                        required
                      />
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
                      mode === 'login' ? 'Sign In' :
                      mode === 'register' ? 'Create Account' :
                      'Send Reset Link'
                    )}
                  </button>
                </form>

                {/* Demo Credentials */}
                {mode === 'login' && (
                  <div className="mt-4 p-3 rounded-xl bg-blue-50 text-blue-600 text-xs text-center">
                    <strong>Demo:</strong> demo@globalmitra.com / password
                  </div>
                )}

                {/* Footer Links */}
                <div className="mt-6 text-center text-sm">
                  {mode === 'login' && (
                    <>
                      <button
                        onClick={() => switchMode('forgot')}
                        className="text-[#FF6B35] hover:underline mb-4 block w-full"
                      >
                        Forgot your password?
                      </button>
                      <p className="text-[#7F8C8D]">
                        Don&apos;t have an account?{' '}
                        <button
                          onClick={() => switchMode('register')}
                          className="text-[#FF6B35] font-semibold hover:underline"
                        >
                          Sign up
                        </button>
                      </p>
                    </>
                  )}

                  {mode === 'register' && (
                    <p className="text-[#7F8C8D]">
                      Already have an account?{' '}
                      <button
                        onClick={() => switchMode('login')}
                        className="text-[#FF6B35] font-semibold hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  )}

                  {mode === 'forgot' && (
                    <button
                      onClick={() => switchMode('login')}
                      className="text-[#FF6B35] font-semibold hover:underline"
                    >
                      Back to sign in
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

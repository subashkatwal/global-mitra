import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, MapPin, Users, BarChart3, 
  Bell, Menu, X, LogOut,
  Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { View } from '@/App';

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLoginClick: () => void;
  unreadNotifications: number;
  comparisonCount: number;
  onComparisonClick: () => void;
  onNotificationsClick: () => void;
}

export function Navbar({ 
  currentView, 
  onNavigate, 
  onLoginClick,
  unreadNotifications,
  comparisonCount,
  onComparisonClick,
  onNotificationsClick
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home' as View, label: 'Home', icon: Compass },
    { id: 'explore' as View, label: 'Explore', icon: MapPin },
    { id: 'community' as View, label: 'Community', icon: Users },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'glass shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="section-padding">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-[#2C3E50] group-hover:text-[#FF6B35] transition-colors">
              Global Mitra
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link, index) => {
              const Icon = link.icon;
              const isActive = currentView === link.id;
              return (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
                  onClick={() => onNavigate(link.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'text-[#FF6B35] bg-orange-50'
                      : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </motion.button>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Comparison Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onComparisonClick}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#FF6B35] transition-colors relative"
            >
              <BarChart3 className="w-4 h-4 text-[#7F8C8D]" />
              <span className="text-sm font-medium text-[#2C3E50]">Compare</span>
              {comparisonCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B35] text-white text-xs rounded-full flex items-center justify-center">
                  {comparisonCount}
                </span>
              )}
            </motion.button>

            {/* Notifications */}
            {isAuthenticated && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                onClick={onNotificationsClick}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-[#7F8C8D]" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </motion.button>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Guide Dashboard Link */}
                {user?.role === 'guide' && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => onNavigate('guide')}
                    className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2ECC71]/10 text-[#2ECC71] hover:bg-[#2ECC71]/20 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Guide</span>
                  </motion.button>
                )}

                {/* Profile */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 }}
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white border border-gray-200 hover:border-[#FF6B35] transition-colors"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden sm:block text-sm font-medium text-[#2C3E50]">
                    {user?.name.split(' ')[0]}
                  </span>
                </motion.button>

                {/* Logout */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={logout}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-[#7F8C8D]" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
                onClick={onLoginClick}
                className="btn-primary text-sm"
              >
                Join Free
              </motion.button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-[#2C3E50]" />
              ) : (
                <Menu className="w-6 h-6 text-[#2C3E50]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass border-t border-gray-100"
          >
            <div className="section-padding py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentView === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      onNavigate(link.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      isActive
                        ? 'text-[#FF6B35] bg-orange-50'
                        : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </button>
                );
              })}
              
              {isAuthenticated && user?.role === 'guide' && (
                <button
                  onClick={() => {
                    onNavigate('guide');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[#2ECC71] bg-[#2ECC71]/10"
                >
                  <Shield className="w-5 h-5" />
                  Guide Dashboard
                </button>
              )}

              <button
                onClick={() => {
                  onComparisonClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[#2C3E50] hover:bg-gray-50"
              >
                <BarChart3 className="w-5 h-5" />
                Compare ({comparisonCount})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Users, BarChart3, Bell, Menu, X,
  LogOut, UserPlus, AlertTriangle, Home, CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { View } from '@/App';

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
  unreadNotifications: number;
  comparisonCount: number;
  onComparisonClick: () => void;
  onNotificationsClick: () => void;
}

export function Navbar({
  currentView, onNavigate, onLoginClick, onSignupClick,
  unreadNotifications, comparisonCount, onComparisonClick, onNotificationsClick
}: NavbarProps) {
  const [isScrolled,       setIsScrolled]       = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoutToast,      setLogoutToast]      = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setLogoutToast(true);
    setTimeout(() => setLogoutToast(false), 3000);
  };

  const resolvePhoto = (photo: string | null | undefined): string | null => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${photo}`;
  };
  const resolvedPhoto = resolvePhoto(user?.photo);

  const isGuide = user?.role === 'GUIDE';
  const isAdmin = user?.role === 'ADMIN';

  // Avatar click → role-specific page. Admin NOT in nav links.
  const profileView: View = isAdmin ? 'admin' : isGuide ? 'guide' : 'profile';
  const isOnProfileView   = currentView === 'profile' || currentView === 'guide' || currentView === 'admin';
  const roleLabel         = isAdmin ? 'Admin' : isGuide ? 'Guide' : null;

  // Fixed 3 links for everyone — no Admin link
  const navLinks = [
    { id: 'home'      as View, label: 'Home',      icon: Home   },
    { id: 'explore'   as View, label: 'Explore',   icon: MapPin },
    { id: 'community' as View, label: 'Community', icon: Users  },
  ];

  return (
    <>
      <AnimatePresence>
        {logoutToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-3 bg-white border border-[#A8DFC8] rounded-xl shadow-lg text-sm font-medium text-[#2D8F6A]"
          >
            <CheckCircle className="w-4 h-4 text-[#3CA37A] flex-shrink-0" />
            You've been signed out successfully.
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: -100 }} animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-[#A8DFC8]/50'
            : 'bg-white shadow-sm border-b border-[#A8DFC8]/40'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="relative flex items-center h-[60px] sm:h-[68px] gap-2">

            {/* Logo */}
            <motion.button onClick={() => onNavigate('home')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="flex items-center gap-2 flex-shrink-0 focus:outline-none">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shadow flex-shrink-0 bg-[#D0F0E4]">
                <img src="/images/Globalmitra logo.png" alt="Global Mitra logo" className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.parentElement as HTMLElement).innerHTML =
                      `<div class="w-full h-full gradient-primary flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg></div>`;
                  }} />
              </div>
              <span className="font-heading font-bold text-[15px] sm:text-[17px] text-[#1A3D2B] tracking-tight">Global Mitra</span>
            </motion.button>

            {/* Center nav — 3 links for everyone, no Admin */}
            <div className="hidden lg:flex items-center gap-0.5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {navLinks.map((link, i) => {
                const Icon = link.icon;
                const active = currentView === link.id;
                return (
                  <motion.button key={link.id}
                    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06 }}
                    onClick={() => onNavigate(link.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
                      active ? 'bg-[#3CA37A] text-white shadow-sm' : 'text-[#1A3D2B] hover:bg-[#D0F0E4] hover:text-[#2D8F6A]'
                    }`}>
                    <Icon className="w-[14px] h-[14px]" />{link.label}
                  </motion.button>
                );
              })}
              <motion.button initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                onClick={() => onNavigate('report' as View)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-[#E63946] hover:bg-red-50 transition-all duration-200 whitespace-nowrap">
                <AlertTriangle className="w-[14px] h-[14px]" />Report
              </motion.button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">

              {/* Compare */}
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                onClick={onComparisonClick}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F0FBF5] border border-[#A8DFC8] text-[#1A3D2B] text-[12px] font-semibold hover:bg-[#D0F0E4] transition-colors relative whitespace-nowrap">
                <BarChart3 className="w-[14px] h-[14px]" />Compare
                {comparisonCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#3CA37A] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {comparisonCount}
                  </span>
                )}
              </motion.button>

              {/* Bell */}
              {isAuthenticated && (
                <button onClick={onNotificationsClick} className="relative p-2 rounded-lg hover:bg-[#D0F0E4] transition-colors">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A3D2B]" />
                  {unreadNotifications > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
                </button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-1.5">
                  {/*
                    Single avatar pill — Admin link removed from nav.
                    Admin  → avatar click → 'admin'
                    Guide  → avatar click → 'guide'
                    Tourist → avatar click → 'profile'
                  */}
                  <button
                    onClick={() => onNavigate(profileView)}
                    title={isAdmin ? 'Admin dashboard' : isGuide ? 'Guide profile' : 'My profile'}
                    className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border transition-all duration-200 ${
                      isOnProfileView
                        ? 'bg-[#D0F0E4] border-[#3CA37A]'
                        : 'bg-[#F0FBF5] border-[#A8DFC8] hover:border-[#3CA37A] hover:bg-[#D0F0E4]'
                    }`}
                  >
                    {resolvedPhoto ? (
                      <img src={resolvedPhoto} alt={user?.fullName ?? 'Profile'}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-[#3CA37A]/20"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (sib) sib.style.display = 'flex';
                        }} />
                    ) : null}
                    <div
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs"
                      style={{ display: resolvedPhoto ? 'none' : 'flex' }}
                    >
                      {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="text-[12px] font-semibold text-[#1A3D2B] max-w-[72px] truncate">
                        {user?.fullName?.split(' ')[0]}
                      </span>
                      {roleLabel && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                          isAdmin ? 'text-purple-700 bg-purple-100' : 'text-[#2D8F6A] bg-[#D0F0E4]'
                        }`}>
                          {roleLabel}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Logout */}
                  <button onClick={handleLogout}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 transition-colors group" title="Sign out">
                    <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#4A7A62] group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    onClick={onLoginClick}
                    className="hidden sm:flex px-3 py-1.5 rounded-lg text-[#1A3D2B] text-[13px] font-semibold border border-[#A8DFC8] hover:bg-[#D0F0E4] hover:border-[#3CA37A] transition-all duration-200 whitespace-nowrap">
                    Sign In
                  </motion.button>
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
                    onClick={onSignupClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap">
                    <UserPlus className="w-[13px] h-[13px]" />
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Join</span>
                  </motion.button>
                </div>
              )}

              {/* Hamburger */}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-[#D0F0E4] transition-colors ml-0.5">
                {isMobileMenuOpen ? <X className="w-5 h-5 text-[#1A3D2B]" /> : <Menu className="w-5 h-5 text-[#1A3D2B]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-[#A8DFC8]/60"
            >
              <div className="px-4 sm:px-6 py-3 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = currentView === link.id;
                  return (
                    <button key={link.id}
                      onClick={() => { onNavigate(link.id); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        active ? 'bg-[#3CA37A] text-white' : 'text-[#1A3D2B] hover:bg-[#D0F0E4]'
                      }`}>
                      <Icon className="w-4 h-4" />{link.label}
                    </button>
                  );
                })}
                <button onClick={() => { onNavigate('report' as View); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#E63946] hover:bg-red-50">
                  <AlertTriangle className="w-4 h-4" />Report Incidents
                </button>
                <button onClick={() => { onComparisonClick(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#1A3D2B] hover:bg-[#D0F0E4]">
                  <BarChart3 className="w-4 h-4" />Compare
                  {comparisonCount > 0 && (
                    <span className="ml-auto w-5 h-5 bg-[#3CA37A] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {comparisonCount}
                    </span>
                  )}
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => { onNavigate(profileView); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isOnProfileView ? 'bg-[#3CA37A] text-white' : 'text-[#1A3D2B] hover:bg-[#D0F0E4]'
                    }`}>
                    {resolvedPhoto
                      ? <img src={resolvedPhoto} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                    }
                    <span>{isAdmin ? 'Admin Dashboard' : isGuide ? 'Guide Profile' : 'My Profile'}</span>
                  </button>
                )}
                {!isAuthenticated && (
                  <div className="pt-2 space-y-2 border-t border-[#A8DFC8]/50">
                    <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold text-[#1A3D2B] border border-[#A8DFC8] hover:bg-[#D0F0E4]">
                      Sign In
                    </button>
                    <button onClick={() => { onSignupClick(); setIsMobileMenuOpen(false); }}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold text-white gradient-primary">
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
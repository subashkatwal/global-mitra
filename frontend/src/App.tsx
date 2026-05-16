

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { usePlaceStore } from '@/store/placeStore';
import { useSocialStore } from '@/store/socialStore';

import { Navbar }               from '@/components/Navbar';
import { HeroSection }          from '@/components/HeroSection';
import { DestinationMarquee }   from '@/components/DestinationMarquee';
import { HowItWorks }           from '@/components/HowItWorks';
import { FeaturesSection }      from '@/components/FeaturesSection';
import { TestimonialsSection }  from '@/components/TestimonialsSection';
import { CTASection }           from '@/components/CTASection';
import { Footer }               from '@/components/Footer';
import LoginModal               from '@/components/LoginModal';
import SignupModal              from '@/components/SignupModal';
import ProfileCompletionModal   from '@/components/ProfileCompletionModal';
import { ComparisonDrawer }     from '@/components/ComparisonDrawer';
import { ComparisonPage }       from '@/components/ComparisonPage'; // NEW: Full page
// import { ReportModal }          from '@/components/ReportModal';
import { ReportPage }           from '@/components/ReportPage';
import { SocialFeed }           from '@/components/SocialFeed';
import { NotificationsPanel }   from '@/components/NotificationsPanel';
import { ExplorePage }          from '@/components/ExplorePage';
import { PlaceDetails }         from '@/components/PlaceDetails';
import { ProfilePage }          from '@/components/ProfilePage';
import { GuideProfilePage }     from '@/components/GuideProfilePage';
import { GuideDashboardPage }   from '@/components/GuideDashboardPage';
import AdminDashboardPage       from '@/components/AdminDashboard';
import type { Destination } from './types';

export type View =
  | 'home' | 'explore' | 'destination' | 'community'
  | 'profile' | 'guide' | 'dashboard'
  | 'admin'
  | 'compare'
  | 'notifications' | 'report';

function App() {
  const [currentView,             setCurrentView]             = useState<View>('home');
  const [selectedDestinationId,   setSelectedDestinationId]   = useState<string | null>(null);
  const [isLoginOpen,             setIsLoginOpen]             = useState(false);
  const [isSignupOpen,            setIsSignupOpen]            = useState(false);
  const [isProfileCompletionOpen, setIsProfileCompletionOpen] = useState(false);
  const [isReportOpen,            setIsReportOpen]            = useState(false);
  const [isComparisonOpen,        setIsComparisonOpen]        = useState(false);
  const [isNotificationsOpen,     setIsNotificationsOpen]     = useState(false);

  const { isAuthenticated, user } = useAuthStore();
  const { comparisonList, removeFromComparison, clearComparison } = usePlaceStore();
  const unreadCount               = useSocialStore((state) => state.getUnreadCount());

  const handleDestinationClick = (destinationId: string) => {
    setSelectedDestinationId(destinationId);
    setCurrentView('destination');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // NEW: Handle comparison navigation - opens drawer if < 2 items, else goes to full page
  const handleComparisonClick = () => {
    if (comparisonList.length >= 2) {
      // Navigate to full comparison page
      setCurrentView('compare');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Open drawer to add more destinations
      setIsComparisonOpen(true);
    }
  };

  const handleNavigate = (view: View) => {
    // Guard profile, guide, dashboard, admin — must be logged in
    if (
      (view === 'profile' || view === 'guide' || view === 'dashboard' || view === 'admin') &&
      !isAuthenticated
    ) {
      setIsLoginOpen(true);
      return;
    }

    // Guide-only views
    if ((view === 'guide' || view === 'dashboard') && user?.role !== 'GUIDE') return;

    // Admin-only view
    if (view === 'admin' && user?.role !== 'ADMIN') return;

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuideProfileNeeded  = () => setIsProfileCompletionOpen(true);
  const handleProfileCompletionClose = () => setIsProfileCompletionOpen(false);

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onLoginClick={() => setIsLoginOpen(true)}
        onSignupClick={() => setIsSignupOpen(true)}
        unreadNotifications={unreadCount}
        comparisonCount={comparisonList.length}
        onComparisonClick={handleComparisonClick} // NEW: Updated handler
        onNotificationsClick={() => setIsNotificationsOpen(true)}
      />

      <main>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div key="home"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}>
              <HeroSection onExploreClick={() => setCurrentView('explore')} onPlaceClick={handleDestinationClick} />
              <DestinationMarquee onPlaceClick={handleDestinationClick} />
              <HowItWorks onNavigate={handleNavigate} />
              <FeaturesSection />
              <TestimonialsSection />
              <CTASection onJoinClick={() => setIsSignupOpen(true)} />
            </motion.div>
          )}

          {currentView === 'explore' && (
            <motion.div key="explore"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }} className="pt-[60px] sm:pt-[68px]">
              <ExplorePage onDestinationClick={handleDestinationClick} />
            </motion.div>
          )}

          {/* ── Destination detail ── */}
          {currentView === 'destination' && selectedDestinationId && (
            <motion.div key="destination"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }} className="pt-[60px] sm:pt-[68px]">
              <PlaceDetails
                placeId={selectedDestinationId}
                onBack={() => { setCurrentView('explore'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onReportClick={() => setIsReportOpen(true)}
              />
            </motion.div>
          )}

          {/* ── Community ── */}
          {currentView === 'community' && (
  <motion.div key="community"
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }} className="pt-24 pb-16">
    <SocialFeed currentUser={user ? {
      id:    user.id,
      name:  user.fullName ?? user.fullName ?? user.User ?? user.email,
      photo: user.photo ?? user.avatar ?? user.profilePhoto ?? null,
      role:  user.role,
    } : null} />
  </motion.div>
)}

          {/* ── Report Page ── */}
          {currentView === 'report' && (
            <motion.div key="report"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}>
              <ReportPage
                isOpen={true}
                onClose={() => setCurrentView('home')}
                placeId={selectedDestinationId}
              />
            </motion.div>
          )}

          {/* ── User Profile Page ── */}
          {currentView === 'profile' && isAuthenticated && (
            <motion.div key="profile"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}>
              <ProfilePage onNavigate={(v) => handleNavigate(v as View)} />
            </motion.div>
          )}

          {/* ── Guide Profile Page ── */}
          {currentView === 'guide' && isAuthenticated && user?.role === 'GUIDE' && (
            <motion.div key="guide"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}>
              <GuideProfilePage onNavigate={(v) => handleNavigate(v as View)} />
            </motion.div>
          )}

          {/* ── Guide Dashboard ── */}
          {currentView === 'dashboard' && isAuthenticated && user?.role === 'GUIDE' && (
            <motion.div key="dashboard"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}>
              <GuideDashboardPage onNavigate={(v) => handleNavigate(v as View)} />
            </motion.div>
          )}

          {/* ── Admin Dashboard ── */}
          {currentView === 'admin' && isAuthenticated && user?.role === 'ADMIN' && (
            <motion.div key="admin"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}>
              <AdminDashboardPage />
            </motion.div>
          )}

  
          {currentView === 'compare' && (
            <motion.div key="compare"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }} className="pt-[60px] sm:pt-[68px]">
              <ComparisonPage 
                destinations={comparisonList}
                onRemove={removeFromComparison}
                onClear={clearComparison}
                onDestinationClick={handleDestinationClick}
                onBack={() => setCurrentView('explore')} availableDestinations={[]} onAdd={function (): void {
                  throw new Error('Function not implemented.');
                } }              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {currentView === 'home' && <Footer />}

      {/* ── Modals / overlays ── */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignup={() => { setIsLoginOpen(false); setIsSignupOpen(true); }}
      />
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSwitchToLogin={() => { setIsSignupOpen(false); setIsLoginOpen(true); }}
        onGuideProfileNeeded={handleGuideProfileNeeded}
      />
      <ProfileCompletionModal
        isOpen={isProfileCompletionOpen}
        onClose={handleProfileCompletionClose}
      />

      {/* Comparison Drawer - for adding destinations when < 2 selected */}
      <ComparisonDrawer
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onPlaceClick={handleDestinationClick}
      />
      
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}

export default App;
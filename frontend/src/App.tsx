import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, MapPin, Shield, 
  Search, Star, Map, TrendingUp,
  CheckCircle, Camera, Heart
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlaceStore } from '@/store/placeStore';
import { useSocialStore } from '@/store/socialStore';
import type { Place } from '@/types';

// Import components
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { DestinationMarquee } from '@/components/DestinationMarquee';
import { HowItWorks } from '@/components/HowItWorks';
import { FeaturesSection } from '@/components/FeaturesSection';
import { PopularDestinations } from '@/components/PopularDestinations';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';
import { LoginModal } from '@/components/LoginModal';
import { SignupModal } from '@/components/SignupModal'; // Import new SignupModal
import { PlaceDetails } from '@/components/PlaceDetails';
import { ComparisonDrawer } from '@/components/ComparisonDrawer';
import { ReportModal } from '@/components/ReportModal';
import { SocialFeed } from '@/components/SocialFeed';
import { ProfilePage } from '@/components/ProfilePage';
import { GuideDashboard } from '@/components/GuideDashboard';
import { NotificationsPanel } from '@/components/NotificationsPanel';

export type View = 'home' | 'explore' | 'place' | 'community' | 'profile' | 'guide' | 'notifications';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false); // New state for signup modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const { isAuthenticated, user } = useAuthStore();
  const { comparisonList } = usePlaceStore();
  const unreadCount = useSocialStore(state => state.getUnreadCount());

  const handlePlaceClick = (placeId: string) => {
    setSelectedPlaceId(placeId);
    setCurrentView('place');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedPlaceId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: View) => {
    if ((view === 'profile' || view === 'guide') && !isAuthenticated) {
      setIsSignupOpen(true); // Open signup instead of login for new users
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Navigation */}
      <Navbar 
        currentView={currentView}
        onNavigate={handleNavigate}
        onLoginClick={() => setIsLoginOpen(true)}
        onSignupClick={() => setIsSignupOpen(true)} // Pass signup handler
        unreadNotifications={unreadCount}
        comparisonCount={comparisonList.length}
        onComparisonClick={() => setIsComparisonOpen(true)}
        onNotificationsClick={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content */}
      <main>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HeroSection 
                onExploreClick={() => setCurrentView('explore')}
                onPlaceClick={handlePlaceClick}
              />
              <DestinationMarquee onPlaceClick={handlePlaceClick} />
              <HowItWorks />
              <FeaturesSection />
              <PopularDestinations onPlaceClick={handlePlaceClick} />
              <TestimonialsSection />
              <CTASection onJoinClick={() => setIsSignupOpen(true)} /> {/* Open signup on CTA */}
            </motion.div>
          )}

          {currentView === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="pt-24 pb-16"
            >
              <ExplorePage onPlaceClick={handlePlaceClick} />
            </motion.div>
          )}

          {currentView === 'place' && selectedPlaceId && (
            <motion.div
              key="place"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="pt-24 pb-16"
            >
              <PlaceDetails 
                placeId={selectedPlaceId}
                onBack={handleBackToHome}
                onReportClick={() => setIsReportOpen(true)}
              />
            </motion.div>
          )}

          {currentView === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="pt-24 pb-16"
            >
              <SocialFeed />
            </motion.div>
          )}

          {currentView === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="pt-24 pb-16"
            >
              <ProfilePage 
                userId={user?.id}
                onPlaceClick={handlePlaceClick}
              />
            </motion.div>
          )}

          {currentView === 'guide' && user?.role === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="pt-24 pb-16"
            >
              <GuideDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer - only on home */}
      {currentView === 'home' && <Footer />}

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => setIsLoginOpen(false)}
        onSignupClick={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccess={() => setIsSignupOpen(false)}
        onLoginClick={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        placeId={selectedPlaceId}
      />

      <ComparisonDrawer
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onPlaceClick={handlePlaceClick}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}

// Explore Page Component
function ExplorePage({ onPlaceClick }: { onPlaceClick: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { filteredPlaces, setSearchQuery: setStoreSearch, setFilters } = usePlaceStore();

  const categories = [
    { id: 'all', label: 'All', icon: Compass },
    { id: 'beach', label: 'Beaches', icon: MapPin },
    { id: 'mountain', label: 'Mountains', icon: TrendingUp },
    { id: 'city', label: 'Cities', icon: Map },
    { id: 'historical', label: 'Historical', icon: Shield },
    { id: 'nature', label: 'Nature', icon: Camera },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setStoreSearch(query);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setFilters({ categories: [] });
    } else {
      setFilters({ categories: [category as any] });
    }
  };

  return (
    <div className="section-padding max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#2C3E50] mb-4">Explore Destinations</h1>
        <p className="text-[#7F8C8D] text-lg">Discover verified places from our global community</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search destinations, countries, or tags..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B35] focus:outline-none transition-colors text-lg"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#FF6B35] text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-[#2C3E50] hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-[#7F8C8D]">
          Showing <span className="font-semibold text-[#2C3E50]">{filteredPlaces.length}</span> destinations
        </p>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlaces.map((place, index) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            <PlaceCard place={place} onClick={() => onPlaceClick(place.id)} />
          </motion.div>
        ))}
      </div>

      {filteredPlaces.length === 0 && (
        <div className="text-center py-16">
          <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">No destinations found</h3>
          <p className="text-[#7F8C8D]">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

// Place Card Component
function PlaceCard({ place, onClick }: { place: Place; onClick: () => void }) {
  const { savedPlaces, toggleSavePlace, addToComparison, comparisonList } = usePlaceStore();
  const isSaved = savedPlaces.includes(place.id);
  const isInComparison = comparisonList.some(p => p.id === place.id);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSavePlace(place.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInComparison && comparisonList.length < 4) {
      addToComparison(place);
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer card-hover"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={place.images[0]}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {place.isVerified && (
            <span className="badge-verified text-xs">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleSave}
            className={`p-2 rounded-full transition-all ${
              isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Rating */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          <Star className="w-4 h-4 text-[#F7B801] fill-[#F7B801]" />
          <span className="text-white font-semibold">{place.rating}</span>
          <span className="text-white/70 text-sm">({place.reviewCount})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-[#2C3E50] text-lg mb-1 group-hover:text-[#FF6B35] transition-colors">
          {place.name}
        </h3>
        <p className="text-[#7F8C8D] text-sm mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {place.location.city}, {place.location.country}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {place.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="text-xs px-2 py-1 bg-gray-100 text-[#7F8C8D] rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm text-[#7F8C8D]">
            <span className="font-semibold text-[#2C3E50]">${place.avgCostPerDay}</span>/day
          </span>
          <button
            onClick={handleCompare}
            disabled={isInComparison || comparisonList.length >= 4}
            className={`text-sm font-medium transition-colors ${
              isInComparison 
                ? 'text-[#2ECC71]' 
                : comparisonList.length >= 4
                ? 'text-gray-300'
                : 'text-[#FF6B35] hover:text-[#e55a2b]'
            }`}
          >
            {isInComparison ? 'Added' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
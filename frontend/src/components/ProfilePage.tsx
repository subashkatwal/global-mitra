import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  MapPin, Calendar, Users, Award, Star, Camera,
  MapPinned, Bookmark, FileText, Settings, CheckCircle,
  TrendingUp, Heart, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlaceStore } from '@/store/placeStore';
import { useSocialStore } from '@/store/socialStore';

interface ProfilePageProps {
  userId?: string;
  onPlaceClick: (id: string) => void;
}

export function ProfilePage({ onPlaceClick }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'contributions'>('posts');
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  
  const { user } = useAuthStore();
  const { savedPlaces, places } = usePlaceStore();
  const { posts } = useSocialStore();

  const profileUser = user;
  const savedPlacesList = places.filter(p => savedPlaces.includes(p.id));
  const userPosts = posts.filter(p => p.userId === user?.id);

  if (!profileUser) {
    return (
      <div className="section-padding pt-32 text-center">
        <h2 className="text-2xl font-bold text-[#2C3E50]">Please sign in to view your profile</h2>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="min-h-screen bg-[#FDF8F3]">
      {/* Profile Header */}
      <div className="bg-white">
        <div className="section-padding py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="max-w-5xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {profileUser.isVerified && (
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-[#2ECC71] rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#2C3E50]">
                    {profileUser.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-medium rounded-full">
                    <Award className="w-4 h-4" />
                    {profileUser.role === 'guide' ? 'Verified Guide' : 'Traveler'}
                  </span>
                </div>
                
                <p className="text-[#7F8C8D] mb-4">@{profileUser.username}</p>
                
                {profileUser.bio && (
                  <p className="text-[#2C3E50] mb-4 max-w-lg">{profileUser.bio}</p>
                )}

                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-[#7F8C8D]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profileUser.location || 'Location not set'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profileUser.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  <Settings className="w-5 h-5 text-[#7F8C8D]" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              {[
                { label: 'Places Visited', value: profileUser.stats.placesVisited, icon: MapPinned },
                { label: 'Reports', value: profileUser.stats.reportsSubmitted, icon: FileText },
                { label: 'Score', value: profileUser.stats.verificationScore, icon: TrendingUp },
                { label: 'Followers', value: profileUser.followers.length, icon: Users },
                { label: 'Following', value: profileUser.following.length, icon: Heart },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center p-4 bg-[#FDF8F3] rounded-xl">
                    <Icon className="w-5 h-5 text-[#FF6B35] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[#2C3E50]">{stat.value}</p>
                    <p className="text-xs text-[#7F8C8D]">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Badges */}
      <div className="section-padding py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="max-w-5xl mx-auto"
        >
          <h3 className="font-semibold text-[#2C3E50] mb-4">Badges</h3>
          <div className="flex flex-wrap gap-3">
            {profileUser.badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${badge.color}20` }}
                >
                  <Award className="w-5 h-5" style={{ color: badge.color }} />
                </div>
                <div>
                  <p className="font-semibold text-[#2C3E50] text-sm">{badge.name}</p>
                  <p className="text-xs text-[#7F8C8D]">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Content Tabs */}
      <div className="section-padding pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Tab Buttons */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {[
              { id: 'posts', label: 'My Posts', icon: Camera },
              { id: 'saved', label: 'Saved Places', icon: Bookmark },
              { id: 'contributions', label: 'Contributions', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#FF6B35] text-[#FF6B35]'
                      : 'border-transparent text-[#7F8C8D] hover:text-[#2C3E50]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'posts' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={post.images[0]}
                        alt="Post"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <p className="text-sm text-[#2C3E50] line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-[#7F8C8D]">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" /> {post.comments.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-[#7F8C8D]">No posts yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPlacesList.length > 0 ? (
                  savedPlacesList.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => onPlaceClick(place.id)}
                      className="bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <img
                        src={place.images[0]}
                        alt={place.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="font-semibold text-[#2C3E50]">{place.name}</h4>
                        <p className="text-sm text-[#7F8C8D] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {place.location.city}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 text-[#F7B801] fill-[#F7B801]" />
                          <span className="text-sm font-medium">{place.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-[#7F8C8D]">No saved places yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contributions' && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-[#7F8C8D]">Your verified reports will appear here</p>
                <p className="text-sm text-[#7F8C8D] mt-2">
                  Reports approved: {profileUser.stats.reportsApproved}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

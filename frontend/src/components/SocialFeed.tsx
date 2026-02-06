import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Heart, MessageCircle, Share2, Bookmark, MapPin, 
  Send, MoreHorizontal, Image as ImageIcon, X
} from 'lucide-react';
import { useSocialStore } from '@/store/socialStore';
import { useAuthStore } from '@/store/authStore';

export function SocialFeed() {
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('discover');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  
  const { posts, likePost, unlikePost, savePost, unsavePost } = useSocialStore();
  const { isAuthenticated } = useAuthStore();

  const handleLike = (postId: string, isLiked: boolean) => {
    if (!isAuthenticated) return;
    if (isLiked) {
      unlikePost(postId);
    } else {
      likePost(postId);
    }
  };

  const handleSave = (postId: string, isSaved: boolean) => {
    if (!isAuthenticated) return;
    if (isSaved) {
      unsavePost(postId);
    } else {
      savePost(postId);
    }
  };

  return (
    <div ref={sectionRef} className="section-padding max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#2C3E50]">Community</h1>
          <p className="text-[#7F8C8D]">Share your travel moments</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Create Post
          </button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-8"
      >
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'discover'
              ? 'bg-[#2C3E50] text-white'
              : 'bg-white text-[#7F8C8D] hover:bg-gray-50'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'following'
              ? 'bg-[#2C3E50] text-white'
              : 'bg-white text-[#7F8C8D] hover:bg-gray-50'
          }`}
        >
          Following
        </button>
      </motion.div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.user.avatar}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-[#2C3E50]">{post.user.name}</h4>
                  {post.place && (
                    <p className="text-sm text-[#7F8C8D] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.place.name}
                    </p>
                  )}
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <MoreHorizontal className="w-5 h-5 text-[#7F8C8D]" />
              </button>
            </div>

            {/* Post Image */}
            {post.images.length > 0 && (
              <div className="aspect-video bg-gray-100">
                <img
                  src={post.images[0]}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Post Actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id, post.isLiked || false)}
                    className={`flex items-center gap-1 transition-colors ${
                      post.isLiked ? 'text-red-500' : 'text-[#2C3E50] hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 text-[#2C3E50] hover:text-[#FF6B35] transition-colors">
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm">{post.comments.length}</span>
                  </button>
                  <button className="text-[#2C3E50] hover:text-[#FF6B35] transition-colors">
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
                <button
                  onClick={() => handleSave(post.id, post.isSaved || false)}
                  className={`transition-colors ${
                    post.isSaved ? 'text-[#FF6B35]' : 'text-[#2C3E50] hover:text-[#FF6B35]'
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${post.isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Post Content */}
              <p className="text-[#2C3E50] mb-2">
                <span className="font-semibold">{post.user.name}</span>{' '}
                {post.content}
              </p>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[#004E89] text-sm">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Comments */}
              {post.comments.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  {post.comments.slice(0, 2).map((comment) => (
                    <div key={comment.id} className="flex gap-2 mb-2">
                      <span className="font-semibold text-sm text-[#2C3E50]">
                        {comment.user.name}
                      </span>
                      <span className="text-sm text-[#7F8C8D]">{comment.content}</span>
                    </div>
                  ))}
                  {post.comments.length > 2 && (
                    <button className="text-sm text-[#7F8C8D]">
                      View all {post.comments.length} comments
                    </button>
                  )}
                </div>
              )}

              {/* Add Comment */}
              {isAuthenticated && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 text-sm outline-none"
                  />
                  <button className="text-[#FF6B35] font-medium text-sm">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Post Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-[#2C3E50]">Create Post</h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your travel experience..."
                rows={4}
                className="w-full resize-none outline-none"
              />
              <div className="flex items-center justify-between mt-4">
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <ImageIcon className="w-5 h-5 text-[#7F8C8D]" />
                </button>
                <button 
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-primary"
                >
                  Post
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

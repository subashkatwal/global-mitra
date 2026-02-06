import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, User, Heart, MessageCircle, Award, MapPin, Bell } from 'lucide-react';
import { useSocialStore } from '@/store/socialStore';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const notificationIcons: Record<string, any> = {
  report_approved: CheckCircle,
  report_denied: XCircle,
  new_follower: User,
  post_liked: Heart,
  new_comment: MessageCircle,
  badge_earned: Award,
  place_alert: MapPin,
};

const notificationColors: Record<string, string> = {
  report_approved: '#2ECC71',
  report_denied: '#E74C3C',
  new_follower: '#004E89',
  post_liked: '#FF6B35',
  new_comment: '#F7B801',
  badge_earned: '#F7B801',
  place_alert: '#E74C3C',
};

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useSocialStore();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="font-heading text-xl font-bold text-[#2C3E50]">Notifications</h2>
                <p className="text-sm text-[#7F8C8D]">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-sm text-[#FF6B35] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-auto h-[calc(100%-80px)]">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => {
                    const Icon = notificationIcons[notification.type] || Bell;
                    const color = notificationColors[notification.type] || '#7F8C8D';
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => markNotificationRead(notification.id)}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.isRead ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Icon */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#2C3E50] text-sm mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-[#7F8C8D] text-sm mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#7F8C8D]">
                              {new Date(notification.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">No notifications</h3>
                  <p className="text-[#7F8C8D]">You&apos;re all caught up!</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

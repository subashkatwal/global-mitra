import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle, XCircle, User, Heart, MessageCircle,
  Award, MapPin, Bell, Activity, AlertTriangle, Trash2, Radio, Loader2,
} from 'lucide-react';
import { useSocialStore } from '@/store/socialStore';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEV_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  LOW:      { color: '#0369A1', bg: '#EFF6FF', border: '#BFDBFE' },
  MEDIUM:   { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  HIGH:     { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  CRITICAL: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const ICON_MAP: Record<string, any> = {
  report_approved: CheckCircle, report_denied: XCircle,
  new_follower: User, post_liked: Heart, new_comment: MessageCircle,
  badge_earned: Award, place_alert: MapPin, alert_broadcast: Radio,
  safety_alert: AlertTriangle, NEW_INCIDENT: Bell, CLUSTER_FORMED: Activity,
  ALERT_BROADCAST: Radio, REPORT_VERIFIED: CheckCircle,
  REPORT_REJECTED: XCircle, AUTO_ALERT: AlertTriangle,
};

const COLOR_MAP: Record<string, string> = {
  report_approved: '#059669', report_denied: '#DC2626', new_follower: '#2563EB',
  post_liked: '#F97316', new_comment: '#D97706', badge_earned: '#D97706',
  place_alert: '#DC2626', alert_broadcast: '#DC2626', safety_alert: '#EA580C',
  NEW_INCIDENT: '#2563EB', CLUSTER_FORMED: '#7C3AED', ALERT_BROADCAST: '#DC2626',
  REPORT_VERIFIED: '#059669', REPORT_REJECTED: '#DC2626', AUTO_ALERT: '#EA580C',
};

function isAlertType(type?: string): boolean {
  if (!type) return false;
  const t = type.toUpperCase();
  return t === 'ALERT_BROADCAST' || t === 'AUTO_ALERT' || t === 'SAFETY_ALERT'
    || t === 'PLACE_ALERT' || t.includes('ALERT');
}

function timeAgo(date?: Date | string): string {
  if (!date) return '—';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const {
    notifications,
    notificationsLoading,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
    fetchNotifications,
  } = useSocialStore() as any;

  // Fetch from backend every time panel opens
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">

            {/* Header */}
            <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-900" />
                <div>
                  <h2 className="font-bold text-lg text-black flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: '#DC2626' }}>{unreadCount}</span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {notificationsLoading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && !notificationsLoading && (
                  <button onClick={markAllNotificationsRead}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                    Mark all read
                  </button>
                )}
                {!notificationsLoading && notifications.length > 0 && (
                  <button onClick={clearAllNotifications}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Clear all">
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {notificationsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-400">Loading notifications…</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification: any, index: number) => {
                    const type     = notification.notificationType ?? notification.type ?? '';
                    const isAlert  = isAlertType(type) || notification.title?.toLowerCase().includes('alert');
                    const sev      = (notification.severity ?? notification.meta?.severity ?? '').toUpperCase();
                    const sevCfg   = SEV_COLOR[sev] ?? null;
                    const Icon     = ICON_MAP[type] ?? Bell;
                    const accent   = isAlert && sevCfg ? sevCfg.color : (COLOR_MAP[type] ?? '#6B7280');
                    const iconBg   = isAlert && sevCfg ? sevCfg.bg : `${accent}18`;
                    const isUnread = !notification.isRead;

                    return (
                      <motion.div key={notification.id}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => markNotificationRead(notification.id)}
                        className={`px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${isUnread ? 'bg-blue-50/30' : ''}`}>

                        {isUnread && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
                            style={{ background: accent }} />
                        )}

                        <div className="flex gap-3 items-start">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: iconBg }}>
                            <Icon className="w-5 h-5" style={{ color: accent }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <h4 className="font-semibold text-sm leading-tight text-black">
                                {notification.title}
                              </h4>
                              {isUnread && (
                                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                  style={{ background: accent }} />
                              )}
                            </div>

                            <p className="text-sm leading-snug mb-1.5 line-clamp-2 text-gray-700">
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap">
                              {isAlert && sev && sevCfg && (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                  style={{ color: sevCfg.color, background: sevCfg.bg, borderColor: sevCfg.border }}>
                                  {sev}
                                </span>
                              )}
                              {(notification.meta?.lat != null || notification.latitude != null) && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
                                  <MapPin className="w-3 h-3" />
                                  {Number(notification.meta?.lat ?? notification.latitude).toFixed(4)},&nbsp;
                                  {Number(notification.meta?.lng ?? notification.longitude).toFixed(4)}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-100">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-black">No notifications</h3>
                  <p className="text-sm text-gray-500">You're all caught up!</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
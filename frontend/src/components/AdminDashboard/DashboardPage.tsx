import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, AlertCircle, MessageSquare, AlertTriangle, MapPin, RefreshCw } from 'lucide-react';
import { T, apiFetch, parseErr } from './utils';
import { ErrMsg } from './ui';
import type { AdminPage, Stats } from './types';

interface DashboardPageProps {
  onNav: (page: AdminPage) => void;
}

export function DashboardPage({ onNav }: DashboardPageProps) {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const [users, guides, pending, posts, reports, dests] = await Promise.allSettled([
        apiFetch('/profile/users'),
        apiFetch('/auth/guides'),
        apiFetch('/auth/guides/pending'),
        apiFetch('/socials/posts'),
        apiFetch('/reports'),
        apiFetch('/destinations'),
      ]);
      const get = (r: PromiseSettledResult<any>) =>
        r.status === 'fulfilled' ? r.value : null;

      setStats({
        totalUsers:           get(users)?.count   ?? get(users)?.length   ?? 0,
        activeGuides:         get(guides)?.count  ?? get(guides)?.length  ?? 0,
        pendingVerifications: get(pending)?.count ?? get(pending)?.length ?? 0,
        totalPosts:           get(posts)?.count   ?? get(posts)?.length   ?? 0,
        safetyReports:        get(reports)?.count ?? get(reports)?.length ?? 0,
        destinations:         get(dests)?.count   ?? get(dests)?.length   ?? 0,
      });
    } catch (e: any) {
      setErr(parseErr(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cards: {
    label: string;
    key: keyof Stats;
    icon: any;
    page: AdminPage;
    accent: string;
    bg: string;
  }[] = [
    { label: 'Total Users',           key: 'totalUsers',           icon: Users,         page: 'users',        accent: '#3CA37A', bg: '#D0F0E4' },
    { label: 'Active Guides',         key: 'activeGuides',         icon: Shield,        page: 'guides',       accent: '#2D8F6A', bg: '#D0F0E4' },
    { label: 'Pending Verifications', key: 'pendingVerifications', icon: AlertCircle,   page: 'guides',       accent: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Total Posts',           key: 'totalPosts',           icon: MessageSquare, page: 'posts',        accent: '#6366F1', bg: '#EEF2FF' },
    { label: 'Safety Reports',        key: 'safetyReports',        icon: AlertTriangle, page: 'reports',      accent: '#EF4444', bg: '#FEE2E2' },
    { label: 'Destinations',          key: 'destinations',         icon: MapPin,        page: 'destinations', accent: '#0EA5E9', bg: '#E0F2FE' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>Admin Dashboard</h1>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-[#D0F0E4]"
          style={{ borderColor: T.border, color: T.textMid }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {err && <ErrMsg msg={err} onRetry={load} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.button
              key={c.key}
              onClick={() => onNav(c.page)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="text-left bg-white rounded-2xl border p-5 hover:shadow-md transition-all hover:-translate-y-0.5"
              style={{ borderColor: T.border }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
                  <Icon className="w-5 h-5" style={{ color: c.accent }} />
                </div>
                <p className="text-sm font-medium" style={{ color: T.textSub }}>{c.label}</p>
              </div>
              <p className="text-3xl font-bold" style={{ color: T.textMain }}>
                {loading
                  ? <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" />
                  : (stats?.[c.key] ?? '—')}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

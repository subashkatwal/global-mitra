import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, BadgeCheck, Clock, X,
  Loader2, AlertCircle, Mail, Phone, MapPin,
  FileText, Star, Calendar, User, Hash,
  Building2, CheckCircle, Edit3, Award,
  Compass, Globe, TrendingUp, Lock
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/services/api';

// ── Matches the exact API response shape ──────────────────────────────────────
interface ApiUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber: string | null;
  photo: string | null;
  address: string | null;
  role: string;
  verified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiGuide {
  id: string;
  user: ApiUser;
  licenseNumber: string;
  licenseIssuedBy: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  bio: string;
  createdAt: string;
  updatedAt: string;
}

function parseError(err: any): string {
  const data = err?.response?.data || err?.data || err;
  if (!data) return 'Something went wrong.';
  if (typeof data === 'object' && !Array.isArray(data)) {
    if (data.detail)  return String(data.detail);
    if (data.error)   return String(data.error);
    if (data.message) return String(data.message);
  }
  return err?.message || 'Something went wrong.';
}

// Unwraps any of these shapes:
//   { success, data: { id, user, licenseNumber, ... } }  ← your API
//   { id, user, licenseNumber, ... }                      ← if apiFetch unwraps
function unwrapGuide(raw: any): ApiGuide | null {
  if (!raw) return null;
  const candidates = [raw?.data, raw?.guide, raw?.result, raw];
  for (const g of candidates) {
    if (g && typeof g === 'object' && g.id && g.user) {
      return g as ApiGuide;
    }
  }
  if (raw?.id && raw?.licenseNumber !== undefined) return raw as ApiGuide;
  console.warn('[unwrapGuide] could not find guide in response:', raw);
  return null;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Review',
    pill: 'bg-amber-50 border-amber-200 text-amber-700',
    dot: 'bg-amber-400',
    banner: 'bg-amber-50 border-amber-200',
    bannerText: 'text-amber-800',
    icon: Clock,
    description: 'Your license is being reviewed. This usually takes 2–3 business days.',
  },
  VERIFIED: {
    label: 'Verified Guide',
    pill: 'bg-[#D8F3DC] border-[#B7E4C7] text-[#1B4332]',
    dot: 'bg-[#2D6A4F]',
    banner: 'bg-[#D8F3DC] border-[#B7E4C7]',
    bannerText: 'text-[#1B4332]',
    icon: BadgeCheck,
    description: "You're a fully verified guide. Tourists can book your services.",
  },
  REJECTED: {
    label: 'Not Approved',
    pill: 'bg-red-50 border-red-200 text-red-700',
    dot: 'bg-red-400',
    banner: 'bg-red-50 border-red-200',
    bannerText: 'text-red-800',
    icon: X,
    description: 'Your application was not approved. Contact support for assistance.',
  },
};

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.07, ease: EASE },
});

interface GuideDashboardPageProps {
  onNavigate: (view: string) => void;
  /** Optional: pass guide data directly to avoid a second API call */
  guideData?: any;
}

export function GuideDashboardPage({ onNavigate, guideData }: GuideDashboardPageProps) {
  const authUser = useAuthStore((s) => s.user);
  const [guide,    setGuide]   = useState<ApiGuide | null>(() => guideData ? unwrapGuide(guideData) : null);
  const [loading,  setLoading] = useState(!guideData);
  const [fetchErr, setErr]     = useState('');

  useEffect(() => {
    // If parent passed guideData, use it; still re-fetch to get freshest data
    (async () => {
      setLoading(true); setErr('');
      try {
        const raw = await apiFetch('/profile/guides/me') as any;
        if (import.meta.env.DEV) console.log('[GuideDashboard] raw:', raw);
        const g = unwrapGuide(raw);
        if (g) {
          setGuide(g);
        } else {
          console.error('[GuideDashboard] unwrapGuide returned null. Raw:', raw);
          setErr('Could not parse guide data. Check console for details.');
        }
      } catch (e: any) { setErr(parseError(e)); }
      finally { setLoading(false); }
    })();
  }, []); // re-fetch on every mount so edits are reflected

  if (authUser?.role !== 'GUIDE') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Shield className="w-10 h-10 text-gray-300" />
      <p className="text-gray-500 text-sm">Only accessible to registered guides.</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" />
    </div>
  );

  if (fetchErr) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-gray-500 text-sm">{fetchErr}</p>
    </div>
  );

  if (!guide) return null;

  const sc         = STATUS_CONFIG[guide.verificationStatus] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = sc.icon;
  const fullName   = guide.user?.fullName ?? authUser?.fullName ?? 'Guide';
  const initials   = fullName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  // Photo: API returns full URL (http://...), use directly
  const photoUrl   = guide.user?.photo ?? null;
  const joinDate   = formatDate(guide.user?.createdAt);
  const lastUpdate = formatDateShort(guide.updatedAt);

  const completionFields = [
    !!guide.user?.photo,
    !!guide.user?.fullName,
    !!guide.user?.email,
    !!guide.user?.phoneNumber,
    !!guide.bio,
    !!guide.user?.address,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  const missingFields = [
    !guide.user?.photo       && 'Profile photo',
    !guide.bio               && 'Bio',
    !guide.user?.phoneNumber && 'Phone number',
    !guide.user?.address     && 'Address',
  ].filter(Boolean) as string[];

  const stats = [
    { label: 'Reports',    value: '12',  icon: FileText, accent: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Places',     value: '28',  icon: Compass,  accent: '#8B5CF6', bg: '#F5F3FF' },
    { label: 'Posts',      value: '45',  icon: Globe,    accent: '#F97316', bg: '#FFF7ED' },
    { label: 'Avg Rating', value: '4.8', icon: Star,     accent: '#EAB308', bg: '#FEFCE8' },
  ];

  return (
    // NOTE: No pt-[68px] or min-h-screen here — the parent (GuideProfilePage) 
    // wraps this in a container that already handles that.
    <div className="max-w-2xl mx-auto px-4 pb-12 space-y-4">

      {/* Title — NO back button here; parent renders it above */}
      <motion.div {...stagger(0.5)}>
        <h1 className="text-2xl font-bold text-[#1B4332] tracking-tight">My Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Everything about your guide account, at a glance.</p>
      </motion.div>

      {/* ══ SECTION 1: PROFILE OVERVIEW ══ */}
      <motion.div {...stagger(1)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #52B788 100%)' }}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute right-10 top-6 w-14 h-14 rounded-full bg-white/5" />
          <div className="absolute left-1/3 -bottom-8 w-36 h-36 rounded-full bg-white/5" />
        </div>

        <div className="px-6 pb-6 -mt-10">
          {/* Avatar row */}
          <div className="flex items-end gap-4 mb-5">
            <div className="relative flex-shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt={fullName}
                  className="w-[72px] h-[72px] rounded-2xl object-cover ring-4 ring-white shadow-md"
                  onError={(e) => {
                    // Fallback to initials if media URL 404s
                    e.currentTarget.style.display = 'none';
                    const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (sib) sib.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-[72px] h-[72px] rounded-2xl ring-4 ring-white shadow-md items-center justify-center text-xl font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
                  display: photoUrl ? 'none' : 'flex',
                }}
              >
                {initials}
              </div>
              {guide.verificationStatus === 'VERIFIED' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2D6A4F] rounded-full flex items-center justify-center ring-2 ring-white">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 pb-0.5">
              <h2 className="text-lg font-bold text-[#1B4332] leading-tight">{fullName}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D8F3DC] text-[#1B4332]">
                  <Shield className="w-2.5 h-2.5" /> Guide
                </span>
                <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${sc.pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>
            </div>

            <button onClick={() => onNavigate('guide')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#B7E4C7] text-[#2D6A4F] text-xs font-bold hover:bg-[#D8F3DC] transition-colors flex-shrink-0 self-end">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { icon: Mail,     label: 'Email',        value: guide.user?.email ?? authUser?.email ?? '—' },
              { icon: Phone,    label: 'Phone',        value: guide.user?.phoneNumber },
              { icon: MapPin,   label: 'Address',      value: guide.user?.address },
              { icon: Calendar, label: 'Member Since', value: joinDate },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAF9]">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F5EC] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{row.label}</p>
                    <p className={`text-sm font-semibold mt-0.5 truncate ${row.value ? 'text-gray-800' : 'text-gray-400 italic font-normal'}`}>
                      {row.value ?? 'Not provided'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bio */}
          <div className="mt-2.5 p-3 rounded-xl bg-[#F8FAF9]">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Bio</p>
            {guide.bio ? (
              <p className="text-sm text-gray-700 leading-relaxed">{guide.bio}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No bio yet —{' '}
                <button onClick={() => onNavigate('guide')}
                  className="text-[#2D6A4F] font-semibold not-italic hover:underline">
                  add one
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══ SECTION 2: STATS ══ */}
      <motion.div {...stagger(2)}>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">My Stats</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.06, duration: 0.35, ease: EASE }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                  <Icon className="w-5 h-5" style={{ color: stat.accent }} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1B4332]">{stat.value}</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ══ SECTION 3: LICENSE & VERIFICATION ══ */}
      <motion.div {...stagger(3)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#2D6A4F]" />
          <h2 className="text-sm font-bold text-[#1B4332]">License & Verification</h2>
        </div>

        <div className={`mx-4 mt-4 p-4 rounded-xl border flex items-start gap-3 ${sc.banner}`}>
          <div className={`w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0 ${sc.bannerText}`}>
            <StatusIcon className="w-4 h-4" />
          </div>
          <div>
            <p className={`text-sm font-bold ${sc.bannerText}`}>{sc.label}</p>
            <p className={`text-xs mt-0.5 opacity-80 ${sc.bannerText}`}>{sc.description}</p>
          </div>
        </div>

        <div className="divide-y divide-gray-50 mt-2 pb-1">
          {[
            { icon: Hash,      label: 'License Number', value: guide.licenseNumber   || '—', mono: true,  locked: true  },
            { icon: Building2, label: 'Issued By',      value: guide.licenseIssuedBy || '—', mono: false, locked: true  },
            { icon: User,      label: 'Guide ID',       value: guide.id,                     mono: true,  locked: false },
            { icon: Calendar,  label: 'Last Updated',   value: lastUpdate,                   mono: false, locked: false },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-7 h-7 rounded-lg bg-[#F0FBF4] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#2D6A4F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{row.label}</p>
                  <p className={`text-sm font-semibold text-gray-800 truncate mt-0.5 ${row.mono ? 'font-mono text-xs' : ''}`}>
                    {row.value}
                  </p>
                </div>
                {row.locked && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-gray-50">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Mail className="w-3 h-3 flex-shrink-0" />
            To update locked fields, email{' '}
            <a href="mailto:support@globalmitra.com" className="text-[#2D6A4F] hover:underline font-semibold ml-0.5">
              support@globalmitra.com
            </a>
          </p>
        </div>
      </motion.div>

      {/* ══ SECTION 4: PROFILE STRENGTH ══ */}
      <motion.div {...stagger(4)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-[#2D6A4F]" />
          <h2 className="text-sm font-bold text-[#1B4332]">Profile Strength</h2>
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${
            completionPct === 100 ? 'bg-[#D8F3DC] text-[#1B4332]' :
            completionPct >= 66   ? 'bg-amber-50 text-amber-700'  :
                                    'bg-red-50 text-red-600'
          }`}>
            {completionPct}%
          </span>
        </div>

        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 1, delay: 0.5, ease: EASE }}
            className="h-full rounded-full"
            style={{ background: completionPct === 100 ? '#2D6A4F' : completionPct >= 66 ? '#52B788' : '#EAB308' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Profile photo',  done: !!guide.user?.photo },
            { label: 'Full name',      done: !!guide.user?.fullName },
            { label: 'Email',          done: !!guide.user?.email },
            { label: 'Phone number',   done: !!guide.user?.phoneNumber },
            { label: 'Bio',            done: !!guide.bio },
            { label: 'Address',        done: !!guide.user?.address },
          ].map((item) => (
            <div key={item.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                item.done ? 'bg-[#F0FBF4] text-[#2D6A4F]' : 'bg-gray-50 text-gray-400'
              }`}>
              {item.done
                ? <CheckCircle className="w-3.5 h-3.5 text-[#2D6A4F] flex-shrink-0" />
                : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
              }
              {item.label}
            </div>
          ))}
        </div>

        {missingFields.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-[#F0FBF4] border border-[#B7E4C7] flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-[#2D6A4F] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1B4332]">Complete your profile to attract more tourists</p>
              <p className="text-xs text-[#2D6A4F] mt-0.5 truncate">Missing: {missingFields.join(', ')}</p>
            </div>
            <button onClick={() => onNavigate('guide')}
              className="text-xs font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
              Fix →
            </button>
          </div>
        )}
      </motion.div>

    </div>
  );
}
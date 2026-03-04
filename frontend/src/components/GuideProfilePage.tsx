import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronLeft, BadgeCheck, Clock,
  Loader2, AlertCircle, CheckCircle, Save, X,
  Lock, Mail, Phone, LayoutDashboard, MapPin
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/services/api';
import { AvatarUpload } from '@/components/AvatarUpload';
import { GuideDashboardPage } from '@/components/GuideDashboardPage';

// Exact API shape from your response
interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  photo: string | null;     // full URL e.g. http://localhost:8005/media/...
  address: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface GuideData {
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
    const fe = Object.entries(data)
      .filter(([k]) => !['success'].includes(k))
      .flatMap(([, v]) => (Array.isArray(v) ? v : [String(v)]));
    if (fe.length) return fe.join(' ');
  }
  return err?.message || 'Something went wrong.';
}

// Unwraps any of these shapes:
//   { success, data: { id, user, licenseNumber, ... } }  ← your API
//   { id, user, licenseNumber, ... }                      ← if apiFetch unwraps
//   { guide: { ... } }                                    ← alternative key
function unwrapGuide(raw: any): GuideData | null {
  if (!raw) return null;
  // Try every known envelope layer
  const candidates = [
    raw?.data,
    raw?.guide,
    raw?.result,
    raw,
  ];
  for (const g of candidates) {
    // A valid guide object must have id AND a nested user object
    if (g && typeof g === 'object' && g.id && g.user) {
      return g as GuideData;
    }
  }
  // Last resort: if raw has id but no user, it might be a flat user response
  if (raw?.id && raw?.licenseNumber !== undefined) {
    return raw as GuideData;
  }
  console.warn('[unwrapGuide] could not find guide in response:', raw);
  return null;
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending Review', bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  dot: 'bg-amber-400',  icon: Clock      },
  VERIFIED: { label: 'Verified Guide', bg: 'bg-[#D0F0E4]', border: 'border-[#A8DFC8]', text: 'text-[#1A3D2B]',  dot: 'bg-[#3CA37A]', icon: BadgeCheck  },
  REJECTED: { label: 'Not Approved',  bg: 'bg-red-50',     border: 'border-red-200',   text: 'text-red-700',    dot: 'bg-red-400',   icon: X           },
};

interface GuideProfilePageProps {
  onNavigate: (view: string) => void;
}

export function GuideProfilePage({ onNavigate }: GuideProfilePageProps) {
  const authUser = useAuthStore((s) => s.user);
  const setUser  = useAuthStore((s) => s.setUser);

  const [guide,         setGuide]         = useState<GuideData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [fetchErr,      setFetchErr]      = useState('');
  const [toast,         setToast]         = useState('');
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const [editing,       setEditing]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [editErr,       setEditErr]       = useState('');
  const [draftFullName, setDraftFullName] = useState('');
  const [draftPhone,    setDraftPhone]    = useState('');
  const [draftAddress,  setDraftAddress]  = useState('');
  const [draftBio,      setDraftBio]      = useState('');

  if (authUser?.role !== 'GUIDE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Shield className="w-10 h-10 text-gray-300" />
        <p className="text-gray-500 text-sm">This page is only accessible to registered guides.</p>
      </div>
    );
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true); setFetchErr('');
      try {
        const raw = await apiFetch('/profile/guides/me') as any;
        if (import.meta.env.DEV) console.log('[GuideProfilePage] raw:', raw);
        const g = unwrapGuide(raw);
        if (!g) {
          console.error('[GuideProfilePage] unwrapGuide returned null. Raw response:', raw);
          throw new Error('Could not parse guide data from server response.');
        }
        setGuide(g);
        setPhotoUrl(g.user?.photo ?? null);
        resetDrafts(g);
      } catch (e: any) {
        setFetchErr(parseError(e));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const resetDrafts = (g: GuideData) => {
    setDraftFullName(g.user?.fullName    ?? '');
    setDraftPhone(   g.user?.phoneNumber ?? '');
    setDraftAddress( g.user?.address     ?? '');
    setDraftBio(     g.bio               ?? '');
  };

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleSave = async () => {
    setSaving(true); setEditErr('');
    try {
      const payload: Record<string, any> = {};
      if (draftBio.trim()      !== (guide?.bio                 ?? '')) payload.bio         = draftBio.trim();
      if (draftFullName.trim() !== (guide?.user?.fullName      ?? '')) payload.fullName    = draftFullName.trim();
      if (draftPhone.trim()    !== (guide?.user?.phoneNumber   ?? '')) payload.phoneNumber = draftPhone.trim();
      if (draftAddress.trim()  !== (guide?.user?.address       ?? '')) payload.address     = draftAddress.trim();

      if (Object.keys(payload).length === 0) { flash('Nothing to save.'); setEditing(false); return; }

      const raw = await apiFetch('/profile/guides/me', {
        method: 'PATCH', body: JSON.stringify(payload),
      }) as any;
      const updated = unwrapGuide(raw);
      if (!updated) {
          console.warn('[GuideProfilePage] PATCH response could not be parsed, re-fetching...');
          // Re-fetch to get fresh data instead of crashing
          const refetch = await apiFetch('/profile/guides/me') as any;
          const refetched = unwrapGuide(refetch);
          if (refetched) {
            setGuide(refetched);
            if (refetched.user?.photo) setPhotoUrl(refetched.user.photo);
          }
          setEditing(false); flash('Profile updated!');
          return;
        }

      setGuide((prev) => prev ? { ...prev, ...updated, user: { ...prev.user, ...updated.user } } : null);
      if (updated.user?.photo) setPhotoUrl(updated.user.photo);

      // Sync to authStore so Navbar reflects changes
      if (authUser) {
        (setUser as any)({
          ...authUser,
          fullName:    updated.user?.fullName    ?? authUser.fullName,
          photo:       updated.user?.photo       ?? authUser.photo,
          phoneNumber: updated.user?.phoneNumber,
          address:     updated.user?.address,
        });
      }
      setEditing(false); flash('Profile updated!');
    } catch (e: any) { setEditErr(parseError(e)); }
    finally { setSaving(false); }
  };

  const handleCancel = () => { if (guide) resetDrafts(guide); setEditing(false); setEditErr(''); };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#3CA37A] focus:ring-2 focus:ring-[#3CA37A]/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] transition-all placeholder-gray-400';
  const readonlyCls = 'w-full px-4 py-3 rounded-xl border border-gray-100 text-sm text-gray-500 bg-gray-50 cursor-not-allowed font-mono';

  if (loading) return <div className="flex items-center justify-center min-h-[70vh]"><Loader2 className="w-7 h-7 animate-spin text-[#3CA37A]" /></div>;
  if (fetchErr) return <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3"><AlertCircle className="w-10 h-10 text-red-400" /><p className="text-gray-500 text-sm">{fetchErr}</p></div>;
  if (!guide) return null;

  const sc            = STATUS_CONFIG[guide.verificationStatus] ?? STATUS_CONFIG.PENDING;
  const fullName      = guide.user?.fullName ?? authUser?.fullName ?? 'G';
  // API returns a full URL already — use directly (no resolving needed)
  const resolvedPhoto = photoUrl;

  // ── Dashboard: single back button here, no duplicate inside dashboard ──────
  if (showDashboard) {
    return (
      <div className="min-h-screen bg-[#F2F5F3] pt-[68px]">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-0">
          <button
            onClick={() => setShowDashboard(false)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#3CA37A] hover:text-[#2D8F6A] transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Profile
          </button>
        </div>
        <GuideDashboardPage
          onNavigate={(view: string) => {
            if (view === 'guide') setShowDashboard(false);
            else onNavigate(view);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 bg-white border border-[#A8DFC8] rounded-xl shadow-lg text-sm font-medium text-[#1A3D2B]"
          >
            <CheckCircle className="w-4 h-4 text-[#3CA37A]" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#F0FBF5] pt-[68px]">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          <button onClick={() => onNavigate('profile')}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#3CA37A] hover:text-[#2D8F6A] transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Profile
          </button>

          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-5">
              <AvatarUpload
                photoUrl={resolvedPhoto}
                fullName={fullName}
                size={88}
                onUploaded={async (url) => {
                  setPhotoUrl(url);
                  try {
                    const raw = await apiFetch('/profile/guides/me', {
                      method: 'PATCH', body: JSON.stringify({ photo: url }),
                    }) as any;
                    const updated    = unwrapGuide(raw);
                    const savedPhoto = updated?.user?.photo ?? url;
                    setGuide((prev) => prev ? { ...prev, user: { ...prev.user, photo: savedPhoto } } : prev);
                    setPhotoUrl(savedPhoto);
                    if (authUser) (setUser as any)({ ...authUser, photo: savedPhoto });
                    flash('Photo updated!');
                  } catch (err: any) { flash('Failed to save photo.'); console.error(err); }
                }}
              />

              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1A3D2B]">{fullName}</h1>
                <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <Mail className="w-3.5 h-3.5" />{guide.user?.email ?? authUser?.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D0F0E4] text-[#1A3D2B]">
                    <Shield className="w-3 h-3" /> Guide
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.border} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                  </span>
                </div>
                {guide.user?.phoneNumber && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5"><Phone className="w-3 h-3" />{guide.user.phoneNumber}</p>
                )}
                {guide.user?.address && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-1"><MapPin className="w-3 h-3" />{guide.user.address}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#A8DFC8] text-[#3CA37A] text-sm font-semibold hover:bg-[#D0F0E4] transition-colors">
                    Edit
                  </button>
                ) : (
                  <button onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
                <button onClick={() => setShowDashboard(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3CA37A] text-white text-sm font-semibold hover:bg-[#2D8F6A] transition-colors shadow-sm">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </button>
              </div>
            </div>
          </motion.div>

          {/* Edit Form */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 className="text-base font-bold text-[#1A3D2B] mb-5">Edit Profile</h2>
                {editErr && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{editErr}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input value={draftFullName} onChange={(e) => setDraftFullName(e.target.value)} placeholder="Your full name" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} placeholder="98XXXXXXXX" type="tel" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <input value={draftAddress} onChange={(e) => setDraftAddress(e.target.value)} placeholder="Kathmandu, Nepal" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                    <textarea value={draftBio} onChange={(e) => setDraftBio(e.target.value)} rows={4} maxLength={500}
                      placeholder="Explorer and adventure enthusiast..." className={inputCls + ' resize-none'} />
                    <p className="text-xs text-gray-400 text-right mt-1">{draftBio.length}/500</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      License Number
                      <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                        <Lock className="w-2.5 h-2.5" /> READ ONLY
                      </span>
                    </label>
                    <input value={guide.licenseNumber || '—'} readOnly className={readonlyCls} />
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" />To update, email{' '}
                      <a href="mailto:support@globalmitra.com" className="text-[#3CA37A] hover:underline font-medium ml-0.5">support@globalmitra.com</a>
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      License Issued By
                      <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                        <Lock className="w-2.5 h-2.5" /> READ ONLY
                      </span>
                    </label>
                    <input value={guide.licenseIssuedBy || '—'} readOnly
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm text-gray-500 bg-gray-50 cursor-not-allowed" />
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" />To update, email{' '}
                      <a href="mailto:support@globalmitra.com" className="text-[#3CA37A] hover:underline font-medium ml-0.5">support@globalmitra.com</a>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3CA37A] hover:bg-[#2D8F6A] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                  <button onClick={handleCancel}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="grid grid-cols-3 gap-3">
            {[
              { label: 'Reports Submitted', value: '12' },
              { label: 'Places Visited',    value: '28' },
              { label: 'Community Posts',   value: '45' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#1A3D2B]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* License card */}
          {!editing && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#3CA37A]" />
                <h2 className="text-sm font-bold text-[#1A3D2B]">License & Verification</h2>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-gray-500">License Number</span>
                  {guide.licenseNumber
                    ? <span className="text-sm font-mono font-semibold text-gray-800">{guide.licenseNumber}</span>
                    : <span className="text-xs italic text-gray-400">Not provided</span>}
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-gray-500">Issued By</span>
                  {guide.licenseIssuedBy
                    ? <span className="text-sm font-semibold text-gray-800">{guide.licenseIssuedBy}</span>
                    : <span className="text-xs italic text-gray-400">Not provided</span>}
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${sc.bg} ${sc.border} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                  </span>
                </div>
                {guide.bio && (
                  <div className="px-5 py-3.5">
                    <p className="text-sm text-gray-500 mb-1.5">Bio</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{guide.bio}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}
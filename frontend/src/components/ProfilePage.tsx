import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, MapPin,
  Edit2, Loader2, AlertCircle, CheckCircle,
  BadgeCheck, Trash2, Save, Shield, X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/services/api';
import { AvatarUpload } from '@/components/AvatarUpload';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  photo: string | null;
  address: string | null;
  role: 'TOURIST' | 'GUIDE' | 'ADMIN';
  verified: boolean;
  isActive: boolean;
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

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Account</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          This is <strong>permanent</strong>. All your data will be erased and cannot be recovered.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Yes, delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Role badge config — Admin / Guide / Traveler ──────────────────────────────
const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  GUIDE:   { label: 'Guide',    className: 'bg-[#D8F3DC] text-[#1B4332]'  },
  ADMIN:   { label: 'Admin',    className: 'bg-purple-100 text-purple-700' },
  TOURIST: { label: 'Traveler', className: 'bg-blue-50 text-blue-700'      },
};

// ── Main ProfilePage ──────────────────────────────────────────────────────────
interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const authUser    = useAuthStore((s) => s.user);
  const setUser     = useAuthStore((s) => s.setUser);
  const storeLogout = useAuthStore((s) => s.logout);
  const isGuide     = authUser?.role === 'GUIDE';

  const [profile,    setProfile]    = useState<UserProfile | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchErr,   setFetchErr]   = useState('');
  const [toast,      setToast]      = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editErr,    setEditErr]    = useState('');

  const [draftName,  setDraftName]  = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftAddr,  setDraftAddr]  = useState('');
  const [photoUrl,   setPhotoUrl]   = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true); setFetchErr('');
      try {
        const res = await apiFetch('/profile/users/me') as any;
        const u   = res?.data ?? res;
        setProfile(u);
        setPhotoUrl(u.photo ?? null);
        resetDrafts(u);
      } catch (e: any) {
        setFetchErr(parseError(e));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const resetDrafts = (u: UserProfile) => {
    setDraftName(u.fullName ?? '');
    setDraftPhone(u.phoneNumber ?? '');
    setDraftAddr(u.address ?? '');
  };

  const flash = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 2500);
  };

  // ── Save edits ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setEditErr('');
    try {
      const body: Record<string, string> = {};
      if (draftName.trim())  body.fullName    = draftName.trim();
      if (draftPhone.trim()) body.phoneNumber = draftPhone.trim();
      if (draftAddr.trim())  body.address     = draftAddr.trim();

      const res     = await apiFetch('/profile/users/me', { method: 'PATCH', body: JSON.stringify(body) }) as any;
      const updated = res?.data ?? res?.user ?? res;
      setProfile(updated);
      setUser({ ...authUser!, ...updated });
      setEditing(false);
      flash('Profile updated!');
    } catch (e: any) {
      setEditErr(parseError(e));
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (profile) resetDrafts(profile);
    setEditing(false); setEditErr('');
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch('/profile/users/me', { method: 'DELETE' });
      storeLogout();
      onNavigate('home');
    } catch (e: any) {
      flash('Delete failed: ' + parseError(e));
      setShowDelete(false);
    } finally { setDeleting(false); }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900
    bg-white focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20
    shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] transition-all placeholder-gray-400`;

  const readonlyCls = `w-full px-4 py-3 rounded-xl border border-gray-100 text-sm
    text-gray-500 bg-gray-50 cursor-not-allowed`;

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Loader2 className="w-7 h-7 animate-spin text-[#2D6A4F]" />
    </div>
  );

  if (fetchErr) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-gray-500 text-sm">{fetchErr}</p>
    </div>
  );

  if (!profile) return null;

  const roleBadge = ROLE_BADGE[profile.role] ?? ROLE_BADGE.TOURIST;

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 bg-white border border-[#B7E4C7] rounded-xl shadow-lg text-sm font-medium text-[#1B4332]"
          >
            <CheckCircle className="w-4 h-4 text-[#2D6A4F]" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {showDelete && <DeleteModal onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#F4F7F5] pt-[68px]">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

          {/* ── Profile Header Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-start gap-5">

              <AvatarUpload
                photoUrl={photoUrl}
                fullName={profile.fullName}
                size={88}
                onUploaded={(url) => {
                  setPhotoUrl(url);
                  setProfile((prev) => prev ? { ...prev, photo: url } : prev);
                  flash('Photo updated!');
                }}
              />

              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1B4332] leading-tight">{profile.fullName}</h1>
                <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {profile.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">

                  {/* Role badge: Admin → purple, Guide → green, Traveler → blue */}
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge.className}`}>
                    <Shield className="w-3 h-3" />
                    {roleBadge.label}
                  </span>

                  {profile.verified && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D8F3DC] text-[#2D6A4F]">
                      <BadgeCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {profile.address && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" /> {profile.address}
                    </span>
                  )}
                </div>
              </div>

              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#B7E4C7] text-[#2D6A4F] text-sm font-semibold hover:bg-[#D8F3DC] transition-colors flex-shrink-0">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <button onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Edit Form ── */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 className="text-base font-bold text-[#1B4332] mb-5">Edit Profile</h2>

                {editErr && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {editErr}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input value={draftName} onChange={(e) => setDraftName(e.target.value)}
                      placeholder="Your full name" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)}
                      placeholder="98XXXXXXXX" type="tel" className={inputCls} />
                    <p className="text-xs text-gray-400 mt-1">10 digits, no spaces</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <input value={draftAddr} onChange={(e) => setDraftAddr(e.target.value)}
                      placeholder="Kathmandu, Nepal" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">
                      Email <span className="text-xs text-gray-400">(cannot be changed)</span>
                    </label>
                    <input value={profile.email} readOnly className={readonlyCls} />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
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

          {/* ── Stats row ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: 'Reports Submitted', value: '12' },
              { label: 'Places Visited',    value: '28' },
              { label: 'Community Posts',   value: '45' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#1B4332]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* ── Guide Profile shortcut (only for guides) ── */}
          {isGuide && (
            <motion.button
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              onClick={() => onNavigate('guide')}
              className="w-full bg-white rounded-2xl border border-[#B7E4C7] shadow-sm p-4 flex items-center gap-4 hover:bg-[#F0FBF4] transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#D8F3DC] flex items-center justify-center flex-shrink-0 group-hover:bg-[#B7E4C7] transition-colors">
                <Shield className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1B4332]">Guide Profile</p>
                <p className="text-xs text-gray-400 mt-0.5">License, bio & verification status</p>
              </div>
              <span className="text-[#2D6A4F] text-xs font-semibold group-hover:translate-x-0.5 transition-transform">View →</span>
            </motion.button>
          )}

          {/* ── Danger zone ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-bold text-gray-800">Delete Account</p>
              <p className="text-xs text-gray-400 mt-0.5">Permanently remove your account and all data.</p>
            </div>
            <button onClick={() => setShowDelete(true)}
              className="flex-shrink-0 px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 hover:border-red-400 transition-all flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </motion.div>

        </div>
      </div>
    </>
  );
}
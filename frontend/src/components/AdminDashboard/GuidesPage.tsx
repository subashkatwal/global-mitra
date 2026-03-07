import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Plus, Check, X, Eye, Pencil, Trash2, Save,
  Loader2, Search, RefreshCw, Camera, AlertCircle, Copy,
} from 'lucide-react';
import { T, apiFetch, apiFetchForm, parseErr } from './utils';
import {
  Badge, Spinner, ErrMsg, Empty, Modal, FormField,
  inputCls, inputStyle, Confirm, Pagination, Table, Tr, Td, ActionBtn,
} from './ui';
import type { Guide, ToastFn } from './types';

// ─── helpers ─────────────────────────────────────────────────────────────────
function extractFieldErrors(e: any): Record<string, string> {
  const d = e?.data || e;
  const src = d?.errors ?? d ?? {};
  const out: Record<string, string> = {};
  if (typeof src !== 'object' || Array.isArray(src)) return out;
  for (const [k, v] of Object.entries(src)) {
    if (k === 'success') continue;
    out[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
  }
  return out;
}

const FieldErr = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}
    </p>
  ) : null;

const ErrBanner = ({ msg }: { msg: string }) =>
  msg ? (
    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
      <span>{msg}</span>
    </div>
  ) : null;

const inputErrCls = (hasErr: boolean) =>
  hasErr ? 'border-red-400 focus:ring-red-200' : '';

// ─── Copy ID ──────────────────────────────────────────────────────────────────
function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} title={id}
      className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border hover:bg-gray-100 transition-colors max-w-[96px]"
      style={{ color: T.textMuted, borderColor: T.borderSm }}>
      <Copy className="w-2.5 h-2.5 flex-shrink-0" />
      <span className="truncate">{copied ? 'Copied!' : id.slice(0, 8) + '…'}</span>
    </button>
  );
}

function normaliseGuide(raw: any): Guide {
  const nestedUser = raw.user ?? null;
  return {
    id:                 raw.id                 ?? '',
    licenseNumber:      raw.licenseNumber      ?? raw.license_number      ?? '',
    licenseIssuedBy:    raw.licenseIssuedBy    ?? raw.license_issued_by   ?? '',
    verificationStatus: raw.verificationStatus ?? raw.verification_status ?? 'PENDING',
    bio:                raw.bio                ?? '',
    createdAt:          raw.createdAt          ?? raw.created_at          ?? '',
user: {
      id:          nestedUser?.id   ?? raw.userId      ?? '',
      fullName:    nestedUser?.fullName    ?? raw.fullName ?? '',   
      email:       nestedUser?.email       ?? raw.email    ?? '',  
      photo:       nestedUser?.photo       ?? raw.userPhoto ?? null, 
      phoneNumber: nestedUser?.phoneNumber ?? raw.phoneNumber ?? '',
    },
  };
}


function PhotoPicker({ preview, onChange, name }: {
  preview: string | null;
  onChange: (file: File, url: string) => void;
  name?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => ref.current?.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 cursor-pointer group"
        style={{ borderColor: T.primary }}>
        {preview
          ? <img src={preview} alt="guide" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: T.primary }}>
              {name ? name.charAt(0).toUpperCase() : <Camera className="w-8 h-8" />}
            </div>}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-6 h-6 text-white" />
          <span className="text-white text-[10px] font-semibold mt-1">
            {preview ? 'Change' : 'Upload'}
          </span>
        </div>
      </div>
      <p className="text-[11px]" style={{ color: T.textMuted }}>Click to upload · JPG, PNG max 5 MB</p>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onChange(f, URL.createObjectURL(f));
        }} />
    </div>
  );
}

// Guide Form Modal
// CREATE: admin fills all user fields + guide fields → backend creates user then guide profile
// EDIT:   admin can edit ALL fields including licenseNumber, licenseIssuedBy, name, photo
function GuideFormModal({ guide, onClose, onSaved }: {
  guide?: Guide; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    // User fields
    fullName:        guide?.user?.fullName    ?? '',
    email:           guide?.user?.email       ?? '',
    phoneNumber:     guide?.user?.phoneNumber ?? '',
    password:        '',
    // Guide profile fields
    licenseNumber:   guide?.licenseNumber    ?? '',
    licenseIssuedBy: guide?.licenseIssuedBy  ?? '',
    bio:             guide?.bio              ?? '',
  });
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(guide?.user?.photo ?? null);
  const [saving,       setSaving]       = useState(false);
  const [globalErr,    setGlobalErr]    = useState('');
  const [fe,           setFe]           = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setFe(p => ({ ...p, [k]: '' }));
    setGlobalErr('');
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim())           errs.fullName        = 'Full name is required.';
    if (!guide) {
      // Create mode — email + password required
      if (!form.email.trim())            errs.email           = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                         errs.email           = 'Enter a valid email address.';
      if (!form.password)                errs.password        = 'Password is required.';
      else if (form.password.length < 8) errs.password        = 'Password must be at least 8 characters.';
    }
    if (form.phoneNumber && form.phoneNumber.replace(/\D/g, '').length > 10)
                                         errs.phoneNumber     = 'Phone number must be at most 10 digits.';
    if (!form.licenseNumber.trim())      errs.licenseNumber   = 'License number is required.';
    if (!form.licenseIssuedBy.trim())    errs.licenseIssuedBy = 'Issuing authority is required.';
    return errs;
  };

  const handleSubmit = async () => {
    setGlobalErr(''); setFe({});
    const clientErrs = validate();
    if (Object.keys(clientErrs).length) { setFe(clientErrs); return; }

    setSaving(true);
    try {
      if (guide) {
      
        if (photoFile) {
          const fd = new FormData();
          fd.append('fullName', form.fullName);
          if (form.phoneNumber) fd.append('phoneNumber', form.phoneNumber);
          fd.append('photo', photoFile);
          await apiFetchForm(`/profile/users/${guide.user!.id}`, 'PATCH', fd);
        } else {
          await apiFetch(`/profile/users/${guide.user!.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              fullName:    form.fullName,
              phoneNumber: form.phoneNumber || undefined,
            }),
          });
        }
      
        await apiFetch(`/profile/guides/${guide.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            licenseNumber:   form.licenseNumber,
            licenseIssuedBy: form.licenseIssuedBy,
            bio:             form.bio || undefined,
          }),
        });
      } else {
      

        let createdUserId: string;
        if (photoFile) {
          const fd = new FormData();
          fd.append('fullName',    form.fullName);
          fd.append('email',       form.email);
          fd.append('password',    form.password);
          fd.append('role',        'GUIDE');
          if (form.phoneNumber) fd.append('phoneNumber', form.phoneNumber);
          fd.append('photo', photoFile);
          const res = await apiFetchForm('/profile/users', 'POST', fd);
          createdUserId = res?.data?.id ?? res?.id;
        } else {
          const res = await apiFetch('/profile/users', {
            method: 'POST',
            body: JSON.stringify({
              fullName:    form.fullName,
              email:       form.email,
              password:    form.password,
              role:        'GUIDE',
              phoneNumber: form.phoneNumber || undefined,
            }),
          });
          createdUserId = res?.data?.id ?? res?.id;
        }

        if (!createdUserId) throw new Error('Failed to get created user ID from response.');

        // Step 2: create guide profile with the userId
        await apiFetch('/profile/guides/', {
          method: 'POST',
          body: JSON.stringify({
            userId:          createdUserId,
            licenseNumber:   form.licenseNumber,
            licenseIssuedBy: form.licenseIssuedBy,
            bio:             form.bio || undefined,
          }),
        });
      }
      onSaved();
    } catch (e: any) {
      const serverFe = extractFieldErrors(e);
      if (Object.keys(serverFe).length) setFe(serverFe);
      else setGlobalErr(parseErr(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={guide ? 'Edit Guide' : 'Add Guide'} onClose={onClose}>
      <ErrBanner msg={globalErr} />
      <div className="space-y-4">

        {/* Center photo picker */}
        <div className="py-2">
          <PhotoPicker preview={photoPreview} name={form.fullName}
            onChange={(f, url) => { setPhotoFile(f); setPhotoPreview(url); }} />
          <FieldErr msg={fe.photo} />
        </div>

        {/* Full Name — always editable */}
        <FormField label="Full Name" req>
          <input value={form.fullName} onChange={e => set('fullName', e.target.value)}
            placeholder="Guide's full name"
            className={`${inputCls} ${inputErrCls(!!fe.fullName)}`}
            style={fe.fullName ? {} : inputStyle} />
          <FieldErr msg={fe.fullName} />
        </FormField>

        {/* Email — only on create */}
        {!guide ? (
          <FormField label="Email" req>
            <input value={form.email} onChange={e => set('email', e.target.value)}
              type="email" placeholder="guide@example.com"
              className={`${inputCls} ${inputErrCls(!!fe.email)}`}
              style={fe.email ? {} : inputStyle} />
            <FieldErr msg={fe.email} />
          </FormField>
        ) : (
          <FormField label="Email">
            <input value={guide.user?.email ?? ''} readOnly
              className={`${inputCls} bg-gray-50 cursor-not-allowed text-gray-400`}
              style={inputStyle} />
            <p className="text-[11px] mt-1" style={{ color: T.textMuted }}>Email cannot be changed here</p>
          </FormField>
        )}

        {/* Phone */}
        <FormField label="Phone Number">
          <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
            placeholder="98XXXXXXXX (max 10 digits)"
            className={`${inputCls} ${inputErrCls(!!fe.phoneNumber)}`}
            style={fe.phoneNumber ? {} : inputStyle} />
          <FieldErr msg={fe.phoneNumber} />
        </FormField>

        {/* Password — create only */}
        {!guide && (
          <FormField label="Password" req>
            <input value={form.password} onChange={e => set('password', e.target.value)}
              type="password" placeholder="Minimum 8 characters"
              className={`${inputCls} ${inputErrCls(!!fe.password)}`}
              style={fe.password ? {} : inputStyle} />
            <FieldErr msg={fe.password} />
          </FormField>
        )}

        {/* License Number — editable in both modes */}
        <FormField label="License Number" req>
          <input value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)}
            placeholder="NTB-2024-001234"
            className={`${inputCls} ${inputErrCls(!!fe.licenseNumber)}`}
            style={fe.licenseNumber ? {} : inputStyle} />
          <FieldErr msg={fe.licenseNumber} />
        </FormField>

        {/* Issued By — editable in both modes */}
        <FormField label="Issued By" req>
          <input value={form.licenseIssuedBy} onChange={e => set('licenseIssuedBy', e.target.value)}
            placeholder="Nepal Tourism Board"
            className={`${inputCls} ${inputErrCls(!!fe.licenseIssuedBy)}`}
            style={fe.licenseIssuedBy ? {} : inputStyle} />
          <FieldErr msg={fe.licenseIssuedBy} />
        </FormField>

        {/* Bio */}
        <FormField label="Bio">
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
            rows={3} placeholder="Experienced trekking guide…"
            className={`${inputCls} resize-none ${inputErrCls(!!fe.bio)}`}
            style={fe.bio ? {} : inputStyle} />
          <FieldErr msg={fe.bio} />
        </FormField>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors"
          style={{ background: T.primary }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {guide ? 'Save Changes' : 'Add Guide'}
        </button>
        <button onClick={onClose}
          className="px-5 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          style={{ borderColor: T.border, color: T.textSub }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}


function GuideDetailModal({ guide, onClose, onAction }: {
  guide: Guide; onClose: () => void; onAction: () => void;
}) {
  const [acting,       setActing]       = useState(false);
  const [err,          setErr]          = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject,   setShowReject]   = useState(false);

  const act = async (newStatus: 'VERIFIED' | 'REJECTED') => {
    setActing(true); setErr('');
    try {
      const body: Record<string, string> = { verificationStatus: newStatus };
      if (newStatus === 'REJECTED' && rejectReason.trim())
        body.rejectionReason = rejectReason.trim();
      await apiFetch(`/profile/guides/${guide.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      onAction();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setActing(false); }
  };

  const rows: [string, string][] = [
    ['Guide ID',    guide.id],
    ['User ID',     guide.user?.id ?? '—'],
    ['Name',        guide.user?.fullName  ?? '—'],
    ['Email',       guide.user?.email     ?? '—'],
    ['Phone',       guide.user?.phoneNumber ?? '—'],
    ['License No.', guide.licenseNumber   ?? '—'],
    ['Issued By',   guide.licenseIssuedBy ?? '—'],
    ['Status',      guide.verificationStatus],
    ['Bio',         guide.bio             ?? '—'],
    ['Joined',      guide.createdAt ? new Date(guide.createdAt).toLocaleDateString() : '—'],
  ];

  const idFields = new Set(['Guide ID', 'User ID']);

  return (
    <Modal title="Guide Details" onClose={onClose}>
      {/* Photo */}
      <div className="flex justify-center mb-4">
        {guide.user?.photo
          ? <img src={guide.user.photo} alt={guide.user.fullName}
              className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: T.border }} />
          : <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: T.primary }}>
              {guide.user?.fullName?.charAt(0)?.toUpperCase() ?? 'G'}
            </div>}
      </div>

      <ErrBanner msg={err} />

      <div className="space-y-0 mb-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between py-2.5 border-b last:border-0"
            style={{ borderColor: T.borderSm }}>
            <span className="text-sm font-medium flex-shrink-0 w-28 mr-4" style={{ color: T.textSub }}>{k}</span>
            {idFields.has(k) && v !== '—'
              ? <CopyId id={v} />
              : <span className="text-sm text-right break-all flex-1 text-gray-700">{v}</span>}
          </div>
        ))}
      </div>

      {guide.verificationStatus === 'PENDING' && (
        <div className="space-y-3">
          {showReject && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: T.textSub }}>
                Rejection reason (optional)
              </label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                rows={2} placeholder="e.g. License expired or unverifiable"
                className={`${inputCls} resize-none text-sm`} style={inputStyle} />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => act('VERIFIED')} disabled={acting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: T.primary }}>
              {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Approve
            </button>
            {!showReject
              ? <button onClick={() => setShowReject(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              : <button onClick={() => act('REJECTED')} disabled={acting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60">
                  {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Confirm Reject
                </button>}
          </div>
        </div>
      )}
    </Modal>
  );
}

// Guides Page
export function GuidesPage({ toast }: { toast: ToastFn }) {
  const [guides,    setGuides]    = useState<Guide[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState('');
  const [tab,       setTab]       = useState<'all' | 'pending'>('all');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState<null | 'add' | 'edit' | 'view'>(null);
  const [selected,  setSelected]  = useState<Guide | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams({ page: String(page) });
      const data = await apiFetch(`/profile/guides/?${qs}`);
      const raw: any[] = data.results ?? data.data ?? (Array.isArray(data) ? data : []);
      const list = raw.map(normaliseGuide);

      const tabFiltered = tab === 'pending'
        ? list.filter(g => g.verificationStatus === 'PENDING') : list;

      const q = search.trim().toLowerCase();
      const searched = q
        ? tabFiltered.filter(g =>
            g.user?.fullName?.toLowerCase().includes(q)  ||
            g.user?.email?.toLowerCase().includes(q)     ||
            g.licenseNumber?.toLowerCase().includes(q)   ||
            g.licenseIssuedBy?.toLowerCase().includes(q) ||
            g.id?.toLowerCase().includes(q))
        : tabFiltered;

      setGuides(searched);
      setTotal(q || tab === 'pending' ? searched.length : (data.count ?? list.length));
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, [tab, page, search]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, newStatus: 'VERIFIED' | 'REJECTED') => {
    try {
      await apiFetch(`/profile/guides/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ verificationStatus: newStatus }),
      });
      toast(`Guide ${newStatus === 'VERIFIED' ? 'approved' : 'rejected'}!`, 'success');
      load();
    } catch (e: any) { toast(parseErr(e), 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/profile/guides/${id}`, { method: 'DELETE' });
      toast('Guide deleted.', 'success'); load();
    } catch (e: any) { toast(parseErr(e), 'error'); }
    setConfirmId(null);
  };

  const statusBadge = (s: string) =>
    s === 'VERIFIED' ? 'green' : s === 'REJECTED' ? 'red' : 'amber';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>Guide Verification</h1>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2.5 rounded-xl border hover:bg-[#D0F0E4] transition-colors" style={{ borderColor: T.border }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: T.textMid }} />
          </button>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90"
            style={{ background: T.primary }}>
            <Plus className="w-4 h-4" /> Add Guide
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2">
          {(['all', 'pending'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize
                ${tab === t ? 'text-white shadow-sm' : 'bg-white border hover:bg-[#D0F0E4]'}`}
              style={tab === t ? { background: T.primary } : { borderColor: T.border, color: T.textMid }}>
              {t === 'all' ? 'All Guides' : 'Pending'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textMuted }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, license…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-white text-sm outline-none focus:ring-2"
            style={{ borderColor: T.border }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        {loading ? <Spinner /> : err ? <ErrMsg msg={err} onRetry={load} /> :
         guides.length === 0 ? <Empty msg="No guides found." /> : (
          <>
            <Table headers={['', 'ID', 'Name / Email', 'License No.', 'Issued By', 'Status', 'Joined', 'Actions']}>
              {guides.map(g => (
                <Tr key={g.id}>
                  {/* Avatar */}
                  <td className="px-4 py-3 w-10">
                    {g.user?.photo
                      ? <img src={g.user.photo} alt={g.user?.fullName ?? 'guide'} className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: T.primary }}>
                          {g.user?.fullName?.charAt(0)?.toUpperCase() ?? 'G'}
                        </div>}
                  </td>
                  {/* Guide profile ID */}
                  <td className="px-4 py-3"><CopyId id={g.id} /></td>
                  {/* Name + email */}
                  <Td>
                    <p className="font-medium text-sm" style={{ color: T.textMain }}>
                      {g.user?.fullName || '—'}
                    </p>
                    {g.user?.email && (
                      <p className="text-xs" style={{ color: T.textMuted }}>{g.user.email}</p>
                    )}
                  </Td>
                  <Td mono>{g.licenseNumber || '—'}</Td>
                  <Td>{g.licenseIssuedBy || '—'}</Td>
                  <Td>
                    <Badge label={g.verificationStatus} variant={statusBadge(g.verificationStatus) as any} />
                  </Td>
                  <Td>{g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '—'}</Td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {g.verificationStatus === 'PENDING' && (
                        <>
                          <button onClick={() => handleStatusChange(g.id, 'VERIFIED')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors hover:bg-emerald-50"
                            style={{ borderColor: '#A7F3D0', color: '#047857' }}>
                            Approve
                          </button>
                          <button onClick={() => handleStatusChange(g.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors hover:bg-red-50"
                            style={{ borderColor: '#FECACA', color: '#B91C1C' }}>
                            Reject
                          </button>
                        </>
                      )}
                      <ActionBtn icon={Eye}    color={T.primary} title="View"   onClick={() => { setSelected(g); setModal('view'); }} />
                      <ActionBtn icon={Pencil} color="#6366F1"   title="Edit"   onClick={() => { setSelected(g); setModal('edit'); }} />
                      <ActionBtn icon={Trash2} color="#EF4444"   title="Delete" onClick={() => setConfirmId(g.id)} />
                    </div>
                  </td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>

      <AnimatePresence>
        {modal === 'add' && (
          <GuideFormModal onClose={() => setModal(null)}
            onSaved={() => { setModal(null); toast('Guide added!', 'success'); load(); }} />
        )}
        {modal === 'edit' && selected && (
          <GuideFormModal guide={selected} onClose={() => setModal(null)}
            onSaved={() => { setModal(null); toast('Guide updated!', 'success'); load(); }} />
        )}
        {modal === 'view' && selected && (
          <GuideDetailModal guide={selected} onClose={() => setModal(null)}
            onAction={() => { setModal(null); toast('Status updated!', 'success'); load(); }} />
        )}
        {confirmId && (
          <Confirm msg="Delete this guide profile? This cannot be undone."
            onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
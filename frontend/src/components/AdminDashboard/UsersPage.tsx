import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Eye, Pencil, Trash2, Save, Loader2, Camera, AlertCircle, Copy } from 'lucide-react';
import { T, apiFetch, apiFetchForm, parseErr } from './utils';
import {
  Badge, Spinner, ErrMsg, Empty, Modal, FormField,
  inputCls, inputStyle, Confirm, Pagination, Table, Tr, Td, ActionBtn,
} from './ui';
import type { User, ToastFn } from './types';

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
  msg ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}</p> : null;

const ErrBanner = ({ msg }: { msg: string }) =>
  msg ? (
    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
      <span>{msg}</span>
    </div>
  ) : null;

const inputErrCls = (hasErr: boolean) =>
  hasErr ? 'border-red-400 focus:ring-red-200' : '';


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

// Verified Toggle
function VerifiedToggle({ user, onToggleSuccess }: {
  user: User;
  onToggleSuccess: (id: string, v: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const isVerified = user.verified ?? false;
  const toggle = async () => {
    if (pending) return;
    setPending(true);
    try {
      await apiFetch(`/profile/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ verified: !isVerified }),
      });
      onToggleSuccess(user.id, !isVerified);
    } catch { /* silent */ }
    finally { setPending(false); }
  };
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={toggle} disabled={pending}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 ${isVerified ? 'bg-emerald-500' : 'bg-gray-300'}
          ${pending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}>
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`inline-block h-5 w-5 rounded-full bg-white shadow ring-0
            ${isVerified ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-xs font-medium whitespace-nowrap">
        {isVerified
          ? <span className="text-emerald-700">Verified</span>
          : <span className="text-gray-500">Unverified</span>}
      </span>
      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
    </div>
  );
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
          ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: T.primary }}>
              {name?.charAt(0)?.toUpperCase() ?? <Camera className="w-8 h-8" />}
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

function UserFormModal({ user, onClose, onSaved }: {
  user?: User; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName:    user?.fullName    ?? '',
    email:       user?.email       ?? '',
    role:        user?.role        ?? 'TOURIST',
    phoneNumber: user?.phoneNumber ?? '',
    password:    '',
  });
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photo ?? null);
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
    if (!form.fullName.trim())    errs.fullName = 'Full name may not be empty.';
    if (!form.email.trim())       errs.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                  errs.email    = 'Enter a valid email address.';
    if (!user && !form.password)  errs.password = 'Password is required.';
    else if (!user && form.password.length < 8)
                                  errs.password = 'Password must be at least 8 characters.';
    if (form.phoneNumber && form.phoneNumber.replace(/\D/g, '').length > 10)
                                  errs.phoneNumber = 'Phone number must be at most 10 digits.';
    return errs;
  };

  const handleSubmit = async () => {
    setGlobalErr(''); setFe({});
    const clientErrs = validate();
    if (Object.keys(clientErrs).length) { setFe(clientErrs); return; }
    setSaving(true);
    try {
      if (photoFile) {
        const fd = new FormData();
        fd.append('fullName',    form.fullName);
        fd.append('email',       form.email);
        fd.append('role',        form.role);
        if (form.phoneNumber)       fd.append('phoneNumber', form.phoneNumber);
        if (!user && form.password) fd.append('password',    form.password);
        fd.append('photo', photoFile);
        if (user) await apiFetchForm(`/profile/users/${user.id}`, 'PATCH', fd);
        else      await apiFetchForm('/profile/users', 'POST', fd);
      } else {
        const body: any = { fullName: form.fullName, email: form.email, role: form.role, phoneNumber: form.phoneNumber || undefined };
        if (!user) body.password = form.password;
        if (user) await apiFetch(`/profile/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        else      await apiFetch('/profile/users', { method: 'POST', body: JSON.stringify(body) });
      }
      onSaved();
    } catch (e: any) {
      const serverFe = extractFieldErrors(e);
      if (Object.keys(serverFe).length) setFe(serverFe);
      else setGlobalErr(parseErr(e));
    } finally { setSaving(false); }
  };

  return (
    <Modal title={user ? 'Edit User' : 'Add User'} onClose={onClose}>
      <ErrBanner msg={globalErr} />
      <div className="space-y-4">
        {/* Center photo picker */}
        <div className="py-2">
          <PhotoPicker preview={photoPreview} name={form.fullName}
            onChange={(f, url) => { setPhotoFile(f); setPhotoPreview(url); }} />
          <FieldErr msg={fe.photo} />
        </div>

        <FormField label="Full Name" req>
          <input value={form.fullName} onChange={e => set('fullName', e.target.value)}
            placeholder="Jane Doe"
            className={`${inputCls} ${inputErrCls(!!fe.fullName)}`}
            style={fe.fullName ? {} : inputStyle} />
          <FieldErr msg={fe.fullName} />
        </FormField>

        <FormField label="Email" req>
          <input value={form.email} onChange={e => set('email', e.target.value)}
            type="email" placeholder="jane@example.com"
            className={`${inputCls} ${inputErrCls(!!fe.email)}`}
            style={fe.email ? {} : inputStyle} />
          <FieldErr msg={fe.email} />
        </FormField>

        <FormField label="Phone Number">
          <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
            placeholder="98XXXXXXXX (max 10 digits)"
            className={`${inputCls} ${inputErrCls(!!fe.phoneNumber)}`}
            style={fe.phoneNumber ? {} : inputStyle} />
          <FieldErr msg={fe.phoneNumber} />
        </FormField>

        <FormField label="Role">
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className={inputCls} style={inputStyle}>
            <option value="TOURIST">Tourist</option>
            <option value="GUIDE">Guide</option>
            <option value="ADMIN">Admin</option>
          </select>
        </FormField>

        {!user && (
          <FormField label="Password" req>
            <input value={form.password} onChange={e => set('password', e.target.value)}
              type="password" placeholder="Minimum 8 characters"
              className={`${inputCls} ${inputErrCls(!!fe.password)}`}
              style={fe.password ? {} : inputStyle} />
            <FieldErr msg={fe.password} />
          </FormField>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors"
          style={{ background: T.primary }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {user ? 'Save Changes' : 'Add User'}
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


function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  const rows: [string, string][] = [
    ['ID',        user.id],
    ['Full Name', user.fullName],
    ['Email',     user.email],
    ['Role',      user.role],
    ['Phone',     user.phoneNumber || '—'],
    ['Verified',  user.verified ? 'Yes' : 'No'],
    ['Joined',    new Date(user.createdAt).toLocaleDateString()],
  ];
  return (
    <Modal title="User Details" onClose={onClose}>
      <div className="flex justify-center mb-5">
        {user.photo
          ? <img src={user.photo} alt={user.fullName}
              className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: T.border }} />
          : <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: T.primary }}>
              {user.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>}
      </div>
      <div className="space-y-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-2.5 border-b last:border-0"
            style={{ borderColor: T.borderSm }}>
            <span className="text-sm font-medium" style={{ color: T.textSub }}>{k}</span>
            {k === 'ID'
              ? <CopyId id={v} />
              : <span className="text-sm text-gray-700">{v}</span>}
          </div>
        ))}
      </div>
    </Modal>
  );
}


export function UsersPage({ toast }: { toast: ToastFn }) {
  const [users,     setUsers]     = useState<User[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState('');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState<null | 'add' | 'edit' | 'view'>(null);
  const [selected,  setSelected]  = useState<User | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const loadUsers = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
      const data = await apiFetch(`/profile/users?${qs}`);
      const items = data.results ?? data.data ?? (Array.isArray(data) ? data : []);
      setUsers(items);
      setTotal(data.count ?? items.length ?? 0);
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/profile/users/${id}`, { method: 'DELETE' });
      toast('User deleted.', 'success'); loadUsers();
    } catch (e: any) { toast(parseErr(e), 'error'); }
    setConfirmId(null);
  };

  const handleVerifiedToggle = (userId: string, newVerified: boolean) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: newVerified } : u));
    toast(`User ${newVerified ? 'verified' : 'unverified'}.`, 'success');
  };

  const roleBadge = (r: string) => r === 'ADMIN' ? 'red' : r === 'GUIDE' ? 'green' : 'blue';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>Users</h1>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90"
          style={{ background: T.primary }}>
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textMuted }} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm outline-none focus:ring-2"
          style={{ borderColor: T.border }} />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        {loading ? <Spinner /> : err ? <ErrMsg msg={err} onRetry={loadUsers} /> :
         users.length === 0 ? <Empty msg="No users found." /> : (
          <>
            <Table headers={['', 'ID', 'Name', 'Email', 'Role', 'Verified', 'Phone', 'Joined', 'Actions']}>
              {users.map(u => (
                <Tr key={u.id}>
                  <td className="px-4 py-3 w-10">
                    {u.photo
                      ? <img src={u.photo} alt={u.fullName} className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: T.primary }}>
                          {u.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>}
                  </td>
                  <td className="px-4 py-3"><CopyId id={u.id} /></td>
                  <Td><span className="font-medium">{u.fullName}</span></Td>
                  <Td>{u.email}</Td>
                  <Td><Badge label={u.role} variant={roleBadge(u.role) as any} /></Td>
                  <Td><VerifiedToggle user={u} onToggleSuccess={handleVerifiedToggle} /></Td>
                  <Td>{u.phoneNumber || '—'}</Td>
                  <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn icon={Eye}    color={T.primary} title="View"   onClick={() => { setSelected(u); setModal('view'); }} />
                      <ActionBtn icon={Pencil} color="#6366F1"   title="Edit"   onClick={() => { setSelected(u); setModal('edit'); }} />
                      <ActionBtn icon={Trash2} color="#EF4444"   title="Delete" onClick={() => setConfirmId(u.id)} />
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
          <UserFormModal onClose={() => setModal(null)}
            onSaved={() => { setModal(null); toast('User added!', 'success'); loadUsers(); }} />
        )}
        {modal === 'edit' && selected && (
          <UserFormModal user={selected} onClose={() => setModal(null)}
            onSaved={() => { setModal(null); toast('User updated!', 'success'); loadUsers(); }} />
        )}
        {modal === 'view' && selected && (
          <UserDetailModal user={selected} onClose={() => setModal(null)} />
        )}
        {confirmId && (
          <Confirm msg="Delete this user? This cannot be undone."
            onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
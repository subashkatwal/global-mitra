import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Eye, Pencil, Trash2, Save, Loader2 } from 'lucide-react';
import { T, apiFetch, parseErr } from './utils';
import {
  Badge,
  Spinner,
  ErrMsg,
  Empty,
  Modal,
  FormField,
  inputCls,
  inputStyle,
  Confirm,
  Pagination,
  Table,
  Tr,
  Td,
  ActionBtn,
} from './ui';
import type { User, ToastFn } from './types';

// ─── Verified Toggle Component ───────────────────────────────────────────────
function VerifiedToggle({
  user,
  onToggleSuccess,
}: {
  user: User;
  onToggleSuccess: (userId: string, newVerified: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const isVerified = user.isVerified ?? (user as any).isVerified ?? false;

  const handleToggle = async () => {
    if (pending) return;

    const newVerified = !isVerified;
    setPending(true);

    try {
      await apiFetch(`/profile/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ verified: newVerified }), 
      });

      onToggleSuccess(user.id, newVerified);
    } catch (err: any) {
      console.error('Failed to update verification:', parseErr(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
          ${isVerified ? 'bg-emerald-500' : 'bg-gray-300'}
          ${pending ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}
        `}
        title={isVerified ? 'Click to unverify' : 'Click to verify'}
      >
        <span className="sr-only">Toggle user verification</span>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full 
            bg-white shadow ring-0 transition-transform duration-200 ease-in-out
            ${isVerified ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>

      <span className="text-xs font-medium whitespace-nowrap">
        {isVerified ? (
          <span className="text-emerald-700">Verified</span>
        ) : (
          <span className="text-gray-500">Mark verified</span>
        )}
      </span>

      {pending && (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400 absolute -right-6" />
      )}
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user?: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    role: user?.role || 'TOURIST',
    phoneNumber: user?.phoneNumber || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.fullName || !form.email) {
      setErr('Full name and email are required.');
      return;
    }

    setSaving(true);
    setErr('');

    try {
      const body: any = {
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        phoneNumber: form.phoneNumber || undefined,
      };

      if (user) {
        await apiFetch(`/profile/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/profile/users', {
          method: 'POST',
          body: JSON.stringify({ ...body, password: form.password }),
        });
      }

      onSaved();
    } catch (e: any) {
      setErr(parseErr(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={user ? 'Edit User' : 'Add User'} onClose={onClose}>
      {err && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {err}
        </div>
      )}

      <div className="space-y-4">
        <FormField label="Full Name" req>
          <input
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Jane Doe"
            className={inputCls}
            style={inputStyle}
          />
        </FormField>

        <FormField label="Email" req>
          <input
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            type="email"
            placeholder="jane@example.com"
            className={inputCls}
            style={inputStyle}
          />
        </FormField>

        <FormField label="Phone">
          <input
            value={form.phoneNumber}
            onChange={(e) => set('phoneNumber', e.target.value)}
            placeholder="+977 98XXXXXXXX"
            className={inputCls}
            style={inputStyle}
          />
        </FormField>

        <FormField label="Role">
          <select
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            className={inputCls}
            style={inputStyle}
          >
            <option value="TOURIST">Tourist</option>
            <option value="GUIDE">Guide</option>
            <option value="ADMIN">Admin</option>
          </select>
        </FormField>

        {!user && (
          <FormField label="Password" req>
            <input
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              type="password"
              placeholder="Min 8 characters"
              className={inputCls}
              style={inputStyle}
            />
          </FormField>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors"
          style={{ background: T.primary }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {user ? 'Save Changes' : 'Add User'}
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          style={{ borderColor: T.border, color: T.textSub }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}


function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  const isVerified = user.isVerified ?? (user as any).isVerified ?? false;

  const rows = [
    ['Full Name', user.fullName],
    ['Email', user.email],
    ['Role', user.role],
    ['Phone', user.phoneNumber],
    ['Verified', isVerified ? 'Yes' : 'No'],
    ['Joined', new Date(user.createdAt).toLocaleDateString()],
  ];

  return (
    <Modal title="User Details" onClose={onClose}>
      <div className="space-y-0">
        {rows.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between py-2.5 border-b last:border-0"
            style={{ borderColor: T.borderSm }}
          >
            <span className="text-sm font-medium" style={{ color: T.textSub }}>
              {key}
            </span>
            <span className="text-sm text-gray-700">{value || '—'}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function UsersPage({ toast }: { toast: ToastFn }) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'view'>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErr('');

    try {
      const qs = new URLSearchParams({
        page: String(page),
        ...(search ? { search } : {}),
      });

      const data = await apiFetch(`/profile/users?${qs.toString()}`);
      const items = data.results ?? data.data ?? data ?? [];

      setUsers(Array.isArray(items) ? items : []);
      setTotal(data.count ?? items.length ?? 0);
    } catch (e: any) {
      setErr(parseErr(e));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/profile/users/${id}`, { method: 'DELETE' });
      toast('User deleted successfully', 'success');
      loadUsers();
    } catch (e: any) {
      toast(parseErr(e), 'error');
    }
    setConfirmId(null);
  };

 
  const handleVerifiedToggle = (userId: string, newVerified: boolean) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, verified: newVerified, isVerified: newVerified } : u
      )
    );
    toast(`User ${newVerified ? 'verified' : 'unverified'}`, 'success');
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'ADMIN') return 'red';
    if (role === 'GUIDE') return 'green';
    return 'blue';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>
          Users
        </h1>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: T.primary }}
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: T.textMuted }}
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm outline-none focus:ring-2"
          style={{ borderColor: T.border }}
        />
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-2xl border overflow-hidden shadow-sm"
        style={{ borderColor: T.border }}
      >
        {loading ? (
          <Spinner />
        ) : err ? (
          <ErrMsg msg={err} onRetry={loadUsers} />
        ) : users.length === 0 ? (
          <Empty msg="No users found." />
        ) : (
          <>
            <Table headers={['Name', 'Email', 'Role', 'Verified', 'Phone', 'Joined', 'Actions']}>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td>{u.fullName}</Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge label={u.role} variant={getRoleBadgeVariant(u.role) as any} />
                  </Td>
                  <Td>
                    <VerifiedToggle user={u} onToggleSuccess={handleVerifiedToggle} />
                  </Td>
                  <Td>{u.phoneNumber || '—'}</Td>
                  <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <ActionBtn
                        icon={Eye}
                        color={T.primary}
                        title="View"
                        onClick={() => {
                          setSelected(u);
                          setModal('view');
                        }}
                      />
                      <ActionBtn
                        icon={Pencil}
                        color="#6366F1"
                        title="Edit"
                        onClick={() => {
                          setSelected(u);
                          setModal('edit');
                        }}
                      />
                      <ActionBtn
                        icon={Trash2}
                        color="#EF4444"
                        title="Delete"
                        onClick={() => setConfirmId(u.id)}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>

            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              onPage={setPage}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'add' && (
          <UserFormModal
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              toast('User added successfully!', 'success');
              loadUsers();
            }}
          />
        )}

        {modal === 'edit' && selected && (
          <UserFormModal
            user={selected}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              toast('User updated successfully!', 'success');
              loadUsers();
            }}
          />
        )}

        {modal === 'view' && selected && (
          <UserDetailModal user={selected} onClose={() => setModal(null)} />
        )}

        {confirmId && (
          <Confirm
            msg="Are you sure you want to delete this user? This action cannot be undone."
            onConfirm={() => handleDelete(confirmId)}
            onCancel={() => setConfirmId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
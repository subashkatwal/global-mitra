import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Eye, Pencil, Trash2, Save, Loader2, Search, RefreshCw } from 'lucide-react';
import { T, apiFetch, parseErr } from './utils';
import { Badge, Spinner, ErrMsg, Empty, Modal, FormField, inputCls, inputStyle, Confirm, Pagination, Table, Tr, Td, ActionBtn } from './ui';
import type { Guide, ToastFn } from './types';

// ─── Normalise raw API guide → typed Guide ────────────────────────────────────
function normaliseGuide(raw: any): Guide {
  return {
    id:                 raw.id                ?? '',
    licenseNumber:      raw.licenseNumber      ?? raw.license_number      ?? '',
    licenseIssuedBy:    raw.licenseIssuedBy    ?? raw.license_issued_by   ?? '',
    verificationStatus: raw.verificationStatus ?? raw.verification_status ?? 'PENDING',
    bio:                raw.bio               ?? '',
    createdAt:          raw.createdAt         ?? raw.created_at           ?? '',
    user: {
      id:          raw.user?.id          ?? '',
      fullName:    raw.user?.fullName    ?? raw.user?.full_name    ?? '',
      email:       raw.user?.email       ?? '',
      phoneNumber: raw.user?.phoneNumber ?? raw.user?.phone_number ?? '',
    },
  };
}

// ─── Guide Form Modal ─────────────────────────────────────────────────────────
function GuideFormModal({
  guide,
  onClose,
  onSaved,
}: {
  guide?: Guide;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    userId:          '',
    licenseNumber:   guide?.licenseNumber    || '',
    licenseIssuedBy: guide?.licenseIssuedBy  || '',
    bio:             guide?.bio              || '',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true); setErr('');
    try {
      if (guide) {
        await apiFetch(`/profile/guides/${guide.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ bio: form.bio, licenseIssuedBy: form.licenseIssuedBy }),
        });
      } else {
        if (!form.userId)          { setErr('User ID is required.');        setSaving(false); return; }
        if (!form.licenseNumber)   { setErr('License number is required.'); setSaving(false); return; }
        if (!form.licenseIssuedBy) { setErr('License issuer is required.'); setSaving(false); return; }
        await apiFetch('/profile/guides/', {
          method: 'POST',
          body: JSON.stringify({
            userId:          form.userId,
            licenseNumber:   form.licenseNumber,
            licenseIssuedBy: form.licenseIssuedBy,
            bio:             form.bio,
          }),
        });
      }
      onSaved();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={guide ? 'Edit Guide' : 'Add Guide'} onClose={onClose}>
      {err && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>
      )}
      <div className="space-y-4">
        {!guide && (
          <FormField label="User ID (UUID)" req>
            <input
              value={form.userId}
              onChange={e => set('userId', e.target.value)}
              placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
              className={inputCls}
              style={inputStyle}
            />
          </FormField>
        )}
        {guide && (
          <FormField label="Guide Name">
            <input value={guide.user?.fullName || ''} readOnly className={inputCls + ' bg-gray-50 cursor-not-allowed'} style={inputStyle} />
          </FormField>
        )}
        <FormField label="License Number" req>
          <input
            value={form.licenseNumber}
            onChange={e => set('licenseNumber', e.target.value)}
            placeholder="NTB-2024-001234"
            className={inputCls + (guide ? ' bg-gray-50 cursor-not-allowed' : '')}
            style={inputStyle}
            readOnly={!!guide}
          />
        </FormField>
        <FormField label="Issued By" req>
          <input
            value={form.licenseIssuedBy}
            onChange={e => set('licenseIssuedBy', e.target.value)}
            placeholder="Nepal Tourism Board"
            className={inputCls}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Bio">
          <textarea
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            rows={3}
            placeholder="Experienced trekking guide..."
            className={inputCls + ' resize-none'}
            style={inputStyle}
          />
        </FormField>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: T.primary }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {guide ? 'Save Changes' : 'Add Guide'}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50" style={{ borderColor: T.border, color: T.textSub }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// ─── Guide Detail Modal ───────────────────────────────────────────────────────
function GuideDetailModal({
  guide,
  onClose,
  onAction,
}: {
  guide: Guide;
  onClose: () => void;
  onAction: () => void;
}) {
  const [acting,          setActing]          = useState(false);
  const [err,             setErr]             = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const act = async (newStatus: 'VERIFIED' | 'REJECTED') => {
    setActing(true); setErr('');
    try {
      const body: Record<string, string> = { verificationStatus: newStatus };
      if (newStatus === 'REJECTED' && rejectionReason.trim()) {
        body.rejection_reason = rejectionReason.trim();
      }
      await apiFetch(`/profile/guides/${guide.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      onAction();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setActing(false); }
  };

  const rows: [string, string][] = [
    ['Guide ID',    guide.id],
    ['User ID',     guide.user?.id        || '—'],
    ['Name',        guide.user?.fullName  || '—'],
    ['Email',       guide.user?.email     || '—'],
    ['Phone',       guide.user?.phoneNumber || '—'],
    ['License No.', guide.licenseNumber   || '—'],
    ['Issued By',   guide.licenseIssuedBy || '—'],
    ['Status',      guide.verificationStatus],
    ['Bio',         guide.bio             || '—'],
    ['Created',     guide.createdAt ? new Date(guide.createdAt).toLocaleDateString() : '—'],
  ];

  return (
    <Modal title="Guide Details" onClose={onClose}>
      {err && <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
      <div className="space-y-0 mb-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between py-2.5 border-b last:border-0" style={{ borderColor: T.borderSm }}>
            <span className="text-sm font-medium flex-shrink-0 mr-4 w-28" style={{ color: T.textSub }}>{k}</span>
            <span
              className={`text-sm text-right break-all flex-1 ${k.includes('ID') ? 'font-mono text-xs text-gray-500 select-all' : 'text-gray-700'}`}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      {guide.verificationStatus === 'PENDING' && (
        <div className="space-y-3">
          {showRejectInput && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: T.textSub }}>Rejection reason (optional)</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="e.g. License expired or unverifiable"
                className={inputCls + ' resize-none text-sm'}
                style={inputStyle}
              />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => act('VERIFIED')} disabled={acting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: T.primary }}
            >
              {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
            </button>
            {!showRejectInput ? (
              <button onClick={() => setShowRejectInput(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600">
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            ) : (
              <button onClick={() => act('REJECTED')} disabled={acting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60">
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Confirm Reject
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Guides Page ──────────────────────────────────────────────────────────────
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

      // Tab filter
      const tabFiltered = tab === 'pending'
        ? list.filter(g => g.verificationStatus === 'PENDING')
        : list;

      // Client-side search
      const q = search.trim().toLowerCase();
      const searched = q
        ? tabFiltered.filter(g =>
            g.user?.fullName?.toLowerCase().includes(q)   ||
            g.user?.email?.toLowerCase().includes(q)      ||
            g.licenseNumber?.toLowerCase().includes(q)    ||
            g.id?.toLowerCase().includes(q)
          )
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>Guide Verification</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border hover:bg-[#D0F0E4]" style={{ borderColor: T.border }} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: T.textMid }} />
          </button>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90"
            style={{ background: T.primary }}
          >
            <Plus className="w-4 h-4" /> Add Guide
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2">
          {(['all', 'pending'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'text-white shadow-sm' : 'bg-white border hover:bg-[#D0F0E4]'}`}
              style={tab === t ? { background: T.primary } : { borderColor: T.border, color: T.textMid }}
            >
              {t === 'all' ? 'All Guides' : 'Pending'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textMuted }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email or license…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-white text-sm outline-none focus:ring-2"
            style={{ borderColor: T.border }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        {loading ? <Spinner /> :
         err     ? <ErrMsg msg={err} onRetry={load} /> :
         guides.length === 0 ? <Empty msg="No guides found." /> : (
          <>
            <Table headers={['ID', 'Name', 'License Number', 'Issued By', 'Status', 'Created', 'Actions']}>
              {guides.map(g => (
                <Tr key={g.id}>
                  {/* ID — truncated, click to copy full */}
                  <Td>
                    <span
                      className="font-mono text-xs text-gray-400 cursor-pointer hover:text-gray-700 transition-colors"
                      title={`Click to copy: ${g.id}`}
                      onClick={() => navigator.clipboard?.writeText(g.id)}
                    >
                      {g.id ? g.id.slice(0, 8) + '…' : '—'}
                    </span>
                  </Td>
                  {/* Name + email stacked */}
                  <Td>
                    <div>
                      <p className="font-medium text-sm" style={{ color: T.textMain }}>
                        {g.user?.fullName || '—'}
                      </p>
                      {g.user?.email && (
                        <p className="text-xs" style={{ color: T.textMuted }}>{g.user.email}</p>
                      )}
                    </div>
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
                          <button
                            onClick={() => handleStatusChange(g.id, 'VERIFIED')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors hover:bg-emerald-50"
                            style={{ borderColor: '#A7F3D0', color: '#047857' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(g.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors hover:bg-red-50"
                            style={{ borderColor: '#FECACA', color: '#B91C1C' }}
                          >
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

      {/* Modals */}
      <AnimatePresence>
        {modal === 'add' && (
          <GuideFormModal onClose={() => setModal(null)} onSaved={() => { setModal(null); toast('Guide added!', 'success'); load(); }} />
        )}
        {modal === 'edit' && selected && (
          <GuideFormModal guide={selected} onClose={() => setModal(null)} onSaved={() => { setModal(null); toast('Guide updated!', 'success'); load(); }} />
        )}
        {modal === 'view' && selected && (
          <GuideDetailModal guide={selected} onClose={() => setModal(null)} onAction={() => { setModal(null); toast('Status updated!', 'success'); load(); }} />
        )}
        {confirmId && (
          <Confirm msg="Delete this guide profile? This cannot be undone." onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
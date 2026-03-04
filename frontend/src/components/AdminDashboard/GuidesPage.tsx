import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Eye, Pencil, Trash2, Save, Loader2 } from 'lucide-react';
import { T, apiFetch, parseErr } from './utils';
import { Badge, Spinner, ErrMsg, Empty, Modal, FormField, inputCls, inputStyle, Confirm, Pagination, Table, Tr, Td, ActionBtn } from './ui';
import type { Guide, ToastFn } from './types';

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
    fullName:        guide?.user?.fullName    || '',
    licenseNumber:   guide?.licenseNumber    || '',
    licenseIssuedBy: guide?.licenseIssuedBy  || '',
    bio:             guide?.bio              || '',
    phoneNumber:     '',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.licenseNumber || !form.licenseIssuedBy) {
      setErr('License number and issuer are required.'); return;
    }
    setSaving(true); setErr('');
    try {
      if (guide) {
        await apiFetch(`/profile/guides/${guide.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ bio: form.bio, licenseIssuedBy: form.licenseIssuedBy }),
        });
      } else {
        await apiFetch('/profile/guides/', {
          method: 'POST',
          body: JSON.stringify({
            fullName:        form.fullName,
            licenseNumber:   form.licenseNumber,
            licenseIssuedBy: form.licenseIssuedBy,
            bio:             form.bio,
            phoneNumber:     form.phoneNumber,
          }),
        });
      }
      onSaved();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={guide ? 'Edit Guide' : 'Add Guide'} onClose={onClose}>
      {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
      <div className="space-y-4">
        {!guide && (
          <FormField label="Full Name" req>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Raj Sharma" className={inputCls} style={inputStyle} />
          </FormField>
        )}
        <FormField label="License Number" req>
          <input value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="NTB-2024-001234" className={inputCls} style={inputStyle} readOnly={!!guide} />
        </FormField>
        <FormField label="Issued By" req>
          <input value={form.licenseIssuedBy} onChange={e => set('licenseIssuedBy', e.target.value)} placeholder="Nepal Tourism Board" className={inputCls} style={inputStyle} />
        </FormField>
        <FormField label="Bio">
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Experienced trekking guide..." className={inputCls + ' resize-none'} style={inputStyle} />
        </FormField>
        {!guide && (
          <FormField label="Phone">
            <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+977 98XXXXXXXX" className={inputCls} style={inputStyle} />
          </FormField>
        )}
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
  const [acting, setActing] = useState(false);
  const [err,    setErr]    = useState('');

  const act = async (action: 'approve' | 'reject') => {
    setActing(true); setErr('');
    try {
      await apiFetch(`/auth/guides/${guide.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      onAction();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setActing(false); }
  };

  const rows = [
    ['Name',           guide.user?.fullName],
    ['Email',          guide.user?.email],
    ['License Number', guide.licenseNumber],
    ['Issued By',      guide.licenseIssuedBy],
    ['Bio',            guide.bio],
    ['Created',        new Date(guide.createdAt).toLocaleDateString()],
  ];

  return (
    <Modal title="Guide Details" onClose={onClose}>
      {err && <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
      <div className="space-y-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between py-2.5 border-b last:border-0" style={{ borderColor: T.borderSm }}>
            <span className="text-sm font-medium flex-shrink-0 mr-4" style={{ color: T.textSub }}>{k}</span>
            <span className="text-sm text-gray-700 text-right">{v || '—'}</span>
          </div>
        ))}
      </div>

      {guide.verificationStatus === 'PENDING' && (
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => act('approve')}
            disabled={acting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: T.primary }}
          >
            {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Approve
          </button>
          <button
            onClick={() => act('reject')}
            disabled={acting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
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
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState<null | 'add' | 'edit' | 'view'>(null);
  const [selected,  setSelected]  = useState<Guide | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const endpoint = tab === 'pending' ? '/auth/guides/pending' : '/auth/guides';
      const qs = new URLSearchParams({ page: String(page) });
      const data = await apiFetch(`${endpoint}?${qs}`);
      const items = data.results ?? data.data ?? data ?? [];
      setGuides(Array.isArray(items) ? items : []);
      setTotal(data.count ?? items.length);
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiFetch(`/auth/guides/${id}/approve`, { method: 'POST', body: JSON.stringify({ action }) });
      toast(`Guide ${action}d!`, 'success'); load();
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
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90"
          style={{ background: T.primary }}
        >
          <Plus className="w-4 h-4" /> Add Guide
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
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

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        {loading  ? <Spinner /> :
         err      ? <ErrMsg msg={err} onRetry={load} /> :
         guides.length === 0 ? <Empty msg="No guides found." /> : (
          <>
            <Table headers={['Name', 'License Number', 'Issued By', 'Status', 'Created', 'Actions']}>
              {guides.map(g => (
                <Tr key={g.id}>
                  <Td>{g.user?.fullName}</Td>
                  <Td mono>{g.licenseNumber}</Td>
                  <Td>{g.licenseIssuedBy}</Td>
                  <Td><Badge label={g.verificationStatus} variant={statusBadge(g.verificationStatus) as any} /></Td>
                  <Td>{new Date(g.createdAt).toLocaleDateString()}</Td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {g.verificationStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(g.id, 'approve')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors hover:bg-emerald-50"
                            style={{ borderColor: '#A7F3D0', color: '#047857' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprove(g.id, 'reject')}
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

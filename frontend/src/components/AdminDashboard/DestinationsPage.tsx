import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Upload, Save, Loader2, RefreshCw } from 'lucide-react';
import { T, apiFetch, apiFetchMultipart, parseErr } from './utils';
import { Badge, Spinner, ErrMsg, Empty, Modal, FormField, inputCls, inputStyle, Confirm, Pagination, Table, Tr, Td, ActionBtn } from './ui';
import type { Destination, ToastFn } from './types';

function DestinationFormModal({
  dest,
  onClose,
  onSaved,
}: {
  dest?: Destination;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name:        dest?.name        || '',
    district:    dest?.district    || '',
    difficulty:  dest?.difficulty  || 'Easy',
    averageCost: String(dest?.averageCost || ''),
    altitude:    String(dest?.altitude    || ''),
    description: dest?.description || '',
    bestSeason:  dest?.bestSeason  || '',
    duration:    dest?.duration    || '',
    country:     dest?.country     || 'Nepal',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.district) { setErr('Name and district are required.'); return; }
    setSaving(true); setErr('');
    try {
      const body = {
        ...form,
        averageCost: Number(form.averageCost) || 0,
        altitude:    Number(form.altitude)    || undefined,
      };
      if (dest) await apiFetch(`/destinations/${dest.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else      await apiFetch('/destinations',             { method: 'POST',  body: JSON.stringify(body) });
      onSaved();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={dest ? 'Edit Destination' : 'Add Destination'} onClose={onClose}>
      {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Name" req>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Everest Base Camp" className={inputCls} style={inputStyle} />
          </FormField>
          <FormField label="District" req>
            <input value={form.district} onChange={e => set('district', e.target.value)} placeholder="Solukhumbu" className={inputCls} style={inputStyle} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Difficulty">
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={inputCls} style={inputStyle}>
              {['Easy', 'Moderate', 'Hard', 'Extreme'].map(d => <option key={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Country">
            <input value={form.country} onChange={e => set('country', e.target.value)} className={inputCls} style={inputStyle} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Cost/day (Rs)">
            <input value={form.averageCost} onChange={e => set('averageCost', e.target.value)} type="number" placeholder="5000" className={inputCls} style={inputStyle} />
          </FormField>
          <FormField label="Altitude (m)">
            <input value={form.altitude} onChange={e => set('altitude', e.target.value)} type="number" placeholder="5364" className={inputCls} style={inputStyle} />
          </FormField>
        </div>

        <FormField label="Best Season">
          <input value={form.bestSeason} onChange={e => set('bestSeason', e.target.value)} placeholder="March–May, Sep–Nov" className={inputCls} style={inputStyle} />
        </FormField>
        <FormField label="Duration">
          <input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="12–16 days" className={inputCls} style={inputStyle} />
        </FormField>
        <FormField label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={inputCls + ' resize-none'} style={inputStyle} />
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
          {dest ? 'Save Changes' : 'Add Destination'}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50" style={{ borderColor: T.border, color: T.textSub }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function BulkUploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [file,      setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err,       setErr]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) { setErr('Please select a file.'); return; }
    setUploading(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetchMultipart('/destinations/destinations/bulk-upload', fd);
      if (!res.ok) throw await res.json();
      onSaved();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setUploading(false); }
  };

  return (
    <Modal title="Bulk Upload Destinations" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Upload a CSV or JSON file with destination data.</p>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-[#F0FBF5] transition-colors"
          style={{ borderColor: T.border }}
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: T.textMuted }} />
          {file
            ? <p className="text-sm font-medium" style={{ color: T.primary }}>{file.name}</p>
            : <p className="text-sm text-gray-400">Click to select CSV or JSON file</p>}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>
        {err && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: T.primary }}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload
        </button>
        <button onClick={onClose} className="px-5 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50" style={{ borderColor: T.border, color: T.textSub }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function DestinationsPage({ toast }: { toast: ToastFn }) {
  const [dests,     setDests]     = useState<Destination[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState('');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState<null | 'add' | 'edit' | 'bulk'>(null);
  const [selected,  setSelected]  = useState<Destination | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
      const data = await apiFetch(`/destinations?${qs}`);
      const items = data.results ?? data.data ?? data ?? [];
      setDests(Array.isArray(items) ? items : []);
      setTotal(data.count ?? items.length);
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/destinations/${id}`, { method: 'DELETE' });
      toast('Destination deleted.', 'success'); load();
    } catch (e: any) { toast(parseErr(e), 'error'); }
    setConfirmId(null);
  };

  const diffBadge = (d: string): 'green' | 'amber' | 'red' | 'gray' =>
    d === 'Easy' ? 'green' : d === 'Moderate' ? 'amber' : d === 'Hard' ? 'red' : 'gray';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>Destinations</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={load} className="p-2.5 rounded-xl border hover:bg-[#D0F0E4]" style={{ borderColor: T.border }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: T.textMid }} />
          </button>
          <button
            onClick={() => setModal('bulk')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold hover:bg-[#D0F0E4] transition-colors"
            style={{ borderColor: T.border, color: T.textMid }}
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
            style={{ background: T.primary }}
          >
            <Plus className="w-4 h-4" /> Add Destination
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textMuted }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search destinations..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm outline-none focus:ring-2"
          style={{ borderColor: T.border }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        {loading ? <Spinner /> :
         err     ? <ErrMsg msg={err} onRetry={load} /> :
         dests.length === 0 ? <Empty msg="No destinations found." /> : (
          <>
            <Table headers={['Name', 'District', 'Difficulty', 'Cost (Rs/day)', 'Altitude (m)', 'Actions']}>
              {dests.map(d => (
                <Tr key={d.id}>
                  <Td><span className="font-semibold">{d.name}</span></Td>
                  <Td>{d.district}</Td>
                  <Td><Badge label={d.difficulty} variant={diffBadge(d.difficulty)} /></Td>
                  <Td>{d.averageCost ? `Rs ${d.averageCost.toLocaleString()}` : '—'}</Td>
                  <Td>{d.altitude}</Td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn icon={Pencil} color="#6366F1" title="Edit"   onClick={() => { setSelected(d); setModal('edit'); }} />
                      <ActionBtn icon={Trash2} color="#EF4444" title="Delete" onClick={() => setConfirmId(d.id)} />
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
          <DestinationFormModal onClose={() => setModal(null)} onSaved={() => { setModal(null); toast('Destination added!', 'success'); load(); }} />
        )}
        {modal === 'edit' && selected && (
          <DestinationFormModal dest={selected} onClose={() => setModal(null)} onSaved={() => { setModal(null); toast('Destination updated!', 'success'); load(); }} />
        )}
        {modal === 'bulk' && (
          <BulkUploadModal onClose={() => setModal(null)} onSaved={() => { setModal(null); toast('Bulk upload successful!', 'success'); load(); }} />
        )}
        {confirmId && (
          <Confirm msg="Delete this destination?" onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

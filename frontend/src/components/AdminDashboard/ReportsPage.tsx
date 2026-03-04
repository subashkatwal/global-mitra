import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Eye, Trash2, RefreshCw } from 'lucide-react';
import { T, apiFetch, parseErr } from './utils';
import { Badge, Spinner, ErrMsg, Empty, Modal, Confirm, Pagination, Table, Tr, Td, ActionBtn } from './ui';
import type { Report, ToastFn } from './types';

// ─── Report Detail Modal ──────────────────────────────────────────────────────
function ReportDetailModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const rows = [
    ['Type',      report.type],
    ['Title',     report.title],
    ['Place',     report.place],
    ['Reporter',  report.reporter?.fullName],
    ['Status',    report.status],
    ['Submitted', new Date(report.createdAt).toLocaleDateString()],
  ];
  return (
    <Modal title="Report Details" onClose={onClose}>
      <div className="space-y-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between py-2.5 border-b last:border-0" style={{ borderColor: '#D0F0E4' }}>
            <span className="text-sm font-medium flex-shrink-0 mr-4" style={{ color: '#4A7A62' }}>{k}</span>
            <span className="text-sm text-gray-700 text-right">{v || '—'}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
export function ReportsPage({ toast }: { toast: ToastFn }) {
  const [reports,   setReports]   = useState<Report[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState('');
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState<Report | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const data = await apiFetch(`/reports?page=${page}`);
      const items = data.results ?? data.data ?? data ?? [];
      setReports(Array.isArray(items) ? items : []);
      setTotal(data.count ?? items.length);
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/reports/${id}`, { method: 'DELETE' });
      toast('Report deleted.', 'success'); load();
    } catch (e: any) { toast(parseErr(e), 'error'); }
    setConfirmId(null);
  };

  const typeBadge = (t: string): 'red' | 'amber' | 'blue' =>
    t?.toLowerCase().includes('emergency') ? 'red' :
    t?.toLowerCase().includes('status')    ? 'amber' : 'blue';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>Safety Reports</h1>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border hover:bg-[#D0F0E4] transition-colors"
          style={{ borderColor: T.border }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: T.textMid }} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        {loading  ? <Spinner /> :
         err      ? <ErrMsg msg={err} onRetry={load} /> :
         reports.length === 0 ? <Empty msg="No reports found." /> : (
          <>
            <Table headers={['Type', 'Title', 'Place', 'Reporter', 'Status', 'Submitted', 'Actions']}>
              {reports.map(r => (
                <Tr key={r.id} onClick={() => setSelected(r)}>
                  <Td><Badge label={r.type || 'Report'} variant={typeBadge(r.type)} /></Td>
                  <Td><span className="font-semibold">{r.title}</span></Td>
                  <Td>{r.place}</Td>
                  <Td>{r.reporter?.fullName}</Td>
                  <Td>
                    {r.status
                      ? <Badge label={r.status} variant={r.status === 'Verified' ? 'green' : 'gray'} />
                      : '—'}
                  </Td>
                  <Td>{new Date(r.createdAt).toLocaleDateString()}</Td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn icon={Eye}    color={T.primary} title="View"   onClick={() => setSelected(r)} />
                      <ActionBtn icon={Trash2} color="#EF4444"   title="Delete" onClick={() => setConfirmId(r.id)} />
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
        {selected  && <ReportDetailModal report={selected} onClose={() => setSelected(null)} />}
        {confirmId && <Confirm msg="Delete this report?" onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />}
      </AnimatePresence>
    </div>
  );
}

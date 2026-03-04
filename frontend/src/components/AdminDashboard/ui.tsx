import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, AlertCircle, CheckCircle, XCircle,
  Search, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { T } from './utils';

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray';
const BADGE_CLS: Record<BadgeVariant, string> = {
  green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100   text-amber-700   border-amber-200',
  red:   'bg-red-100     text-red-700     border-red-200',
  blue:  'bg-blue-100    text-blue-700    border-blue-200',
  gray:  'bg-gray-100    text-gray-600    border-gray-200',
};

export const Badge = ({ label, variant }: { label: string; variant: BadgeVariant }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${BADGE_CLS[variant]}`}>
    {label}
  </span>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="w-7 h-7 animate-spin" style={{ color: T.primary }} />
  </div>
);

// ─── Error message ────────────────────────────────────────────────────────────
export const ErrMsg = ({ msg, onRetry }: { msg: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <AlertCircle className="w-10 h-10 text-red-400" />
    <p className="text-gray-500 text-sm text-center max-w-xs">{msg}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-1 px-4 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: T.primary }}
      >
        Retry
      </button>
    )}
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
export const Empty = ({ msg }: { msg: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-2">
    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: T.borderSm }}>
      <Search className="w-6 h-6" style={{ color: T.textMid }} />
    </div>
    <p className="text-sm" style={{ color: T.textMuted }}>{msg}</p>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border"
        style={{ borderColor: T.border }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10"
          style={{ borderColor: T.borderSm }}
        >
          <h3 className="text-base font-bold" style={{ color: T.textMain }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────
export const inputCls =
  'w-full px-3 py-2.5 rounded-xl border text-sm bg-white transition-all outline-none focus:ring-2';
export const inputStyle = { borderColor: T.border };

export const FormField = ({
  label,
  req,
  children,
}: {
  label: string;
  req?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium" style={{ color: T.textMain }}>
      {label}
      {req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium ${
        type === 'success'
          ? 'bg-white border-emerald-200 text-emerald-800'
          : 'bg-white border-red-200 text-red-700'
      }`}
    >
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        : <XCircle    className="w-4 h-4 text-red-500    flex-shrink-0" />}
      {msg}
    </motion.div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
export function Confirm({
  msg,
  onConfirm,
  onCancel,
}: {
  msg: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border"
        style={{ borderColor: T.border }}
      >
        <p className="text-sm font-medium text-gray-700 mb-4">{msg}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold border hover:bg-gray-50 transition-colors"
            style={{ borderColor: T.border, color: T.textSub }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-sm" style={{ borderColor: T.borderSm }}>
      <span style={{ color: T.textMuted }}>
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-30 transition-colors"
          style={{ borderColor: T.border }}
        >
          <ChevronLeft  className="w-4 h-4" style={{ color: T.textMid }} />
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-30 transition-colors"
          style={{ borderColor: T.border }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: T.textMid }} />
        </button>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: T.border }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'linear-gradient(90deg, #2D8F6A, #3CA37A)' }}>
            {headers.map(h => (
              <th
                key={h}
                className="px-4 py-3 text-left text-white font-semibold text-xs uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D0F0E4]">{children}</tbody>
      </table>
    </div>
  );
}

export const Tr = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <tr
    onClick={onClick}
    className={`hover:bg-[#F0FBF5] transition-colors ${onClick ? 'cursor-pointer' : ''}`}
  >
    {children}
  </tr>
);

export const Td = ({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) => (
  <td className={`px-4 py-3 text-gray-700 ${mono ? 'font-mono text-xs' : ''}`}>
    {children ?? '—'}
  </td>
);

// ─── Icon action button ───────────────────────────────────────────────────────
export const ActionBtn = ({
  icon: Icon,
  color,
  onClick,
  title,
}: {
  icon: any;
  color: string;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
}) => (
  <button
    title={title}
    onClick={e => { e.stopPropagation(); onClick(e); }}
    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
  >
    <Icon className="w-4 h-4" style={{ color }} />
  </button>
);

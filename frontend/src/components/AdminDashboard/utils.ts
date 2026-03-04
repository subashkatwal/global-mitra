// ─── Theme tokens ─────────────────────────────────────────────────────────────
export const T = {
  bg:       '#F0FBF5',
  bgCard:   '#FFFFFF',
  border:   '#A8DFC8',
  borderSm: '#D0F0E4',
  primary:  '#3CA37A',
  primaryD: '#2D8F6A',
  primaryDk:'#1A3D2B',
  textMain: '#1A3D2B',
  textMid:  '#2D8F6A',
  textSub:  '#4A7A62',
  textMuted:'#6B9E84',
  sidebar:  '#FFFFFF',
  header:   'linear-gradient(135deg, #1A3D2B 0%, #2D8F6A 60%, #3CA37A 100%)',
};

// ─── API Utilities ────────────────────────────────────────────────────────────
const API_BASE =
  (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_API_URL) ||
  (import.meta as any).env?.VITE_API_URL ||
  '/api/v1';

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token =
    localStorage.getItem('access_token') || localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, data: err };
  }
  return res.json();
}

export function parseErr(e: any): string {
  const d = e?.data || e;
  if (!d) return 'Something went wrong.';
  if (d.detail)  return String(d.detail);
  if (d.error)   return String(d.error);
  if (d.message) return String(d.message);
  if (typeof d === 'object') {
    const msgs = Object.entries(d).flatMap(([, v]) =>
      Array.isArray(v) ? v : [String(v)]
    );
    if (msgs.length) return msgs.join(' ');
  }
  return e?.message || 'Something went wrong.';
}

export function apiFetchMultipart(path: string, body: FormData) {
  const token =
    localStorage.getItem('access_token') || localStorage.getItem('token');
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
}

export const T = {
  bg:       '#F0FBF5',
  bgCard:   '#FFFFFF',
  bgSoft:   '#F4FAF7',
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

const API_BASE =
  (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_API_URL) ||
  (import.meta as any).env?.VITE_API_URL ||
  '/api/v1';

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
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

export async function apiFetchForm(path: string, method: string, body: FormData) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, data: err };
  }
  return res.json();
}

export function apiFetchMultipart(path: string, body: FormData) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
}

export function parseErr(e: any): string {
  const d = e?.data || e;
  if (!d) return 'Something went wrong.';

  if (d.errors && typeof d.errors === 'object') {
    const msgs = Object.entries(d.errors).flatMap(([field, v]) => {
      const label =
        field === 'non_field_errors' || field === 'detail' || field === '__all__'
          ? ''
          : field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ': ';
      return Array.isArray(v) ? v.map((m: string) => label + m) : [label + String(v)];
    });
    if (msgs.length) return msgs.join(' • ');
  }

  if (d.detail)  return String(d.detail);
  if (d.error)   return String(d.error);
  if (d.message) return String(d.message);

  if (typeof d === 'object' && !Array.isArray(d)) {
    const msgs = Object.entries(d).flatMap(([field, v]) => {
      const label =
        field === 'non_field_errors' || field === 'success'
          ? ''
          : field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ': ';
      const values = Array.isArray(v) ? v.map(String) : [String(v)];
      return label ? values.map((m) => label + m) : values;
    });
    const filtered = msgs.filter((m) => m && m !== 'false' && m !== 'true');
    if (filtered.length) return filtered.join(' • ');
  }

  return e?.message || 'Something went wrong.';
}
import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Save, Loader2, RefreshCw, Eye,
         MessageCircle, Share2, Bookmark, Heart, Copy, Check, Globe, Users, Lock,
         ImagePlus, X as XIcon } from 'lucide-react';
import { T, apiFetch, parseErr } from './utils';
import { Spinner, ErrMsg, Empty, Modal, FormField, inputCls, inputStyle,
         Confirm, Pagination, Table, Tr, Td, ActionBtn } from './ui';
import type { Post, ToastFn } from './types';

// ─── Visibility config ────────────────────────────────────────────────────────
const VISIBILITY = {
  public:      { label: 'Everyone',    icon: Globe,  color: '#10B981' },
  guides_only: { label: 'Guides only', icon: Users,  color: '#6366F1' },
  private:     { label: 'Only me',     icon: Lock,   color: '#94A3B8' },
} as const;
type VisibilityKey = keyof typeof VISIBILITY;

function VisibilityPill({ v }: { v?: string }) {
  const key = (v && (v in VISIBILITY)) ? v as VisibilityKey : 'public';
  const { label, icon: Icon, color } = VISIBILITY[key];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color, background: color + '18' }}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

// ─── Author helpers ───────────────────────────────────────────────────────────
function resolveAuthorName(post: Post): string {
  const a = post.author;
  const candidates = [
    a?.fullName, a?.full_name, (a as any)?.name,
    (post as any).fullName, (post as any).full_name, (post as any).userName,
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim() && !c.includes('@')) return c.trim();
  }
  return '—';
}
function resolveAuthorEmail(post: Post): string {
  return post.author?.email ?? (post as any).email ?? '';
}
function resolveAuthorPhoto(post: Post): string | null {
  const a = post.author;
  return (
    a?.photo ?? (a as any)?.avatar ?? (a as any)?.profilePhoto ??
    (post as any).userPhoto ?? (post as any).profilePhoto ?? null
  );
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10)    return 'just now';
  if (s < 60)    return `${s} sec`;
  if (s < 3600)  return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr${Math.floor(s / 3600) !== 1 ? 's' : ''}`;
  const d = Math.floor(s / 86400);
  if (d < 30)    return `${d} day${d !== 1 ? 's' : ''}`;
  const mo = Math.floor(d / 30);
  if (mo < 12)   return `${mo} month${mo !== 1 ? 's' : ''}`;
  return `${Math.floor(mo / 12)} yr`;
}

function shortId(id: string): string {
  return id.length > 8 ? '…' + id.slice(-8) : id;
}

function AuthorAvatar({ photo, name, size = 10 }: { photo?: string | null; name: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  const sz = `w-${size} h-${size}`;
  const initial = (name && name !== '—') ? name.charAt(0).toUpperCase() : '?';
  if (photo && !imgErr) {
    return (
      <img src={photo} alt={name}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
        onError={() => setImgErr(true)} />
    );
  }
  return (
    <div className={`${sz} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm`}
      style={{ background: T.primary }}>
      {initial}
    </div>
  );
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
      style={{ borderColor: T.borderSm, background: T.bgSoft }}>
      <span className="text-xs font-semibold flex-shrink-0" style={{ color: T.textMuted }}>Post ID</span>
      <span className="text-xs font-mono flex-1 truncate" style={{ color: T.textSub }}>{id}</span>
      <button onClick={copy}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white transition-colors" title="Copy ID">
        {copied
          ? <Check className="w-3.5 h-3.5 text-emerald-500" />
          : <Copy  className="w-3.5 h-3.5" style={{ color: T.textMuted }} />}
      </button>
    </div>
  );
}

// ─── Image Upload Field ───────────────────────────────────────────────────────
function ImageUploadField({
  preview,
  onFile,
  onClear,
  error,
}: {
  preview: string | null;
  onFile: (file: File, previewUrl: string) => void;
  onClear: () => void;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onFile(f, URL.createObjectURL(f));
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold" style={{ color: T.textMain }}>
        Image <span className="font-normal text-xs" style={{ color: T.textMuted }}>(optional)</span>
      </label>

      {preview ? (
        /* ── preview state ── */
        <div className="relative rounded-2xl overflow-hidden border"
          style={{ borderColor: T.border }}>
          <img src={preview} alt="post preview"
            className="w-full object-cover max-h-52" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
              bg-black/50 hover:bg-black/70 transition-colors"
            title="Remove image">
            <XIcon className="w-3.5 h-3.5 text-white" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2
            bg-gradient-to-t from-black/40 to-transparent pointer-events-none">
            <p className="text-white text-[11px] font-medium">Click × to remove</p>
          </div>
        </div>
      ) : (
        /* ── upload prompt ── */
        <button
          onClick={() => ref.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-2 py-7 rounded-2xl
            border-2 border-dashed transition-all hover:opacity-80
            ${error ? 'bg-red-50' : 'bg-white hover:bg-slate-50'}`}
          style={{ borderColor: error ? '#EF4444' : T.border }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: T.primary + '14' }}>
            <ImagePlus className="w-5 h-5" style={{ color: T.primary }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: error ? '#DC2626' : T.textSub }}>
              {error ?? 'Click to upload image'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
              JPG, PNG or WebP · max 5 MB
            </p>
          </div>
        </button>
      )}

      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ─── Post Form Modal ──────────────────────────────────────────────────────────
function PostFormModal({ post, onClose, onSaved }: {
  post?: Post;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content,      setContent]      = useState(post?.textContent ?? '');
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    // show existing image when editing
    post?.image ?? null
  );
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const name  = post ? resolveAuthorName(post)  : '';
  const email = post ? resolveAuthorEmail(post) : '';
  const photo = post ? resolveAuthorPhoto(post) : null;

  const handleSubmit = async () => {
    if (!content.trim()) { setErr('Content is required.'); return; }
    setSaving(true); setErr('');
    try {
      if (post) {
        // ── EDIT: use JSON PATCH (image editing kept simple) ──────────────
        await apiFetch(`/socials/posts/${post.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ textContent: content }),
        });
      } else {
        // ── ADD: multipart if image selected, JSON otherwise ─────────────
        if (imageFile) {
          const token = localStorage.getItem('access_token') || localStorage.getItem('token');
          const fd = new FormData();
          fd.append('textContent', content);
          fd.append('image', imageFile);
          const API_BASE =
            (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_API_URL) ||
            (import.meta as any).env?.VITE_API_URL || '/api/v1';
          const res = await fetch(`${API_BASE}/socials/posts`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          });
          if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw { status: res.status, data: e };
          }
        } else {
          await apiFetch('/socials/posts', {
            method: 'POST',
            body: JSON.stringify({ textContent: content }),
          });
        }
      }
      onSaved();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={post ? 'Edit Post' : 'Add Post'} onClose={onClose}>
      {err && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {err}
        </div>
      )}

      {post && (
        <div className="mb-4 space-y-3">
          <CopyableId id={post.id} />
          <div className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ borderColor: T.borderSm, background: T.bgSoft }}>
            <AuthorAvatar photo={photo} name={name || '?'} size={9} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: T.textMain }}>
                {name || 'Unknown'}
              </p>
              {email && (
                <p className="text-xs truncate" style={{ color: T.textMuted }}>{email}</p>
              )}
            </div>
            <VisibilityPill v={(post as any).visibility} />
            <div className="ml-2 flex items-center gap-3 flex-shrink-0 text-xs" style={{ color: T.textMuted }}>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" style={{ color: '#FF6B35' }} />
                {(post as any).likeCount ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" style={{ color: T.primary }} />
                {post.commentCount ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5" style={{ color: T.primary }} />
                {post.bookmarkCount ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" style={{ color: T.textMid }} />
                {post.shareCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content field */}
      <FormField label="Content" req>
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); setErr(''); }}
          rows={4}
          placeholder="Write post content..."
          className={inputCls + ' resize-none'}
          style={inputStyle}
        />
      </FormField>

      {/* Image upload — shown for both Add and Edit */}
      <div className="mt-4">
        <ImageUploadField
          preview={imagePreview}
          onFile={(file, url) => { setImageFile(file); setImagePreview(url); }}
          onClear={() => { setImageFile(null); setImagePreview(null); }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
          style={{ background: T.primary }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {post ? 'Save Changes' : 'Add Post'}
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

// ─── Post Detail Modal ────────────────────────────────────────────────────────
function PostDetailModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const name  = resolveAuthorName(post);
  const email = resolveAuthorEmail(post);
  const photo = resolveAuthorPhoto(post);

  return (
    <Modal title="Post Detail" onClose={onClose}>
      <div className="space-y-4">
        <CopyableId id={post.id} />

        <div className="flex items-center gap-3">
          <AuthorAvatar photo={photo} name={name || '?'} size={10} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: T.textMain }}>{name || 'Unknown'}</p>
            {email && <p className="text-xs" style={{ color: T.textMuted }}>{email}</p>}
          </div>
          <VisibilityPill v={(post as any).visibility} />
        </div>

        <div className="p-3 rounded-xl text-sm leading-relaxed"
          style={{ background: T.bgSoft, color: T.textSub }}>
          {post.textContent}
        </div>

        {post.image && (
          <img src={post.image} alt="" className="w-full rounded-xl object-cover max-h-64" />
        )}

        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Heart,         label: 'Likes',    value: (post as any).likeCount, color: '#FF6B35' },
            { icon: Bookmark,      label: 'Saves',    value: post.bookmarkCount,       color: T.primary },
            { icon: MessageCircle, label: 'Comments', value: post.commentCount,        color: T.primary },
            { icon: Share2,        label: 'Shares',   value: post.shareCount,          color: T.textMid },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border"
              style={{ borderColor: T.borderSm }}>
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-lg font-bold" style={{ color: T.textMain }}>{value ?? 0}</span>
              <span className="text-[11px]" style={{ color: T.textMuted }}>{label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: T.textMuted }}>
          Posted {timeAgo(post.createdAt)} &nbsp;·&nbsp; {new Date(post.createdAt).toLocaleString()}
        </p>
      </div>
    </Modal>
  );
}

// ─── Posts Page ───────────────────────────────────────────────────────────────
export function PostsPage({ toast }: { toast: ToastFn }) {
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState('');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState<null | 'add' | 'edit' | 'view'>(null);
  const [selected,  setSelected]  = useState<Post | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
      const data = await apiFetch(`/socials/posts?${qs}`);
      const items = data.results ?? data.data ?? data ?? [];
      setPosts(Array.isArray(items) ? items : []);
      setTotal(data.count ?? items.length);
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/socials/posts/${id}`, { method: 'DELETE' });
      toast('Post deleted.', 'success');
      load();
    } catch (e: any) { toast(parseErr(e), 'error'); }
    setConfirmId(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>Posts</h1>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2.5 rounded-xl border hover:bg-gray-50 transition-colors"
            style={{ borderColor: T.border }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: T.textMid }} />
          </button>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: T.primary }}>
            <Plus className="w-4 h-4" /> Add Post
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textMuted }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search posts..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm outline-none focus:ring-2"
          style={{ borderColor: T.border }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        {loading ? <Spinner /> : err ? <ErrMsg msg={err} onRetry={load} /> :
         posts.length === 0 ? <Empty msg="No posts found." /> : (
          <>
            <Table headers={['Post ID', 'Author', 'Content', 'Visibility', 'Likes', 'Saves', 'Comments', 'Shares', 'Posted', 'Actions']}>
              {posts.map(p => {
                const name  = resolveAuthorName(p);
                const email = resolveAuthorEmail(p);
                const photo = resolveAuthorPhoto(p);
                return (
                  <Tr key={p.id}>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
                          style={{ background: T.bgSoft, color: T.textMuted }}>
                          {shortId(p.id)}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(p.id)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Copy full ID">
                          <Copy className="w-3 h-3" style={{ color: T.textMuted }} />
                        </button>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <AuthorAvatar photo={photo} name={name || '?'} size={7} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: T.textMain }}>
                            {name || 'Unknown'}
                          </p>
                          {email && (
                            <p className="text-[11px] truncate" style={{ color: T.textMuted }}>{email}</p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 max-w-xs">
                        {/* thumbnail if image exists */}
                        {p.image && (
                          <img src={p.image} alt=""
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border"
                            style={{ borderColor: T.borderSm }} />
                        )}
                        <span className="line-clamp-2 block text-sm" style={{ color: T.textSub }}>
                          {p.textContent}
                        </span>
                      </div>
                    </Td>
                    <Td><VisibilityPill v={(p as any).visibility} /></Td>
                    <Td><span className="text-sm">{(p as any).likeCount ?? 0}</span></Td>
                    <Td><span className="text-sm">{p.bookmarkCount ?? 0}</span></Td>
                    <Td><span className="text-sm">{p.commentCount  ?? 0}</span></Td>
                    <Td><span className="text-sm">{p.shareCount    ?? 0}</span></Td>
                    <Td>
                      <div>
                        <p className="text-xs font-medium" style={{ color: T.textSub }}>
                          {timeAgo(p.createdAt)}
                        </p>
                        <p className="text-[10px]" style={{ color: T.textMuted }}>
                          {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ActionBtn icon={Eye}    color="#6366F1" title="View"
                          onClick={() => { setSelected(p); setModal('view'); }} />
                        <ActionBtn icon={Pencil} color="#F59E0B" title="Edit"
                          onClick={() => { setSelected(p); setModal('edit'); }} />
                        <ActionBtn icon={Trash2} color="#EF4444" title="Delete"
                          onClick={() => setConfirmId(p.id)} />
                      </div>
                    </td>
                  </Tr>
                );
              })}
            </Table>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>

      <AnimatePresence>
        {modal === 'add' && (
          <PostFormModal
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); toast('Post added!', 'success'); load(); }}
          />
        )}
        {modal === 'edit' && selected && (
          <PostFormModal
            post={selected}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); toast('Post updated!', 'success'); load(); }}
          />
        )}
        {modal === 'view' && selected && (
          <PostDetailModal post={selected} onClose={() => setModal(null)} />
        )}
        {confirmId && (
          <Confirm
            msg="Delete this post? This cannot be undone."
            onConfirm={() => handleDelete(confirmId)}
            onCancel={() => setConfirmId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
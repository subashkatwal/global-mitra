import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Save, Loader2, RefreshCw } from 'lucide-react';
import { T, apiFetch, parseErr } from './utils';
import { Spinner, ErrMsg, Empty, Modal, FormField, inputCls, inputStyle, Confirm, Pagination, Table, Tr, Td, ActionBtn } from './ui';
import type { Post, ToastFn } from './types';

// ─── Post Form Modal ──────────────────────────────────────────────────────────
function PostFormModal({
  post,
  onClose,
  onSaved,
}: {
  post?: Post;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState(post?.content || '');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) { setErr('Content is required.'); return; }
    setSaving(true); setErr('');
    try {
      if (post) await apiFetch(`/socials/posts/${post.id}`, { method: 'PATCH', body: JSON.stringify({ content }) });
      else      await apiFetch('/socials/posts',             { method: 'POST',  body: JSON.stringify({ content }) });
      onSaved();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={post ? 'Edit Post' : 'Add Post'} onClose={onClose}>
      {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
      <FormField label="Content" req>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={5}
          placeholder="Write your post content..."
          className={inputCls + ' resize-none'}
          style={inputStyle}
        />
      </FormField>
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: T.primary }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {post ? 'Save Changes' : 'Add Post'}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50" style={{ borderColor: T.border, color: T.textSub }}>
          Cancel
        </button>
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
  const [modal,     setModal]     = useState<null | 'add' | 'edit'>(null);
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
      toast('Post deleted.', 'success'); load();
    } catch (e: any) { toast(parseErr(e), 'error'); }
    setConfirmId(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.textMain }}>Posts</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl border hover:bg-[#D0F0E4] transition-colors"
            style={{ borderColor: T.border }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: T.textMid }} />
          </button>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
            style={{ background: T.primary }}
          >
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
        {loading ? <Spinner /> :
         err     ? <ErrMsg msg={err} onRetry={load} /> :
         posts.length === 0 ? <Empty msg="No posts found." /> : (
          <>
            <Table headers={['Content', 'Author', 'Created', 'Actions']}>
              {posts.map(p => (
                <Tr key={p.id}>
                  <Td><span className="line-clamp-2 max-w-xs block">{p.content}</span></Td>
                  <Td>{p.author?.fullName}</Td>
                  <Td>{new Date(p.createdAt).toLocaleDateString()}</Td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn icon={Pencil} color="#6366F1" title="Edit"   onClick={() => { setSelected(p); setModal('edit'); }} />
                      <ActionBtn icon={Trash2} color="#EF4444" title="Delete" onClick={() => setConfirmId(p.id)} />
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
          <PostFormModal onClose={() => setModal(null)} onSaved={() => { setModal(null); toast('Post added!', 'success'); load(); }} />
        )}
        {modal === 'edit' && selected && (
          <PostFormModal post={selected} onClose={() => setModal(null)} onSaved={() => { setModal(null); toast('Post updated!', 'success'); load(); }} />
        )}
        {confirmId && (
          <Confirm msg="Delete this post?" onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

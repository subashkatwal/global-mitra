import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Image, Send, Bookmark, BookmarkCheck, Share2, MessageCircle,
  X, Loader2, MoreHorizontal, Trash2, Pencil, Heart,
  Facebook, Twitter, Link, Mail, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, List,
} from 'lucide-react';
import { T, apiFetch, apiFetchForm, parseErr } from './AdminDashboard/utils';
import { Spinner, ErrMsg, Empty, Confirm } from './AdminDashboard/ui';
import type { ToastFn } from '../types/index';

// ─── Theme overrides — use project palette instead of green ──────────────────
// Primary action color: use T.primary (#3CA37A) sparingly, accent is warm coral
const C = {
  accent:    '#FF6B35',   // like / heart
  accentBg:  '#FFF4F0',
  save:      T.primary,   // bookmark uses theme primary
  saveBg:    '#F0FBF5',
  text:      T.textMain,
  textSub:   T.textSub,
  textMuted: T.textMuted,
  border:    T.border,
  borderSm:  T.borderSm,
  cardBg:    '#FFFFFF',
  pageBg:    '#F7F9FC',   // neutral page bg — NOT green
  inputBg:   '#F7F9FC',
  pill:      '#F1F5F9',   // tab/pill bg
  pillText:  '#475569',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id:            string;
  // author may come as nested object OR flat fields
  author?:       { fullName?: string; full_name?: string; photo?: string | null; email?: string };
  full_name?:    string;   // flat fallback
  userPhoto?:    string | null;
  textContent:   string;
  image?:        string | null;
  commentCount?: number;
  likeCount?:    number;
  shareCount?:   number;
  bookmarkCount?: number;
  isBookmarked?: boolean;
  createdAt:     string;
}

interface Comment {
  id:          string;
  author?:     { fullName?: string; full_name?: string; photo?: string | null };
  full_name?:  string;
  userPhoto?:  string | null;
  textContent: string;
  image?:      string | null;
  createdAt:   string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** Resolve author name from post — handles both flat and nested shapes */
function authorName(post: Post | Comment): string {
  return (
    (post as Post).author?.fullName   ||
    (post as Post).author?.full_name  ||
    (post as any).full_name           ||
    (post as any).fullName            ||
    'Unknown'
  );
}
function authorPhoto(post: Post | Comment): string | null {
  return (
    (post as Post).author?.photo ??
    (post as any).userPhoto      ??
    null
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ photo, name, size = 8 }: { photo?: string | null; name?: string; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (photo)
    return <img src={photo} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs`}
      style={{ background: T.primaryD }}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichTextEditor({ onChange }: { onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const exec = (cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, undefined);
    onChange(editorRef.current?.innerHTML ?? '');
  };
  const tools = [
    { icon: Bold,        cmd: 'bold',               title: 'Bold' },
    { icon: Italic,      cmd: 'italic',             title: 'Italic' },
    { icon: Underline,   cmd: 'underline',          title: 'Underline' },
    { icon: AlignLeft,   cmd: 'justifyLeft',        title: 'Left' },
    { icon: AlignCenter, cmd: 'justifyCenter',      title: 'Center' },
    { icon: AlignRight,  cmd: 'justifyRight',       title: 'Right' },
    { icon: List,        cmd: 'insertUnorderedList', title: 'List' },
  ];
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: C.border }}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b" style={{ borderColor: C.borderSm, background: C.inputBg }}>
        {tools.map(({ icon: Icon, cmd, title }) => (
          <button key={cmd} type="button" title={title}
            onMouseDown={e => { e.preventDefault(); exec(cmd); }}
            className="p-1.5 rounded-lg hover:bg-white transition-colors"
            style={{ color: C.textSub }}>
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
        data-placeholder="Share your travel experience…"
        className="min-h-[80px] px-3 py-2.5 text-sm outline-none"
        style={{ color: C.textSub, background: C.inputBg }} />
    </div>
  );
}

// ─── Create Post Box ──────────────────────────────────────────────────────────
function CreatePostBox({ currentUser, onPosted }: {
  currentUser: { name: string; photo: string | null } | null;
  onPosted: () => void;
}) {
  const [html,    setHtml]    = useState('');
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [err,     setErr]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const plainText = html.replace(/<[^>]*>/g, '').trim();

  const submit = async () => {
    if (!plainText && !imgFile) return;
    setPosting(true); setErr('');
    try {
      if (imgFile) {
        const fd = new FormData();
        fd.append('textContent', html);
        fd.append('image', imgFile);
        await apiFetchForm('/socials/posts', 'POST', fd);
      } else {
        await apiFetch('/socials/posts', { method: 'POST', body: JSON.stringify({ textContent: html }) });
      }
      setHtml(''); setImgFile(null); setPreview(null);
      onPosted();
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setPosting(false); }
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 mb-4" style={{ borderColor: C.border }}>
      <div className="flex gap-3">
        <Avatar photo={currentUser?.photo} name={currentUser?.name} size={10} />
        <div className="flex-1">
          <RichTextEditor onChange={setHtml} />
          {preview && (
            <div className="relative mt-2 inline-block">
              <img src={preview} alt="preview" className="max-h-48 rounded-xl object-cover" />
              <button onClick={() => { setImgFile(null); setPreview(null); }}
                className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 hover:bg-black/70">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}
          {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
          <div className="flex items-center justify-between mt-3">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: C.borderSm, color: C.textSub }}>
              <Image className="w-4 h-4" /> Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setImgFile(f); setPreview(URL.createObjectURL(f)); }
              }} />
            <button onClick={submit} disabled={posting || (!plainText && !imgFile)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ background: T.primary }}>
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Share Sheet ──────────────────────────────────────────────────────────────
function ShareSheet({ postId, onClose, onShared }: {
  postId: string; onClose: () => void; onShared: () => void;
}) {
  const [sharing, setSharing] = useState<string | null>(null);
  const platforms = [
    { key: 'facebook',  label: 'Facebook',  icon: Facebook, color: '#1877F2' },
    { key: 'twitter',   label: 'Twitter',   icon: Twitter,  color: '#1DA1F2' },
    { key: 'whatsapp',  label: 'WhatsApp',  icon: Share2,   color: '#25D366' },
    { key: 'telegram',  label: 'Telegram',  icon: Send,     color: '#229ED9' },
    { key: 'email',     label: 'Email',     icon: Mail,     color: '#EA4335' },
    { key: 'copy_link', label: 'Copy Link', icon: Link,     color: '#6366F1' },
  ];
  const share = async (platform: string) => {
    setSharing(platform);
    try {
      await apiFetch(`/socials/posts/${postId}/share`, { method: 'POST', body: JSON.stringify({ platform }) });
      if (platform === 'copy_link')
        navigator.clipboard.writeText(window.location.origin + `/posts/${postId}`);
      onShared(); onClose();
    } catch { /* silent */ }
    finally { setSharing(null); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4"
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color: C.text }}>Share post</h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: C.textMuted }} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {platforms.map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => share(key)} disabled={!!sharing}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border hover:bg-gray-50 transition-colors disabled:opacity-60"
              style={{ borderColor: C.borderSm }}>
              {sharing === key
                ? <Loader2 className="w-6 h-6 animate-spin" style={{ color }} />
                : <Icon className="w-6 h-6" style={{ color }} />}
              <span className="text-[11px] font-medium" style={{ color: C.textSub }}>{label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Comments Drawer ──────────────────────────────────────────────────────────
function CommentsDrawer({ post, onClose }: { post: Post; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState('');
  const [imgFile,  setImgFile]  = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [sending,  setSending]  = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/socials/posts/${post.id}/comments`);
      setComments(data.data ?? data.results ?? []);
    } catch { setComments([]); }
    finally { setLoading(false); }
  }, [post.id]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!text.trim() && !imgFile) return;
    setSending(true);
    try {
      if (imgFile) {
        const fd = new FormData();
        fd.append('textContent', text);
        fd.append('image', imgFile);
        await apiFetchForm(`/socials/posts/${post.id}/comments`, 'POST', fd);
      } else {
        await apiFetch(`/socials/posts/${post.id}/comments`, {
          method: 'POST', body: JSON.stringify({ textContent: text }),
        });
      }
      setText(''); setImgFile(null); setPreview(null);
      load();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const deleteComment = async (id: string) => {
    try {
      await apiFetch(`/socials/comments/${id}`, { method: 'DELETE' });
      setComments(p => p.filter(c => c.id !== id));
    } catch { /* silent */ }
    setDeleteId(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col shadow-xl"
        style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.borderSm }}>
          <h3 className="font-bold text-base" style={{ color: C.text }}>
            Comments <span className="text-sm font-normal" style={{ color: C.textMuted }}>({comments.length})</span>
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: C.textMuted }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: T.primary }} />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: C.textMuted }}>No comments yet. Be the first!</p>
          ) : comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <Avatar photo={authorPhoto(c)} name={authorName(c)} size={8} />
              <div className="flex-1 min-w-0">
                <div className="rounded-2xl rounded-tl-none px-3 py-2" style={{ background: C.pill }}>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: C.text }}>{authorName(c)}</p>
                  <p className="text-sm" style={{ color: C.textSub }}>{c.textContent}</p>
                  {c.image && <img src={c.image} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />}
                </div>
                <div className="flex items-center gap-3 mt-1 px-2">
                  <span className="text-[11px]" style={{ color: C.textMuted }}>{timeAgo(c.createdAt)}</span>
                  <button onClick={() => setDeleteId(c.id)}
                    className="text-[11px] hover:text-red-500 transition-colors"
                    style={{ color: C.textMuted }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {preview && (
          <div className="px-5 pb-2 relative inline-flex">
            <img src={preview} alt="" className="h-16 rounded-lg object-cover" />
            <button onClick={() => { setImgFile(null); setPreview(null); }}
              className="absolute -top-1 -right-1 bg-black/50 rounded-full p-0.5">
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}

        <div className="px-5 py-3 border-t flex gap-3 items-end" style={{ borderColor: C.borderSm }}>
          <button onClick={() => fileRef.current?.click()}
            className="p-2 rounded-xl transition-colors flex-shrink-0"
            style={{ color: C.textSub }}>
            <Image className="w-5 h-5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) { setImgFile(f); setPreview(URL.createObjectURL(f)); }
            }} />
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Write a comment…" rows={1}
            className="flex-1 resize-none text-sm outline-none rounded-xl px-3 py-2 border focus:ring-2"
            style={{ borderColor: C.border, background: C.inputBg }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button onClick={send} disabled={sending || (!text.trim() && !imgFile)}
            className="p-2 rounded-xl text-white disabled:opacity-50 flex-shrink-0"
            style={{ background: T.primary }}>
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      {deleteId && (
        <Confirm msg="Delete this comment?"
          onConfirm={() => deleteComment(deleteId)}
          onCancel={() => setDeleteId(null)} />
      )}
    </motion.div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onUpdate, onDelete, currentUserName }: {
  post: Post;
  onUpdate: (updated: Post) => void;
  onDelete: (id: string) => void;
  currentUserName: string;
}) {
  const name = authorName(post);
  const photo = authorPhoto(post);

  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(post.likeCount ?? 0);
  const [bookmarked,   setBookmarked]   = useState(post.isBookmarked ?? false);
  const [shareCount,   setShareCount]   = useState(post.shareCount ?? 0);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [showMenu,     setShowMenu]     = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const [confirmDel,   setConfirmDel]   = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [editText,     setEditText]     = useState(post.textContent);
  const [saving,       setSaving]       = useState(false);

  const isOwn = name === currentUserName;

  const toggleLike = () => {
    setLiked(p => !p);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const toggleBookmark = async () => {
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      await apiFetch(`/socials/posts/${post.id}/bookmark`, { method: 'POST' });
    } catch { setBookmarked(prev); }
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const data = await apiFetch(`/socials/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ textContent: editText }),
      });
      onUpdate({ ...post, textContent: data.data?.textContent ?? editText });
      setEditing(false);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
        style={{ borderColor: C.border }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar photo={photo} name={name} size={10} />
            <div>
              <p className="text-sm font-semibold" style={{ color: C.text }}>{name}</p>
              <p className="text-[11px]" style={{ color: C.textMuted }}>{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          {isOwn && (
            <div className="relative">
              <button onClick={() => setShowMenu(p => !p)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <MoreHorizontal className="w-5 h-5" style={{ color: C.textMuted }} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border rounded-xl shadow-lg z-10 overflow-hidden min-w-[130px]"
                  style={{ borderColor: C.border }}>
                  <button onClick={() => { setEditing(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: C.textSub }}>
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => { setConfirmDel(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {editing ? (
            <div className="space-y-2">
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                className="w-full resize-none text-sm outline-none rounded-xl px-3 py-2.5 border focus:ring-2"
                style={{ borderColor: C.border }} />
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60"
                  style={{ background: T.primary }}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditText(post.textContent); }}
                  className="px-4 py-1.5 rounded-lg border text-xs font-semibold hover:bg-gray-50"
                  style={{ borderColor: C.border, color: C.textSub }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed"
              style={{ color: C.textSub }}
              dangerouslySetInnerHTML={{ __html: post.textContent }} />
          )}
        </div>

        {/* Image */}
        {post.image && (
          <div className="px-4 pb-3">
            <img src={post.image} alt="" className="w-full rounded-xl object-cover max-h-80" />
          </div>
        )}

        {/* Stats */}
        <div className="px-4 pb-2 flex items-center gap-4 text-xs" style={{ color: C.textMuted }}>
          {likeCount > 0 && <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>}
          {commentCount > 0 && (
            <button onClick={() => setShowComments(true)} className="hover:underline">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
          {shareCount > 0 && <span>{shareCount} shares</span>}
        </div>

        {/* Actions */}
        <div className="border-t mx-4 py-1 flex items-center justify-around" style={{ borderColor: C.borderSm }}>
          <button onClick={toggleLike}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{ color: liked ? C.accent : C.textMuted }}>
            <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-[#FF6B35]' : ''}`} />
            {likeCount > 0 ? likeCount : 'Like'}
          </button>

          <button onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-gray-50"
            style={{ color: C.textMuted }}>
            <MessageCircle className="w-4 h-4" />
            {commentCount > 0 ? commentCount : 'Comment'}
          </button>

          <button onClick={toggleBookmark}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{ color: bookmarked ? C.save : C.textMuted }}>
            {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {bookmarked ? 'Saved' : 'Save'}
          </button>

          <button onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            style={{ color: C.textMuted }}>
            <Share2 className="w-4 h-4" />
            {shareCount > 0 ? shareCount : 'Share'}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showComments && (
          <CommentsDrawer post={post} onClose={() => {
            setShowComments(false);
            apiFetch(`/socials/posts/${post.id}/comments`)
              .then(d => setCommentCount(d.count ?? d.data?.length ?? commentCount))
              .catch(() => {});
          }} />
        )}
        {showShare && (
          <ShareSheet postId={post.id} onClose={() => setShowShare(false)}
            onShared={() => setShareCount(c => c + 1)} />
        )}
      </AnimatePresence>

      {confirmDel && (
        <Confirm msg="Delete this post? This cannot be undone."
          onConfirm={async () => {
            await apiFetch(`/socials/posts/${post.id}`, { method: 'DELETE' });
            onDelete(post.id);
            setConfirmDel(false);
          }}
          onCancel={() => setConfirmDel(false)} />
      )}
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function SocialFeed({ toast, currentUser }: {
  toast?: ToastFn;
  currentUser?: { name: string; photo: string | null } | null;
}) {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const [tab,     setTab]     = useState<'feed' | 'saved'>('feed');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const endpoint = tab === 'saved' ? '/socials/posts/my-bookmarks' : '/socials/posts';
      const data = await apiFetch(endpoint);
      setPosts(data.data ?? data.results ?? []);
    } catch (e: any) { setErr(parseErr(e)); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const notify: ToastFn = toast ?? ((msg, type) => console.log(type, msg));

  return (
    <div className="section-padding max-w-xl mx-auto" style={{ background: C.pageBg }}>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-2xl font-bold" style={{ color: C.text }}>Community</h1>
        <div className="flex gap-1 p-1 rounded-xl border" style={{ borderColor: C.border, background: '#fff' }}>
          {(['feed', 'saved'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors"
              style={tab === t ? { background: T.primary, color: '#fff' } : { color: C.textSub }}>
              {t === 'feed' ? 'Feed' : 'Saved'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'feed' && (
        <CreatePostBox
          currentUser={currentUser ?? null}
          onPosted={() => { load(); notify('Posted!', 'success'); }}
        />
      )}

      {loading ? <Spinner /> : err ? <ErrMsg msg={err} onRetry={load} /> :
       posts.length === 0 ? (
         <Empty msg={tab === 'saved' ? 'No saved posts yet.' : 'No posts yet. Be the first to share!'} />
       ) : (
        <div className="space-y-4">
          {posts.map(p => (
            <PostCard key={p.id} post={p}
              currentUserName={currentUser?.name ?? ''}
              onUpdate={updated => setPosts(prev => prev.map(x => x.id === updated.id ? updated : x))}
              onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
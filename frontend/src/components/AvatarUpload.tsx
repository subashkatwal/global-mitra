import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { apiFetch } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface AvatarUploadProps {
  /** Current resolved photo URL (absolute) or null */
  photoUrl: string | null;
  /** User's full name — used for the initial fallback letter */
  fullName: string;
  /** Size in px — applied to both width and height */
  size?: number;
  /** Called with the new absolute photo URL after a successful upload */
  onUploaded: (newUrl: string) => void;
}

export function AvatarUpload({ photoUrl, fullName, size = 96, onUploaded }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview,    setPreview]  = useState<string | null>(null);
  const [uploading,  setUploading] = useState(false);
  const [error,      setError]    = useState('');
  const [success,    setSuccess]  = useState(false);

  const setUser = useAuthStore((s) => s.setUser);
  const authUser = useAuthStore((s) => s.user);

  const initial = fullName?.charAt(0)?.toUpperCase() ?? 'U';
  const displayUrl = preview ?? photoUrl;

  // ── Open gallery ──────────────────────────────────────────────────────────
  const openGallery = () => {
    setError('');
    fileInputRef.current?.click();
  };

  // ── File selected ─────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPEG, PNG, WebP or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload
    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      // apiFetch with FormData — do NOT set Content-Type (browser sets multipart boundary)
      const res = await apiFetch('/profile/users/me/photo', {
        method: 'POST',
        body:   formData,
        // signal: omit Content-Type so browser sets multipart/form-data with boundary
      }) as any;

      const newUrl = res?.photo ?? res?.data?.photo ?? objectUrl;

      // Update Zustand store
      if (authUser) setUser({ ...authUser, photo: newUrl });

      onUploaded(newUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(parseUploadError(err));
      setPreview(null);   // revert preview
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected after an error
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  function parseUploadError(err: any): string {
    const data = err?.response?.data || err?.data || err;
    if (!data) return 'Upload failed.';
    if (typeof data === 'object') {
      if (data.error)   return String(data.error);
      if (data.detail)  return String(data.detail);
      if (data.message) return String(data.message);
    }
    return err?.message || 'Upload failed.';
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ── Avatar circle ── */}
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="w-full h-full rounded-full bg-[#D8F3DC] border-2 border-[#B7E4C7] overflow-hidden flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                setPreview(null);
              }}
            />
          ) : (
            <span
              className="text-[#1B4332] font-bold select-none"
              style={{ fontSize: size * 0.38 }}
            >
              {initial}
            </span>
          )}

          {/* Uploading overlay */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"
              >
                <Loader2 className="text-white animate-spin" style={{ width: size * 0.28, height: size * 0.28 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Pencil button ── */}
        <button
          onClick={openGallery}
          disabled={uploading}
          title="Change profile photo"
          className="absolute -bottom-1 -right-1 rounded-full bg-[#2D6A4F] text-white
            flex items-center justify-center border-2 border-white
            hover:bg-[#1B4332] active:scale-95 transition-all disabled:opacity-60
            shadow-md"
          style={{ width: size * 0.32, height: size * 0.32 }}
        >
          <Camera style={{ width: size * 0.16, height: size * 0.16 }} />
        </button>

        {/* Success tick */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -bottom-1 -right-1 rounded-full bg-[#2D6A4F] text-white
                flex items-center justify-center border-2 border-white shadow-md"
              style={{ width: size * 0.32, height: size * 0.32 }}
            >
              <CheckCircle style={{ width: size * 0.18, height: size * 0.18 }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 text-xs text-red-600 max-w-[200px] text-center"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hidden file input — accept images only, opens gallery on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture={undefined}   // undefined = gallery, not camera-only
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

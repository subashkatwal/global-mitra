/**
 * AuthGuard component — wraps content that requires authentication.
 *
 * THREE modes:
 *
 * 1. FULL BLOCK  — user must be logged in to see anything
 *    <AuthGuard mode="block" onLoginClick={openLogin}>
 *      <ReportPage />
 *    </AuthGuard>
 *
 * 2. READ-ONLY   — unauthenticated users see content but CUD actions are gated
 *    Wrap individual buttons:
 *    <AuthGuard mode="action" onLoginClick={openLogin}>
 *      <button>Create Post</button>
 *    </AuthGuard>
 *
 * 3. DETAIL GATE — show a teaser/blur, prompt login for full content
 *    <AuthGuard mode="detail" onLoginClick={openLogin} teaser={<CardPreview />}>
 *      <FullDetailPanel />
 *    </AuthGuard>
 */

import { useAuthStore } from '@/store/authStore';
import { Lock, LogIn } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  mode?: 'block' | 'action' | 'detail';
  onLoginClick: () => void;
  /** Only used in 'detail' mode — shown to unauthenticated users as a preview */
  teaser?: React.ReactNode;
  /** Custom message shown in block / detail gate */
  message?: string;
}

export function AuthGuard({
  children,
  mode = 'block',
  onLoginClick,
  teaser,
  message,
}: AuthGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ── BLOCK mode — show a login wall ──────────────────────────────────────────
  if (mode === 'block' && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#D8F3DC] flex items-center justify-center mb-5">
          <Lock className="w-7 h-7 text-[#2D6A4F]" />
        </div>
        <h2 className="text-xl font-bold text-[#1B4332] mb-2">Login Required</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-6">
          {message ?? 'You need to be signed in to access this page.'}
        </p>
        <button
          onClick={onLoginClick}
          className="flex items-center gap-2 px-6 py-3 bg-[#2D6A4F] hover:bg-[#1f4e38] text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          <LogIn className="w-4 h-4" />
          Sign In to Continue
        </button>
      </div>
    );
  }

  // ── ACTION mode — render children but gate clicks ──────────────────────────
  // Wrap each child's onClick; if not authenticated, intercept and open login.
  if (mode === 'action' && !isAuthenticated) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLoginClick();
        }}
        className="cursor-pointer"
        title="Sign in to perform this action"
      >
        <div className="pointer-events-none opacity-60 select-none">
          {children}
        </div>
      </div>
    );
  }

  // ── DETAIL mode — show teaser + blur overlay ────────────────────────────────
  if (mode === 'detail' && !isAuthenticated) {
    return (
      <div className="relative">
        {/* Teaser content */}
        {teaser && <div>{teaser}</div>}

        {/* Blur overlay */}
        <div className="relative overflow-hidden rounded-xl">
          <div className="blur-sm pointer-events-none select-none opacity-40">
            {children}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <div className="w-12 h-12 rounded-xl bg-[#D8F3DC] flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-[#2D6A4F]" />
            </div>
            <p className="text-[#1B4332] font-semibold text-sm mb-3">
              {message ?? 'Sign in to view full details'}
            </p>
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1f4e38] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated — render normally ─────────────────────────────────────────
  return <>{children}</>;
}

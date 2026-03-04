/**
 * useAuthGuard — centralised login-gate hook
 *
 * Usage in any component:
 *
 *   const { requireAuth } = useAuthGuard();
 *
 *   // Gate a full action (e.g. submitting a report)
 *   requireAuth(() => submitReport(data));
 *
 *   // Gate rendering a detail panel
 *   if (!requireAuth()) return;
 */

import { useAuthStore } from '@/store/authStore';

interface UseAuthGuardOptions {
  /** Called when the user is not authenticated — default opens login modal via context */
  onUnauthenticated?: () => void;
}

// We keep a module-level setter so any component can register the global "open login" callback
// without prop-drilling.  Call registerLoginTrigger once at the App root.
let _openLogin: (() => void) | null = null;

export function registerLoginTrigger(fn: () => void) {
  _openLogin = fn;
}

export function useAuthGuard(options?: UseAuthGuardOptions) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  /**
   * requireAuth(callback?)
   *  - If authenticated: runs callback (if provided) and returns true
   *  - If not authenticated: opens login modal and returns false
   */
  function requireAuth(callback?: () => void): boolean {
    if (isAuthenticated) {
      callback?.();
      return true;
    }

    // Open login modal
    const trigger = options?.onUnauthenticated ?? _openLogin;
    if (trigger) trigger();
    else console.warn('useAuthGuard: no login trigger registered. Call registerLoginTrigger() at app root.');

    return false;
  }

  return { requireAuth, isAuthenticated };
}

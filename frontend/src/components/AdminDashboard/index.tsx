import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import { AdminLayout }      from './AdminLayout';
import { DashboardPage }    from './DashboardPage';
import { UsersPage }        from './UsersPage';
import { GuidesPage }       from './GuidesPage';
import { PostsPage }        from './PostsPage';
import { ReportsPage }      from './ReportsPage';
import { DestinationsPage } from './DestinationsPage';
import { Toast }            from './ui';

import type { AdminPage } from './types';

// Re-export everything so consumers can import from one place
export type { AdminPage };
export { DashboardPage, UsersPage, GuidesPage, PostsPage, ReportsPage, DestinationsPage };

// ─── Props ────────────────────────────────────────────────────────────────────
interface AdminDashboardProps {
  onLogout?:  () => void;
  userName?:  string;
  userPhoto?: string;
  /** Start on a specific page (default: 'dashboard') */
  initialPage?: AdminPage;
}

// ─── Root component ───────────────────────────────────────────────────────────
export function AdminDashboard({
  onLogout,
  userName   = 'Admin',
  userPhoto,
  initialPage = 'dashboard',
}: AdminDashboardProps) {
  const [page,  setPage]  = useState<AdminPage>(initialPage);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  return (
    <AdminLayout
      page={page}
      onSetPage={setPage}
      onLogout={onLogout}
      userName={userName}
      userPhoto={userPhoto}
    >
      {page === 'dashboard'    && <DashboardPage    onNav={setPage} />}
      {page === 'users'        && <UsersPage        toast={showToast} />}
      {page === 'guides'       && <GuidesPage       toast={showToast} />}
      {page === 'posts'        && <PostsPage        toast={showToast} />}
      {page === 'reports'      && <ReportsPage      toast={showToast} />}
      {page === 'destinations' && <DestinationsPage toast={showToast} />}

      <AnimatePresence>
        {toast && (
          <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

export default AdminDashboard;

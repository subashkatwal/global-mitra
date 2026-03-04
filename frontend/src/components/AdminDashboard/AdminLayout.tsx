import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Shield, BookOpen, AlertTriangle, MapPin, LogOut } from 'lucide-react';
import { T } from './utils';
import type { AdminPage } from './types';

interface AdminLayoutProps {
  page:      AdminPage;
  onSetPage: (p: AdminPage) => void;
  onLogout?: () => void;
  userName?: string;
  userPhoto?: string;
  children:  React.ReactNode;
}

const NAV_ITEMS: { id: AdminPage; label: string; icon: any }[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'users',        label: 'Users',        icon: Users           },
  { id: 'guides',       label: 'Guides',       icon: Shield          },
  { id: 'posts',        label: 'Posts',        icon: BookOpen        },
  { id: 'reports',      label: 'Reports',      icon: AlertTriangle   },
  { id: 'destinations', label: 'Destinations', icon: MapPin          },
];

// ─── Hamburger icon ───────────────────────────────────────────────────────────
function Hamburger() {
  return (
    <div className="space-y-1">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-4 h-0.5 rounded-full" style={{ background: T.textMain }} />
      ))}
    </div>
  );
}

// ─── Sidebar nav links ────────────────────────────────────────────────────────
function SidebarNav({
  page,
  onSetPage,
  onClose,
  onLogout,
  userName,
  userPhoto,
}: {
  page:      AdminPage;
  onSetPage: (p: AdminPage) => void;
  onClose:   () => void;
  onLogout?: () => void;
  userName?: string;
  userPhoto?: string;
}) {
  return (
    <nav className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b" style={{ borderColor: T.borderSm }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.primary }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: T.textMain }}>Admin Panel</span>
        </div>
      </div>

      {/* Links */}
      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon   = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onSetPage(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active ? 'text-white shadow-sm' : 'hover:bg-[#D0F0E4]'}`}
              style={active ? { background: T.primary } : { color: T.textMain }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* User footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: T.borderSm }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl" style={{ background: T.bg }}>
          {userPhoto
            ? <img src={userPhoto} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: T.primary }}
              >
                {userName?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
            )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: T.textMain }}>{userName ?? 'Admin'}</p>
            <p className="text-[10px]" style={{ color: T.textMuted }}>Administrator</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors text-red-500"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────
export function AdminLayout({ page, onSetPage, onLogout, userName, userPhoto, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentLabel = NAV_ITEMS.find(n => n.id === page)?.label ?? '';

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: T.bg, fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" }}
    >
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 xl:w-60 border-r flex-shrink-0 bg-white shadow-sm"
        style={{ borderColor: T.border }}
      >
        <SidebarNav page={page} onSetPage={onSetPage} onClose={() => {}} onLogout={onLogout} userName={userName} userPhoto={userPhoto} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-60 bg-white z-50 shadow-2xl lg:hidden border-r"
              style={{ borderColor: T.border }}
            >
              <SidebarNav
                page={page}
                onSetPage={onSetPage}
                onClose={() => setSidebarOpen(false)}
                onLogout={onLogout}
                userName={userName}
                userPhoto={userPhoto}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white border-b flex-shrink-0 shadow-sm"
          style={{ borderColor: T.border }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#D0F0E4] transition-colors"
          >
            <Hamburger />
          </button>

          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
              {currentLabel}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: T.border, background: T.bg }}>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: T.primary }}
            >
              {userName?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <span className="text-xs font-semibold hidden sm:block" style={{ color: T.textMain }}>
              {userName ?? 'Admin'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

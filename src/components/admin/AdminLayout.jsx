// src/pages/admin/AdminLayout.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Film, Tag, Star, LogOut,
  ChevronLeft, ChevronRight, Clapperboard, Users, User,
  Bell, Search, Tv, DollarSign,
} from 'lucide-react';
import authService from '../../services/authService';

// Import tokens mới tạo
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../context/adminTokens';

const NAV = [
  { key: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { key: 'revenue',   label: 'Doanh thu',       icon: DollarSign      },
  { key: 'movies',    label: 'Phim',            icon: Film            },
  { key: 'tvshows',   label: 'TV Shows',        icon: Tv              },
  { key: 'genres',    label: 'Thể loại',        icon: Tag             },
  { key: 'reviews',   label: 'Đánh giá',        icon: Star            },
  { key: 'users',     label: 'Người dùng',      icon: Users           },
  { key: 'persons',   label: 'Diễn viên',       icon: User            },
];

// ── NavItem ────────────────────────────────────────────────────────────────────
const NavItem = ({ item, active, collapsed, onClick }) => {
  const Icon = item.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        padding:        collapsed ? '10px 14px' : '10px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius:   10,
        border:         'none',
        cursor:         'pointer',
        background:     active ? T.accentLight : 'transparent',
        color:          active ? T.accentText : T.textSub,
        width:          '100%',
        transition:     'all 0.15s ease',
        fontFamily:     FONT,
        fontSize:       13.5,
        fontWeight:     active ? 600 : 400,
        position:       'relative',
        textAlign:      'left',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surfaceHov; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 20, borderRadius: '0 3px 3px 0', background: T.accent,
        }} />
      )}
      <Icon size={17} strokeWidth={active ? 2.2 : 1.7} color={active ? T.accent : T.textSub} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.14 }} style={{ whiteSpace: 'nowrap', lineHeight: 1 }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ── TopBar ─────────────────────────────────────────────────────────────────────
const TopBar = ({ activeTab, user }) => {
  const TAB_LABELS = {
    dashboard: 'Dashboard', movies: 'Quản lý Phim', tvshows: 'Quản lý TV Shows',
    genres: 'Thể loại', reviews: 'Đánh giá', users: 'Người dùng', persons: 'Diễn viên & Đạo diễn',
    revenue: 'Doanh thu & Thanh toán',
  };
  const initials = user?.name?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase() ?? 'A';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', height: 60, background: T.surface,
      borderBottom: `1px solid ${T.border}`, flexShrink: 0,
    }}>
      {/* Page title dùng FONT_TITLE */}
      <h1 style={{ fontFamily: FONT_TITLE, fontSize: 18, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>
        {TAB_LABELS[activeTab] ?? 'Dashboard'}
      </h1>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${T.border}`, background: T.surfaceHov, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub }}>
          <Search size={15} strokeWidth={1.7} />
        </button>
        <button style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${T.border}`, background: T.surfaceHov, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, position: 'relative' }}>
          <Bell size={15} strokeWidth={1.7} />
          <div style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#EF4444', border: `1.5px solid ${T.surface}` }} />
        </button>
        <div style={{ width: 1, height: 22, background: T.border, margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {initials}
          </div>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, margin: 0, lineHeight: 1.2 }}>{user?.name ?? user?.username ?? 'Admin'}</p>
            <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.2 }}>{user?.email ?? 'admin@uia.com'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── AdminLayout ────────────────────────────────────────────────────────────────
export default function AdminLayout({ children, activeTab, onTabChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    authService.clearSession();
    window.location.href = '/welcome';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>
      
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 228 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        style={{
          flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column', position: 'sticky', top: 0,
          height: '100vh', overflow: 'hidden', zIndex: 50, boxShadow: T.shadow,
        }}
      >
        <div style={{
          padding: collapsed ? '18px 0' : '18px 16px 18px 18px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', minHeight: 60,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clapperboard size={16} color="white" strokeWidth={1.8} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.16 }}>
                <span style={{ fontFamily: FONT_TITLE, fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
                  UIA <span style={{ color: T.accent }}>Admin</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!collapsed && (
          <div style={{ padding: '16px 18px 6px' }}>
            <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Menu</span>
          </div>
        )}

        <nav style={{ flex: 1, padding: collapsed ? '10px 6px' : '4px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV.map(item => (
            <NavItem key={item.key} item={item} active={activeTab === item.key} collapsed={collapsed} onClick={() => onTabChange(item.key)} />
          ))}
        </nav>

        <div style={{ borderTop: `1px solid ${T.border}`, padding: collapsed ? '10px 6px' : '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <motion.button
            whileTap={{ scale: 0.97 }} onClick={handleLogout} title={collapsed ? 'Đăng xuất' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#EF4444', width: '100%', fontFamily: FONT, fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={17} strokeWidth={1.7} />
            {!collapsed && <span>Đăng xuất</span>}
          </motion.button>
          <button
            onClick={() => setCollapsed(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: T.textMuted, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar activeTab={activeTab} user={user} />
        <main style={{ flex: 1, overflow: 'auto', background: T.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}
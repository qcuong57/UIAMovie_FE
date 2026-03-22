// src/pages/admin/AdminLayout.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Film, Tag, Star, LogOut,
  ChevronLeft, ChevronRight, Shield, Users, User
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from '../../context/homeTokens';

const NAV = [
  { key: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'movies',    label: 'Phim',         icon: Film            },
  { key: 'genres',    label: 'Thể loại',     icon: Tag             },
  { key: 'reviews',   label: 'Đánh giá',     icon: Star            },
  { key: 'users',     label: 'Người dùng',   icon: Users           },
  { key: 'persons',   label: 'Diễn viên',    icon: User            },
];

export default function AdminLayout({ children, activeTab, onTabChange }) {
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    authService.clearSession();
    window.location.href = '/welcome';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text }}>
      <style>{GOOGLE_FONTS}</style>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px }
        ::-webkit-scrollbar-track { background: transparent }
      `}</style>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          flexShrink: 0,
          background: '#080808',
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 64,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Shield size={15} color="white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 800, color: 'white' }}>
                  UIA <span style={{ color: C.accent }}>Admin</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const Icon    = item.icon;
            const active  = activeTab === item.key;
            return (
              <motion.button
                key={item.key}
                whileHover={{ x: collapsed ? 0 : 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onTabChange(item.key)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'rgba(229,24,30,0.12)' : 'transparent',
                  color: active ? C.accent : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.15s',
                  width: '100%',
                }}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    width: 2.5,
                    height: 20,
                    borderRadius: '0 2px 2px 0',
                    background: C.accent,
                  }} />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom: user + collapse */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* User */}
          {!collapsed && (
            <div style={{ padding: '8px 12px', marginBottom: 4 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 2 }}>
                {user?.name ?? 'Admin'}
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {user?.email ?? ''}
              </p>
            </div>
          )}

          {/* Logout */}
          <motion.button
            whileHover={{ x: collapsed ? 0 : 2 }}
            onClick={handleLogout}
            title={collapsed ? 'Đăng xuất' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: 'rgba(229,24,30,0.6)',
              width: '100%', transition: 'all 0.15s',
            }}
          >
            <LogOut size={16} strokeWidth={1.8} />
            {!collapsed && (
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500 }}>Đăng xuất</span>
            )}
          </motion.button>

          {/* Collapse toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setCollapsed(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '8px 0',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
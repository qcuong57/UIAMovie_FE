// src/components/Navbar.jsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, Settings, LogOut, Shield, ChevronDown, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as variants from '../../motion-configs/variants';
import * as transitions from '../../motion-configs/transitions';
import authService from '../../services/authService';

const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  // ── Sync user khi localStorage thay đổi (sau khi update avatar/profile) ──
  useEffect(() => {
    const syncUser = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener('storage', syncUser);
    // Cũng lắng nghe custom event từ ProfilePage
    window.addEventListener('userUpdated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('userUpdated', syncUser);
    };
  }, []);

  // ── Scroll listener ──────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Click outside dropdown ───────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Nếu API lỗi vẫn xóa session local
    } finally {
      authService.clearSession();
      window.location.href = '/welcome';
    }
  };

  const openSearch = () => {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    else navigate('/search');
    closeSearch();
  };

  const dropdownItems = [
    {
      icon: <User size={15} />,
      label: 'Hồ sơ của tôi',
      onClick: () => navigate('/profile'),
    },
    {
      icon: <Clock size={15} />,
      label: 'Lịch sử xem',
      onClick: () => navigate('/watch-history'),
    },
    {
      icon: <Shield size={15} />,
      label: 'Bảo mật & 2FA',
      onClick: () => navigate('/settings/security'),
    },
    {
      icon: <Settings size={15} />,
      label: 'Cài đặt',
      onClick: () => navigate('/settings'),
    },
  ];

  const avatarLetter = currentUser?.name?.[0]?.toUpperCase() ?? 'U';

  // ── Dynamic nav styles dựa theo scroll ──────────────────────
  const navBg = scrolled
    ? 'rgba(0,0,0,0.97)'
    : 'transparent';

  const navBorder = scrolled
    ? '1px solid rgba(255,255,255,0.06)'
    : '1px solid transparent';

  return (
    <motion.nav
      variants={variants.navbarVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.TRANSITION_HERO_CONTENT}
      className="fixed top-0 left-0 right-0 z-[9999]"
      style={{
        isolation: 'isolate',
        background: navBg,
        borderBottom: navBorder,
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
      }}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-3">

        {/* ── Logo ── */}
        <motion.div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span
            className="text-3xl font-black leading-none"
            style={{ color: '#e5181e', letterSpacing: '-0.02em' }}
          >
            UIA
          </span>
          <span
            className="text-2xl font-bold leading-none"
            style={{
              color: scrolled ? '#ffffff' : '#f0f0f0',
              letterSpacing: '0.06em',
              transition: 'color 0.3s',
            }}
          >
            MOVIE
          </span>
        </motion.div>

        {/* ── Nav links ── */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'Trang chủ', path: '/' },
            // { label: 'Trending', path: '/trending' },
            { label: 'Yêu thích', path: '/favorites' },
            { label: 'Watchlist', path: '/search?filter=watchlist' },
          ].map(({ label, path }, i) => (
            <motion.button
              key={label}
              onClick={() => navigate(path)}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitions.TRANSITION_NORMAL, delay: i * 0.07 }}
              className="relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 group"
              style={{
                color: scrolled ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.7)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              whileHover={{ color: '#ffffff' }}
            >
              <span
                className="relative z-10 transition-colors duration-200 group-hover:text-white"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {label}
              </span>
              {/* Hover pill background */}
              <motion.span
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              />
            </motion.button>
          ))}
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-1">

          {/* Search */}
          <AnimatePresence mode="wait">
            {showSearch ? (
              <motion.form
                key="search-bar"
                initial={{ width: 36, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 36, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                onSubmit={handleSearchSubmit}
                style={{
                  display: 'flex', alignItems: 'center', overflow: 'hidden',
                  background: scrolled ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.4)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <button type="submit" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 10px', display: 'flex',
                  color: 'rgba(255,255,255,0.5)', flexShrink: 0,
                }}>
                  <Search size={15} />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm phim, diễn viên..."
                  onKeyDown={e => e.key === 'Escape' && closeSearch()}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#fff', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    padding: '8px 0', minWidth: 0,
                  }}
                />
                <button type="button" onClick={closeSearch} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 10px', display: 'flex',
                  color: 'rgba(255,255,255,0.3)', flexShrink: 0,
                }}>
                  <X size={14} />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="search-icon"
                onClick={openSearch}
                whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.94 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 rounded-lg transition-colors"
                style={{
                  background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: scrolled ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.7)',
                }}
              >
                <Search size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Bell */}
          <motion.button
            whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.94 }}
            className="p-2 rounded-lg relative"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: scrolled ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.7)',
            }}
          >
            <Bell size={18} />
            {/* Notification dot */}
            <span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: '#e5181e' }}
            />
          </motion.button>

          {/* Divider */}
          <div
            className="mx-1 h-5 w-px"
            style={{
              background: scrolled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
              transition: 'background 0.3s',
            }}
          />

          {/* Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setShowDropdown((prev) => !prev)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
              style={{
                background: showDropdown
                  ? 'rgba(255,255,255,0.1)'
                  : 'transparent',
                border: 'none', cursor: 'pointer',
              }}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #e5181e 0%, #7a0409 100%)',
                  boxShadow: scrolled ? '0 2px 8px rgba(229,24,30,0.4)' : '0 2px 12px rgba(229,24,30,0.5)',
                  transition: 'box-shadow 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span className="font-black text-white text-xs">{avatarLetter}</span>
                )}
              </div>

              {/* Name (chỉ hiện khi scrolled) */}
              <AnimatePresence>
                {scrolled && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-semibold text-white overflow-hidden whitespace-nowrap"
                    style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 80 }}
                  >
                    {currentUser?.name?.split(' ')[0] ?? 'User'}
                  </motion.span>
                )}
              </AnimatePresence>

              <motion.div
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}
              >
                <ChevronDown size={13} />
              </motion.div>
            </motion.button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: 'rgba(12,12,12,0.97)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #e5181e, #7a0409)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {currentUser?.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt="avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="font-black text-white text-sm">{avatarLetter}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate leading-tight">
                          {currentUser?.name ?? 'Người dùng'}
                        </p>
                        <p className="text-xs truncate leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {currentUser?.email ?? ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5 px-1.5">
                    {dropdownItems.map(({ icon, label, onClick }) => (
                      <motion.button
                        key={label}
                        onClick={() => { setShowDropdown(false); onClick(); }}
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>
                        <span
                          className="text-sm"
                          style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {label}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="px-1.5 pb-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <motion.button
                      onClick={handleLogout}
                      whileHover={{ backgroundColor: 'rgba(229,24,30,0.1)' }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors mt-1"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <LogOut size={15} style={{ color: 'rgba(229,24,30,0.7)' }} />
                      <span
                        className="text-sm font-medium"
                        style={{ color: '#e5181e', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Đăng xuất
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
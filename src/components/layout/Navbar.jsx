// src/components/Navbar.jsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, User, Settings, LogOut, Shield, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as variants from '../../motion-configs/variants';
import * as transitions from '../../motion-configs/transitions';
import authService from '../../services/authService';

const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const currentUser = authService.getCurrentUser();

  // Đóng dropdown khi click ra ngoài
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
      window.location.href = '/login'; // hoặc dùng navigate('/login') nếu dùng react-router
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
      onClick: () => { window.location.href = '/profile'; },
    },
    {
      icon: <Shield size={15} />,
      label: 'Bảo mật & 2FA',
      onClick: () => { window.location.href = '/settings/security'; },
    },
    {
      icon: <Settings size={15} />,
      label: 'Cài đặt',
      onClick: () => { window.location.href = '/settings'; },
    },
  ];

  const avatarLetter = currentUser?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <motion.nav
      variants={variants.navbarVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.TRANSITION_HERO_CONTENT}
      className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-b from-black via-black/50 to-transparent"
      style={{ isolation: 'isolate' }}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Logo */}
        <motion.div className="flex items-center gap-2">
          <div className="text-4xl font-black text-red-600">UIA</div>
          <div className="text-3xl font-bold text-white">MOVIE</div>
        </motion.div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['Home', 'Trending', 'My Favorites', 'Watchlist'].map((item, i) => (
            <motion.a
              key={item}
              href="#"
              className="text-base font-medium text-gray-300 hover:text-white"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitions.TRANSITION_NORMAL, delay: i * 0.1 }}
            >
              {item}
            </motion.a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Search — expandable inline bar */}
          <AnimatePresence mode="wait">
            {showSearch ? (
              <motion.form
                key="search-bar"
                initial={{ width: 36, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 36, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                onSubmit={handleSearchSubmit}
                style={{ display: 'flex', alignItems: 'center', overflow: 'hidden',
                  background: 'rgba(255,255,255,0.08)', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
              >
                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 10px', display: 'flex', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                  <Search size={16} />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm phim, diễn viên..."
                  onKeyDown={e => e.key === 'Escape' && closeSearch()}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#fff', fontSize: 13, fontFamily: "'Nunito', sans-serif",
                    padding: '8px 0', minWidth: 0 }}
                />
                <button type="button" onClick={closeSearch}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 10px', display: 'flex', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="search-icon"
                onClick={openSearch}
                className="p-2 hover:bg-white/10 rounded-lg"
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <Search size={20} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Bell */}
          <motion.button className="p-2 hover:bg-white/10 rounded-lg">
            <Bell size={20} />
          </motion.button>

          {/* Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                {avatarLetter}
              </div>
              <motion.span
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={14} className="text-gray-400" />
              </motion.span>
            </motion.button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden shadow-2xl border border-white/10"
                  style={{ background: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(16px)' }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white truncate">
                      {currentUser?.name ?? 'Người dùng'}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {currentUser?.email ?? ''}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {dropdownItems.map(({ icon, label, onClick }) => (
                      <button
                        key={label}
                        onClick={() => { setShowDropdown(false); onClick(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/8 transition-colors text-left"
                      >
                        <span className="text-gray-500">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-white/10 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
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
// src/components/Footer.jsx
import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '40px 24px 32px',
        marginTop: 40,
        background: '#000',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Logo + tagline */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 22, fontWeight: 900, letterSpacing: '0.06em',
            color: '#fff', marginBottom: 6,
          }}>
            <span style={{ color: '#e5181e' }}>UIA</span> MOVIE
          </p>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 12, color: 'rgba(255,255,255,0.3)',
          }}>
            Xem phim hay, mọi lúc mọi nơi
          </p>
        </div>

        {/* Contact */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 20, flexWrap: 'wrap', marginBottom: 28,
        }}>
          {/* Facebook */}
          <a
            href="https://www.facebook.com/gnoucdasick/"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(24,119,242,0.12)';
              e.currentTarget.style.borderColor = 'rgba(24,119,242,0.4)';
              e.currentTarget.style.color = '#4e9af1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            {/* Facebook icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
            Facebook
          </a>

          {/* Gmail */}
          <a
            href="mailto:quoccuong572003@gmail.com"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(234,67,53,0.1)';
              e.currentTarget.style.borderColor = 'rgba(234,67,53,0.35)';
              e.currentTarget.style.color = '#ea4335';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            {/* Gmail icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            quoccuong572003@gmail.com
          </a>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

        {/* Copyright */}
        <p style={{
          textAlign: 'center',
          fontFamily: "'Nunito', sans-serif",
          fontSize: 11, color: 'rgba(255,255,255,0.2)',
        }}>
          © {year} UIA Movie. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
// src/pages/TrendingPage.jsx
// ─── Trang Trending — tạm thời bảo trì / đang cập nhật ────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from '../../context/homeTokens';
import BackButton from '../../components/common/BackButton';
import SectionReveal from '../../motion-configs/SectionReveal';
import { STAGGER_NORMAL } from '../../motion-configs/transitions';

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function TrendingPage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{GOOGLE_FONTS}</style>

      <div
        style={{
          minHeight: '100vh',
          background: C.bg,
          color: C.text,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px 24px 64px' }}>
          {/* ── Header row — giữ nguyên nav quen thuộc ── */}
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 50, marginBottom: 8 }}
          >
            <BackButton />
          </motion.div>
        </div>

        {/* ── Notice — chiếm phần còn lại của viewport, canh giữa ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px 100px',
          }}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: STAGGER_NORMAL } }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: 520,
              width: '100%',
            }}
          >
            {/* Icon — viền mảnh, không glow, không nền màu */}
            <SectionReveal variant="fade">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: `1px solid ${C.borderMid}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 28,
                }}
              >
                <Wrench size={20} color={C.textSub} strokeWidth={1.5} />
              </div>
            </SectionReveal>

            {/* Nhãn nhỏ, chữ hoa, cách chữ rộng — thay cho badge */}
            <SectionReveal variant="fade" delay={0.06}>
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: C.textDim,
                  marginBottom: 18,
                  display: 'block',
                }}
              >
                Đang cập nhật
              </span>
            </SectionReveal>

            {/* Tiêu đề */}
            <SectionReveal variant="slide-up" delay={0.1}>
              <h1
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 700,
                  color: C.text,
                  lineHeight: 1.3,
                  marginBottom: 12,
                  letterSpacing: '-0.01em',
                }}
              >
                Trang này đang được nâng cấp
              </h1>
            </SectionReveal>

            {/* Mô tả */}
            <SectionReveal variant="slide-up" delay={0.16}>
              <p
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 14,
                  fontWeight: 400,
                  color: C.textSub,
                  lineHeight: 1.7,
                  marginBottom: 36,
                  maxWidth: 380,
                }}
              >
                Chúng tôi đang cải thiện tính năng này để mang đến trải nghiệm
                tốt hơn. Vui lòng quay lại sau.
              </p>
            </SectionReveal>

            {/* Nút quay lại trang chủ — outline, không shadow màu */}
            <SectionReveal variant="fade" delay={0.22}>
              <motion.button
                whileHover={{ borderColor: C.borderBright, color: C.text }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 24px',
                  borderRadius: 6,
                  background: 'transparent',
                  border: `1px solid ${C.borderMid}`,
                  cursor: 'pointer',
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.textSub,
                  transition: 'border-color 0.2s, color 0.2s',
                }}
              >
                Về trang chủ
              </motion.button>
            </SectionReveal>
          </motion.div>
        </div>
      </div>
    </>
  );
}
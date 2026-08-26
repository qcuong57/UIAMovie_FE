// src/pages/TrendingPage.jsx
// ─── Trang Trending — tạm thời bảo trì / đang cập nhật ────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import { Construction, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_DISPLAY, FONT_BODY, FONT_BEBAS, GOOGLE_FONTS } from '../../context/homeTokens';
import BackButton from '../../components/common/BackButton';
import SectionReveal from '../../motion-configs/SectionReveal';
import { floatVariants } from '../../motion-configs/variants';
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
            {/* Icon — nổi bật, có glow + float nhẹ */}
            <SectionReveal variant="scale-fade">
              <motion.div
                variants={floatVariants}
                animate="animate"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  background: 'rgba(229,24,30,0.10)',
                  border: '1px solid rgba(229,24,30,0.25)',
                  boxShadow: '0 0 40px rgba(229,24,30,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 28,
                }}
              >
                <Construction size={40} color={C.accent} strokeWidth={1.75} />
              </motion.div>
            </SectionReveal>

            {/* Badge nhỏ */}
            <SectionReveal variant="fade" delay={0.05}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 99,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  marginBottom: 20,
                }}
              >
                <Sparkles size={12} color={C.gold} />
                <span
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: C.textSub,
                  }}
                >
                  Đang cập nhật
                </span>
              </div>
            </SectionReveal>

            {/* Tiêu đề */}
            <SectionReveal variant="slide-up" delay={0.1}>
              <h1
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 'clamp(22px, 3vw, 32px)',
                  fontWeight: 800,
                  color: C.text,
                  lineHeight: 1.25,
                  marginBottom: 14,
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
                  color: C.textSub,
                  lineHeight: 1.7,
                  marginBottom: 32,
                  maxWidth: 420,
                }}
              >
                Chúng tôi đang cải thiện tính năng này để mang đến trải nghiệm mượt mà
                và tốt hơn cho bạn. Vui lòng quay lại sau ít phút.
              </p>
            </SectionReveal>

            {/* Divider info: đang xử lý */}
            <SectionReveal variant="fade" delay={0.22}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 32,
                  color: C.textDim,
                }}
              >
                <Clock size={13} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 12 }}>
                  Dự kiến sẽ sớm hoạt động trở lại
                </span>
              </div>
            </SectionReveal>

            {/* Nút quay lại trang chủ */}
            <SectionReveal variant="slide-up" delay={0.28}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 26px',
                  borderRadius: 8,
                  background: C.accent,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: `0 8px 24px ${C.accentGlow}`,
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
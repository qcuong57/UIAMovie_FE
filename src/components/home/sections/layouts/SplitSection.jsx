// src/components/home/sections/layouts/SplitSection.jsx
// split (theo quốc gia): nửa trái là "hồ sơ quốc gia + phim đang chọn", nửa phải là ảnh lớn hoà vào nhau bằng dải mờ (tối đa 10 phim).
//  • Khối "Theo quốc gia" → tiêu đề "Phim <nước>" + số phim; khối khác → hiện nước sản xuất của phim đang chọn
//  • Khối có từ 2 quốc gia trở lên → hàng chip cờ để lọc theo nước (Tất cả · KR · JP …)
//  • Chọn phim bằng dải poster cuộn ngang (mờ dần ở mép khi còn phim bị che): rê chuột (desktop) hoặc chạm (mobile) vào poster; phím ← →
//    (không có nút ‹ › và bộ đếm)
//  • Không tự chuyển, người xem chủ động chọn. Mobile: ảnh ở trên, thông tin ngay bên dưới
//
// KHUNG CỐ ĐỊNH: mọi vùng đều có chiều cao đặt sẵn nên đổi phim chỉ đổi chữ/ảnh bên trong, không làm khối co giãn.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Crown } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../../context/homeTokens';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { infoPath } from '../../../../utils/normalizeHomeCard';
import LayoutStyles from '../shared/LayoutStyles';
import SectionHeading from '../shared/SectionHeading';
import Cover from '../shared/Cover';
import { Rating, PremiumTag } from '../shared/Badges';
import { accentOf, keyOf, imgOf, metaOf, clampLines } from '../shared/layoutUtils';
import { HOME_EASE } from '../shared/motionPresets';

const MAX_ITEMS = 10;

// Tải trước một ảnh (không ép decode ngay: decode hàng loạt lúc mount làm đứng main thread)
function preloadImage(src) {
  if (!src) return;
  const im = new Image();
  im.decoding = 'async';
  im.src = src;
}

// ── Quốc gia: nhận mã ISO 2 chữ cái (KR) hoặc tên; cờ lấy từ flagcdn (emoji cờ không hiện trên Windows) ──
const VI_NAMES = {
  VN: 'Việt Nam', KR: 'Hàn Quốc', JP: 'Nhật Bản', CN: 'Trung Quốc', US: 'Mỹ', GB: 'Anh', TH: 'Thái Lan', IN: 'Ấn Độ',
  FR: 'Pháp', DE: 'Đức', HK: 'Hồng Kông', TW: 'Đài Loan', ES: 'Tây Ban Nha', IT: 'Ý', CA: 'Canada', AU: 'Úc',
};
function countryName(code) {
  if (VI_NAMES[code]) return VI_NAMES[code];
  try { return new Intl.DisplayNames(['vi'], { type: 'region' }).of(code) || code; } catch { return code; }
}
// Trả { code, name } hoặc null. Chấp nhận chuỗi, mảng (lấy phần tử đầu) hoặc "KR, JP" (lấy mã đầu).
function parseCountry(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || typeof raw !== 'string') return null;
  const v = raw.split(',')[0].trim();
  if (!v) return null;
  if (/^[A-Za-z]{2}$/.test(v)) { const code = v.toUpperCase(); return { code, name: countryName(code) }; }
  return { code: null, name: v };
}
const codeOf = (item) => parseCountry(item.country)?.code ?? null;

// Cờ; nếu ảnh cờ lỗi thì hiện ô chữ mã nước để không vỡ bố cục. Kích thước luôn cố định.
function Flag({ code, width = 28, style }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [code]);
  if (!code) return null;
  const h = Math.round(width * 0.72);
  if (bad) {
    return (
      <span
        aria-hidden
        style={{ display: 'grid', placeItems: 'center', width, height: h, borderRadius: 3, flex: '0 0 auto', background: 'rgba(255,255,255,.1)', fontFamily: FONT_BODY, fontSize: Math.max(8, Math.round(width * 0.34)), fontWeight: 800, color: C.textSub, ...style }}
      >
        {code}
      </span>
    );
  }
  const lc = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${lc}.png`} srcSet={`https://flagcdn.com/w80/${lc}.png 2x`}
      width={width} height={h} alt="" draggable={false} onError={() => setBad(true)}
      style={{ display: 'block', width, height: h, objectFit: 'cover', borderRadius: 3, boxShadow: '0 0 0 1px rgba(255,255,255,.18)', flex: '0 0 auto', ...style }}
    />
  );
}

// Không dùng transform khi hover poster (tránh bị cắt / sinh thanh cuộn dọc trong dải overflow)
const SL_CSS = `
.hsl-sl-poster{transition:opacity .12s ease-out,box-shadow .12s ease-out;-webkit-tap-highlight-color:transparent}
.hsl-sl-poster:hover{opacity:1 !important}
.hsl-sl-chip{transition:background .2s,color .2s}
.hsl-sl-chip:hover{background:rgba(255,255,255,.12)}
.hsl-sl-poster:focus-visible,.hsl-sl-chip:focus-visible{outline:2px solid var(--hsl-accent,#fff);outline-offset:2px}
.hsl-sl-scroll{scrollbar-width:none;-ms-overflow-style:none}
.hsl-sl-scroll::-webkit-scrollbar{display:none}
`;

export function SplitSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  const items = useMemo(() => (section.items ?? []).slice(0, MAX_ITEMS), [section.items]);
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState(null); // mã nước đang lọc; null = tất cả
  const [edges, setEdges] = useState({ l: false, r: false }); // dải poster còn phim bị che ở mép trái / phải
  const timer = useRef(null);
  const stripRef = useRef(null);
  const autoScroll = useRef(false); // chỉ tự cuộn khi đổi bằng nút/phím/chip; rê chuột trên dải thì KHÔNG cuộn (tránh poster chạy dưới con trỏ)
  useEffect(() => () => clearTimeout(timer.current), []);

  // Khối "Theo quốc gia": lấy nước từ cấu hình khối (tên trường BE có thể khác nhau → thử vài chỗ)
  const sectionCountry = parseCountry(
    section.autoRule === 'country' ? section.autoParam : (section.config?.country ?? section.config?.countryCode ?? section.config?.autoParam),
  );

  // Khối nhiều nước → gom theo nước để làm chip lọc: [[code, số phim], …]
  const groups = useMemo(() => {
    if (sectionCountry) return [];
    const map = new Map();
    items.forEach((it) => { const c = codeOf(it); if (c) map.set(c, (map.get(c) ?? 0) + 1); });
    return map.size >= 2 ? [...map] : [];
  }, [items, sectionCountry?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = filter ? items.filter((it) => codeOf(it) === filter) : items;
  const n = visible.length;
  const safeIndex = Math.min(index, Math.max(0, n - 1));
  const active = visible[safeIndex];

  const updateEdges = () => {
    const el = stripRef.current;
    if (!el) return;
    const l = el.scrollLeft > 2;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((p) => (p.l === l && p.r === r ? p : { l, r }));
  };
  useEffect(() => {
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Đưa poster đang chọn vào giữa dải (chỉ cuộn bên trong dải, không cuộn trang)
  useEffect(() => {
    const box = stripRef.current;
    if (!box) return;
    if (autoScroll.current) {
      autoScroll.current = false;
      const el = box.children[safeIndex];
      if (el) {
        const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
        box.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    updateEdges();
  }, [safeIndex, filter, n]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chỉ tải trước ảnh nền của phim kế bên (poster đã nằm sẵn trong dải): đổi phim không bị khung trống,
  // mà không tải cả bộ 10 ảnh ngay lúc vào trang (trước đây chặn băng thông của banner đầu trang)
  useEffect(() => {
    if (n < 2) return;
    preloadImage(imgOf(visible[(safeIndex + 1) % n]));
    preloadImage(imgOf(visible[(safeIndex - 1 + n) % n]));
  }, [safeIndex, filter, items]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  const pick = (i) => { clearTimeout(timer.current); setIndex(i); };
  // Rê chuột tới poster nào đổi phim đó ngay, lướt nhanh sẽ chạy qua từng poster (fade ngắn nên không bị nhấp nháy)
  const peek = (i) => {
    if (isMobile) return;
    clearTimeout(timer.current);
    setIndex(i);
  };
  const next = () => { autoScroll.current = true; pick((safeIndex + 1) % n); };
  const prev = () => { autoScroll.current = true; pick((safeIndex - 1 + n) % n); };
  const pickCountry = (code) => {
    if (code === filter) return;
    clearTimeout(timer.current); autoScroll.current = true; setFilter(code); setIndex(0);
  };
  const onKeyDown = (e) => {
    if (n < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  const premium = Boolean(active.isPremium);

  // Nước hiển thị ở đầu khối: nước của khối > nước đang lọc > nước của phim đang chọn
  const country = sectionCountry ?? (filter ? { code: filter, name: countryName(filter) } : parseCountry(active.country));
  const countryTitle = sectionCountry ? `Phim ${sectionCountry.name}` : country?.name;
  const eyebrow = sectionCountry ? `${items.length} PHIM` : 'QUỐC GIA SẢN XUẤT';

  // Kích thước cố định theo thiết bị
  // Mobile gọn hơn: tiêu đề nhỏ hơn, mô tả 2 dòng, poster nhỏ
  const titleFs = isMobile ? 19 : 'clamp(24px, 2.5vw, 32px)';
  const descFs = isMobile ? 13 : 14;
  const descLh = isMobile ? 20 : 23;
  const descLines = isMobile ? 2 : 3;
  const posterW = isMobile ? 38 : 46;
  const fade = { duration: reduce ? 0 : 0.18, ease: HOME_EASE };
  const imgFade = { duration: reduce ? 0 : 0.26, ease: HOME_EASE };

  // Mờ dần ở mép dải poster khi còn phim bị che
  const maskStops = [
    edges.l ? 'transparent 0, #000 26px' : '#000 0',
    edges.r ? '#000 calc(100% - 26px), transparent 100%' : '#000 100%',
  ].join(', ');
  const stripMask = `linear-gradient(90deg, ${maskStops})`;

  // ── Ảnh lớn (nửa phải / phần trên ở mobile) ────────────────────────────────
  const image = (
    <div
      style={isMobile
        ? { position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', background: C.surfaceHigh }
        : { position: 'absolute', top: 0, bottom: 0, right: 0, width: '60%', overflow: 'hidden', background: C.surfaceHigh }}
    >
      {/* Crossfade thuần: không scale, không đổi kích thước */}
      <AnimatePresence initial={false}>
        <motion.div
          key={keyOf(active)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}
          transition={imgFade}
          style={{ position: 'absolute', inset: 0, willChange: 'opacity' }}
        >
          <Cover item={active} src={imgOf(active)} />
        </motion.div>
      </AnimatePresence>
      {/* Dải mờ hoà ảnh vào nền của nửa thông tin */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: isMobile
            ? `linear-gradient(0deg, ${C.surfaceMid} 0%, rgba(0,0,0,0) 22%)`
            : `linear-gradient(90deg, ${C.surfaceMid} 0%, rgba(0,0,0,0) 45%)`,
        }}
      />
      {premium && <PremiumTag style={{ top: isMobile ? 10 : 14, right: isMobile ? 10 : 14, zIndex: 2 }} />}

      {/* Mobile: thông tin quốc gia và bộ đếm nằm gọn trên ảnh thay cho một hàng riêng bên dưới */}
      {isMobile && country && (
        <span
          style={{
            position: 'absolute', left: 10, bottom: 10, zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 7, maxWidth: '68%',
            padding: '4px 11px 4px 6px', borderRadius: 999, background: 'rgba(0,0,0,.6)',
          }}
        >
          <Flag code={country.code} width={18} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2, ...clampLines(1) }}>{countryTitle}</span>
        </span>
      )}
    </div>
  );

  // ── Hàng chip lọc theo quốc gia (chỉ khi khối có ≥ 2 nước); cao cố định 30px ──
  const chips = groups.length > 0 && (
    <div role="group" aria-label="Lọc theo quốc gia" className="hsl-sl-scroll" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, flex: '0 0 30px', overflowX: 'auto', overflowY: 'hidden' }}>
      {[[null, items.length], ...groups].map(([code, count]) => {
        const on = filter === code;
        return (
          <button
            key={code ?? 'all'} type="button" className="hsl-sl-chip" aria-pressed={on} onClick={() => pickCountry(code)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, flex: '0 0 auto', height: 26, padding: '0 11px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1,
              background: on ? accent : 'rgba(255,255,255,.06)', color: on ? '#111' : C.textSub,
            }}
          >
            {code ? <><Flag code={code} width={16} /> {code}</> : 'Tất cả'}
            <span style={{ opacity: on ? 0.65 : 0.55, fontWeight: 600 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );

  // ── Nút "Xem ngay" (dùng chung desktop / mobile) ──
  const cta = (
    <motion.div whileHover={reduce ? undefined : { scale: 1.04 }} whileTap={reduce ? undefined : { scale: 0.96 }} style={{ display: 'inline-flex' }}>
      <Link
        to={infoPath(active)} className="hsl-link"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
          padding: isMobile ? '9px 18px' : '11px 28px', borderRadius: 8,
          fontFamily: FONT_BODY, fontSize: isMobile ? 13 : 15, fontWeight: 700,
          background: premium ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#ffffff',
          color: premium ? '#1c1400' : '#000000',
          boxShadow: premium ? '0 4px 16px rgba(251,191,36,0.35)' : 'none',
        }}
      >
        {premium
          ? <Crown size={15} fill="#1c1400" color="#1c1400" />
          : <Play size={15} fill="currentColor" strokeWidth={0} />}
        Xem ngay
      </Link>
    </motion.div>
  );

  // ── Mobile: hàng nút "Xem ngay" (ô cao cố định) ──
  const mobileActions = isMobile && (
    <div style={{ display: 'flex', alignItems: 'center', height: 40, flex: '0 0 40px' }}>{cta}</div>
  );

  // ── Vùng phim đang chọn: chiều cao CỐ ĐỊNH, chỉ nội dung bên trong đổi (fade, không thu/mở) ──
  const movie = (
    <motion.div
      key={keyOf(active)}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade}
      style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 12, minWidth: 0 }}
    >
      {/* Tiêu đề: luôn chiếm 2 dòng */}
      <h3
        style={{ margin: 0, height: '2.4em', fontFamily: FONT_DISPLAY, fontSize: titleFs, fontWeight: 800, color: C.text, lineHeight: 1.2, letterSpacing: '-0.03em', overflowWrap: 'anywhere', ...clampLines(2) }}
      >
        {active.title}
      </h3>
      {/* Meta: luôn cao 20px, không xuống dòng */}
      <p style={{ margin: 0, height: 20, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.textSub }}>
        <Rating value={active.rating} size={13} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{metaOf(active, 2)}</span>
      </p>
      {/* Mô tả: luôn chiếm đủ số dòng (desktop 3 · mobile 2) dù ngắn hay không có */}
      <p style={{ margin: 0, maxWidth: '48ch', height: descLh * descLines, fontFamily: FONT_BODY, fontSize: descFs, lineHeight: `${descLh}px`, color: C.textSub, ...clampLines(descLines) }}>
        {active.description || ''}
      </p>
      {/* Desktop: nút Xem ngay nằm trong ô cao cố định (mobile dùng hàng riêng bên dưới) */}
      {!isMobile && (
        <div style={{ height: 46, display: 'flex', alignItems: 'center', marginTop: 2 }}>{cta}</div>
      )}
    </motion.div>
  );

  // ── Nửa thông tin ───────────────────────────────────────────────────────────
  const info = (
    <div
      style={{
        position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: isMobile ? 14 : 18, minWidth: 0,
        ...(isMobile
          ? { padding: '14px 16px 16px' }
          : { flex: '0 0 46%', width: '46%', height: '100%', boxSizing: 'border-box', padding: '26px 8px 24px 40px', overflow: 'hidden' }),
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 14, minWidth: 0 }}>
        {/* Hàng đầu (desktop, cao 36px): hồ sơ quốc gia. Mobile: ẩn, thông tin này nằm trên ảnh */}
        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 10, height: 36, flex: '0 0 36px' }}>
          {country && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              <Flag code={country.code} width={isMobile ? 30 : 36} />
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 15 : 18, fontWeight: 800, letterSpacing: '-0.01em', color: C.text, lineHeight: 1.15, ...clampLines(1) }}>
                  {countryTitle}
                </span>
                <span style={{ marginTop: 2, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1.1, color: accent, whiteSpace: 'nowrap' }}>
                  {eyebrow}
                </span>
              </span>
            </span>
          )}
        </div>

        {chips}

        {movie}

        {mobileActions}
      </div>

      {/* Dải poster chọn phim: cao cố định theo tỉ lệ 2:3, cuộn ngang khi nhiều phim */}
      {n > 1 && (
        <div
          ref={stripRef} onScroll={updateEdges}
          className="hsl-sl-scroll" role="group" aria-label="Chọn phim"
          style={{
            position: 'relative', display: 'flex', gap: isMobile ? 6 : 8, overflowX: 'auto', overflowY: 'hidden', padding: 4, margin: -4, flex: '0 0 auto',
            WebkitMaskImage: stripMask, maskImage: stripMask,
          }}
        >
          {visible.map((it, i) => {
            const on = i === safeIndex;
            const flagCode = !isMobile && !sectionCountry && !filter ? codeOf(it) : null; // mobile: bỏ cờ nhỏ trên poster cho đỡ rối
            return (
              <button
                key={keyOf(it)} type="button" className="hsl-sl-poster" aria-label={it.title} title={it.title} aria-current={on ? 'true' : undefined}
                onClick={() => pick(i)} onFocus={() => pick(i)} onMouseEnter={() => peek(i)} onMouseLeave={() => clearTimeout(timer.current)}
                style={{
                  position: 'relative', flex: `0 0 ${posterW}px`, width: posterW, height: Math.round(posterW * 1.5), padding: 0, overflow: 'hidden', cursor: 'pointer',
                  borderRadius: 6, background: C.surfaceHigh, border: 'none', opacity: on ? 1 : 0.5,
                  boxShadow: on ? `0 0 0 2px ${accent}` : '0 0 0 1px rgba(255,255,255,.1)',
                }}
              >
                {(it.posterUrl || imgOf(it)) && (
                  <img src={it.posterUrl || imgOf(it)} alt="" loading="lazy" decoding="async" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {flagCode && <Flag code={flagCode} width={14} style={{ position: 'absolute', left: 3, bottom: 3 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <section
      role="region" aria-roledescription="carousel" aria-label={section.title}
      onKeyDown={onKeyDown}
      style={{ marginBottom: isMobile ? 32 : 44, '--hsl-accent': accent }}
    >
      <LayoutStyles />
      <style>{SL_CSS}</style>
      <SectionHeading title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile} />
      <div
        style={{
          position: 'relative', overflow: 'hidden', background: C.surfaceMid, borderRadius: isMobile ? 12 : 10,
          // Desktop: chiều cao CỐ ĐỊNH (không dùng minHeight) → không bao giờ co giãn khi đổi phim
          ...(isMobile ? {} : { display: 'flex', height: 'clamp(470px, 36vw, 510px)' }),
        }}
      >
        {image}
        {info}
      </div>
    </section>
  );
}
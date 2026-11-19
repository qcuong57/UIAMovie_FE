// src/components/admin/AdminHomeSections.jsx
// Admin → Bộ sưu tập (hiển thị trên trang chủ): gom phim thành các bộ sưu tập, chọn kiểu bố trí,
// kéo thả đổi thứ tự bộ sưu tập / thứ tự phim, hẹn giờ hiển thị. Giao diện trang chủ KHÔNG hard code.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Plus, GripVertical, Pencil, Trash2, X, Search, Film, Tv, Crown, AlertTriangle,
  Clock, Wand2, ListChecks, Loader2, Info, LayoutGrid, Eye,
} from 'lucide-react';
import {
  useAdminHomeSections, useHomeSectionMeta, useContentSearch, useSaveHomeSection,
  useDeleteHomeSection, useSetHomeSectionActive, useReorderHomeSections,
} from '../../hooks/useAdminHomeSections';
import { useGenres } from '../../hooks/useHomeQueries';
import { useToast } from './common/Toast';
import ConfirmDeleteModal, { InfoBox, WarnBox, IrreversibleNote } from './common/ConfirmDeleteModal';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../context/adminTokens';

// ── Nhãn hiển thị (key do BE quyết định, FE chỉ đặt tên tiếng Việt; key lạ hiện nguyên key) ──
const LAYOUT_INFO = {
  carousel:  { name: 'Carousel',      desc: 'Hàng cuộn ngang quen thuộc' },
  grid:      { name: 'Lưới',          desc: 'Lưới poster chia trang, chọn số cột × hàng' },
  hero:      { name: 'Hero',          desc: 'Banner lớn nổi bật, tự chuyển (tối đa 5 phim)' },
  ranked:    { name: 'Xếp hạng',      desc: 'Số thứ hạng lớn kiểu Top 10' },
  banner:    { name: 'Banner ngang',  desc: 'Thẻ backdrop rộng, cuộn ngang' },
  spotlight: { name: 'Tiêu điểm',     desc: 'Sân khấu lớn + poster nổi, dock thumbnail để chọn (tối đa 8 phim)' },
  mosaic:    { name: 'Mosaic',        desc: '1 ô lớn + 4 ô nhỏ bất đối xứng (tối đa 5 phim)' },
  accordion: { name: 'Accordion',     desc: 'Dải panel, rê chuột thì mở rộng (tối đa 6 phim)' },
  list:      { name: 'Danh sách',     desc: 'Thumbnail + thông tin dạng hàng, nhiều cột' },
  billboard: { name: 'Billboard',     desc: 'Banner điện ảnh tự xoay, trailer tự phát, thẻ “Tiếp theo” (tối đa 5 phim)' },
  trailer:   { name: 'Trailer',       desc: 'Phòng chiếu trailer: viền đen, khung video + bảng thông tin đầy đủ mô tả, dải thẻ đánh số để chọn phim (tối đa 12 phim)' },
  split:     { name: 'Chia đôi',      desc: 'Hồ sơ quốc gia + ảnh lớn, nút ‹ › và dải poster để chọn phim, tự có chip lọc cờ khi nhiều nước (tối đa 10 phim)' },
};
// Số phim tối đa thực sự được hiển thị (khớp với FE). Layout không có trong bảng = không giới hạn cứng.
const LAYOUT_LIMIT = { hero: 5, billboard: 5, trailer: 12, spotlight: 8, mosaic: 5, accordion: 6, split: 10, ranked: 10 };
const LAYOUT_NOTE = {
  hero: 'Hero tự chuyển giữa các phim đầu tiên. Nên chọn phim có backdrop đẹp và mô tả.',
  billboard: 'Billboard xoay vòng các phim đầu tiên với thanh tiến trình. Nên chọn phim có backdrop, mô tả và trailer — trailer tự phát (tắt tiếng) trên cả máy tính lẫn điện thoại.',
  spotlight: 'Tiêu điểm không tự chuyển, người xem chọn qua dock bên dưới. Nên chọn phim có đủ poster dọc, backdrop và mô tả — poster dọc hiện nổi bên phải sân khấu.',
  mosaic: 'Phim đầu tiên là ô lớn, các phim sau là ô nhỏ.',
  accordion: 'Trên điện thoại sẽ hiện dạng thẻ poster cuộn ngang.',
  trailer: 'Khung video bên trái tự phát trailer (tắt tiếng) khi khối vào màn hình, thông tin phim nằm ở bảng bên phải (điện thoại: bên dưới video). Hết một lượt trailer thì tự chuyển phim kế; người xem bấm thẻ đánh số bên dưới để chọn. Nên chọn phim có backdrop, mô tả và trailer — phim không có trailer chỉ hiện ảnh tĩnh. Người dùng bật Giảm chuyển động hoặc Tiết kiệm dữ liệu sẽ không tự phát mà phải bấm nút ▶.',
  split: 'Hướng theo quốc gia: đầu khối hiện cờ + tên nước (chọn quy tắc “Theo quốc gia” thì tiêu đề là “Phim <nước>”). Nếu bộ sưu tập có từ 2 nước trở lên, người xem có thêm chip cờ để lọc theo nước. Phim đầu tiên được chọn sẵn; người xem đổi phim bằng nút ‹ › (hoặc phím ← →) hoặc rê chuột / chạm vào dải poster, dải này tự cuộn khi có nhiều phim. Nên chọn phim có backdrop, poster dọc, mô tả và thông tin nước sản xuất.',
  ranked: 'Hiển thị đúng thứ tự bạn sắp.',
};
const AUTO_RULE_INFO = {
  trending: 'Đang thịnh hành', latest: 'Mới phát hành', top_rated: 'Đánh giá cao', genre: 'Theo thể loại',
  upcoming: 'Sắp chiếu', year: 'Theo năm', country: 'Theo quốc gia',
};
// Quốc gia phổ biến (mã ISO 3166-1 alpha-2) — BE chỉ nhận 2 chữ cái
const COUNTRIES = [
  ['VN', 'Việt Nam'], ['KR', 'Hàn Quốc'], ['JP', 'Nhật Bản'], ['CN', 'Trung Quốc'], ['US', 'Mỹ'],
  ['GB', 'Anh'], ['TH', 'Thái Lan'], ['IN', 'Ấn Độ'], ['FR', 'Pháp'], ['DE', 'Đức'],
  ['HK', 'Hồng Kông'], ['TW', 'Đài Loan'], ['ES', 'Tây Ban Nha'], ['IT', 'Ý'], ['CA', 'Canada'], ['AU', 'Úc'],
];
const AUTO_TYPE_INFO = { all: 'Phim + TV show', movie: 'Chỉ phim lẻ', tvshow: 'Chỉ TV show' };
// '' = màu mặc định của site (C.accent). BE chỉ nhận dạng #RRGGBB.
const ACCENT_GROUPS = [
  { label: 'Vàng · Cam',  colors: ['#e8c97e', '#f5c518', '#fbbf24', '#fb923c'] },
  { label: 'Đỏ · Hồng',   colors: ['#ef4444', '#e87e7e', '#fb7185', '#f472b6'] },
  { label: 'Tím',         colors: ['#c47ee8', '#a78bfa', '#818cf8', '#e879f9'] },
  { label: 'Xanh dương',  colors: ['#7eaee8', '#60a5fa', '#38bdf8', '#22d3ee'] },
  { label: 'Xanh lá',     colors: ['#2dd4bf', '#34d399', '#4ade80', '#a3e635'] },
  { label: 'Trung tính',  colors: ['#ffffff', '#cbd5e1', '#94a3b8', '#d6c7a8'] },
];
const ALL_ACCENTS = ACCENT_GROUPS.flatMap((g) => g.colors);
const HEX6 = /^#[0-9a-fA-F]{6}$/;
const ACCENT_LAYOUTS = ['carousel', 'grid', 'banner', 'hero', 'spotlight', 'mosaic', 'accordion', 'list', 'billboard', 'trailer', 'split']; // ranked dùng màu cố định
const GREEN = '#16A34A';
const AMBER = '#D97706';
const BLUE = '#2563EB';

const layoutName = (k) => LAYOUT_INFO[k]?.name ?? k;
const errMsg = (e, fallback) => e?.response?.data?.message ?? e?.message ?? fallback;

const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '');

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Trạng thái hiển thị thực tế của bộ sưu tập trên trang chủ. key dùng cho bộ lọc.
function statusOf(s) {
  const now = Date.now();
  if (!s.isActive) return { key: 'off', label: 'Đã tắt', color: T.textMuted };
  if (s.startAt && new Date(s.startAt).getTime() > now) return { key: 'scheduled', label: `Hẹn giờ · ${fmt(s.startAt)}`, color: BLUE };
  if (s.endAt && new Date(s.endAt).getTime() < now) return { key: 'expired', label: 'Đã hết hạn', color: T.red };
  if (s.sourceType !== 'Auto' && !s.items?.length) return { key: 'empty', label: 'Trống · không hiển thị', color: AMBER };
  return { key: 'live', label: 'Đang hiển thị', color: GREEN };
}

// ── CSS dùng chung (hover / focus / skeleton) ────────────────────────────────
const ADMIN_CSS = `
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ahs-pulse{0%,100%{opacity:.55}50%{opacity:1}}
.ahs-row{transition:box-shadow .2s,border-color .2s,background .2s}
.ahs-row:hover{border-color:${T.accent}55 !important}
.ahs-icon{transition:background .15s;border-radius:8px}
.ahs-icon:hover{background:${T.surfaceAlt} !important}
.ahs-card{transition:border-color .15s,background .15s,transform .15s}
.ahs-card:hover{transform:translateY(-1px)}
.ahs-tab{transition:background .15s,color .15s}
.ahs-focus:focus-visible,.ahs-icon:focus-visible,.ahs-card:focus-visible,.ahs-tab:focus-visible,button:focus-visible{outline:2px solid ${T.accent};outline-offset:2px}
`;

// ── Hình minh hoạ từng layout ────────────────────────────────────────────────
function LayoutThumb({ layout, active, w = 60 }) {
  const c = active ? T.accent : T.textMuted;
  const f = c + '55';
  const shapes = {
    carousel: [4, 22, 24, 32].map((x, i) => <rect key={i} x={4 + i * 14} y="14" width="11" height="16" rx="2" fill={f} />),
    grid: [0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((col) => (
      <rect key={`${r}${col}`} x={4 + col * 14} y={5 + r * 11} width="11" height="9" rx="2" fill={f} />
    ))),
    hero: [<rect key="h" x="4" y="6" width="52" height="28" rx="3" fill={f} />, <rect key="t" x="8" y="22" width="20" height="3" rx="1.5" fill={c} />, <rect key="b" x="8" y="27" width="10" height="3" rx="1.5" fill={c} />],
    ranked: [0, 1, 2].map((i) => (
      <g key={i}><rect x={4 + i * 18} y="10" width="7" height="20" rx="2" fill={c} /><rect x={12 + i * 18} y="10" width="9" height="20" rx="2" fill={f} /></g>
    )),
    banner: [0, 1].map((i) => <rect key={i} x={4 + i * 30} y="12" width="26" height="16" rx="2" fill={f} />),
    // Sân khấu + poster nổi bên phải + dock thumbnail
    spotlight: [
      <rect key="b" x="4" y="4" width="52" height="22" rx="3" fill={f} />,
      <rect key="p" x="42" y="7" width="11" height="16" rx="1.5" fill={c} />,
      <rect key="t" x="8" y="14" width="18" height="3" rx="1.5" fill={c} />,
      <rect key="t2" x="8" y="19" width="10" height="2.5" rx="1.2" fill={c} />,
      ...[0, 1, 2, 3].map((i) => <rect key={i} x={4 + i * 13.5} y="29" width="12" height="7" rx="1.5" fill={i === 0 ? c : f} />),
    ],
    mosaic: [
      <rect key="b" x="4" y="5" width="28" height="30" rx="3" fill={f} />,
      ...[0, 1].flatMap((r) => [0, 1].map((col) => (
        <rect key={`${r}${col}`} x={35 + col * 11} y={5 + r * 16} width="10" height="14" rx="2" fill={f} />
      ))),
    ],
    accordion: [7, 7, 22, 7].map((w2, i, a) => (
      <rect key={i} x={4 + a.slice(0, i).reduce((x, v) => x + v + 3, 0)} y="6" width={w2} height="28" rx="2.5" fill={i === 2 ? c : f} />
    )),
    list: [0, 1].flatMap((col) => [0, 1, 2].map((r) => (
      <g key={`${col}${r}`}>
        <rect x={4 + col * 29} y={6 + r * 11} width="12" height="8" rx="2" fill={f} />
        <rect x={19 + col * 29} y={7 + r * 11} width="11" height="2.5" rx="1.2" fill={c} />
        <rect x={19 + col * 29} y={11 + r * 11} width="7" height="2" rx="1" fill={f} />
      </g>
    ))),
    // Ảnh full + chữ + nút trắng + thanh phân đoạn + thẻ "Tiếp theo"
    billboard: [
      <rect key="b" x="4" y="4" width="52" height="32" rx="3" fill={f} />,
      <rect key="t" x="8" y="17" width="20" height="4" rx="2" fill={c} />,
      <rect key="p" x="8" y="23" width="9" height="4" rx="2" fill="#fff" stroke={c} strokeWidth="0.6" />,
      <rect key="s1" x="8" y="31" width="9" height="1.6" rx="0.8" fill={c} />,
      <rect key="s2" x="19" y="31" width="4" height="1.6" rx="0.8" fill={f} />,
      <rect key="s3" x="25" y="31" width="4" height="1.6" rx="0.8" fill={f} />,
      <rect key="n" x="38" y="26" width="15" height="7" rx="1.5" fill={c} opacity="0.85" />,
    ],
    // Khung video bên trái + bảng thông tin bên phải + dải thẻ đánh số bên dưới
    trailer: [
      <rect key="v" x="4" y="4" width="36" height="22" rx="2.5" fill={f} />,
      <path key="p" d="M19 10.5 l8 4.5 l-8 4.5 z" fill={c} />,
      <rect key="i" x="43" y="4" width="13" height="22" rx="2.5" fill={f} stroke={c} strokeWidth="0.6" />,
      <rect key="i1" x="45" y="8" width="9" height="2.5" rx="1.2" fill={c} />,
      <rect key="i2" x="45" y="13" width="7" height="1.8" rx="0.9" fill={c} opacity="0.6" />,
      <rect key="i3" x="45" y="21" width="9" height="3" rx="1.5" fill={c} />,
      ...[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={4 + i * 13.5} y="29" width="12" height="5.5" rx="1.2" fill={i === 0 ? c : f} />
          <rect x={4 + i * 13.5} y="36" width="8" height="1.6" rx="0.8" fill={f} />
        </g>
      )),
    ],
    // Nửa trái: cờ + tên nước + viên thuốc ‹ › · tiêu đề · nút · dải poster; nửa phải ảnh lớn
    split: [
      <rect key="b" x="4" y="6" width="52" height="28" rx="3" fill={f} />,
      <rect key="i" x="26" y="6" width="30" height="28" rx="3" fill={c} opacity="0.35" />,
      <rect key="fl" x="8" y="9" width="5" height="3.6" rx="0.8" fill={c} />,
      <rect key="cn" x="15" y="9.6" width="9" height="2.4" rx="1.2" fill={c} opacity="0.7" />,
      <rect key="pill" x="14" y="13.6" width="12" height="3.6" rx="1.8" fill="none" stroke={c} strokeWidth="0.5" opacity="0.8" />,
      <rect key="t" x="8" y="19" width="16" height="3" rx="1.5" fill={c} />,
      <rect key="bt" x="8" y="24" width="8" height="3" rx="1.5" fill="#fff" stroke={c} strokeWidth="0.5" />,
      ...[0, 1, 2, 3].map((i) => <rect key={i} x={8 + i * 4.8} y="29" width="3.8" height="4" rx="0.7" fill={i === 0 ? c : f} />),
    ],
  };
  return (
    <svg width={w} height={(w * 2) / 3} viewBox="0 0 60 40" aria-hidden="true">
      {shapes[layout] ?? <rect x="4" y="8" width="52" height="24" rx="3" fill={f} />}
    </svg>
  );
}

// ── Nút / ô nhập dùng lại ────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface,
  fontFamily: FONT, fontSize: 13, color: T.text, outline: 'none', boxSizing: 'border-box',
};
const Label = ({ children, hint }) => (
  <div style={{ marginBottom: 6 }}>
    <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.text }}>{children}</span>
    {hint && <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, marginLeft: 8 }}>{hint}</span>}
  </div>
);
const Field = ({ label, hint, error, children }) => (
  <div style={{ marginBottom: 16 }}>
    <Label hint={hint}>{label}</Label>
    {children}
    {error && <p style={{ margin: '5px 0 0', fontFamily: FONT, fontSize: 11.5, color: T.red }}>{error}</p>}
  </div>
);
const Btn = ({ children, onClick, disabled, kind = 'ghost', style, ...rest }) => {
  const kinds = {
    ghost:   { background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textSub },
    primary: { background: T.accent, border: '1px solid transparent', color: '#fff' },
    danger:  { background: '#DC2626', border: '1px solid transparent', color: '#fff' },
  };
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      style={{
        padding: '8px 16px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
        fontFamily: FONT, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
        ...kinds[kind], ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
};
const Switch = ({ checked, onChange, label, disabled }) => (
  <button
    type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    style={{
      width: 36, height: 20, borderRadius: 10, border: 'none', padding: 2, cursor: disabled ? 'not-allowed' : 'pointer',
      background: checked ? GREEN : T.border, transition: 'background .15s', flexShrink: 0,
    }}
  >
    <span style={{ display: 'block', width: 16, height: 16, borderRadius: 8, background: '#fff', transform: `translateX(${checked ? 16 : 0}px)`, transition: 'transform .15s' }} />
  </button>
);
const Poster = ({ src, w = 34 }) => (
  <div style={{ width: w, height: w * 1.5, borderRadius: 5, background: T.surfaceAlt, overflow: 'hidden', flexShrink: 0 }}>
    {src && <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
  </div>
);
const IconBtn = ({ label, onClick, children }) => (
  <button type="button" className="ahs-icon" aria-label={label} title={label} onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 7 }}>
    {children}
  </button>
);
const Segmented = ({ value, onChange, options }) => (
  <div role="radiogroup" style={{ display: 'inline-flex', padding: 3, gap: 3, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
    {options.map(({ value: v, label, icon: Icon }) => {
      const on = value === v;
      return (
        <button
          key={v} type="button" role="radio" aria-checked={on} onClick={() => onChange(v)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, background: on ? T.surface : 'transparent', color: on ? T.accent : T.textSub, boxShadow: on ? T.shadow : 'none', transition: 'background .15s, color .15s' }}
        >
          {Icon && <Icon size={14} />} {label}
        </button>
      );
    })}
  </div>
);
const Callout = ({ children, tone = 'info' }) => {
  const tones = { info: [T.accent, T.accent + '0f'], warn: [AMBER, '#D977060f'] };
  const [c, bg] = tones[tone];
  return (
    <div style={{ display: 'flex', gap: 8, padding: '9px 12px', borderRadius: 8, background: bg, border: `1px solid ${c}33`, marginBottom: 16 }}>
      <Info size={14} color={c} style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ margin: 0, fontFamily: FONT, fontSize: 12, lineHeight: 1.5, color: T.textSub }}>{children}</p>
    </div>
  );
};
const FormSection = ({ icon: Icon, title, children }) => (
  <section style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}` }}>
    <h3 style={{ margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.textSub }}>
      {Icon && <Icon size={14} />} {title}
    </h3>
    {children}
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Chọn phim / TV show cho bộ sưu tập Manual
// ═══════════════════════════════════════════════════════════════════════════════
function ItemPicker({ items, setItems, max, shown }) {
  const [kind, setKind] = useState('movie');
  const [term, setTerm] = useState('');
  const debounced = useDebounced(term);
  const searchQ = useContentSearch(kind, debounced);

  const keyOf = (i) => `${i.contentType}:${i.contentId}`;
  const has = (r) => items.some((i) => keyOf(i) === keyOf(r));
  const add = (r) => setItems((prev) => (prev.length >= max || has(r) ? prev : [...prev, r]));
  const remove = (r) => setItems((prev) => prev.filter((i) => keyOf(i) !== keyOf(r)));
  const limited = shown && items.length > shown;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Segmented value={kind} onChange={setKind} options={[{ value: 'movie', label: 'Phim lẻ', icon: Film }, { value: 'tvshow', label: 'TV show', icon: Tv }]} />
      </div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search size={14} color={T.textMuted} style={{ position: 'absolute', left: 11, top: 11 }} />
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Gõ tên phim (từ 2 ký tự)…" style={{ ...inputStyle, paddingLeft: 32 }} />
      </div>

      {debounced.trim().length >= 2 && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, maxHeight: 230, overflowY: 'auto', marginBottom: 14 }}>
          {searchQ.isLoading && <p style={{ padding: 14, margin: 0, fontFamily: FONT, fontSize: 12.5, color: T.textMuted }}>Đang tìm…</p>}
          {searchQ.isError && <p style={{ padding: 14, margin: 0, fontFamily: FONT, fontSize: 12.5, color: T.red }}>Không tìm được, thử lại.</p>}
          {searchQ.data?.length === 0 && <p style={{ padding: 14, margin: 0, fontFamily: FONT, fontSize: 12.5, color: T.textMuted }}>Không có kết quả.</p>}
          {searchQ.data?.map((r) => {
            const added = has(r);
            return (
              <div key={keyOf(r)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>
                <Poster src={r.posterUrl} w={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                  {r.year && <p style={{ margin: 0, fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>{r.year}</p>}
                </div>
                <Btn onClick={() => add(r)} disabled={added || items.length >= max} style={{ padding: '5px 10px', fontSize: 12 }}>
                  {added ? 'Đã thêm' : 'Thêm'}
                </Btn>
              </div>
            );
          })}
        </div>
      )}

      <Label hint={`${items.length}/${max} · kéo ⋮⋮ để đổi thứ tự`}>Phim trong bộ sưu tập</Label>
      {limited && <Callout tone="warn">Kiểu bố trí này chỉ hiển thị <strong>{shown} phim đầu tiên</strong>. Các phim phía sau (mờ) sẽ không hiện trên trang chủ.</Callout>}
      {items.length === 0 ? (
        <p style={{ margin: 0, padding: 16, textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 10, fontFamily: FONT, fontSize: 12.5, color: T.textMuted }}>
          Chưa có phim nào. Bộ sưu tập trống sẽ không hiển thị trên trang chủ.
        </p>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={setItems} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {items.map((it, idx) => {
            const hidden = shown && idx >= shown;
            return (
              <Reorder.Item
                key={keyOf(it)} value={it}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, cursor: 'grab', opacity: hidden ? 0.5 : 1 }}
              >
                <GripVertical size={15} color={T.textMuted} />
                <span style={{ width: 18, fontFamily: FONT, fontSize: 11.5, color: T.textMuted, textAlign: 'right' }}>{idx + 1}</span>
                <Poster src={it.posterUrl} w={26} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                {hidden && <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: AMBER }}>Không hiển thị</span>}
                <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: T.textMuted, padding: '2px 6px', borderRadius: 5, background: T.surfaceAlt }}>
                  {it.contentType === 'tvshow' ? 'TV' : 'PHIM'}
                </span>
                <button type="button" className="ahs-icon" aria-label={`Bỏ ${it.title}`} onClick={() => remove(it)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                  <X size={15} color={T.textMuted} />
                </button>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Drawer tạo / sửa bộ sưu tập
// ═══════════════════════════════════════════════════════════════════════════════
const blankForm = () => ({
  title: '', subtitle: '', layout: 'carousel', isActive: true, startAt: '', endAt: '',
  sourceType: 'Manual', autoRule: 'trending', autoParam: '', autoContentType: 'all', itemLimit: 20,
  columns: 5, rows: 2, accent: '', items: [],
  listColumns: 2, listRows: 4, numbered: false, reverse: false,
});

const formFromSection = (s) => ({
  ...blankForm(),
  title: s.title, subtitle: s.subtitle ?? '', layout: s.layout, isActive: s.isActive,
  startAt: toLocalInput(s.startAt), endAt: toLocalInput(s.endAt),
  sourceType: s.sourceType, autoRule: s.autoRule || 'trending', autoParam: s.autoParam ?? '',
  autoContentType: s.autoContentType || 'all', itemLimit: s.itemLimit || 20,
  columns: s.layout === 'grid' ? s.config?.columns ?? 5 : 5,
  rows: s.layout === 'grid' ? s.config?.rows ?? 2 : 2,
  listColumns: s.layout === 'list' ? s.config?.columns ?? 2 : 2,
  listRows: s.layout === 'list' ? s.config?.rows ?? 4 : 4,
  numbered: s.layout === 'list' && Boolean(s.config?.numbered),
  reverse: s.layout === 'mosaic' && Boolean(s.config?.reverse),
  accent: s.config?.accent ?? '',
  items: (s.items ?? []).map((i) => ({
    contentType: i.contentType, contentId: i.contentId, title: i.content?.title ?? '', posterUrl: i.content?.posterUrl,
  })),
});

function SectionDrawer({ section, meta, onClose, onSaved }) {
  const toast = useToast();
  const saveM = useSaveHomeSection();
  const genresQ = useGenres();
  const genres = genresQ.data ?? [];
  const [form, setForm] = useState(() => (section ? formFromSection(section) : blankForm()));
  const initialRef = useRef(JSON.stringify(form));
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [askDiscard, setAskDiscard] = useState(false);
  const bodyRef = useRef(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setItems = (updater) => setForm((f) => ({ ...f, items: typeof updater === 'function' ? updater(f.items) : updater }));

  const dirty = JSON.stringify(form) !== initialRef.current;
  const requestClose = () => { if (saveM.isPending) return; if (dirty) setAskDiscard(true); else onClose(); };

  // Esc để đóng (có hỏi nếu đang sửa dở)
  const closeRef = useRef(requestClose);
  closeRef.current = requestClose;
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const layouts = meta?.layouts?.length ? meta.layouts : Object.keys(LAYOUT_INFO);
  const autoRules = meta?.autoRules?.length ? meta.autoRules : Object.keys(AUTO_RULE_INFO);
  const maxItems = meta?.maxManualItems ?? 50;
  const isAuto = form.sourceType === 'Auto';
  // Trần số phim của layout: ưu tiên bảng từ BE (/meta), fallback bảng cục bộ
  const limitOf = (layout) => meta?.layoutLimits?.[layout] ?? LAYOUT_LIMIT[layout];
  const shown = limitOf(form.layout);
  const autoMax = Math.min(maxItems, shown ?? maxItems);
  const clampLimit = (layout, v) => Math.max(1, Math.min(Number(v) || 20, Math.min(maxItems, limitOf(layout) ?? maxItems)));

  // Kiểu tham số của rule đang chọn (none | genre | year), do BE khai báo
  const ruleDetails = meta?.autoRuleDetails ?? [];
  const paramKind = ruleDetails.find((r) => r.key === form.autoRule)?.paramKind ?? ({ genre: 'genre', year: 'year', country: 'country' }[form.autoRule] ?? 'none');

  const fail = (msg, isTitle) => {
    if (isTitle) { setTitleError(msg); bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); } else setError(msg);
  };

  const submit = async () => {
    setError(''); setTitleError('');
    if (!form.title.trim()) return fail('Vui lòng nhập tên bộ sưu tập.', true);
    if (isAuto && paramKind === 'genre' && !form.autoParam) return fail('Vui lòng chọn thể loại.');
    if (isAuto && paramKind === 'year' && !/^\d{4}$/.test(String(form.autoParam))) return fail('Vui lòng nhập năm hợp lệ (4 chữ số).');
    if (isAuto && paramKind === 'country' && !/^[A-Za-z]{2}$/.test(String(form.autoParam).trim())) return fail('Vui lòng chọn quốc gia (mã 2 chữ cái, VD: KR).');
    if (form.startAt && form.endAt && new Date(form.startAt) >= new Date(form.endAt)) return fail('Thời điểm bắt đầu phải trước thời điểm kết thúc.');

    const config = {};
    if (form.layout === 'grid') { config.columns = Number(form.columns); config.rows = Number(form.rows); }
    if (form.layout === 'list') {
      config.columns = Number(form.listColumns);
      config.rows = Number(form.listRows);
      if (form.numbered) config.numbered = true;
    }
    if (form.layout === 'mosaic' && form.reverse) config.reverse = true;
    if (ACCENT_LAYOUTS.includes(form.layout) && HEX6.test(form.accent)) config.accent = form.accent.toLowerCase();

    const dto = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      layout: form.layout,
      config: Object.keys(config).length ? config : null,
      isActive: form.isActive,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      sourceType: form.sourceType,
      autoRule: isAuto ? form.autoRule : null,
      autoParam: isAuto && paramKind !== 'none' ? (paramKind === 'country' ? String(form.autoParam).trim().toUpperCase() : String(form.autoParam)) : null,
      autoContentType: form.autoContentType,
      itemLimit: clampLimit(form.layout, form.itemLimit),
      items: isAuto ? [] : form.items.map(({ contentType, contentId }) => ({ contentType, contentId })),
    };

    try {
      await saveM.mutateAsync({ id: section?.id, dto });
      toast.success(section ? 'Đã cập nhật bộ sưu tập' : 'Đã tạo bộ sưu tập mới');
      onSaved?.({ id: section?.id, dto, items: form.items }); // cập nhật list ngay (optimistic) + đồng bộ nền, KHÔNG await
      onClose();
    } catch (e) {
      const msg = errMsg(e, 'Lưu thất bại, vui lòng thử lại');
      setError(msg); toast.error(msg);
    }
  };

  const colRow = (a, b) => <div style={{ display: 'flex', gap: 12 }}><div style={{ flex: 1 }}>{a}</div><div style={{ flex: 1 }}>{b}</div></div>;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={requestClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 299 }}
      />
      <motion.aside
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        role="dialog" aria-modal="true" aria-label={section ? 'Sửa bộ sưu tập' : 'Thêm bộ sưu tập'}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(640px, 100vw)', zIndex: 300, background: T.surface, boxShadow: T.shadowLg, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 36, borderRadius: 8, background: T.surfaceAlt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <LayoutThumb layout={form.layout} active w={46} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: FONT_TITLE, fontSize: 17, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {section ? 'Sửa bộ sưu tập' : 'Thêm bộ sưu tập'}
            </h2>
            <p style={{ margin: '2px 0 0', fontFamily: FONT, fontSize: 12, color: T.textMuted }}>
              {layoutName(form.layout)} · {isAuto ? `Tự động · ${AUTO_RULE_INFO[form.autoRule] ?? form.autoRule}` : `${form.items.length} phim`}
            </p>
          </div>
          <button type="button" aria-label="Đóng" onClick={requestClose} className="ahs-icon" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 6 }}><X size={18} color={T.textMuted} /></button>
        </div>

        <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto' }}>
          {/* 1. Thông tin */}
          <FormSection icon={Info} title="Thông tin">
            <Field label="Tên bộ sưu tập" error={titleError}>
              <input
                value={form.title} maxLength={120} autoFocus={!section}
                onChange={(e) => { set({ title: e.target.value }); if (titleError) setTitleError(''); }}
                placeholder="VD: Phim mới nè" style={{ ...inputStyle, borderColor: titleError ? T.red : T.border }}
              />
            </Field>
            <Field label="Phụ đề" hint="chữ mờ cạnh tên (mobile sẽ xuống dòng dưới tên nếu hết chỗ)">
              <input value={form.subtitle} maxLength={250} onChange={(e) => set({ subtitle: e.target.value })} placeholder="VD: Phim này cực hay" style={inputStyle} />
            </Field>
          </FormSection>

          {/* 2. Bố trí */}
          <FormSection icon={LayoutGrid} title="Kiểu bố trí">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, marginBottom: 14 }}>
              {layouts.map((k) => {
                const on = form.layout === k;
                return (
                  <button
                    key={k} type="button" className="ahs-card" onClick={() => set({ layout: k, itemLimit: clampLimit(k, form.itemLimit) })} aria-pressed={on}
                    style={{ textAlign: 'left', padding: 10, borderRadius: 10, cursor: 'pointer', background: on ? T.accent + '10' : T.surface, border: `1.5px solid ${on ? T.accent : T.border}` }}
                  >
                    <div style={{ background: T.surfaceAlt, borderRadius: 7, display: 'grid', placeItems: 'center', padding: '6px 0', marginBottom: 8 }}>
                      <LayoutThumb layout={k} active={on} w={76} />
                    </div>
                    <p style={{ margin: '0 0 2px', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>{layoutName(k)}</p>
                    <p style={{ margin: 0, fontFamily: FONT, fontSize: 11.5, color: T.textMuted, lineHeight: 1.4 }}>{LAYOUT_INFO[k]?.desc}</p>
                  </button>
                );
              })}
            </div>

            {LAYOUT_NOTE[form.layout] && <Callout>{LAYOUT_NOTE[form.layout]}</Callout>}

            {form.layout === 'grid' && colRow(
              <Field label="Số cột" hint="máy tính; điện thoại cuộn ngang">
                <select value={form.columns} onChange={(e) => set({ columns: e.target.value })} style={inputStyle}>
                  {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} cột</option>)}
                </select>
              </Field>,
              <Field label="Số hàng mỗi trang" hint="nhiều hơn thì có nút chuyển trang">
                <select value={form.rows} onChange={(e) => set({ rows: e.target.value })} style={inputStyle}>
                  {[1, 2, 3].map((n) => <option key={n} value={n}>{n} hàng</option>)}
                </select>
              </Field>,
            )}
            {form.layout === 'list' && (
              <>
                {colRow(
                  <Field label="Số cột" hint="điện thoại luôn 1 cột">
                    <select value={form.listColumns} onChange={(e) => set({ listColumns: e.target.value })} style={inputStyle}>
                      {[1, 2, 3].map((n) => <option key={n} value={n}>{n} cột</option>)}
                    </select>
                  </Field>,
                  <Field label="Số hàng mỗi cột" hint="tổng hiển thị = cột × hàng">
                    <select value={form.listRows} onChange={(e) => set({ listRows: e.target.value })} style={inputStyle}>
                      {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} hàng</option>)}
                    </select>
                  </Field>,
                )}
                <Field label="Đánh số thứ tự" hint="chỉ bật khi thứ tự bạn sắp là xếp hạng">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Switch checked={form.numbered} onChange={(v) => set({ numbered: v })} label="Đánh số thứ tự" />
                    <span style={{ fontFamily: FONT, fontSize: 13, color: T.text }}>{form.numbered ? 'Có số thứ tự' : 'Không đánh số'}</span>
                  </div>
                </Field>
              </>
            )}
            {form.layout === 'mosaic' && (
              <Field label="Vị trí ô lớn">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Switch checked={form.reverse} onChange={(v) => set({ reverse: v })} label="Đưa ô lớn sang phải" />
                  <span style={{ fontFamily: FONT, fontSize: 13, color: T.text }}>{form.reverse ? 'Ô lớn bên phải' : 'Ô lớn bên trái'}</span>
                </div>
              </Field>
            )}
            {ACCENT_LAYOUTS.includes(form.layout) && (
              <Field label="Màu nhấn" hint="vạch bên tiêu đề, thanh tiến trình, viền thẻ đang chọn">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button" onClick={() => set({ accent: '' })} aria-pressed={form.accent === ''}
                      style={{ padding: '4px 10px', height: 26, borderRadius: 13, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 600, background: form.accent === '' ? T.accent + '14' : T.surface, color: form.accent === '' ? T.accent : T.textSub, border: `${form.accent === '' ? 2 : 1}px solid ${form.accent === '' ? T.accent : T.border}` }}
                    >
                      Mặc định
                    </button>
                    {(() => {
                      const custom = Boolean(form.accent) && !ALL_ACCENTS.includes(form.accent.toLowerCase());
                      return (
                        <label
                          title="Chọn màu tùy ý"
                          style={{ position: 'relative', width: 26, height: 26, borderRadius: 13, cursor: 'pointer', overflow: 'hidden', display: 'block', border: custom ? `3px solid ${T.text}` : `2px solid ${T.border}`, background: custom ? form.accent : 'conic-gradient(#ef4444,#fbbf24,#4ade80,#22d3ee,#818cf8,#f472b6,#ef4444)' }}
                        >
                          <input
                            type="color" aria-label="Chọn màu tùy ý" value={HEX6.test(form.accent) ? form.accent : '#e8c97e'}
                            onChange={(e) => set({ accent: e.target.value })}
                            style={{ position: 'absolute', inset: -8, width: 50, height: 50, opacity: 0, cursor: 'pointer' }}
                          />
                        </label>
                      );
                    })()}
                    {form.accent && <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>{form.accent}</span>}
                  </div>
                  {ACCENT_GROUPS.map((g) => (
                    <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 82, flexShrink: 0, fontFamily: FONT, fontSize: 11, color: T.textMuted }}>{g.label}</span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {g.colors.map((c) => {
                          const on = form.accent.toLowerCase() === c;
                          return (
                            <button
                              key={c} type="button" aria-label={`Màu ${c}`} aria-pressed={on} onClick={() => set({ accent: c })}
                              style={{ width: 26, height: 26, borderRadius: 13, background: c, cursor: 'pointer', border: on ? `3px solid ${T.text}` : `2px solid ${T.border}` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Field>
            )}
          </FormSection>

          {/* 3. Nội dung */}
          <FormSection icon={Film} title="Nội dung">
            <div style={{ marginBottom: 14 }}>
              <Segmented
                value={form.sourceType} onChange={(v) => set({ sourceType: v })}
                options={[{ value: 'Manual', label: 'Chọn thủ công', icon: ListChecks }, { value: 'Auto', label: 'Tự động', icon: Wand2 }]}
              />
            </div>
            {isAuto ? (
              <div style={{ padding: 14, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <Field label="Quy tắc">
                  <select value={form.autoRule} onChange={(e) => set({ autoRule: e.target.value, autoParam: '' })} style={inputStyle}>
                    {(ruleDetails.length ? ruleDetails : autoRules.map((k) => ({ key: k, label: AUTO_RULE_INFO[k] ?? k })))
                      .map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </Field>
                {paramKind === 'genre' && (
                  <Field label="Thể loại">
                    <select value={form.autoParam} onChange={(e) => set({ autoParam: e.target.value })} style={inputStyle}>
                      <option value="">— Chọn thể loại —</option>
                      {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </Field>
                )}
                {paramKind === 'country' && (
                  <Field label="Quốc gia" hint="mã ISO 2 chữ cái">
                    <select value={form.autoParam} onChange={(e) => set({ autoParam: e.target.value })} style={inputStyle}>
                      <option value="">— Chọn quốc gia —</option>
                      {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
                      {form.autoParam && !COUNTRIES.some(([c]) => c === String(form.autoParam).toUpperCase()) && (
                        <option value={form.autoParam}>{String(form.autoParam).toUpperCase()}</option>
                      )}
                    </select>
                  </Field>
                )}
                {paramKind === 'year' && (
                  <Field label="Năm">
                    <input type="number" min={1900} max={2100} value={form.autoParam} onChange={(e) => set({ autoParam: e.target.value })} style={inputStyle} />
                  </Field>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Loại nội dung">
                      <select value={form.autoContentType} onChange={(e) => set({ autoContentType: e.target.value })} style={inputStyle}>
                        {(meta?.autoContentTypes ?? Object.keys(AUTO_TYPE_INFO)).map((t) => <option key={t} value={t}>{AUTO_TYPE_INFO[t] ?? t}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div style={{ width: 110 }}>
                    <Field label="Số lượng">
                      <input
                        type="number" min={1} max={autoMax}
                        value={Number(form.itemLimit) > autoMax ? autoMax : form.itemLimit}
                        onChange={(e) => set({ itemLimit: e.target.value })}
                        onBlur={() => set({ itemLimit: clampLimit(form.layout, form.itemLimit) })}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                </div>
                {shown && (
                  <div style={{ marginBottom: 10 }}>
                    <Callout>{layoutName(form.layout)} chỉ hiển thị tối đa <strong>{shown} phim</strong> nên số lượng được giới hạn ở {shown}.</Callout>
                  </div>
                )}
                <p style={{ margin: 0, fontFamily: FONT, fontSize: 12, color: T.textMuted }}>Danh sách tự cập nhật theo dữ liệu thật, không cần chọn phim.</p>
              </div>
            ) : (
              <ItemPicker items={form.items} setItems={setItems} max={maxItems} shown={shown} />
            )}
          </FormSection>

          {/* 4. Lịch & hiển thị */}
          <FormSection icon={Clock} title="Lịch hiển thị">
            <Field label="Hẹn giờ" hint="để trống = luôn hiển thị">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ flex: 1, minWidth: 200, fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
                  Bắt đầu
                  <input type="datetime-local" value={form.startAt} onChange={(e) => set({ startAt: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
                <label style={{ flex: 1, minWidth: 200, fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
                  Kết thúc
                  <input type="datetime-local" value={form.endAt} onChange={(e) => set({ endAt: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                </label>
              </div>
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <Eye size={15} color={T.textSub} />
              <span style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: T.text }}>{form.isActive ? 'Đang bật — hiển thị trên trang chủ khi đúng lịch' : 'Đang tắt — không hiển thị'}</span>
              <Switch checked={form.isActive} onChange={(v) => set({ isActive: v })} label="Bật bộ sưu tập" />
            </div>
          </FormSection>

          {error && (
            <div style={{ margin: '16px 22px', padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', fontFamily: FONT, fontSize: 12.5, color: T.red }}>{error}</div>
          )}
        </div>

        {/* Footer cố định */}
        <div style={{ padding: '12px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, background: T.surface }}>
          {askDiscard ? (
            <>
              <span style={{ flex: 1, fontFamily: FONT, fontSize: 13, fontWeight: 600, color: AMBER }}>Bỏ các thay đổi chưa lưu?</span>
              <Btn onClick={() => setAskDiscard(false)}>Tiếp tục sửa</Btn>
              <Btn kind="danger" onClick={onClose}>Bỏ thay đổi</Btn>
            </>
          ) : (
            <>
              <span style={{ flex: 1, fontFamily: FONT, fontSize: 12, color: dirty ? AMBER : T.textMuted }}>{dirty ? '● Có thay đổi chưa lưu' : 'Chưa có thay đổi'}</span>
              <Btn onClick={requestClose} disabled={saveM.isPending}>Hủy</Btn>
              <Btn kind="primary" onClick={submit} disabled={saveM.isPending}>
                {saveM.isPending && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {section ? 'Lưu thay đổi' : 'Tạo bộ sưu tập'}
              </Btn>
            </>
          )}
        </div>
      </motion.aside>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hộp thoại xác nhận xoá
// ═══════════════════════════════════════════════════════════════════════════════
function DeleteDialog({ section, onClose, onDeleted }) {
  const toast = useToast();
  const delM = useDeleteHomeSection();
  const [error, setError] = useState('');

  // Giữ lại bản ghi cuối để nội dung không trống trong lúc modal chạy hiệu ứng đóng
  const lastRef = useRef(section);
  if (section) lastRef.current = section;
  const s = section ?? lastRef.current;

  useEffect(() => { setError(''); }, [section?.id]);

  const run = async () => {
    setError('');
    try {
      await delM.mutateAsync(section.id);
      toast.success('Đã xóa bộ sưu tập');
      onDeleted?.(section.id);
      onClose();
    } catch (e) {
      const msg = errMsg(e, 'Xóa thất bại, vui lòng thử lại');
      setError(msg); toast.error(msg);
    }
  };

  return (
    <ConfirmDeleteModal
      open={!!section}
      eyebrow="Xóa bộ sưu tập"
      title={`Xóa “${s?.title ?? ''}”?`}
      confirmLabel="Xóa bộ sưu tập"
      busy={delM.isPending}
      onConfirm={run}
      onClose={onClose}
    >
      <InfoBox title={s?.title}>
        <p style={{ margin: 0, fontFamily: FONT, fontSize: 12.5, color: T.textMuted }}>
          {layoutName(s?.layout)} · {s?.sourceType === 'Auto' ? `Tự động · ${AUTO_RULE_INFO[s?.autoRule] ?? s?.autoRule}` : `${s?.items?.length ?? 0} phim`}
        </p>
      </InfoBox>
      <WarnBox icon={<AlertTriangle size={14} color={AMBER} />}>
        Bộ sưu tập sẽ biến mất khỏi trang chủ. Các phim bên trong <strong>không bị xóa</strong>. Muốn ẩn tạm thì hãy tắt bộ sưu tập thay vì xóa.
      </WarnBox>
      <IrreversibleNote>Cấu hình và thứ tự phim của bộ sưu tập sẽ mất.</IrreversibleNote>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', fontFamily: FONT, fontSize: 12.5, color: T.red }}>{error}</div>
      )}
    </ConfirmDeleteModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Một dòng bộ sưu tập (nội dung dùng chung cho chế độ kéo thả / chế độ lọc)
// ═══════════════════════════════════════════════════════════════════════════════
function RowBody({ s, dragHandle, onEdit, onDelete, onToggle }) {
  const st = statusOf(s);
  const isAuto = s.sourceType === 'Auto';
  const limit = LAYOUT_LIMIT[s.layout];
  const count = s.items?.length ?? 0;
  const posters = (s.items ?? []).map((i) => i.content?.posterUrl).filter(Boolean).slice(0, 4);

  return (
    <div
      className="ahs-row"
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow, opacity: s.isActive ? 1 : 0.7, flexWrap: 'wrap' }}
    >
      {dragHandle}

      <div style={{ width: 64, height: 44, borderRadius: 8, background: T.surfaceAlt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <LayoutThumb layout={s.layout} active w={52} />
      </div>

      <div role="button" tabIndex={0} className="ahs-focus" onClick={onEdit} onKeyDown={(e) => { if (e.key === 'Enter') onEdit(); }}
        style={{ flex: '1 1 220px', minWidth: 0, cursor: 'pointer', borderRadius: 6 }}>
        <p style={{ margin: 0, fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
        {s.subtitle && <p style={{ margin: '1px 0 0', fontFamily: FONT, fontSize: 12.5, color: T.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.subtitle}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: T.textSub, padding: '1px 8px', borderRadius: 999, background: T.surfaceAlt }}>{layoutName(s.layout)}</span>
          <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {isAuto ? <><Wand2 size={11} /> {AUTO_RULE_INFO[s.autoRule] ?? s.autoRule}</> : <><ListChecks size={11} /> {count} phim</>}
          </span>
          {limit && (isAuto ? (s.itemLimit ?? 0) > limit : count > limit) && (
            <span title={`Kiểu bố trí này chỉ hiển thị ${limit} phim đầu`} style={{ fontFamily: FONT, fontSize: 11.5, color: AMBER, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={11} /> chỉ hiện {limit}
            </span>
          )}
          {(s.startAt || s.endAt) && (
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {s.startAt ? fmt(s.startAt) : '…'} → {s.endAt ? fmt(s.endAt) : '…'}
            </span>
          )}
          {s.items?.some((i) => i.content?.isPremium) && <Crown size={11} color={AMBER} aria-label="Có phim Premium" />}
        </div>
      </div>

      {posters.length > 0 && (
        <div aria-hidden style={{ display: 'flex', flexShrink: 0 }}>
          {posters.map((p, i) => (
            <div key={i} style={{ width: 26, height: 39, marginLeft: i ? -8 : 0, borderRadius: 4, overflow: 'hidden', border: `2px solid ${T.surface}`, background: T.surfaceAlt }}>
              <img src={p} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: st.color, background: st.color + '18', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{st.label}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Switch checked={s.isActive} onChange={onToggle} label={s.isActive ? 'Tắt bộ sưu tập' : 'Bật bộ sưu tập'} />
        <IconBtn label="Sửa" onClick={onEdit}><Pencil size={16} color={T.textSub} /></IconBtn>
        <IconBtn label="Xóa" onClick={onDelete}><Trash2 size={16} color={T.red} /></IconBtn>
      </div>
    </div>
  );
}

// Dòng kéo thả: chỉ kéo được bằng tay nắm → bấm vào nút/switch không bị kéo nhầm
function DraggableRow({ s, onDragEnd, ...rest }) {
  const controls = useDragControls();
  const handle = (
    <div
      onPointerDown={(e) => controls.start(e)} aria-label="Kéo để đổi thứ tự" title="Kéo để đổi thứ tự"
      style={{ cursor: 'grab', touchAction: 'none', display: 'flex', padding: 4, borderRadius: 6 }}
    >
      <GripVertical size={18} color={T.textMuted} />
    </div>
  );
  return (
    <Reorder.Item value={s} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} style={{ listStyle: 'none' }} whileDrag={{ scale: 1.01, zIndex: 5 }}>
      <RowBody s={s} dragHandle={handle} {...rest} />
    </Reorder.Item>
  );
}

const Skeleton = () => (
  <div style={{ display: 'grid', gap: 10 }} aria-hidden>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ height: 76, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, animation: 'ahs-pulse 1.3s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Trang chính
// ═══════════════════════════════════════════════════════════════════════════════
const FILTERS = [
  { key: 'all', label: 'Tất cả', match: () => true },
  { key: 'live', label: 'Đang hiển thị', match: (st) => st.key === 'live' },
  { key: 'scheduled', label: 'Hẹn giờ', match: (st) => st.key === 'scheduled' },
  { key: 'inactive', label: 'Tắt / hết hạn / trống', match: (st) => ['off', 'expired', 'empty'].includes(st.key) },
];

export default function AdminHomeSections() {
  const toast = useToast();
  const listQ = useAdminHomeSections();
  const metaQ = useHomeSectionMeta();
  const reorderM = useReorderHomeSections();
  const activeM = useSetHomeSectionActive();

  const [order, setOrder] = useState([]); // bản sao cục bộ để kéo thả mượt, đồng bộ lại từ server khi có dữ liệu mới
  const orderRef = useRef([]);
  const [editing, setEditing] = useState(null); // null = đóng | 'new' | section
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (listQ.data) { setOrder(listQ.data); orderRef.current = listQ.data; }
  }, [listQ.data]);

  // cancelRefetch:false → nếu hook đã invalidate/refetch rồi thì dùng chung request đó, không bắn thêm lần nữa
  const refreshList = () => listQ.refetch({ cancelRefetch: false });
  const patchOrder = (fn) => setOrder((prev) => { const next = fn(prev); orderRef.current = next; return next; });

  // Hiện thay đổi ngay lập tức; dữ liệu thật từ server sẽ ghi đè khi refetch xong
  const handleSaved = ({ id, dto, items }) => {
    if (id) {
      patchOrder((prev) => prev.map((s) => {
        if (s.id !== id) return s;
        const old = new Map((s.items ?? []).map((i) => [`${i.contentType}:${i.contentId}`, i]));
        return {
          ...s,
          title: dto.title, subtitle: dto.subtitle, layout: dto.layout, config: dto.config, isActive: dto.isActive,
          startAt: dto.startAt, endAt: dto.endAt, sourceType: dto.sourceType, autoRule: dto.autoRule,
          autoParam: dto.autoParam, autoContentType: dto.autoContentType, itemLimit: dto.itemLimit,
          items: dto.sourceType === 'Auto' ? [] : items.map((i, idx) => {
            const prevItem = old.get(`${i.contentType}:${i.contentId}`);
            return {
              ...(prevItem ?? { id: undefined, contentType: i.contentType, contentId: i.contentId }),
              order: idx,
              content: prevItem?.content ?? { title: i.title, posterUrl: i.posterUrl },
            };
          }),
        };
      }));
    }
    refreshList();
  };

  const handleDeleted = (id) => {
    patchOrder((prev) => prev.filter((s) => s.id !== id));
    refreshList();
  };

  const onReorder = (next) => { setOrder(next); orderRef.current = next; };
  const commitOrder = () => {
    const ids = orderRef.current.map((s) => s.id);
    const serverIds = (listQ.data ?? []).map((s) => s.id);
    if (ids.join() === serverIds.join()) return; // không đổi gì
    reorderM.mutate(ids, {
      onSuccess: () => { toast.success('Đã lưu thứ tự'); refreshList(); },
      onError: (e) => { setOrder(listQ.data ?? []); toast.error(errMsg(e, 'Lưu thứ tự thất bại')); },
    });
  };

  const toggle = (s, isActive) => {
    patchOrder((prev) => prev.map((x) => (x.id === s.id ? { ...x, isActive } : x))); // đổi ngay, không chờ server
    activeM.mutate({ id: s.id, isActive }, {
      onSuccess: () => refreshList(),
      onError: (e) => {
        patchOrder((prev) => prev.map((x) => (x.id === s.id ? { ...x, isActive: !isActive } : x)));
        toast.error(errMsg(e, 'Cập nhật thất bại'));
      },
    });
  };

  const counts = useMemo(() => {
    const c = { all: order.length };
    FILTERS.slice(1).forEach((f) => { c[f.key] = order.filter((s) => f.match(statusOf(s))).length; });
    return c;
  }, [order]);

  const filtering = filter !== 'all' || query.trim() !== '';
  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();
    return order.filter((s) => f.match(statusOf(s)) && (!q || `${s.title} ${s.subtitle ?? ''}`.toLowerCase().includes(q)));
  }, [order, filter, query]);

  const rowProps = (s) => ({ s, onEdit: () => setEditing(s), onDelete: () => setDeleting(s), onToggle: (v) => toggle(s, v) });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1040, margin: '0 auto' }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>
      <style>{ADMIN_CSS}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 700, color: T.text }}>Bộ sưu tập</h1>
          <p style={{ margin: '4px 0 0', fontFamily: FONT, fontSize: 13, color: T.textMuted, maxWidth: 560 }}>
            Gom phim thành các bộ sưu tập hiển thị trên trang chủ. Thứ tự từ trên xuống dưới là thứ tự trên trang chủ.
          </p>
        </div>
        <Btn kind="primary" onClick={() => setEditing('new')}><Plus size={15} /> Thêm bộ sưu tập</Btn>
      </div>

      {/* Bộ lọc + tìm kiếm */}
      {order.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div role="tablist" aria-label="Lọc theo trạng thái" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key} type="button" role="tab" aria-selected={on} className="ahs-tab" onClick={() => setFilter(f.key)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 600, background: on ? T.accent + '14' : T.surface, color: on ? T.accent : T.textSub, border: `1px solid ${on ? T.accent : T.border}` }}
                >
                  {f.label}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '0 7px', borderRadius: 999, background: on ? T.accent : T.surfaceAlt, color: on ? '#fff' : T.textMuted }}>{counts[f.key]}</span>
                </button>
              );
            })}
          </div>
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={14} color={T.textMuted} style={{ position: 'absolute', left: 11, top: 11 }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm bộ sưu tập…" aria-label="Tìm bộ sưu tập" style={{ ...inputStyle, paddingLeft: 32 }} />
          </div>
        </div>
      )}
      {filtering && order.length > 0 && (
        <p style={{ margin: '0 0 12px', fontFamily: FONT, fontSize: 12, color: T.textMuted }}>
          Đang lọc — tạm tắt kéo thả để tránh sắp xếp nhầm. <button type="button" onClick={() => { setFilter('all'); setQuery(''); }} style={{ background: 'none', border: 'none', padding: 0, color: T.accent, cursor: 'pointer', fontFamily: FONT, fontSize: 12, textDecoration: 'underline' }}>Xóa bộ lọc</button> để sắp xếp.
        </p>
      )}

      {listQ.isLoading && <Skeleton />}
      {listQ.isError && (
        <div style={{ padding: 16, borderRadius: 10, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', fontFamily: FONT, fontSize: 13, color: T.red }}>
          {errMsg(listQ.error, 'Không tải được danh sách bộ sưu tập')}{' '}
          <button type="button" onClick={() => listQ.refetch()} style={{ background: 'none', border: 'none', color: T.red, textDecoration: 'underline', cursor: 'pointer', fontFamily: FONT }}>Thử lại</button>
        </div>
      )}
      {listQ.isSuccess && order.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 14 }}>
          <p style={{ margin: '0 0 12px', fontFamily: FONT, fontSize: 14, color: T.textSub }}>Chưa có bộ sưu tập nào. Trang chủ đang hiển thị các phần mặc định.</p>
          <Btn kind="primary" onClick={() => setEditing('new')}><Plus size={15} /> Tạo bộ sưu tập đầu tiên</Btn>
        </div>
      )}
      {listQ.isSuccess && order.length > 0 && visible.length === 0 && (
        <p style={{ padding: 28, textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 12, fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không có bộ sưu tập nào khớp bộ lọc.</p>
      )}

      {filtering ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {visible.map((s) => <li key={s.id}><RowBody {...rowProps(s)} /></li>)}
        </ul>
      ) : (
        <Reorder.Group axis="y" values={order} onReorder={onReorder} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {order.map((s) => <DraggableRow key={s.id} onDragEnd={commitOrder} {...rowProps(s)} />)}
        </Reorder.Group>
      )}

      <AnimatePresence>
        {editing && (
          <SectionDrawer
            key={editing === 'new' ? 'new' : editing.id}
            section={editing === 'new' ? null : editing}
            meta={metaQ.data}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
      <DeleteDialog section={deleting} onClose={() => setDeleting(null)} onDeleted={handleDeleted} />
    </div>
  );
}
// src/components/ui/SearchShimmer.jsx
// Tối ưu:
//  • MỘT lớp sweep duy nhất chạy bằng transform (GPU/compositor) cho cả khối,
//    thay vì ~25 block animate `background-position` (repaint mỗi frame).
//  • Kích thước/padding khớp đúng SearchResultItem + SearchResultsPanel → khi kết quả thật vào không bị nhảy layout.
//  • Component tĩnh → React.memo, không render lại khi gõ phím.
import React, { memo } from "react";

const CSS = `
@keyframes ssSweep{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.ss{position:relative;overflow:hidden;contain:paint}
.ss::after{content:"";position:absolute;inset:0;pointer-events:none;will-change:transform;
  background:linear-gradient(105deg,transparent 0%,rgba(255,255,255,.055) 50%,transparent 100%);
  animation:ssSweep 1.5s cubic-bezier(.4,0,.2,1) infinite}
.ss-b{background:rgba(255,255,255,.055);border-radius:3px}
@media (prefers-reduced-motion:reduce){.ss::after{animation:none;opacity:0}}
`;

const fade = (n) =>
  Array.from({ length: n }, (_, i) => +(1 - i * (0.28 / Math.max(n - 1, 1))).toFixed(2));

const Block = ({ w, h, mb, r, a = 1, maxW }) => (
  <div
    className="ss-b"
    style={{ width: w, height: h, marginBottom: mb, maxWidth: maxW, opacity: a, ...(r ? { borderRadius: r } : null) }}
  />
);

// Khớp SectionHeader của panel: padding 10px 18px 4px
const Label = ({ w }) => (
  <div style={{ display: "flex", alignItems: "center", height: 14, padding: "10px 18px 4px", boxSizing: "content-box" }}>
    <Block w={w} h={8} />
  </div>
);

const MovieRow = ({ o, i }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", opacity: o }}>
    <div className="ss-b" style={{ width: 48, height: 68, minWidth: 48, borderRadius: 8, flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Block w={`${52 + (i % 3) * 9}%`} maxW="72%" h={11} mb={9} />
      <div style={{ display: "flex", gap: 7 }}>
        <Block w={28} h={7} a={0.8} />
        <Block w={32} h={7} a={0.65} />
        <Block w={54} h={7} a={0.5} />
      </div>
    </div>
  </div>
);

const ActorRow = ({ o, i }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", opacity: o }}>
    <div className="ss-b" style={{ width: 46, height: 46, minWidth: 46, borderRadius: "50%", flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <Block w={`${42 + (i % 3) * 8}%`} maxW="60%" h={10} />
        <Block w={52} h={13} r={4} a={0.6} />
      </div>
      <Block w={`${35 + (i % 2) * 10}%`} h={7} a={0.55} />
    </div>
  </div>
);

// Khớp Divider của panel
const Divider = () => <div style={{ margin: "4px 0", height: 1, background: "rgba(255,255,255,0.06)" }} />;

const SearchShimmer = ({ movieRows = 3, actorRows = 2, showActors = true }) => (
  <div className="ss" role="status" aria-live="polite" aria-label="Đang tìm kiếm">
    <style>{CSS}</style>

    <section aria-hidden="true">
      <Label w={72} />
      {fade(movieRows).map((o, i) => <MovieRow key={i} o={o} i={i} />)}
    </section>

    {showActors && (
      <section aria-hidden="true">
        <Divider />
        <Label w={56} />
        {fade(actorRows).map((o, i) => <ActorRow key={i} o={o} i={i} />)}
      </section>
    )}
  </div>
);

export default memo(SearchShimmer);
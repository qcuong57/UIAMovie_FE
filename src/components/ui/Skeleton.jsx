// src/components/ui/Skeleton.jsx
// Dùng chung toàn website — import từ đây thay vì src/components/movie/shared/Skeleton.jsx
import React from "react";

// ── Keyframe shimmer phải được inject 1 lần ──────────────────────────────────
const SHIMMER_STYLE = `
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

let _injected = false;
function injectShimmer() {
  if (_injected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = SHIMMER_STYLE;
  document.head.appendChild(tag);
  _injected = true;
}

// ── Base colors ───────────────────────────────────────────────────────────────
const BASE   = "#1a1a1a";
const SHINE  = "#242424";

const shimmerBg = {
  background: `linear-gradient(90deg, ${BASE} 25%, ${SHINE} 50%, ${BASE} 75%)`,
  backgroundSize: "200% 100%",
  animation: "shimmer 1.4s infinite",
};

// ══════════════════════════════════════════════════════════════════════════════
// ── 1. Skeleton — block nguyên thủy (giữ API cũ, dùng thay thế file movie) ──
// ══════════════════════════════════════════════════════════════════════════════
// Dùng: <Skeleton w={56} h={76} r={10} />
export const Skeleton = ({ w = "100%", h = 16, r = 6, style = {} }) => {
  injectShimmer();
  return (
    <div style={{ width: w, height: h, borderRadius: r, ...shimmerBg, ...style }} />
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── 2. MovieCardSkeleton — poster 2:3 + info dưới ────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Dùng: <MovieCardSkeleton /> hoặc <MovieCardSkeleton count={5} />
export const MovieCardSkeleton = ({ count = 1 }) => {
  injectShimmer();
  const card = (i) => (
    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ aspectRatio: "2/3", borderRadius: 12, ...shimmerBg }} />
      <Skeleton w="75%" h={13} r={4} />
      <Skeleton w="50%" h={11} r={4} />
    </div>
  );
  return count === 1 ? card(0) : <>{Array.from({ length: count }, (_, i) => card(i))}</>;
};

// ══════════════════════════════════════════════════════════════════════════════
// ── 3. NotificationItemSkeleton — thumbnail + 4 dòng text ────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Dùng: <NotificationItemSkeleton /> hoặc <NotificationItemSkeleton count={6} />
export const NotificationItemSkeleton = ({ count = 1, borderColor = "#ffffff14" }) => {
  injectShimmer();
  const item = (i) => (
    <div
      key={i}
      style={{
        display: "flex", gap: 16, padding: "20px 24px",
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <Skeleton w={56} h={76} r={10} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton w="30%" h={12} r={4} />
        <Skeleton w="70%" h={16} r={6} />
        <Skeleton w="90%" h={13} r={4} />
        <Skeleton w="55%" h={11} r={4} />
      </div>
    </div>
  );
  return count === 1 ? item(0) : <>{Array.from({ length: count }, (_, i) => item(i))}</>;
};

// ══════════════════════════════════════════════════════════════════════════════
// ── 4. TableRowSkeleton — hàng bảng admin (N cột) ────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Dùng: <TableRowSkeleton cols={5} rows={8} />
export const TableRowSkeleton = ({ cols = 4, rows = 5, cellHeight = 14 }) => {
  injectShimmer();
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} style={{ padding: "12px 16px" }}>
              <Skeleton w={c === 0 ? "60%" : c === cols - 1 ? "40%" : "80%"} h={cellHeight} r={4} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── 5. HeroBannerSkeleton — hero toàn màn hình ───────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Dùng: <HeroBannerSkeleton />
export const HeroBannerSkeleton = () => {
  injectShimmer();
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", ...shimmerBg }}>
      {/* Overlay gradient phía dưới */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, #0f0f0f 0%, transparent 60%)",
        }}
      />
      {/* Placeholder text block */}
      <div
        style={{
          position: "absolute", bottom: "18%", left: "6%",
          display: "flex", flexDirection: "column", gap: 14, width: "38%",
        }}
      >
        <Skeleton w="45%" h={14} r={4} />
        <Skeleton w="90%" h={36} r={8} />
        <Skeleton w="70%" h={22} r={6} />
        <Skeleton w="85%" h={14} r={4} />
        <Skeleton w="75%" h={14} r={4} />
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <Skeleton w={130} h={42} r={999} />
          <Skeleton w={42}  h={42} r="50%" />
          <Skeleton w={42}  h={42} r="50%" />
        </div>
      </div>
      {/* Thumbnail strip phía dưới */}
      <div
        style={{
          position: "absolute", bottom: "4%", right: "4%",
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, width: "52%",
        }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} h={104} r={12} />
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── 6. ProfileSkeleton — avatar + info dòng ngang ────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Dùng: <ProfileSkeleton />
export const ProfileSkeleton = () => {
  injectShimmer();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Skeleton w={72} h={72} r="50%" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton w="45%" h={18} r={6} />
        <Skeleton w="30%" h={13} r={4} />
        <Skeleton w="55%" h={13} r={4} />
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── 7. TextBlockSkeleton — đoạn văn bản nhiều dòng ───────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Dùng: <TextBlockSkeleton lines={4} />
export const TextBlockSkeleton = ({ lines = 3, gap = 10 }) => {
  injectShimmer();
  const widths = ["95%", "88%", "92%", "70%", "80%", "60%"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} w={widths[i % widths.length]} h={14} r={4} />
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── 8. StatCardSkeleton — card số liệu admin dashboard ───────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Dùng: <StatCardSkeleton count={4} />
export const StatCardSkeleton = ({ count = 1 }) => {
  injectShimmer();
  const card = (i) => (
    <div
      key={i}
      style={{
        padding: "20px 22px", borderRadius: 14,
        background: "#161616", border: "1px solid #ffffff10",
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton w="50%" h={13} r={4} />
        <Skeleton w={32} h={32} r={9} />
      </div>
      <Skeleton w="60%" h={28} r={6} />
      <Skeleton w="40%" h={11} r={4} />
    </div>
  );
  return count === 1 ? card(0) : <>{Array.from({ length: count }, (_, i) => card(i))}</>;
};

// ── Default export giữ nguyên API cũ ─────────────────────────────────────────
export default Skeleton;
export const C = {
  bg: "#000000",
  surface: "#0a0a0a",
  surfaceHigh: "#111111",
  surfaceMid: "#181818",
  card: "#141414",
  border: "rgba(255,255,255,0.07)",
  borderBright: "rgba(255,255,255,0.14)",
  accent: "#e5181e",
  accentSoft: "rgba(229,24,30,0.15)",
  accentGlow: "rgba(229,24,30,0.35)",
  text: "#f0f2f8",
  textSub: "#9299a8",
  textDim: "#525868",
  gold: "#f5c518",
  green: "#46d369",
};

export const toSlug = (name) =>
  (name || "unknown")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const fmt = (n) => (n ? n.toFixed(1) : "—");

export const fmtRuntime = (min) => {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}g ${m}p` : `${m}p`;
};

export const extractYoutubeKey = (url) => {
  if (!url) return null;
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  return null;
};

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,700;0,800;0,900;1,700&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes spin { to { transform: rotate(360deg) } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

import { C, FONT_BODY, FONT_TITLE } from "../../../context/homeTokens";

// ── Styles (hover / focus dùng class để có :focus-visible) ─────────────────
export const CSS = `
.rv-root { font-family: ${FONT_BODY}; }
.rv-root button { font-family: inherit; }
.rv-root p { margin: 0; }
.rv-root :focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
.rv-root .rv-textarea:focus-visible { outline: none; }

.rv-field { background: ${C.surface}; border: 1px solid ${C.border}; transition: border-color .15s; }
.rv-field:focus-within { border-color: ${C.borderBright}; }
button.rv-fake { width: 100%; text-align: left; padding: 11px 18px; border-radius: 24px; color: ${C.textDim}; font-size: 14px; cursor: text; }
button.rv-fake:hover { border-color: ${C.borderBright}; }

.rv-textarea { width: 100%; box-sizing: border-box; background: transparent; border: 0; outline: 0; resize: none; color: ${C.text}; font-family: ${FONT_BODY}; line-height: 1.6; }
.rv-textarea::placeholder { color: ${C.textDim}; }

.rv-link { background: none; border: 0; padding: 4px 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; color: ${C.textDim}; font: 600 12.5px ${FONT_BODY}; }
.rv-link:hover { color: ${C.text}; }
.rv-link.active { color: ${C.accent}; }
.rv-link.danger:hover { color: #f87171; }

.rv-icon { background: none; border: 0; cursor: pointer; color: ${C.textDim}; padding: 6px; border-radius: 50%; display: flex; }
.rv-icon:hover { background: rgba(255,255,255,0.06); color: ${C.text}; }

.rv-menu { position: absolute; right: 0; top: calc(100% + 4px); z-index: 30; min-width: 140px; padding: 4px; background: ${C.card}; border: 1px solid ${C.borderBright}; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.45); }
.rv-menu button { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: none; border: 0; border-radius: 6px; cursor: pointer; color: ${C.textSub}; font: 600 13px ${FONT_BODY}; }
.rv-menu button:hover { background: rgba(255,255,255,0.06); color: ${C.text}; }
.rv-menu button.danger:hover { color: #f87171; }

.rv-send { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; background: ${C.accent}; color: #fff; }
.rv-send:disabled { background: transparent; color: ${C.textDim}; cursor: default; }

.rv-primary { padding: 8px 20px; border-radius: 999px; border: 0; background: ${C.accent}; color: #fff; font: 700 13px ${FONT_TITLE}; cursor: pointer; }
.rv-primary:disabled { background: rgba(255,255,255,0.08); color: ${C.textDim}; cursor: default; }

.rv-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; border: 1px solid ${C.border}; background: none; color: ${C.textSub}; font: 600 12.5px ${FONT_BODY}; cursor: pointer; }
.rv-chip:hover { border-color: ${C.borderBright}; }
.rv-chip[aria-pressed="true"] { border-color: rgba(245,197,24,0.4); color: ${C.gold}; background: rgba(245,197,24,0.08); }

.rv-star { background: none; border: 0; padding: 3px; cursor: pointer; display: flex; border-radius: 6px; }

.rv-reveal { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: none; border: 0; cursor: pointer; color: ${C.text}; font: 700 13px ${FONT_BODY}; text-shadow: 0 1px 8px rgba(0,0,0,0.8); }

.rv-tab { background: none; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; padding: 10px 2px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font: 700 14px ${FONT_BODY}; color: ${C.textDim}; }
.rv-tab:hover { color: ${C.text}; }
.rv-tab[aria-selected="true"] { color: ${C.text}; border-bottom-color: ${C.accent}; }

.rv-item:last-child { border-bottom: 0 !important; }

@keyframes rv-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* Thẻ đánh giá */
.rv-score { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px 3px 8px; border-radius: 999px; background: rgba(245,197,24,0.10); color: ${C.gold}; font: 800 13px ${FONT_TITLE}; font-variant-numeric: tabular-nums; white-space: nowrap; }
.rv-score small { font: 600 11px ${FONT_BODY}; color: ${C.textDim}; }
.rv-you { flex-shrink: 0; padding: 1px 8px; border-radius: 999px; background: rgba(255,255,255,0.07); color: ${C.textSub}; font: 700 11px ${FONT_BODY}; }
.rv-spoiler { padding: 0 6px; border-radius: 4px; border: 1px solid rgba(245,197,24,0.35); color: ${C.gold}; font: 700 11.5px ${FONT_BODY}; }
.rv-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 1px; font-size: 12px; color: ${C.textDim}; }

/* Phân bố điểm */
.rv-dist { display: flex; align-items: center; gap: 8px; }
.rv-dist-n { width: 16px; flex-shrink: 0; text-align: right; font-size: 12px; color: ${C.textDim}; font-variant-numeric: tabular-nums; }
.rv-dist-track { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; }
.rv-dist-c { width: 28px; flex-shrink: 0; font-size: 12px; color: ${C.textDim}; font-variant-numeric: tabular-nums; }

/* Modal xóa (render qua portal nên không nằm trong .rv-root) */
.rvm-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.86); }
.rvm { width: 100%; max-width: 360px; box-sizing: border-box; overflow: hidden; border-radius: 6px; background: ${C.surfaceMid}; border: 1px solid ${C.borderMid}; font-family: ${FONT_BODY}; color: ${C.text}; }
.rvm :focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
.rvm-body { padding: 24px 24px 22px; }
.rvm-title { margin: 0; font: 700 15px/1.4 ${FONT_TITLE}; color: ${C.text}; }
.rvm-desc { margin: 8px 0 0; font-size: 13px; line-height: 1.65; color: ${C.textSub}; }
.rvm-preview { margin: 18px 0 0; padding-top: 16px; border-top: 1px solid ${C.border}; }
.rvm-preview-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 12px; color: ${C.textSub}; }
.rvm-preview-text { margin: 0; font-size: 13px; line-height: 1.6; color: rgba(240,240,240,0.72); word-break: break-word; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.rvm-actions { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid ${C.border}; }
.rvm-btn { padding: 15px 16px; border: 0; border-radius: 0; background: transparent; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font: 700 13px ${FONT_BODY}; cursor: pointer; transition: background .15s, color .15s; }
.rvm-btn:focus-visible { outline-offset: -2px; }
.rvm-btn:disabled { cursor: default; opacity: 0.5; }
.rvm-cancel { color: ${C.textSub}; }
.rvm-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.04); color: ${C.text}; }
.rvm-danger { border-left: 1px solid ${C.border}; color: #ff5257; }
.rvm-danger:hover:not(:disabled) { background: ${C.accentSoft}; }
.rvm-spin { width: 12px; height: 12px; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; animation: rvm-rot .7s linear infinite; }
@keyframes rvm-rot { to { transform: rotate(360deg); } }
@media (max-width: 520px) {
  .rvm-backdrop { align-items: flex-end; padding: 0; }
  .rvm { max-width: none; border-radius: 10px 10px 0 0; border-bottom: 0; }
  .rvm-body { padding: 24px 20px 22px; }
  .rvm-actions { padding-bottom: env(safe-area-inset-bottom, 0px); }
}

@media (prefers-reduced-motion: reduce) {
  .rv-root * { transition: none !important; animation: none !important; }
}
`;
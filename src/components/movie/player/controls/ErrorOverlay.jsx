// src/components/player/controls/ErrorOverlay.jsx
// Hiện lỗi phát video thẳng trên màn hình (debug trên mobile, không cần DevTools).
export default function ErrorOverlay({ error }) {
  if (!error) return null;
  return (
    <div className="vp-error">
      <p className="vp-error__title">Lỗi phát video (code: {String(error.code)})</p>
      <p className="vp-error__msg">{error.message}</p>
      <p className="vp-error__src">{error.src}</p>
    </div>
  );
}
// src/components/home/coming-soon/ComingSoonCountdown.jsx
// Countdown realtime — CHỈ dùng cho featured movie (theo yêu cầu #5).
// Cô lập trong component riêng để setInterval không re-render cả section.
import React, { useEffect, useState } from "react";
import { C, FONT_BODY } from "../../../context/homeTokens";
import { getCountdownParts } from "../../../utils/releaseDateUtils";

const Unit = ({ value, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 }}>
    <span
      style={{
        fontFamily: FONT_BODY,
        fontSize: 20,
        fontWeight: 800,
        color: C.text,
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
      }}
    >
      {String(value).padStart(2, "0")}
    </span>
    <span
      style={{
        fontFamily: FONT_BODY,
        fontSize: 9,
        color: C.textSub,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginTop: 4,
      }}
    >
      {label}
    </span>
  </div>
);

export default function ComingSoonCountdown({ item, accentColor }) {
  const [parts, setParts] = useState(() => getCountdownParts(item));

  useEffect(() => {
    setParts(getCountdownParts(item));
    // Chỉ update mỗi giây, chỉ cho component nhỏ này — không ảnh hưởng carousel/section cha
    const t = setInterval(() => setParts(getCountdownParts(item)), 1000);
    return () => clearInterval(t);
  }, [item]);

  if (!parts || parts.done) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 16px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${accentColor || C.borderAccent}30`,
        width: "fit-content",
      }}
    >
      <Unit value={parts.days} label="Ngày" />
      <Divider />
      <Unit value={parts.hours} label="Giờ" />
      <Divider />
      <Unit value={parts.minutes} label="Phút" />
      <Divider />
      <Unit value={parts.seconds} label="Giây" />
    </div>
  );
}

const Divider = () => (
  <span style={{ color: C.textDim, fontSize: 16, fontWeight: 300, marginTop: -8 }}>:</span>
);
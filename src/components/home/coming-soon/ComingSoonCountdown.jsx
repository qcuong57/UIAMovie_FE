// src/components/home/coming-soon/ComingSoonCountdown.jsx

import React, { useEffect, useState } from "react";
import { C, FONT_BODY } from "../../../context/homeTokens";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { getCountdownParts } from "../../../utils/releaseDateUtils";

const Unit = ({ value, label, isMobile }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: isMobile ? 32 : 44 }}>
    <span
      style={{
        fontFamily: FONT_BODY,
        fontSize: isMobile ? 15 : 19,
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
        fontSize: isMobile ? 8 : 9,
        color: C.textSub,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginTop: 3,
      }}
    >
      {label}
    </span>
  </div>
);

export default function ComingSoonCountdown({ item, accentColor }) {
  const isMobile = useIsMobile();
  const [parts, setParts] = useState(() => getCountdownParts(item));

  useEffect(() => {
    setParts(getCountdownParts(item));
    const t = setInterval(() => setParts(getCountdownParts(item)), 1000);
    return () => clearInterval(t);
  }, [item]);

  if (!parts || parts.done) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
        padding: isMobile ? "6px 12px" : "8px 16px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        width: "fit-content",
      }}
    >
      <Unit value={parts.days} label="Ngày" isMobile={isMobile} />
      <span style={{ color: C.textDim, fontSize: 13, marginTop: -4 }}>:</span>
      <Unit value={parts.hours} label="Giờ" isMobile={isMobile} />
      <span style={{ color: C.textDim, fontSize: 13, marginTop: -4 }}>:</span>
      <Unit value={parts.minutes} label="Phút" isMobile={isMobile} />
      <span style={{ color: C.textDim, fontSize: 13, marginTop: -4 }}>:</span>
      <Unit value={parts.seconds} label="Giây" isMobile={isMobile} />
    </div>
  );
}
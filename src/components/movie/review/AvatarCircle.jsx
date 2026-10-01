// src/components/movie/shared/review/AvatarCircle.jsx
import { FONT_TITLE } from "../../../context/homeTokens";
import React, { useState } from "react";

// ── Avatar ─────────────────────────────────────────────────────────────────
const AvatarCircle = ({ name, avatarUrl, size = 40 }) => {
  const [err, setErr] = useState(false);
  const color = `hsl(${((name?.charCodeAt(0) || 65) * 17) % 360}, 34%, 30%)`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_TITLE,
        fontSize: size * 0.42,
        fontWeight: 700,
        color: "#fff",
      }}
    >
      {avatarUrl && !err ? (
        <img
          src={avatarUrl}
          alt=""
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        name?.charAt(0)?.toUpperCase() || "?"
      )}
    </div>
  );
};

export default AvatarCircle;

// src/components/movie/ui/PremiumLockedPlayer.jsx
// Khung thay cho video player khi nội dung Premium mà user chưa có gói.
// Dùng chung cho MovieDetailPage và TvShowDetailPage (trước đây copy nguyên khối ở cả hai).
import React from "react";
import { Crown } from "lucide-react";

const GOLD = "linear-gradient(135deg, rgba(250,204,21,0.95), rgba(245,158,11,0.95))";

export default function PremiumLockedPlayer({ posterUrl, title, onUpgrade }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: 12,
        overflow: "hidden",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      {posterUrl && (
        <img
          src={posterUrl}
          alt={title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(18px) brightness(0.35)",
            transform: "scale(1.1)",
          }}
        />
      )}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: GOLD,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Crown size={26} fill="#1c1400" color="#1c1400" />
        </div>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>
          Nội dung dành cho thành viên Premium
        </p>
        <button
          onClick={onUpgrade}
          style={{
            marginTop: 4,
            padding: "10px 22px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: GOLD,
            color: "#1c1400",
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          Nâng cấp Premium
        </button>
      </div>
    </div>
  );
}
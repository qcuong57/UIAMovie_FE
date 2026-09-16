// src/components/home/coming-soon/ComingSoonFeatured.jsx

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Info, Play, Volume2, VolumeX, X, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C, FONT_DISPLAY, FONT_BODY } from "../../../context/homeTokens";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { getReleaseLabel, getDaysUntilRelease } from "../../../utils/releaseDateUtils";
import { isYoutubeUrl, getYoutubeEmbedUrl } from "../../../utils/videoUtils";
import ComingSoonCountdown from "./ComingSoonCountdown";

const infoPath = (item) => (item.isTvShow ? `/tvshow/${item.id}/info` : `/movie/${item.id}/info`);

function CornerTrailer({ item, isMobile }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const isYT = isYoutubeUrl(item.trailerVideoUrl);

  useEffect(() => {
    if (playing && !isYT && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [playing, isYT]);

  const width = isMobile ? 110 : 200;
  const height = (width * 9) / 16;

  const close = (e) => {
    e.stopPropagation();
    setPlaying(false);
    setReady(false);
    if (!isYT && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setMuted((m) => {
      if (!isYT && videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!playing) setPlaying(true);
      }}
      style={{
        position: "absolute",
        top: isMobile ? 12 : 20,
        right: isMobile ? 12 : 20,
        width,
        height,
        borderRadius: 8,
        overflow: "hidden",
        cursor: playing ? "default" : "pointer",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
        zIndex: 15,
        background: C.surfaceHigh,
      }}
    >
      {(item.backdropUrl || item.posterUrl) && (
        <img
          src={item.backdropUrl || item.posterUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: playing && ready ? 0 : 1,
          }}
        />
      )}

      {playing && (
        isYT ? (
          <iframe
            key={muted ? "muted" : "unmuted"}
            src={getYoutubeEmbedUrl(item.trailerVideoUrl, { autoplay: true, muted, loop: true })}
            title={`${item.title} trailer`}
            allow="autoplay; encrypted-media"
            onLoad={() => setReady(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, pointerEvents: "none" }}
          />
        ) : (
          <video
            ref={videoRef}
            src={item.trailerVideoUrl}
            muted={muted}
            playsInline
            loop
            onCanPlay={() => setReady(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: playing ? "none" : "rgba(0,0,0,0.35)",
          pointerEvents: "none",
        }}
      />

      {!playing ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: isMobile ? 24 : 36,
              height: isMobile ? 24 : 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={isMobile ? 10 : 14} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
          </div>
        </div>
      ) : (
        <button
          onClick={close}
          aria-label="Đóng trailer"
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={11} color="#fff" />
        </button>
      )}
    </motion.div>
  );
}

export default function ComingSoonFeatured({ item, items, accentColor = C.gold }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const activeItem = item ?? (items && items.length ? items[0] : null);
  if (!activeItem) return null;

  const days = getDaysUntilRelease(activeItem);
  // Bỏ chặn 30 ngày: Phim tương lai sẽ luôn hiển thị đếm ngược
  const showCountdown = days != null && days >= 0;
  const hasTrailer = Boolean(activeItem.trailerVideoUrl);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: isMobile ? 14 : 18,
        overflow: "hidden",
        minHeight: isMobile ? 420 : 460,
        marginBottom: isMobile ? 24 : 36,
        background: C.surface,
        border: `1px solid ${C.borderMid}`,
      }}
    >
      {/* Backdrop */}
      {activeItem.backdropUrl && (
        <img
          src={activeItem.backdropUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: isMobile ? "center top" : "center",
          }}
        />
      )}

      {/* Gradient lớp phủ chống chói chữ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isMobile
            ? "linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.3) 100%)"
            : "linear-gradient(to right, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.2) 75%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)",
        }}
      />

      {/* Trailer góc */}
      {hasTrailer && <CornerTrailer item={activeItem} isMobile={isMobile} />}

      {/* Content wrapper */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "flex-end",
          gap: isMobile ? 16 : 28,
          height: "100%",
          padding: isMobile ? "20px 16px" : "36px 44px",
          paddingTop: isMobile ? 54 : "36px",
        }}
      >
        {/* Poster phim sắp chiếu (Hiển thị cả mobile và desktop) */}
        {activeItem.posterUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              flexShrink: 0,
              width: isMobile ? 96 : 160,
              aspectRatio: "2/3",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 14px 32px rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <img
              src={activeItem.posterUrl}
              alt={activeItem.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </motion.div>
        )}

        {/* Cụm thông tin */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: isMobile ? 7 : 10, maxWidth: 640 }}>
          {/* Badge Sắp Chiếu */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: isMobile ? "2px 8px" : "3px 10px",
              borderRadius: 99,
              fontFamily: FONT_BODY,
              fontSize: isMobile ? 10 : 11,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "rgba(245, 197, 24, 0.2)",
              border: "1px solid rgba(245, 197, 24, 0.6)",
              color: accentColor,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}
          >
            SẮP CHIẾU
          </span>

          {/* Title */}
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: isMobile ? 20 : 32,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.2,
              margin: 0,
              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            }}
          >
            {activeItem.title}
          </h2>

          {/* Meta (Ngày chiếu & Thể loại) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: isMobile ? 11.5 : 13,
              fontWeight: 600,
              color: "#ffffff",
              textShadow: "0 1px 5px rgba(0,0,0,0.9)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: accentColor, fontWeight: 700 }}>
              <Calendar size={isMobile ? 12 : 14} />
              {getReleaseLabel(activeItem)}
            </span>
            {activeItem.genres?.length > 0 && (
              <>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ color: "rgba(255,255,255,0.85)" }}>
                  {activeItem.genres.slice(0, 3).map((g) => (typeof g === "string" ? g : g?.name)).join(", ")}
                </span>
              </>
            )}
          </div>

          {/* Countdown timer */}
          {showCountdown && (
            <div style={{ marginTop: 2, marginBottom: 2 }}>
              <ComingSoonCountdown item={activeItem} accentColor={accentColor} />
            </div>
          )}

          {/* Mô tả */}
          {activeItem.description && (
            <p
              style={{
                fontFamily: FONT_BODY,
                fontSize: isMobile ? 12 : 13.5,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.5,
                margin: "2px 0 6px",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                display: "-webkit-box",
                WebkitLineClamp: isMobile ? 2 : 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {activeItem.description}
            </p>
          )}

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(infoPath(activeItem))}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: isMobile ? "7px 16px" : "9px 20px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              color: "#ffffff",
              fontFamily: FONT_BODY,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 700,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              marginTop: 4,
            }}
          >
            <Info size={14} />
            Chi Tiết
          </motion.button>
        </div>
      </div>
    </div>
  );
}
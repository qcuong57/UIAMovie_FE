// src/components/home/coming-soon/ComingSoonFeatured.jsx
// Hero cho "Sắp Chiếu" — chỉ hiển thị 1 phim (item gần ngày ra mắt nhất).
// Có góc trailer riêng (CornerTrailer) nếu item đó có trailerVideoUrl.
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Info, Play, Volume2, VolumeX, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C, FONT_DISPLAY, FONT_BODY } from "../../../context/homeTokens";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { getReleaseLabel, getDaysUntilRelease } from "../../../utils/releaseDateUtils";
import { isYoutubeUrl, getYoutubeEmbedUrl } from "../../../utils/videoUtils";
import ComingSoonCountdown from "./ComingSoonCountdown";

const infoPath = (item) => (item.isTvShow ? `/tvshow/${item.id}/info` : `/movie/${item.id}/info`);

// ── Trailer góc — chỉ hiện khi item đã có trailer chính thức ──────────────
// Business rule: trailer chỉ upload cho phim sắp ra mắt gần, không phải mọi
// phim coming soon đều có → component tự ẩn nếu không có trailerVideoUrl
// (kiểm tra hasTrailer ở component cha, tránh mount thừa).
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

  const width = isMobile ? 108 : 220;
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
      transition={{ duration: 0.5, delay: 0.2 }}
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
        borderRadius: 10,
        overflow: "hidden",
        cursor: playing ? "default" : "pointer",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.55)",
        zIndex: 2,
        background: C.surfaceHigh,
      }}
    >
      {/* Thumbnail nền — luôn render để tránh giật hình khi video đang load */}
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
            transition: "opacity 0.3s ease",
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

      {/* Overlay tối nhẹ để icon/nút nổi bật trên mọi loại ảnh nền */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: playing
            ? "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 45%)"
            : "rgba(0,0,0,0.28)",
          pointerEvents: "none",
        }}
      />

      {!playing ? (
        <>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                width: isMobile ? 30 : 40,
                height: isMobile ? 30 : 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play size={isMobile ? 13 : 17} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
            </div>
          </div>
          <span
            style={{
              position: "absolute",
              left: 8,
              bottom: 6,
              fontFamily: FONT_BODY,
              fontSize: isMobile ? 9 : 10,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Trailer
          </span>
        </>
      ) : (
        <>
          <button
            onClick={close}
            aria-label="Đóng trailer"
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={12} color="#fff" />
          </button>

          {!isMobile && (
            <button
              onClick={toggleMute}
              aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
              style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {muted ? <VolumeX size={11} color="#fff" /> : <Volume2 size={11} color="#fff" />}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── Badge "Sắp Chiếu" — pill giống type badge của HeroBanner.jsx:
// nền tint màu accent + border cùng màu, uppercase, letter-spacing 0.1em ──
function ComingSoonBadge({ accentColor, isMobile }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        width: "fit-content",
        whiteSpace: "nowrap",
        padding: "4px 10px 0px 10px",
        borderRadius: 99,
        fontFamily: FONT_BODY,
        fontSize: isMobile ? 10 : 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        background: `${accentColor}2e`, // ~18% alpha, cùng cách HeroBanner dùng rgba(...,0.18)
        border: `1px solid ${accentColor}66`, // ~40% alpha
        color: accentColor,
      }}
    >
      Sắp Chiếu
    </span>
  );
}

export default function ComingSoonFeatured({ item, items, accentColor = C.gold }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Tương thích ngược: nếu ai đó còn truyền `items` (mảng), chỉ lấy phần tử đầu
  const activeItem = item ?? (items && items.length ? items[0] : null);

  if (!activeItem) return null;

  const days = getDaysUntilRelease(activeItem);
  const showCountdown = days != null && days >= 0 && days <= 30;
  const hasTrailer = Boolean(activeItem.trailerVideoUrl);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: isMobile ? 14 : 18,
        overflow: "hidden",
        minHeight: isMobile ? 340 : 460,
        marginBottom: isMobile ? 24 : 32,
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
          }}
          loading="lazy"
        />
      )}

      {/* Gradient/mask — hoà backdrop vào nền, tránh cảm giác banner cứng */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isMobile
            ? `linear-gradient(to top, ${C.bg} 5%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 100%)`
            : `linear-gradient(to right, ${C.bg} 0%, rgba(0,0,0,0.75) 32%, rgba(0,0,0,0.25) 62%, transparent 100%),
               linear-gradient(to top, ${C.bg} 0%, transparent 35%)`,
        }}
      />

      {/* Trailer góc — chỉ mount khi item có trailer chính thức */}
      {hasTrailer && <CornerTrailer item={activeItem} isMobile={isMobile} />}

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: isMobile ? "column-reverse" : "row",
          alignItems: isMobile ? "stretch" : "flex-end",
          gap: isMobile ? 16 : 32,
          height: "100%",
          padding: isMobile ? "20px 18px" : "40px 48px",
        }}
      >
        {/* Poster — desktop only, cinematic touch */}
        {!isMobile && activeItem.posterUrl && (
          <motion.img
            src={activeItem.posterUrl}
            alt={activeItem.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              width: 160,
              aspectRatio: "2/3",
              objectFit: "cover",
              borderRadius: 10,
              boxShadow: "0 20px 48px -8px rgba(0,0,0,0.85)",
              flexShrink: 0,
            }}
          />
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, maxWidth: 560 }}
        >
          <ComingSoonBadge accentColor={accentColor} isMobile={isMobile} />

          <h3
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: isMobile ? 22 : 34,
              fontWeight: 800,
              color: C.text,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            {activeItem.title}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.text }}>
              {getReleaseLabel(activeItem)}
            </span>
            {activeItem.genres?.length > 0 && (
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>
                {activeItem.genres.slice(0, 3).map((g) => (typeof g === "string" ? g : g?.name)).join(" · ")}
              </span>
            )}
          </div>

          {showCountdown && <ComingSoonCountdown item={activeItem} accentColor={accentColor} />}

          {activeItem.description && !isMobile && (
            <p
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                color: C.textSub,
                lineHeight: 1.6,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {activeItem.description}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {/* Nút Chi Tiết — style kính mờ (frosted), đồng bộ với hệ UI chung, thu nhỏ để vừa section này */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(infoPath(activeItem))}
              aria-label="Xem chi tiết"
              className="bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 flex items-center gap-2 border border-white/30"
              style={{
                padding: isMobile ? "7px 14px" : "9px 20px",
                fontFamily: FONT_BODY,
                fontSize: isMobile ? 12 : 13,
              }}
            >
              <Info size={14} />
              Chi Tiết
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
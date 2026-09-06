// src/components/home/TrailerShowcaseSection.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Section "Trailer Mới Cập Nhật" — coverflow cong 3D kiểu Netflix/App-store hero:
//   - Dải card nằm trên một mặt cong "cup": đáy mỗi card bo cong hình elip,
//     card 2 bên được nâng cao hơn card giữa để cả dải tạo cảm giác lõm/cười
//   - Badge phân biệt Phim Lẻ (pill gradient đỏ) / Phim Bộ (pill gradient indigo)
//   - Không tự phát trailer — chỉ hover vào card nào thì card đó mới load &
//     phát trailer (muted), đồng thời hiện nút tròn "Xem Ngay" ở giữa, fade in
//   - 2 nút mũi tên tròn 2 bên để chuyển active card (loop vòng)
//   - Click vào 1 card bên cạnh → card đó trở thành active (không điều hướng ngay)
//   - Click "Xem Trailer" / nút "Xem Ngay" / double-click card active → điều
//     hướng trang chi tiết
//   - Mobile: giảm perspective + số card hiển thị; không có hover thật nên card
//     active hiển thị nút "Xem Trailer" tĩnh thay cho nút hover
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX, Clapperboard } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";

// ── Layout tuning ───────────────────────────────────────────────────────────
const CARD_W_DESKTOP = 560;
const CARD_W_MOBILE = 300;
const SIDE_SPACING_DESKTOP = 300; // khoảng cách ngang giữa các card lân cận
const SIDE_SPACING_MOBILE = 160;
const MAX_VISIBLE_SIDE = 2; // số card hiển thị mỗi bên của active
const CUP_LIFT = 46; // độ nâng card theo mỗi bậc offset — tạo mặt cong "cup"

function slotStyle(offset, isMobile) {
  const spacing = isMobile ? SIDE_SPACING_MOBILE : SIDE_SPACING_DESKTOP;
  const abs = Math.abs(offset);

  if (abs > MAX_VISIBLE_SIDE) {
    return {
      transform: `translate3d(${offset * spacing}px, 0, -600px) rotateY(${offset > 0 ? -1 : 1}deg)`,
      opacity: 0,
      pointerEvents: "none",
      zIndex: 0,
    };
  }

  const rotate = offset === 0 ? 0 : offset > 0 ? -34 : 34; // "cong" vào trong
  const translateZ = -abs * 140;
  const translateX = offset * spacing;
  // Nâng card theo bậc offset để cả dải nằm trên một mặt cong (hiệu ứng cup/smile)
  const translateY = -abs * (isMobile ? CUP_LIFT * 0.55 : CUP_LIFT);
  const scale = offset === 0 ? 1 : 1 - abs * 0.14;
  const opacity = offset === 0 ? 1 : 1 - abs * 0.32;

  return {
    transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotate}deg) scale(${scale})`,
    opacity,
    zIndex: 10 - abs,
    pointerEvents: "auto",
  };
}

// ── Single trailer card ─────────────────────────────────────────────────────
function TrailerCard({ item, offset, isMobile, isActive, onSelect, onNavigate }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const hoverTimer = useRef(null);

  // Chỉ phát trailer khi hover — không autoplay theo trạng thái active
  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    if (item.trailerVideoUrl) {
      hoverTimer.current = setTimeout(() => setIsPlaying(true), 350);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    clearTimeout(hoverTimer.current);
    setIsHovered(false);
    setIsPlaying(false);
    setVideoReady(false);
  };

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted((m) => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  };

  const handleClick = () => {
    if (isActive) onNavigate(item);
    else onSelect(offset);
  };

  const width = isMobile ? CARD_W_MOBILE : CARD_W_DESKTOP;
  // Thanh "Xem Ngay" chỉ hiện khi hover vào card, fade in trượt lên từ dưới
  const showWatchBar = isActive && (isMobile ? true : isHovered);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        width,
        aspectRatio: "16 / 9",
        marginLeft: -width / 2,
        // Đáy card bo cong hình elip: góc trên nhỏ, góc dưới lớn theo chiều dọc
        borderRadius: "14px 14px 50% 50% / 14px 14px 34px 34px",
        overflow: "hidden",
        cursor: "pointer",
        background: C.surfaceCard,
        border: `1px solid ${isActive ? C.borderAccent : C.border}`,
        boxShadow: isActive
          ? "0 30px 60px rgba(0,0,0,0.55)"
          : "0 14px 30px rgba(0,0,0,0.35)",
        transition: "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s ease, box-shadow 0.4s ease, border-color 0.4s ease",
        transformStyle: "preserve-3d",
        ...slotStyle(offset, isMobile),
      }}
    >
      {/* Backdrop */}
      {item.backdropUrl ? (
        <img
          src={item.backdropUrl}
          alt={item.title}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isPlaying && videoReady ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.surfaceHigh,
          }}
        >
          <Clapperboard size={28} color={C.textDim} />
        </div>
      )}

      {isPlaying && item.trailerVideoUrl && (
        <video
          ref={videoRef}
          src={item.trailerVideoUrl}
          muted={isMuted}
          playsInline
          loop
          onCanPlay={() => setVideoReady(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Gradient đáy */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 42%, transparent 62%)",
          pointerEvents: "none",
        }}
      />


      {/* Nút tắt/mở tiếng — khi trailer đang phát */}
      {isPlaying && videoReady && !isMobile && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Bật tiếng" : "Tắt tiếng"}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: `1px solid ${C.borderMid}`,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
          }}
        >
          {isMuted ? <VolumeX size={14} color={C.text} /> : <Volume2 size={14} color={C.text} />}
        </button>
      )}

      {/* Info + CTA đáy card — chỉ đầy đủ trên card active, card phụ chỉ tên */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: isActive ? "0 0 20px" : "0 0 12px" }}>
        <p
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: isActive ? (isMobile ? 18 : 24) : 13,
            fontWeight: 800,
            color: C.text,
            margin: "0 16px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center",
          }}
        >
          {item.title}
        </p>

        {isActive && (
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 4, gap: 8, alignItems: "center" }}
          >
            {item.year && (
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>{item.year}</span>
            )}
            {item.genres?.[0] && (
              <>
                <span style={{ color: C.textDim, fontSize: 10 }}>•</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>
                  {typeof item.genres[0] === "string" ? item.genres[0] : item.genres[0]?.name}
                </span>
              </>
            )}
          </div>
        )}

      </div>

      {/* Thanh "Xem Ngay" phủ hết đáy card — ẩn khi hover (trailer đang phát), fade-in trượt lên khi rời chuột */}
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(item);
          }}
          aria-label="Xem ngay"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "13px 0",
            border: "none",
            borderTop: `1px solid ${C.borderMid}`,
            background: C.accent,
            cursor: "pointer",
            opacity: showWatchBar ? 1 : 0,
            transform: showWatchBar ? "translateY(0)" : "translateY(100%)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
            pointerEvents: showWatchBar ? "auto" : "none",
          }}
        >
          <Play size={14} color="#fff" fill="#fff" />
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 0.2 }}>
            Xem Ngay
          </span>
        </button>
      )}
    </div>
  );
}

// ── Arrow button ─────────────────────────────────────────────────────────────
function ArrowButton({ direction, onClick }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={direction === "left" ? "Trailer trước" : "Trailer tiếp theo"}
      style={{
        position: "absolute",
        top: "50%",
        [direction]: 4,
        transform: "translateY(-50%)",
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: `1px solid ${C.borderMid}`,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 20,
      }}
    >
      <Icon size={20} color={C.text} />
    </button>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────
const MAX_TRAILERS = 10; // chỉ hiển thị N trailer mới thêm gần nhất

export default function TrailerShowcaseSection({ items = [] }) {
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);

  // Sắp xếp theo ngày thêm mới nhất (createdAt) rồi chỉ lấy MAX_TRAILERS phần tử đầu
  const recentItems = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_TRAILERS);
  }, [items]);

  const count = recentItems.length;

  const goTo = useCallback(
    (delta) => {
      if (!count) return;
      setActiveIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  // Điều hướng thủ công (mũi tên / dot / click card) — không còn auto-play
  const handleManualGoTo = useCallback((delta) => goTo(delta), [goTo]);

  const handleManualSetIndex = useCallback((i) => setActiveIndex(i), []);

  const slots = useMemo(() => {
    if (!count) return [];
    return recentItems.map((item, i) => {
      let offset = i - activeIndex;
      // chuẩn hoá offset để vòng quanh theo hướng ngắn nhất
      if (offset > count / 2) offset -= count;
      if (offset < -count / 2) offset += count;
      return { item, offset, index: i };
    });
  }, [recentItems, activeIndex, count]);

  if (!count) return null;

  const handleNavigate = (item) => {
    window.location.href = item.isTvShow ? `/tvshow/${item.id}/info` : `/movie/${item.id}/info`;
  };

  const stageHeight = isMobile
    ? (CARD_W_MOBILE * 9) / 16 + 90
    : (CARD_W_DESKTOP * 9) / 16 + 40 + CUP_LIFT * MAX_VISIBLE_SIDE;

  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: isMobile ? 22 : 30,
            fontWeight: 800,
            color: C.text,
            margin: 0,
          }}
        >
          Trailer Mới Cập Nhật
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSub, marginTop: 6 }}>
          Xem trước những bộ phim &amp; series vừa lên trailer
        </p>
      </div>

      <div
        style={{
          position: "relative",
          height: stageHeight,
          perspective: isMobile ? 900 : 1400,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
          }}
        >
          {slots.map(({ item, offset, index }) => (
            <TrailerCard
              key={`${item.isTvShow ? "tv" : "movie"}-${item.id}`}
              item={item}
              offset={offset}
              isMobile={isMobile}
              isActive={offset === 0}
              onSelect={(off) => handleManualGoTo(off)}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {count > 1 && (
          <>
            <ArrowButton direction="left" onClick={() => handleManualGoTo(-1)} />
            <ArrowButton direction="right" onClick={() => handleManualGoTo(1)} />
          </>
        )}
      </div>

      {/* Dots điều hướng nhanh */}
      {count > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {recentItems.map((_, i) => (
            <button
              key={i}
              onClick={() => handleManualSetIndex(i)}
              aria-label={`Đi đến trailer ${i + 1}`}
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                border: "none",
                background: i === activeIndex ? C.accent : C.borderMid,
                cursor: "pointer",
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
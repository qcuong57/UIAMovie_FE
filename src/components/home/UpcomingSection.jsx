// src/components/home/UpcomingSection.jsx
// "Sắp Chiếu" kiểu Netflix "Coming Soon": thẻ backdrop + ngày ra mắt + đếm ngược ngày.
import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CalendarClock, Crown } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/common/useIsMobile";
import { contentPath } from "../../utils/normalizeHomeCard";
import SectionBadge from "./SectionBadge";

const ACCENT = "#38bdf8";

const daysUntil = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function UpcomingCard({ item, isMobile }) {
  const [hover, setHover] = useState(false);
  const img = item.backdropUrl || item.posterUrl;
  const left = daysUntil(item.releaseDate);
  const countdown =
    left == null ? null : left > 1 ? `Còn ${left} ngày` : left === 1 ? "Ngày mai" : left === 0 ? "Hôm nay" : "Đã ra mắt";

  return (
    <Link
      to={contentPath(item)}
      aria-label={item.title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: isMobile ? "74%" : 320,
        aspectRatio: "16 / 9",
        borderRadius: 10,
        overflow: "hidden",
        background: "rgba(255,255,255,0.05)",
        textDecoration: "none",
        scrollSnapAlign: "start",
        transform: hover ? "scale(1.03)" : "scale(1)",
        boxShadow: hover ? "0 14px 32px rgba(0,0,0,0.55)" : "none",
        transition: "transform .25s ease, box-shadow .25s ease",
      }}
    >
      {img && (
        <img
          src={img}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.1) 60%)",
        }}
      />

      {countdown && (
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 9px",
            borderRadius: 6,
            background: "rgba(56,189,248,0.92)",
            color: "#04202e",
            fontFamily: FONT_BODY,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          <CalendarClock size={11} /> {countdown}
        </span>
      )}
      {item.isPremium && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: 6,
            background: "linear-gradient(135deg,#f5c518,#e08a00)",
            color: "#1a1200",
            fontFamily: FONT_BODY,
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          <Crown size={10} /> PREMIUM
        </span>
      )}

      <div style={{ position: "absolute", left: 14, right: 14, bottom: 12 }}>
        <p
          style={{
            margin: 0,
            fontFamily: FONT_DISPLAY,
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title}
        </p>
        <p style={{ margin: "3px 0 0", fontFamily: FONT_BODY, fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>
          {[item.releaseDate && `Khởi chiếu ${fmtDate(item.releaseDate)}`, item.genres?.[0]?.name ?? item.genres?.[0]]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
}

export default function UpcomingSection({ items = [], title = "Sắp Chiếu" }) {
  const isMobile = useIsMobile();
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const check = () => {
      if (!el) return;
      setCanLeft(el.scrollLeft > 8);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    check();
    el?.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el?.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [items]);

  if (!items.length) return null;

  const scroll = (dir) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.72, behavior: "smooth" });

  const arrow = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 70,
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.9)",
    border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    color: C.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: isMobile ? 15 : 20,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            borderLeft: `2.5px solid ${ACCENT}`,
            paddingLeft: 11,
            margin: 0,
          }}
        >
          {title}
        </h2>
        {!isMobile && <SectionBadge icon={CalendarClock} text="Sắp chiếu" color={ACCENT} />}
      </div>

      <div style={{ position: "relative", overflow: "clip" }}>
        {!isMobile && canLeft && (
          <button type="button" aria-label="Cuộn trái" onClick={() => scroll(-1)} style={{ ...arrow, left: 4 }}>
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        )}
        <div
          ref={ref}
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            padding: "8px 2px 12px",
          }}
        >
          {items.map((item) => (
            <UpcomingCard key={`${item.isTvShow ? "tv" : "mv"}-${item.id}`} item={item} isMobile={isMobile} />
          ))}
        </div>
        {!isMobile && canRight && (
          <button type="button" aria-label="Cuộn phải" onClick={() => scroll(1)} style={{ ...arrow, right: 4 }}>
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        )}
      </div>
    </section>
  );
}
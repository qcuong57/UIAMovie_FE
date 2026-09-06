// src/components/home/coming-soon/ComingSoonCarousel.jsx
// Carousel dùng chung cơ chế scroll/arrow/mask với MovieRow.jsx để đồng bộ UI —
// không cài thêm carousel library (theo yêu cầu #11).
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { C } from "../../../context/homeTokens";
import ComingSoonCard from "./ComingSoonCard";

export default function ComingSoonCarousel({ items, accentColor }) {
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items]);

  const scroll = (dir) =>
    scrollRef.current?.scrollBy({
      left: dir * scrollRef.current.clientWidth * 0.72,
      behavior: "smooth",
    });

  if (!items.length) return null;

  return (
    <div className="relative group/csrow" style={{ overflow: isMobile ? "hidden" : "clip" }}>
      {!isMobile && canLeft && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Cuộn sang trái"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-[70]
          w-10 h-10 rounded-full flex items-center justify-center
          transition-all duration-150 hover:scale-110 active:scale-95
          opacity-0 group-hover/csrow:opacity-100"
          style={{
            background: "rgba(0,0,0,0.9)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            color: C.text,
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
      )}

      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: isMobile ? 12 : 14,
          paddingTop: isMobile ? 4 : 24,
          paddingBottom: isMobile ? 4 : 24,
          marginTop: isMobile ? 0 : -24,
          marginBottom: isMobile ? 0 : -24,
          overflowX: "auto",
          overflowY: isMobile ? "hidden" : "visible",
          scrollSnapType: isMobile ? "x mandatory" : undefined,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          maskImage: !isMobile
            ? `linear-gradient(to right, ${canLeft ? "transparent" : "black"} 0%, black 6%, black 94%, ${canRight ? "transparent" : "black"} 100%)`
            : undefined,
          WebkitMaskImage: !isMobile
            ? `linear-gradient(to right, ${canLeft ? "transparent" : "black"} 0%, black 6%, black 94%, ${canRight ? "transparent" : "black"} 100%)`
            : undefined,
        }}
      >
        {items.map((item) => (
          <div
            key={`${item.isTvShow ? "tv" : "mv"}-${item.id}`}
            style={{ scrollSnapAlign: isMobile ? "start" : undefined }}
          >
            <ComingSoonCard item={item} accentColor={accentColor} />
          </div>
        ))}
      </div>

      {!isMobile && canRight && (
        <button
          onClick={() => scroll(1)}
          aria-label="Cuộn sang phải"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-[70]
          w-10 h-10 rounded-full flex items-center justify-center
          transition-all duration-150 hover:scale-110 active:scale-95
          opacity-0 group-hover/csrow:opacity-100"
          style={{
            background: "rgba(0,0,0,0.9)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            color: C.text,
          }}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
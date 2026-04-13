// src/components/movie/shared/BackdropCarousel.jsx
// Gồm cả BackdropLightbox (chỉ dùng nội bộ trong carousel)
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { C } from "./movieConstants";
import SectionTitle from "./SectionTitle";

const BackdropLightbox = ({ src, index, total, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onPrev();
      if (e.key === "ArrowRight" && index < total - 1) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, total, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.95)",
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        {/* Counter */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {index + 1} / {total}
        </div>

        {/* Prev */}
        {index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            style={{
              position: "absolute",
              left: 16,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Image */}
        <motion.img
          key={src}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          src={src}
          alt=""
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "90vw",
            maxHeight: "85vh",
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
          }}
        />

        {/* Next */}
        {index < total - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            style={{
              position: "absolute",
              right: 16,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              zIndex: 10,
            }}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ── Backdrop Carousel (public) ────────────────────────────────
const BackdropCarousel = ({ backdrops }) => {
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState(null);

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
  }, [backdrops]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -el.clientWidth : el.clientWidth,
      behavior: "smooth",
    });
  };

  const cardWidth = isMobile ? "calc(80vw - 24px)" : "calc(33.333% - 8px)";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ marginBottom: 48 }}
      >
        <SectionTitle>Hình Ảnh</SectionTitle>

        <div style={{ position: "relative", overflow: "hidden" }}>
          {/* Left fade + button — chỉ desktop */}
          {!isMobile && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 80,
                  background:
                    "linear-gradient(to right, #000 0%, transparent 100%)",
                  zIndex: 10,
                  pointerEvents: "none",
                  opacity: canLeft ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              />
              {canLeft && (
                <button
                  onClick={() => scroll("left")}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 20,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(10,10,12,0.88)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#e8eaf0",
                  }}
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                </button>
              )}
            </>
          )}

          {/* Scroll row */}
          <div
            ref={scrollRef}
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollSnapType: "x mandatory",
              paddingBottom: 4,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {backdrops.map((img, i) => (
              <motion.div
                key={i}
                onClick={() => setLightboxIdx(i)}
                whileHover={isMobile ? {} : { scale: 1.03 }}
                transition={{ duration: 0.22 }}
                style={{
                  flexShrink: 0,
                  width: cardWidth,
                  scrollSnapAlign: "start",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1px solid ${C.border}`,
                  aspectRatio: "16/9",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <img
                  src={img.url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* Overlay hover */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(0,0,0,0.25)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(0,0,0,0)")
                  }
                />
              </motion.div>
            ))}
          </div>

          {/* Right fade + button — chỉ desktop */}
          {!isMobile && (
            <>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 80,
                  background:
                    "linear-gradient(to left, #000 0%, transparent 100%)",
                  zIndex: 10,
                  pointerEvents: "none",
                  opacity: canRight ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              />
              {canRight && (
                <button
                  onClick={() => scroll("right")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 20,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(10,10,12,0.88)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#e8eaf0",
                  }}
                >
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <BackdropLightbox
          src={backdrops[lightboxIdx].url}
          index={lightboxIdx}
          total={backdrops.length}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((i) => i - 1)}
          onNext={() => setLightboxIdx((i) => i + 1)}
        />
      )}
    </>
  );
};

export default BackdropCarousel;

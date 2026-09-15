// src/components/technology/TechnologyMarquee.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Premium cinematic infinite technology logo marquee.
// Replaces the old card-grid Technology section with an editorial,
// "moving credits" style showcase.
//
// NOTE: adjust the relative import below if you place this file somewhere
// other than src/components/technology/.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useInView,
} from "framer-motion";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";

const EASE = [0.16, 1, 0.3, 1];

// ─────────────────────────────────────────────────────────────────────────────
// Data — reuses the project's existing technologies, unchanged names.
// Logos come from Simple Icons' CDN (reliable, brand-accurate SVGs) so
// nothing renders broken; each is tinted with the brand's own hex and then
// desaturated via CSS, so hover reveals the real brand color.
// ─────────────────────────────────────────────────────────────────────────────
export const technologies = [
  { name: "React", slug: "react", color: "61DAFB" },
  { name: "Framer Motion", slug: "framer", color: "0055FF" },
  { name: "ASP.NET Core", slug: "dotnet", color: "512BD4" },
  { name: "TMDB", slug: "themoviedatabase", color: "01B4E4" },
  { name: "Cloudinary", slug: "cloudinary", color: "3448C5" },
  { name: "Redis", slug: "redis", color: "DC382D" },
  { name: "Upstash", slug: "upstash", color: "00E9A3" },
  { name: "Supabase", slug: "supabase", color: "3ECF8E" },
  { name: "Render", slug: "render", color: "46E3B7" },
  { name: "Vercel", slug: "vercel", color: "FFFFFF" },
  { name: "Tailwind CSS", slug: "tailwindcss", color: "06B6D4" },
];

function logoUrl(tech) {
  return `https://cdn.simpleicons.org/${tech.slug}/${tech.color}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Single logo + name unit
// ─────────────────────────────────────────────────────────────────────────────
function LogoItem({ tech }) {
  return (
    <div className="tm-item" role="listitem" aria-label={tech.name}>
      <img
        src={logoUrl(tech)}
        alt={tech.name}
        loading="lazy"
        decoding="async"
        className="tm-logo"
        draggable={false}
        onError={(e) => {
          // graceful fallback if a logo ever fails to load — never show a
          // broken image icon, just fall back to text-only.
          e.currentTarget.style.display = "none";
        }}
      />
      <span className="tm-name">{tech.name}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The infinite marquee row. Uses CSS translateX keyframes (GPU-accelerated,
// no per-frame JS) for the loop itself; the item list is duplicated exactly
// once so the loop is seamless without bloating the DOM further. Runs
// continuously — no hover interaction required.
// ─────────────────────────────────────────────────────────────────────────────
function MarqueeRow({ items, direction = "left", duration = 42 }) {
  const reducedMotion = useReducedMotion();
  const loopItems = [...items, ...items];

  return (
    <div className="tm-row-viewport" role="list" aria-label="Danh sách công nghệ">
      <div
        className={`tm-track${reducedMotion ? " tm-track--static" : ""}`}
        style={{
          animationDirection: direction === "left" ? "normal" : "reverse",
          animationDuration: `${duration}s`,
        }}
      >
        {loopItems.map((tech, i) => (
          <LogoItem tech={tech} key={`${tech.name}-${i}`} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────
export default function TechnologyMarquee({ items = technologies }) {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const baseDuration = isMobile ? 34 : 46;

  const rows = [{ items, direction: "left", duration: baseDuration }];

  return (
    <section ref={sectionRef} className="tm-section" aria-label="Công nghệ sử dụng">
      <style>{TM_STYLES}</style>

      <div className="tm-inner">
        <motion.div
          className="tm-heading"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="tm-eyebrow">CÔNG NGHỆ</p>
          <h2 className="tm-title">Công cụ để phục vụ tác phẩm</h2>
          <p className="tm-subtitle">
            Mỗi công nghệ được chọn vì nó là công cụ tốt nhất cho công việc, không
            phải vì xu hướng hay xu thế.
          </p>
        </motion.div>

        <motion.div
          className="tm-marquee-wrap"
          initial={reducedMotion ? false : { opacity: 0, filter: "blur(6px)" }}
          animate={inView ? { opacity: 1, filter: "blur(0px)" } : {}}
          transition={{ duration: 1, ease: EASE, delay: 0.15 }}
        >
          {rows.map((row, i) => (
            <MarqueeRow
              key={i}
              items={row.items}
              direction={row.direction}
              duration={row.duration}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — plain CSS injected once per mount. Kept self-contained so the
// component stays drop-in reusable, matching the rest of this file's pattern.
// ─────────────────────────────────────────────────────────────────────────────
const TM_STYLES = `
  .tm-section {
    background-color: ${C.bg};
    padding: 140px 0;
    border-bottom: 1px solid ${C.border};
    overflow: hidden;
  }

  .tm-inner {
    max-width: 1400px;
    margin: 0 auto;
  }

  .tm-heading {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 88px;
    padding: 0 24px;
  }

  .tm-eyebrow {
    font-family: ${FONT_BODY};
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: ${C.accent};
    margin: 0;
  }

  .tm-title {
    font-family: ${FONT_DISPLAY};
    font-size: clamp(2.2rem, 5.2vw, 4.2rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.025em;
    color: ${C.text};
    margin: 28px 0 0;
  }

  .tm-subtitle {
    font-family: ${FONT_BODY};
    font-size: 1.05rem;
    line-height: 1.85;
    color: ${C.textSub};
    margin: 32px 0 0;
  }

  .tm-marquee-wrap {
    display: flex;
    flex-direction: column;
  }

  .tm-row-viewport {
    position: relative;
    width: 100%;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0%,
      #000 10%,
      #000 90%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to right,
      transparent 0%,
      #000 10%,
      #000 90%,
      transparent 100%
    );
  }

  .tm-track {
    display: flex;
    align-items: center;
    width: max-content;
    animation-name: tm-scroll;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    transition: animation-duration 0.6s ease;
    will-change: transform;
  }

  .tm-track--static {
    animation: none;
    transform: translateX(0);
  }

  @keyframes tm-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .tm-item {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 0 56px;
    flex-shrink: 0;
  }

  .tm-logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
    filter: grayscale(1) opacity(0.5);
    transition: filter 0.4s ease, transform 0.4s ease;
    user-select: none;
  }

  .tm-item:hover .tm-logo {
    filter: grayscale(0) opacity(1);
    transform: scale(1.08);
  }

  .tm-name {
    font-family: ${FONT_DISPLAY};
    font-size: 1.4rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: ${C.textDim};
    white-space: nowrap;
    transition: color 0.4s ease;
  }

  .tm-item:hover .tm-name {
    color: ${C.text};
  }

  @media (max-width: 900px) {
    .tm-section { padding: 100px 0; }
    .tm-heading { margin-bottom: 64px; }
    .tm-logo { width: 32px; height: 32px; }
    .tm-name { font-size: 1.1rem; }
    .tm-item { padding: 0 36px; gap: 14px; }
  }

  @media (max-width: 560px) {
    .tm-logo { width: 26px; height: 26px; }
    .tm-name { font-size: 0.95rem; }
    .tm-item { padding: 0 22px; gap: 10px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .tm-track {
      animation: none !important;
      transform: translateX(0) !important;
    }
  }
`;
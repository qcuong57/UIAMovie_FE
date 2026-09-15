// src/pages/IntroPage.jsx
// UIAMovie — Premium Cinematic About Us Experience
//
// Cấu trúc: LoadingScreen → SEO → Hero → Our Story → Philosophy → 
// The Experience → Technology → Vision → Creator → Final CTA → Footer
// 
// Tất cả animations tôn trọng prefers-reduced-motion, self-contained
// không phụ thuộc ngoài file để dễ tái sử dụng.

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";

import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from "../context/homeTokens";
import { useIsMobile } from "../hooks/useIsMobile";
import LoadingScreen from "../components/ui/LoadingScreen";
import Technology from "../components/ui/TechnologyMarquee";

// ─────────────────────────────────────────────────────────────────────────────
// SEO Configuration
// ─────────────────────────────────────────────────────────────────────────────
const SEO = {
  title: "Về chúng tôi — UIA Movie | Nền tảng xem phim cao cấp",
  description:
    "Khám phá câu chuyện của UIAMovie — nơi điện ảnh được tôn trọng, công nghệ phục vụ nghệ thuật, và mỗi trải nghiệm là một tác phẩm.",
  url: "https://uiamovie.com/intro",
  image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
};

function useSeo() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = SEO.title;

    const tags = [
      { name: "description", content: SEO.description },
      { property: "og:title", content: SEO.title },
      { property: "og:description", content: SEO.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SEO.url },
      { property: "og:image", content: SEO.image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SEO.title },
      { name: "twitter:description", content: SEO.description },
    ];

    const created = [];
    tags.forEach(({ name, property, content }) => {
      const attr = name ? "name" : "property";
      const key = name || property;
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        created.push(el);
      }
      el.setAttribute("content", content);
    });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", SEO.url);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: SEO.title,
      description: SEO.description,
      url: SEO.url,
      publisher: {
        "@type": "Organization",
        name: "UIA Movie",
      },
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      created.forEach((el) => el.remove());
      ld.remove();
    };
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Assets & Content
// ─────────────────────────────────────────────────────────────────────────────
const ASSETS = {
  hero: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop",
  story: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop",
  philosophy: "https://images.unsplash.com/photo-1518676599649-7c7000e80824?q=80&w=2070&auto=format&fit=crop",
  experience1: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1600&auto=format&fit=crop",
  experience2: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1600&auto=format&fit=crop",
  experience3: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1600&auto=format&fit=crop",
  experience4: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1600&auto=format&fit=crop",
  experience5: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1600&auto=format&fit=crop",
  experience6: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop",
  vision: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop",
};

// ─────────────────────────────────────────────────────────────────────────────
// Typography Styles
// ─────────────────────────────────────────────────────────────────────────────
const textStyles = {
  eyebrow: {
    fontFamily: FONT_BODY,
    fontSize: "0.7rem",
    fontWeight: 800,
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    color: C.accent,
    margin: 0,
  },
  h1: {
    fontFamily: FONT_DISPLAY,
    fontSize: "clamp(2.8rem, 9vw, 7.2rem)",
    fontWeight: 900,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    color: C.text,
    margin: 0,
    paddingBottom: "0.08em",
  },
  h2: {
    fontFamily: FONT_DISPLAY,
    fontSize: "clamp(2.2rem, 5.2vw, 4.2rem)",
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: "-0.025em",
    color: C.text,
    margin: 0,
  },
  h3: {
    fontFamily: FONT_DISPLAY,
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
    fontWeight: 700,
    lineHeight: 1.2,
    color: C.text,
    margin: 0,
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: "1.05rem",
    lineHeight: 1.85,
    color: C.textSub,
    margin: 0,
  },
  bodySmall: {
    fontFamily: FONT_BODY,
    fontSize: "0.95rem",
    lineHeight: 1.75,
    color: C.textSub,
    margin: 0,
  },
};

const EASE = [0.16, 1, 0.3, 1];

// ─────────────────────────────────────────────────────────────────────────────
// Reveal Animation Component
// ─────────────────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 24, style, ...rest }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO — Cinematic Opening with Parallax
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  // ✅ layoutEffect: false — tránh sync layout mỗi frame scroll, mượt hơn
  // khi người dùng vuốt/scroll nhanh trên máy yếu.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
    layoutEffect: false,
  });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        height: "100svh",
        minHeight: 700,
        backgroundColor: C.bg,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Background Image with Parallax */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          scale: reducedMotion ? 1 : bgScale,
          y: reducedMotion ? 0 : bgY,
          willChange: "transform",
        }}
      >
        <img
          src={ASSETS.hero}
          alt="UIA Movie cinematic opening"
          fetchpriority="high"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.3) contrast(1.15) saturate(0.95)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.98) 100%)",
          }}
        />
      </motion.div>

      {/* Navbar spacing */}
      <div style={{ height: 72 }} />

      {/* Hero Content */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE, delay: 0.2 }}
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 24px",
          maxWidth: 900,
          width: "100%",
          textAlign: "center",
          opacity: reducedMotion ? 1 : fade,
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ ...textStyles.eyebrow, marginBottom: 28 }}
        >
          VỀ CHÚNG TÔI
        </motion.p>

        <h1 style={textStyles.h1}>
          <span style={{ color: C.accent }}>UIA</span>
          <span style={{ color: C.text }}>Movie</span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{
            ...textStyles.body,
            maxWidth: 620,
            margin: "32px auto 0",
            fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
          }}
        >
          Điều gì xảy ra khi công nghệ khiêm nhường trước nghệ thuật,
          <br />
          khi mỗi điểm ảnh là một lựa chọn và không phải một tai nạn.
        </motion.p>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{
          position: "relative",
          zIndex: 10,
          paddingBottom: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            fontWeight: 800,
            color: C.textDim,
            textTransform: "uppercase",
          }}
        >
          Cuộn để tiếp tục
        </span>
        <motion.div
          animate={reducedMotion ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 20,
            height: 28,
            border: `1.5px solid ${C.textDim}`,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
          }}
        >
          <div
            style={{
              width: 2,
              height: 4,
              backgroundColor: C.text,
              borderRadius: 1,
            }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OUR STORY — Editorial Layout with Text & Image Interaction
// ─────────────────────────────────────────────────────────────────────────────
function OurStory() {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 60%", "end 40%"],
    layoutEffect: false,
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        backgroundColor: C.bg,
        padding: "120px 24px",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 80,
          alignItems: "center",
        }}
      >
        {/* Text Content */}
        <div>
          <Reveal>
            <p style={textStyles.eyebrow}>CÂU CHUYỆN CỦA CHÚNG TÔI</p>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 style={{ ...textStyles.h2, marginTop: 28 }}>
              Từ một ý tưởng đến một trải nghiệm
            </h2>
          </Reveal>

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 24 }}>
            <Reveal delay={0.16}>
              <p style={textStyles.body}>
                UIA Movie bắt đầu từ một câu hỏi đơn giản: tại sao trải nghiệm xem phim trực tuyến lại
                luôn có vẻ như một lựa chọn giữa <em>tiện lợi</em> và <em>chất lượng</em>?
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <p style={textStyles.body}>
                Chúng tôi tin rằng nó không nên vậy. Công nghệ hiện đại đủ mạnh mẽ để phục vụ
                nghệ thuật một cách không thỏa hiệp — không phải là quá mức hay thiếu sót, mà là
                công cụ tinh tế, vô hình, luôn sẵn sàng nhưng không bao giờ là tâm điểm.
              </p>
            </Reveal>

            <Reveal delay={0.32}>
              <p style={textStyles.body}>
                Mỗi bộ phim, bộ series được đưa lên UIA Movie là kết quả của một quyết định chủ động.
                Chúng tôi chọn chiều sâu thay vì chiều rộng, và luôn luôn đặt tác phẩm trước tiên.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Image with Parallax */}
        <Reveal delay={0.08}>
          <motion.div
            style={{
              position: "relative",
              y: reducedMotion ? 0 : imageY,
              willChange: "transform",
            }}
          >
            <div
              style={{
                position: "relative",
                aspectRatio: "3 / 4",
                overflow: "hidden",
                borderRadius: 4,
                border: `1px solid ${C.borderMid}`,
                backgroundColor: C.surface,
              }}
            >
              <img
                src={ASSETS.story}
                alt="UIAMovie story"
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "contrast(1.08) brightness(0.92)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)",
                }}
              />
            </div>
          </motion.div>
        </Reveal>
      </div>

      {/* Responsive Grid for Mobile */}
      <style>{`
        @media (max-width: 900px) {
          section > div {
            display: flex !important;
            flex-direction: column !important;
            gap: 60px !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHILOSOPHY — Six Core Principles (Balanced Grid)
// ─────────────────────────────────────────────────────────────────────────────
function Philosophy() {
  const principles = [
    {
      number: "01",
      title: "Tuyển chọn, không tích trữ",
      description:
        "Mỗi tác phẩm được lựa chọn vì nó đem lại giá trị thực. Chúng tôi ưu tiên chiều sâu thị giác và ý niệm nghệ thuật.",
    },
    {
      number: "02",
      title: "Liên tục, không đứt đoạn",
      description:
        "Quay lại chính xác từng phân cảnh, giữ nguyên màu sắc và âm thanh chuẩn phòng thu trên mọi thiết bị.",
    },
    {
      number: "03",
      title: "Khám phá, không thuật toán",
      description:
        "Giao diện được thiết kế để bạn khám phá thay vì bị thuật toán đề xuất. Mỗi lựa chọn là của bạn.",
    },
    {
      number: "04",
      title: "Tiêu chuẩn rạp chiếu, ở nhà",
      description:
        "Không nén chi tiết — trải nghiệm dải màu trung thực và âm thanh sắc nét như tại phòng dựng.",
    },
    {
      number: "05",
      title: "Người dùng trước, dữ liệu sau",
      description:
        "Không theo dõi hành vi quá mức. Bạn sở hữu lịch sử xem của mình, và chúng tôi tôn trọng quyền riêng tư.",
    },
    {
      number: "06",
      title: "Công nghệ vô hình",
      description:
        "Công cụ tốt nhất là những công cụ bạn không nhận ra tồn tại. Mọi thứ hoạt động tự nhiên và mượt mà.",
    },
  ];

  return (
    <section
      style={{
        backgroundColor: C.bg,
        padding: "120px 24px",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal style={{ marginBottom: 60 }}>
          <p style={textStyles.eyebrow}>NỀN TẢNG CỦA CHÚNG TÔI</p>
          <h2 style={{ ...textStyles.h2, marginTop: 28 }}>Sáu nguyên tắc cốt lõi</h2>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 56,
          }}
        >
          {principles.map((principle, i) => (
            <Reveal key={principle.number} delay={i * 0.08}>
              <article
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  paddingBottom: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: "2.8rem",
                    fontWeight: 800,
                    color: C.accent,
                    lineHeight: 1,
                  }}
                >
                  {principle.number}
                </div>
                <h3 style={{ ...textStyles.h3, marginTop: 0 }}>
                  {principle.title}
                </h3>
                <p style={{ ...textStyles.bodySmall, color: C.textSub }}>
                  {principle.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THE EXPERIENCE — Key Features with Imagery
// ─────────────────────────────────────────────────────────────────────────────
function TheExperience() {
  const experiences = [
    {
      number: "01",
      title: "Trang chủ Điện Ảnh",
      description: "Mỗi lần ghé thăm là một khám phá được curated riêng.",
      image: ASSETS.experience1,
    },
    {
      number: "02",
      title: "Tiếp tục Hành Trình",
      description: "Quay lại chính xác từ nơi bạn dừng lại, trên mọi thiết bị.",
      image: ASSETS.experience2,
    },
    {
      number: "03",
      title: "Vũ Trụ Điện Ảnh",
      description: "Duyệt qua các thập niên, thể loại, và những tác giả vĩ đại.",
      image: ASSETS.experience3,
    },
    {
      number: "04",
      title: "Đánh Giá & Trailers",
      description: "Phê bình để hiểu rõ hơn, trailers để khát vọng.",
      image: ASSETS.experience4,
    },
    {
      number: "05",
      title: "Bộ Sưu Tập Cá Nhân",
      description: "Tổ chức phim của bạn thành danh sách, thẻ và bộ sưu tập riêng.",
      image: ASSETS.experience5,
    },
    {
      number: "06",
      title: "Tương Tác Xã Hội",
      description: "Chia sẻ đánh giá, yêu thích phim và kết nối với những người yêu phim khác.",
      image: ASSETS.experience6,
    },
  ];

  return (
    <section
      style={{
        backgroundColor: C.bg,
        padding: "120px 24px",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal style={{ marginBottom: 60 }}>
          <p style={textStyles.eyebrow}>TRẢI NGHIỆM</p>
          <h2 style={{ ...textStyles.h2, marginTop: 28 }}>
            Những điều làm nên <span style={{ color: C.accent }}>UIA</span> Movie
          </h2>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 40,
          }}
        >
          {experiences.map((exp, i) => (
            <Reveal key={exp.number} delay={i * 0.08}>
              <article
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  gap: 24,
                }}
              >
                {/* Image */}
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "16 / 10",
                    overflow: "hidden",
                    borderRadius: 3,
                    border: `1px solid ${C.borderMid}`,
                    backgroundColor: C.surface,
                  }}
                >
                  <img
                    src={exp.image}
                    alt={exp.title}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                {/* Content */}
                <div>
                  <p
                    style={{
                      ...textStyles.eyebrow,
                      marginBottom: 12,
                      fontSize: "0.65rem",
                    }}
                  >
                    {exp.number}
                  </p>
                  <h3 style={textStyles.h3}>{exp.title}</h3>
                  <p
                    style={{
                      ...textStyles.bodySmall,
                      marginTop: 12,
                      color: C.textSub,
                    }}
                  >
                    {exp.description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TECHNOLOGY — The Craft Behind (Tinh tế, không Documentation)
// ─────────────────────────────────────────────────────────────────────────────
// Technology section is now the cinematic infinite marquee — see
// src/components/technology/TechnologyMarquee.jsx (imported above as
// `Technology` for a drop-in replacement with zero other changes below).

// ─────────────────────────────────────────────────────────────────────────────
// VISION — Cinematic, Minimal, Emotional
// ─────────────────────────────────────────────────────────────────────────────
function Vision() {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 60%", "end 40%"],
    layoutEffect: false,
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.9]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        backgroundColor: C.bg,
        minHeight: "80vh",
        padding: "100px 24px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          zIndex: 0,
        }}
      >
        <img
          src={ASSETS.vision}
          alt="Vision"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "grayscale(100%)",
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 800,
          textAlign: "center",
          opacity: reducedMotion ? 1 : opacity,
          scale: reducedMotion ? 1 : scale,
        }}
      >
        <Reveal>
          <p style={textStyles.eyebrow}>TẦM NHÌN</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 style={{ ...textStyles.h2, marginTop: 28 }}>
            Một nơi để phim ảnh được tôn trọng như công dân đầu tiên
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <p
            style={{
              ...textStyles.body,
              maxWidth: 700,
              margin: "36px auto 0",
              fontSize: "1.1rem",
              color: C.textSub,
              fontStyle: "italic",
            }}
          >
            Chúng tôi nằm mơ về một thế giới nơi trải nghiệm kỹ thuật số
            của phim ảnh bằng — nếu không muốn nói là vượt trội — trải nghiệm
            rạp chiếu. Nơi bạn cảm nhận từng nhịp, từng màu sắc, từng âm thanh
            một cách toàn vẹn.
          </p>
        </Reveal>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATOR — Optional: Team/Creator Intro (Simple, Elegant)
// ─────────────────────────────────────────────────────────────────────────────
function Creator() {
  return (
    <section
      style={{
        backgroundColor: C.bg,
        padding: "100px 24px",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Reveal>
          <p style={textStyles.eyebrow}>NGƯỜI TẠO LẬP</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 style={{ ...textStyles.h2, marginTop: 28 }}>Được xây dựng bởi những người yêu phim</h2>
        </Reveal>

        <Reveal delay={0.16}>
          <p style={{ ...textStyles.body, maxWidth: 600, margin: "32px auto 0" }}>
            UIA Movie không phải sản phẩm của một công ty lớn hay một thuật toán.
            Nó là kết quả của những lựa chọn có chủ ý của người làm, những người
            tin rằng phim ảnh xứng đáng được yêu quý.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <p style={{ ...textStyles.bodySmall, maxWidth: 600, margin: "28px auto 0", color: C.textDim }}>
            Mỗi tính năng, mỗi chi tiết, mỗi lựa chọn toàn thể là kết quả
            của tình yêu và sự chăm sóc. Chúng tôi vẫn đang xây dựng và sẽ mãi
            mãi tiếp tục.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL CTA — Cinematic Movie Ending
// ─────────────────────────────────────────────────────────────────────────────
function FinalCTA({ onEnter, onPremium }) {
  const reducedMotion = useReducedMotion();

  return (
    <section
      style={{
        position: "relative",
        backgroundColor: C.bg,
        padding: "120px 24px",
        overflow: "hidden",
      }}
    >
      {/* Subtle background overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          background: `radial-gradient(circle at center, ${C.accent} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 700,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Reveal>
          <p style={textStyles.eyebrow}>BẮT ĐẦU TÌM KIẾM</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 style={{ ...textStyles.h2, marginTop: 28 }}>
            Câu chuyện tiếp theo đang chờ đón.
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <p style={{ ...textStyles.body, maxWidth: 600, margin: "32px auto 0" }}>
            Cánh cửa phòng chiếu đã sẵn sàng mở ra. Khám phá kho phim chất lượng cao
            và trải nghiệm những góc nhìn nghệ thuật nguyên bản.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div
            style={{
              marginTop: 52,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <motion.button
              onClick={onEnter}
              whileHover={
                reducedMotion
                  ? {}
                  : { scale: 1.02, backgroundColor: C.accent }
              }
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              style={{
                padding: "16px 48px",
                fontFamily: FONT_BODY,
                fontSize: "0.9rem",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                backgroundColor: C.text,
                color: C.bg,
                border: "none",
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              ▶ Khám Phá Kho Phim
            </motion.button>

            <motion.button
              onClick={onPremium}
              whileHover={
                reducedMotion
                  ? {}
                  : { color: C.accent, borderColor: C.accent }
              }
              style={{
                padding: "16px 36px",
                fontFamily: FONT_BODY,
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                backgroundColor: "transparent",
                color: C.textDim,
                border: `1px solid ${C.borderMid}`,
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Gói Premium
            </motion.button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER — Using Custom Footer Design
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '40px 24px 32px',
        marginTop: 40,
        background: '#000',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Logo + tagline */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <p style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22, fontWeight: 900, letterSpacing: '0.06em',
            color: '#fff', marginBottom: 6, margin: 0,
          }}>
            <span style={{ color: '#e5181e', fontSize: 30 }}>UIA</span> MOVIE
          </p>
          <p style={{
            fontFamily: FONT_BODY,
            fontSize: 12, color: 'rgba(255,255,255,0.3)',
            marginTop: 6,
          }}>
            Xem phim hay, mọi lúc mọi nơi
          </p>
        </div>

        {/* Contact */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 20, flexWrap: 'wrap', marginBottom: 28,
        }}>
          {/* Facebook */}
          <a
            href="https://www.facebook.com/gnoucdasick/"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              fontFamily: FONT_BODY,
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(24,119,242,0.12)';
              e.currentTarget.style.borderColor = 'rgba(24,119,242,0.4)';
              e.currentTarget.style.color = '#4e9af1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            {/* Facebook icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
            Facebook
          </a>

          {/* Gmail */}
          <a
            href="mailto:quoccuong572003@gmail.com"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              fontFamily: FONT_BODY,
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(234,67,53,0.1)';
              e.currentTarget.style.borderColor = 'rgba(234,67,53,0.35)';
              e.currentTarget.style.color = '#ea4335';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            {/* Gmail icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            quoccuong572003@gmail.com
          </a>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

        {/* Copyright */}
        <p style={{
          textAlign: 'center',
          fontFamily: FONT_BODY,
          fontSize: 11, color: 'rgba(255,255,255,0.2)',
          margin: 0,
        }}>
          © {year} UIA Movie. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function IntroPage() {
  const navigate = useNavigate();
  // Chỉ hiện LoadingScreen ở lần đầu vào trang trong phiên (session),
  // tránh cảm giác "reload cả trang" mỗi khi quay lại /intro.
  const [loaded, setLoaded] = useState(
    () => sessionStorage.getItem("uia_intro_seen") === "1"
  );
  useSeo();

  const handleEnter = () => navigate("/");
  const handlePremium = () => navigate("/premium");

  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => {
      setLoaded(true);
      sessionStorage.setItem("uia_intro_seen", "1");
    }, 1400);
    return () => clearTimeout(timer);
  }, [loaded]);

  // Lock scroll during loading
  useEffect(() => {
    if (loaded) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [loaded]);

  return (
    <div
      style={{
        backgroundColor: C.bg,
        color: C.text,
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <style>{GOOGLE_FONTS}</style>
      <style>{`
        html {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          scroll-behavior: smooth;
        }
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
      `}</style>

      <AnimatePresence>{!loaded && <LoadingScreen key="loading" />}</AnimatePresence>

      <main>
        <Hero />
        <OurStory />
        <Philosophy />
        <TheExperience />
        <Technology />
        <Vision />
        <Creator />
        <FinalCTA onEnter={handleEnter} onPremium={handlePremium} />
      </main>

      <Footer />
    </div>
  );
}
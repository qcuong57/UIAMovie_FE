// src/pages/user/AnnouncementsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowLeft,
  Calendar,
  Share2,
  Check,
  Megaphone,
} from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from "../../context/homeTokens";
import LoadingScreen from "../../components/ui/LoadingScreen";
import notificationService from "../../services/notificationService";
import Footer from "../../components/layout/Footer";
import SeoMeta from "../../components/common/SeoMeta";

// ── Định dạng ngày tháng tiếng Việt nhẹ nhàng ──────────────────────────────────
function formatDateVi(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day} Th${month}, ${year}`;
}

function formatFullDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Trình dựng Markdown Typography chuẩn báo chí ──────────────────────────────
function ArticleMarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let currentList = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (currentList) {
        elements.push(currentList);
        currentList = null;
      }
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (currentList) { elements.push(currentList); currentList = null; }
      elements.push({ type: "h2", text: trimmed.replace(/^##\s+/, "") });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      if (currentList) { elements.push(currentList); currentList = null; }
      elements.push({ type: "h3", text: trimmed.replace(/^###\s+/, "") });
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!currentList || currentList.type !== "ol") {
        if (currentList) elements.push(currentList);
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numMatch[2]);
      continue;
    }

    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (!currentList || currentList.type !== "ul") {
        if (currentList) elements.push(currentList);
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(trimmed.replace(/^[\*\-]\s+/, ""));
      continue;
    }

    if (currentList) {
      elements.push(currentList);
      currentList = null;
    }
    elements.push({ type: "p", text: trimmed });
  }

  if (currentList) elements.push(currentList);

  const parseInline = (text) => {
    if (!text) return "";
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} style={{ color: "#ffffff", fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontSize: "1.02rem",
        lineHeight: 1.85,
        color: "#c2c2c7",
        letterSpacing: "0.01em",
      }}
    >
      {elements.map((block, idx) => {
        if (block.type === "h2") {
          return (
            <h2
              key={idx}
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                marginTop: 44,
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {parseInline(block.text)}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3
              key={idx}
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#e4e4e7",
                marginTop: 30,
                marginBottom: 12,
              }}
            >
              {parseInline(block.text)}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul
              key={idx}
              style={{
                paddingLeft: 22,
                margin: "18px 0",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {block.items.map((it, i) => (
                <li key={i} style={{ color: "#a1a1aa", lineHeight: 1.8 }}>
                  {parseInline(it)}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol
              key={idx}
              style={{
                paddingLeft: 22,
                margin: "18px 0",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {block.items.map((it, i) => (
                <li key={i} style={{ color: "#a1a1aa", lineHeight: 1.8 }}>
                  {parseInline(it)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} style={{ margin: "0 0 18px 0" }}>
            {parseInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ══════════════════════════════════════════════════════════════════════════════
export default function AnnouncementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [copied, setCopied] = useState(false);

  // ── Màn hình LoadingScreen đồng bộ như AboutUs ──
  const [loaded, setLoaded] = useState(
    () => sessionStorage.getItem("uia_announcements_seen") === "1"
  );

  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => {
      setLoaded(true);
      sessionStorage.setItem("uia_announcements_seen", "1");
    }, 1200);
    return () => clearTimeout(timer);
  }, [loaded]);

  // Khóa cuộn trang khi đang hiển thị Loading
  useEffect(() => {
    if (loaded) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [loaded]);

  const detailId = searchParams.get("id");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getPublicAnnouncements(1, 100);
      const rawData = res?.data?.data ?? res?.data ?? res;
      const list = rawData?.items ?? rawData?.Items ?? (Array.isArray(rawData) ? rawData : []);
      setAnnouncements(list);
    } catch (err) {
      console.error("[AnnouncementsPage] Tải tin tức thất bại:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [detailId]);

  const activeArticle = useMemo(() => {
    if (!detailId) return null;
    return announcements.find((item) => String(item.id) === String(detailId)) || null;
  }, [detailId, announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.message?.toLowerCase().includes(search.toLowerCase());

      if (filterType === "maintenance") {
        return matchSearch && /bảo trì|máy chủ|nâng cấp/i.test(item.title);
      }
      if (filterType === "notice") {
        return matchSearch && !/bảo trì|máy chủ|nâng cấp/i.test(item.title);
      }
      return matchSearch;
    });
  }, [announcements, search, filterType]);

  const handleOpenArticle = (id) => {
    setSearchParams({ id });
  };

  const handleBack = () => {
    setSearchParams({});
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{GOOGLE_FONTS}</style>
      <style>{`
        html, body {
          background-color: ${C.bg} !important;
          color: ${C.text};
          font-family: ${FONT_BODY};
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }
        .announcement-card:hover .announcement-title {
          color: #ffffff !important;
        }
      `}</style>

      {/* Màn hình Loading Screen điện ảnh chuyển cảnh */}
      <AnimatePresence>{!loaded && <LoadingScreen key="loading" />}</AnimatePresence>

      <SeoMeta
        title={
          activeArticle
            ? `${activeArticle.title} — Bản tin UIA Movie`
            : "Bản tin & Thông báo vận hành — UIA Movie"
        }
        description="Trung tâm phát ngôn và thông báo chính thức từ ban quản trị UIA Movie."
      />

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: C.bg,
          color: C.text,
          display: "flex",
          flexDirection: "column",
          paddingTop: 84, // Trừ hao khoảng cách Navbar mượt mà, không hở
        }}
      >
        {/* =========================================================================
            1. CHẾ ĐỘ XEM CHI TIẾT BÀI VIẾT (DETAIL VIEW)
        ========================================================================== */}
        {activeArticle ? (
          <main style={{ flex: 1, paddingBottom: 100 }}>
            <article style={{ maxWidth: 920, margin: "0 auto", padding: "20px 24px 0" }}>
              
              {/* Nút Quay lại & Chia sẻ bo góc mềm mại */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 28,
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 18px",
                    borderRadius: 10,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${C.borderMid}`,
                    color: C.textSub,
                    fontFamily: FONT_BODY,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = C.textSub;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <ArrowLeft size={15} /> Quay lại danh sách
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 10,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${C.borderMid}`,
                    color: copied ? C.green : C.textSub,
                    fontFamily: FONT_BODY,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                  {copied ? "Đã sao chép" : "Chia sẻ"}
                </button>
              </div>

              <p
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: C.accent,
                  margin: "0 0 12px 0",
                }}
              >
                THÔNG BÁO CHÍNH THỨC
              </p>

              <h1
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "clamp(1.9rem, 3.8vw, 2.7rem)",
                  fontWeight: 800,
                  lineHeight: 1.28,
                  letterSpacing: "-0.025em",
                  color: C.text,
                  margin: "0 0 16px 0",
                }}
              >
                {activeArticle.title}
              </h1>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontFamily: FONT_BODY,
                  fontSize: "0.85rem",
                  color: C.textDim,
                  paddingBottom: 24,
                  borderBottom: `1px solid ${C.border}`,
                  marginBottom: 36,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={14} /> {formatFullDate(activeArticle.createdAt)}
                </span>
                <span>•</span>
                <span>Ban Quản Trị UIA Movie</span>
              </div>

              {activeArticle.thumbnailUrl && (
                <div
                  style={{
                    marginBottom: 40,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${C.borderMid}`,
                    backgroundColor: C.surface,
                  }}
                >
                  <img
                    src={activeArticle.thumbnailUrl}
                    alt={activeArticle.title}
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: 520,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              )}

              <ArticleMarkdownRenderer content={activeArticle.message} />

              <div
                style={{
                  marginTop: 64,
                  paddingTop: 32,
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    padding: "12px 30px",
                    borderRadius: 12,
                    fontFamily: FONT_BODY,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: C.textSub,
                    border: `1px solid ${C.borderMid}`,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = C.textSub;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <ArrowLeft size={15} /> Quay lại danh sách bản tin
                </button>
              </div>
            </article>
          </main>
        ) : (
          /* =========================================================================
              2. CHẾ ĐỘ DANH SÁCH BẢN TIN (LIST VIEW)
          ========================================================================== */
          <main style={{ flex: 1, paddingBottom: 100 }}>
            <section
              style={{
                backgroundColor: C.bg,
                padding: "24px 24px 36px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ maxWidth: 1040, margin: "0 auto" }}>
                <p
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: C.accent,
                    margin: "0 0 10px 0",
                  }}
                >
                  TRUNG TÂM PHÁT NGÔN
                </p>

                <h1
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    letterSpacing: "-0.03em",
                    color: C.text,
                    margin: "0 0 14px 0",
                  }}
                >
                  Bản Tin & Vận Hành
                </h1>

                <p
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: "1.02rem",
                    lineHeight: 1.7,
                    color: C.textSub,
                    margin: 0,
                    maxWidth: 680,
                  }}
                >
                  Thông tin chính thức về tiến trình bảo trì hạ tầng, cập nhật tính năng
                  và các thông cáo vận hành từ đội ngũ UIA Movie.
                </p>
              </div>
            </section>

            <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 24px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  paddingBottom: 24,
                  borderBottom: `1px solid ${C.border}`,
                  marginBottom: 28,
                }}
              >
                {/* Tabs bo góc mềm mại */}
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "notice", label: "Thông báo" },
                    { id: "maintenance", label: "Lịch bảo trì" },
                  ].map((tab) => {
                    const active = filterType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterType(tab.id)}
                        style={{
                          height: 38,
                          padding: "0 18px",
                          fontFamily: FONT_BODY,
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                          borderRadius: 10,
                          border: `1px solid ${active ? C.text : C.borderMid}`,
                          backgroundColor: active ? C.text : "rgba(255, 255, 255, 0.04)",
                          color: active ? C.bg : C.textSub,
                          cursor: "pointer",
                          transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                            e.currentTarget.style.color = C.textSub;
                          }
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Ô tìm kiếm mềm mại */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: C.surface,
                    border: `1px solid ${C.borderMid}`,
                    borderRadius: 10,
                    height: 38,
                    padding: "0 14px",
                    width: 280,
                    transition: "border-color 0.2s",
                  }}
                  onFocusCapture={(e) => (e.currentTarget.style.borderColor = C.borderBright)}
                  onBlurCapture={(e) => (e.currentTarget.style.borderColor = C.borderMid)}
                >
                  <Search size={14} color={C.textDim} />
                  <input
                    type="text"
                    placeholder="Tìm tiêu đề hoặc nội dung..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: C.text,
                      fontFamily: FONT_BODY,
                      fontSize: "0.85rem",
                      width: "100%",
                    }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      style={{
                        background: "none",
                        border: "none",
                        color: C.textDim,
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách bài viết bo viền mềm */}
              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px 0",
                    color: C.textDim,
                    fontFamily: FONT_BODY,
                    fontSize: "0.95rem",
                  }}
                >
                  Đang đồng bộ dữ liệu bản tin...
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px 24px",
                    backgroundColor: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: C.text,
                      margin: "0 0 8px 0",
                    }}
                  >
                    Không tìm thấy bài viết
                  </p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: "0.9rem", color: C.textDim, margin: 0 }}>
                    Hiện tại chưa có thông báo nào phù hợp với điều kiện tìm kiếm của bạn.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {filteredAnnouncements.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenArticle(item.id)}
                      className="announcement-card"
                      style={{
                        display: "flex",
                        backgroundColor: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 12,
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.borderBright;
                        e.currentTarget.style.backgroundColor = C.surfaceMid;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.backgroundColor = C.surface;
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          width: 220,
                          minWidth: 220,
                          height: 128,
                          backgroundColor: "#050505",
                          position: "relative",
                          borderRight: `1px solid ${C.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <div style={{ textAlign: "center", color: C.textDim }}>
                            <Megaphone size={22} style={{ marginBottom: 4 }} />
                            <div
                              style={{
                                fontSize: "0.65rem",
                                fontFamily: FONT_BODY,
                                fontWeight: 800,
                                letterSpacing: "0.15em",
                              }}
                            >
                              UIA MOVIE
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          flex: 1,
                          padding: "18px 24px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: FONT_BODY,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            color: C.accent,
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}
                        >
                          {formatDateVi(item.createdAt)}
                        </div>

                        <h2
                          className="announcement-title"
                          style={{
                            fontFamily: FONT_DISPLAY,
                            fontSize: "1.08rem",
                            fontWeight: 700,
                            color: C.text,
                            margin: "0 0 8px 0",
                            lineHeight: 1.38,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            transition: "color 0.18s",
                          }}
                        >
                          {item.title}
                        </h2>

                        <p
                          style={{
                            fontFamily: FONT_BODY,
                            fontSize: "0.88rem",
                            color: C.textSub,
                            margin: 0,
                            lineHeight: 1.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.message?.replace(/[#*]/g, "")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        <Footer />
      </div>

      <style>{`
        @media (max-width: 680px) {
          .announcement-card {
            flex-direction: column !important;
          }
          .announcement-card > div:first-child {
            width: 100% !important;
            height: 160px !important;
            border-right: none !important;
            border-bottom: 1px solid ${C.border} !important;
          }
        }
      `}</style>
    </>
  );
}
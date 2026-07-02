// src/components/shared/AdOverlay.jsx
//
// Kiến trúc: SINGLE-VIDEO. Ad chạy trực tiếp trên videoRef của player —
// useAdManager swap src + gắn toàn bộ listener (timeupdate, ended) lên
// chính videoRef đó. AdOverlay chỉ render UI overlay thuần, không có
// <video> riêng và không cần biết gì về việc phát video.
//
// Thiết kế: tối giản, hiện đại — không gradient, không backdrop-blur
// nặng nề, không viền/bóng dư thừa. Lấy cảm hứng từ YouTube/Netflix:
// chữ rõ ràng, khối phẳng, đối lập màu cao, chỉ 1 điểm nhấn vàng duy
// nhất (progress + thương hiệu) để mắt người xem có nơi tập trung.
//
// Layout:
//   TOP-LEFT    : nhãn "Quảng cáo" + giây còn lại
//   TOP-RIGHT   : link "Nâng cấp"
//   BOTTOM-LEFT : thẻ thương hiệu (logo + tên + domain) — click → mở link QC
//   BOTTOM-RIGHT: nút skip / đếm ngược / không thể bỏ qua
//   BOTTOM      : progress bar mảnh, màu vàng
//
// Usage:
//   <AdOverlay adManager={adManager} showControls={show} />

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward, Lock } from "lucide-react";

const ACCENT = "#FFC107";

const AdOverlay = ({ adManager, showControls = false }) => {
  const {
    currentAd,
    adTimeLeft,
    adSkippable,
    adSkipCountdown,
    skipAd,
  } = adManager;

  // Chiều cao thanh điều khiển player — để các khối nổi dịch lên đúng vị trí
  // khi controls đang hiện, tránh đè lên nhau.
  const CONTROLS_H = 64;
  const floatBottom = showControls ? CONTROLS_H + 12 : 18;

  if (!currentAd) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="ad-ui"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        {/* Top-left: nhãn ad + giây còn lại */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              background: "#000",
              color: "#fff",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.04em",
              padding: "4px 8px",
              borderRadius: 3,
            }}
          >
            Quảng cáo
          </span>
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              color: "rgba(255,255,255,0.65)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {adTimeLeft}s
          </span>
        </div>

        {/* Top-right: link nâng cấp */}
        <a
          href="/upgrade"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "absolute",
            top: 16,
            right: 14,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "'Nunito', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
            textDecoration: "none",
            pointerEvents: "all",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
          }
        >
          <Lock size={11} />
          Bỏ quảng cáo
        </a>

        {/* Bottom-left: thẻ thương hiệu */}
        {(currentAd.advertiserName || currentAd.clickThroughUrl) && (
          <motion.div
            animate={{ bottom: floatBottom }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: 14,
              pointerEvents: "all",
            }}
          >
            <a
              href={currentAd.clickThroughUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                textDecoration: "none",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 4,
                padding: "6px 12px 6px 6px",
                maxWidth: 260,
              }}
            >
              {currentAd.advertiserLogoUrl ? (
                <img
                  src={currentAd.advertiserLogoUrl}
                  alt=""
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 3,
                    objectFit: "cover",
                    flexShrink: 0,
                    background: "#fff",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 3,
                    background: ACCENT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                {currentAd.advertiserName && (
                  <span
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 180,
                    }}
                  >
                    {currentAd.advertiserName}
                  </span>
                )}
                {currentAd.clickThroughUrl && (
                  <span
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 180,
                    }}
                  >
                    {(() => {
                      try {
                        return new URL(currentAd.clickThroughUrl).hostname.replace(
                          "www.",
                          "",
                        );
                      } catch {
                        return currentAd.clickThroughUrl;
                      }
                    })()}
                  </span>
                )}
              </div>
            </a>
          </motion.div>
        )}

        {/* Bottom-right: skip / countdown / non-skippable */}
        <motion.div
          animate={{ bottom: floatBottom }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{
            position: "absolute",
            right: 14,
            pointerEvents: "all",
          }}
        >
          {currentAd.skipAfterSeconds != null ? (
            adSkippable ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  skipAd();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 14px",
                  border: "none",
                  borderRadius: 3,
                  background: "#fff",
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#000",
                }}
              >
                Bỏ qua
                <SkipForward size={14} color="#000" strokeWidth={2.5} />
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 14px",
                  borderRadius: 3,
                  background: "rgba(0,0,0,0.7)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  Bỏ qua sau
                </span>
                <span
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    color: ACCENT,
                    minWidth: 14,
                    textAlign: "center",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {adSkipCountdown}
                </span>
              </div>
            )
          ) : (
            <div
              style={{
                padding: "9px 14px",
                borderRadius: 3,
                background: "rgba(0,0,0,0.7)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Không thể bỏ qua
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdOverlay;
// src/components/shared/AdOverlay.jsx
//
// Kiến trúc: SINGLE-VIDEO. Ad chạy trực tiếp trên videoRef của player —
// useAdManager swap src + gắn toàn bộ listener (timeupdate, ended) lên
// chính videoRef đó. AdOverlay chỉ render UI overlay thuần, không có
// <video> riêng và không cần biết gì về việc phát video.
//
// Thiết kế: Netflix thật — phẳng tuyệt đối. Không glass, không backdrop-blur,
// không gradient, không glow, không đổi màu khi hover, không accent màu mè.
// Chỉ đen/trắng/xám theo đúng thang độ mờ mà Netflix dùng cho overlay UI
// (nhãn, nút, chip). Font hệ thống — không dùng font tròn kiểu bo góc dễ
// nhận ra là "AI-made". Chuyển động chỉ có fade nhẹ, không easing phô trương.
//
// Layout:
//   TOP-LEFT    : nhãn "Quảng cáo" + giây còn lại
//   TOP-RIGHT   : link "Bỏ quảng cáo"
//   BOTTOM-LEFT : thẻ thương hiệu (logo + tên + domain) — click → mở link QC
//   BOTTOM-RIGHT: nút skip / đếm ngược / không thể bỏ qua
//
// Usage:
//   <AdOverlay adManager={adManager} showControls={show} />

import React from "react";
import { SkipForward, Lock } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const SCRIM = "rgba(0,0,0,0.75)";
const HAIRLINE = "1px solid rgba(255,255,255,0.14)";
const TEXT = "#fff";
const TEXT_DIM = "rgba(255,255,255,0.62)";
const TEXT_FAINT = "rgba(255,255,255,0.42)";

// ── Brand tag (logo + tên + domain) ────────────────────────────────────────
const BrandTag = ({ ad, bottom }) => {
  const logoUrl = ad.brandImageUrl ?? ad.advertiserLogoUrl;
  const brandName = ad.title ?? ad.advertiserName;
  const link = ad.clickThroughUrl;

  if (!brandName && !link) return null;

  const domain = (() => {
    if (!link) return null;
    try {
      return new URL(link).hostname.replace("www.", "");
    } catch {
      return link;
    }
  })();

  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        bottom,
        pointerEvents: "all",
      }}
    >
      <a
        href={link ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          maxWidth: 340,
          padding: "8px 12px",
          borderRadius: 3,
          background: "rgba(0,0,0,0.45)",
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{
              width: 28,
              height: 28,
              borderRadius: 3,
              objectFit: "cover",
              flexShrink: 0,
              background: "#fff",
            }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 3,
              background: "rgba(255,255,255,0.12)",
              border: HAIRLINE,
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
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {brandName && (
            <span
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: TEXT,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 260,
              }}
            >
              {brandName}
            </span>
          )}
          {domain && (
            <span
              style={{
                fontFamily: FONT,
                fontSize: 11.5,
                fontWeight: 400,
                color: TEXT_FAINT,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 260,
              }}
            >
              {domain}
            </span>
          )}
          {link && (
            <span
              style={{
                fontFamily: FONT,
                fontSize: 11.5,
                fontWeight: 600,
                color: TEXT_DIM,
                lineHeight: 1.5,
                whiteSpace: "nowrap",
              }}
            >
              Tìm hiểu thêm
            </span>
          )}
        </div>
      </a>
    </div>
  );
};

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
  const floatBottom = showControls ? CONTROLS_H + 16 : 24;

  if (!currentAd) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        pointerEvents: "none",
        opacity: 1,
        transition: "opacity 0.2s linear",
      }}
    >
      {/* Top-left: nhãn ad + giây còn lại */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: FONT,
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: TEXT,
            letterSpacing: "0.01em",
          }}
        >
          Quảng cáo
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 400,
            color: TEXT_FAINT,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          · {adTimeLeft}s
        </span>
      </div>

      {/* Top-right: link bỏ quảng cáo */}
      <a
        href="/upgrade"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          top: 18,
          right: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: FONT,
          fontSize: 12.5,
          fontWeight: 600,
          color: TEXT_DIM,
          textDecoration: "none",
          pointerEvents: "all",
        }}
      >
        <Lock size={12} strokeWidth={2} />
        Bỏ quảng cáo
      </a>

      {/* Bottom-left: thẻ thương hiệu */}
      <BrandTag ad={currentAd} bottom={floatBottom} />

      {/* Bottom-right: skip / countdown / non-skippable */}
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: floatBottom,
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
                gap: 7,
                padding: "9px 16px",
                border: "none",
                borderRadius: 2,
                background: "#fff",
                cursor: "pointer",
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 13,
                color: "#000",
              }}
            >
              Bỏ qua quảng cáo
              <SkipForward size={13} color="#000" strokeWidth={2} />
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 2,
                background: SCRIM,
                border: HAIRLINE,
              }}
            >
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: 400,
                  fontSize: 12.5,
                  color: TEXT_DIM,
                }}
              >
                Bỏ qua sau {adSkipCountdown}s
              </span>
            </div>
          )
        ) : (
          <div
            style={{
              padding: "9px 16px",
              borderRadius: 2,
              background: SCRIM,
              border: HAIRLINE,
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontWeight: 400,
                fontSize: 12.5,
                color: TEXT_FAINT,
              }}
            >
              Không thể bỏ qua
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdOverlay;
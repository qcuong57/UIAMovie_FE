// src/components/shared/AdOverlay.jsx
//
// Kiến trúc: SINGLE-VIDEO. Ad chạy trực tiếp trên videoRef của player —
// useAdManager swap src + gắn toàn bộ listener (timeupdate, ended) lên
// chính videoRef đó. AdOverlay chỉ render UI overlay thuần, không có
// <video> riêng và không cần biết gì về việc phát video.
//
// Thiết kế: Netflix thật — phẳng tuyệt đối (không glass, gradient, glow, accent màu mè).
// Style nằm trong AdOverlay.css; responsive qua prop `compact` + `showControls`.
//
// Layout:
//   TOP-LEFT    : nhãn "Quảng cáo" + giây còn lại
//   TOP-RIGHT   : link "Bỏ quảng cáo"
//   BOTTOM      : hàng flex — thẻ thương hiệu (trái, tự co) + nút skip / đếm ngược (phải)
//
// Usage:
//   <AdOverlay adManager={adManager} showControls={show} compact={isMobile} />

import React from "react";
import { SkipForward, Lock } from "lucide-react";
import "./AdOverlay.css";

const getDomain = (link) => {
  if (!link) return null;
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
};

// ── Brand tag (logo + tên + domain) ────────────────────────────────────────
const BrandTag = ({ ad }) => {
  const logoUrl = ad.brandImageUrl ?? ad.advertiserLogoUrl;
  const brandName = ad.title ?? ad.advertiserName;
  const link = ad.clickThroughUrl;
  if (!brandName && !link) return null;

  const domain = getDomain(link);

  return (
    <a
      className="ad-brand"
      href={link ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {logoUrl ? (
        <img className="ad-brand__logo" src={logoUrl} alt="" />
      ) : (
        <div className="ad-brand__logo ad-brand__logo--placeholder">
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

      <div className="ad-brand__text">
        {brandName && <span className="ad-brand__name">{brandName}</span>}
        {domain && <span className="ad-brand__domain">{domain}</span>}
        {link && <span className="ad-brand__cta">Tìm hiểu thêm</span>}
      </div>
    </a>
  );
};

// ── Skip / countdown / non-skippable ───────────────────────────────────────
const SkipControl = ({ ad, skippable, countdown, onSkip }) => {
  if (ad.skipAfterSeconds == null) {
    return (
      <div className="ad-chip">
        <span className="ad-chip__text ad-chip__text--faint">Không thể bỏ qua</span>
      </div>
    );
  }
  if (!skippable) {
    return (
      <div className="ad-chip">
        <span className="ad-chip__text">Bỏ qua sau {countdown}s</span>
      </div>
    );
  }
  return (
    <button
      className="ad-skip"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSkip();
      }}
    >
      Bỏ qua quảng cáo
      <SkipForward size={13} color="#000" strokeWidth={2} />
    </button>
  );
};

const AdOverlay = ({ adManager, showControls = false, compact = false }) => {
  const { currentAd, adTimeLeft, adSkippable, adSkipCountdown, skipAd } = adManager;
  if (!currentAd) return null;

  const rootClass = [
    "ad-overlay",
    compact && "ad-overlay--compact",
    showControls && "ad-overlay--lifted", // đẩy hàng dưới lên khỏi thanh điều khiển
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <div className="ad-overlay__label">
        <span className="ad-overlay__label-title">Quảng cáo</span>
        <span className="ad-overlay__label-time">· {adTimeLeft}s</span>
      </div>

      <a className="ad-overlay__premium" href="/premium" target="_blank" rel="noopener noreferrer">
        <Lock size={12} strokeWidth={2} />
        Bỏ quảng cáo
      </a>

      <div className="ad-overlay__bottom">
        <BrandTag ad={currentAd} />
        <div className="ad-overlay__action">
          <SkipControl
            ad={currentAd}
            skippable={adSkippable}
            countdown={adSkipCountdown}
            onSkip={skipAd}
          />
        </div>
      </div>
    </div>
  );
};

export default AdOverlay;
// src/motion-configs/motionConfig.js
// Centralized motion tokens for UIAMovie Editorial Experience

export const MOTION = {
  // Cubic Bezier cong mượt mà, khởi đầu dứt khoát và giảm tốc chuẩn rạp chiếu
  ease: {
    cinematic: [0.16, 1, 0.3, 1],       // Expo out - Quyền lực, mượt mà
    editorial: [0.25, 1, 0.5, 1],       // Smooth quint - Cho typography
    curtains: [0.76, 0, 0.24, 1],        // In-out curve - Kéo rèm sân khấu
    magnetic: { type: "spring", stiffness: 180, damping: 20 },
  },
  duration: {
    instant: 0.15,
    fast: 0.35,
    normal: 0.65,
    slow: 0.95,
    curtain: 1.1,
  },
  stagger: {
    micro: 0.04,
    tight: 0.07,
    editorial: 0.1,
    blinds: 0.08,
  },
};
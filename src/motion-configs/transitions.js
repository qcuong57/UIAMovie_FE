// ═══════════════════════════════════════════════════════════════════════════
// motion-configs/transitions.js
// Tất cả timing configs - Import và dùng lại ở nhiều nơi
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// ⏱️ TỐCDỘ CHUYỂN ĐỘNG - Duration (tính bằng giây)
// ─────────────────────────────────────────────────────────────────────────

// Rất nhanh (giây)
export const TRANSITION_INSTANT = {
  duration: 0.1,
  ease: "easeOut",
};

// Nhanh (sử dụng cho hover, tab)
export const TRANSITION_FAST = {
  duration: 0.3,
  ease: "easeOut",
};

// Bình thường (sử dụng chủ yếu)
export const TRANSITION_NORMAL = {
  duration: 0.6,
  ease: "easeOut",
};

// Chậm (cho hero banner, important content)
export const TRANSITION_SLOW = {
  duration: 0.8,
  ease: "easeOut",
};

// Rất chậm (cho hero, background)
export const TRANSITION_VERY_SLOW = {
  duration: 1.2,
  ease: "easeOut",
};

// ─────────────────────────────────────────────────────────────────────────
// 🌊 EASING FUNCTIONS - Cách chuyển động diễn ra
// ─────────────────────────────────────────────────────────────────────────

// Linear - chuyển động đều (không tự nhiên, tránh dùng)
export const TRANSITION_LINEAR = {
  duration: 0.6,
  ease: "linear",
};

// Ease In - chậm lúc đầu, nhanh sau (tránh dùng khi appear)
export const TRANSITION_EASE_IN = {
  duration: 0.6,
  ease: "easeIn",
};

// Ease Out - nhanh lúc đầu, chậm sau (tự nhiên nhất, dùng nhiều!)
export const TRANSITION_EASE_OUT = {
  duration: 0.6,
  ease: "easeOut",
};

// Ease In Out - chậm - nhanh - chậm (mượt mà)
export const TRANSITION_EASE_IN_OUT = {
  duration: 0.6,
  ease: "easeInOut",
};

// ─────────────────────────────────────────────────────────────────────────
// 🎪 SPRING TRANSITIONS - Bốc lên rồi rơi (vui vẻ, tự nhiên)
// ─────────────────────────────────────────────────────────────────────────

// Spring bình thường (khuyên dùng)
export const TRANSITION_SPRING = {
  type: "spring",
  stiffness: 100,     // Cứng = nhanh hơn, mềm = chậm hơn
  damping: 10,        // Cắn = nảy ít, lỏng = nảy nhiều
};

// Spring nảy ít (mượt mà)
export const TRANSITION_SPRING_SMOOTH = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

// Spring nảy nhiều (vui vẻ)
export const TRANSITION_SPRING_BOUNCY = {
  type: "spring",
  stiffness: 150,
  damping: 5,
};

// Spring rất nảy (siêu vui)
export const TRANSITION_SPRING_SUPER_BOUNCY = {
  type: "spring",
  stiffness: 100,
  damping: 2,
};

// ─────────────────────────────────────────────────────────────────────────
// 🎠 STAGGER - Nối tiếp từng cái một (cho list, carousel)
// ─────────────────────────────────────────────────────────────────────────

// Stagger chậm (mỗi item chờ 0.15s)
export const STAGGER_SLOW = {
  staggerChildren: 0.15,
  delayChildren: 0.3,  // Bắt đầu sau 0.3s
};

// Stagger bình thường (mỗi item chờ 0.1s)
export const STAGGER_NORMAL = {
  staggerChildren: 0.1,
  delayChildren: 0.2,
};

// Stagger nhanh (mỗi item chờ 0.05s)
export const STAGGER_FAST = {
  staggerChildren: 0.05,
  delayChildren: 0.1,
};

// Stagger rất nhanh (gần như đồng thời)
export const STAGGER_VERY_FAST = {
  staggerChildren: 0.02,
  delayChildren: 0,
};

// Stagger ngay lập tức (không delay)
export const STAGGER_INSTANT = {
  staggerChildren: 0.05,
  delayChildren: 0,
};

// ─────────────────────────────────────────────────────────────────────────
// 🎬 NETFLIX STYLE: PAGE LOAD - Hero banner + content
// ─────────────────────────────────────────────────────────────────────────

// Hero banner chuyển động chậm
export const TRANSITION_HERO_BANNER = {
  duration: 1,
  ease: "easeOut",
};

// Hero content kéo dài
export const TRANSITION_HERO_CONTENT = {
  duration: 0.8,
  ease: "easeOut",
};

// Stagger cho hero buttons
export const STAGGER_HERO_BUTTONS = {
  staggerChildren: 0.1,
  delayChildren: 0.4,
};

// ─────────────────────────────────────────────────────────────────────────
// 🎞️ NETFLIX STYLE: CAROUSEL - Movie cards
// ─────────────────────────────────────────────────────────────────────────

// Stagger cho carousel items
export const STAGGER_CAROUSEL = {
  staggerChildren: 0.05,
  delayChildren: 0.1,
};

// Hover effect trên card
export const TRANSITION_CARD_HOVER = {
  duration: 0.3,
  ease: "easeOut",
};

// ─────────────────────────────────────────────────────────────────────────
// 🔘 BUTTON TRANSITIONS - Click, hover
// ─────────────────────────────────────────────────────────────────────────

// Hover button nhanh
export const TRANSITION_BUTTON_HOVER = {
  duration: 0.2,
  ease: "easeOut",
};

// Tap button (nhấn chuột)
export const TRANSITION_BUTTON_TAP = {
  duration: 0.1,
  ease: "easeOut",
};

// ─────────────────────────────────────────────────────────────────────────
// ✨ SPECIAL ANIMATIONS - Lặp lại, nhấp nháy
// ─────────────────────────────────────────────────────────────────────────

// Loading spinner xoay
export const TRANSITION_SPINNER = {
  duration: 1,
  repeat: Infinity,
  ease: "linear",
};

// Floating effect bay lơ lửng
export const TRANSITION_FLOAT = {
  duration: 3,
  repeat: Infinity,
  ease: "easeInOut",
};

// Glow effect sáng dần
export const TRANSITION_GLOW = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut",
};

// Shimmer effect nhấp nháy
export const TRANSITION_SHIMMER = {
  duration: 2,
  repeat: Infinity,
  ease: "linear",
};

// ─────────────────────────────────────────────────────────────────────────
// 📊 PROGRESS BAR - Chạy
// ─────────────────────────────────────────────────────────────────────────

export const TRANSITION_PROGRESS_BAR = {
  duration: 0.8,
  ease: "easeOut",
};

// ─────────────────────────────────────────────────────────────────────────
// 💬 MODAL POPUP - Bật lên từ giữa
// ─────────────────────────────────────────────────────────────────────────

// Modal backdrop mờ
export const TRANSITION_MODAL_BACKDROP = {
  duration: 0.3,
  ease: "easeOut",
};

// Modal content bật lên
export const TRANSITION_MODAL_CONTENT = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// ─────────────────────────────────────────────────────────────────────────
// 📝 CUBIC BEZIER - Tự tạo easing (advanced)
// ─────────────────────────────────────────────────────────────────────────

// Ease Out Quad (bình thường)
export const TRANSITION_EASE_OUT_QUAD = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
};

// Ease Out Cubic (mượt hơn)
export const TRANSITION_EASE_OUT_CUBIC = {
  duration: 0.6,
  ease: [0.215, 0.61, 0.355, 1],
};

// Ease Out Quart (mượt nhất)
export const TRANSITION_EASE_OUT_QUART = {
  duration: 0.6,
  ease: [0.165, 0.84, 0.44, 1],
};

// ─────────────────────────────────────────────────────────────────────────
// 🎯 QUICK REFERENCE - Sử dụng nhanh
// ─────────────────────────────────────────────────────────────────────────

/**
 * KÍCH THƯớC:
 * - INSTANT (0.1s): Không nhìn thấy chuyển động
 * - FAST (0.3s): Hover, tap, nhanh
 * - NORMAL (0.6s): Phổ biến nhất, appear
 * - SLOW (0.8s): Hero banner, quan trọng
 * - VERY_SLOW (1.2s): Background, backdrop
 * 
 * LOẠI:
 * - EASE_OUT: Sử dụng nhất (tự nhiên)
 * - SPRING: Vui vẻ, bounce effect
 * - LINEAR: Không bao giờ dùng (không tự nhiên)
 * 
 * STAGGER (cho list):
 * - SLOW (0.15s): Spa, relax feeling
 * - NORMAL (0.1s): Bình thường
 * - FAST (0.05s): Nhanh, energetic
 * 
 * SPRING PARAMS:
 * - stiffness cao = nhanh
 * - damping cao = ít nảy
 * 
 * EXAMPLES:
 * 
 * Page load: NORMAL + STAGGER_NORMAL
 * Hero banner: SLOW + STAGGER_HERO_BUTTONS
 * Hover card: TRANSITION_SPRING + CARD_HOVER
 * List items: NORMAL + STAGGER_SLOW
 * Modal popup: SPRING + MODAL_CONTENT
 */
// ═══════════════════════════════════════════════════════════════════════════
// motion-configs/variants.js
// Tất cả Framer Motion variants - Sử dụng lại trong nhiều components
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// 📦 CONTAINER VARIANTS - Cho phần tử cha để stagger children
// ─────────────────────────────────────────────────────────────────────────

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export const containerVariantsNoDelay = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 🎬 FADE IN/OUT - Mở dần từ trong suốt
// ─────────────────────────────────────────────────────────────────────────

export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeInOutVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ─────────────────────────────────────────────────────────────────────────
// ⬆️ SLIDE UP - Trượt lên từ dưới (phổ biến nhất)
// ─────────────────────────────────────────────────────────────────────────

export const slideUpVariants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: { 
    opacity: 1, 
    y: 0 
  },
  exit: {
    opacity: 0,
    y: -40,
  }
};

export const slideUpLargeVariants = {
  hidden: { 
    opacity: 0, 
    y: 80 
  },
  visible: { 
    opacity: 1, 
    y: 0 
  },
};

// ─────────────────────────────────────────────────────────────────────────
// ⬇️ SLIDE DOWN - Trượt xuống từ trên
// ─────────────────────────────────────────────────────────────────────────

export const slideDownVariants = {
  hidden: { 
    opacity: 0, 
    y: -40 
  },
  visible: { 
    opacity: 1, 
    y: 0 
  },
};

// ─────────────────────────────────────────────────────────────────────────
// ➡️ SLIDE RIGHT - Trượt từ phải (từ trái vào)
// ─────────────────────────────────────────────────────────────────────────

export const slideRightVariants = {
  hidden: { 
    opacity: 0, 
    x: -80 
  },
  visible: { 
    opacity: 1, 
    x: 0 
  },
};

// ─────────────────────────────────────────────────────────────────────────
// ⬅️ SLIDE LEFT - Trượt từ trái (từ phải vào)
// ─────────────────────────────────────────────────────────────────────────

export const slideLeftVariants = {
  hidden: { 
    opacity: 0, 
    x: 80 
  },
  visible: { 
    opacity: 1, 
    x: 0 
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 📈 SCALE UP - Phóng to từ nhỏ (zoom in)
// ─────────────────────────────────────────────────────────────────────────

export const scaleUpVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1 
  },
};

export const scaleUpSmallVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1 
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 🔄 ROTATE IN - Xoay vào
// ─────────────────────────────────────────────────────────────────────────

export const rotateInVariants = {
  hidden: { 
    opacity: 0, 
    rotate: -10 
  },
  visible: { 
    opacity: 1, 
    rotate: 0 
  },
};

export const rotate360Variants = {
  hidden: { 
    opacity: 0, 
    rotate: -180 
  },
  visible: { 
    opacity: 1, 
    rotate: 0 
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 🎬 NETFLIX STYLE: NAVBAR - Thanh nav trượt xuống
// ─────────────────────────────────────────────────────────────────────────

export const navbarVariants = {
  hidden: { 
    opacity: 0, 
    y: -100 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 🎬 NETFLIX STYLE: HERO BANNER - Phóng to từ nhỏ
// ─────────────────────────────────────────────────────────────────────────

export const heroBannerVariants = {
  hidden: { 
    opacity: 0, 
    scale: 1.15 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 1,
      ease: "easeOut",
    }
  },
};

export const heroContentVariants = {
  hidden: { 
    opacity: 0, 
    y: 60 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    }
  },
};

export const heroTitleVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    letterSpacing: "0.05em"
  },
  visible: { 
    opacity: 1, 
    y: 0,
    letterSpacing: "0em",
    transition: {
      duration: 0.6,
      ease: "easeOut",
    }
  },
};

export const heroDescriptionVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.2,
      ease: "easeOut",
    }
  },
};

export const heroButtonContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    }
  }
};

export const heroButtonVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0 
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 🎞️ NETFLIX STYLE: MOVIE CARD - Hover + Appear
// ─────────────────────────────────────────────────────────────────────────

export const movieCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    }
  },
  hover: { 
    scale: 1.08,
    y: -15,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    }
  },
};

export const movieCardImageVariants = {
  hidden: { scale: 1 },
  hover: { 
    scale: 1.1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    }
  },
};

export const movieCardOverlayVariants = {
  hidden: { opacity: 0 },
  hover: { 
    opacity: 1,
    transition: {
      duration: 0.2,
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 🎠 NETFLIX STYLE: CAROUSEL ITEM - Trượt vào từ ngoài
// ─────────────────────────────────────────────────────────────────────────

export const carouselItemVariants = {
  hidden: { 
    opacity: 0, 
    x: 100 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    }
  },
};

export const carouselContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 🔤 NETFLIX STYLE: SECTION TITLE - In từ dưới
// ─────────────────────────────────────────────────────────────────────────

export const sectionTitleVariants = {
  hidden: { 
    opacity: 0, 
    y: 30 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────
// 🏷️ NETFLIX STYLE: GENRE TAG - Nảy vào
// ─────────────────────────────────────────────────────────────────────────

export const genreTagVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.7 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    }
  },
  hover: {
    scale: 1.1,
    backgroundColor: "rgb(220, 38, 38)", // Đỏ hơn
    transition: {
      duration: 0.2,
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 🔘 BUTTON VARIANTS - Hover + Tap effects
// ─────────────────────────────────────────────────────────────────────────

export const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    }
  },
  hover: { 
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(239, 68, 68, 0.4)",
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// ⭐ NETFLIX STYLE: STAR RATING - Sáng lên
// ─────────────────────────────────────────────────────────────────────────

export const starVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    }
  },
  hover: {
    scale: 1.2,
    color: "#fbbf24",
    transition: { duration: 0.2 }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 💬 NETFLIX STYLE: MODAL - Popup từ giữa
// ─────────────────────────────────────────────────────────────────────────

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

export const modalContentVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.75,
    y: 50
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.75,
    y: 50,
    transition: { duration: 0.2 }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 🎪 NETFLIX STYLE: BOUNCE EFFECT - Nảy lên vui vẻ
// ─────────────────────────────────────────────────────────────────────────

export const bounceVariants = {
  hidden: { 
    opacity: 0, 
    y: 50 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    }
  }
};

export const bounceTallVariants = {
  hidden: { 
    opacity: 0, 
    y: 80 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 8,  // Nảy cao hơn
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 🎬 NETFLIX STYLE: LOADING SPINNER - Xoay
// ─────────────────────────────────────────────────────────────────────────

export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: "linear",
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 📊 NETFLIX STYLE: PROGRESS BAR - Chạy từ trái sang phải
// ─────────────────────────────────────────────────────────────────────────

export const progressBarVariants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: { 
    scaleX: 1,
    originX: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// ✨ NETFLIX STYLE: GLOW EFFECT - Sáng dần lên
// ─────────────────────────────────────────────────────────────────────────

export const glowEffectVariants = {
  hidden: { 
    opacity: 0,
    boxShadow: "0 0 0px rgba(239, 68, 68, 0)"
  },
  visible: {
    opacity: 1,
    boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)",
    transition: {
      duration: 1,
      ease: "easeInOut",
    }
  },
  animate: {
    boxShadow: [
      "0 0 20px rgba(239, 68, 68, 0.4)",
      "0 0 30px rgba(239, 68, 68, 0.8)",
      "0 0 20px rgba(239, 68, 68, 0.4)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 🎯 NETFLIX STYLE: NOTIFICATION - Từ trên rơi xuống
// ─────────────────────────────────────────────────────────────────────────

export const notificationVariants = {
  hidden: { 
    opacity: 0, 
    y: -50,
    x: 0
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    }
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: { duration: 0.3 }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 🎁 NETFLIX STYLE: FLOATING ELEMENT - Bay lơ lửng
// ─────────────────────────────────────────────────────────────────────────

export const floatVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 🌟 NETFLIX STYLE: SHIMMER EFFECT - Nhấp nháy
// ─────────────────────────────────────────────────────────────────────────

export const shimmerVariants = {
  animate: {
    backgroundPosition: ["200% center", "-200% center"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    }
  }
};
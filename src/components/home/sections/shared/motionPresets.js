// src/components/home/sections/shared/motionPresets.js
// Preset chuyển động dùng chung cho các layout của HomeSection.
// Nguồn: HOME_EASE (HomeReveal) + MOTION (motionConfig). Không tạo easing mới.
import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { HOME_EASE } from '../../../../motion-configs/HomeReveal';
import { MOTION } from '../../../../motion-configs/motionConfig';

export { HOME_EASE, MOTION };

/** CSS cubic-bezier cùng đường cong với HOME_EASE, cho transition viết bằng CSS. */
export const CSS_EASE = `cubic-bezier(${HOME_EASE.join(',')})`;

/**
 * Khối "khung lớn có chữ" (billboard/hero/spotlight/split): ảnh nền zoom-out nhẹ,
 * chữ vào lần lượt. Dùng với nhãn enter/center — gắn initial="enter" animate="center" ở motion.div cha.
 */
export function useTextMotion(isMobile) {
  const reduce = useReducedMotion();
  return useMemo(() => ({
    reduce,
    coverV: reduce ? undefined : {
      enter: { scale: 1.06 },
      center: { scale: 1, transition: { duration: 1.4, ease: HOME_EASE } },
    },
    textV: {
      enter: {},
      center: { transition: { staggerChildren: isMobile ? MOTION.stagger.micro : MOTION.stagger.tight, delayChildren: reduce ? 0 : 0.15 } },
    },
    lineV: {
      enter: { opacity: 0, y: reduce ? 0 : 14 },
      center: { opacity: 1, y: 0, transition: { duration: reduce ? 0.01 : MOTION.duration.normal, ease: HOME_EASE } },
    },
  }), [reduce, isMobile]);
}

/**
 * Thẻ trong hàng/lưới: mỗi thẻ tự reveal khi cuộn tới (không cần container).
 * Dùng: <motion.div {...revealProps} custom={index} variants={itemV}>
 * Delay tối đa 6 bậc để thẻ ở xa không phải chờ lâu khi người dùng cuộn ngang.
 */
export function useRailMotion() {
  const reduce = useReducedMotion();
  return useMemo(() => ({
    reduce,
    itemV: {
      hidden: { opacity: 0, y: reduce ? 0 : 12 },
      visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: reduce ? 0.01 : 0.5, ease: HOME_EASE, delay: reduce ? 0 : Math.min(i, 6) * MOTION.stagger.micro },
      }),
    },
    revealProps: {
      initial: 'hidden',
      whileInView: 'visible',
      viewport: { once: true, margin: '0px 0px 8% 0px', amount: 0.05 },
    },
  }), [reduce]);
}
// src/components/player/controls/MenuDropdown.jsx
// Dropdown dùng chung cho Phụ đề / Tốc độ / Chất lượng / Cài đặt. Tự đóng khi click ra ngoài.
// Chiều cao tối đa được đo theo khoảng trống phía trên nút → menu dài vẫn cuộn được
// thay vì bị player (overflow: hidden) cắt mất, nhất là khi xem dọc trên điện thoại.
import React, { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import useClickOutside from "../../../../hooks/useClickOutside";

const MENU_OFFSET = 10; // khớp `bottom: calc(100% + 10px)` trong player.css
const EDGE_GAP = 8; // chừa mép trên player
const MIN_MENU_HEIGHT = 96;

/**
 * @typedef {{ id: any, label: string, badge?: string }} MenuItem
 * @typedef {{ title: string, items: MenuItem[], activeId: any, onSelect: (id: any) => void }} MenuSection
 *
 * @param {{
 *   open: boolean, onClose: () => void,
 *   trigger: React.ReactNode,                       // nút mở menu (cha tự xử lý onClick)
 *   sections?: MenuSection[],                       // nhiều nhóm trong 1 menu (vd. Chất lượng + Tốc độ)
 *   title?: string, items?: MenuItem[],             // rút gọn cho menu 1 nhóm
 *   activeId?: any, onSelect?: (id: any) => void,
 *   minWidth?: number,
 * }} p
 */
export default function MenuDropdown({
  open,
  onClose,
  trigger,
  sections,
  title,
  items,
  activeId,
  onSelect,
  minWidth,
}) {
  const ref = useRef(null);
  const [maxHeight, setMaxHeight] = useState(null);
  useClickOutside(ref, onClose, open);

  const groups = sections ?? [{ title, items: items ?? [], activeId, onSelect }];

  useLayoutEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      const anchor = ref.current;
      const root = anchor?.closest(".vp-root");
      if (!anchor || !root) return;
      const room =
        anchor.getBoundingClientRect().top - root.getBoundingClientRect().top - MENU_OFFSET - EDGE_GAP;
      setMaxHeight(Math.max(room, MIN_MENU_HEIGHT));
    };
    measure();
    window.addEventListener("resize", measure); // xoay màn hình / vào-ra fullscreen
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  return (
    <div ref={ref} className="vp-menu-anchor">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            className="vp-menu"
            style={{ minWidth, maxHeight: maxHeight ?? undefined }}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
          >
            {groups.map((group, gi) => (
              <div key={group.title ?? gi} className="vp-menu__section">
                <div className="vp-menu__header">
                  <p className="vp-menu__title">{group.title}</p>
                </div>
                {group.items.map((it) => {
                  const active = it.id === group.activeId;
                  return (
                    <button
                      key={`${gi}-${String(it.id)}`}
                      className={`vp-menu__item${active ? " is-active" : ""}`}
                      onClick={() => {
                        group.onSelect(it.id);
                        onClose();
                      }}
                    >
                      <span className="vp-menu__label">
                        {it.badge && <span className="vp-menu__badge">{it.badge}</span>}
                        {it.label}
                      </span>
                      {active && (
                        <Check size={14} strokeWidth={2.75} style={{ color: "var(--vp-accent)" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// src/components/player/controls/MenuDropdown.jsx
// Dropdown dùng chung cho Phụ đề / Tốc độ / Chất lượng. Tự đóng khi click ra ngoài.
import React, { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import useClickOutside from "../../../../hooks/useClickOutside";

/**
 * @param {{
 *   open: boolean, onClose: () => void,
 *   trigger: React.ReactNode,                       // nút mở menu (cha tự xử lý onClick)
 *   title: string,
 *   items: { id: any, label: string, badge?: string }[],
 *   activeId: any, onSelect: (id: any) => void,
 *   minWidth?: number,
 * }} p
 */
export default function MenuDropdown({
  open,
  onClose,
  trigger,
  title,
  items,
  activeId,
  onSelect,
  minWidth,
}) {
  const ref = useRef(null);
  useClickOutside(ref, onClose, open);

  return (
    <div ref={ref} className="vp-menu-anchor">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            className="vp-menu"
            style={minWidth ? { minWidth } : undefined}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
          >
            <div className="vp-menu__header">
              <p className="vp-menu__title">{title}</p>
            </div>
            {items.map((it) => {
              const active = it.id === activeId;
              return (
                <button
                  key={String(it.id)}
                  className={`vp-menu__item${active ? " is-active" : ""}`}
                  onClick={() => {
                    onSelect(it.id);
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
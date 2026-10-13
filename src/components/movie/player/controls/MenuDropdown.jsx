// src/components/player/controls/MenuDropdown.jsx
// Dropdown dùng chung (Phụ đề / Cài đặt). Tự đóng khi click ra ngoài.
// 2 kiểu dùng:
//  - items:  1 danh sách phẳng (vd. Phụ đề)
//  - panels: kiểu Netflix/YouTube — menu chính liệt kê panel, bấm vào để mở panel con có nút quay lại
// Chiều cao tối đa đo theo khoảng trống phía trên nút → menu dài vẫn cuộn được trong player.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import useClickOutside from "../../../../hooks/useClickOutside";
import "./menu.css";

const MENU_OFFSET = 10; // khớp `bottom: calc(100% + 10px)` trong menu.css
const EDGE_GAP = 8;
const MIN_MENU_HEIGHT = 96;

/**
 * @typedef {{ id: any, label: string, badge?: string }} MenuItem
 * @typedef {{ id: string, title: string, value?: string, items: MenuItem[], activeId: any, onSelect: (id:any)=>void }} MenuPanel
 *
 * @param {{
 *   open: boolean, onClose: () => void,
 *   trigger: React.ReactNode,
 *   panels?: MenuPanel[],
 *   title?: string, items?: MenuItem[], activeId?: any, onSelect?: (id:any)=>void,
 *   minWidth?: number,
 * }} p
 */
export default function MenuDropdown({
  open,
  onClose,
  trigger,
  panels,
  title,
  items,
  activeId,
  onSelect,
  minWidth = 220,
}) {
  const ref = useRef(null);
  const [maxHeight, setMaxHeight] = useState(null);
  const [view, setView] = useState(null); // null = menu chính; string = id panel đang mở
  useClickOutside(ref, onClose, open);

  // Đóng menu → lần mở sau quay về menu chính
  useEffect(() => {
    if (!open) setView(null);
  }, [open]);

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
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  const activePanel = panels?.find((p) => p.id === view) ?? null;

  const renderOptions = (list, selectedId, onPick) =>
    list.map((it) => {
      const active = it.id === selectedId;
      return (
        <button
          key={String(it.id)}
          type="button"
          role="menuitemradio"
          aria-checked={active}
          className={`vp-menu__option${active ? " is-active" : ""}`}
          onClick={() => {
            onPick(it.id);
            onClose();
          }}
        >
          <span className="vp-menu__check">{active && <Check size={16} strokeWidth={3} />}</span>
          <span className="vp-menu__text">{it.label}</span>
          {it.badge && <span className="vp-menu__badge">{it.badge}</span>}
        </button>
      );
    });

  let body;
  if (panels && activePanel) {
    body = (
      <>
        <button type="button" className="vp-menu__head vp-menu__head--back" onClick={() => setView(null)}>
          <ChevronLeft size={18} strokeWidth={2.5} />
          <span>{activePanel.title}</span>
        </button>
        <div className="vp-menu__list">
          {renderOptions(activePanel.items, activePanel.activeId, activePanel.onSelect)}
        </div>
      </>
    );
  } else if (panels) {
    body = (
      <div className="vp-menu__list">
        {panels.map((p) => (
          <button key={p.id} type="button" className="vp-menu__row" onClick={() => setView(p.id)}>
            <span className="vp-menu__text">{p.title}</span>
            <span className="vp-menu__value">
              <span className="vp-menu__value-text">{p.value}</span>
              <ChevronRight size={16} strokeWidth={2.5} />
            </span>
          </button>
        ))}
      </div>
    );
  } else {
    body = (
      <>
        {title && <div className="vp-menu__head">{title}</div>}
        <div className="vp-menu__list">{renderOptions(items ?? [], activeId, onSelect)}</div>
      </>
    );
  }

  return (
    <div ref={ref} className="vp-menu-anchor">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            className="vp-menu"
            role="menu"
            style={{ width: minWidth, maxHeight: maxHeight ?? undefined }}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view ?? "root"}
                initial={{ opacity: 0, x: view ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {body}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// src/components/player/controls/MenuDropdown.jsx
// Dropdown dùng chung (Phụ đề / Cài đặt). Tự đóng khi click ra ngoài.
//
// 2 kiểu dữ liệu:
//  - items:  1 danh sách phẳng (vd. Phụ đề)
//  - panels: kiểu Netflix/YouTube — menu chính liệt kê panel, bấm vào để mở panel con có nút quay lại
//
// 2 kiểu hiển thị (tự chọn theo kích thước player, đo mỗi lần mở / resize / xoay màn hình):
//  - popover: player đủ lớn (desktop) → nổi ngay trên nút
//  - sheet:   player nhỏ (điện thoại) → panel gắn góc phải TRONG player + lớp mờ phía sau.
//             Render qua portal vào .vp-root (không vào body) để vẫn hiện khi fullscreen
//             và không bị `overflow: hidden` của player cắt như khi bám theo nút.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import "./menu.css";

const MENU_OFFSET = 10; // khớp `bottom: calc(100% + 10px)` trong menu.css
const EDGE_GAP = 8;
const MIN_MENU_HEIGHT = 96;
const SHEET_MAX_WIDTH = 600; // player hẹp hơn mức này → dùng sheet
const SHEET_MAX_HEIGHT = 380; // player thấp hơn mức này → dùng sheet
const DENSE_MAX_HEIGHT = 300; // player rất thấp → thu gọn dòng
const KEEP_CONTROLS_MS = 1500; // menu đang mở thì giữ thanh điều khiển không tự ẩn

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
 *   onActivity?: () => void,   // gọi định kỳ khi menu mở để controls không tự ẩn
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
  onActivity,
}) {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const [layout, setLayout] = useState(null); // { root, sheet, dense, maxHeight } — null = chưa đo
  const [view, setView] = useState(null); // null = menu chính; string = id panel đang mở

  // Đóng menu → reset để lần mở sau đo lại và quay về menu chính
  useEffect(() => {
    if (!open) {
      setView(null);
      setLayout(null);
    }
  }, [open]);

  // Click/chạm ra ngoài (cả nút lẫn panel portal đều tính là "trong")
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (anchorRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onClose]);

  // Menu đang mở → báo hoạt động định kỳ để thanh điều khiển (và menu theo nó) không bị ẩn
  useEffect(() => {
    if (!open || !onActivity) return undefined;
    const id = setInterval(onActivity, KEEP_CONTROLS_MS);
    return () => clearInterval(id);
  }, [open, onActivity]);

  // Đo kích thước player → chọn popover / sheet. Chạy trước khi paint nên không bị nháy.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      const anchor = anchorRef.current;
      const root = anchor?.closest(".vp-root");
      if (!anchor || !root) return;
      const r = root.getBoundingClientRect();
      const sheet = r.width < SHEET_MAX_WIDTH || r.height < SHEET_MAX_HEIGHT;
      const room = anchor.getBoundingClientRect().top - r.top - MENU_OFFSET - EDGE_GAP;
      setLayout({
        root,
        sheet,
        dense: r.height < DENSE_MAX_HEIGHT,
        maxHeight: Math.max(room, MIN_MENU_HEIGHT),
      });
    };
    measure();
    window.addEventListener("resize", measure); // xoay màn hình / vào-ra fullscreen
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

  const sheet = !!layout?.sheet;
  const show = open && !!layout;

  const content = (
    <AnimatePresence>
      {show && sheet && (
        <motion.div
          key="scrim"
          className="vp-menu-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()} // không cho lọt xuống video (tránh bật/tắt controls)
        />
      )}
      {show && (
        <motion.div
          key="menu"
          ref={menuRef}
          role="menu"
          className={`vp-menu${sheet ? " vp-menu--sheet" : ""}${layout.dense ? " vp-menu--dense" : ""}`}
          style={sheet ? undefined : { width: minWidth, maxHeight: layout.maxHeight }}
          initial={sheet ? { opacity: 0, x: 24 } : { opacity: 0, y: 8, scale: 0.98 }}
          animate={sheet ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, scale: 1 }}
          exit={sheet ? { opacity: 0, x: 24 } : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
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
  );

  return (
    <div ref={anchorRef} className="vp-menu-anchor">
      {trigger}
      {sheet && layout.root ? createPortal(content, layout.root) : content}
    </div>
  );
}
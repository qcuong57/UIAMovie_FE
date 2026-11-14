// src/components/admin/dashboard/Card.jsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { T, ACCENT, FONT_BODY as FONT, FONT_TITLE } from "../../../context/adminTokens";
import { BlockSkeleton, Empty, ErrorState, GhostBtn } from "./DashboardPrimitives";

/**
 * Khung thẻ dùng chung. Tự xử lý 3 trạng thái để section không phải lặp `loading ? <Spin/> : ...`:
 *   loading → skeleton · error → thông báo + "Thử lại" · isEmpty → trạng thái rỗng · còn lại → children.
 * Thẻ có `tabs` thì `activeTab`/`onTabChange` do component cha giữ.
 */
export const Card = ({
  title, subtitle, action, tabs, activeTab, onTabChange,
  loading, error, onRetry, isEmpty, emptyText, skeletonRows = 4,
  style, children,
}) => {
  let body = children;
  if (loading) body = <BlockSkeleton rows={skeletonRows} />;
  else if (error) body = <ErrorState onRetry={onRetry} />;
  else if (isEmpty) body = <Empty text={emptyText} />;

  return (
    <section
      style={{
        background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", overflow: "hidden", ...style,
      }}
    >
      {(title || action) && (
        <header style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 12, padding: "14px 20px 0",
        }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontFamily: FONT_TITLE, fontSize: 14, fontWeight: 700, color: T.text,
              letterSpacing: "-0.01em", margin: 0,
            }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: "2px 0 0", lineHeight: 1.4 }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </header>
      )}

      {tabs && (
        <div
          role="tablist"
          className="dash-scroll-x"
          style={{ display: "flex", padding: "6px 20px 0", borderBottom: `1px solid ${T.border}` }}
        >
          {tabs.map((tab) => {
            const on = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={on}
                className="dash-focus"
                onClick={() => onTabChange(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                  fontFamily: FONT, fontSize: 13, fontWeight: on ? 600 : 500,
                  color: on ? ACCENT : T.textMuted,
                  background: "none", border: "none", cursor: "pointer",
                  padding: "9px 14px 10px", marginBottom: -1,
                  borderBottom: `2px solid ${on ? ACCENT : "transparent"}`,
                  transition: "color .13s, border-color .13s",
                }}
              >
                {tab.label}
                {tab.count != null && (
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: on ? T.accentLight : T.bg, color: on ? ACCENT : T.textMuted,
                    padding: "0 7px", borderRadius: 99, lineHeight: "18px",
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div role={tabs ? "tabpanel" : undefined} style={{ padding: tabs ? "6px 20px 14px" : "14px 20px 18px", flex: 1 }}>
        {body}
      </div>
    </section>
  );
};

/**
 * Danh sách phân trang phía client.
 * renderItem(item, indexInPage, absoluteIndex): chỉ số tuyệt đối dùng cho thứ hạng (#1, #2…),
 * chỉ số trong trang dùng cho animation — tránh phải `indexOf` trên cả danh sách.
 * Nên đặt `key` theo tab ở nơi gọi để về trang 1 khi đổi tab.
 */
export const Paginated = ({ items, pageSize = 6, renderItem, emptyText }) => {
  const [page, setPage] = useState(0);
  if (!items.length) return <Empty text={emptyText} />;

  const pages = Math.ceil(items.length / pageSize);
  const current = Math.min(page, pages - 1);
  const start = current * pageSize;
  const end = Math.min(start + pageSize, items.length);

  return (
    <div>
      {items.slice(start, end).map((item, i) => renderItem(item, i, start + i))}
      {pages > 1 && (
        <nav
          aria-label="Phân trang"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12 }}
        >
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, fontVariantNumeric: "tabular-nums" }}>
            {start + 1}–{end} / {items.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <GhostBtn label="Trang trước" disabled={current === 0} onClick={() => setPage(current - 1)} style={{ padding: "5px 8px" }}>
              <ChevronLeft size={15} />
            </GhostBtn>
            <GhostBtn label="Trang sau" disabled={current === pages - 1} onClick={() => setPage(current + 1)} style={{ padding: "5px 8px" }}>
              <ChevronRight size={15} />
            </GhostBtn>
          </div>
        </nav>
      )}
    </div>
  );
};

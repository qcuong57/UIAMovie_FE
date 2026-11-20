// src/components/admin/AdminAds.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Quản lý quảng cáo. Cùng khuôn với AdminRevenue / AdminGenres:
//   - dữ liệu qua react-query (useAdminAds, useAdScheduleSettings); không tự giữ danh sách trong state;
//   - mọi modal / panel gom vào một biến `dialog` ({ type, ad });
//   - sau khi tạo / sửa / xoá / đổi lịch chỉ cần refresh() (invalidate nhóm admin.ads).
// ─────────────────────────────────────────────────────────────────────────────

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Search,
  Eye,
  Pencil,
  Trash2,
  Play,
  Clock,
  Link,
  MonitorPlay,
  CalendarRange,
  Shuffle,
} from "lucide-react";
import {
  useAdminAds,
  useAdMutations,
  useAdScheduleSettings,
  useRefreshAds,
  useSetScheduleSettings,
  isRandomSchedule,
} from "../../hooks/admin/useAdminAds";
import { getApiErrorMessage } from "../../utils/apiError";
import { useToast } from "./common/Toast";
import {
  T,
  FONT_BODY as FONT,
  FONT_TITLE,
  ADMIN_GOOGLE_FONTS,
} from "../../context/adminTokens";
import { fmtDuration } from "../../helper/format";
import AdminPagination from "../common/AdminPagination";
import AdStatusBadge from "./ads/AdStatusBadge";
import AdCreateModal from "./ads/AdCreateModal";
import AdEditModal from "./ads/AdEditModal";
import AdDeleteModal from "./ads/AdDeleteModal";
import AdDetailPanel from "./ads/AdDetailPanel";
import AdScheduleModal from "./ads/AdScheduleModal";
import AdScheduleSettingsModal from "./ads/AdScheduleSettingsModal";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 400;

const FILTER_OPTS = [
  { label: "Tất cả", value: undefined },
  { label: "Đang chạy", value: true },
  { label: "Tạm dừng", value: false },
];

const COLUMNS = [
  { label: "Quảng cáo" },
  { label: "Thời lượng", width: 110 },
  { label: "Bỏ qua sau", width: 100 },
  { label: "Trạng thái", width: 130 },
  { label: "Lịch phát", width: 100 },
  { label: "Click URL", width: 160 },
  { label: "", width: 170 },
];

const CSS = `
  @keyframes ad-spin { to { transform: rotate(360deg); } }
  .ad-row { transition: background 0.1s; }
  .ad-row:hover { background: ${T.surfaceHov}; }
`;

// ── Small components ──────────────────────────────────────────────────────────

const Spinner = () => (
  <div
    style={{
      width: 26,
      height: 26,
      borderRadius: "50%",
      border: `2.5px solid ${T.accentLight}`,
      borderTopColor: T.accent,
      animation: "ad-spin 0.75s linear infinite",
      margin: "0 auto",
    }}
  />
);

const Th = ({ children, width }) => (
  <th
    style={{
      padding: "11px 16px",
      textAlign: "left",
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 700,
      color: T.textMuted,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      borderBottom: `1px solid ${T.border}`,
      background: T.surfaceAlt,
      width,
    }}
  >
    {children}
  </th>
);

const ActionBtn = ({ children, color, bg, border, title, onClick }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    title={title}
    aria-label={title}
    style={{
      width: 30,
      height: 30,
      borderRadius: 7,
      background: bg,
      border: `1px solid ${border}`,
      color,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </motion.button>
);

const GhostBtn = ({ onClick, children, accent, icon: Icon, disabled }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: accent ? 600 : 500,
        color: accent ? "#fff" : hov ? T.text : T.textSub,
        background: accent ? T.accent : hov ? T.surfaceHov : T.surface,
        border: `1px solid ${accent ? T.accent : hov ? T.borderMed : T.border}`,
        borderRadius: 9,
        padding: "8px 16px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        outline: "none",
        transition: "all 0.13s",
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};

const Muted = ({ children }) => (
  <span style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
    {children}
  </span>
);

/** Banner chế độ lịch phát (Cố định / Ngẫu nhiên) */
const ScheduleModeBanner = ({ settings, onConfigure }) => {
  const random = isRandomSchedule(settings);
  const weights = settings.preRollWeights ?? [];
  const weightSum = weights.reduce((a, w) => a + w, 0);
  const avgPre =
    weightSum > 0 ? weights.reduce((a, w, i) => a + i * w, 0) / weightSum : 0;
  const summary = random
    ? `Pre-roll TB ~${avgPre.toFixed(1)} ad · mid-roll mỗi ~${Math.round(settings.midRollIntervalRatio * 100)}% thời lượng (tối đa ${settings.maxMidRolls}) · post-roll ${Math.round(settings.postRollChance * 100)}%`
    : "Phát đúng Global Slot / Override đã gắn cho từng quảng cáo";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        padding: "12px 16px",
        marginBottom: 18,
        borderRadius: 12,
        background: random ? T.accentLight : T.surface,
        border: `1px solid ${random ? `${T.accent}44` : T.border}`,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          flexShrink: 0,
          background: random ? T.accent : T.surfaceAlt,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Shuffle size={16} color={random ? "#fff" : T.textMuted} />
      </div>
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 13.5,
            fontWeight: 700,
            color: T.text,
            margin: 0,
          }}
        >
          Chế độ lịch phát: {random ? "Ngẫu nhiên (kiểu YouTube)" : "Cố định"}
        </p>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 12,
            color: T.textMuted,
            margin: "2px 0 0",
          }}
        >
          {summary}
        </p>
      </div>
      <GhostBtn onClick={onConfigure} accent={!random} icon={Shuffle}>
        Cấu hình lịch phát
      </GhostBtn>
    </div>
  );
};

const FilterTabs = ({ value, onChange }) => (
  <div
    style={{
      display: "flex",
      gap: 4,
      background: T.surfaceAlt,
      borderRadius: 10,
      padding: 3,
      border: `1px solid ${T.border}`,
    }}
  >
    {FILTER_OPTS.map((opt) => {
      const on = value === opt.value;
      return (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: "5px 14px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontFamily: FONT,
            fontSize: 12.5,
            fontWeight: on ? 700 : 500,
            background: on ? T.surface : "transparent",
            color: on ? T.text : T.textSub,
            boxShadow: on ? T.shadow : "none",
            transition: "all 0.15s",
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// ── Row ───────────────────────────────────────────────────────────────────────

const AdRow = memo(function AdRow({ ad, index, toggling, onToggle, onOpen }) {
  const slotCount = ad.globalSlotCount;
  return (
    <motion.tr
      className="ad-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index, 12) * 0.025 }}
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      {/* Tên + ảnh nhãn hiệu */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            title={ad.brandImageUrl ? "Ảnh nhãn hiệu" : undefined}
            style={{
              width: 56,
              height: 36,
              borderRadius: 7,
              overflow: "hidden",
              flexShrink: 0,
              background: ad.brandImageUrl
                ? "#fff"
                : `linear-gradient(135deg, ${T.accentLight}, ${T.surfaceAlt})`,
              border: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {ad.brandImageUrl ? (
              <img
                src={ad.brandImageUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: 4,
                  boxSizing: "border-box",
                }}
              />
            ) : (
              <Play size={14} color={T.accent} style={{ opacity: 0.7 }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              title={ad.title}
              style={{
                fontFamily: FONT,
                fontSize: 13.5,
                fontWeight: 600,
                color: T.text,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 280,
              }}
            >
              {ad.title}
            </p>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 11,
                color: T.textMuted,
                margin: "2px 0 0",
              }}
            >
              ID: {ad.id?.slice(0, 8)}…
            </p>
          </div>
        </div>
      </td>

      {/* Thời lượng */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={12} color={T.textMuted} />
          <span
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: T.textSub,
              fontWeight: 600,
            }}
          >
            {fmtDuration(ad.durationSeconds)}
          </span>
        </div>
      </td>

      {/* Skip */}
      <td style={{ padding: "12px 16px" }}>
        {ad.skipAfterSeconds != null ? (
          <span style={{ fontFamily: FONT, fontSize: 13, color: T.textSub }}>
            sau {ad.skipAfterSeconds}s
          </span>
        ) : (
          <Muted>Không skip</Muted>
        )}
      </td>

      {/* Trạng thái (bấm để bật / tắt) */}
      <td style={{ padding: "12px 16px" }}>
        <button
          type="button"
          onClick={() => onToggle(ad)}
          disabled={toggling}
          title={ad.isActive ? "Bấm để tạm dừng" : "Bấm để kích hoạt"}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: toggling ? "wait" : "pointer",
            opacity: toggling ? 0.6 : 1,
          }}
        >
          <AdStatusBadge isActive={ad.isActive} />
        </button>
      </td>

      {/* Số global slot */}
      <td style={{ padding: "12px 16px" }}>
        {slotCount > 0 ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: FONT,
              fontSize: 13,
              color: T.textSub,
              fontWeight: 600,
            }}
          >
            <CalendarRange size={12} color={T.accent} />
            {slotCount}
          </span>
        ) : (
          <Muted>—</Muted>
        )}
      </td>

      {/* Click URL */}
      <td style={{ padding: "12px 16px", maxWidth: 160 }}>
        {ad.clickThroughUrl ? (
          <a
            href={ad.clickThroughUrl}
            target="_blank"
            rel="noreferrer"
            title={ad.clickThroughUrl}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: FONT,
              fontSize: 11.5,
              color: T.blue,
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 140,
            }}
          >
            <Link size={11} style={{ flexShrink: 0 }} />
            {ad.clickThroughUrl.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <Muted>—</Muted>
        )}
      </td>

      {/* Thao tác */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 5 }}>
          <ActionBtn
            color={T.textSub}
            bg={T.surfaceAlt}
            border={T.border}
            title="Xem chi tiết"
            onClick={() => onOpen("detail", ad)}
          >
            <Eye size={13} />
          </ActionBtn>
          <ActionBtn
            color={T.accent}
            bg={T.accentLight}
            border={`${T.accent}33`}
            title="Gắn lịch phát"
            onClick={() => onOpen("schedule", ad)}
          >
            <CalendarRange size={13} />
          </ActionBtn>
          <ActionBtn
            color={T.blue}
            bg="rgba(37,99,235,0.07)"
            border="rgba(37,99,235,0.2)"
            title="Chỉnh sửa"
            onClick={() => onOpen("edit", ad)}
          >
            <Pencil size={13} />
          </ActionBtn>
          <ActionBtn
            color={T.red}
            bg="#FEF2F2"
            border="rgba(220,38,38,0.2)"
            title="Xóa"
            onClick={() => onOpen("delete", ad)}
          >
            <Trash2 size={13} />
          </ActionBtn>
        </div>
      </td>
    </motion.tr>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminAds() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Bộ lọc
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(undefined); // undefined = tất cả
  const [page, setPage] = useState(1);

  // null | { type: "create" | "edit" | "delete" | "detail" | "schedule" | "settings", ad?: Ad }
  const [dialog, setDialog] = useState(null);
  const openDialog = useCallback(
    (type, ad = null) => setDialog({ type, ad }),
    [],
  );
  const closeDialog = useCallback(() => setDialog(null), []);

  // ── Dữ liệu ────────────────────────────────────────────────────────────────
  const refresh = useRefreshAds();
  const setScheduleSettings = useSetScheduleSettings();
  const { toggleActive } = useAdMutations();
  const adsQ = useAdminAds({
    page,
    pageSize: PAGE_SIZE,
    search,
    isActive: filterActive,
  });
  const { data: schedSettings } = useAdScheduleSettings();

  const ads = adsQ.data?.items ?? [];
  const total = adsQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const loading = adsQ.isPending;
  const loadError = adsQ.isError && !adsQ.data; // refetch nền lỗi thì giữ dữ liệu cũ
  const togglingId = toggleActive.isPending ? toggleActive.variables?.id : null;

  // Báo lỗi một lần cho mỗi lần tải thất bại khi chưa có dữ liệu
  useEffect(() => {
    if (loadError) {
      console.error(adsQ.error);
      toastRef.current?.error?.(
        getApiErrorMessage(adsQ.error, "Không tải được danh sách quảng cáo"),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adsQ.errorUpdatedAt, loadError]);

  // Tìm kiếm có debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const v = searchInput.trim();
      setSearch((prev) => {
        if (prev !== v) setPage(1);
        return v;
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Xoá bớt khiến trang hiện tại vượt quá → lùi về trang cuối
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const changeFilter = (value) => {
    setFilterActive(value);
    setPage(1);
  };

  const handleToggleActive = useCallback(
    async (ad) => {
      try {
        await toggleActive.mutateAsync(ad);
        toastRef.current?.success?.(
          ad.isActive
            ? `Đã tạm dừng "${ad.title}"`
            : `Đã kích hoạt "${ad.title}"`,
        );
      } catch (e) {
        console.error(e);
        toastRef.current?.error?.(
          getApiErrorMessage(e, "Không thể đổi trạng thái quảng cáo"),
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toggleActive.mutateAsync],
  );

  const handleCreated = () => {
    closeDialog();
    setPage(1);
    refresh();
  };

  const handleSaved = () => {
    closeDialog();
    refresh();
  };

  const handleDeleted = () => {
    closeDialog();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const dialogAd = (type) => (dialog?.type === type ? dialog.ad : null);

  return (
    <div style={{ padding: 28, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>
      <style>{CSS}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 24,
              fontWeight: 800,
              color: T.text,
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            Quảng cáo
          </h2>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: T.textMuted,
              margin: "4px 0 0",
            }}
          >
            Quản lý video quảng cáo và lịch phát trên nội dung
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <GhostBtn
            onClick={refresh}
            icon={RefreshCw}
            disabled={adsQ.isFetching}
          >
            Làm mới
          </GhostBtn>
          <GhostBtn onClick={() => openDialog("create")} accent icon={Plus}>
            Thêm quảng cáo
          </GhostBtn>
        </div>
      </div>

      {schedSettings && (
        <ScheduleModeBanner
          settings={schedSettings}
          onConfigure={() => openDialog("settings")}
        />
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 180 }}>
          <Search
            size={14}
            color={T.textMuted}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên quảng cáo..."
            aria-label="Tìm quảng cáo"
            style={{
              width: "100%",
              height: 38,
              padding: "0 12px 0 34px",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              fontFamily: FONT,
              fontSize: 13,
              color: T.text,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = T.borderFocus;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = T.border;
            }}
          />
        </div>

        <FilterTabs value={filterActive} onChange={changeFilter} />

        <p
          style={{
            fontFamily: FONT,
            fontSize: 12.5,
            color: T.textMuted,
            margin: "0 0 0 auto",
            whiteSpace: "nowrap",
          }}
        >
          {total.toLocaleString("vi-VN")} quảng cáo
        </p>
      </div>

      {/* Table */}
      <div
        style={{
          background: T.surface,
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}
          >
            <thead>
              <tr>
                {COLUMNS.map((c, i) => (
                  <Th key={i} width={c.width}>
                    {c.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    style={{ padding: "64px 0", textAlign: "center" }}
                  >
                    <Spinner />
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    style={{ padding: "48px 0", textAlign: "center" }}
                  >
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: 13,
                        color: T.red,
                        margin: "0 0 12px",
                      }}
                    >
                      Không tải được danh sách quảng cáo.
                    </p>
                    <GhostBtn onClick={() => adsQ.refetch()}>Thử lại</GhostBtn>
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    style={{ padding: "56px 0", textAlign: "center" }}
                  >
                    <MonitorPlay
                      size={28}
                      color={T.textMuted}
                      style={{
                        margin: "0 auto 10px",
                        display: "block",
                        opacity: 0.35,
                      }}
                    />
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: 13,
                        color: T.textMuted,
                        margin: 0,
                      }}
                    >
                      {search || filterActive !== undefined
                        ? "Không có quảng cáo nào khớp bộ lọc"
                        : "Chưa có quảng cáo nào"}
                    </p>
                  </td>
                </tr>
              ) : (
                ads.map((ad, i) => (
                  <AdRow
                    key={ad.id}
                    ad={ad}
                    index={i}
                    toggling={togglingId === ad.id}
                    onToggle={handleToggleActive}
                    onOpen={openDialog}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !loadError && totalPages > 1 && (
          <div
            style={{
              borderTop: `1px solid ${T.border}`,
              padding: "0 18px 16px",
            }}
          >
            <AdminPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="quảng cáo"
              isFetching={adsQ.isFetching}
            />
          </div>
        )}
      </div>

      {/* Modals / panels */}
      <AdCreateModal
        open={dialog?.type === "create"}
        onClose={closeDialog}
        onCreated={handleCreated}
      />

      <AdEditModal
        ad={dialogAd("edit")}
        onClose={closeDialog}
        onSaved={handleSaved}
      />

      <AdDeleteModal
        ad={dialogAd("delete")}
        onClose={closeDialog}
        onDeleted={handleDeleted}
      />

      <AdScheduleModal
        ad={dialogAd("schedule")}
        open={dialog?.type === "schedule"}
        onClose={closeDialog}
        onScheduled={refresh}
        onOpenSettings={() => openDialog("settings")}
      />

      <AdScheduleSettingsModal
        open={dialog?.type === "settings"}
        onClose={closeDialog}
        onSaved={setScheduleSettings}
      />

      <AnimatePresence>
        {dialog?.type === "detail" && (
          <React.Fragment key="detail">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDialog}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.25)",
                zIndex: 199,
                backdropFilter: "blur(2px)",
              }}
            />
            <AdDetailPanel
              ad={dialog.ad}
              onClose={closeDialog}
              onEdit={(ad) => openDialog("edit", ad)}
              onSchedule={(ad) => openDialog("schedule", ad)}
            />
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}

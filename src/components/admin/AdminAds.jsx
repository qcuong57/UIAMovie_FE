// src/components/admin/AdminAds.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Search,
  Eye,
  Pencil,
  Trash2,
  Play,
  ToggleLeft,
  ToggleRight,
  Clock,
  Link,
  AlertCircle,
  MonitorPlay,
  CalendarRange,
} from "lucide-react";
import adService from "../../services/adService";
import {
  T,
  FONT_BODY as FONT,
  FONT_TITLE,
  ADMIN_GOOGLE_FONTS,
} from "../../context/adminTokens";
import { fmtDuration } from "../../helper/format";
import { usePagination } from "../../hooks/usePagination";
import AdminPagination from "../common/AdminPagination";
import AdCreateModal from "./ads/AdCreateModal";
import AdEditModal from "./ads/AdEditModal";
import AdDeleteModal from "./ads/AdDeleteModal";
import AdDetailPanel from "./ads/AdDetailPanel";
import AdScheduleModal from "./ads/AdScheduleModal";

const PAGE_SIZE = 15;

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <>
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        border: `2.5px solid ${T.accentLight}`,
        borderTopColor: T.accent,
        animation: "spin 0.75s linear infinite",
        margin: "0 auto",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ isActive }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 9px",
      borderRadius: 20,
      background: isActive ? "#F0FDF4" : T.surfaceAlt,
      border: `1px solid ${isActive ? "rgba(22,163,74,0.25)" : T.border}`,
      fontFamily: FONT,
      fontSize: 11.5,
      fontWeight: 700,
      color: isActive ? "#16A34A" : T.textMuted,
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: isActive ? "#16A34A" : T.textMuted,
        flexShrink: 0,
      }}
    />
    {isActive ? "Đang chạy" : "Tạm dừng"}
  </span>
);

// ── Th ────────────────────────────────────────────────────────────────────────
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

// ── ActionBtn ─────────────────────────────────────────────────────────────────
function ActionBtn({ children, color, bg, border, title, onClick, disabled }) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.08 }}
      whileTap={{ scale: disabled ? 1 : 0.92 }}
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        background: bg,
        border: `1px solid ${border}`,
        cursor: disabled ? "not-allowed" : "pointer",
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "filter 0.15s",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.filter = "brightness(0.93)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "brightness(1)";
      }}
    >
      {children}
    </motion.button>
  );
}

// ── GhostBtn ──────────────────────────────────────────────────────────────────
const GhostBtn = ({ onClick, children, accent, icon: Icon }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
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
        cursor: "pointer",
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

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminAds() {
  const [ads, setAds] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(undefined); // undefined=all, true, false
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editAd, setEditAd] = useState(null);
  const [deleteAd, setDeleteAd] = useState(null);
  const [detailAd, setDetailAd] = useState(null);
  const [scheduleAd, setScheduleAd] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchAds = useCallback(
    async (pg = page) => {
      setLoading(true);
      try {
        const res = await adService.getAds({
          page: pg,
          pageSize: PAGE_SIZE,
          search: search.trim(),
          isActive: filterActive,
        });
        const items = Array.isArray(res)
          ? res
          : (res?.items ?? res?.data?.items ?? []);
        const tot = res?.total ?? res?.data?.total ?? items.length;
        setAds(items);
        setTotal(tot);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [page, search, filterActive],
  );

  useEffect(() => {
    fetchAds(page);
  }, [page]);

  // Reset page + refetch on filter change
  useEffect(() => {
    setPage(1);
    fetchAds(1);
  }, [search, filterActive]);

  const handleToggleActive = async (ad) => {
    setTogglingId(ad.id);
    try {
      await adService.updateAd(ad.id, { isActive: !ad.isActive });
      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, isActive: !a.isActive } : a)),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  const FILTER_OPTS = [
    { label: "Tất cả", value: undefined },
    { label: "Đang chạy", value: true },
    { label: "Tạm dừng", value: false },
  ];

  return (
    <div style={{ padding: 28, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
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
              fontSize: 22,
              fontWeight: 700,
              color: T.text,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Quảng cáo
          </h2>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: T.textMuted,
              marginTop: 4,
            }}
          >
            Quản lý video quảng cáo và lịch phát trên nội dung
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <GhostBtn onClick={() => fetchAds(page)} icon={RefreshCw}>
            Làm mới
          </GhostBtn>
          <GhostBtn onClick={() => setShowCreate(true)} accent icon={Plus}>
            Thêm quảng cáo
          </GhostBtn>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search */}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên quảng cáo..."
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
            onFocus={(e) => (e.target.style.borderColor = T.borderFocus)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>

        {/* Status filter */}
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
          {FILTER_OPTS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setFilterActive(opt.value)}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: 12.5,
                fontWeight: filterActive === opt.value ? 700 : 500,
                background:
                  filterActive === opt.value ? T.surface : "transparent",
                color: filterActive === opt.value ? T.text : T.textSub,
                boxShadow: filterActive === opt.value ? T.shadow : "none",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p
          style={{
            fontFamily: FONT,
            fontSize: 12.5,
            color: T.textMuted,
            marginLeft: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {total} quảng cáo
        </p>
      </div>

      {/* ── Table ── */}
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
                <Th>Quảng cáo</Th>
                <Th width={110}>Thời lượng</Th>
                <Th width={100}>Bỏ qua sau</Th>
                <Th width={130}>Trạng thái</Th>
                <Th width={100}>Lịch phát</Th>
                <Th width={160}>Click URL</Th>
                <th
                  style={{
                    padding: "11px 16px",
                    borderBottom: `1px solid ${T.border}`,
                    background: T.surfaceAlt,
                    width: 170,
                  }}
                />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: "64px 0", textAlign: "center" }}
                  >
                    <Spinner />
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                      }}
                    >
                      Chưa có quảng cáo nào
                    </p>
                  </td>
                </tr>
              ) : (
                ads.map((ad, i) => (
                  <motion.tr
                    key={ad.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025 }}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.surfaceHov)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* Ad name + thumbnail */}
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        {/* Video thumbnail placeholder */}
                        <div
                          style={{
                            width: 56,
                            height: 36,
                            borderRadius: 7,
                            overflow: "hidden",
                            flexShrink: 0,
                            background: `linear-gradient(135deg, ${T.accentLight}, ${T.surfaceAlt})`,
                            border: `1px solid ${T.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                        >
                          {ad.thumbnailUrl ? (
                            <img
                              src={ad.thumbnailUrl}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Play
                              size={14}
                              color={T.accent}
                              style={{ opacity: 0.7 }}
                            />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontFamily: FONT,
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: T.text,
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
                              marginTop: 2,
                            }}
                          >
                            ID: {ad.id?.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
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

                    {/* Skip after */}
                    <td style={{ padding: "12px 16px" }}>
                      {ad.skipAfterSeconds != null ? (
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: 13,
                            color: T.textSub,
                          }}
                        >
                          sau {ad.skipAfterSeconds}s
                        </span>
                      ) : (
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: 13,
                            color: T.textMuted,
                          }}
                        >
                          Không skip
                        </span>
                      )}
                    </td>

                    {/* Status + toggle */}
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => handleToggleActive(ad)}
                        disabled={togglingId === ad.id}
                        title={
                          ad.isActive ? "Bấm để tạm dừng" : "Bấm để kích hoạt"
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: togglingId === ad.id ? "wait" : "pointer",
                          padding: 0,
                          opacity: togglingId === ad.id ? 0.6 : 1,
                        }}
                      >
                        <StatusBadge isActive={ad.isActive} />
                      </button>
                    </td>

                    {/* Global slot count */}
                    <td style={{ padding: "12px 16px" }}>
                      {ad.globalSlotCount != null ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontFamily: FONT,
                            fontSize: 13,
                            color: ad.globalSlotCount > 0 ? T.textSub : T.textMuted,
                            fontWeight: ad.globalSlotCount > 0 ? 600 : 400,
                          }}
                        >
                          <CalendarRange
                            size={12}
                            color={ad.globalSlotCount > 0 ? T.accent : T.textMuted}
                          />
                          {ad.globalSlotCount > 0 ? ad.globalSlotCount : "—"}
                        </span>
                      ) : (
                        <span style={{ color: T.textMuted, fontSize: 13 }}>—</span>
                      )}
                    </td>

                    {/* Click URL */}
                    <td style={{ padding: "12px 16px", maxWidth: 160 }}>
                      {ad.clickThroughUrl ? (
                        <a
                          href={ad.clickThroughUrl}
                          target="_blank"
                          rel="noreferrer"
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
                        <span style={{ color: T.textMuted, fontSize: 13 }}>
                          —
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <ActionBtn
                          color={T.textSub}
                          bg={T.surfaceAlt}
                          border={T.border}
                          title="Xem chi tiết"
                          onClick={() => setDetailAd(ad)}
                        >
                          <Eye size={13} />
                        </ActionBtn>
                        <ActionBtn
                          color={T.accent}
                          bg={T.accentLight}
                          border={`${T.accent}33`}
                          title="Gắn lịch phát"
                          onClick={() => setScheduleAd(ad)}
                        >
                          <CalendarRange size={13} />
                        </ActionBtn>
                        <ActionBtn
                          color={T.blue}
                          bg="rgba(37,99,235,0.07)"
                          border="rgba(37,99,235,0.2)"
                          title="Chỉnh sửa"
                          onClick={() => setEditAd(ad)}
                        >
                          <Pencil size={13} />
                        </ActionBtn>
                        <ActionBtn
                          color={T.red}
                          bg="#FEF2F2"
                          border="rgba(220,38,38,0.2)"
                          title="Xóa"
                          onClick={() => setDeleteAd(ad)}
                        >
                          <Trash2 size={13} />
                        </ActionBtn>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {total > PAGE_SIZE && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            marginTop: 18,
          }}
        >
          {Array.from(
            { length: Math.ceil(total / PAGE_SIZE) },
            (_, i) => i + 1,
          ).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: `1px solid ${page === p ? T.accent : T.border}`,
                background: page === p ? T.accent : T.surface,
                color: page === p ? "#fff" : T.textSub,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: page === p ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Modals / panels ── */}
      <AdCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          fetchAds(1);
          setPage(1);
        }}
      />

      <AdEditModal
        ad={editAd}
        onClose={() => setEditAd(null)}
        onSaved={(updated) => {
          setAds((prev) =>
            prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
          );
          setEditAd(null);
        }}
      />

      <AdDeleteModal
        ad={deleteAd}
        onClose={() => setDeleteAd(null)}
        onDeleted={(id) => {
          setAds((prev) => prev.filter((a) => a.id !== id));
          setTotal((t) => t - 1);
          setDeleteAd(null);
        }}
      />

      <AdScheduleModal
        ad={scheduleAd}
        open={!!scheduleAd}
        onClose={() => setScheduleAd(null)}
        onScheduled={() => {
          setScheduleAd(null);
          fetchAds(page);
        }}
      />

      <AnimatePresence>
        {detailAd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailAd(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.25)",
                zIndex: 199,
                backdropFilter: "blur(2px)",
              }}
            />
            <AdDetailPanel
              ad={detailAd}
              onClose={() => setDetailAd(null)}
              onEdit={(a) => {
                setDetailAd(null);
                setEditAd(a);
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
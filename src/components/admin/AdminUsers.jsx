// src/components/admin/AdminUsers.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  AlertCircle,
  Shield,
  Eye,
  Pencil,
  Search,
  Ban,
  ShieldCheck,
  Crown,
} from "lucide-react";
import AdminPagination from "../common/AdminPagination";
import {
  useAdminUsers,
  useDeleteUser,
  useChangeUserRole,
  useBanUser,
  useUnbanUser,
  useGrantPremium,
  useRevokePremium,
} from "../../hooks/admin/useAdminUsers";
import { useDebouncedValue } from "../../hooks/common/useDebouncedValue";
import { useIsMobile } from "../../hooks/common/useIsMobile";
import authService from "../../services/authService";
import UserDetailPanel from "./user/UserDetailPanel";
import UserEditModal from "./user/UserEditModal";
import { useToast } from "./common/Toast";
import {
  T,
  FONT_BODY as FONT,
  FONT_TITLE,
  ADMIN_GOOGLE_FONTS,
} from "../../context/adminTokens";
import { DeleteModal } from "./user/DeleteModal";
import { BanModal } from "./user/BanModal";
import { UnbanModal } from "./user/UnbanModal";
import { ShieldModal } from "./user/ShieldModal";
import { PremiumModal } from "./user/PremiumModal";
import { MobileUserList } from "./user/MobileUserList";
import { ActionBtn } from "./user/ActionBtn";
import { RoleBadge, SubBadge, BannedBadge } from "./user/badges";
import { errMsg } from "./user/userUtils";

const PAGE_SIZE = 15;
const NO_USERS = []; // tham chiếu ổn định khi chưa có dữ liệu

export default function AdminUsers() {
  // ── UI state (bộ lọc + đích của từng modal) ──────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 350).trim(); // chỉ gọi API khi ngừng gõ
  const [roleFilter, setRoleFilter] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [detailUserId, setDetailUserId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [unbanTarget, setUnbanTarget] = useState(null);
  const [premiumTarget, setPremiumTarget] = useState(null);

  // Trang gắn với chữ ký bộ lọc: đổi bộ lọc → tự về trang 1, KHÔNG cần useEffect (hết cảnh fetch 2 lần).
  const filterSig = `${search}|${roleFilter}|${subFilter}`;
  const [pageState, setPageState] = useState({ sig: filterSig, page: 1 });
  const page = pageState.sig === filterSig ? pageState.page : 1;
  const setPage = (p) => setPageState({ sig: filterSig, page: p });

  // ── Server state (TanStack Query) ────────────────────────────────────────
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search,
    role: roleFilter,
    subscriptionType: subFilter,
  });
  const users = data?.items ?? NO_USERS;
  const total = data?.total ?? 0;
  const loading = isPending; // skeleton chỉ ở lần tải đầu; đổi trang giữ dữ liệu cũ (làm mờ)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const deleteUser = useDeleteUser();
  const changeRole = useChangeUserRole();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const grantPremium = useGrantPremium();
  const revokePremium = useRevokePremium();

  const me = authService.getCurrentUser();
  const toast = useToast();
  const isMobile = useIsMobile();

  // Cache (danh sách + chi tiết) do mutation tự cập nhật; ở đây chỉ lo toast + đóng modal.
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      if (users.length === 1 && page > 1) setPage(page - 1); // xoá người cuối của trang → lùi 1 trang
      setDeleteTarget(null);
      toast.success("Đã xóa người dùng");
    } catch (e) {
      toast.error(errMsg(e, "Xóa người dùng thất bại"));
    }
  };

  const handleRoleChange = async () => {
    if (!roleTarget || !newRole) return;
    try {
      await changeRole.mutateAsync({ id: roleTarget.id, role: newRole });
      setRoleTarget(null);
      toast.success("Đã đổi role người dùng");
    } catch (e) {
      toast.error(errMsg(e, "Đổi role thất bại"));
    }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    try {
      await banUser.mutateAsync({ id: banTarget.id, reason: banReason });
      setBanTarget(null);
      setBanReason("");
      toast.success("Đã khóa tài khoản");
    } catch (e) {
      toast.error(errMsg(e, "Khóa tài khoản thất bại"));
    }
  };

  const handleUnban = async () => {
    if (!unbanTarget) return;
    try {
      await unbanUser.mutateAsync(unbanTarget.id);
      setUnbanTarget(null);
      toast.success("Đã mở khóa tài khoản");
    } catch (e) {
      toast.error(errMsg(e, "Mở khóa thất bại"));
    }
  };

  const handlePremium = async ({ planId, expiredAt, revoke }) => {
    if (!premiumTarget) return;
    try {
      if (revoke) await revokePremium.mutateAsync(premiumTarget.id);
      else
        await grantPremium.mutateAsync({
          userId: premiumTarget.id,
          planId,
          expiredAt,
        });
      setPremiumTarget(null);
      toast.success(revoke ? "Đã thu hồi Premium" : "Đã cập nhật Premium");
    } catch (e) {
      toast.error(errMsg(e, "Có lỗi xảy ra"));
    }
  };

  const COLS = ["Người dùng", "Email", "Role", "Ngày tạo", "Subscription", ""];

  // Handler dùng cho card trên mobile (cùng logic với các nút trong bảng desktop)
  const mobileHandlers = {
    onView: (u) => setDetailUserId(u.id),
    onEdit: (u) => setEditUser(u),
    onRole: (u) => {
      setRoleTarget(u);
      setNewRole(u.role?.toLowerCase() === "admin" ? "User" : "Admin");
    },
    onBan: (u) => {
      setBanTarget(u);
      setBanReason("");
    },
    onUnban: (u) => setUnbanTarget(u),
    onPremium: (u) => setPremiumTarget(u),
    onDelete: (u) => setDeleteTarget(u),
  };

  // ── Derived stats (current page; total from API) ──
  const adminCount = users.filter(
    (u) => u.role?.toLowerCase() === "admin",
  ).length;
  const bannedCount = users.filter((u) => u.isActive === false).length;
  const premiumCount = users.filter(
    (u) => u.subscriptionType && u.subscriptionType !== "none",
  ).length;

  const selectStyle = (hasVal) => ({
    height: 42,
    padding: "0 34px 0 14px",
    borderRadius: 11,
    background: T.surface,
    border: `1px solid ${T.border}`,
    color: hasVal ? T.text : T.textMuted,
    fontFamily: FONT,
    fontSize: 13.5,
    outline: "none",
    cursor: "pointer",
    boxShadow: T.shadow,
    transition: "border-color 0.15s",
    appearance: "none",
  });

  const ChevronSVG = () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.textMuted}
      strokeWidth="2"
      style={{
        position: "absolute",
        right: 11,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  return (
    <div
      data-page=""
      style={{
        padding: isMobile ? "20px 16px 32px" : "28px 32px 64px",
        maxWidth: 1200,
        fontFamily: FONT,
      }}
    >
      <style>{ADMIN_GOOGLE_FONTS}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <p
          style={{
            fontSize: 11.5,
            color: T.textMuted,
            marginBottom: 3,
            fontFamily: FONT,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Quản lý
        </p>
        <h2
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 23,
            fontWeight: 700,
            color: T.text,
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Người dùng
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: T.textMuted,
              letterSpacing: 0,
              fontFamily: FONT,
            }}
          >
            · {total.toLocaleString("vi-VN")}
          </span>
        </h2>
      </div>

      {/* ── Stat chips ── */}
      {!loading && total > 0 && (
        <div
          data-admin-stats=""
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              icon: Shield,
              label: "Admin trên trang",
              short: "Admin",
              value: adminCount,
              accent: T.accent,
            },
            {
              icon: Ban,
              label: "Đã khóa trên trang",
              short: "Đã khóa",
              value: bannedCount,
              accent: T.red,
            },
            {
              icon: Crown,
              label: "Premium trên trang",
              short: "Premium",
              value: premiumCount,
              accent: T.gold,
            },
          ].map(({ icon: Icon, label, short, value, accent }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 12,
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow: T.shadow,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: accent + "15",
                }}
              >
                <Icon size={14} color={accent} />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    color: T.textMuted,
                    marginBottom: 1,
                  }}
                >
                  {isMobile ? short : label}
                </p>
                <p
                  style={{
                    fontFamily: FONT_TITLE,
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.text,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div
        data-admin-filters=""
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search
            size={14}
            color={T.textMuted}
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            placeholder="Tìm theo tên, email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: "100%",
              height: 42,
              padding: "0 14px 0 38px",
              borderRadius: 11,
              background: T.surface,
              border: `1px solid ${T.border}`,
              fontFamily: FONT,
              fontSize: 13.5,
              color: T.text,
              outline: "none",
              boxShadow: T.shadow,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = T.accent + "80")}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>
        <div style={{ position: "relative" }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ ...selectStyle(roleFilter), minWidth: 140 }}
            onFocus={(e) => (e.target.style.borderColor = T.accent + "80")}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          >
            <option value="">Tất cả role</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
          <ChevronSVG />
        </div>
        <div style={{ position: "relative" }}>
          <select
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            style={{ ...selectStyle(subFilter), minWidth: 170 }}
            onFocus={(e) => (e.target.style.borderColor = T.accent + "80")}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          >
            <option value="">{isMobile ? "Tất cả gói" : "Tất cả subscription"}</option>
            <option value="premium">Premium</option>
            <option value="none">Không có gói</option>
          </select>
          <ChevronSVG />
        </div>
      </div>

      {/* ── Table (desktop) / Cards (mobile) ── */}
      {isMobile ? (
        <MobileUserList
          loading={loading}
          isError={isError}
          error={error}
          refetch={refetch}
          users={users}
          isPlaceholderData={isPlaceholderData}
          me={me}
          h={mobileHandlers}
        />
      ) : (
      <div
        style={{
          background: T.surface,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.surfaceAlt }}>
              {COLS.map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 18px",
                    textAlign: "left",
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.textMuted,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            style={{
              opacity: isPlaceholderData ? 0.55 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                  {[200, 180, 80, 90, 130, 90].map((w, j) => (
                    <td key={j} style={{ padding: "15px 18px" }}>
                      <div
                        style={{
                          height: 13,
                          width: w,
                          borderRadius: 6,
                          background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
                          backgroundSize: "400px 100%",
                          animation: "shimmer 1.4s infinite",
                        }}
                      />
                      {j === 0 && (
                        <div
                          style={{
                            height: 11,
                            width: 120,
                            borderRadius: 6,
                            marginTop: 6,
                            background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
                            backgroundSize: "400px 100%",
                            animation: "shimmer 1.4s infinite 0.1s",
                          }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: "56px 0", textAlign: "center" }}
                >
                  <AlertCircle
                    size={22}
                    color={T.red}
                    style={{ margin: "0 auto 10px" }}
                  />
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: 13.5,
                      color: T.red,
                      margin: "0 0 12px",
                    }}
                  >
                    {errMsg(error, "Không tải được danh sách người dùng")}
                  </p>
                  <button
                    onClick={() => refetch()}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 8,
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      cursor: "pointer",
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.textSub,
                    }}
                  >
                    Thử lại
                  </button>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: "64px 0", textAlign: "center" }}
                >
                  <Search
                    size={22}
                    color={T.textMuted}
                    style={{ margin: "0 auto 10px", opacity: 0.3 }}
                  />
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: 13.5,
                      color: T.textMuted,
                    }}
                  >
                    Không tìm thấy user nào
                  </p>
                </td>
              </tr>
            ) : (
              users.map((u, i) => {
                const initials = u.username?.[0]?.toUpperCase() ?? "U";
                const isBanned = u.isActive === false;
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      transition: "background 0.1s",
                      opacity: isBanned ? 0.75 : 1,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.surfaceHov)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "12px 18px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            flexShrink: 0,
                            overflow: "hidden",
                            background: isBanned
                              ? "linear-gradient(135deg, #9CA3AF, #6B7280)"
                              : `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontFamily: FONT,
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#fff",
                              }}
                            >
                              {initials}
                            </span>
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <p
                              style={{
                                fontFamily: FONT,
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: isBanned ? T.textMuted : T.text,
                                margin: 0,
                              }}
                            >
                              {u.username}
                            </p>
                            {isBanned && <BannedBadge />}
                          </div>
                          {u.id === me?.id && (
                            <span
                              style={{
                                fontFamily: FONT,
                                fontSize: 10.5,
                                color: T.accent,
                                fontWeight: 600,
                              }}
                            >
                              Bạn
                            </span>
                          )}
                          {isBanned && u.banReason && (
                            <p
                              style={{
                                fontFamily: FONT,
                                fontSize: 11,
                                color: "#DC2626",
                                marginTop: 1,
                              }}
                              title={u.banReason}
                            >
                              {u.banReason.length > 32
                                ? u.banReason.slice(0, 32) + "…"
                                : u.banReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        fontFamily: FONT,
                        fontSize: 13,
                        color: T.textSub,
                      }}
                    >
                      {u.email}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        fontFamily: FONT,
                        fontSize: 12.5,
                        color: T.textMuted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <SubBadge
                        sub={u.subscriptionType}
                        expiredAt={u.subscriptionExpiredAt}
                      />
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <ActionBtn
                          icon={Eye}
                          onClick={() => setDetailUserId(u.id)}
                          title="Xem chi tiết"
                        />
                        {u.id !== me?.id && (
                          <>
                            <ActionBtn
                              icon={Pencil}
                              variant="edit"
                              onClick={() => setEditUser(u)}
                              title="Chỉnh sửa"
                            />
                            <ActionBtn
                              icon={Shield}
                              variant="shield"
                              onClick={() => {
                                setRoleTarget(u);
                                setNewRole(
                                  u.role?.toLowerCase() === "admin"
                                    ? "User"
                                    : "Admin",
                                );
                              }}
                              title="Đổi role"
                            />
                            {isBanned ? (
                              <ActionBtn
                                icon={ShieldCheck}
                                variant="unban"
                                onClick={() => setUnbanTarget(u)}
                                title="Mở khóa tài khoản"
                              />
                            ) : (
                              <ActionBtn
                                icon={Ban}
                                variant="ban"
                                onClick={() => {
                                  setBanTarget(u);
                                  setBanReason("");
                                }}
                                title="Khóa tài khoản"
                              />
                            )}
                            <ActionBtn
                              icon={Crown}
                              variant="premium"
                              onClick={() => setPremiumTarget(u)}
                              title="Quản lý Premium"
                            />
                            <ActionBtn
                              icon={Trash2}
                              variant="danger"
                              onClick={() => setDeleteTarget(u)}
                              title="Xóa"
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isFetching={isFetching}
        itemLabel="người dùng"
      />

      {/* ── Custom Modals ─────────────────────────────────────────────────────── */}
      <DeleteModal
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteUser.isPending}
      />

      <ShieldModal
        user={roleTarget}
        newRole={newRole}
        onClose={() => setRoleTarget(null)}
        onConfirm={handleRoleChange}
        loading={changeRole.isPending}
      />

      <BanModal
        user={banTarget}
        reason={banReason}
        onReasonChange={setBanReason}
        onClose={() => {
          setBanTarget(null);
          setBanReason("");
        }}
        onConfirm={handleBan}
        loading={banUser.isPending}
      />

      <UnbanModal
        user={unbanTarget}
        onClose={() => setUnbanTarget(null)}
        onConfirm={handleUnban}
        loading={unbanUser.isPending}
      />

      <PremiumModal
        user={premiumTarget}
        onClose={() => setPremiumTarget(null)}
        onConfirm={handlePremium}
        loading={grantPremium.isPending || revokePremium.isPending}
      />

      {/* Detail panel */}
      <AnimatePresence>
        {detailUserId && (
          <UserDetailPanel
            userId={detailUserId}
            onClose={() => setDetailUserId(null)}
            onEdit={(u) => {
              setDetailUserId(null);
              setEditUser(u);
            }}
          />
        )}
      </AnimatePresence>

      <UserEditModal user={editUser} onClose={() => setEditUser(null)} />
    </div>
  );
}
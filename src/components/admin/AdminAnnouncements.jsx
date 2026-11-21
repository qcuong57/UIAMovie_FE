// src/components/admin/AdminAnnouncements.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  RefreshCw,
  Plus,
  Pencil,
  Search,
  ChevronUp,
  ChevronDown,
  Megaphone,
  ExternalLink,
} from 'lucide-react';
import { useAdminAnnouncements } from '../../hooks/admin/useAdminAnnouncements';
import { useToast } from './common/Toast';
import AnnouncementModal from './announcement/AnnouncementModal';
import AnnouncementDeleteModal from './announcement/AnnouncementDeleteModal';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../context/adminTokens';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const PAGE_SIZE = 12;

const SpinnerLight = () => (
  <>
    <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

const Th = ({ children, sortKey, sortBy, sortDir, onSort, width }) => {
  const active = sortBy === sortKey;
  return (
    <th
      onClick={() => sortKey && onSort?.(sortKey)}
      style={{
        padding: '11px 16px',
        textAlign: 'left',
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        color: active ? T.accentText : T.textMuted,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        cursor: sortKey ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        borderBottom: `1px solid ${T.border}`,
        background: T.surfaceAlt,
        width,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortKey && active && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </div>
    </th>
  );
};

const GhostBtn = ({ onClick, children, accent }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: accent ? 600 : 500,
        color: accent ? '#fff' : hov ? T.text : T.textSub,
        background: accent ? T.accent : hov ? T.surfaceHov : T.surface,
        border: `1px solid ${accent ? T.accent : hov ? T.borderMed : T.border}`,
        borderRadius: 9,
        padding: '8px 16px',
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.13s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};

function ActionBtn({ children, color, bg, border, title, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        background: bg,
        border: `1px solid ${border}`,
        cursor: 'pointer',
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'filter 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.93)')}
      onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
    >
      {children}
    </motion.button>
  );
}

const fmtDate = (d) =>
  new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Mobile: mỗi thông báo là một thẻ (thay cho bảng 5 cột)
function MobileAnnouncementList({ loading, items, onEdit, onDelete }) {
  if (loading) return <div style={{ padding: '48px 0', textAlign: 'center' }}><SpinnerLight /></div>;
  if (items.length === 0) {
    return (
      <div style={{ padding: '44px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📢</div>
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, margin: 0 }}>Không tìm thấy thông báo nào</p>
      </div>
    );
  }
  return (
    <div>
      {items.map((item) => (
        <div key={item.id} style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 56, borderRadius: 6, overflow: 'hidden', background: T.bg, flexShrink: 0, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.thumbnailUrl
                ? <img src={item.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Megaphone size={16} color={T.textMuted} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: T.text, margin: 0, wordBreak: 'break-word' }}>{item.title}</p>
              <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, margin: '3px 0 0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
                {item.message}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: 11, fontWeight: 700, color: '#D97706', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              <Megaphone size={11} /> Bản tin hệ thống
            </span>
            <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub }}>{fmtDate(item.createdAt)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={item.linkUrl || '/announcements'}
              target="_blank"
              rel="noreferrer"
              style={{ flex: 1, minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 12, color: T.accentText, textDecoration: 'none', fontWeight: 600 }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.linkUrl || '/announcements'}</span>
              <ExternalLink size={11} style={{ flexShrink: 0 }} />
            </a>
            <button type="button" aria-label="Chỉnh sửa thông báo" onClick={() => onEdit(item)}
              style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, cursor: 'pointer', background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)', color: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={14} />
            </button>
            <button type="button" aria-label="Xóa vĩnh viễn" onClick={() => onDelete(item)}
              style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, cursor: 'pointer', background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnnouncements() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Danh sách lấy qua cache: thêm / sửa / xoá ở modal tự cập nhật, không cần onSaved / onDeleted thủ công.
  const toast = useToast();
  const listQ = useAdminAnnouncements();
  const allAnnouncements = listQ.data ?? [];
  const loading = listQ.isPending;
  // Báo lỗi một lần cho mỗi lần tải thất bại khi chưa có dữ liệu (refetch nền lỗi thì giữ danh sách cũ, im lặng)
  useEffect(() => {
    if (listQ.isError && !listQ.data) {
      toast.error(listQ.error?.response?.data?.message ?? listQ.error?.message ?? 'Không tải được danh sách thông báo');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listQ.errorUpdatedAt]);

  // Lọc + sắp xếp trên BẢN SAO, tính lại khi dữ liệu hoặc bộ lọc đổi
  const filtered = useMemo(() => {
    let list = [...allAnnouncements];

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((a) => a.title?.toLowerCase().includes(s) || a.message?.toLowerCase().includes(s));
    }

    list.sort((a, b) => {
      if (sortBy === 'title') {
        return sortDir === 'asc'
          ? (a.title || '').localeCompare(b.title || '', 'vi')
          : (b.title || '').localeCompare(a.title || '', 'vi');
      }
      if (sortBy === 'createdAt') {
        return sortDir === 'asc'
          ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
          : new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });
    return list;
  }, [allAnnouncements, search, sortBy, sortDir]);

  // Chỉ về trang 1 khi đổi bộ lọc / sắp xếp (refetch nền không nhảy trang đang xem)
  useEffect(() => { setPage(1); }, [search, sortBy, sortDir]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  // Xoá hết bản tin ở trang cuối → lùi về trang cuối còn dữ liệu
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div data-page="" style={{ padding: isMobile ? '20px 16px 32px' : '28px 32px 56px', maxWidth: 1300, fontFamily: FONT }}>
      
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 24, gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Quản trị nội dung
          </p>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            Thông báo & Lịch bảo trì
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.textMuted,
                letterSpacing: 0,
                fontFamily: FONT,
                background: T.surfaceAlt,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '2px 10px',
              }}
            >
              {filtered.length.toLocaleString()}
            </span>
          </h2>
        </div>

        <div data-admin-actions="" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <GhostBtn onClick={() => listQ.refetch()}>
            <RefreshCw size={14} /> Tải lại
          </GhostBtn>
          <GhostBtn
            accent
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            <Plus size={14} /> Phát thông báo
          </GhostBtn>
        </div>
      </div>

      {/* ── Search Control ── */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '0 14px',
            height: 42,
            transition: 'border-color 0.13s',
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = T.borderFocus)}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = T.border)}
        >
          <Search size={15} color={T.textMuted} style={{ flexShrink: 0 }} />
          <input
            placeholder="Tìm theo tiêu đề hoặc nội dung thông báo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: FONT,
              fontSize: 13.5,
              color: T.text,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, lineHeight: 1, fontSize: 18 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Table Container ── */}
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {isMobile ? (
          <MobileAnnouncementList
            loading={loading}
            items={pageItems}
            onEdit={(item) => { setEditingItem(item); setModalOpen(true); }}
            onDelete={setDeleteItem}
          />
        ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th sortKey="title" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>
                  Thông báo
                </Th>
                <Th width={170}>Phân loại</Th>
                <Th sortKey="createdAt" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} width={180}>
                  Ngày đăng
                </Th>
                <Th width={160}>Đích đến</Th>
                <th style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt, width: 100 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '64px 0', textAlign: 'center' }}>
                    <SpinnerLight />
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '56px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📢</div>
                    <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không tìm thấy thông báo nào</p>
                  </td>
                </tr>
              ) : (
                pageItems.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceHov)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Cột 1: Tiêu đề & Thumbnail */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 48,
                            borderRadius: 6,
                            overflow: 'hidden',
                            background: T.bg,
                            flexShrink: 0,
                            border: `1px solid ${T.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Megaphone size={16} color={T.textMuted} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontFamily: FONT,
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: T.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 380,
                              margin: 0,
                            }}
                          >
                            {item.title}
                          </p>
                          <p
                            style={{
                              fontFamily: FONT,
                              fontSize: 12,
                              color: T.textMuted,
                              marginTop: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 380,
                              margin: 0,
                            }}
                          >
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Phân loại */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#D97706',
                          fontFamily: FONT,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Megaphone size={11} />
                        Bản tin hệ thống
                      </span>
                    </td>

                    {/* Cột 3: Ngày tạo */}
                    <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 12.5, color: T.textSub }}>
                      {new Date(item.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Cột 4: Link dẫn tới /announcements */}
                    <td style={{ padding: '12px 16px' }}>
                      <a
                        href={item.linkUrl || '/announcements'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: FONT,
                          fontSize: 12,
                          color: T.accentText,
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        <span>{item.linkUrl || '/announcements'}</span>
                        <ExternalLink size={11} />
                      </a>
                    </td>

                    {/* Cột 5: Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <ActionBtn
                          color={T.blue}
                          bg="rgba(37,99,235,0.07)"
                          border="rgba(37,99,235,0.2)"
                          title="Chỉnh sửa thông báo"
                          onClick={() => {
                            setEditingItem(item);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil size={13} />
                        </ActionBtn>
                        <ActionBtn
                          color={T.red}
                          bg="#FEF2F2"
                          border="rgba(220,38,38,0.2)"
                          title="Xóa vĩnh viễn"
                          onClick={() => setDeleteItem(item)}
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
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-end', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: isMobile ? '10px 18px' : '6px 12px',
              borderRadius: 7,
              border: `1px solid ${T.border}`,
              background: T.surface,
              color: page === 1 ? T.textMuted : T.text,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: 12.5,
              fontFamily: FONT,
            }}
          >
            Trước
          </button>
          <span style={{ fontSize: 12.5, color: T.textMuted, fontFamily: FONT }}>
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: isMobile ? '10px 18px' : '6px 12px',
              borderRadius: 7,
              border: `1px solid ${T.border}`,
              background: T.surface,
              color: page === totalPages ? T.textMuted : T.text,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontSize: 12.5,
              fontFamily: FONT,
            }}
          >
            Sau
          </button>
        </div>
      )}

      {/* Modal Thêm / Sửa */}
      <AnnouncementModal
        open={modalOpen}
        item={editingItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Modal Xác nhận Xóa */}
      <AnnouncementDeleteModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
      />
    </div>
  );
}
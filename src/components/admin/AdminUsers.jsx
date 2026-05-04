// src/components/admin/AdminUsers.jsx  ← REDESIGNED
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle, Shield, Eye, Pencil, Search } from 'lucide-react';
import { Button, Input, Modal, Spinner } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import axiosInstance from '../../config/axios';
import authService from '../../services/authService';
import UserDetailPanel from './user/UserDetailPanel';
import UserEditModal from './user/UserEditModal';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../context/adminTokens';


const PAGE_SIZE = 15;

// ── Role Badge ─────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const isAdmin = role?.toLowerCase() === 'admin';
  return (
    <span style={{
      fontFamily:   FONT, fontSize: 11.5, fontWeight: 600,
      padding:      '3px 10px', borderRadius: 99,
      background:   isAdmin ? T.accentLight : T.bg,
      border:       `1px solid ${isAdmin ? `${T.accent}30` : T.border}`,
      color:        isAdmin ? T.accentText : T.textSub,
      display:      'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {isAdmin && <Shield size={10} strokeWidth={2} />}
      {isAdmin ? 'Admin' : 'User'}
    </span>
  );
};

// ── Action Button ──────────────────────────────────────────────────────────────
const ActionBtn = ({ icon: Icon, onClick, title, variant = 'default' }) => {
  const styles = {
    default:  { bg: T.bg,         border: T.border,                   color: T.textSub    },
    edit:     { bg: '#EFF6FF',    border: 'rgba(59,130,246,0.25)',    color: '#3B82F6'    },
    shield:   { bg: T.accentLight, border: `${T.accent}30`,           color: T.accent     },
    danger:   { bg: '#FEF2F2',    border: 'rgba(220,38,38,0.2)',      color: '#DC2626'    },
  };
  const s = styles[variant];
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      title={title}
      style={{
        width:        30, height: 30,
        borderRadius: 8,
        background:   s.bg,
        border:       `1px solid ${s.border}`,
        cursor:       'pointer', color: s.color,
        display:      'flex', alignItems: 'center', justifyContent: 'center',
        transition:   'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <Icon size={13} strokeWidth={1.8} />
    </motion.button>
  );
};

// ── AdminUsers ─────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users,        setUsers]        = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [roleTarget,   setRoleTarget]   = useState(null);
  const [savingRole,   setSavingRole]   = useState(false);
  const [newRole,      setNewRole]      = useState('');
  const [detailUserId, setDetailUserId] = useState(null);
  const [editUser,     setEditUser]     = useState(null);

  const pagination = usePagination({ total, pageSize: PAGE_SIZE });
  const me = authService.getCurrentUser();

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', page);
      params.append('pageSize', PAGE_SIZE);
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter)    params.append('role', roleFilter);
      const res   = await axiosInstance.get(`/user?${params}`);
      const items = res?.items ?? res?.data?.items ?? (Array.isArray(res) ? res : []);
      const count = res?.totalCount ?? res?.data?.totalCount ?? items.length;
      setUsers(items);
      setTotal(count);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { pagination.goTo(1); fetchUsers(1); }, [search, roleFilter]);
  useEffect(() => { fetchUsers(pagination.page); }, [pagination.page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/user/${deleteTarget.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setTotal(t => t - 1);
      setDeleteTarget(null);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const handleRoleChange = async () => {
    if (!roleTarget || !newRole) return;
    setSavingRole(true);
    try {
      await axiosInstance.patch(`/user/${roleTarget.id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === roleTarget.id ? { ...u, role: newRole } : u));
      setRoleTarget(null);
    } catch (e) { console.error(e); }
    finally { setSavingRole(false); }
  };

  const COLS = ['Người dùng', 'Email', 'Role', 'Ngày tạo', 'Subscription', ''];

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1200, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 3 }}>Quản lý</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
          Người dùng
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500, color: T.textMuted, letterSpacing: 0 }}>
            ({total})
          </span>
        </h2>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} color={T.textMuted} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none',
          }} />
          <input
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width:        '100%', height: 40,
              padding:      '0 14px 0 38px',
              borderRadius: 10,
              background:   T.surface,
              border:       `1px solid ${T.border}`,
              fontFamily:   FONT, fontSize: 13.5,
              color:        T.text, outline: 'none',
            }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{
            height:       40, padding:   '0 14px',
            borderRadius: 10, background: T.surface,
            border:       `1px solid ${T.border}`,
            color:        roleFilter ? T.text : T.textMuted,
            fontFamily:   FONT, fontSize: 13.5,
            outline:      'none', cursor: 'pointer', minWidth: 140,
          }}
        >
          <option value="">Tất cả role</option>
          <option value="Admin">Admin</option>
          <option value="User">User</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        background:   T.surface,
        borderRadius: 16,
        border:       `1px solid ${T.border}`,
        boxShadow:    T.shadow,
        overflow:     'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.surfaceAlt }}>
              {COLS.map(h => (
                <th key={h} style={{
                  padding:       '11px 18px',
                  textAlign:     'left',
                  fontFamily:    FONT, fontSize: 11.5, fontWeight: 600,
                  color:         T.textMuted, letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  borderBottom:  `1px solid ${T.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '56px 0', textAlign: 'center' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  border: `2.5px solid ${T.accentLight}`,
                  borderTopColor: T.accent,
                  animation: 'spin 0.75s linear infinite',
                  margin: '0 auto',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{
                padding: '56px 0', textAlign: 'center',
                fontFamily: FONT, fontSize: 13.5, color: T.textMuted,
              }}>Không tìm thấy user</td></tr>
            ) : users.map((u, i) => {
              const initials = u.username?.[0]?.toUpperCase() ?? 'U';
              return (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Avatar + name */}
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width:        36, height: 36,
                        borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                        background:   `linear-gradient(135deg, ${T.accent}, ${T.accentText})`,
                        display:      'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {u.avatarUrl
                          ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#fff' }}>{initials}</span>
                        }
                      </div>
                      <div>
                        <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text }}>{u.username}</p>
                        {u.id === me?.id && (
                          <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.accent, fontWeight: 600 }}>Bạn</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px', fontFamily: FONT, fontSize: 13, color: T.textSub }}>{u.email}</td>
                  <td style={{ padding: '12px 18px' }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: '12px 18px', fontFamily: FONT, fontSize: 12.5, color: T.textMuted, whiteSpace: 'nowrap' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    {u.subscriptionType ? (
                      <span style={{
                        fontFamily:   FONT, fontSize: 11.5, fontWeight: 600,
                        padding:      '3px 10px', borderRadius: 99,
                        background:   '#FEF9C3', border: '1px solid #FDE047',
                        color:        '#854D0E',
                      }}>
                        {u.subscriptionType}
                      </span>
                    ) : (
                      <span style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <ActionBtn icon={Eye} onClick={() => setDetailUserId(u.id)} title="Xem chi tiết" />
                      {u.id !== me?.id && (
                        <>
                          <ActionBtn icon={Pencil} variant="edit" onClick={() => setEditUser(u)} title="Chỉnh sửa" />
                          <ActionBtn icon={Shield} variant="shield"
                            onClick={() => { setRoleTarget(u); setNewRole(u.role?.toLowerCase() === 'admin' ? 'User' : 'Admin'); }}
                            title="Đổi role"
                          />
                          <ActionBtn icon={Trash2} variant="danger" onClick={() => setDeleteTarget(u)} title="Xóa" />
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination {...pagination.props} itemLabel="user" />

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa user" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Hủy</Button><Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Xóa</Button></>}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }}/>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
            Xóa user <strong style={{ color: T.text }}>{deleteTarget?.username}</strong>? Hành động này không thể hoàn tác.
          </p>
        </div>
      </Modal>

      {/* Role change */}
      <Modal isOpen={!!roleTarget} onClose={() => setRoleTarget(null)} title="Đổi quyền người dùng" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={() => setRoleTarget(null)}>Hủy</Button><Button variant="primary" size="sm" loading={savingRole} onClick={handleRoleChange}>Xác nhận</Button></>}
      >
        <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
          Đổi quyền <strong style={{ color: T.text }}>{roleTarget?.username}</strong> sang{' '}
          <RoleBadge role={newRole} />?
        </p>
      </Modal>

      {/* Detail panel */}
      <AnimatePresence>
        {detailUserId && (
          <UserDetailPanel userId={detailUserId} onClose={() => setDetailUserId(null)}
            onEdit={u => { setDetailUserId(null); setEditUser(u); }}
          />
        )}
      </AnimatePresence>

      <UserEditModal user={editUser} onClose={() => setEditUser(null)}
        onSaved={updated => setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))}
      />
    </div>
  );
}
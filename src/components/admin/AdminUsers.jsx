// src/components/admin/AdminUsers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, AlertCircle, Shield, User, Eye, Pencil } from 'lucide-react';
import { Button, Input, Modal, Spinner } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import axiosInstance from '../../config/axios';
import authService from '../../services/authService';
import UserDetailPanel from './user/UserDetailPanel';
import UserEditModal from './user/UserEditModal';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';

const PAGE_SIZE = 15;

const ROLE_BADGE = {
  admin: { label: 'Admin', bg: 'rgba(229,24,30,0.12)', border: 'rgba(229,24,30,0.3)', color: '#e5181e' },
  user:  { label: 'User',  bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' },
};

const RoleBadge = ({ role }) => {
  const r = ROLE_BADGE[role?.toLowerCase()] ?? ROLE_BADGE.user;
  return (
    <span style={{
      fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 99,
      background: r.bg, border: `1px solid ${r.border}`, color: r.color,
    }}>
      {r.label}
    </span>
  );
};

export default function AdminUsers() {
  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [roleTarget, setRoleTarget] = useState(null); // { id, name, currentRole }
  const [savingRole, setSavingRole] = useState(false);
  const [newRole,    setNewRole]   = useState('');
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
      const res = await axiosInstance.get(`/user?${params}`);
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



  return (
    <div style={{ padding: '36px 40px 64px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Quản lý</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: 'white', margin: 0 }}>
          Người dùng ({total})
        </h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <Input type="search" placeholder="Tìm theo tên, email..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{
          height: 42, padding: '0 12px', borderRadius: 8,
          background: '#111', border: `1px solid ${C.border}`,
          color: roleFilter ? 'white' : 'rgba(255,255,255,0.35)',
          fontFamily: FONT_BODY, fontSize: 13, outline: 'none', cursor: 'pointer',
        }}>
          <option value="">Tất cả role</option>
          <option value="Admin" style={{ background: '#111' }}>Admin</option>
          <option value="User" style={{ background: '#111' }}>User</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Người dùng', 'Email', 'Role', 'Ngày tạo', 'Subscription', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`,
                  background: '#080808',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '48px 0', textAlign: 'center' }}><Spinner size="md" color="red" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px 0', textAlign: 'center', fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Không tìm thấy user</td></tr>
            ) : users.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar + Name */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                      background: 'linear-gradient(135deg,#e5181e,#7a0409)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {u.avatarUrl
                        ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800, color: 'white' }}>{u.username?.[0]?.toUpperCase() ?? 'U'}</span>
                      }
                    </div>
                    <div>
                      <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: 'white' }}>{u.username}</p>
                      {u.id === me?.id && (
                        <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.accent }}>Bạn</span>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}><RoleBadge role={u.role} /></td>
                <td style={{ padding: '12px 16px', fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  {u.subscriptionType ?? '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {/* View detail — all users */}
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setDetailUserId(u.id)}
                      title="Xem chi tiết"
                      style={{
                        width: 30, height: 30, borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
                        cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Eye size={13} />
                    </motion.button>

                    {u.id !== me?.id && (
                      <>
                        {/* Edit */}
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setEditUser(u)}
                          title="Chỉnh sửa"
                          style={{
                            width: 30, height: 30, borderRadius: 6,
                            background: 'rgba(126,174,232,0.08)', border: '1px solid rgba(126,174,232,0.2)',
                            cursor: 'pointer', color: '#7eaee8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Pencil size={13} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => { setRoleTarget(u); setNewRole(u.role?.toLowerCase() === 'admin' ? 'User' : 'Admin'); }}
                          title="Đổi role"
                          style={{
                            width: 30, height: 30, borderRadius: 6,
                            background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
                            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Shield size={13} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteTarget(u)}
                          style={{
                            width: 30, height: 30, borderRadius: 6,
                            background: 'rgba(229,24,30,0.08)', border: `1px solid rgba(229,24,30,0.2)`,
                            cursor: 'pointer', color: C.accent,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </motion.button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination {...pagination.props} itemLabel="user" />

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa user" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Hủy</Button><Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Xóa</Button></>}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            Xóa user <strong style={{ color: 'white' }}>{deleteTarget?.username}</strong>? Hành động này không thể hoàn tác.
          </p>
        </div>
      </Modal>

      {/* Change role confirm */}
      <Modal isOpen={!!roleTarget} onClose={() => setRoleTarget(null)} title="Đổi quyền người dùng" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={() => setRoleTarget(null)}>Hủy</Button><Button variant="primary" size="sm" loading={savingRole} onClick={handleRoleChange}>Xác nhận</Button></>}
      >
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Đổi quyền <strong style={{ color: 'white' }}>{roleTarget?.username}</strong> từ{' '}
          <RoleBadge role={roleTarget?.role} /> sang{' '}
          <RoleBadge role={newRole} />?
        </p>
      </Modal>

      {/* User detail panel */}
      <AnimatePresence>
        {detailUserId && (
          <UserDetailPanel
            userId={detailUserId}
            onClose={() => setDetailUserId(null)}
            onEdit={u => { setDetailUserId(null); setEditUser(u); }}
          />
        )}
      </AnimatePresence>

      {/* User edit modal */}
      <UserEditModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={updated => {
          setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
        }}
      />
    </div>
  );
}
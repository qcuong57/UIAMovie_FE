// src/components/admin/UserEditModal.jsx
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { Button, Input, Modal } from '../../ui';
import { C, FONT_BODY, FONT_DISPLAY } from '../../../context/homeTokens';

const SUBSCRIPTION_OPTIONS = ['Free', 'Basic', 'Premium', 'VIP'];

export default function UserEditModal({ user, onClose, onSaved }) {
  const [form,   setForm]   = useState({ username: '', avatarUrl: '', subscriptionType: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        username:         user.username         ?? '',
        avatarUrl:        user.avatarUrl        ?? '',
        subscriptionType: user.subscriptionType ?? '',
      });
      setError('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!form.username.trim()) { setError('Tên đăng nhập không được để trống'); return; }

    setSaving(true); setError('');
    try {
      await axiosInstance.put(`/user/${user.id}`, {
        username:         form.username.trim() || null,
        avatarUrl:        form.avatarUrl.trim() || null,
        subscriptionType: form.subscriptionType || null,
      });
      onSaved?.({
        ...user,
        username:         form.username.trim(),
        avatarUrl:        form.avatarUrl.trim() || user.avatarUrl,
        subscriptionType: form.subscriptionType || null,
      });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.username?.[0]?.toUpperCase() ?? 'U';

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title={`Chỉnh sửa: ${user?.username ?? ''}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="sm" loading={saving} icon={<Check size={14} />} onClick={handleSave}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* User preview card */}
        <div style={{
          display: 'flex', gap: 14, alignItems: 'center',
          padding: '12px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg,#e5181e,#7a0409)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 900, color: 'white' }}>{initials}</span>
            }
          </div>
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Đang chỉnh sửa</p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'white', fontWeight: 600 }}>{user?.username}</p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{user?.email}</p>
          </div>
        </div>

        {/* Username */}
        <Input
          label="Tên đăng nhập"
          placeholder="Username..."
          value={form.username}
          onChange={v => setForm(f => ({ ...f, username: v }))}
          error={error?.includes('Tên') ? error : ''}
        />

        {/* Avatar URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Avatar URL (tùy chọn)
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              value={form.avatarUrl}
              onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
              placeholder="https://..."
              style={{
                flex: 1, padding: '10px 14px',
                background: '#111', border: `1px solid ${C.border}`,
                borderRadius: 8, color: 'white', outline: 'none',
                fontFamily: FONT_BODY, fontSize: 13,
              }}
            />
            {/* Preview */}
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
              background: 'linear-gradient(135deg,#e5181e,#7a0409)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {form.avatarUrl
                ? <img src={form.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                : <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 900, color: 'white' }}>{initials}</span>
              }
            </div>
          </div>
        </div>

        {/* Subscription type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Subscription
          </label>
          <select
            value={form.subscriptionType}
            onChange={e => setForm(f => ({ ...f, subscriptionType: e.target.value }))}
            style={{
              width: '100%', padding: '10px 14px', height: 42,
              background: '#111', border: `1px solid ${C.border}`,
              borderRadius: 8, color: form.subscriptionType ? 'white' : 'rgba(255,255,255,0.35)',
              fontFamily: FONT_BODY, fontSize: 13, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="" style={{ background: '#111' }}>— Không có —</option>
            {SUBSCRIPTION_OPTIONS.map(s => (
              <option key={s} value={s} style={{ background: '#111' }}>{s}</option>
            ))}
          </select>
        </div>

        {/* Error chung */}
        {error && !error.includes('Tên') && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.accent }}>{error}</p>
        )}

        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
          Chỉ có thể sửa tên đăng nhập, avatar và subscription. Để đổi role dùng nút Shield trong danh sách.
        </p>
      </div>
    </Modal>
  );
}
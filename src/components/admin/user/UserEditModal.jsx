// src/components/admin/user/UserEditModal.jsx  ← REDESIGNED
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { Button, Input, Modal } from '../../ui';

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const T = {
  bg:          '#F4F3EF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#FAFAF8',
  accent:      '#1C5F3A',
  accentLight: '#EAF5EF',
  accentText:  '#155230',
  text:        '#18181B',
  textSub:     '#71717A',
  textMuted:   '#A1A1AA',
  border:      'rgba(0,0,0,0.08)',
};

const SUBSCRIPTION_OPTIONS = ['Free', 'Basic', 'Premium', 'VIP'];

export default function UserEditModal({ user, onClose, onSaved }) {
  const [form,   setForm]   = useState({ username: '', avatarUrl: '', subscriptionType: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (user) {
      setForm({ username: user.username ?? '', avatarUrl: user.avatarUrl ?? '', subscriptionType: user.subscriptionType ?? '' });
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
      onSaved?.({ ...user, username: form.username.trim(), avatarUrl: form.avatarUrl.trim() || user.avatarUrl, subscriptionType: form.subscriptionType || null });
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: FONT }}>

        {/* User preview */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: 'white' }}>{initials}</span>
            }
          </div>
          <div>
            <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Đang chỉnh sửa</p>
            <p style={{ fontSize: 13.5, color: T.text, fontWeight: 600 }}>{user?.username}</p>
            <p style={{ fontSize: 12, color: T.textMuted }}>{user?.email}</p>
          </div>
        </div>

        <Input
          label="Tên đăng nhập"
          placeholder="Username..."
          value={form.username}
          onChange={v => setForm(f => ({ ...f, username: v }))}
          error={error?.includes('Tên') ? error : ''}
        />

        {/* Avatar URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Avatar URL (tùy chọn)
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              value={form.avatarUrl}
              onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
              placeholder="https://..."
              style={{ flex: 1, padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, outline: 'none', fontFamily: FONT, fontSize: 13.5 }}
            />
            {/* Preview */}
            <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg, ${T.accent}, ${T.accentText})`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}` }}>
              {form.avatarUrl
                ? <img src={form.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                : <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: 'white' }}>{initials}</span>
              }
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Subscription
          </label>
          <select value={form.subscriptionType} onChange={e => setForm(f => ({ ...f, subscriptionType: e.target.value }))}
            style={{ width: '100%', padding: '10px 14px', height: 44, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: form.subscriptionType ? T.text : T.textMuted, fontFamily: FONT, fontSize: 13.5, outline: 'none', cursor: 'pointer' }}>
            <option value="">— Không có —</option>
            {SUBSCRIPTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && !error.includes('Tên') && (
          <p style={{ fontFamily: FONT, fontSize: 12, color: '#DC2626' }}>{error}</p>
        )}

        <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, lineHeight: 1.6, padding: '10px 14px', background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
          Chỉ có thể sửa tên đăng nhập, avatar và subscription. Để đổi role dùng nút Shield trong danh sách.
        </p>
      </div>
    </Modal>
  );
}
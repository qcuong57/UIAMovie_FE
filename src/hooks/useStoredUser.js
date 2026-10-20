// src/hooks/useStoredUser.js
import { useSyncExternalStore } from 'react';
import { getStoredUser, subscribeStoredUser } from '../config/sessionStore';

/** Hồ sơ người dùng đã lưu; tự render lại khi đăng nhập/đăng xuất (kể cả từ tab khác). */
export const useStoredUser = () => useSyncExternalStore(subscribeStoredUser, getStoredUser);

/** true nếu đã từng đăng nhập (dựa trên hồ sơ, không phụ thuộc token đã refresh xong hay chưa). */
export const useIsLoggedIn = () => !!useStoredUser();
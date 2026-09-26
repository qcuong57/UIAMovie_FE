// src/hooks/useNotifications.js
import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import notificationService from '../services/notificationService';
import authService from '../services/authService';

const HUB_URL = 'http://localhost:5000/hubs/notifications'; // Hoặc biến môi trường VITE_HUB_URL

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const hubConnectionRef = useRef(null);
  const pollingRef = useRef(null);

  // 1. Tải danh sách & số lượng từ DB
  const refreshNotifications = useCallback(async () => {
    if (!authService.isLoggedIn()) return;
    try {
      const [list, count] = await Promise.all([
        notificationService.getNotifications(15),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      /* noop */
    }
  }, []);

  // 2. Kết nối SignalR Realtime
  useEffect(() => {
    if (!authService.isLoggedIn()) return;

    refreshNotifications();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('accessToken'),
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Tự thử kết nối lại
      .configureLogging(signalR.LogLevel.None)
      .build();

    hubConnectionRef.current = connection;

    connection
      .start()
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));

    // Lắng nghe sự kiện "ReceiveNotification" từ Backend
    connection.on('ReceiveNotification', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      refreshNotifications();
    });

    connection.onreconnecting(() => setIsConnected(false));
    connection.onclose(() => setIsConnected(false));

    return () => {
      connection.stop();
    };
  }, [refreshNotifications]);

  // 3. Fallback Polling: Nếu mất kết nối SignalR, định kỳ gọi API lấy count
  useEffect(() => {
    if (isConnected || !authService.isLoggedIn()) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    // Polling mỗi 45 giây nếu SignalR không online
    pollingRef.current = setInterval(() => {
      notificationService.getUnreadCount().then((count) => setUnreadCount(count));
    }, 45000);

    return () => clearInterval(pollingRef.current);
  }, [isConnected]);

  // Đánh dấu 1 tin đã đọc
  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* noop */
    }
  };

  // Đánh dấu đọc tất cả
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* noop */
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
};
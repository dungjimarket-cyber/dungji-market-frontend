'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationPermissionModal from './NotificationPermissionModal';
import { requestNotificationPermission } from '@/lib/firebase';

/**
 * 로그인 후 알림 권한 요청 핸들러
 * 로그인 성공 시 한 번만 표시, "나중에" 선택 시 24시간 동안 표시 안 함
 */
export default function NotificationPermissionHandler() {
  const { isAuthenticated, user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 브라우저에서 Notification API 지원 여부 확인
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // 로그인 상태가 아니면 표시 안 함
    if (!isAuthenticated || !user) {
      return;
    }

    // 이미 권한이 결정된 경우 (허용/거부) 표시 안 함
    if (Notification.permission !== 'default') {
      return;
    }

    // "나중에" 선택 기록 확인 (24시간)
    const dismissedUntil = localStorage.getItem('notification_permission_dismissed_until');
    if (dismissedUntil && new Date().getTime() < parseInt(dismissedUntil)) {
      return;
    }

    // 모달 표시 (2초 딜레이 - 로그인 직후 너무 급하지 않게)
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  const handleAllow = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        console.log('FCM 토큰 발급 성공:', token);
        // TODO: 서버에 토큰 등록 (필요시)
      }
    } catch (error) {
      console.error('알림 권한 요청 오류:', error);
    }
    setShowModal(false);
  };

  const handleLater = () => {
    // 24시간 동안 표시 안 함
    const dismissedUntil = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem('notification_permission_dismissed_until', dismissedUntil.toString());
    setShowModal(false);
  };

  return (
    <NotificationPermissionModal
      isOpen={showModal}
      onClose={handleLater}
      onAllow={handleAllow}
    />
  );
}

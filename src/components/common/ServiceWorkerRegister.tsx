'use client';

import { useEffect } from 'react';

/**
 * Service Worker 등록 컴포넌트
 * Firebase Cloud Messaging을 위한 Service Worker를 등록합니다.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // next-pwa가 firebase-messaging-sw.js를 자동으로 등록하므로
      // ready 상태만 확인
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('[SW] Service Worker ready:', registration.active?.scriptURL);
        })
        .catch((error) => {
          console.error('[SW] Service Worker error:', error);
        });
    }
  }, []);

  return null;
}

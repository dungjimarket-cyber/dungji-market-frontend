'use client';

import { useEffect } from 'react';

/**
 * Service Worker 등록 컴포넌트
 * next-pwa (sw.js)와 Firebase Messaging (firebase-messaging-sw.js) 두 개의 SW를 관리합니다.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // 1. next-pwa SW (sw.js) - 자동 등록됨
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('[SW] next-pwa ready:', registration.active?.scriptURL);
        })
        .catch((error) => {
          console.error('[SW] next-pwa error:', error);
        });

      // 2. Firebase Messaging SW는 firebase.ts에서 필요 시 등록됨
      console.log('[SW] Firebase Messaging SW는 FCM 토큰 요청 시 등록됩니다.');
    }
  }, []);

  return null;
}

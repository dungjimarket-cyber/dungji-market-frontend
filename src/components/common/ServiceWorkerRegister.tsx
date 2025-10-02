'use client';

import { useEffect } from 'react';

/**
 * Service Worker 등록 컴포넌트
 * Firebase Cloud Messaging을 위한 Service Worker를 등록합니다.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}

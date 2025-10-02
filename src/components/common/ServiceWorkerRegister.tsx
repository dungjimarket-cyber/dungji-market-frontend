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

      // 3. 포그라운드 메시지 리스너 설정 (앱 사용 중 알림)
      const setupForegroundListener = async () => {
        try {
          if (typeof window !== 'undefined') {
            const { initializeApp, getApps } = await import('firebase/app');
            const { getMessaging, onMessage } = await import('firebase/messaging');

            // Firebase 앱 초기화 확인
            let app;
            if (!getApps().length) {
              app = initializeApp({
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
              });
            } else {
              app = getApps()[0];
            }

            const messaging = getMessaging(app);

            // 계속해서 메시지 리스닝
            onMessage(messaging, (payload) => {
              console.log('[Foreground] Message received:', payload);

              // 브라우저 알림 표시
              if (Notification.permission === 'granted') {
                const notificationTitle = payload.notification?.title || '둥지마켓';
                const notificationOptions = {
                  body: payload.notification?.body || '',
                  icon: '/logos/dungji_logo.jpg',
                  badge: '/logos/dungji_logo.jpg',
                  data: payload.data,
                };

                new Notification(notificationTitle, notificationOptions);
              }
            });
          }
        } catch (err) {
          console.log('[Foreground] Setup failed:', err);
        }
      };

      setupForegroundListener();
    }
  }, []);

  return null;
}

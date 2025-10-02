// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyDWp5lj1ujAFJPYk3VLq_BjESmA4pEBV2E',
  authDomain: 'dungji-market.firebaseapp.com',
  projectId: 'dungji-market',
  storageBucket: 'dungji-market.firebasestorage.app',
  messagingSenderId: '813546664780',
  appId: '1:813546664780:web:57c2caf1df5c50e9ca52f0'
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase Messaging 인스턴스
const messaging = firebase.messaging();

// 백그라운드 메시지 수신
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  // data 페이로드에서 title, body 읽기 (중복 알림 방지)
  const notificationTitle = payload.data?.title || '둥지마켓';
  const notificationOptions = {
    body: payload.data?.body || '',
    icon: '/logos/dungji_logo.jpg',
    badge: '/logos/dungji_logo.jpg',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 해당 창으로 이동
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 열린 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

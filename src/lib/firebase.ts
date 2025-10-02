import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let messaging: Messaging | null = null;

// Firebase 초기화
if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
}

// FCM 토큰 가져오기
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    console.log('[FCM] 🔔 알림 권한 요청 시작');
    console.log('[FCM] User Agent:', navigator.userAgent);

    // 브라우저가 알림을 지원하는지 확인
    if (!('Notification' in window)) {
      console.log('[FCM] ❌ 이 브라우저는 알림을 지원하지 않습니다.');
      return null;
    }

    // 1. 먼저 현재 권한 상태 확인
    let permission = Notification.permission;
    console.log('[FCM] 현재 권한 상태:', permission);

    // 2. 아직 결정되지 않은 경우에만 권한 요청
    if (permission === 'default') {
      console.log('[FCM] ⏳ 권한 팝업 표시 중...');
      permission = await Notification.requestPermission();
      console.log('[FCM] 사용자 선택 결과:', permission);
    }

    // 3. 권한 상태에 따라 처리
    if (permission === 'granted') {
      console.log('[FCM] ✅ 알림 권한이 허용되었습니다.');

      // Firebase Messaging 초기화
      if (!messaging && typeof window !== 'undefined') {
        console.log('[FCM] 🔥 Firebase Messaging 초기화 중...');
        messaging = getMessaging(app);
        console.log('[FCM] ✅ Firebase Messaging 초기화 완료');
      }

      // FCM 토큰 가져오기
      console.log('[FCM] 🔑 FCM 토큰 가져오는 중...');
      console.log('[FCM] VAPID Key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20) + '...');

      const token = await getToken(messaging!, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        console.log('[FCM] ✅ FCM 토큰 생성 성공:', token.substring(0, 30) + '...');
        // 로컬스토리지에 토큰 저장
        localStorage.setItem('fcm_token', token);
        return token;
      } else {
        console.log('[FCM] ❌ 토큰을 가져올 수 없습니다.');
        return null;
      }
    } else if (permission === 'denied') {
      console.log('[FCM] ❌ 알림 권한이 거부되었습니다.');
      return null;
    } else {
      console.log('[FCM] ⚠️ 알림 권한 요청이 무시되었습니다.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] ❌ FCM 토큰 가져오기 오류:', error);
    return null;
  }
};

// 포그라운드 메시지 수신 리스너
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging && typeof window !== 'undefined') {
      messaging = getMessaging(app);
    }

    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('포그라운드 메시지 수신:', payload);
        resolve(payload);
      });
    }
  });

// 푸시 토큰 백엔드에 등록
export const registerPushToken = async (token: string): Promise<boolean> => {
  try {
    const { fetchWithAuth } = await import('@/lib/api/fetch');

    // 플랫폼 감지
    let platform = 'web';
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        platform = 'ios';
      } else if (/android/.test(userAgent)) {
        platform = 'android';
      }
    }

    await fetchWithAuth('/notifications/register-token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        platform,
      }),
    });

    console.log('푸시 토큰이 백엔드에 등록되었습니다.');
    return true;
  } catch (error) {
    console.error('푸시 토큰 등록 오류:', error);
    return false;
  }
};

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // next-pwa는 sw.js로 생성, Firebase는 별도 파일 사용
  sw: 'sw.js',
  // PWA 설치 프롬프트 비활성화 (Play Store 앱만 사용)
  disableDevLogs: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true // Disable image optimization for Vercel free tier
  }
};

module.exports = withPWA(nextConfig);
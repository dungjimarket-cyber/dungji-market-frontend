/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: 'k.kakaocdn.net' }, { hostname: 'lh3.googleusercontent.com' }, { hostname: 'image.shop.kt.com' }, { hostname: 'img.danawa.com' }],
  },
  // TypeScript 타입 검사 활성화
}

module.exports = nextConfig

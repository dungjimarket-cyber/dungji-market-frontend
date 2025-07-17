/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: 'k.kakaocdn.net' }, { hostname: 'lh3.googleusercontent.com' }, { hostname: 'image.shop.kt.com' }, { hostname: 'img.danawa.com' }],
    domains: ['k.kakaocdn.net', 'lh3.googleusercontent.com', 'image.shop.kt.com', 'img.danawa.com', 'dungjimarket.s3.amazonaws.com', 'images.samsung.com'],
  },
  // TypeScript 타입 검사 활성화
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: 'k.kakaocdn.net' }, { hostname: 'lh3.googleusercontent.com' }, { hostname: 'image.shop.kt.com' }, { hostname: 'img.danawa.com' }],
  },
}

module.exports = nextConfig

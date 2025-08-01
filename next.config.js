/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { 
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
      { 
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      { 
        protocol: 'https',
        hostname: 'image.shop.kt.com',
      },
      { 
        protocol: 'https',
        hostname: 'img.danawa.com',
      },
      { 
        protocol: 'https',
        hostname: 'dungjimarket.s3.amazonaws.com',
      },
      { 
        protocol: 'https',
        hostname: 'dungjimarket.s3.ap-northeast-2.amazonaws.com',
      },
      { 
        protocol: 'https',
        hostname: 'images.samsung.com',
      },
    ],
  },
  // TypeScript 타입 검사 활성화
}

module.exports = nextConfig

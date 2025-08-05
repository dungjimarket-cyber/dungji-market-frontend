# Vercel 배포 가이드

## 배포 실패 해결 방법

### 1. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

#### 필수 환경 변수
```bash
# API URLs
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app
NEXTAUTH_URL=https://your-frontend-domain.vercel.app

# NextAuth Secrets
NEXTAUTH_SECRET=YQzEcNINK3qhB7ZkL1FoTOEI4lV0jZ2ZObeGqmvN3Pg=
JWT_SECRET=2a826926b4f66a3eb318704fae3f5ac0a0bb0a7f3778e9c4055019e9b79b3fc8
SECRET=5dQKZD4EwMGPdOK1IR3CThpqXpeAusoPi5NeADUI1LI=

# Backend API Key
BACKEND_API_KEY=dkjshdfkjhksjdhfksdjh

# OAuth Providers
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://your-frontend-domain.vercel.app/api/auth/callback/kakao

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3 Configuration
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name
```

### 2. Vercel 설정 단계

1. **Vercel 대시보드 접속**: https://vercel.com/dashboard
2. **프로젝트 선택**: dungji-market-frontend 프로젝트 클릭
3. **Settings 탭**: 프로젝트 설정 페이지로 이동
4. **Environment Variables**: 환경 변수 섹션 클릭
5. **환경 변수 추가**: 위의 모든 환경 변수를 하나씩 추가

### 3. 배포 재시작

환경 변수 설정 후:
1. **Deployments 탭**으로 이동
2. **최신 배포**의 "..." 메뉴 클릭
3. **Redeploy** 선택
4. **Use existing Build Cache** 체크 해제
5. **Redeploy** 버튼 클릭

### 4. 일반적인 배포 실패 원인

- **환경 변수 누락**: 필수 환경 변수가 설정되지 않음
- **잘못된 URL**: localhost URL이 프로덕션에서 사용됨
- **OAuth 리다이렉트 URL**: Kakao/Google OAuth 설정에서 프로덕션 URL로 변경 필요
- **CORS 이슈**: 백엔드에서 프론트엔드 도메인 허용 필요

### 5. 백엔드 설정 확인

백엔드의 `ALLOWED_HOSTS`와 `CORS_ALLOWED_ORIGINS`에 Vercel 도메인 추가:

```python
# Django settings.py
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'your-frontend-domain.vercel.app'
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.vercel.app"
]
```

### 6. OAuth 설정 업데이트

#### Kakao 개발자 콘솔
- 플랫폼 설정 > Web > 사이트 도메인: `https://your-frontend-domain.vercel.app`
- Redirect URI: `https://your-frontend-domain.vercel.app/api/auth/callback/kakao`

#### Google Cloud Console
- Authorized JavaScript origins: `https://your-frontend-domain.vercel.app`
- Authorized redirect URIs: `https://your-frontend-domain.vercel.app/api/auth/callback/google`
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MyPageClient from './MyPageClient';

/**
 * 마이페이지 컴포넌트
 * 사용자 프로필 및 참여 중인 공구 등을 보여줍니다.
 */
export default async function MyPage() {
  // 쿠키에서 JWT 토큰 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  // 토큰이 없으면 로그인 페이지로 리디렉션
  if (!accessToken) {
    redirect('/login');
  }

  return <MyPageClient />;

}

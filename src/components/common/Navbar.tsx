import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { FaHome, FaShoppingCart, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // 화면 크기 변경 감지 및 클라이언트 마운트 체크
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // 로그인 상태 확인 - NextAuth와 localStorage 모두 검사
  useEffect(() => {
    if (!mounted) return;
    
    const checkAuthentication = () => {
      // 1. NextAuth 세션 확인
      const nextAuthAuthenticated = status === 'authenticated' && !!session?.user;
      
      // 2. 다양한 저장소에서 토큰 확인
      let accessToken = null;
      let localUser = null;
      let nextAuthToken = null;
      
      try {
        // 로컬스토리지에서 토큰 확인
        accessToken = localStorage.getItem('accessToken') || 
                      localStorage.getItem('dungji_auth_token') || 
                      localStorage.getItem('auth.token');
        
        // NextAuth 형식의 토큰도 확인
        nextAuthToken = localStorage.getItem('next-auth.session-token');
        
        // 세션 스토리지에서도 확인
        const sessionToken = sessionStorage.getItem('next-auth.session-token');
        
        // 쿠키에서도 확인
        const getCookie = (name: string) => {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name) return value;
          }
          return null;
        };
        
        const cookieToken = getCookie('accessToken') || getCookie('dungji_auth_token');
        
        // 사용자 정보 가져오기
        const userStr = localStorage.getItem('user') || 
                        localStorage.getItem('auth.user') || 
                        sessionStorage.getItem('next-auth.session');
                        
        if (userStr) {
          try {
            localUser = JSON.parse(userStr);
          } catch (e) {
            console.error('사용자 정보 파싱 오류:', e);
          }
        }
        
        // 최종 토큰 결정 (어떤 소스에서든 하나라도 있으면 인증됨)
        const finalToken = accessToken || nextAuthToken || sessionToken || cookieToken;
        
        // 토큰이 있으면 모든 저장소에 중복 저장하여 안정성 확보
        if (finalToken) {
          localStorage.setItem('accessToken', finalToken);
          localStorage.setItem('dungji_auth_token', finalToken);
          localStorage.setItem('auth.token', finalToken);
          localStorage.setItem('auth.status', 'authenticated');
          
          // NextAuth 형식으로도 저장
          localStorage.setItem('next-auth.session-token', finalToken);
          sessionStorage.setItem('next-auth.session-token', finalToken);
        }
      } catch (e) {
        console.error('저장소 접근 오류:', e);
      }
      
      // 로컬 인증 상태 확인
      const localAuthenticated = !!accessToken || !!nextAuthToken;
      
      // 최종 인증 상태 결정 - 둘 중 하나라도 통과하면 인증된 것으로 간주
      const authenticated = nextAuthAuthenticated || localAuthenticated;
      
      setIsAuthenticated(authenticated);
      
      // 사용자 정보 설정 - NextAuth 세션 우선, 없으면 로컬 사용자 정보 사용
      if (session?.user) {
        setUserInfo(session.user);
      } else if (localUser) {
        // 로컬 사용자 정보가 있으면 사용
        const user = localUser.user || localUser;
        setUserInfo(user);
      }
    };
    
    checkAuthentication();
    
    // 스토리지 변경 및 화면 포커스 이벤트 감지
    const handleStorageChange = () => {
      checkAuthentication();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    window.addEventListener('visibilitychange', handleStorageChange);
    
    // 주기적으로 인증 상태 확인 (5초마다)
    const intervalId = setInterval(checkAuthentication, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
      window.removeEventListener('visibilitychange', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [mounted, session, status]);

  // 디버깅용 코드
  console.log('세션 데이터:', session);
  console.log('사용자 정보:', session?.user);
  console.log('로컬 사용자 정보:', userInfo);
  console.log('사용자 역할:', userInfo?.role);
  console.log('최종 인증 상태:', isAuthenticated);

  // hydration mismatch 방지: 클라이언트 마운트 전에는 아무것도 렌더하지 않음
  if (!mounted) return null;

  // 상단 네비게이션 (데스크톱/모바일)
  const TopNavbar = () => {
    if (status === "loading") return null;
    return (
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-800">둥지마켓</span>
              </Link>
            </div>

            {/* 데스크톱: 기존 네비게이션, 모바일: 오른쪽에 공구 등록만 */}
            <div className="flex items-center space-x-4">
              <Link href="/group-purchases" className="text-gray-600 hover:text-gray-900 hidden md:inline">
                공구 목록
              </Link>
              {isMobile ? (
                // 모바일: 사용자 역할에 따라 공구 등록 버튼 표시
                (userInfo?.role !== 'seller' && (
                  <Link href="/group-purchases/create">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-md">
                      <span className="mr-2">+</span>공구 등록
                    </button>
                  </Link>
                ))
              ) : (
                // 데스크톱: 기존 네비게이션 모두 노출
                <>
                  {/* 판매자가 아닌 경우에만 공구 등록 버튼 표시 */}
                  {userInfo?.role !== 'seller' && (
                    <Link href="/group-purchases/create">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <span className="mr-2">+</span>공구 등록
                      </button>
                    </Link>
                  )}
                  {(session || isAuthenticated) ? (
                    <>
                      <Link 
                        href={userInfo?.role === 'seller' ? "/mypage/seller" : "/mypage"} 
                        className="text-gray-600 hover:text-gray-900"
                      >
                        마이페이지
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        로그아웃
                      </button>
                      {/* 닉네임 표시 */}
                      {(session?.user?.name || userInfo?.name) && (
                        <span className="text-gray-700 font-medium">
                          {session?.user?.name || userInfo?.name}
                        </span>
                      )}
                      {/* 프로필 이미지 */}
                      <div className="relative w-8 h-8 overflow-hidden rounded-full border border-gray-200 bg-gray-200">
                        {(session?.user?.image || userInfo?.profile_image) ? (
                          <Image 
                            src={session?.user?.image || userInfo?.profile_image}
                            alt="프로필 이미지"
                            width={32}
                            height={32}
                            className="object-cover"
                            unoptimized // 외부 이미지 URL을 위해 추가
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                            {(session?.user?.name?.[0] || userInfo?.name?.[0] || 'U')}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => signIn()}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        로그인
                      </button>
                      <Link
                        href="/register"
                        className="btn-animated btn-outline"
                      >
                        회원가입
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  };

  // 하단 네비게이션 (모바일)
  const MobileNavbar = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 w-full">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto px-2">
        <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaHome className="text-xl mb-1" />
          <span className="text-xs whitespace-normal text-center">홈</span>
        </Link>
        
        <Link href="/group-purchases" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
          <FaShoppingCart className="text-xl mb-1" />
          <span className="text-xs whitespace-normal text-center leading-tight">공구 목록</span>
        </Link>
        
        {/* 판매자가 아닌 경우에만 공구 등록 버튼 표시 */}
        {userInfo?.role !== 'seller' && (
          <Link href="/group-purchases/create" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
            <span className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-lg mb-1">+</span>
            <span className="text-xs whitespace-normal text-center leading-tight">공구 등록</span>
          </Link>
        )}
        
        {(session || isAuthenticated) ? (
          <>
            <Link href="/my-page" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
              <FaUser className="text-xl mb-1" />
              <span className="text-xs whitespace-normal text-center leading-tight">마이페이지</span>
            </Link>
            
            <button onClick={() => signOut()} className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2 bg-transparent border-0">
              <FaSignOutAlt className="text-xl mb-1" />
              <span className="text-xs whitespace-normal text-center leading-tight">로그아웃</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => signIn()} className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2 bg-transparent border-0">
              <FaSignInAlt className="text-xl mb-1" />
              <span className="text-xs whitespace-normal text-center leading-tight">로그인</span>
            </button>
            
            <Link href="/register" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2">
              <FaUserPlus className="text-xl mb-1" />
              <span className="text-xs whitespace-normal text-center leading-tight">회원가입</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );

  // 모바일 화면에서 하단 네비게이션 여백 추가
  const MobileNavbarSpacer = () => (
    <div className="h-16 w-full"></div>
  );

  return (
    <>
      {isMobile ? (
        <>
          {/* 모바일 화면에서는 상단에 로고와 간단한 네비게이션 */}
          <div className="bg-white shadow-lg p-4 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-800">둥지마켓</span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/group-purchases" className="text-gray-600 hover:text-gray-900">
                  공구 목록
                </Link>
                {session ? (
                  <Link 
                    href={session?.user?.role === 'seller' ? "/mypage/seller" : "/mypage"} 
                    className="text-gray-600 hover:text-gray-900"
                  >
                    마이페이지
                  </Link>
                ) : (
                  <div className="flex space-x-2">
                    <Link href="/login" className="text-gray-600 hover:text-blue-500">
                      로그인
                    </Link>
                    <span className="text-gray-400">|</span>
                    <Link href="/signup" className="text-gray-600 hover:text-blue-500">
                      회원가입
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 하단 네비게이션 */}
          <MobileNavbar />
          
          {/* 페이지 컨텐츠에 하단 네비게이션 높이만큼 여백 추가 */}
          <div className="pb-16"></div>
        </>
      ) : (
        <TopNavbar />
      )}
    </>
  );
}

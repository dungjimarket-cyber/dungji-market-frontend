import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { FaHome, FaShoppingCart, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  // 디버깅용 코드
  console.log('세션 데이터:', session);
  console.log('사용자 정보:', session?.user);
  console.log('프로필 이미지:', session?.user?.image);

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
                // 모바일: 오른쪽 상단에 공구 등록 버튼만
                <Link href="/group-purchases/create">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-md">
                    <span className="mr-2">+</span>공구 등록
                  </button>
                </Link>
              ) : (
                // 데스크톱: 기존 네비게이션 모두 노출
                <>
                  <Link href="/group-purchases/create">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      <span className="mr-2">+</span>공구 등록
                    </button>
                  </Link>
                  {session ? (
                    <>
                      <Link href="/my-page" className="text-gray-600 hover:text-gray-900">
                        마이페이지
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        로그아웃
                      </button>
                      {/* 닉네임 표시 */}
                      {session.user?.name && (
                        <span className="text-gray-700 font-medium">
                          {session.user.name}
                        </span>
                      )}
                      {/* 프로필 이미지 */}
                      <div className="relative w-8 h-8 overflow-hidden rounded-full border border-gray-200 bg-gray-200">
                        {session.user?.image ? (
                          <Image 
                            src={session.user.image}
                            alt="프로필 이미지"
                            width={32}
                            height={32}
                            className="object-cover"
                            unoptimized // 외부 이미지 URL을 위해 추가
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                            {session.user?.name?.[0] || 'U'}
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
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
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
        <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
          <FaHome className="text-xl mb-1" />
          <span className="text-xs">홈</span>
        </Link>
        
        <Link href="/group-purchases" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
          <FaShoppingCart className="text-xl mb-1" />
          <span className="text-xs">공구 목록</span>
        </Link>
        
        {session ? (
          <>
            <Link href="/my-page" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
              <FaUser className="text-xl mb-1" />
              <span className="text-xs">마이페이지</span>
            </Link>
            
            <button onClick={() => signOut()} className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2 bg-transparent border-0">
              <FaSignOutAlt className="text-xl mb-1" />
              <span className="text-xs">로그아웃</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => signIn()} className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2 bg-transparent border-0">
              <FaSignInAlt className="text-xl mb-1" />
              <span className="text-xs">로그인</span>
            </button>
            
            <Link href="/register" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/4 py-2">
              <FaUserPlus className="text-xl mb-1" />
              <span className="text-xs">회원가입</span>
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
                {session && (
                  <Link href="/my-page" className="text-gray-600 hover:text-gray-900">
                    마이페이지
                  </Link>
                )}
                {/* 모바일에서는 로그인/회원가입 버튼 숨김 */}
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

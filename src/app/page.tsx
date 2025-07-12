'use client';

import { useEffect, useState } from 'react';
import Categories from '@/components/Categories';
import Link from 'next/link';
import { GroupPurchaseCard } from '@/components/group-purchase/GroupPurchaseCard';
import { RoleButton } from '@/components/auth/RoleButton';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IoMdClose } from 'react-icons/io';

/**
 * 메인 홈페이지 컴포넌트
 */
/**
 * 공구 정보 인터페이스
 */
interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  product_details: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
    carrier?: string;
    registration_type?: string;
    plan_info?: string;
    contract_info?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    plan_info: string;
    contract_period?: string;
  };
  creator: {
    id: number;
    username: string;
    profile_image?: string;
  };
}

/**
 * 메인 홈페이지 컴포넌트
 */
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [popularGroupBuys, setPopularGroupBuys] = useState<GroupBuy[]>([]);
  const [newGroupBuys, setNewGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIframe, setShowIframe] = useState(false);
  
  // iframe이 열렸을 때 뒤로가기 버튼 처리
  useEffect(() => {
    if (showIframe) {
      // 현재 상태를 history에 추가
      window.history.pushState(null, '', window.location.pathname);
      
      // popstate 이벤트 리스너 추가 (뒤로가기 버튼 클릭 시 발생)
      const handlePopState = () => {
        setShowIframe(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [showIframe]);
  
  useEffect(() => {
    setMounted(true);
    
    // 인기 공구와 새로운 공구 데이터 가져오기
    const fetchGroupBuys = async () => {
      try {
        const [popularResponse, newResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?sort=popular&limit=2`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?sort=newest&limit=2`)
        ]);
        
        if (popularResponse.ok && newResponse.ok) {
          const popularData = await popularResponse.json();
          const newData = await newResponse.json();
          
          setPopularGroupBuys(popularData.slice(0, 2));
          setNewGroupBuys(newData.slice(0, 2));
        }
      } catch (error) {
        console.error('공구 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupBuys();
  }, []);
  
  // 클라이언트 사이드 마운트 전에는 인증 상태를 확인할 수 없음
  const showAuthButtons = mounted ? !isAuthenticated : true;

  return (
    <>
      {/* 모바일 환경에서만 표시되는 헤더 */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      <div className="container mx-auto px-4 py-8">
      {/* iframe 팝업 */}
      {showIframe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] relative">
            <button 
              onClick={() => setShowIframe(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-10"
              aria-label="닫기"
            >
              <IoMdClose size={24} />
            </button>
            <iframe 
              src="https://dungjimarket-guide-wnop7bf.gamma.site/" 
              className="w-full h-full rounded-lg"
              title="둥지마켓 알아보기"
            />
          </div>
        </div>
      )}
      <section className="mb-12">       
        {/* 메인 배너 이미지 */}
        <section className="mb-2">
          <div className="relative w-full overflow-hidden">
            <img 
              src="/images/dungji-banner.png" 
              alt="둥지마켓 메인 배너" 
              className="w-full h-auto object-cover"
            />
            {/* 배너 안쪽 아래쪽에 버튼 이미지 추가 */}
            <div className="absolute bottom-[15%] left-0 right-0 flex justify-center gap-4">
              <Link href="/register">
                <img 
                  src="/button/seller_register_button.png" 
                  alt="판매회원 가입 버튼" 
                  className="h-auto text-sm hover:opacity-90 transition-opacity w-auto items-center justify-center flex"
                  style={{ maxHeight: '64px', height: 'min(64px, 4.5vw)' }}
                />
              </Link>
              <Link href="/group-purchases">
                <img 
                  src="/button/group-purchases_button.png" 
                  alt="공구 둘러보기 버튼" 
                  className="h-auto text-sm hover:opacity-90 transition-opacity w-auto items-center justify-center flex"
                  style={{ maxHeight: '64px', height: 'min(64px, 4.5vw)' }}
                />
              </Link>
            </div>
          </div>
        </section>
        <div className="flex flex-wrap gap-4 mb-6">
          {/* 판매자 역할이 아닐 때만 공구 등록 버튼 표시 - 클라이언트 컴포넌트 */}
          <button
              onClick={() => setShowIframe(!showIframe)}
              className="btn-animated btn-outline whitespace-nowrap px-3 sm:px-4"
              style={{
                minHeight: '48px',
                height: 'min(64px, 4.5vw)', 
                width: 'auto',
                minWidth: '120px',
                fontSize: 'clamp(0.75rem, 2.5vw, 1rem)'
              }}
            >
              <span>둥지마켓 알아보기</span>
          </button>
          <RoleButton 
            href="/group-purchases/create"
            className="btn-animated btn-primary whitespace-nowrap px-3 sm:px-4"
            style={{
              minHeight: '48px',
              height: 'min(64px, 4.5vw)', 
              width: 'auto',
              minWidth: '120px',
              fontSize: 'clamp(0.75rem, 2.5vw, 1rem)'
            }}
            disableForRoles={['seller']}            
          >
            <span>공구 등록하기</span>
          </RoleButton>
        </div>
      </section>

      {/* <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">카테고리</h2>
        <Categories />
      </section> */}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">인기 공동구매</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
            ) : popularGroupBuys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">인기 공동구매가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {popularGroupBuys.map((groupBuy) => (
                  <GroupPurchaseCard key={groupBuy.id} groupBuy={groupBuy} />
                ))}
              </div>
            )}
            <div className="text-center mt-4">
              <Link href="/group-purchases?sort=popular" className="text-blue-600 hover:underline text-sm">
                더 많은 인기 공구 보기 →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">새로운 공동구매</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
            ) : newGroupBuys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">새로운 공동구매가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {newGroupBuys.map((groupBuy) => (
                  <GroupPurchaseCard key={groupBuy.id} groupBuy={groupBuy} />
                ))}
              </div>
            )}
            <div className="text-center mt-4">
              <Link href="/group-purchases?sort=newest" className="text-blue-600 hover:underline text-sm">
                더 많은 새로운 공구 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

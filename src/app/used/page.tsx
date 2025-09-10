/**
 * 중고폰 직거래 메인 페이지
 * /used
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Smartphone, TrendingUp, Shield, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UsedPhoneCard from '@/components/used/UsedPhoneCard';
import UsedPhoneFilter from '@/components/used/UsedPhoneFilter';
import { UsedPhone } from '@/types/used';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';

// 스켈레톤 로더 컴포넌트
const SkeletonCard = () => (
  <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-3">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-full" />
    </div>
  </div>
);

export default function UsedPhonesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const {
    isProfileComplete,
    missingFields,
    checkProfile,
    showProfileModal,
    setShowProfileModal,
  } = useProfileCheck();
  
  const [phones, setPhones] = useState<UsedPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({});
  
  // Intersection Observer를 위한 ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 상품 목록 조회
  const fetchPhones = useCallback(async (pageNum: number, currentFilters: any, reset = false) => {
    try {
      setLoading(true);
      
      // 쿼리 파라미터 생성
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...currentFilters
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      // API URL이 이미 /api 경로를 포함하는지 확인
      const apiUrl = baseUrl.includes('api.dungjimarket.com') 
        ? `${baseUrl}/used/phones/?${params}`
        : `${baseUrl}/api/used/phones/?${params}`;
      const response = await fetch(apiUrl);
      
      // 응답 체크
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // DRF 기본 응답 형식 처리
      const items = Array.isArray(data) ? data : (data.results || data.items || []);
      
      if (reset) {
        setPhones(items);
      } else {
        setPhones(prev => [...prev, ...items]);
      }
      
      // 페이지네이션 정보
      if (data.count !== undefined) {
        setTotalCount(data.count);
        setHasMore(!!data.next);
      } else {
        setTotalCount(items.length);
        setHasMore(items.length >= 20); // limit이 20이므로
      }
      
    } catch (error) {
      console.error('Failed to fetch phones:', error);
      // 에러 발생 시 더 이상 로드하지 않도록 설정
      setHasMore(false);
      toast({
        title: '오류',
        description: '상품을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
    fetchPhones(1, newFilters, true);
  }, [fetchPhones]);

  // 찜하기 핸들러
  const handleFavorite = useCallback(async (phoneId: number) => {
    if (!isAuthenticated) {
      toast({
        title: '로그인 필요',
        description: '찜하기는 로그인 후 이용 가능합니다.',
        variant: 'destructive'
      });
      router.push('/login');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/favorite/`
        : `${baseUrl}/api/used/phones/${phoneId}/favorite/`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // 상태 업데이트
        setPhones(prev => prev.map(phone => 
          phone.id === phoneId 
            ? { ...phone, isFavorite: !phone.isFavorite }
            : phone
        ));
        
        toast({
          title: '찜 완료',
          description: '찜 목록에 추가되었습니다.'
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [isAuthenticated, toast, router]);

  // 무한 스크롤 설정
  useEffect(() => {
    if (loading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchPhones(nextPage, filters);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, filters, fetchPhones]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchPhones(1, {}, true);
  }, []);

  // 프로필 체크 (로그인한 경우)
  useEffect(() => {
    if (isAuthenticated) {
      checkProfile();
    }
  }, [isAuthenticated, checkProfile]);

  // 내 폰 판매하기 버튼 핸들러
  const handleCreateClick = async () => {
    if (!isAuthenticated) {
      toast({
        title: '로그인 필요',
        description: '상품 등록은 로그인 후 이용 가능합니다.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    const profileComplete = await checkProfile();
    if (!profileComplete) {
      setShowProfileModal(true);
      return;
    }

    router.push('/used/create');
  };

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              중고폰 직거래 마켓
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              안전하고 편리한 중고폰 직거래, 수수료 없이 거래하세요
            </p>
            
            {/* 특징 아이콘 */}
            <div className="grid grid-cols-3 gap-4 lg:gap-8 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-2">
                  <Shield className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-700">안전거래</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-2">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-700">가격제안</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-2">
                  <Zap className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-700">빠른거래</p>
              </div>
            </div>

            {/* CTA 버튼 */}
            <Button
              size="lg"
              onClick={handleCreateClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              내 폰 판매하기
            </Button>
          </div>
        </div>
      </section>

      {/* 프로필 미완성 안내 */}
      {isAuthenticated && !isProfileComplete && missingFields.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  상품 등록을 위해 <span className="font-medium">{missingFields.join(', ')}</span> 정보 입력이 필요합니다.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/mypage')}
                className="text-yellow-700 border-yellow-600 hover:bg-yellow-100"
              >
                정보 입력하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 필터 섹션 */}
      <UsedPhoneFilter
        onFilterChange={handleFilterChange}
        totalCount={totalCount}
      />

      {/* 상품 리스트 */}
      <section className="container mx-auto px-4 py-6">
        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {phones.map((phone, index) => (
            <UsedPhoneCard
              key={phone.id}
              phone={phone}
              priority={index < 10} // 첫 10개 이미지 우선 로딩
              onFavorite={handleFavorite}
            />
          ))}
          
          {/* 로딩 스켈레톤 */}
          {loading && phones.length === 0 && (
            <>
              {[...Array(20)].map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </>
          )}
        </div>

        {/* 무한 스크롤 트리거 */}
        {hasMore && !loading && (
          <div ref={loadMoreRef} className="h-10 mt-4" />
        )}

        {/* 추가 로딩 인디케이터 */}
        {loading && phones.length > 0 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span>더 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {!loading && phones.length === 0 && (
          <div className="text-center py-16">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              등록된 상품이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              첫 번째 판매자가 되어보세요!
            </p>
            <Button
              onClick={handleCreateClick}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              상품 등록하기
            </Button>
          </div>
        )}

        {/* 마지막 페이지 */}
        {!hasMore && phones.length > 0 && (
          <div className="text-center py-8 text-gray-600">
            <p>모든 상품을 확인했습니다</p>
          </div>
        )}
      </section>

      {/* 플로팅 버튼 (모바일) */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <Button
          size="icon"
          onClick={handleCreateClick}
          className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
        }}
        missingFields={missingFields}
        onUpdateProfile={() => {
          router.push('/mypage');
        }}
      />
    </>
  );
}
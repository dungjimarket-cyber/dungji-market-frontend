'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainHeader } from '@/components/navigation/MainHeader';
import { GroupPurchaseCard } from '@/components/group-purchase/GroupPurchaseCard';
import { CategoryTabFilters } from '@/components/filters/CategoryTabFilters';
import { GroupBuyFilters } from '@/components/filters/GroupBuyFilters';
import { UnifiedSearchBar } from '@/components/filters/UnifiedSearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getSellerBids } from '@/lib/api/bidService';

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
    category_detail_type?: string;
    carrier?: string;
    registration_type?: string;
    registration_type_korean?: string;
    plan_info?: string;
    contract_info?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    subscription_type_korean?: string;
    plan_info: string;
    contract_period?: string;
  };
  internet_detail?: {
    carrier: string;
    carrier_display: string;
    subscription_type: string;
    subscription_type_display: string;
    speed: string;
    has_tv: boolean;
    contract_period?: string;
  };
  product_info?: any;
  creator: {
    id: number;
    username: string;
    profile_image?: string;
  };
  region_type?: string;
  region?: string;
  region_name?: string;
  regions?: Array<{
    id: number;
    name: string;
    parent?: string;
  }>;
  creator_name?: string;
  host_username?: string;
}

/**
 * 공구 둘러보기 메인 페이지 컴포넌트
 */
function GroupPurchasesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [userParticipations, setUserParticipations] = useState<number[]>([]);
  const [userBids, setUserBids] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // 무한 스크롤 관련 상태
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const itemsPerPage = 12; // 한 번에 로드할 아이템 수
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // URL에서 카테고리 가져오기, 없으면 'all' 기본값
  const categoryFromUrl = searchParams.get('category') as 'all' | 'phone' | 'internet' | 'internet_tv' | null;
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phone' | 'internet' | 'internet_tv'>(categoryFromUrl || 'all');
  const [showFilters, setShowFilters] = useState(false);

  /**
   * 공구 목록 가져오기 (필터 포함 및 무한 스크롤)
   */
  const fetchGroupBuys = useCallback(async (filters?: Record<string, string>, tabValue?: string, isLoadMore: boolean = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setError('');
    const currentTab = tabValue || activeTab;
    const currentOffset = isLoadMore ? offset : 0;
    console.log('fetchGroupBuys 호출 - currentTab:', currentTab, 'filters:', filters, 'offset:', currentOffset);
    
    try {
      const params = new URLSearchParams();
      
      // 무한 스크롤 파라미터 추가
      params.append('limit', itemsPerPage.toString());
      params.append('offset', currentOffset.toString());
      
      // 기본 상태 설정 - 탭에 따라
      if (currentTab === 'completed') {
        // 공구완료 탭: completed 상태이면서 구매완료와 판매완료가 모두 true인 건만
        params.append('status', 'completed');
        params.append('buyer_completed', 'true');
        params.append('seller_completed', 'true');
      } else {
        // 전체/인기/최신 탭: 모집중/견적중 상태만 (활성 공구)
        params.append('status', 'recruiting,bidding');
      }
      
      // 탭별 정렬 설정
      if (currentTab === 'popular') {
        // 인기순: 참여자 많은 순으로 정렬
        params.append('ordering', '-current_participants');
      } else if (currentTab === 'completed') {
        // 공구완료: 완료시간 최신순 (백엔드가 completed_at을 지원하는지 확인 필요)
        params.append('ordering', '-completed_at');
      } else {
        // 전체, 최신: 시작시간 최신순
        params.append('ordering', '-start_time');
      }
      
      // 사용자 필터 추가
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            // 정렬 기준은 무시 (탭별로 자동 설정됨)
            if (key === 'sort') {
              return;
            }
            // 카테고리 필터
            else if (key === 'category') {
              // '전체'인 경우 카테고리 필터를 추가하지 않음
              if (value === 'all') {
                // 전체 카테고리는 필터를 적용하지 않음
              } else if (value === 'phone') {
                params.append('category', '휴대폰');
              } else if (value === 'internet') {
                params.append('category', '인터넷');
              } else if (value === 'internet_tv') {
                params.append('category', '인터넷+TV');
              } else {
                params.append('category', value);
              }
            }
            // 통합 검색 필터 (제목, 상품명, 지역 등)
            else if (key === 'search') {
              console.log('검색 필터 처리 - value:', value);
              params.append('search', value);
            }
            // 제조사 필터 (합집합 처리)
            else if (key === 'manufacturer') {
              console.log('제조사 필터 처리 - value:', value);
              // 콤마로 구분된 여러 값 처리
              const manufacturers = value.split(',').map(m => {
                if (m === 'samsung') return '삼성';
                else if (m === 'apple') return '애플';
                return m;
              });
              
              console.log('변환된 제조사들:', manufacturers.join(','));
              // 콤마로 구분된 문자열로 전송 (백엔드에서 OR 처리 기대)
              params.append('manufacturer', manufacturers.join(','));
            }
            // 요금제 필터 (합집합 처리)
            else if (key === 'plan' || key === 'planRange') {
              console.log('요금제 필터 처리 - key:', key, 'value:', value);
              // 콤마로 구분된 여러 값 처리
              const plans = value.split(',').map(p => {
                if (p === '50000') return '5만원대';
                else if (p === '60000') return '6만원대';
                else if (p === '70000') return '7만원대';
                else if (p === '80000') return '8만원대';
                else if (p === '90000') return '9만원대';
                else if (p === '100000') return '10만원이상';
                return p;
              });
              
              console.log('변환된 요금제들:', plans.join(','));
              // 콤마로 구분된 문자열로 전송 (백엔드에서 OR 처리 기대)
              params.append('plan_info', plans.join(','));
            }
            // 브랜드 필터 (호환성)
            else if (key === 'brand') {
              params.append('manufacturer', value);
            }
            // 가격대 필터
            else if (key === 'priceRange') {
              params.append('price_range', value);
            }
            // 주요 기능 필터
            else if (key === 'feature') {
              params.append('features', value);
            }
            // 상품 상태 필터
            else if (key === 'condition') {
              params.append('condition', value);
            }
            // 통신사 필터 (합집합 처리)
            else if (key === 'carrier' || key === 'internet_carrier' || key === 'internet_tv_carrier') {
              console.log('통신사 필터 처리 - key:', key, 'value:', value);
              // 콤마로 구분된 여러 값 처리
              const carriers = value.split(',').map(c => {
                if (c === 'skt' || c === 'SKT') return 'SKT';
                else if (c === 'kt' || c === 'KT') return 'KT';
                else if (c === 'lgu' || c === 'LG U+') return 'LGU';
                return c;
              });
              
              const category = filters.category || selectedCategory;
              console.log('변환된 통신사들:', carriers.join(','));
              
              // 카테고리에 따라 다른 필터 적용
              if (category === 'phone') {
                params.append('telecom_carrier', carriers.join(','));
              } else if (category === 'internet' || category === 'internet_tv') {
                // 인터넷/인터넷+TV는 별도 필터 사용
                params.append('internet_carrier', carriers.join(','));
              }
            }
            // 가입 유형 필터 (합집합 처리)
            else if (key === 'subscriptionType' || key === 'internet_subscriptionType' || key === 'internet_tv_subscriptionType') {
              console.log('가입유형 필터 처리 - key:', key, 'value:', value);
              // 콤마로 구분된 여러 값 처리
              const subscriptionTypes = value.split(',').map(type => {
                // GroupBuyFilters에서 온 값들과 매핑
                if (type === 'new_signup' || type === '신규가입') return 'new';
                else if (type === 'number_port' || type === '번호이동') return 'transfer';
                else if (type === 'device_change' || type === '기기변경') return 'change';
                else if (type === 'carrier_change' || type === '통신사이동') return 'transfer';
                return type;
              }).filter(Boolean);
              
              if (subscriptionTypes.length > 0) {
                console.log('변환된 가입유형들:', subscriptionTypes.join(','));
                const category = filters.category || selectedCategory;
                
                if (category === 'phone') {
                  params.append('subscription_type', subscriptionTypes.join(','));
                } else if (category === 'internet' || category === 'internet_tv') {
                  params.append('internet_subscription_type', subscriptionTypes.join(','));
                }
              }
            }
            // 인터넷 속도 필터 (합집합 처리)
            else if (key === 'speed' || key === 'internet_speed' || key === 'internet_tv_speed') {
              console.log('속도 필터 처리 - key:', key, 'value:', value);
              // 콤마로 구분된 값들을 그대로 전송
              params.append('internet_speed', value);
            }
            // 지역 필터
            else if (key === 'region') {
              console.log('지역 필터 처리 - value:', value);
              // 쉼표로 구분된 지역들을 처리
              if (value.includes(',')) {
                const regions = value.split(',').filter(region => region.trim());
                console.log('확장된 지역들:', regions);
                // 백엔드가 OR 검색을 지원하는 경우
                params.append('region', value);
              } else {
                params.append('region', value);
              }
            }
            // 제품 분류 필터
            else if (key === 'subCategory') {
              params.append('sub_category', value);
            }
            // 구매방식 필터 변환 (기존 호환성)
            else if (key === 'purchaseType') {
              let subscriptionType = '';
              if (value === '신규가입') subscriptionType = 'new';
              else if (value === '번호이동') subscriptionType = 'transfer';
              else if (value === '기기변경') subscriptionType = 'change';
              
              if (subscriptionType) {
                params.append('subscription_type', subscriptionType);
              }
            }
            // 제조사 필터 (기존 호환성)
            else if (key === 'manufacturer') {
              params.append('manufacturer', value);
            }
            // 나머지 필터들
            else {
              params.append(key, value);
            }
          }
        });
      }
      
      console.log('공구 목록 요청 파라미터:', params.toString());
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('공구 목록을 불러오는데 실패했습니다.');
      }
      
      let data = await response.json();
      
      // API 응답 처리
      let newItems: GroupBuy[] = [];
      if (data.results && Array.isArray(data.results)) {
        // Django REST Framework 페이징 응답 형식
        newItems = data.results;
        setHasMore(data.next !== null);
      } else if (Array.isArray(data)) {
        // 페이징 없는 배열 응답
        newItems = data;
        setHasMore(newItems.length === itemsPerPage);
      }
      
      if (isLoadMore) {
        // 더 불러오기: 기존 데이터에 추가
        setGroupBuys(prev => [...prev, ...newItems]);
        setOffset(prev => prev + newItems.length);
      } else {
        // 새로운 검색: 데이터 교체
        setGroupBuys(newItems);
        setOffset(newItems.length);
      }
    } catch (err) {
      console.error('공구 목록 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      toast.error('공구 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, accessToken, itemsPerPage, offset]);

  /**
   * 필터 변경 처리
   */
  const handleFiltersChange = (filters: Record<string, string>) => {
    fetchGroupBuys(filters, activeTab, false);
  };

  /**
   * 카테고리 변경 처리
   */
  const handleCategoryChange = (category: string) => {
    console.log('카테고리 변경:', category);
    setSelectedCategory(category as 'all' | 'phone' | 'internet' | 'internet_tv');
    
    // 카테고리 변경 시 즉시 필터 적용
    const categoryFilter = { category };
    fetchGroupBuys(categoryFilter, activeTab);
  };

  /**
   * 통합 검색 변경 처리
   */
  const handleSearchChange = (search: string, region: string) => {
    console.log('검색어 변경 - search:', search, 'region:', region);
    const searchFilters: Record<string, string> = {};
    
    if (search) {
      searchFilters.search = search;
    }
    
    if (region) {
      searchFilters.region = region;
    }
    
    fetchGroupBuys(searchFilters, activeTab);
  };

  /**
   * 탭 변경 처리
   */
  const handleTabChange = useCallback((tab: string) => {
    console.log('탭 변경:', tab);
    setActiveTab(tab);
    
    // URL 쿼리 파라미터에서 필터 추출
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (['category', 'manufacturer', 'carrier', 'purchaseType', 'priceRange', 'search', 'brand', 'feature', 'condition', 'subscriptionType', 'speed', 'subCategory', 'region', 'plan'].includes(key)) {
        filters[key] = value;
      }
    });
    
    // 탭에 따른 필터 설정은 fetchGroupBuys에서 처리 - 새로운 탭 값 전달
    fetchGroupBuys(filters, tab);
  }, [searchParams, fetchGroupBuys]);

  /**
   * 사용자 참여 공구 및 입찰 공구 ID 목록 가져오기
   */
  const fetchUserParticipationsAndBids = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      // 일반 회원: 참여한 공구 목록 가져오기
      if (user?.role !== 'seller') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/participations/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // 참여한 공구 ID 목록 추출
          const participationIds = data.map((p: any) => p.groupbuy);
          setUserParticipations(participationIds);
        }
      }
      
      // 판매 회원: 입찰한 공구 목록 가져오기
      if (user?.role === 'seller') {
        try {
          const bids = await getSellerBids();
          // 입찰한 공구 ID 목록 추출
          const bidGroupBuyIds = bids.map(bid => bid.groupbuy);
          setUserBids(bidGroupBuyIds);
        } catch (error) {
          console.error('입찰 목록 조회 오류:', error);
        }
      }
    } catch (error) {
      console.error('사용자 참여/입찰 정보 조회 오류:', error);
    }
  }, [accessToken, user?.role]);

  /**
   * 초기 데이터 로딩
   */
  useEffect(() => {
    // URL 쿼리 파라미터에서 필터 추출
    const filters: Record<string, string> = {};
    let hasRefreshParam = false;
    let hasCategoryParam = false;
    
    searchParams.forEach((value, key) => {
      if (['category', 'manufacturer', 'carrier', 'purchaseType', 'priceRange', 'sort', 'search', 'region', 'brand', 'feature', 'condition', 'subscriptionType', 'speed', 'subCategory', 'plan'].includes(key)) {
        filters[key] = value;
        if (key === 'category') {
          hasCategoryParam = true;
        }
      }
      if (key === 'refresh') {
        hasRefreshParam = true;
      }
    });
    
    // URL에 카테고리가 없으면 기본값으로 '전체' 설정
    if (!hasCategoryParam) {
      filters.category = 'all';
      // URL을 업데이트하여 all 카테고리가 선택되었음을 명시
      const newUrl = new URLSearchParams(searchParams.toString());
      newUrl.set('category', 'all');
      router.replace(`/group-purchases?${newUrl.toString()}`);
      return; // URL 업데이트 후 리턴하여 중복 호출 방지
    }
    
    fetchGroupBuys(filters, activeTab);
    
    // 사용자가 로그인한 경우 참여/입찰 정보 가져오기
    if (accessToken) {
      fetchUserParticipationsAndBids();
    }
    
    // refresh 파라미터가 있으면 URL에서 제거
    if (hasRefreshParam) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('refresh');
      const newUrl = newSearchParams.toString() ? `?${newSearchParams.toString()}` : '';
      router.replace(`/group-purchases${newUrl}`);
    }
  }, [activeTab, searchParams.toString(), accessToken, router]);

  /**
   * 무한 스크롤을 위한 Intersection Observer 설정
   */
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          console.log('Loading more items...');
          const filters: Record<string, string> = {};
          searchParams.forEach((value, key) => {
            filters[key] = value;
          });
          fetchGroupBuys(filters, activeTab, true);
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
  }, [hasMore, loadingMore, loading, searchParams, activeTab, fetchGroupBuys]);

  /**
   * 페이지가 다시 포커스될 때 데이터 새로고침
   */
  useEffect(() => {
    const handleFocus = () => {
      // 사용자가 로그인한 경우 참여/입찰 정보 다시 가져오기
      if (accessToken) {
        console.log('페이지 포커스 감지 - 참여/입찰 정보 새로고침');
        fetchUserParticipationsAndBids();
      }
    };

    // 페이지가 포커스될 때 이벤트 리스너 추가
    window.addEventListener('focus', handleFocus);
    
    // visibility change 이벤트도 추가 (탭 전환 시)
    const handleVisibilityChange = () => {
      if (!document.hidden && accessToken) {
        console.log('페이지 가시성 변경 감지 - 참여/입찰 정보 새로고침');
        fetchUserParticipationsAndBids();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // popstate 이벤트 리스너 추가 (뒤로가기/앞으로가기)
    const handlePopState = () => {
      if (accessToken) {
        console.log('네비게이션 감지 - 참여/입찰 정보 새로고침');
        fetchUserParticipationsAndBids();
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [accessToken, fetchUserParticipationsAndBids]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader title="공구 둘러보기" />
      
      <div className="pb-20">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto bg-white min-h-screen">
          {/* 통합 검색바 */}
          <div className="px-4 pt-2 md:pt-3">
            <UnifiedSearchBar onSearchChange={handleSearchChange} />
          </div>

          {/* 카테고리 탭 */}
          <div className="px-4 py-1.5 md:py-3">
            <CategoryTabFilters 
              initialCategory={selectedCategory}
              onFiltersChange={handleFiltersChange}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* 조건필터 버튼 - '전체' 카테고리가 아닐 때만 표시 */}
          {selectedCategory !== 'all' && (
            <div className="px-4 pb-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-fit py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border ${
                  showFilters 
                    ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                    : 'bg-white text-blue-600 border-blue-400 hover:bg-blue-50'
                }`}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>검색필터</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {/* 필터 컴포넌트 - 조건필터 버튼 클릭 시에만 표시 (전체 카테고리가 아닐 때) */}
          {showFilters && selectedCategory !== 'all' && (
            <div className="px-4 pb-4">
              <GroupBuyFilters 
              category={selectedCategory as 'phone' | 'internet' | 'internet_tv'}
              onFiltersChange={(filters) => {
                // 필터 변경 처리 - 합집합을 위해 콤마로 구분한 값을 전달
                const flatFilters: Record<string, string> = {};
                
                // 카테고리별로 필터 ID 맵핑
                const filterMapping: Record<string, string> = {};
                
                if (selectedCategory === 'phone') {
                  filterMapping['manufacturer'] = 'manufacturer';
                  filterMapping['carrier'] = 'carrier';
                  filterMapping['subscriptionType'] = 'subscriptionType';
                  filterMapping['planRange'] = 'plan';
                } else if (selectedCategory === 'internet') {
                  filterMapping['internet_carrier'] = 'internet_carrier';
                  filterMapping['internet_subscriptionType'] = 'internet_subscriptionType';
                  filterMapping['speed'] = 'speed';
                } else if (selectedCategory === 'internet_tv') {
                  filterMapping['internet_tv_carrier'] = 'internet_tv_carrier';
                  filterMapping['internet_tv_subscriptionType'] = 'internet_tv_subscriptionType';
                  filterMapping['internet_tv_speed'] = 'internet_tv_speed';
                }
                
                Object.entries(filters).forEach(([key, values]) => {
                  if (values.length > 0) {
                    const mappedKey = filterMapping[key] || key;
                    flatFilters[mappedKey] = values.join(',');
                  }
                });
                
                // 카테고리 필터 추가
                flatFilters['category'] = selectedCategory;
                
                handleFiltersChange(flatFilters);
              }}
            />
            </div>
          )}

          {/* 탭 메뉴 */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="px-4">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="popular">인기순</TabsTrigger>
              <TabsTrigger value="newest">최신순</TabsTrigger>
              <TabsTrigger value="completed">공구완료</TabsTrigger>
            </TabsList>

            {/* 통합된 콘텐츠 영역 - 모든 탭이 동일한 데이터 표시 */}
            <div className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                  ))
                ) : error ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">{error}</p>
                  </div>
                ) : groupBuys.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">
                      {activeTab === 'all' && '공동구매가 없습니다.'}
                      {activeTab === 'popular' && '인기 공동구매가 없습니다.'}
                      {activeTab === 'newest' && '새로운 공동구매가 없습니다.'}
                      {activeTab === 'completed' && '종료된 공동구매가 없습니다.'}
                    </p>
                  </div>
                ) : (
                  groupBuys.map((groupBuy) => (
                    <GroupPurchaseCard 
                      key={groupBuy.id} 
                      groupBuy={groupBuy}
                      isParticipant={userParticipations.includes(groupBuy.id)}
                      hasBid={userBids.includes(groupBuy.id)}
                      isCompletedTab={activeTab === 'completed'}
                    />
                  ))
                )}
              </div>
              
              {/* 무한 스크롤 로더 */}
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">더 불러오는 중...</span>
                  </div>
                )}
                {!hasMore && groupBuys.length > 0 && (
                  <p className="text-gray-500">모든 공구를 불러왔습니다</p>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

/**
 * 공구 둘러보기 메인 페이지
 */
export default function GroupPurchasesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <MainHeader title="공구 둘러보기" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>        
      </div>
    }>
      <GroupPurchasesPageContent />
    </Suspense>
  );
}

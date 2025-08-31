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
import { ResponsiveAdSense } from '@/components/ads/GoogleAdSense';

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
  const loadingMoreRef = useRef(false); // loadingMore 상태를 ref로도 관리
  // URL에서 카테고리 가져오기, 없으면 'all' 기본값
  const categoryFromUrl = searchParams.get('category') as 'all' | 'phone' | 'internet' | 'internet_tv' | null;
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phone' | 'internet' | 'internet_tv'>(categoryFromUrl || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<string>(''); // 현재 선택된 지역

  /**
   * 공구 목록 가져오기 (필터 포함 및 무한 스크롤)
   */
  const fetchGroupBuys = useCallback(async (filters?: Record<string, string>, tabValue?: string, isLoadMore: boolean = false) => {
    // 이미 로딩 중이면 중복 호출 방지 (ref 사용)
    if (isLoadMore && loadingMoreRef.current) {
      console.log('Already loading more (ref check), skipping duplicate call');
      return;
    }
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (!isLoadMore) {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
    } else {
      // ref와 state 모두 업데이트
      loadingMoreRef.current = true;
      setLoadingMore(true);
      // 10초 후에도 loadingMore가 true면 강제로 false로 설정 (fallback)
      timeoutId = setTimeout(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
        setHasMore(false);
        console.log('LoadingMore timeout - forced reset');
      }, 10000);
    }
    setError('');
    const currentTab = tabValue || activeTab;
    const currentOffset = isLoadMore ? groupBuys.length : 0;
    console.log('fetchGroupBuys 호출 - currentTab:', currentTab, 'filters:', filters, 'offset:', currentOffset, 'isLoadMore:', isLoadMore);
    
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
            // 요금제 필터 (휴대폰 전용)
            else if (key === 'planRange') {
              const category = filters.category || selectedCategory;
              console.log('요금제 필터 처리 - key:', key, 'value:', value, 'category:', category);
              
              if (category === 'phone') {
                // 콤마로 구분된 여러 값 처리
                const plans = value.split(',').map(p => {
                  // 여러 형식 시도
                  const mappings: Record<string, string[]> = {
                    '50000': ['5만원대', '5만원', '50000원대', '5'],
                    '60000': ['6만원대', '6만원', '60000원대', '6'],
                    '70000': ['7만원대', '7만원', '70000원대', '7'],
                    '80000': ['8만원대', '8만원', '80000원대', '8'],
                    '90000': ['9만원대', '9만원', '90000원대', '9'],
                    '100000': ['10만원이상', '10만원', '100000원이상', '10']
                  };
                  
                  // 기본 매핑 사용 (첫 번째 형식)
                  if (mappings[p]) {
                    console.log(`요금제 ${p} -> ${mappings[p][0]}`);
                    return mappings[p][0];
                  }
                  return p;
                });
                
                console.log('변환된 요금제들:', plans);
                console.log('전송할 값:', plans.join(','));
                
                // 방법 1: 쉼표로 구분된 단일 값
                params.append('plan_info', plans.join(','));
                
                // 방법 2: 각 값을 개별적으로 추가 (백엔드가 배열을 지원하는 경우)
                // plans.forEach(plan => {
                //   params.append('plan_info', plan);
                // });
              }
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
            // 인터넷 속도 필터 (인터넷/인터넷+TV 전용)
            else if (key === 'speed' || key === 'internet_tv_speed') {
              const category = filters.category || selectedCategory;
              console.log('속도 필터 처리 - key:', key, 'value:', value, 'category:', category);
              
              if (category === 'internet' || category === 'internet_tv') {
                // 콤마로 구분된 값들을 그대로 전송
                params.append('internet_speed', value);
              }
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
      
      console.log('========== API 요청 정보 ==========');
      console.log('카테고리:', selectedCategory);
      console.log('활성 탭:', currentTab);
      console.log('필터:', filters);
      console.log('최종 파라미터:', params.toString());
      console.log('====================================');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?${params.toString()}`);
      
      if (!response.ok) {
        console.error('API 에러 응답:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        // 에러 응답 본문 읽기 시도
        try {
          const errorData = await response.json();
          console.error('API 에러 상세:', errorData);
        } catch (e) {
          console.error('에러 응답 파싱 실패');
        }
        
        throw new Error(`공구 목록을 불러오는데 실패했습니다. (${response.status})`);
      }
      
      let data = await response.json();
      
      // 요금제 데이터 디버깅 (휴대폰 카테고리일 때만)
      if (selectedCategory === 'phone' && data.results && data.results.length > 0) {
        console.log('========== 휴대폰 요금제 데이터 샘플 ==========');
        data.results.slice(0, 3).forEach((item: any, index: number) => {
          console.log(`샘플 ${index + 1}:`, {
            title: item.title,
            plan_info: item.telecom_detail?.plan_info || item.product_details?.plan_info,
            telecom_detail: item.telecom_detail,
            product_details: item.product_details
          });
        });
        console.log('==============================================');
      }
      
      // API 응답 처리
      let newItems: GroupBuy[] = [];
      if (data.results && Array.isArray(data.results)) {
        // Django REST Framework 페이징 응답 형식
        newItems = data.results;
        // 데이터가 없거나 itemsPerPage보다 적으면 더 이상 없음
        const hasMoreData = data.next !== null && newItems.length > 0;
        setHasMore(hasMoreData);
        console.log('HasMore 설정:', hasMoreData, 'next:', data.next, 'items:', newItems.length);
      } else if (Array.isArray(data)) {
        // 페이징 없는 배열 응답
        newItems = data;
        // itemsPerPage보다 적으면 더 이상 없음
        const hasMoreData = newItems.length >= itemsPerPage;
        setHasMore(hasMoreData);
        console.log('HasMore 설정 (배열):', hasMoreData, 'items:', newItems.length);
      }
      
      if (isLoadMore) {
        // 더 불러오기: 기존 데이터에 추가
        setGroupBuys(prev => {
          // 중복 제거
          const existingIds = new Set(prev.map(item => item.id));
          const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
          return [...prev, ...uniqueNewItems];
        });
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
      // 에러 발생 시 hasMore를 false로 설정하여 추가 로드 방지
      setHasMore(false);
    } finally {
      // 타임아웃 정리
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
      // ref와 state 모두 리셋
      loadingMoreRef.current = false;
      setLoadingMore(false);
      console.log('Finally block - loadingMore reset complete');
    }
  }, [activeTab, accessToken, itemsPerPage, groupBuys.length]);

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
    
    // 지역 정보 업데이트
    setCurrentRegion(region || '');
    
    // 기존 URL 파라미터를 가져와서 유지
    const currentFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (['category', 'manufacturer', 'carrier', 'purchaseType', 'priceRange', 'brand', 'feature', 'condition', 'subscriptionType', 'speed', 'subCategory', 'plan'].includes(key)) {
        currentFilters[key] = value;
      }
    });
    
    // 검색어와 지역 업데이트 (빈 값이어도 설정)
    if (search !== undefined) {
      if (search) {
        currentFilters.search = search;
      } else {
        delete currentFilters.search;
      }
    }
    
    if (region !== undefined) {
      if (region) {
        currentFilters.region = region;
      } else {
        delete currentFilters.region;
      }
    }
    
    fetchGroupBuys(currentFilters, activeTab);
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
      // _t 파라미터는 무시 (타임스탬프 파라미터)
      if (key === '_t') {
        return;
      }
      if (['category', 'manufacturer', 'carrier', 'purchaseType', 'priceRange', 'sort', 'search', 'region', 'brand', 'feature', 'condition', 'subscriptionType', 'speed', 'subCategory', 'plan'].includes(key)) {
        filters[key] = value;
        if (key === 'category') {
          hasCategoryParam = true;
        }
        // 지역 정보 설정
        if (key === 'region') {
          setCurrentRegion(value);
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
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current && !loading) {
          console.log('IntersectionObserver triggered - hasMore:', hasMore, 'loadingMoreRef:', loadingMoreRef.current, 'loading:', loading);
          const filters: Record<string, string> = {};
          searchParams.forEach((value, key) => {
            filters[key] = value;
          });
          fetchGroupBuys(filters, activeTab, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    if (loadMoreRef.current && hasMore && !loading) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [searchParams.toString(), activeTab, fetchGroupBuys, hasMore, loading]);

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

          {/* Google AdSense Banner - 광고 승인 후 활성화 */}
          {/* <div className="px-4 py-3">
            <ResponsiveAdSense />
          </div> */}

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
              currentRegion={currentRegion}
              onFiltersChange={(filters) => {
                // 필터 변경 처리 - 합집합을 위해 콤마로 구분한 값을 전달
                const flatFilters: Record<string, string> = {};
                
                // 카테고리별로 필터 ID 맵핑
                const filterMapping: Record<string, string> = {};
                
                if (selectedCategory === 'phone') {
                  filterMapping['manufacturer'] = 'manufacturer';
                  filterMapping['carrier'] = 'carrier';
                  filterMapping['subscriptionType'] = 'subscriptionType';
                  filterMapping['planRange'] = 'planRange';  // plan → planRange로 변경
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

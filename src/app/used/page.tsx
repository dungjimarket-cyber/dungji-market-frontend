/**
 * 중고폰 직거래 메인 페이지
 * /used
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Smartphone, TrendingUp, Shield, Zap, AlertCircle, Info, User, Heart, Star, ShoppingBag, CheckCircle, Clock, MapPin, BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UsedPhoneCard from '@/components/used/UsedPhoneCard';
import UsedPhoneFilter from '@/components/used/UsedPhoneFilter';
import ElectronicsFilter from '@/components/used/ElectronicsFilter';
import UnifiedTabs, { TabType } from '@/components/used/UnifiedTabs';
import UnifiedItemCard from '@/components/used/UnifiedItemCard';
import { UsedPhone } from '@/types/used';
import { UsedElectronics } from '@/types/electronics';
import type { UnifiedMarketItem, PhoneItem, ElectronicsItem } from '@/types/market';
import { isPhoneItem, isElectronicsItem, getMainImageUrl, getItemTitle, getItemDetailUrl, getSellerNickname } from '@/types/market';
import electronicsApi from '@/lib/api/electronics';
import { regions } from '@/lib/regions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUsedProfileCheck } from '@/hooks/useUsedProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import RegistrationLimitModal from '@/components/used/RegistrationLimitModal';
import NoticeSection from '@/components/home/NoticeSection';

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
  } = useUsedProfileCheck();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [phones, setPhones] = useState<UsedPhone[]>([]);
  const [electronics, setElectronics] = useState<UsedElectronics[]>([]);
  const [unifiedItems, setUnifiedItems] = useState<UnifiedMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // 추가 로딩 상태
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    includeCompleted: true, // 거래완료 포함 기본 표시
  });
  const [hasLoadedAll, setHasLoadedAll] = useState(false); // 모든 데이터 로드 완료 여부

  // 간단한 필터 상태 (전체 탭용)
  const [simpleSearch, setSimpleSearch] = useState('');
  const [simpleRegion, setSimpleRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  
  // 등록 제한 관련 상태
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [registrationLimit, setRegistrationLimit] = useState({ current: 0, max: 5 });

  // 시/도 선택 시 시/군/구 목록 업데이트
  useEffect(() => {
    if (selectedProvince) {
      const region = regions.find(r => r.name === selectedProvince);
      setCities(region?.cities || []);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedProvince]);

  // 전자제품 목록 조회
  const fetchElectronics = useCallback(async (currentFilters: any) => {
    try {
      setLoading(true);
      const params: any = {
        ordering: currentFilters.sortBy === 'price_low' || currentFilters.sortBy === 'price' ? 'price' : currentFilters.sortBy === 'price_high' ? '-price' : '-created_at',
        search: currentFilters.search,
        subcategory: currentFilters.subcategory,
        condition: currentFilters.condition,
        min_price: currentFilters.minPrice,
        max_price: currentFilters.maxPrice,
      };

      // includeCompleted가 false인 경우만 status 필터 추가
      if (!currentFilters.includeCompleted) {
        params.status = 'active';
      }

      // 지역 필터
      if (currentFilters.region) {
        params.region = currentFilters.region;
      }

      const response = await electronicsApi.getElectronicsList(params);
      const items = response.results || [];

      // itemType 추가
      const electronicsWithType = items.map((item: any) => ({ ...item, itemType: 'electronics' as const }));

      setElectronics(electronicsWithType);
      setTotalCount(electronicsWithType.length);
    } catch (error) {
      console.error('Failed to fetch electronics:', error);
      toast({
        title: '오류',
        description: '전자제품을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 전체 아이템 조회 (all 탭)
  const fetchAllItems = useCallback(async (currentFilters: any) => {
    try {
      setLoading(true);
      setHasLoadedAll(false);

      // 병렬로 휴대폰과 전자제품 로드
      const [phoneData, electronicsData] = await Promise.all([
        // 휴대폰 API 호출
        (async () => {
          const params = new URLSearchParams();
          params.append('limit', '1000');

          // 검색어
          if (currentFilters.search) {
            params.append('search', currentFilters.search);
          }

          // 지역
          if (currentFilters.region) {
            params.append('region', currentFilters.region);
          }

          // includeCompleted가 false인 경우 active만
          if (!currentFilters.includeCompleted) {
            params.append('status', 'active');
          } else {
            params.append('include_completed', 'true');
          }

          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
          const apiUrl = baseUrl.includes('api.dungjimarket.com')
            ? `${baseUrl}/used/phones/?${params}`
            : `${baseUrl}/api/used/phones/?${params}`;

          const token = localStorage.getItem('accessToken');
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(apiUrl, { headers });
          if (!response.ok) throw new Error('Failed to fetch phones');
          const data = await response.json();
          return Array.isArray(data) ? data : (data.results || data.items || []);
        })(),
        // 전자제품 API 호출 - 휴대폰과 동일한 방식 적용
        electronicsApi.getElectronicsList({
          search: currentFilters.search,
          region: currentFilters.region,
          // 거래완료 포함 옵션을 전자제품 API에도 적용
          ...(currentFilters.includeCompleted === false && { status: 'active' })
        }).then(res => {
          let items = res.results || [];

          // includeCompleted가 false인 경우 active 상태만 필터링
          if (!currentFilters.includeCompleted) {
            items = items.filter((item: UsedElectronics) => item.status === 'active');
          }

          // 백엔드에서 지역 필터가 작동하지 않는 경우를 대비해 프론트엔드에서도 필터링
          if (currentFilters.region) {
            items = items.filter((item: UsedElectronics) => {
              if (!item.regions || item.regions.length === 0) return false;
              return item.regions.some(region =>
                region.name && region.name.includes(currentFilters.region)
              );
            });
          }

          return items;
        }).catch(() => [])
      ]);

      // 데이터 통합
      const phoneItems: PhoneItem[] = phoneData.map((phone: UsedPhone) => ({ ...phone, itemType: 'phone' as const }));
      const electronicsItems: ElectronicsItem[] = electronicsData.map((elec: UsedElectronics) => ({ ...elec, itemType: 'electronics' as const }));

      // 날짜순 정렬
      const allItems = [...phoneItems, ...electronicsItems].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPhones(phoneData);
      setElectronics(electronicsData);
      setUnifiedItems(allItems);
      setTotalCount(allItems.length);
      setHasLoadedAll(true);
    } catch (error) {
      console.error('Failed to fetch all items:', error);
      toast({
        title: '오류',
        description: '상품을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 초기 상품 목록 조회 (빠른 로딩)
  const fetchInitialPhones = useCallback(async (currentFilters: any) => {
    try {
      setLoading(true);
      setHasLoadedAll(false);
      
      // 첫 화면용 20개만 빠르게 로드
      const params = new URLSearchParams();
      params.append('limit', '20');

      // 필터 파라미터 추가 (백엔드 API에 맞게 변환)
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // 파라미터명 변환
          if (key === 'brand') {
            params.append('manufacturer', String(value));
          } else if (key === 'condition') {
            params.append('condition_grade', String(value));
          } else if (key === 'sortBy') {
            if (value === 'price_low') {
              params.append('ordering', 'price');
            } else if (value === 'price_high') {
              params.append('ordering', '-price');
            }
          } else if (key === 'includeCompleted') {
            // boolean을 명시적으로 'true' 또는 'false' 문자열로 변환
            const includeValue = value === true ? 'true' : 'false';
            console.log('[중고거래] includeCompleted:', value, '→', includeValue);
            params.append('include_completed', includeValue);
          } else if (key === 'region') {
            // 지역 필터 특별 처리
            const regionValue = String(value).trim();
            console.log('[중고거래] 지역 필터 값:', regionValue);
            params.append('region', regionValue);
          } else {
            params.append(key, String(value));
          }
        }
      });

      // 디버깅용 로그
      console.log('[중고거래] API 호출 필터:', currentFilters);
      console.log('[중고거래] API URL 파라미터:', params.toString());
      console.log('[중고거래] 디코딩된 URL:', decodeURIComponent(params.toString()));

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/?${params}`
        : `${baseUrl}/api/used/phones/?${params}`;

      // 인증 헤더 추가 (is_favorite 필드를 위해 필요)
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log('[중고거래] API 호출 인증:', token ? '인증됨' : '비인증');

      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.results || data.items || []);

      // is_favorite 필드 확인을 위한 로깅
      console.log('[중고거래] API 응답 첫 번째 아이템:', items[0]);
      console.log('[중고거래] is_favorite 필드 확인:', items[0]?.is_favorite);

      // itemType 추가
      const phonesWithType = items.map((item: any) => ({ ...item, itemType: 'phone' as const }));
      setPhones(phonesWithType);
      setTotalCount(phonesWithType.length);
      
    } catch (error) {
      console.error('Failed to fetch initial phones:', error);
      toast({
        title: '오류',
        description: '상품을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 나머지 상품 목록 조회 (백그라운드)
  const fetchRemainingPhones = useCallback(async (currentFilters: any) => {
    try {
      setLoadingMore(true);
      
      // 나머지 데이터 로드 (offset 20부터)
      const params = new URLSearchParams();
      params.append('limit', '1000');
      params.append('offset', '20');

      // 필터 파라미터 추가 (백엔드 API에 맞게 변환)
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // 파라미터명 변환
          if (key === 'brand') {
            params.append('manufacturer', String(value));
          } else if (key === 'condition') {
            params.append('condition_grade', String(value));
          } else if (key === 'sortBy') {
            if (value === 'price_low') {
              params.append('ordering', 'price');
            } else if (value === 'price_high') {
              params.append('ordering', '-price');
            }
          } else if (key === 'includeCompleted') {
            // boolean을 명시적으로 'true' 또는 'false' 문자열로 변환
            const includeValue = value === true ? 'true' : 'false';
            console.log('[중고거래] includeCompleted:', value, '→', includeValue);
            params.append('include_completed', includeValue);
          } else if (key === 'region') {
            // 지역 필터 특별 처리
            const regionValue = String(value).trim();
            console.log('[중고거래] 지역 필터 값:', regionValue);
            params.append('region', regionValue);
          } else {
            params.append(key, String(value));
          }
        }
      });

      // 디버깅용 로그
      console.log('[중고거래] API 호출 필터:', currentFilters);
      console.log('[중고거래] API URL 파라미터:', params.toString());
      console.log('[중고거래] 디코딩된 URL:', decodeURIComponent(params.toString()));

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/?${params}`
        : `${baseUrl}/api/used/phones/?${params}`;

      // 인증 헤더 추가 (is_favorite 필드를 위해 필요)
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log('[중고거래] API 호출 인증:', token ? '인증됨' : '비인증');

      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.results || data.items || []);

      // itemType 추가
      const phonesWithType = items.map((item: any) => ({ ...item, itemType: 'phone' as const }));

      // 기존 데이터에 추가
      setPhones(prev => [...prev, ...phonesWithType]);
      setTotalCount(prev => prev + phonesWithType.length);
      setHasLoadedAll(true);
      
    } catch (error) {
      console.error('Failed to fetch remaining phones:', error);
      // 백그라운드 로딩이므로 에러 토스트는 표시하지 않음
    } finally {
      setLoadingMore(false);
    }
  }, []);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    if (activeTab === 'phone') {
      // 휴대폰 탭: 기존 로직
      fetchInitialPhones(newFilters);
      setTimeout(() => {
        fetchRemainingPhones(newFilters);
      }, 500);
    } else if (activeTab === 'electronics') {
      // 전자제품 탭
      fetchElectronics(newFilters);
    } else {
      // 전체 탭: 간단한 필터만 적용
      const allFilters = {
        search: simpleSearch,
        region: simpleRegion,
        includeCompleted: newFilters.includeCompleted ?? true
      };
      fetchAllItems(allFilters);
    }
  }, [activeTab, fetchInitialPhones, fetchRemainingPhones, fetchElectronics, fetchAllItems, simpleSearch, simpleRegion]);

  // 간단한 검색 핸들러 (전체 탭용) - 휴대폰 기반 필터 방식 사용
  const handleSimpleSearch = useCallback(() => {
    const filters = {
      search: simpleSearch,
      region: simpleRegion,
      includeCompleted: true
    };
    fetchAllItems(filters);
  }, [simpleSearch, simpleRegion, fetchAllItems]);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab: TabType) => {
    console.log('Tab changed to:', tab);
    setActiveTab(tab);
    // 필터 초기화
    setFilters({ includeCompleted: true });
    setSimpleSearch('');
    setSimpleRegion('');
    setSelectedProvince('');
    setSelectedCity('');
    // 데이터 로드
    if (tab === 'all') {
      fetchAllItems({ includeCompleted: true });
    } else if (tab === 'phone') {
      fetchInitialPhones({ includeCompleted: true });
      setTimeout(() => fetchRemainingPhones({ includeCompleted: true }), 500);
    } else if (tab === 'electronics') {
      fetchElectronics({ includeCompleted: true });
    }
  }, [fetchAllItems, fetchInitialPhones, fetchRemainingPhones, fetchElectronics]);

  // 찜하기 핸들러 (통합)
  const handleFavorite = useCallback(async (itemId: number, itemType?: 'phone' | 'electronics') => {
    // itemType이 전달되지 않으면 activeTab으로 판단
    const type = itemType || (activeTab === 'electronics' ? 'electronics' : 'phone');

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
      if (type === 'electronics') {
        // 현재 찜 상태 확인
        const currentItem = electronics.find(e => e.id === itemId);
        const isFavorited = currentItem?.is_favorited || false;

        console.log('Electronics favorite toggle:', { itemId, currentFavorited: isFavorited });

        const response = await electronicsApi.toggleFavorite(itemId, isFavorited);

        console.log('Electronics favorite response:', response);

        const newFavoriteState = !isFavorited;

        // 전자제품 상태 업데이트
        setElectronics(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, is_favorited: newFavoriteState }
            : item
        ));
        // 통합 아이템도 업데이트
        setUnifiedItems(prev => prev.map(item =>
          item.id === itemId && isElectronicsItem(item)
            ? { ...item, is_favorited: newFavoriteState }
            : item
        ));

        toast({
          title: newFavoriteState ? '찜 완료' : '찜 해제',
          description: newFavoriteState ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.'
        });
      } else {
        // 휴대폰 찜하기 로직
        const token = localStorage.getItem('accessToken');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
        const apiUrl = baseUrl.includes('api.dungjimarket.com')
          ? `${baseUrl}/used/phones/${itemId}/favorite/`
          : `${baseUrl}/api/used/phones/${itemId}/favorite/`;

        // 현재 찜 상태 확인
        const currentPhone = phones.find(p => p.id === itemId);
        const isFavorited = currentPhone?.is_favorite || false;

        const response = await fetch(apiUrl, {
          method: isFavorited ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const newFavoriteState = !isFavorited;

          // 휴대폰 상태 업데이트
          setPhones(prev => prev.map(phone =>
            phone.id === itemId
              ? { ...phone, is_favorite: newFavoriteState }
              : phone
          ));
          // 통합 아이템도 업데이트
          setUnifiedItems(prev => prev.map(item =>
            item.id === itemId && isPhoneItem(item)
              ? { ...item, is_favorited: newFavoriteState, is_favorite: newFavoriteState }
              : item
          ));

          toast({
            title: newFavoriteState ? '찜 완료' : '찜 해제',
            description: newFavoriteState ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.'
          });
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [isAuthenticated, toast, router, activeTab]);

  // 폰 찜하기 핸들러 (기존 호환성)
  const handlePhoneFavorite = useCallback(async (phoneId: number) => {
    return handleFavorite(phoneId, 'phone');
  }, [handleFavorite]);

  // 초기 데이터 로드
  useEffect(() => {
    // 전체 탭으로 시작
    fetchAllItems({ includeCompleted: true });
  }, []);

  // 프로필 체크 (로그인한 경우)
  useEffect(() => {
    if (isAuthenticated) {
      checkProfile();
    }
  }, [isAuthenticated, checkProfile]);

  // 판매하기 버튼 핸들러 - 통합 등록 페이지로 이동
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

    // 통합 등록 선택 페이지로 이동
    router.push('/used/create-unified');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모든 콘텐츠를 동일한 너비로 제한 */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4">
        {/* 공지사항 */}
        <NoticeSection pageType="used" compact={true} />

        {/* 상단 버튼 영역 */}
        <section className="mb-4 sm:mb-6 py-2 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            {/* 왼쪽: 이용가이드 버튼 */}
            <Link href="/used/guide">
              <Button
                size="sm"
                variant="ghost"
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">이용가이드</span>
                <span className="sm:hidden">가이드</span>
              </Button>
            </Link>

            {/* 오른쪽: 기존 버튼들 */}
            <div className="flex gap-1.5 sm:gap-3">
              <Button
                size="sm"
                onClick={handleCreateClick}
                className="px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span>판매하기</span>
              </Button>
              {isAuthenticated && (
                <Link href="/used/mypage">
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">중고거래내역</span>
                    <span className="sm:hidden">내역</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* 프로필 미완성 안내 */}
        {isAuthenticated && !isProfileComplete && missingFields.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    중고거래를 위한 필수 정보를 입력해주세요
                  </p>
                  <p className="text-xs text-yellow-600">
                    {missingFields.join(', ')} 정보만 입력하면 바로 거래 가능합니다
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/mypage')}
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
              >
                정보 입력하기
              </Button>
            </div>
          </div>
        )}

        {/* 탭 섹션 */}
        <div className="mb-4">
          <UnifiedTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={{
              all: unifiedItems.length,
              phone: phones.length,
              electronics: electronics.length
            }}
          />
        </div>

        {/* 필터 섹션 */}
        <div className="sticky top-0 z-40 -mx-4 px-4 bg-white/95 backdrop-blur-sm border-b shadow-sm">
          {activeTab === 'all' ? (
            // 전체 탭: 간단한 필터만
            <div className="py-3">
              <div className="flex flex-col gap-3">
                {/* 검색바와 지역검색 */}
                <div className="flex gap-2">
                  {/* 통합검색 (50%) */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="검색..."
                      value={simpleSearch}
                      onChange={(e) => setSimpleSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSimpleSearch()}
                      className="pl-9 pr-10 w-full"
                    />
                    <button
                      onClick={handleSimpleSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                      aria-label="검색"
                    >
                      <Search className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* 지역검색 (50%) */}
                  <div className="flex gap-1 flex-1">
                    {/* 시/도 선택 */}
                    <Select
                      value={selectedProvince || 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setSelectedProvince('');
                          setSelectedCity('');
                          setSimpleRegion('');
                          // 직접 값 전달
                          const filters = {
                            search: simpleSearch,
                            region: '',
                            includeCompleted: true
                          };
                          fetchAllItems(filters);
                        } else {
                          setSelectedProvince(value);
                          setSelectedCity('');
                          setSimpleRegion(value);
                          // 직접 값 전달
                          const filters = {
                            search: simpleSearch,
                            region: value,
                            includeCompleted: true
                          };
                          fetchAllItems(filters);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <SelectValue placeholder="전국" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전국</SelectItem>
                        {regions.map((region) => (
                          <SelectItem key={region.name} value={region.name}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 시/군/구 선택 */}
                    <Select
                      value={selectedCity || 'all'}
                      disabled={!selectedProvince}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setSelectedCity('');
                          setSimpleRegion(selectedProvince);
                          // 직접 값 전달
                          const filters = {
                            search: simpleSearch,
                            region: selectedProvince,
                            includeCompleted: true
                          };
                          fetchAllItems(filters);
                        } else {
                          setSelectedCity(value);
                          const fullRegion = `${selectedProvince} ${value}`;
                          setSimpleRegion(fullRegion);
                          // 직접 값 전달
                          const filters = {
                            search: simpleSearch,
                            region: fullRegion,
                            includeCompleted: true
                          };
                          fetchAllItems(filters);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1 min-w-0" disabled={!selectedProvince}>
                        <div className="flex items-center gap-1 truncate">
                          <SelectValue placeholder="시/군/구" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 결과 요약 */}
                <div className="text-sm text-gray-600">
                  총 <span className="font-semibold text-gray-900">{totalCount}개</span>의 상품
                </div>
              </div>
            </div>
          ) : activeTab === 'phone' ? (
            // 휴대폰 탭: 기존 필터 사용
            <UsedPhoneFilter
              onFilterChange={handleFilterChange}
              totalCount={totalCount}
            />
          ) : (
            // 전자제품 탭: 전자제품 필터 사용
            <ElectronicsFilter
              onFilterChange={handleFilterChange}
              totalCount={totalCount}
            />
          )}
        </div>

        {/* 상품 리스트 */}
        <section className="py-6">
        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {activeTab === 'all' ? (
            // 전체 탭: 통합 아이템 표시
            unifiedItems.map((item, index) => (
              <UnifiedItemCard
                key={`${item.itemType}-${item.id}`}
                item={item}
                priority={index < 10}
                onFavorite={(id) => handleFavorite(id, item.itemType)}
              />
            ))
          ) : activeTab === 'phone' ? (
            // 휴대폰 탭: 기존 폰 카드
            phones.map((phone, index) => (
              <UsedPhoneCard
                key={phone.id}
                phone={phone}
                priority={index < 10}
                onFavorite={handlePhoneFavorite}
              />
            ))
          ) : (
            // 전자제품 탭: 통합 카드로 표시
            electronics.map((item, index) => {
              const unifiedItem: ElectronicsItem = { ...item, itemType: 'electronics' as const };
              return (
                <UnifiedItemCard
                  key={item.id}
                  item={unifiedItem}
                  priority={index < 10}
                  onFavorite={(id) => handleFavorite(id, 'electronics')}
                />
              );
            })
          )}

          {/* 로딩 스켈레톤 */}
          {loading && (
            <>
              {[...Array(20)].map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </>
          )}
        </div>

        {/* 추가 데이터 로딩 중 표시 */}
        {!loading && loadingMore && phones.length > 0 && (
          <div className="mt-4 py-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>더 많은 상품을 불러오는 중...</span>
            </div>
          </div>
        )}
        
        {/* 모든 데이터 로드 완료 표시 */}
        {!loading && !loadingMore && hasLoadedAll && phones.length > 20 && (
          <div className="mt-4 py-4 text-center">
            <p className="text-sm text-gray-500">
              총 {totalCount}개의 상품을 모두 불러왔습니다
            </p>
          </div>
        )}
        
        {/* 검색 결과 없음 */}
        {!loading && (
          (activeTab === 'all' && unifiedItems.length === 0) ||
          (activeTab === 'phone' && phones.length === 0) ||
          (activeTab === 'electronics' && electronics.length === 0)
        ) && (
          <div className="text-center py-16">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              등록된 상품이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              첫 번째 판매자가 되어보세요
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

        {/* 상품 개수 표시 */}
        {!loading && totalCount > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">총 {totalCount}개의 상품</p>
          </div>
        )}
        </section>
      </div>

      {/* 플로팅 버튼 (모바일) - 컨테이너 밖에 배치 */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <Button
          size="icon"
          onClick={handleCreateClick}
          className="w-14 h-14 rounded-full shadow-lg"
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
      
      {/* 등록 제한 모달 */}
      <RegistrationLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentCount={registrationLimit.current}
        maxCount={registrationLimit.max}
        onViewMyPhones={() => {
          setShowLimitModal(false);
          router.push('/mypage?tab=sales');
        }}
      />
    </div>
  );
}
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
import ElectronicsCard from '@/components/used/ElectronicsCard';
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
  const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지
  const [currentOffset, setCurrentOffset] = useState(0); // 현재 오프셋
  const loadMoreRef = useRef<HTMLDivElement>(null); // 무한 스크롤 트리거

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

  // 전자제품 목록 조회 (무한 스크롤 지원)
  const fetchElectronics = useCallback(async (currentFilters: any, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setCurrentOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 30; // 한 번에 30개씩 로드
      const offset = isLoadMore ? currentOffset : 0;

      const params: any = {
        limit,
        offset,
        search: currentFilters.search,
        subcategory: currentFilters.subcategory,
        condition: currentFilters.condition,
        min_price: currentFilters.minPrice,
        max_price: currentFilters.maxPrice,
      };

      // 가격 정렬일 때만 ordering 파라미터 추가 (기본은 백엔드에서 끌올 정렬 적용)
      if (currentFilters.sortBy === 'price_low' || currentFilters.sortBy === 'price') {
        params.ordering = 'price';
      } else if (currentFilters.sortBy === 'price_high') {
        params.ordering = '-price';
      }
      // sortBy가 없거나 'latest'인 경우 ordering 파라미터를 보내지 않음 (백엔드 기본 끌올 정렬 사용)

      // includeCompleted 파라미터 추가
      if (currentFilters.includeCompleted !== false) {
        params.include_completed = 'true';
      }

      // 지역 필터
      if (currentFilters.region) {
        params.region = currentFilters.region;
      }

      const response = await electronicsApi.getElectronicsList(params);
      const items = response.results || [];
      const count = response.count || items.length;

      // itemType 추가
      const electronicsWithType = items.map((item: any) => ({ ...item, itemType: 'electronics' as const }));

      if (isLoadMore) {
        // 추가 로드: 기존 데이터에 추가
        setElectronics(prev => [...prev, ...electronicsWithType]);
      } else {
        // 초기 로드: 데이터 교체
        setElectronics(electronicsWithType);
      }

      // 더 불러올 데이터가 있는지 체크
      const totalFetched = offset + items.length;
      const hasMoreData = totalFetched < count;
      setHasMore(hasMoreData);
      setCurrentOffset(offset + limit);
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to fetch electronics:', error);
      toast({
        title: '오류',
        description: '전자제품을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast, currentOffset]);

  // 전체 아이템 조회 (all 탭) - 무한 스크롤 지원
  const fetchAllItems = useCallback(async (currentFilters: any, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setCurrentOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      // 한글 브랜드를 영어로 변환하는 매핑
      const brandKoreanToEnglish: Record<string, string> = {
        '삼성': 'samsung',
        '애플': 'apple',
        '엘지': 'lg',
        '샤오미': 'xiaomi',
        '기타': 'other'
      };

      // 검색어 변환 (한글 브랜드명이면 영어로 변환)
      let searchTerm = currentFilters.search;
      if (searchTerm && brandKoreanToEnglish[searchTerm.toLowerCase()]) {
        searchTerm = brandKoreanToEnglish[searchTerm.toLowerCase()];
      }

      const limit = 30; // 한 번에 30개씩 로드
      const offset = isLoadMore ? currentOffset : 0;

      // 병렬로 휴대폰과 전자제품 로드
      const [phoneData, electronicsData] = await Promise.all([
        // 휴대폰 API 호출
        (async () => {
          const params = new URLSearchParams();
          params.append('limit', String(limit));
          params.append('offset', String(offset));

          // 검색어 (변환된 검색어 사용)
          if (searchTerm) {
            params.append('search', searchTerm);
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
          return data;
        })(),
        // 전자제품 API 호출
        electronicsApi.getElectronicsList({
          search: searchTerm,
          region: currentFilters.region,
          limit,
          offset,
          include_completed: currentFilters.includeCompleted !== false ? 'true' : undefined
        }).catch(() => ({ results: [], count: 0 }))
      ]);

      // 휴대폰 데이터 처리
      const phoneResults = Array.isArray(phoneData) ? phoneData : (phoneData.results || []);
      const phoneCount = phoneData.count || phoneResults.length;

      // 전자제품 데이터 처리
      const electronicsResults = electronicsData.results || [];
      const electronicsCount = electronicsData.count || 0;

      // 데이터 통합
      const phoneItems: PhoneItem[] = phoneResults.map((phone: UsedPhone) => ({ ...phone, itemType: 'phone' as const }));
      const electronicsItems: ElectronicsItem[] = electronicsResults.map((elec: UsedElectronics) => ({ ...elec, itemType: 'electronics' as const }));

      // 끌올 우선, 날짜순 정렬
      const newItems = [...phoneItems, ...electronicsItems].sort((a, b) => {
        const aDate = a.last_bumped_at || a.created_at;
        const bDate = b.last_bumped_at || b.created_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      if (isLoadMore) {
        // 추가 로드: 기존 데이터에 추가
        setPhones(prev => [...prev, ...phoneResults]);
        setElectronics(prev => [...prev, ...electronicsResults]);
        setUnifiedItems(prev => [...prev, ...newItems]);
      } else {
        // 초기 로드: 데이터 교체
        setPhones(phoneResults);
        setElectronics(electronicsResults);
        setUnifiedItems(newItems);
      }

      // 더 불러올 데이터가 있는지 체크
      const totalFetched = offset + phoneResults.length + electronicsResults.length;
      const hasMoreData = totalFetched < (phoneCount + electronicsCount);
      setHasMore(hasMoreData);
      setCurrentOffset(offset + limit);
      setTotalCount(phoneCount + electronicsCount);
    } catch (error) {
      console.error('Failed to fetch all items:', error);
      toast({
        title: '오류',
        description: '상품을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast, currentOffset]);

  // 휴대폰 목록 조회 (무한 스크롤 지원)
  const fetchPhones = useCallback(async (currentFilters: any, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setCurrentOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 30; // 한 번에 30개씩 로드
      const offset = isLoadMore ? currentOffset : 0;

      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));

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
      const count = data.count || items.length;

      // itemType 추가
      const phonesWithType = items.map((item: any) => ({ ...item, itemType: 'phone' as const }));

      if (isLoadMore) {
        // 추가 로드: 기존 데이터에 추가
        setPhones(prev => [...prev, ...phonesWithType]);
      } else {
        // 초기 로드: 데이터 교체
        setPhones(phonesWithType);
      }

      // 더 불러올 데이터가 있는지 체크
      const totalFetched = offset + items.length;
      const hasMoreData = totalFetched < count;
      setHasMore(hasMoreData);
      setCurrentOffset(offset + limit);
      setTotalCount(count);

    } catch (error) {
      console.error('Failed to fetch phones:', error);
      toast({
        title: '오류',
        description: '상품을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast, currentOffset]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    if (activeTab === 'phone') {
      // 휴대폰 탭
      fetchPhones(newFilters);
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
  }, [activeTab, fetchPhones, fetchElectronics, fetchAllItems, simpleSearch, simpleRegion]);

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
      fetchPhones({ includeCompleted: true });
    } else if (tab === 'electronics') {
      fetchElectronics({ includeCompleted: true });
    }
  }, [fetchAllItems, fetchPhones, fetchElectronics]);

  // 찜하기 핸들러 - 상세페이지처럼 단순하게
  const handleFavorite = useCallback(async (itemId: number, itemType?: 'phone' | 'electronics') => {
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
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';

      // 현재 아이템 찾기 - 단순하게
      let currentItem: any = null;
      let isFavorited = false;

      if (type === 'electronics') {
        currentItem = electronics.find(e => e.id === itemId);
        if (!currentItem) {
          currentItem = unifiedItems.find(item => item.id === itemId && isElectronicsItem(item));
        }
        // 명확하게 boolean으로 변환
        isFavorited = currentItem?.is_favorited === true || currentItem?.is_favorite === true;
      } else {
        currentItem = phones.find(p => p.id === itemId);
        if (!currentItem) {
          currentItem = unifiedItems.find(item => item.id === itemId && isPhoneItem(item));
        }
        // 명확하게 boolean으로 변환
        isFavorited = currentItem?.is_favorite === true || currentItem?.is_favorited === true;
      }

      console.log('찜하기 토글 상태:', { itemId, type, currentItem, isFavorited });

      // API URL 설정
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/${type === 'electronics' ? 'electronics' : 'phones'}/${itemId}/favorite/`
        : `${baseUrl}/api/used/${type === 'electronics' ? 'electronics' : 'phones'}/${itemId}/favorite/`;

      // 메서드 결정 - 상세페이지와 동일
      const method = isFavorited ? 'DELETE' : 'POST';
      console.log('API 호출:', { apiUrl, method });

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API 응답:', { ok: response.ok, status: response.status });

      if (response.ok) {
        const newFavoriteState = !isFavorited;
        console.log('새로운 상태:', newFavoriteState);

        // 즉시 상태 업데이트 - 모든 필드를 동일하게
        if (type === 'electronics') {
          setElectronics(prev => prev.map(item =>
            item.id === itemId
              ? { ...item, is_favorited: newFavoriteState, is_favorite: newFavoriteState }
              : item
          ));
        } else {
          setPhones(prev => prev.map(phone =>
            phone.id === itemId
              ? { ...phone, is_favorite: newFavoriteState, is_favorited: newFavoriteState }
              : phone
          ));
        }

        // 통합 아이템도 업데이트
        setUnifiedItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return { ...item, is_favorited: newFavoriteState, is_favorite: newFavoriteState };
          }
          return item;
        }));

        toast({
          title: newFavoriteState ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.',
          duration: 1000
        });
      } else {
        console.error('API 오류:', response.status, response.statusText);
        toast({
          title: '오류 발생',
          description: '잠시 후 다시 시도해 주세요.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast({
        title: '오류 발생',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'destructive'
      });
    }
  }, [isAuthenticated, toast, router, activeTab, phones, electronics, unifiedItems]);

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

  // 무한 스크롤을 위한 Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          // 더 불러오기
          if (activeTab === 'all') {
            fetchAllItems(filters, true);
          } else if (activeTab === 'phone') {
            fetchPhones(filters, true);
          } else if (activeTab === 'electronics') {
            fetchElectronics(filters, true);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [activeTab, filters, hasMore, loading, loadingMore, fetchAllItems, fetchPhones, fetchElectronics]);

  // 판매하기 버튼 핸들러 - 통합 등록 페이지로 이동
  const handleCreateClick = async () => {
    try {
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
    } catch (error) {
      console.error('Profile check error:', error);
      toast({
        title: '오류',
        description: '프로필 확인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
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
            // 전자제품 탭: ElectronicsCard 사용
            electronics.map((item, index) => (
              <ElectronicsCard
                key={item.id}
                electronics={item}
                priority={index < 10}
                onFavorite={(id) => handleFavorite(id, 'electronics')}
              />
            ))
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

        {/* 무한 스크롤 트리거 */}
        {!loading && hasMore && (
          <div ref={loadMoreRef} className="h-10" />
        )}

        {/* 추가 데이터 로딩 중 표시 */}
        {loadingMore && (
          <div className="mt-4 py-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>더 많은 상품을 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* 모든 데이터 로드 완료 표시 */}
        {!loading && !loadingMore && !hasMore && totalCount > 0 && (
          <div className="mt-4 py-4 text-center">
            <p className="text-sm text-gray-500">
              모든 상품을 불러왔습니다
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
          router.push('/mypage/settings');
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
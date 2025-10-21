'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Share2, Users, Clock, MapPin, Tag, Calendar, CheckCircle, AlertCircle, Edit, Trash2, TrendingUp, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomProfileCheck } from '@/hooks/useCustomProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import { convertLinksToRedirect, getRedirectUrl } from '@/lib/utils/linkRedirect';

interface CustomDeal {
  id: number;
  title: string;
  description: string;
  type: 'online' | 'offline';
  type_display: string;
  categories: string[];
  regions?: Array<{
    code: string;
    name: string;
    full_name: string;
  }>;
  pricing_type?: 'single_product' | 'all_products' | 'coupon_only';
  products?: Array<{
    name: string;
    original_price: number;
    discount_rate: number;
  }>;
  product_name: string | null;
  original_price: number;
  discount_rate: number;
  final_price: number;
  target_participants: number;
  current_participants: number;
  is_completed: boolean;
  status: string;
  status_display: string;
  expired_at: string;
  completed_at: string | null;
  seller_decision_deadline: string | null;
  discount_valid_days: number | null;
  discount_valid_until: string | null;
  allow_partial_sale: boolean;
  seller: number;
  seller_name: string;
  seller_type: string;
  is_business_verified: boolean;
  online_discount_type: string | null;
  online_discount_type_display: string | null;
  discount_url: string | null;
  location: string | null;
  location_detail: string | null;
  phone_number: string | null;
  usage_guide: string | null;
  view_count: number;
  favorite_count: number;
  images: Array<{
    id: number;
    image_url: string;
    order_index: number;
    is_primary: boolean;
  }>;
  is_favorited: boolean;
  is_participated: boolean;
  created_at: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

export default function CustomDealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [deal, setDeal] = useState<CustomDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  // 터치 스와이프 상태
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchEndX, setTouchEndX] = useState<number>(0);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [bumpStatus, setBumpStatus] = useState<{
    can_bump: boolean;
    reason?: string;
    next_bump_available_at?: string;
  } | null>(null);

  const {
    checkProfile,
    missingFields,
    showProfileModal,
    setShowProfileModal,
  } = useCustomProfileCheck();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchDeal();
    }
  }, [params.id]);

  useEffect(() => {
    // 본인 공구일 때만 끌올 상태 체크
    if (deal && user && deal.seller === parseInt(user.id) && deal.status === 'recruiting') {
      checkBumpStatus();
    }
  }, [deal, user]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom/categories/`);
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = {};

      // 로그인한 경우 토큰 추가 (is_participated, is_favorited 체크용)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${params.id}/`, {
        headers
      });

      if (response.status === 404) {
        toast.error('존재하지 않는 공구입니다');
        router.push('/custom-deals');
        return;
      }

      if (!response.ok) {
        throw new Error(`서버 오류 (${response.status})`);
      }

      const data = await response.json();
      setDeal(data);
    } catch (error) {
      console.error('로드 실패:', error);
      toast.error('공구 정보를 불러오는데 실패했습니다');
      router.push('/custom-deals');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!deal) return;

    const token = localStorage.getItem('accessToken');

    if (!token) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    try {
      const method = deal.is_favorited ? 'DELETE' : 'POST';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${deal.id}/favorite/`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        toast.error('로그인이 만료되었습니다');
        localStorage.removeItem('accessToken');
        router.push('/login');
        return;
      }

      if (!response.ok) throw new Error('Failed to toggle favorite');

      setDeal({
        ...deal,
        is_favorited: !deal.is_favorited,
        favorite_count: deal.is_favorited ? deal.favorite_count - 1 : deal.favorite_count + 1,
      });

      toast.success(deal.is_favorited ? '찜 해제되었습니다' : '찜 목록에 추가되었습니다');
    } catch (error) {
      console.error('찜하기 실패:', error);
      toast.error('찜하기에 실패했습니다');
    }
  };

  const handleParticipate = async () => {
    if (!deal) return;

    // 로그인 체크
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    if (deal.is_participated) {
      toast.info('이미 참여하신 공구입니다');
      return;
    }

    if (deal.status !== 'recruiting') {
      toast.error('현재 참여할 수 없는 공구입니다');
      return;
    }

    const isProfileComplete = await checkProfile(false);
    if (!isProfileComplete) {
      setShowProfileModal(true);
      return;
    }

    // 내가 만든 공구는 참여 불가
    if (user && deal.seller === parseInt(user.id)) {
      toast.error('본인이 등록한 공구는 참여할 수 없습니다');
      return;
    }

    // 가격 정보 처리
    let confirmMessage = `${deal.title}\n\n`;

    if (deal.pricing_type === 'coupon_only') {
      confirmMessage += `쿠폰전용\n\n`;
    } else if (deal.original_price && deal.final_price) {
      const finalPriceStr = typeof deal.final_price === 'object' && deal.final_price !== null
        ? ((deal.final_price as any).min || 0).toLocaleString()
        : deal.final_price.toLocaleString();
      confirmMessage += `정가: ${deal.original_price.toLocaleString()}원\n할인가: ${finalPriceStr}원 (${deal.discount_rate}% 할인)\n\n`;
    } else {
      confirmMessage += `전품목 ${deal.discount_rate}% 할인\n\n`;
    }

    confirmMessage += '참여하시겠습니까?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${deal.id}/participate/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '참여 실패');
      }

      toast.success('참여가 완료되었습니다!');
      fetchDeal();
    } catch (error: any) {
      console.error('참여 실패:', error);
      toast.error(error.message || '참여에 실패했습니다');
    }
  };

  const handleShare = async () => {
    if (!deal) return;

    const url = window.location.href;

    let shareText = '';

    if (deal.pricing_type === 'coupon_only') {
      shareText = `${deal.title} - 선착순 쿠폰증정`;
    } else if (deal.final_price) {
      const finalPriceStr = typeof deal.final_price === 'object' && deal.final_price !== null
        ? ((deal.final_price as any).min || 0).toLocaleString()
        : deal.final_price.toLocaleString();
      shareText = `${deal.title} - ${finalPriceStr}원 (${deal.discount_rate}% 할인)`;
    } else {
      shareText = `${deal.title} - 전품목 ${deal.discount_rate}% 할인`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: '둥지마켓 커스텀 특가',
          text: shareText,
          url: url,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('링크가 복사되었습니다');
  };

  const handleEarlyClose = async () => {
    if (!deal) return;

    if (!confirm('공구를 조기 종료하시겠습니까?\n\n현재 참여 인원에게 할인/쿠폰 정보가 즉시 발급됩니다.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        toast.error('로그인이 필요합니다');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${deal.id}/early_close/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        toast.error('로그인이 만료되었습니다');
        localStorage.removeItem('accessToken');
        router.push('/login');
        return;
      }

      if (response.status === 403 || response.status === 400) {
        const errorData = await response.json();
        toast.error(errorData.error || '조기 종료할 수 없습니다');
        return;
      }

      if (!response.ok) {
        throw new Error('조기 종료 실패');
      }

      toast.success('공구가 조기 종료되었습니다');
      fetchDeal();
    } catch (error) {
      console.error('조기 종료 실패:', error);
      toast.error('조기 종료에 실패했습니다');
    }
  };

  const handleDelete = async () => {
    if (!deal) return;

    if (!confirm('정말 삭제하시겠습니까?\n삭제된 공구는 복구할 수 없습니다.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        toast.error('로그인이 필요합니다');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${deal.id}/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        toast.error('로그인이 만료되었습니다');
        localStorage.removeItem('accessToken');
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        toast.error('삭제 권한이 없습니다');
        return;
      }

      if (response.status === 400) {
        const errorData = await response.json();
        toast.error(errorData.error || '삭제할 수 없습니다');
        return;
      }

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      toast.success('공구가 삭제되었습니다');
      router.push('/custom-deals');
    } catch (error) {
      console.error('삭제 실패:', error);
      toast.error('삭제에 실패했습니다');
    }
  };

  const checkBumpStatus = async () => {
    if (!deal) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${deal.id}/bump/status/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBumpStatus(data);
      }
    } catch (error) {
      console.error('끌올 상태 조회 실패:', error);
    }
  };

  const handleBump = async () => {
    if (!deal) return;

    if (!bumpStatus?.can_bump) {
      toast.error(bumpStatus?.reason || '끌올할 수 없습니다');
      return;
    }

    if (!confirm('끌올하시겠습니까?\n\n끌올하면 24시간 후 다시 사용할 수 있습니다.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('로그인이 필요합니다');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${deal.id}/bump/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        toast.error('로그인이 만료되었습니다');
        localStorage.removeItem('accessToken');
        router.push('/login');
        return;
      }

      if (response.status === 400) {
        const errorData = await response.json();
        toast.error(errorData.error || '끌올에 실패했습니다');
        return;
      }

      if (!response.ok) {
        throw new Error('끌올 실패');
      }

      toast.success('끌올이 완료되었습니다');
      router.push('/custom-deals'); // 목록으로 이동
    } catch (error) {
      console.error('끌올 실패:', error);
      toast.error('끌올에 실패했습니다');
    }
  };

  const getRemainingTime = (expiredAt: string) => {
    const now = new Date();
    const expire = new Date(expiredAt);
    const diff = expire.getTime() - now.getTime();

    if (diff <= 0) return '마감';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간 남음`;
    if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
    return `${minutes}분 남음`;
  };

  // 터치 스와이프 핸들러 (메인 갤러리)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || !deal) return;

    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // 최소 스와이프 거리 (px)
    const imageCount = deal.images.length;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // 왼쪽으로 스와이프 = 다음 이미지
        setSelectedImage((prev) =>
          prev === imageCount - 1 ? 0 : prev + 1
        );
      } else {
        // 오른쪽으로 스와이프 = 이전 이미지
        setSelectedImage((prev) =>
          prev === 0 ? imageCount - 1 : prev - 1
        );
      }
    }

    // 리셋
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // 터치 스와이프 핸들러 (라이트박스)
  const handleLightboxTouchEnd = () => {
    if (!touchStartX || !touchEndX || !deal) return;

    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // 최소 스와이프 거리 (px)
    const imageCount = deal.images.length;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // 왼쪽으로 스와이프 = 다음 이미지
        setLightboxImageIndex((prev) =>
          prev === imageCount - 1 ? 0 : prev + 1
        );
      } else {
        // 오른쪽으로 스와이프 = 이전 이미지
        setLightboxImageIndex((prev) =>
          prev === 0 ? imageCount - 1 : prev - 1
        );
      }
    }

    // 리셋
    setTouchStartX(0);
    setTouchEndX(0);
  };

  const getStatusBadge = () => {
    if (!deal) return null;

    if (deal.status === 'completed') {
      return <Badge className="bg-red-50 text-red-600 border-red-200">선착순 마감</Badge>;
    }
    if (deal.status === 'recruiting') {
      const progress = (deal.current_participants / deal.target_participants) * 100;
      if (progress >= 80) {
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200">마감 임박</Badge>;
      }
      return <Badge className="bg-blue-50 text-blue-600 border-blue-200">모집중</Badge>;
    }
    if (deal.status === 'pending_seller') {
      return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">판매자 결정 대기</Badge>;
    }
    if (deal.status === 'cancelled') {
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200">취소됨</Badge>;
    }
    if (deal.status === 'expired') {
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200">기간만료</Badge>;
    }
    return <Badge variant="secondary">{deal.status_display}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return null;
  }

  const sortedImages = [...deal.images].sort((a, b) => a.order_index - b.order_index);
  const progress = (deal.current_participants / deal.target_participants) * 100;
  const isClosed = deal.status === 'completed' || deal.status === 'cancelled' || deal.status === 'expired';

  // 카테고리 영어 → 한글 변환
  const getCategoryLabel = (value: string) => {
    const category = categories.find(cat => cat.value === value);
    const label = category ? category.label : value;
    // "건강/의료" → "건강/헬스케어"로 표시
    return label === '건강/의료' ? '건강/헬스케어' : label;
  };

  // 상품 설명의 모든 링크를 리다이렉트 페이지를 거치도록 변환
  const convertedDescription = deal?.description ? convertLinksToRedirect(deal.description) : '';

  // 할인 링크도 리다이렉트 페이지를 거치도록 변환
  const redirectDiscountUrl = deal?.discount_url ? getRedirectUrl(deal.discount_url) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/custom-deals')}
              className="flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>목록</span>
            </Button>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/custom-deals/my')}
                className="flex items-center gap-1.5 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Users className="w-4 h-4" />
                <span>관리내역</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 마감 배너 */}
        {isClosed && (
          <div className="mb-6 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg p-6 text-center border-2 border-slate-400 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <AlertCircle className="w-8 h-8 text-white flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">마감된 공구입니다</h2>
                <p className="text-slate-200 text-sm">
                  {deal.status === 'completed' && '목표 인원이 달성되어 조기 종료되었습니다'}
                  {deal.status === 'cancelled' && '판매자에 의해 취소되었습니다'}
                  {deal.status === 'expired' && '모집 기간이 종료되었습니다'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div
              className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4 relative group"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {sortedImages.length > 0 ? (
                <>
                  <button
                    onClick={() => {
                      setLightboxImageIndex(selectedImage);
                      setShowImageLightbox(true);
                    }}
                    className="w-full cursor-zoom-in"
                  >
                    <img
                      src={sortedImages[selectedImage].image_url}
                      alt={deal.title}
                      className={`w-full aspect-square object-contain ${isClosed ? 'opacity-50' : ''}`}
                    />
                  </button>

                  {/* 확대 버튼 */}
                  <button
                    onClick={() => {
                      setLightboxImageIndex(selectedImage);
                      setShowImageLightbox(true);
                    }}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>

                  {/* 좌우 네비게이션 (이미지 2개 이상일 때) */}
                  {sortedImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage((prev) =>
                          prev === 0 ? sortedImages.length - 1 : prev - 1
                        )}
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                      >
                        <ChevronLeft className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) =>
                          prev === sortedImages.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                      >
                        <ChevronRight className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      </button>
                    </>
                  )}

                  {isClosed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                      <div className="text-white font-bold text-5xl drop-shadow-lg">마감</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Tag className="w-24 h-24 text-slate-300" />
                </div>
              )}
            </div>

            {/* Thumbnail Grid */}
            {sortedImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {sortedImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${deal.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <Badge className="absolute top-1 left-1 bg-blue-600 text-white text-[11px] px-2 py-0.5 pointer-events-none whitespace-nowrap leading-none font-medium">
                        대표
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Info */}
          <div className="space-y-4">
            {/* Title & Status */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">
                  {deal.type === 'offline' ? '오프라인매장' : '온라인'}
                </Badge>
                {getStatusBadge()}
              </div>
              <div className="flex items-start gap-2 mb-3 relative">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight flex-1">{deal.title}</h1>
                <span
                  className="text-lg font-black whitespace-nowrap flex-shrink-0"
                  style={{
                    transform: 'rotate(-8deg)',
                    marginTop: '-4px',
                    background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  모이면 할인!
                </span>
              </div>

              <div className="space-y-1.5">
                {/* Location (offline only) */}
                {deal.type === 'offline' && deal.regions && deal.regions.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{deal.regions.map(r => r.full_name).join(', ')}</span>
                  </div>
                )}

                {/* Seller Info */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>{deal.seller_name}</span>
                  {deal.is_business_verified && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">사업자 인증</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Price */}
            <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-5">
                {deal.pricing_type === 'coupon_only' ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      선착순 쿠폰증정
                    </div>
                    <p className="text-xs text-slate-600">인원 마감 시 쿠폰이 발급됩니다</p>
                  </div>
                ) : deal.original_price && deal.final_price ? (
                  <>
                    {/* products 배열 우선, 없으면 product_name 폴백 */}
                    {deal.products && deal.products.length > 0 && deal.products[0].name && (
                      <div className="text-sm text-slate-700 mb-2 font-medium">
                        {deal.products[0].name}
                      </div>
                    )}
                    {!deal.products && deal.product_name && (
                      <div className="text-sm text-slate-700 mb-2 font-medium">
                        {deal.product_name}
                      </div>
                    )}
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-sm text-slate-500 line-through">
                        {deal.original_price.toLocaleString()}원
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-red-500 text-white text-sm px-2 py-0.5">
                          {deal.discount_rate}%
                        </Badge>
                        <span className="text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                          커공특가
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                      {typeof deal.final_price === 'object' && deal.final_price !== null
                        ? ((deal.final_price as any).min || 0).toLocaleString()
                        : deal.final_price.toLocaleString()}원
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                      <span className="text-2xl font-bold text-blue-600">
                        전품목 {deal.discount_rate}% 할인
                      </span>
                      <span className="text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                        커공특가
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">매장에서 직접 할인 받으세요</p>
                  </div>
                )}

                {/* 안내 문구 */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500 text-center">
                    인원 마감 기준 특가 (인원 미달시 판매가 취소될 수 있습니다)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress - 눈에 띄는 디자인 */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 rounded-full p-1.5">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-0.5">현재 참여 인원</p>
                      <span className="text-lg font-bold text-blue-600">
                        {deal.current_participants}명
                      </span>
                      <span className="text-sm text-slate-600"> / {deal.target_participants}명</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm bg-white px-3 py-1.5 rounded-full border border-slate-200">
                    <Clock className="w-4 h-4" />
                    <CountdownTimer
                      endTime={deal.expired_at}
                      onExpire={() => setIsExpired(true)}
                      format="compact"
                      showLabel={false}
                      className="font-medium"
                    />
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      progress >= 80 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                      'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-blue-600 mt-2">
                  {Math.round(progress)}% 달성
                  {progress >= 100 && ' 🎉'}
                  {progress >= 80 && progress < 100 && ' 🔥'}
                </p>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 mb-2 text-sm">카테고리</h3>
                <div className="flex flex-wrap gap-1.5">
                  {deal.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {getCategoryLabel(category)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>조회 {deal.view_count}</span>
              <span>•</span>
              <span>찜 {deal.favorite_count}</span>
              <span>•</span>
              <span>{new Date(deal.created_at).toLocaleDateString()}</span>
            </div>

            {/* 공유하기 & 찜하기 버튼 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>공유하기</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFavorite}
                className={`flex-1 flex items-center justify-center gap-1.5 ${deal.is_favorited ? 'text-red-600 border-red-200 bg-red-50' : ''}`}
              >
                <Heart className={`w-4 h-4 ${deal.is_favorited ? 'fill-current' : ''}`} />
                <span>{deal.is_favorited ? '찜 해제' : '찜하기'}</span>
              </Button>
            </div>

            {/* Participate Button */}
            {/* 참여 완료 상태 - 항상 비활성 버튼으로 표시 */}
            {deal.is_participated && (!user || deal.seller !== parseInt(user.id)) && (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full font-semibold py-6 bg-slate-100 text-slate-600 cursor-not-allowed hover:bg-slate-100"
                  disabled
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    참여완료
                  </span>
                </Button>

                {/* 할인 제공 안내 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700 font-medium">
                      인원 마감시 비공개 할인링크 또는 코드가 발송됩니다
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 참여 가능 상태 - 모집 중이고 참여하지 않은 경우 */}
            {deal.status === 'recruiting' &&
             !deal.is_participated &&
             !isExpired &&
             deal.current_participants < deal.target_participants &&
             (!user || deal.seller !== parseInt(user.id)) && (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full font-semibold py-6 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed"
                  onClick={handleParticipate}
                  disabled={user?.penalty_info?.is_active || user?.penaltyInfo?.isActive}
                >
                  참여하기
                </Button>

                {/* 할인 제공 안내 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700 font-medium">
                      인원 마감시 비공개 할인링크 또는 코드가 발송됩니다
                    </p>
                  </div>
                </div>

                {/* 패널티 안내 메시지 */}
                {user && (user?.penalty_info?.is_active || user?.penaltyInfo?.isActive) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 mb-1">
                          패널티로 인해 공구 참여가 제한됩니다
                        </p>
                        <p className="text-xs text-red-700">
                          남은 시간: {user?.penalty_info?.remaining_text || user?.penaltyInfo?.remainingText ||
                            `${user?.penalty_info?.remaining_hours || user?.penaltyInfo?.remainingHours || 0}시간 ${user?.penalty_info?.remaining_minutes || user?.penaltyInfo?.remainingMinutes || 0}분`}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          사유: {user?.penalty_info?.reason || user?.penaltyInfo?.reason || '패널티 적용 중'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 마감된 공구 - 참여하지 않은 경우 */}
            {deal.status === 'completed' && !deal.is_participated && (!user || deal.seller !== parseInt(user.id)) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">마감된 특가</p>
                  <p className="text-xs text-slate-600">다른 공구를 확인해보세요</p>
                </div>
              </div>
            )}

            {/* 판매자 관리 버튼 (본인 공구, 모집중) */}
            {user && deal.seller === parseInt(user.id) && !isClosed && (
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">공구 관리</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBump}
                    disabled={!bumpStatus?.can_bump}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <TrendingUp className="w-4 h-4" />
                    끌올
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/custom-deals/${deal.id}/edit`)}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    수정
                  </Button>
                  {deal.current_participants >= 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEarlyClose}
                      className="flex items-center justify-center gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <AlertCircle className="w-4 h-4" />
                      조기종료
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </Button>
                </div>
                {bumpStatus && !bumpStatus.can_bump && bumpStatus.next_bump_available_at && (
                  <p className="text-xs text-slate-500 text-center mt-2">
                    끌올 가능: {new Date(bumpStatus.next_bump_available_at).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description & Details */}
        <div className="mt-6 space-y-4">
          {/* Description */}
          <Card className="border-slate-200 max-w-4xl mx-auto">
            <CardContent className="p-5">
              <div
                className="text-slate-700 text-sm leading-relaxed break-words overflow-wrap-anywhere"
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                <div
                  className="[&>p]:mb-3 [&>p]:mt-0 [&>ul]:mb-3 [&>ol]:mb-3 [&>h1]:mb-3 [&>h2]:mb-3 [&>h3]:mb-3"
                  dangerouslySetInnerHTML={{ __html: convertedDescription }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Usage Guide */}
          {deal.usage_guide && (
            <Card id="usage-guide-section" className="border-slate-200 scroll-mt-4 max-w-4xl mx-auto">
              <CardContent className="p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-3">이용 안내</h2>
                <div className="prose prose-slate prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">{deal.usage_guide}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Offline - 매장 정보 */}
          {deal.type === 'offline' && (
            <Card className="border-slate-200 max-w-4xl mx-auto">
              <CardContent className="p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-3">매장 정보</h2>
                <div className="space-y-2.5">
                  {deal.location && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{deal.location}</p>
                        {deal.location_detail && (
                          <p className="text-xs text-slate-600">{deal.location_detail}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {deal.phone_number && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <span className="text-slate-400">📞</span>
                      <a
                        href={`tel:${deal.phone_number}`}
                        className="text-blue-600 hover:underline"
                      >
                        {deal.phone_number}
                      </a>
                    </div>
                  )}
                  {deal.discount_valid_days && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">
                        할인 유효기간: {deal.discount_valid_days}일
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Online - 할인 정보 (공구 완료 후 참여자만 표시) */}
          {deal.type === 'online' && redirectDiscountUrl && deal.status === 'completed' && deal.is_participated && (
            <Card className="border-slate-200 max-w-4xl mx-auto">
              <CardContent className="p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-3">할인 정보</h2>
                <a
                  href={redirectDiscountUrl}
                  className="w-full inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  할인 링크로 이동
                </a>
              </CardContent>
            </Card>
          )}

          {/* Online - 상품 문의 (전화번호, 있을 때만) */}
          {deal.type === 'online' && deal.phone_number && (
            <Card className="border-slate-200 max-w-4xl mx-auto">
              <CardContent className="p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-3">상품 문의</h2>
                <div className="flex items-center gap-2.5 text-sm">
                  <span className="text-slate-400">📞</span>
                  <a
                    href={`tel:${deal.phone_number}`}
                    className="text-blue-600 hover:underline"
                  >
                    {deal.phone_number}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      {showImageLightbox && sortedImages.length > 0 && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4">
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <img
              src={sortedImages[lightboxImageIndex].image_url}
              alt={`${deal.title} ${lightboxImageIndex + 1}`}
              className="object-contain max-w-full max-h-full"
            />

            {/* 라이트박스 네비게이션 */}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxImageIndex((prev) =>
                    prev === 0 ? sortedImages.length - 1 : prev - 1
                  )}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:scale-110 transition-transform"
                >
                  <ChevronLeft className="w-10 h-10 text-white opacity-50 hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={() => setLightboxImageIndex((prev) =>
                    prev === sortedImages.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:scale-110 transition-transform"
                >
                  <ChevronRight className="w-10 h-10 text-white opacity-50 hover:opacity-100 transition-opacity" />
                </button>

                {/* 이미지 카운터 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  {lightboxImageIndex + 1} / {sortedImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Profile Check Modal */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
        onUpdateProfile={() => {
          setShowProfileModal(false);
          router.push('/mypage');
        }}
      />
    </div>
  );
}
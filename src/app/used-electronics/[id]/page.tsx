/**
 * 전자제품/PC 상세 페이지
 * /used-electronics/[id]
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Heart, MapPin, Eye, Clock, Shield, MessageCircle,
  ChevronLeft, ChevronRight, Share2, AlertTriangle,
  Check, X, Package, User, Edit3, Trash2, Banknote, Info, ZoomIn,
  CheckCircle2, MessageSquarePlus, Calendar, Tag, Box, FileCheck, Settings
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import Link from 'next/link';
import TradeCompleteModal from '@/components/used/TradeCompleteModal';
import TradeReviewModal from '@/components/used/TradeReviewModal';
import { Button } from '@/components/ui/button';
import BumpButton from '@/components/mypage/sales/BumpButton';
import bumpAPI from '@/lib/api/bump';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useUsedProfileCheck } from '@/hooks/useUsedProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import electronicsApi from '@/lib/api/electronics';
import type { UsedElectronics, ElectronicsOffer } from '@/types/electronics';
import {
  ELECTRONICS_SUBCATEGORIES,
  CONDITION_GRADES,
  PURCHASE_PERIODS,
  ELECTRONICS_STATUS
} from '@/types/electronics';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default async function UsedElectronicsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UsedElectronicsDetailClient electronicsId={id} />;
}

function UsedElectronicsDetailClient({ electronicsId }: { electronicsId: string }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const {
    isProfileComplete,
    checkProfile,
    missingFields,
    showProfileModal,
    setShowProfileModal
  } = useUsedProfileCheck();

  const [electronics, setElectronics] = useState<UsedElectronics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  // Swiper 상태
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  // 터치 스와이프 상태 (Swiper 사용으로 제거 예정)
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchEndX, setTouchEndX] = useState<number>(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkingOffers, setCheckingOffers] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showGradeInfo, setShowGradeInfo] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [offers, setOffers] = useState<ElectronicsOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [myOffer, setMyOffer] = useState<ElectronicsOffer | null>(null);
  const [loadingMyOffer, setLoadingMyOffer] = useState(false);
  const [remainingOffers, setRemainingOffers] = useState<number | null>(null);
  const [offerCount, setOfferCount] = useState<number | null>(null); // 사용자의 총 제안 횟수
  const [activeOffersCount, setActiveOffersCount] = useState<number>(0); // 취소된 제안 제외한 활성 제안 수
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [showTradeCompleteModal, setShowTradeCompleteModal] = useState(false);
  const [showTradeReviewModal, setShowTradeReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<'buyer' | 'seller' | null>(null);
  const [reviewCompleted, setReviewCompleted] = useState(false);

  // 가격 포맷팅 헬퍼 함수
  const formatPrice = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers || numbers === '0') return '';
    // 숫자를 원화 형식으로 변환
    return Number(numbers).toLocaleString('ko-KR');
  };

  // 가격 언포맷팅 헬퍼 함수
  const unformatPrice = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  // 메시지 템플릿
  const messageTemplates = {
    "즉시 거래": [
      "오늘 바로 거래 가능합니다",
      "2시간 내 만날 수 있습니다",
      "지금 출발 가능합니다"
    ],
    "일정 조율": [
      "이번 주말 거래 가능합니다",
      "평일 저녁 7시 이후 가능합니다",
      "내일 거래 가능합니다"
    ],
    "위치 관련": [
      "거래 장소 근처입니다",
      "어디든 찾아가겠습니다",
      "중간 지점에서 만나요"
    ],
    "구매 확정": [
      "제안 금액에 구매하겠습니다",
      "실물 확인 후 구매 확정합니다",
      "이 가격에 구매 의사 있습니다"
    ],
    "간단 인사": [
      "거래 부탁드립니다",
      "연락 주세요",
      "확인 부탁드립니다"
    ]
  };

  // 활성 제안 수 조회 (취소된 제안 제외)
  const fetchActiveOffersCount = async () => {
    try {
      const result = await electronicsApi.getActiveOffersCount(parseInt(electronicsId));
      setActiveOffersCount(result.count);
    } catch (error) {
      console.error('Failed to fetch active offers count:', error);
      setActiveOffersCount(0);
    }
  };

  // 상품 정보 조회
  useEffect(() => {
    fetchElectronicsDetail();
    fetchActiveOffersCount(); // 활성 제안 수 조회
    if (isAuthenticated) {
      fetchMyOffer();
    }
  }, [electronicsId, isAuthenticated]);

  // 모달이 열렸을 때 배경 스크롤 방지
  useEffect(() => {
    if (showOfferModal || showDeleteModal || showOffersModal || showAcceptModal || showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // cleanup 함수: 컴포넌트 언마운트 시 overflow 초기화
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showOfferModal, showDeleteModal, showOffersModal, showAcceptModal, showConfirmModal]);

  const fetchElectronicsDetail = async () => {
    try {
      setLoading(true);
      const data = await electronicsApi.getElectronicsDetail(Number(electronicsId));
      setElectronics(data);
      setIsFavorite(data.is_favorited || false);
    } catch (error) {
      console.error('Failed to fetch electronics:', error);
      toast.error('상품 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOffer = async () => {
    try {
      setLoadingMyOffer(true);
      const offer = await electronicsApi.getMyOffer(Number(electronicsId));
      setMyOffer(offer);
      // 사용자의 총 제안 횟수 가져오기 (제안이 없어도 0으로 설정)
      const count = offer?.user_offer_count || 0;
      setOfferCount(count);
      setRemainingOffers(Math.max(0, 5 - count));
    } catch (error) {
      console.error('Failed to fetch my offer:', error);
      // 제안이 없는 경우 (404 등) 0으로 초기화
      setOfferCount(0);
      setRemainingOffers(5);
    } finally {
      setLoadingMyOffer(false);
    }
  };

  const fetchOffers = async () => {
    if (!electronics?.is_mine) return;

    try {
      setLoadingOffers(true);
      const data = await electronicsApi.getOffers(Number(electronicsId));
      setOffers(data);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      toast.error('제안 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoadingOffers(false);
    }
  };

  // 공유하기
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${electronics?.brand} ${electronics?.model_name}`,
          text: `${electronics?.price?.toLocaleString()}원`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다.');
    }
  };

  // 이미지 네비게이션
  const handlePrevImage = () => {
    setCurrentImageIndex(prev =>
      prev > 0 ? prev - 1 : (electronics?.images?.length || 1) - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev =>
      prev < (electronics?.images?.length || 1) - 1 ? prev + 1 : 0
    );
  };

  // 터치 스와이프 핸들러 (메인 갤러리)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // 최소 스와이프 거리 (px)

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // 왼쪽으로 스와이프 = 다음 이미지
        handleNextImage();
      } else {
        // 오른쪽으로 스와이프 = 이전 이미지
        handlePrevImage();
      }
    }

    // 리셋
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // 터치 스와이프 핸들러 (라이트박스)
  const handleLightboxTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // 최소 스와이프 거리 (px)

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // 왼쪽으로 스와이프 = 다음 이미지
        setLightboxImageIndex((prev) =>
          prev === (electronics?.images?.length || 1) - 1 ? 0 : prev + 1
        );
      } else {
        // 오른쪽으로 스와이프 = 이전 이미지
        setLightboxImageIndex((prev) =>
          prev === 0 ? (electronics?.images?.length || 1) - 1 : prev - 1
        );
      }
    }

    // 리셋
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // 찜하기
  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('찜하기는 로그인 후 이용 가능합니다.');
      router.push('/login');
      return;
    }

    // 거래 완료 상품은 찜 불가
    if (electronics?.status === 'sold') {
      toast.error('거래 완료된 상품은 찜할 수 없습니다.');
      return;
    }

    try {
      const response = await electronicsApi.toggleFavorite(Number(electronicsId), isFavorite || false);
      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);
      toast.success(
        newFavoriteState ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.'
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('찜하기 처리 중 오류가 발생했습니다.');
    }
  };

  // 제안 취소
  const handleCancelOffer = async () => {
    if (!myOffer) return;

    try {
      // 전자제품 API는 offer ID만 필요
      await electronicsApi.cancelOffer(myOffer.id);
      setMyOffer(null);
      toast.success('제안이 취소되었습니다.');
      fetchMyOffer();
      // offerCount 업데이트
      setOfferCount(prev => prev !== null ? Math.max(0, prev - 1) : prev);
    } catch (error) {
      console.error('Failed to cancel offer:', error);
      toast.error('제안 취소에 실패했습니다.');
    }
  };

  // 가격 제안
  const handleOffer = async () => {
    if (!isAuthenticated) {
      toast.error('가격 제안은 로그인 후 이용 가능합니다.');
      router.push('/login');
      return;
    }

    const profileComplete = await checkProfile();
    if (!profileComplete) {
      setShowProfileModal(true);
      return;
    }

    // 기존 제안이 있으면 값을 설정
    if (myOffer) {
      setOfferAmount(myOffer.offered_price?.toString() || '');
      setDisplayAmount(myOffer.offered_price?.toLocaleString() || '');
      setOfferMessage(myOffer.message || '');
    }
    setShowOfferModal(true);
  };

  // 가격 제안 확인
  const handleOfferConfirm = () => {
    let amount = parseInt(offerAmount);

    if (!amount || amount < (electronics?.min_offer_price || 0)) {
      toast.error(`최소 제안 금액은 ${electronics?.min_offer_price?.toLocaleString()}원입니다.`, {
        duration: 3000,
      });
      return;
    }

    // 천원 단위로 반올림 (1원 단위 입력 시 자동 반올림)
    const roundedAmount = Math.round(amount / 1000) * 1000;
    if (roundedAmount !== amount) {
      amount = roundedAmount;
      setOfferAmount(amount.toString());
      setDisplayAmount(amount.toLocaleString('ko-KR'));
      toast.info(`천원 단위로 조정되었습니다: ${amount.toLocaleString()}원`, {
        duration: 2000,
      });
    }

    if (amount > 100000000) {
      toast.error('최대 제안 가능 금액은 1억원입니다.', {
        duration: 3000,
      });
      return;
    }

    if (offerCount !== null && offerCount >= 5) {
      toast.error('해당 상품에 최대 5회까지만 제안 가능합니다.', {
        duration: 3000,
      });
      return;
    }

    setShowConfirmModal(true);
  };

  // 가격 제안 실행 (메시지를 매개변수로 받도록 수정)
  const handleSubmitOffer = async (messageToSend?: string) => {
    if (!isAuthenticated) {
      toast.error('가격 제안은 로그인 후 이용 가능합니다.', {
        duration: 3000,
      });
      router.push('/login');
      return;
    }

    const amount = parseInt(offerAmount);
    // 수정인지 신규 제안인지 확인
    const isModification = myOffer && myOffer.status === 'pending';
    // 전달받은 메시지가 있으면 사용, 없으면 상태값 사용
    const finalMessage = messageToSend !== undefined ? messageToSend : offerMessage;

    try {
      console.log('[제안 전송] 메시지:', finalMessage);

      const response = await electronicsApi.createOffer(Number(electronicsId), {
        offered_price: amount,
        message: finalMessage
      });

      // 즉시구매 여부 확인 (가격이 즉시구매가와 같을 때)
      if (electronics && amount === electronics.price) {
        toast.success('즉시구매 완료! 거래가 시작되었습니다.', {
          duration: 3000,
        });

        // 모달 닫기
        setShowOfferModal(false);
        setShowConfirmModal(false);

        // 1초 후 구매내역 거래중 탭으로 이동
        setTimeout(() => {
          router.push('/used/mypage?tab=purchases&filter=trading');
        }, 1000);

        return;
      }

      // 일반 제안의 경우
      toast.success(isModification ? '가격 제안이 수정되었습니다.' : '판매자에게 가격 제안이 전달되었습니다.');
      setShowOfferModal(false);
      setShowConfirmModal(false);
      setOfferAmount('');
      setDisplayAmount('');
      setOfferMessage('');
      setSelectedMessages([]);

      // 내 제안 정보 다시 불러오기
      await fetchMyOffer();
      await fetchElectronicsDetail();
      await fetchActiveOffersCount(); // 활성 제안 수 업데이트
    } catch (error) {
      console.error('Failed to submit offer:', error);
      toast.error('가격 제안 전송에 실패했습니다.');
    }
  };

  // 제안 수락
  const handleAcceptOffer = async () => {
    if (!selectedOfferId) return;

    try {
      await electronicsApi.acceptOffer(Number(electronicsId), selectedOfferId);
      toast.success('제안을 수락했습니다.');
      setShowAcceptModal(false);
      setShowOffersModal(false);
      fetchElectronicsDetail();
      fetchActiveOffersCount();
    } catch (error) {
      console.error('Failed to accept offer:', error);
      toast.error('제안 수락에 실패했습니다.');
    }
  };

  // 최신 제안 확인
  const checkLatestOffers = async (): Promise<number> => {
    try {
      const data = await electronicsApi.getElectronicsDetail(Number(electronicsId));
      return data.offer_count || 0;
    } catch (error) {
      console.error('Failed to check latest offers:', error);
      return 0;
    }
  };

  // 삭제 처리 - 실시간 제안 체크 추가
  const handleDelete = async () => {
    if (!electronics) return;

    setDeleting(true);

    try {
      // 삭제 전 최신 제안 상태 확인
      const latestOfferCount = await checkLatestOffers();

      // 이전에 제안이 없었는데 새로 생긴 경우
      if (activeOffersCount === 0 && latestOfferCount > 0) {
        setDeleting(false);
        toast.error('방금 새로운 제안이 도착했습니다. 제안이 있는 상품은 삭제 시 6시간 패널티가 적용됩니다.');
        // 상품 정보 새로고침
        await fetchElectronicsDetail();
        await fetchActiveOffersCount();
        return;
      }

      await electronicsApi.deleteElectronics(Number(electronicsId));

      // TODO: 백엔드에서 패널티 정보 반환 시 처리
      toast.success('상품이 삭제되었습니다.');
      router.push('/used/mypage?tab=sales');
    } catch (error: any) {
      console.error('Failed to delete electronics:', error);

      // 제안이 있는 경우 패널티 경고
      if (error.response?.data?.has_offers) {
        toast.error(error.response.data.message || '제안된 가격이 있어 6시간 패널티가 적용됩니다.');
        setDeleting(false);
        return;
      }

      toast.error(error.response?.data?.message || '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  // 거래 완료 - 모달 열기로 변경
  const handleCompleteTransaction = () => {
    setShowTradeCompleteModal(true);
  };

  // 거래 취소
  const handleCancelTrade = async () => {
    console.log('🔥 전자제품 거래 취소 시작!');
    console.log('electronicsId:', electronicsId);
    console.log('cancelReason:', cancelReason);
    console.log('customCancelReason:', customCancelReason);

    if (!cancelReason) {
      toast.error('취소 사유를 선택해주세요.');
      return;
    }

    if (cancelReason === 'other' && !customCancelReason.trim()) {
      toast.error('취소 사유를 입력해주세요.');
      return;
    }

    // 새로고침 전에 확인 가능한 alert
    alert(`전자제품 취소 데이터:\nelectronicsId: ${electronicsId}\nreason: ${cancelReason}\ncustomReason: ${customCancelReason}`);

    const requestData = {
      reason: cancelReason,
      custom_reason: cancelReason === 'other' ? customCancelReason : undefined,
    };

    console.log('전송할 데이터:', requestData);

    try {
      const response = await electronicsApi.cancelTrade(Number(electronicsId), requestData);
      console.log('취소 응답:', response);
      toast.success('거래가 취소되었습니다.');
      setShowCancelModal(false);
      fetchElectronicsDetail();
      fetchActiveOffersCount();
    } catch (error) {
      console.error('Failed to cancel trade:', error);
      toast.error('거래 취소에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!electronics) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">상품을 찾을 수 없습니다.</p>
        <Link href="/used-electronics">
          <Button>목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* 모바일 헤더 */}
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()}>
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => router.push('/used-electronics')}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              목록
            </button>
            <button
              onClick={() => router.push('/used/mypage')}
              className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
            >
              거래내역
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={handleFavorite} disabled={isFavorite === null}>
              <Heart className={`w-5 h-5 ${
                isFavorite === null
                  ? 'text-gray-300'
                  : isFavorite === true
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-500 hover:text-red-500'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* PC 헤더 */}
      <div className="hidden lg:block bg-white border-b sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/used-electronics')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">목록으로</span>
              </button>
              <button
                onClick={() => router.push('/used/mypage')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
              >
                <span>거래내역</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">공유</span>
              </button>
              <button
                onClick={handleFavorite}
                disabled={isFavorite === null || electronics?.status === 'sold'}
                className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                  isFavorite === null || electronics?.status === 'sold'
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={electronics?.status === 'sold' ? '거래 완료된 상품은 찜할 수 없습니다' : ''}
              >
                <Heart className={`w-4 h-4 ${
                  isFavorite === null || electronics?.status === 'sold'
                    ? 'text-gray-300'
                    : isFavorite === true
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-500 hover:text-red-500'
                }`} />
                <span className="text-sm">
                  {electronics?.status === 'sold' ? '거래완료' : (isFavorite === null ? '로딩...' : (isFavorite ? '찜됨' : '찜하기'))}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="container max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* 이미지 섹션 */}
          <div className="w-full">
            {/* 메인 이미지 */}
            {electronics.images && electronics.images.length > 0 ? (
              <div className="w-full aspect-square relative rounded-xl overflow-hidden">
                <Swiper
                  modules={[Navigation, Thumbs]}
                  navigation={{ enabled: true }}
                  thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                  loop={electronics.images.length > 1}
                  speed={450}
                  observer={true}
                  observeParents={true}
                  watchOverflow={true}
                  className="w-full h-full used-electronics-swiper !absolute !inset-0"
                  onSlideChange={(swiper) => setLightboxImageIndex(swiper.realIndex)}
                >
                  {electronics.images.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div
                        className="w-full h-full flex items-center justify-center cursor-zoom-in bg-gray-50 relative"
                        onClick={() => {
                          setLightboxImageIndex(index);
                          setShowImageLightbox(true);
                        }}
                      >
                        <img
                          src={image.imageUrl || '/images/no-image.png'}
                          alt={`${electronics.model_name} - ${index + 1}`}
                          className="object-contain max-w-full max-h-full"
                        />

                        {/* 거래중 오버레이 */}
                        {electronics.status === 'trading' && (
                          <>
                            <div className="absolute inset-0 bg-black/30 z-10" />
                            <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1.5 text-sm rounded font-medium z-20">
                              거래중
                            </div>
                          </>
                        )}

                        {/* 거래완료 오버레이 */}
                        {electronics.status === 'sold' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none">
                            <span className="text-white text-2xl font-bold">거래완료</span>
                          </div>
                        )}

                        {/* 판매중 상태 뱃지 */}
                        {electronics.status === 'active' && (
                          <div className="absolute top-4 left-4">
                            <Badge variant="default">
                              판매중
                            </Badge>
                          </div>
                        )}
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-400" />
              </div>
            )}

        {/* 썸네일 */}
        {electronics.images && electronics.images.length > 1 && (
          <div className="mt-4">
            <Swiper
              modules={[Thumbs]}
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView="auto"
              watchSlidesProgress
              observer={true}
              observeParents={true}
              className="w-full"
            >
            {electronics.images.map((image, index) => (
              <SwiperSlide key={index} className="!w-auto">
                <div className="min-w-[72px] max-w-[96px] w-[12vw] aspect-square rounded-md overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-dungji-primary transition-all relative">
                  <Image
                    src={image.imageUrl || '/images/no-image.png'}
                    alt={`썸네일 ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-dungji-primary text-white text-xs px-1.5 py-0.5 rounded font-medium z-10">
                      대표
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          </div>
        )}

        {/* PC에서만 제품상태 및 설명을 사진 아래로 이동 */}
        {electronics.description && (
          <div className="hidden lg:block mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">제품상태 및 설명</h3>
            <p className="text-gray-700 whitespace-pre-wrap break-all">{electronics.description}</p>
          </div>
        )}

        {/* PC에서만 거래 가능 지역 - 제품상태 설명 아래로 이동 */}
        {(electronics.regions && electronics.regions.length > 0) && (
          <div className="hidden lg:block mt-4 p-4 bg-dungji-primary-50 rounded-lg border border-dungji-primary-200">
            <p className="text-sm font-medium text-dungji-primary-900 mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              거래 가능 지역
            </p>
            <div className="flex flex-wrap gap-2">
              {electronics.regions.map((region, index) => (
                <span key={index} className="px-3 py-1 bg-dungji-primary text-white rounded-full text-sm font-medium">
                  {region.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PC에서만 거래시 요청사항 - 제품상태 설명 아래로 이동 */}
        {electronics.meeting_place && (
          <div className="hidden lg:block mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Info className="w-4 h-4" />
              거래시 요청사항
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-all">{electronics.meeting_place}</p>
          </div>
        )}

        {/* PC: 본인 등록 상품일 때 수정/삭제 버튼 왼쫝 하단 배치 (판매완료 시 숨김) */}
        {electronics.seller?.id === user?.id && electronics.status !== 'sold' && (
          <div className="hidden lg:block mt-8 pt-6 border-t">
            {/* 제안이 있을 때 수정 제한 안내 */}
            {activeOffersCount > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">제안이 있는 상품입니다</p>
                    <p className="text-amber-800 mt-1">가격과 거래 요청사항만 수정 가능합니다.</p>
                  </div>
                </div>
              </div>
            )}
            {electronics.last_bumped_at && bumpAPI.getTimeUntilNextBumpFromLast(electronics.last_bumped_at) && (
              <div className="flex items-center gap-1 mb-3 ml-4">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {bumpAPI.getTimeUntilNextBumpFromLast(electronics.last_bumped_at)}
                </span>
              </div>
            )}
            <div className="flex justify-start gap-2 ml-4">
              <BumpButton
                item={electronics}
                itemType="electronics"
                size="sm"
              />
              <Button
                onClick={() => router.push(`/used-electronics/${electronicsId}/edit`)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 w-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                수정
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 w-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </Button>
            </div>
          </div>
        )}

        </div>

        {/* 정보 섹션 */}
        <div className="w-full overflow-x-hidden">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="mb-2">
              <h1 className="text-2xl font-bold">{electronics.brand} {electronics.model_name}</h1>
            </div>

            {/* 가격 */}
            <div className="mb-4">
              {electronics.status === 'sold' ? (
                // 판매완료 - 거래가격 표시
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-500">거래금액</span>
                  <p className="text-2xl font-bold text-gray-400 line-through">
                    {(electronics.final_price || electronics.price).toLocaleString()}원
                  </p>
                </div>
              ) : (
                // 판매중/거래중 - 최소제안가 강조
                <>
                  {electronics.accept_offers && electronics.min_offer_price ? (
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-sm text-gray-600">최소 제안가</span>
                        <p className="text-3xl font-bold text-dungji-primary">
                          {electronics.min_offer_price.toLocaleString()}원~
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xs text-gray-500">즉시구매가</span>
                        <p className="text-lg font-medium text-gray-700">
                          {electronics.price.toLocaleString()}원
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-sm text-gray-600">판매가격</span>
                      <p className="text-3xl font-bold text-gray-900">
                        {electronics.price.toLocaleString()}원
                      </p>
                    </div>
                  )}

                  {/* 조회수 및 통계 */}
                  <div className="pt-4 flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        조회 {electronics.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        찜 {electronics.favorite_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        제안 {activeOffersCount}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(electronics.created_at), { addSuffix: true, locale: ko })}
                    </span>
                  </div>

                </>
              )}
            </div>

            {/* 상태 정보 */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y">
              <div>
                <p className="text-sm text-gray-600 mb-1">제조사</p>
                <p className="font-medium">{electronics.brand}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  상태
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                        title="등급 안내 보기"
                      >
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 text-xs" align="start">
                      <div className="space-y-2">
                        <div className="font-semibold text-sm mb-2">상태 등급 안내</div>
                        <div><span className="font-medium">미개봉:</span> 새제품</div>
                        <div><span className="font-medium">S급:</span> 거의 새것, 사용감 거의 없음</div>
                        <div><span className="font-medium">A급:</span> 사용감 있으나 생활기스 수준</div>
                        <div><span className="font-medium">B급:</span> 사용감 많지만 외관 및 기능 준수</div>
                        <div><span className="font-medium">C급:</span> 사용감 많음, 외관 손상 있으나 기능 정상</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </p>
                <p className="font-medium">
                  {electronics.is_unused ? '미개봉' : `${electronics.condition_grade}급`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">카테고리</p>
                <p className="font-medium">{ELECTRONICS_SUBCATEGORIES[electronics.subcategory as keyof typeof ELECTRONICS_SUBCATEGORIES]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">구매시기</p>
                <p className="font-medium">{electronics.purchase_period || '-'}</p>
              </div>
              {electronics.usage_period && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">사용기간</p>
                  <p className="font-medium">{electronics.usage_period}</p>
                </div>
              )}
            </div>

            {/* 구성품 */}
            <div className="py-4 border-b">
              <p className="text-sm text-gray-600 mb-2">구성품</p>
              <div className="flex gap-3">
                {electronics.has_box && (
                  <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                    박스
                  </span>
                )}
                {electronics.has_charger && (
                  <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                    충전기
                  </span>
                )}
                {electronics.has_manual && (
                  <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                    보증서
                  </span>
                )}
                {electronics.other_accessories && (
                  <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                    {electronics.other_accessories}
                  </span>
                )}
              </div>
            </div>

            {/* 추가 정보 */}
            {(electronics.has_receipt || electronics.has_warranty_card) && (
              <div className="py-4 border-b">
                <p className="text-sm text-gray-600 mb-2">추가 정보</p>
                <div className="flex gap-3">
                  {electronics.has_receipt && (
                    <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                      영수증 보유
                    </span>
                  )}
                  {electronics.has_warranty_card && (
                    <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                      보증서 보유
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 제품상태 및 설명 - 모바일에서만 표시 */}
            {electronics.description && (
              <div className="lg:hidden py-4 border-b">
                <p className="text-sm text-gray-600 mb-2">제품상태 및 설명</p>
                <p className="text-gray-800 whitespace-pre-wrap break-all">{electronics.description}</p>
              </div>
            )}

            {/* 모바일: 거래 가능 지역 */}
            {(electronics.regions && electronics.regions.length > 0) && (
              <div className="lg:hidden py-4 border-b">
                <p className="text-sm font-medium text-dungji-primary-900 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  거래 가능 지역
                </p>
                <div className="flex flex-wrap gap-2">
                  {electronics.regions.map((region, index) => (
                    <span key={index} className="px-3 py-1 bg-dungji-primary text-white rounded-full text-sm font-medium">
                      {region.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 모바일: 거래시 요청사항 */}
            {electronics.meeting_place && (
              <div className="lg:hidden py-4 border-b">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  거래시 요청사항
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-all">{electronics.meeting_place}</p>
              </div>
            )}
          </div>

          {/* 액션 버튼 영역 */}
          <div className="space-y-3">
            {/* 거래중 시 거래 당사자에게 마이페이지 안내 */}
            {electronics.status === 'trading' &&
             user && (Number(user.id) === electronics.seller?.id || Number(user.id) === electronics.buyer_id) && (
              <Link href="/used/mypage?tab=trading">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        거래내역 바로가기
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </Link>
            )}

            {/* 본인이 등록한 상품인 경우 */}
            {user?.id === electronics.seller?.id ? (
              <>
                {/* 거래중 상태일 때 거래완료 버튼 비활성화 */}
                {electronics.status === 'trading' && (
                  <Button
                    disabled
                    className="w-full h-14 text-lg font-semibold bg-gray-400 cursor-not-allowed text-white mb-3"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    거래중
                  </Button>
                )}

                {/* 거래완료 상태일 때 후기 작성 버튼 표시 (판매자) */}
                {electronics.status === 'sold' && electronics.seller?.id === user?.id && (
                  <Button
                    disabled
                    className="w-full h-14 text-lg font-semibold mb-3 bg-gray-400 cursor-not-allowed text-white"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    판매완료
                  </Button>
                )}

                {/* 판매중일 때만 제안 보기 버튼 표시 */}
                {electronics.status === 'active' && (
                  <Button
                    onClick={() => {
                      fetchOffers();
                      setShowOffersModal(true);
                    }}
                    className="w-full h-14 text-lg font-semibold bg-dungji-secondary hover:bg-dungji-secondary-dark"
                    disabled={loadingOffers}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    받은 제안 보기 {activeOffersCount > 0 && `(${activeOffersCount})`}
                  </Button>
                )}

              </>
            ) : (
              /* 다른 사람의 상품인 경우 */
              <>
                {/* 거래가 완료된 경우 안내 메시지 (제3자에게만 표시, 거래 당사자는 제외) */}
                {electronics.status === 'sold' &&
                 electronics.seller?.id !== user?.id &&
                 electronics.buyer?.id !== user?.id && (
                  <div className="p-4 bg-gray-100 rounded-lg mb-3">
                    <p className="text-center text-gray-600 font-medium">
                      거래가 완료된 상품입니다
                    </p>
                  </div>
                )}

                <>
                  <div className="space-y-2">
                    <Button
                      onClick={async () => {
                        // 로그인 체크
                        if (!isAuthenticated) {
                          toast.error('가격 제안은 로그인 후 이용 가능합니다.', {
                            duration: 3000,
                          });
                          router.push('/login');
                          return;
                        }

                        // 프로필 체크 - 실시간 검증
                        const profileComplete = await checkProfile();
                        if (!profileComplete) {
                          setShowProfileModal(true);
                          return;
                        }

                        if (myOffer && myOffer.status === 'pending') {
                          // 수정 제안 - 기존 금액과 메시지 설정
                          setOfferAmount(myOffer.offered_price?.toString() || '');
                          setDisplayAmount(myOffer.offered_price?.toLocaleString() || '');
                          setOfferMessage(myOffer.message || '');
                          setShowOfferModal(true);
                        } else {
                          // 신규 제안 - 기존 값 초기화
                          setOfferAmount('');
                          setDisplayAmount('');
                          setOfferMessage('');
                          setSelectedMessages([]);
                          setShowOfferModal(true);
                        }
                      }}
                      className={`w-full h-14 text-lg font-semibold ${
                        electronics.status !== 'active'
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                      disabled={electronics.status !== 'active' || (remainingOffers !== null && remainingOffers <= 0 && !myOffer)}
                    >
                      {electronics.status === 'trading'
                        ? '거래중인 상품입니다'
                        : electronics.status === 'sold'
                        ? '거래완료된 상품입니다'
                        : myOffer && myOffer.status === 'pending'
                        ? '제안 수정하기'
                        : '가격 제안하기'}
                    </Button>

                    {/* 제안 취소 버튼 - 거래중/판매완료가 아닌 경우에만 표시 */}
                    {myOffer && myOffer.status === 'pending' && electronics.status === 'active' && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (confirm('제안을 취소하시겠습니까?')) {
                            await handleCancelOffer();
                            await fetchElectronicsDetail(); // 상품 정보 다시 조회
                            await fetchActiveOffersCount(); // 활성 제안 수 업데이트
                          }
                        }}
                        size="sm"
                        className="border-gray-300 hover:bg-dungji-danger hover:text-white hover:border-dungji-danger transition-colors"
                      >
                        제안 취소
                      </Button>
                    )}
                  </div>
                </>
              </>
            )}


            {/* 내가 제안한 금액 표시 */}
            {myOffer && myOffer.status !== 'cancelled' && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      내가 제안한 금액
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {myOffer.offered_price?.toLocaleString()}원
                    </p>
                    {myOffer.message && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        "{myOffer.message}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 제안 횟수 표시 */}
            {(myOffer || (offerCount !== null && offerCount > 0)) && (
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  남은 제안 횟수: <span className="font-semibold text-dungji-primary">{remainingOffers !== null ? `${remainingOffers}/5회` : '로딩중...'}</span>
                </p>
                {remainingOffers !== null && remainingOffers === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    제안 횟수를 모두 사용하셨습니다
                  </p>
                )}
              </div>
            )}

            {/* 안전 거래 안내 */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 mt-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 mb-2">둥지마켓 안전거래 약속</p>
                  <ul className="space-y-1.5 text-amber-800">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>공공장소에서 만나 안전하게 거래하세요</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>제품 상태를 꼼꼼히 확인 후 구매 결정하세요</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>현금 거래로 안전하게 진행하세요</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 모바일: 본인 등록 상품일 때 수정/삭제 버튼 (판매완료 시 숨김) */}
            {electronics.seller?.id === user?.id && electronics.status !== 'sold' && (
              <div className="lg:hidden mt-6 pt-6 border-t">
                {/* 제안이 있을 때 수정 제한 안내 */}
                {activeOffersCount > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900">제안이 있는 상품입니다</p>
                        <p className="text-amber-800 mt-1">가격과 거래 요청사항만 수정 가능합니다.</p>
                      </div>
                    </div>
                  </div>
                )}
                {electronics.last_bumped_at && bumpAPI.getTimeUntilNextBumpFromLast(electronics.last_bumped_at) && (
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {bumpAPI.getTimeUntilNextBumpFromLast(electronics.last_bumped_at)}
                    </span>
                  </div>
                )}
                <div className="flex justify-center gap-2">
                  <BumpButton
                    item={electronics}
                    itemType="electronics"
                    size="sm"
                  />
                  <Button
                    onClick={() => router.push(`/used-electronics/${electronicsId}/edit`)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 w-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    수정
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 w-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
        </div>
      </div>




      {/* 가격 제안 모달 - 컴팩트 버전 */}
      {showOfferModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center z-50 px-4 pt-16 pb-8 sm:p-4 backdrop-blur-sm"
          style={{
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingTop: window.innerWidth < 640 ? 'max(4rem, env(safe-area-inset-top))' : 'max(2rem, env(safe-area-inset-top))'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOfferModal(false);
              setOfferAmount('');
              setDisplayAmount('');
              setOfferMessage('');
              setSelectedMessages([]);
            }
          }}
        >
          <div
            className="bg-white rounded-xl max-w-[340px] sm:max-w-md w-full p-3 sm:p-4 flex flex-col shadow-2xl overflow-hidden"
            style={{
              maxHeight: 'min(90vh, calc(100vh - 4rem))'
            }}
          >
            {/* 헤더 - 더 컴팩트 */}
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">{myOffer && myOffer.status === 'pending' ? '제안 수정하기' : '가격 제안하기'}</h3>
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  setOfferAmount('');
                  setDisplayAmount('');
                  setOfferMessage('');
                  setSelectedMessages([]);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 영역 - 스크롤 가능 */}
            <div className="flex-1 px-1 overflow-y-auto">
              <div className="pb-3">
              {/* 제품 정보 미리보기 - 2줄 구성 */}
              <div className="bg-gray-50 rounded-lg px-2.5 py-2 mb-2">
                <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                  {electronics.brand} {electronics.model_name.length > 25 ? electronics.model_name.slice(0, 25) + '...' : electronics.model_name}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {ELECTRONICS_SUBCATEGORIES[electronics.subcategory as keyof typeof ELECTRONICS_SUBCATEGORIES]} | {electronics.is_unused ? '미개봉' : CONDITION_GRADES[electronics.condition_grade as keyof typeof CONDITION_GRADES]}
                </p>
              </div>

            {/* 제안 횟수 표시 - 초컴팩트 */}
            <div className="flex items-center justify-between mb-2 p-1.5 bg-dungji-cream rounded-lg border border-dungji-cream-dark">
              <span className="text-xs font-medium text-gray-700">
                남은 제안 횟수
              </span>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-lg font-bold text-dungji-primary">{offerCount !== null ? (5 - offerCount) : '...'}</span>
                <span className="text-xs text-gray-600">/ 5회</span>
              </div>
            </div>

            {remainingOffers !== null && remainingOffers === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      제안 횟수를 모두 사용하셨습니다
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      이 상품에는 더 이상 제안을 할 수 없습니다
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-2">
              <label className="block text-sm font-semibold mb-1.5 text-gray-900">
                제안 금액 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="금액을 입력해주세요"
                  value={displayAmount}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const numbersOnly = inputValue.replace(/[^\d]/g, '');

                    if (numbersOnly === '') {
                      setOfferAmount('');
                      setDisplayAmount('');
                      return;
                    }

                    const numValue = parseInt(numbersOnly);
                    // 최대 금액 제한 (즉시구매가까지)
                    if (numValue > electronics.price) {
                      return;
                    }

                    setOfferAmount(numbersOnly);
                    setDisplayAmount(numValue.toLocaleString('ko-KR'));
                  }}
                  className="pr-12 h-10 sm:h-11 text-sm sm:text-base font-semibold"
                  inputMode="numeric"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-medium text-sm">원</span>
              </div>
              {offerAmount && parseInt(offerAmount) < (electronics.min_offer_price || 0) && (
                <p className="text-xs text-red-500 mt-1">
                  최소제안가 {electronics.min_offer_price?.toLocaleString()}원 이상으로 입력해주세요
                </p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <div className="inline-flex items-center px-2.5 py-1 bg-amber-100 border border-amber-300 rounded-full">
                  <span className="text-xs font-semibold text-amber-800">
                    최소제안가: {electronics.min_offer_price?.toLocaleString()}원
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOfferAmount(electronics.price.toString());
                    setDisplayAmount(electronics.price.toLocaleString('ko-KR'));
                  }}
                  className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold shadow-sm"
                >
                  즉시구매가 {electronics.price.toLocaleString()}원
                </button>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">
                  메시지 선택
                  <span className="text-xs text-gray-500 ml-1">
                    (선택사항, 최대 5개)
                  </span>
                </label>
                {selectedMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedMessages([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* 선택된 메시지 표시 - 컴팩트 */}
              {selectedMessages.length > 0 && (
                <div className="mb-1.5 p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-700 mb-1">선택된 메시지 ({selectedMessages.length}/5)</p>
                  <div className="space-y-0.5">
                    {selectedMessages.map((msg, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs text-gray-800">• {msg}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMessages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 컴팩트한 템플릿 선택 영역 - 2열 그리드 */}
              <div className="border rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(messageTemplates).map(([category, messages]) => (
                  <details key={category} className="">
                    <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900 py-0.5">
                      {category}
                    </summary>
                    <div className="mt-1 grid grid-cols-1 gap-1">
                      {messages.map((msg) => (
                        <button
                          key={msg}
                          type="button"
                          onClick={() => {
                            if (selectedMessages.length < 5 && !selectedMessages.includes(msg)) {
                              setSelectedMessages(prev => [...prev, msg]);
                            }
                          }}
                          disabled={selectedMessages.length >= 5 && !selectedMessages.includes(msg)}
                          className={`text-left text-xs py-1.5 px-2 rounded hover:bg-gray-100 transition-colors ${
                            selectedMessages.includes(msg)
                              ? 'bg-gray-200 text-gray-800 font-medium border border-gray-400'
                              : 'text-gray-700 border border-gray-200'
                          } ${selectedMessages.length >= 5 && !selectedMessages.includes(msg) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={msg}
                        >
                          {msg}
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
              </div>

              {/* 제안 안내사항 - 컴팩트 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-0.5">안내사항</p>
                  <p className="text-amber-700">• 가격 제안은 신중하게 부탁드립니다</p>
                  <p className="text-amber-700">• 판매자 수락 시 거래가 진행됩니다</p>
                </div>
              </div>
              </div>
              </div>
            </div>

            {/* 버튼 - 초컴팩트 하단 고정 */}
            <div className="flex gap-2 pt-2.5 border-t bg-white shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOfferModal(false);
                  setOfferAmount('');
                  setDisplayAmount('');
                  setSelectedMessages([]);
                }}
                className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  // 최소제안가 검증
                  if (parseInt(offerAmount) < (electronics.min_offer_price || 0)) {
                    toast.error(`최소제안가 ${electronics.min_offer_price?.toLocaleString()}원 이상으로 입력해주세요`);
                    return;
                  }
                  // 선택된 메시지들을 합쳐서 하나의 메시지로 만들기
                  const combinedMessage = selectedMessages.join(' / ');
                  // 상태도 업데이트 (표시용)
                  setOfferMessage(combinedMessage);
                  // 확인 모달로 전환
                  handleOfferConfirm();
                }}
                disabled={!offerAmount || (remainingOffers !== null && remainingOffers === 0) || Boolean(offerAmount && parseInt(offerAmount) < (electronics.min_offer_price || 0))}
                className="flex-1 h-9 sm:h-10 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm"
              >
                {myOffer && myOffer.status === 'pending' ? '제안 수정하기' : '제안하기'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 제안 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 ${parseInt(offerAmount) === electronics.price ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className={`text-3xl font-bold ${parseInt(offerAmount) === electronics.price ? 'text-green-600' : 'text-blue-600'}`}>￦</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {parseInt(offerAmount) === electronics.price ? '🎉 즉시구매 확인' : '가격 제안 확인'}
              </h3>
              <p className={`text-2xl font-bold ${parseInt(offerAmount) === electronics.price ? 'text-green-600' : 'text-blue-600'} mb-2`}>
                {parseInt(offerAmount).toLocaleString()}원
              </p>
              {parseInt(offerAmount) === electronics.price && (
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full mb-2">
                  판매자가 설정한 즉시판매가
                </div>
              )}
              <p className="text-sm text-gray-600">
                {parseInt(offerAmount) === electronics.price
                  ? '즉시구매 시 바로 거래가 시작됩니다'
                  : '이 금액으로 제안하시겠습니까?'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                가격은 천원 단위로 입력 가능합니다
              </p>
              {offerMessage && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 text-left">
                  <p className="font-medium mb-1">선택한 메시지:</p>
                  <div className="space-y-1">
                    {offerMessage.split(' / ').map((msg, index) => (
                      <p key={index} className="text-xs">• {msg}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`${parseInt(offerAmount) === electronics.price ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border rounded-lg p-3 mb-4`}>
              <p className={`text-xs ${parseInt(offerAmount) === electronics.price ? 'text-green-700' : 'text-amber-700'}`}>
                {parseInt(offerAmount) === electronics.price
                  ? '즉시구매 시 바로 거래중 상태로 전환되며, 판매자와 연락처가 공개됩니다.'
                  : '구매 의사가 확실한 경우에만 제안 부탁드립니다. 판매자가 수락하기 전까지는 취소 가능합니다.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1"
              >
                아니오
              </Button>
              <Button
                onClick={() => handleSubmitOffer(offerMessage)}
                className={`flex-1 ${parseInt(offerAmount) === electronics.price
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
              >
                {parseInt(offerAmount) === electronics.price ? '즉시구매' : '예, 제안합니다'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 제안 목록 모달 */}
      {showOffersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl mx-4 rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">받은 제안 목록</h3>
              <button
                onClick={() => setShowOffersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingOffers ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : offers.length > 0 ? (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {typeof offer.buyer === 'object' ? offer.buyer.nickname : '구매자'}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {offer.offered_price.toLocaleString()}원
                        </p>
                      </div>
                      {offer.status === 'pending' && electronics?.status === 'active' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOfferId(offer.id);
                            setShowAcceptModal(true);
                          }}
                        >
                          수락
                        </Button>
                      )}
                      {offer.status === 'accepted' && (
                        <Badge>수락됨</Badge>
                      )}
                    </div>
                    {offer.message && (
                      <p className="text-sm text-gray-600">{offer.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(offer.created_at), {
                        addSuffix: true,
                        locale: ko
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                받은 제안이 없습니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 제안 수락 확인 모달 */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">제안을 수락하시겠습니까?</h3>
            <p className="text-gray-600 mb-6">
              제안을 수락하면 상품이 거래 진행 중 상태로 변경됩니다.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedOfferId(null);
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleAcceptOffer}
              >
                수락
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">상품을 삭제하시겠습니까?</h3>

            {/* 제안이 있는 경우 패널티 안내 */}
            {electronics?.offer_count > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3 text-sm">
                <p className="font-medium text-amber-900 mb-1">
                  ⚠️ 제안 {activeOffersCount}개 있음
                </p>
                <p className="text-amber-700">
                  6시간 패널티 (
                  {(() => {
                    const endTime = new Date();
                    endTime.setHours(endTime.getHours() + 6);
                    return endTime.toLocaleTimeString('ko-KR', {
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    });
                  })()}
                  까지)
                </p>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              삭제된 상품은 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : electronics?.offer_count > 0 ? '패널티 감수하고 삭제' : '삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 거래 취소 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">거래를 취소하시겠습니까?</h3>

            <div className="mb-4">
              <Label htmlFor="cancelReason">취소 사유</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="취소 사유를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {/* 구매자 취소 사유 */}
                  <SelectItem value="change_mind">단순 변심</SelectItem>
                  <SelectItem value="found_better">다른 상품 구매 결정</SelectItem>
                  <SelectItem value="seller_no_response">판매자 연락 두절</SelectItem>
                  <SelectItem value="condition_mismatch">상품 상태가 설명과 다름</SelectItem>
                  <SelectItem value="price_disagreement">추가 비용 요구</SelectItem>
                  <SelectItem value="seller_cancel_request">판매자 취소 요청</SelectItem>
                  {/* 판매자 취소 사유 */}
                  <SelectItem value="product_sold">다른 경로로 판매됨</SelectItem>
                  <SelectItem value="buyer_no_response">구매자 연락 두절</SelectItem>
                  <SelectItem value="buyer_no_show">구매자 약속 불이행</SelectItem>
                  <SelectItem value="payment_issue">결제 문제 발생</SelectItem>
                  <SelectItem value="buyer_unreasonable">구매자 무리한 요구</SelectItem>
                  <SelectItem value="buyer_cancel_request">구매자 취소 요청</SelectItem>
                  <SelectItem value="personal_reason">개인 사정으로 판매 불가</SelectItem>
                  {/* 공통 */}
                  <SelectItem value="schedule_conflict">거래 일정 조율 실패</SelectItem>
                  <SelectItem value="location_issue">거래 장소 문제</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cancelReason === 'other' && (
              <div className="mb-4">
                <Label htmlFor="customReason">상세 사유</Label>
                <Textarea
                  id="customReason"
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  placeholder="취소 사유를 입력해주세요"
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm">
              <p className="text-amber-900 font-medium mb-1">⚠️ 주의사항</p>
              <p className="text-amber-700">
                거래 취소 시 상대방에게 알림이 발송되며,
                빈번한 취소는 이용에 제한이 있을 수 있습니다.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCustomCancelReason('');
                }}
              >
                돌아가기
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancelTrade}
              >
                거래 취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 라이트박스 */}
      {showImageLightbox && electronics.images && (
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
            <Image
              src={electronics.images[lightboxImageIndex]?.imageUrl || '/images/no-image.png'}
              alt={electronics.model_name || '전자제품 이미지'}
              width={1200}
              height={1200}
              className="object-contain max-w-full max-h-full"
            />

            {electronics.images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    setLightboxImageIndex(prev =>
                      prev > 0 ? prev - 1 : electronics.images!.length - 1
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6 text-white/70" />
                </button>
                <button
                  onClick={() => {
                    setLightboxImageIndex(prev =>
                      prev < electronics.images!.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6 text-white/70" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 이미지 라이트박스 */}
      {showImageLightbox && electronics?.images && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4">
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ type: 'fraction' }}
            loop={true}
            speed={450}
            initialSlide={lightboxImageIndex}
            className="w-full h-full"
          >
            {electronics.images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="w-full h-full flex items-center justify-center p-4">
                  <Image
                    src={image.imageUrl || '/images/no-image.png'}
                    alt={`${electronics.model_name} ${index + 1}`}
                    width={1200}
                    height={1200}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* 거래완료 모달 */}
      {showTradeCompleteModal && electronics && (
        <TradeCompleteModal
          isOpen={showTradeCompleteModal}
          onClose={() => setShowTradeCompleteModal(false)}
          phoneId={parseInt(electronicsId)}
          phoneModel={electronics.model_name || ''}
          isSeller={Number(user?.id) === electronics.seller?.id || electronics.is_mine === true}
          itemType="electronics"
          onComplete={() => {
            fetchElectronicsDetail();
            fetchActiveOffersCount();
            setShowTradeCompleteModal(false);
            toast.success('거래가 완료되었습니다. 후기를 작성해주세요!');
          }}
        />
      )}

      {/* 후기 작성 모달 */}
      {showTradeReviewModal && reviewTarget && electronics && (
        <TradeReviewModal
          isOpen={showTradeReviewModal}
          onClose={() => {
            setShowTradeReviewModal(false);
            setReviewTarget(null);
          }}
          transactionId={electronics.transaction_id || 0}
          isSeller={reviewTarget === 'buyer'}
          partnerName={reviewTarget === 'buyer' ?
            (electronics.buyer?.nickname || electronics.buyer?.username || '구매자') :
            (electronics.seller?.nickname || electronics.seller?.username || '판매자')}
          phoneModel={electronics.model_name || ''}
          itemType="electronics"
          onReviewComplete={() => {
            setReviewCompleted(true);
            fetchElectronicsDetail();
            fetchActiveOffersCount();
            setShowTradeReviewModal(false);
            toast.success('후기가 작성되었습니다.');
          }}
        />
      )}

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

      {/* Swiper Navigation Custom Styles */}
      <style jsx global>{`
        /* Swiper 컨테이너 정렬 */
        .used-electronics-swiper {
          width: 100% !important;
          height: 100% !important;
        }

        .used-electronics-swiper .swiper-wrapper {
          align-items: center;
          height: 100% !important;
        }

        .used-electronics-swiper .swiper-slide {
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
        }

        .used-electronics-swiper .swiper-slide > div {
          max-width: 100% !important;
          max-height: 100% !important;
          overflow: hidden !important;
        }

        /* 이미지 크기 제한 - 모든 화면에 적용 */
        .used-electronics-swiper .swiper-slide img {
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
        }

        /* 데스크톱에서 이미지 100% 크기 */
        @media (min-width: 641px) {
          .used-electronics-swiper .swiper-slide img {
            width: 100% !important;
            height: 100% !important;
          }
        }

        /* 모바일에서 이미지 자동 크기 조절 */
        @media (max-width: 640px) {
          .used-electronics-swiper .swiper-slide img {
            width: auto !important;
            height: auto !important;
          }
        }

        /* 모바일에서 네비게이션 화살표 숨기기 */
        @media (max-width: 768px) {
          .used-electronics-swiper .swiper-button-prev,
          .used-electronics-swiper .swiper-button-next {
            display: none !important;
          }
        }

        /* 데스크톱 네비게이션 스타일 */
        @media (min-width: 769px) {
          .used-electronics-swiper .swiper-button-prev,
          .used-electronics-swiper .swiper-button-next {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            width: 40px !important;
            height: 40px !important;
            background: rgba(255, 255, 255, 0.2) !important;
            backdrop-filter: blur(4px) !important;
            border-radius: 50% !important;
            transition: all 0.3s ease !important;
            z-index: 10 !important;
          }

          .used-electronics-swiper .swiper-button-prev:hover,
          .used-electronics-swiper .swiper-button-next:hover {
            background: rgba(255, 255, 255, 0.3) !important;
            transform: translateY(-50%) scale(1.1) !important;
          }

          .used-electronics-swiper .swiper-button-prev::after,
          .used-electronics-swiper .swiper-button-next::after {
            font-size: 18px !important;
            color: rgba(255, 255, 255, 0.9) !important;
            font-weight: 900 !important;
          }

          .used-electronics-swiper .swiper-button-prev {
            left: 8px !important;
          }

          .used-electronics-swiper .swiper-button-next {
            right: 8px !important;
          }
        }

        /* Thumbnail active state */
        .swiper-slide-thumb-active > div {
          border-color: #ff6b35 !important;
        }
      `}</style>
    </div>
  );
}
/**
 * 중고폰 상세 페이지
 * /used/[id]
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Heart, MapPin, Eye, Clock, Shield, MessageCircle,
  ChevronLeft, ChevronRight, Share2, AlertTriangle,
  Check, X, Phone, User, Smartphone, Edit3, Trash2, Banknote, Info, ZoomIn,
  CheckCircle2, MessageSquarePlus
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useUsedProfileCheck } from '@/hooks/useUsedProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import { UsedPhone, CONDITION_GRADES, BATTERY_STATUS_LABELS, PHONE_BRANDS } from '@/types/used';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { executeTransactionAction } from '@/lib/utils/transactionHelper';
import { sellerAPI } from '@/lib/api/used';

export default async function UsedPhoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UsedPhoneDetailClient phoneId={id} />;
}

function UsedPhoneDetailClient({ phoneId }: { phoneId: string }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const {
    isProfileComplete,
    checkProfile,
    missingFields,
    showProfileModal,
    setShowProfileModal
  } = useUsedProfileCheck();

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
  
  const [phone, setPhone] = useState<UsedPhone | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null); // null로 초기화하여 로딩 상태 표시
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [offerCount, setOfferCount] = useState<number | null>(null); // null로 초기화하여 로딩 상태 표시
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGradeInfo, setShowGradeInfo] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [myOffer, setMyOffer] = useState<any>(null);
  const [loadingMyOffer, setLoadingMyOffer] = useState(false);
  const [remainingOffers, setRemainingOffers] = useState<number | null>(null); // null로 초기화하여 로딩 상태 표시
  const [activeOffersCount, setActiveOffersCount] = useState<number>(0); // 취소된 제안 제외한 활성 제안 수
  const [showTradeCompleteModal, setShowTradeCompleteModal] = useState(false);
  const [showTradeReviewModal, setShowTradeReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<'buyer' | 'seller' | null>(null);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [checkingOffers, setCheckingOffers] = useState(false);

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
      const result = await sellerAPI.getActiveOffersCount(parseInt(phoneId));
      setActiveOffersCount(result.count);
    } catch (error) {
      console.error('Failed to fetch active offers count:', error);
      setActiveOffersCount(0);
    }
  };

  // 상품 정보 조회
  useEffect(() => {
    fetchPhoneDetail();
    fetchActiveOffersCount(); // 활성 제안 수 조회
    // 로그인한 경우 내가 제안한 금액 확인
    if (isAuthenticated) {
      fetchMyOffer();
    }
  }, [phoneId, isAuthenticated]);

  // 모달이 열렸을 때 배경 스크롤 방지
  useEffect(() => {
    if (showOfferModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // cleanup 함수: 컴포넌트 언마운트 시 overflow 초기화
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showOfferModal]);
  
  // 내가 제안한 금액 조회
  const fetchMyOffer = async () => {
    try {
      setLoadingMyOffer(true);
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/my-offer/`
        : `${baseUrl}/api/used/phones/${phoneId}/my-offer/`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[내 제안 조회] API 응답:', data);
        console.log('[내 제안 메시지]:', data?.message);
        if (data && data.offered_price) {
          setMyOffer(data);
        }
        // 사용자의 총 제안 횟수 가져오기 (제안이 없어도 0으로 설정)
        const count = data?.user_offer_count || 0;
        setOfferCount(count);
        setRemainingOffers(Math.max(0, 5 - count));
      } else {
        // 제안이 없는 경우 (404 등) 0으로 초기화
        setOfferCount(0);
        setRemainingOffers(5);
      }
    } catch (error) {
      console.error('Failed to fetch my offer:', error);
    } finally {
      setLoadingMyOffer(false);
    }
  };

  const fetchPhoneDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/`
        : `${baseUrl}/api/used/phones/${phoneId}/`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      console.log('=== Phone API 상세 응답 ===');
      console.log('Full API response:', data);
      console.log('is_favorite 필드:', data.is_favorite);
      console.log('is_favorite 타입:', typeof data.is_favorite);
      console.log('Buyer from API:', data.buyer);
      console.log('Transaction ID from API:', data.transaction_id);
      console.log('Seller from API:', data.seller);
      setPhone(data);

      // 찜 상태 설정 개선
      const favoriteStatus = data.is_favorite === true;
      console.log('설정할 찜 상태:', favoriteStatus);
      setIsFavorite(favoriteStatus);
      
      // 조회수는 백엔드에서 자동으로 증가됨 (retrieve 메서드에서 처리)
      // fetch(`/api/used/phones/${phoneId}/view`, { method: 'POST' });
      
    } catch (error) {
      console.error('Failed to fetch phone:', error);
      toast.error('상품 정보를 불러오는데 실패했습니다.', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };


  // 이미지 네비게이션
  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : (phone?.images?.length || 1) - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev =>
      prev < (phone?.images?.length || 1) - 1 ? prev + 1 : 0
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
          prev === (phone?.images?.length || 1) - 1 ? 0 : prev + 1
        );
      } else {
        // 오른쪽으로 스와이프 = 이전 이미지
        setLightboxImageIndex((prev) =>
          prev === 0 ? (phone?.images?.length || 1) - 1 : prev - 1
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
      toast.error('찜하기는 로그인 후 이용 가능합니다.', {
        duration: 3000,
      });
      router.push('/login');
      return;
    }

    // 거래 완료 상품은 찜 불가
    if (phone?.status === 'sold') {
      toast.error('거래 완료된 상품은 찜할 수 없습니다.', {
        duration: 3000,
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/favorite/`
        : `${baseUrl}/api/used/phones/${phoneId}/favorite/`;

      // 찜 상태에 따라 메서드 결정 (POST: 추가, DELETE: 제거)
      const method = isFavorite ? 'DELETE' : 'POST';

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        toast.success(newFavoriteState ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.', {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // 가격 포맷팅 (로컬 함수 제거 - utils에서 import한 것 사용)


  // 가격 제안 확인
  const handleOfferConfirm = () => {
    let amount = parseInt(offerAmount);

    if (!amount || amount < (phone?.min_offer_price || 0)) {
      toast.error(`최소 제안 금액은 ${phone?.min_offer_price?.toLocaleString()}원입니다.`, {
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

    if (amount > 9900000) {
      toast.error('최대 제안 가능 금액은 990만원입니다.', {
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

  // 가격 제안 (메시지를 매개변수로 받도록 수정)
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

    await executeTransactionAction(
      async () => {
        const token = localStorage.getItem('accessToken');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
        const apiUrl = baseUrl.includes('api.dungjimarket.com')
          ? `${baseUrl}/used/phones/${phoneId}/offer/`
          : `${baseUrl}/api/used/phones/${phoneId}/offer/`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            offered_price: amount,
            message: finalMessage,
          }),
        });

        console.log('[제안 전송] 메시지:', finalMessage);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('[API 에러 응답]:', errorData);
          if (errorData.message?.includes('5회')) {
            throw {
              response: {
                data: {
                  code: 'max_offers_reached',
                  message: '해당 상품에 최대 5회까지만 제안 가능합니다.'
                }
              }
            };
          }
          throw { response: { data: errorData } };
        }

        const data = await response.json();

        // 즉시구매 여부 확인
        if (data.type === 'instant_purchase') {
          toast.success('즉시구매 완료! 거래가 시작되었습니다.', {
            duration: 3000,
          });

          // 판매자 연락처 표시 모달 또는 알림
          if (data.seller_contact) {
            // 연락처 정보를 표시하거나 저장
            console.log('판매자 연락처:', data.seller_contact);
          }

          // 모달 닫기
          setShowOfferModal(false);
          setShowConfirmModal(false);

          // 1초 후 구매내역 거래중 탭으로 이동
          setTimeout(() => {
            router.push('/used/mypage?tab=purchases&filter=trading');
          }, 1000);

          // 즉시구매의 경우 아래 onSuccess 콜백 실행하지 않음
          throw { skipSuccess: true, data };
        }

        return data;
      },
      {
        successMessage: isModification
          ? '가격 제안이 수정되었습니다.'
          : '판매자에게 가격 제안이 전달되었습니다.',
        onSuccess: async () => {
          setShowOfferModal(false);
          setShowConfirmModal(false);
          setOfferAmount('');
          setDisplayAmount('');
          setOfferMessage('');
          setSelectedMessages([]);

          // 내 제안 정보 다시 불러오기
          await fetchMyOffer();
          await fetchPhoneDetail();
          await fetchActiveOffersCount(); // 활성 제안 수 업데이트
        },
        onTabChange: (tab) => {
          if (tab === 'list') {
            // 상품이 삭제된 경우 목록으로
            router.push('/used');
          } else if (tab === 'refresh') {
            // 상품이 수정된 경우 새로고침
            window.location.reload();
          }
        },
      }
    );
  };

  // 실시간 제안 체크 함수
  const checkLatestOffers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/`
        : `${baseUrl}/api/used/phones/${phoneId}/`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
    } catch (error) {
      console.error('Failed to check offers:', error);
    }
    return 0;
  };

  // 공유하기
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: phone?.model || '중고폰',
        text: `${phone?.model} - ${phone?.price?.toLocaleString()}원`,
        url: window.location.href,
      });
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 클립보드에 복사되었습니다.', {
        duration: 2000,
      });
    }
  };

  // 삭제 처리 - 실시간 제안 체크 추가
  const handleDelete = async () => {
    if (!phone) return;

    setDeleting(true);

    try {
      // 삭제 전 최신 제안 상태 확인
      const latestOfferCount = await checkLatestOffers();

      // 이전에 제안이 없었는데 새로 생긴 경우
      if (phone.offer_count === 0 && latestOfferCount > 0) {
        setDeleting(false);
        toast.error('방금 새로운 제안이 도착했습니다. 제안이 있는 상품은 삭제 시 6시간 패널티가 적용됩니다.', {
          duration: 5000,
        });
        // 상품 정보 새로고침
        await fetchPhoneDetail();
        await fetchActiveOffersCount();
        return;
      }

      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/`
        : `${baseUrl}/api/used/phones/${phoneId}/`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 견적 제안이 있는 경우 패널티 경고
        if (errorData.has_offers) {
          toast.error(errorData.message || '제안된 견적이 있어 6시간 패널티가 적용됩니다.', {
            duration: 4000,
          });
          // 사용자가 확인 후에도 삭제하길 원할 수 있으므로 모달은 열어둠
          setDeleting(false);
          return;
        }

        throw new Error(errorData.message || '삭제 실패');
      }

      const result = await response.json();

      if (result.penalty_applied && result.penalty_end) {
        const endTime = new Date(result.penalty_end);
        const timeStr = endTime.toLocaleTimeString('ko-KR', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
        toast.success(`삭제 완료. ${timeStr}부터 등록 가능`, {
          duration: 5000,
        });
      } else {
        toast.success('상품이 삭제되었습니다.', {
          duration: 3000,
        });
      }

      setShowDeleteModal(false);
      router.push('/used/mypage?tab=sales');

    } catch (error) {
      console.error('Failed to delete phone:', error);
      toast.error('상품 삭제 중 오류가 발생했습니다.', {
        duration: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dungji-primary"></div>
      </div>
    );
  }

  if (!phone) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-2">상품을 찾을 수 없습니다</h2>
        <Button onClick={() => router.push('/used')}>목록으로 돌아가기</Button>
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
              onClick={() => router.push('/used')}
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
                onClick={() => router.push('/used')}
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
                disabled={isFavorite === null || phone?.status === 'sold'}
                className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                  isFavorite === null || phone?.status === 'sold'
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={phone?.status === 'sold' ? '거래 완료된 상품은 찜할 수 없습니다' : ''}
              >
                <Heart className={`w-4 h-4 ${
                  isFavorite === null || phone?.status === 'sold'
                    ? 'text-gray-300'
                    : isFavorite === true
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-500 hover:text-red-500'
                }`} />
                <span className="text-sm">
                  {phone?.status === 'sold' ? '거래완료' : (isFavorite === null ? '로딩...' : (isFavorite ? '찜됨' : '찜하기'))}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-hidden">
        <div className="container max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* 이미지 섹션 */}
          <div className="w-full">
            {/* 메인 이미지 갤러리 - Swiper */}
            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden relative group">
                {phone.images && phone.images.length > 0 ? (
                  <>
                    <div className="w-full aspect-square relative">
                      <Swiper
                        modules={[Navigation, Thumbs]}
                        navigation={{
                          enabled: true,
                        }}
                        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                        loop={phone.images.length > 1}
                        speed={450}
                        observer={true}
                        observeParents={true}
                        watchOverflow={true}
                        className="w-full h-full used-phone-swiper !absolute !inset-0"
                        onSlideChange={(swiper) => setLightboxImageIndex(swiper.realIndex)}
                      >
                      {phone.images.map((image, index) => (
                        <SwiperSlide key={index}>
                          <div
                            className="w-full h-full flex items-center justify-center cursor-zoom-in bg-gray-50"
                            onClick={() => {
                              setLightboxImageIndex(index);
                              setShowImageLightbox(true);
                            }}
                          >
                            <Image
                              src={image.imageUrl || '/images/phone-placeholder.png'}
                              alt={`${phone.model} - ${index + 1}`}
                              fill
                              className="object-contain"
                              priority={index === 0}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/phone-placeholder.png';
                              }}
                            />
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    </div>

                    {/* 확대 버튼 */}
                    <button
                      onClick={() => setShowImageLightbox(true)}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>

                    {/* 상태 뱃지 */}
                    {phone.status === 'sold' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-white text-2xl font-bold">거래완료</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full aspect-square bg-gray-50 flex flex-col items-center justify-center">
                    <Smartphone className="w-24 h-24 mb-4 text-gray-300" />
                    <p className="text-gray-400">이미지가 없습니다</p>
                  </div>
                )}
              </div>

              {/* 썸네일 네비게이션 - Swiper */}
              {phone.images && phone.images.length > 1 && (
                <div className="px-1">
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
                    {phone.images.map((image, index) => (
                      <SwiperSlide key={index} className="!w-auto">
                        <div className="w-20 h-20 rounded-md overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-dungji-primary transition-all relative">
                          <Image
                            src={image.imageUrl || '/images/phone-placeholder.png'}
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
            </div>
            
            {/* 이미지가 1개만 있을 때 안내 */}
            {phone.images && phone.images.length === 1 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  등록된 이미지가 1개입니다
                </p>
              </div>
            )}

            {/* PC에서만 제품상태 및 설명을 사진 아래로 이동 */}
            {phone.condition_description && (
              <div className="hidden lg:block mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">제품상태 및 설명</h3>
                <p className="text-gray-700 whitespace-pre-wrap break-all">{phone.condition_description}</p>
              </div>
            )}

            {/* PC에서만 거래 가능 지역 - 제품상태 설명 아래로 이동 */}
            {(phone.regions && phone.regions.length > 0) && (
              <div className="hidden lg:block mt-4 p-4 bg-dungji-primary-50 rounded-lg border border-dungji-primary-200">
                <p className="text-sm font-medium text-dungji-primary-900 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  거래 가능 지역
                </p>
                <div className="flex flex-wrap gap-2">
                  {phone.regions.map((region, index) => (
                    <span key={index} className="px-3 py-1 bg-dungji-primary text-white rounded-full text-sm font-medium">
                      {region.full_name || region.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PC에서만 거래시 요청사항 - 제품상태 설명 아래로 이동 */}
            {phone.meeting_place && (
              <div className="hidden lg:block mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  거래시 요청사항
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-all">{phone.meeting_place}</p>
              </div>
            )}

            {/* PC: 본인 등록 상품일 때 수정/삭제 버튼 왼쪽 하단 배치 (판매완료 시 숨김) */}
            {phone.seller?.id === user?.id && phone.status === 'active' && (
              <div className="hidden lg:block mt-8 pt-6 border-t">
                {phone.last_bumped_at && bumpAPI.getTimeUntilNextBumpFromLast(phone.last_bumped_at) && (
                  <div className="flex items-center gap-1 mb-3 ml-4">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {bumpAPI.getTimeUntilNextBumpFromLast(phone.last_bumped_at)}
                    </span>
                  </div>
                )}
                <div className="flex justify-start gap-2 ml-4">
                  <BumpButton
                    item={phone}
                    itemType="phone"
                    size="sm"
                  />
                  <Button
                    onClick={async () => {
                      setCheckingOffers(true);
                      try {
                        // 수정 전 최신 제안 상태 확인
                        const latestOfferCount = await checkLatestOffers();

                        // 이전에 제안이 없었는데 새로 생긴 경우
                        if (activeOffersCount === 0 && latestOfferCount > 0) {
                          toast.info('새로운 제안이 도착했습니다. 일부 항목만 수정 가능합니다.', {
                            duration: 3000,
                          });
                          // 상품 정보 새로고침
                          await fetchPhoneDetail();
                          await fetchActiveOffersCount();
                        }

                        router.push(`/used/${phoneId}/edit`);
                      } catch (error) {
                        console.error('Failed to check offers:', error);
                        router.push(`/used/${phoneId}/edit`);
                      } finally {
                        setCheckingOffers(false);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 w-auto"
                    disabled={checkingOffers}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {checkingOffers ? '확인중' : '수정'}
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
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold">{phone.model}</h1>
                {/* 수정됨 표시 */}
                {phone.is_modified && activeOffersCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    <Edit3 className="w-3 h-3" />
                    <span>수정됨</span>
                  </div>
                )}
              </div>
              
              {/* 가격 */}
              <div className="mb-4">
                {phone.status === 'sold' ? (
                  // 판매완료 - 거래가격 표시
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-500">거래금액</span>
                    <p className="text-2xl font-bold text-gray-400 line-through">
                      {(phone.final_price || phone.price).toLocaleString()}원
                    </p>
                  </div>
                ) : (
                  // 판매중/거래중 - 최소제안가 강조
                  <>
                    {phone.accept_offers && phone.min_offer_price ? (
                      <>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-sm text-gray-600">최소 제안가</span>
                          <p className="text-3xl font-bold text-dungji-primary">
                            {phone.min_offer_price.toLocaleString()}원~
                          </p>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-xs text-gray-500">즉시구매가</span>
                          <p className="text-lg font-medium text-gray-700">
                            {phone.price.toLocaleString()}원
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-sm text-gray-600">판매가격</span>
                        <p className="text-3xl font-bold text-gray-900">
                          {phone.price.toLocaleString()}원
                        </p>
                      </div>
                    )}

                    {/* 조회수 및 통계 - 가격제안 영역 아래로 이동 */}
                    <div className="pt-4 flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          조회 {phone.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          찜 {phone.favorite_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          제안 {activeOffersCount}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {phone.created_at ? formatDistanceToNow(new Date(phone.created_at), { addSuffix: true, locale: ko }) : '-'}
                      </span>
                    </div>

                    {/* 액션 버튼 - 가격제안 영역 아래로 이동 */}
                    <div className="pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={handleFavorite}
                          disabled={isFavorite === null}
                          className={`flex items-center justify-center gap-2 h-12 ${
                            isFavorite === null ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${
                            isFavorite === null
                              ? 'text-gray-300'
                              : isFavorite === true
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-500'
                          }`} />
                          {isFavorite === null ? '로딩...' : (isFavorite === true ? '찜 해제' : '찜하기')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleShare}
                          className="flex items-center justify-center gap-2 h-12"
                        >
                          <Share2 className="w-4 h-4" />
                          공유하기
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 상태 정보 */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-sm text-gray-600 mb-1">제조사</p>
                  <p className="font-medium">
                    {phone.brand && PHONE_BRANDS[phone.brand] ? PHONE_BRANDS[phone.brand] : '-'}
                  </p>
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
                          <div><span className="font-medium">S급:</span> 거의 새것, 미세한 스크래치만 존재</div>
                          <div><span className="font-medium">A급:</span> 가벼운 사용감, 정상 작동</div>
                          <div><span className="font-medium">B급:</span> 눈에 띄는 외관 손상, 정상 작동</div>
                          <div><span className="font-medium">C급:</span> 많은 외관 손상, 정상 작동</div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </p>
                  <p className="font-medium">
                    {phone.condition_grade ? `${phone.condition_grade}급` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">저장공간</p>
                  <p className="font-medium">{phone.storage}GB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">색상</p>
                  <p className="font-medium">{phone.color || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">배터리</p>
                  <p className="font-medium">
                    {phone.battery_status && BATTERY_STATUS_LABELS[phone.battery_status]}
                  </p>
                </div>
              </div>

              {/* 구성품 */}
              <div className="py-4 border-b">
                <p className="text-sm text-gray-600 mb-2">구성품</p>
                <div className="flex gap-3">
                  {phone.has_box && (
                    <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                      박스
                    </span>
                  )}
                  {phone.has_charger && (
                    <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                      충전기
                    </span>
                  )}
                  {phone.has_earphones && (
                    <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-700">
                      이어폰
                    </span>
                  )}
                </div>
              </div>

              {/* 제품상태 및 설명 - 모바일에서만 표시 */}
              {phone.condition_description && (
                <div className="lg:hidden py-4 border-b">
                  <p className="text-sm text-gray-600 mb-2">제품상태 및 설명</p>
                  <p className="text-gray-800 whitespace-pre-wrap break-all">{phone.condition_description}</p>
                </div>
              )}

              {/* 모바일: 거래 가능 지역 - 제품상태 설명 아래로 이동 */}
              {(phone.regions && phone.regions.length > 0) && (
                <div className="lg:hidden py-4 border-b">
                  <p className="text-sm font-medium text-dungji-primary-900 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    거래 가능 지역
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {phone.regions.map((region, index) => (
                      <span key={index} className="px-3 py-1 bg-dungji-primary text-white rounded-full text-sm font-medium">
                        {region.full_name || region.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 모바일: 거래시 요청사항 - 제품상태 설명 아래로 이동 */}
              {phone.meeting_place && (
                <div className="lg:hidden py-4 border-b">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    거래시 요청사항
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-all">{phone.meeting_place}</p>
                </div>
              )}

              {/* 액션 버튼 영역 - 이미 위로 이동함 */}
              <div className="space-y-3">
                {/* 거래중 시 거래 당사자에게 마이페이지 안내 */}
                {phone.status === 'trading' &&
                 user && (Number(user.id) === phone.seller?.id || Number(user.id) === phone.buyer?.id) && (
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
                {user?.id === phone.seller?.id ? (
                  <>
                    {/* 거래중 상태일 때 거래완료 버튼 비활성화 */}
                    {phone.status === 'trading' && (
                      <Button
                        disabled
                        className="w-full h-14 text-lg font-semibold bg-gray-400 cursor-not-allowed text-white mb-3"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        거래중
                      </Button>
                    )}

                    {/* 거래완료 상태일 때 후기 작성 버튼 표시 (판매자) */}
                    {console.log('판매자 버튼 조건 체크:', {
                      status: phone.status,
                      isSeller: phone.seller?.id === user?.id,
                      sellerId: phone.seller?.id,
                      userId: user?.id,
                      transactionId: phone.transaction_id,
                      buyer: phone.buyer,
                      allConditions: phone.status === 'sold' && phone.seller?.id === user?.id && phone.transaction_id
                    })}
                    {phone.status === 'sold' && phone.seller?.id === user?.id && (
                      <Button
                        disabled
                        className="w-full h-14 text-lg font-semibold mb-3 bg-gray-400 cursor-not-allowed text-white"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        판매완료
                      </Button>
                    )}

                    {/* 판매중일 때만 제안 보기 버튼 표시 */}
                    {phone.status === 'active' && phone.accept_offers && (
                      <Button
                        onClick={async () => {
                          setLoadingOffers(true);
                          try {
                            const token = localStorage.getItem('accessToken');
                            // API URL 수정: /phones/{id}/offers/ 엔드포인트 사용
                            const response = await axios.get(
                              `${process.env.NEXT_PUBLIC_API_URL}/used/phones/${phoneId}/offers/`,
                              {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              }
                            );
                            setOffers(response.data);
                            setShowOffersModal(true);
                          } catch (error) {
                            console.error('Failed to fetch offers:', error);
                            toast.error('제안 목록을 불러올 수 없습니다.', {
                              duration: 3000,
                            });
                          } finally {
                            setLoadingOffers(false);
                          }
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
                    {phone.status === 'sold' &&
                     phone.seller?.id !== user?.id &&
                     phone.buyer?.id !== user?.id && (
                      <div className="p-4 bg-gray-100 rounded-lg mb-3">
                        <p className="text-center text-gray-600 font-medium">
                          거래가 완료된 상품입니다
                        </p>
                      </div>
                    )}

                    {phone.accept_offers ? (
                      <>
                        <div className="space-y-2">
                          <Button
                            onClick={async () => {
                              try {
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
                                  setOfferAmount(myOffer.offered_price.toString());
                                  setDisplayAmount(myOffer.offered_price.toLocaleString('ko-KR'));
                                  if (myOffer.message) {
                                    setOfferMessage(myOffer.message);
                                  }
                                  setShowOfferModal(true);
                                  toast.info('기존 제안을 수정합니다.', {
                                    duration: 2000,
                                  });
                                } else {
                                  // 신규 제안 - 최소제안가를 기본값으로 설정
                                  const defaultPrice = phone.min_offer_price || 0;
                                  setOfferAmount(defaultPrice.toString());
                                  setDisplayAmount(defaultPrice.toLocaleString('ko-KR'));
                                  setShowOfferModal(true);
                                }
                              } catch (error) {
                                console.error('Profile check error:', error);
                                toast.error('프로필 확인 중 오류가 발생했습니다.', {
                                  duration: 3000,
                                });
                                return;
                              }
                            }}
                            className={`w-full h-14 text-lg font-semibold ${
                              phone.status !== 'active'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                            disabled={phone.status !== 'active' || (remainingOffers !== null && remainingOffers <= 0 && !myOffer)}
                          >
                            {phone.status === 'trading'
                              ? '거래중인 상품입니다'
                              : phone.status === 'sold'
                              ? '거래완료된 상품입니다'
                              : myOffer && myOffer.status === 'pending'
                              ? '제안 수정하기'
                              : '가격 제안하기'}
                          </Button>
                          
                          {/* 제안 취소 버튼 - 거래중/판매완료가 아닌 경우에만 표시 */}
                          {myOffer && myOffer.status === 'pending' && phone.status === 'active' && (
                            <Button
                              variant="outline"
                              onClick={async () => {
                                if (confirm('제안을 취소하시겠습니까?')) {
                                  try {
                                    const token = localStorage.getItem('accessToken');

                                    const response = await axios.post(
                                      `${process.env.NEXT_PUBLIC_API_URL}/used/offers/${myOffer.id}/cancel/`,
                                      {},
                                      {
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        }
                                      }
                                    );
                                    
                                    if (response.status === 200 || response.status === 204) {
                                      setMyOffer(null);
                                      // 취소해도 5회 카운팅은 원복하지 않음
                                      // setRemainingOffers(prev => Math.min(5, prev + 1));
                                      await fetchPhoneDetail(); // 상품 정보 다시 조회
                                      await fetchActiveOffersCount(); // 활성 제안 수 업데이트
                                      toast.success('가격 제안이 취소되었습니다.', {
                                        duration: 2000,
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Failed to cancel offer:', error);
                                  }
                                }
                              }}
                              size="sm"
                              className="border-gray-300 hover:bg-dungji-danger hover:text-white hover:border-dungji-danger transition-colors"
                            >
                              제안 취소
                            </Button>
                          )}
                        </div>

                        {/* 거래중 상태 메시지 - 구매자 본인일 때만 */}
                        {phone.status === 'trading' && phone.buyer_id === Number(user?.id) && (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 text-orange-700">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium">
                                판매자와 거래가 진행중입니다
                              </span>
                            </div>
                          </div>
                        )}

                        {phone.status === 'sold' && phone.buyer_id === Number(user?.id) && (
                          <Link href="/used/mypage?tab=trading">
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Info className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">
                                    거래 완료된 상품입니다. 거래 내역은 마이페이지에서 확인하실 수 있습니다
                                  </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-blue-600" />
                              </div>
                            </div>
                          </Link>
                        )}

                        {phone.status === 'sold' && phone.final_price && phone.buyer_id !== Number(user?.id) && (
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <span className="text-sm font-medium">
                                {phone.final_price.toLocaleString()}원에 거래완료
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {phone.status === 'sold' && !phone.final_price && (
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <span className="text-sm font-medium">거래완료된 상품입니다</span>
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
                        
                        {/* 내가 제안한 금액 표시 */}
                        {myOffer && myOffer.status !== 'cancelled' && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  내가 제안한 금액
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {myOffer.offered_price.toLocaleString()}원
                                </p>
                                {myOffer.message && (
                                  <p className="text-xs text-gray-600 mt-2 italic">
                                    "{myOffer.message}"
                                  </p>
                                )}
                              </div>
                              {myOffer.status !== 'pending' && (
                                <div className="text-right">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                    myOffer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    myOffer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {myOffer.status === 'accepted' ? '수락됨' :
                                     myOffer.status === 'rejected' ? '거절됨' :
                                     myOffer.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Button
                        className="w-full h-14 text-lg font-semibold"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        판매자와 대화하기
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 판매자 정보 */}
            <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
              <h2 className="font-semibold mb-4">판매자 정보</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">판매</span>
                      <span className="font-semibold text-dungji-primary">{phone.seller?.sell_count || 0}회</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">구매</span>
                      <span className="font-semibold text-green-600">{phone.seller?.buy_count || 0}회</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">거래</span>
                      <span className="font-semibold text-purple-600">{phone.seller?.total_trade_count || 0}회</span>
                    </div>
                  </div>
                </div>
              </div>
              

              {/* 모바일: 본인 등록 상품일 때 수정/삭제 버튼 (판매완료 시 숨김) */}
              {phone.seller?.id === user?.id && phone.status === 'active' && (
                <div className="lg:hidden mt-4 pt-4 border-t">
                  {phone.last_bumped_at && bumpAPI.getTimeUntilNextBumpFromLast(phone.last_bumped_at) && (
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {bumpAPI.getTimeUntilNextBumpFromLast(phone.last_bumped_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-center gap-2">
                    <BumpButton
                      item={phone}
                      itemType="phone"
                      size="sm"
                    />
                  <Button
                    onClick={async () => {
                      setCheckingOffers(true);
                      try {
                        // 수정 전 최신 제안 상태 확인
                        const latestOfferCount = await checkLatestOffers();

                        // 이전에 제안이 없었는데 새로 생긴 경우
                        if (activeOffersCount === 0 && latestOfferCount > 0) {
                          toast.info('새로운 제안이 도착했습니다. 일부 항목만 수정 가능합니다.', {
                            duration: 3000,
                          });
                          // 상품 정보 새로고침
                          await fetchPhoneDetail();
                          await fetchActiveOffersCount();
                        }

                        router.push(`/used/${phoneId}/edit`);
                      } catch (error) {
                        console.error('Failed to check offers:', error);
                        router.push(`/used/${phoneId}/edit`);
                      } finally {
                        setCheckingOffers(false);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 w-auto"
                    disabled={checkingOffers}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {checkingOffers ? '확인중' : '수정'}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 w-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제
                  </Button>
                  </div>
                </div>
              )}
            </div>


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
                      <span>휴대폰 상태를 꼼꼼히 확인 후 구매 결정하세요</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>현금 거래로 안전하게 진행하세요</span>
                    </li>
                  </ul>
                </div>
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
                  {phone.brand} {phone.model.length > 25 ? phone.model.slice(0, 25) + '...' : phone.model}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {phone.storage}GB | {phone.color}
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
                      제안 횟수를 모두 사용했습니다
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
                    if (numValue > phone.price) {
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
              {offerAmount && parseInt(offerAmount) < (phone.min_offer_price || 0) && (
                <p className="text-xs text-red-500 mt-1">
                  최소제안가 {phone.min_offer_price?.toLocaleString()}원 이상으로 입력해주세요
                </p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <div className="inline-flex items-center px-2.5 py-1 bg-amber-100 border border-amber-300 rounded-full">
                  <span className="text-xs font-semibold text-amber-800">
                    최소제안가: {phone.min_offer_price?.toLocaleString()}원
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOfferAmount(phone.price.toString());
                    setDisplayAmount(phone.price.toLocaleString('ko-KR'));
                  }}
                  className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold shadow-sm"
                >
                  즉시구매가 {phone.price.toLocaleString()}원
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
                  if (parseInt(offerAmount) < (phone.min_offer_price || 0)) {
                    toast.error(`최소제안가 ${phone.min_offer_price?.toLocaleString()}원 이상으로 입력해주세요`);
                    return;
                  }
                  // 선택된 메시지들을 합쳐서 하나의 메시지로 만들기
                  const combinedMessage = selectedMessages.join(' / ');
                  // 상태도 업데이트 (표시용)
                  setOfferMessage(combinedMessage);
                  // 확인 모달로 전환
                  handleOfferConfirm();
                }}
                disabled={!offerAmount || (remainingOffers !== null && remainingOffers === 0) || Boolean(offerAmount && parseInt(offerAmount) < (phone.min_offer_price || 0))}
                className="flex-1 h-9 sm:h-10 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm"
              >
                {myOffer && myOffer.status === 'pending' ? '제안 수정하기' : '제안하기'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5">
            <h3 className="text-lg font-semibold mb-3">상품 삭제</h3>

            {activeOffersCount > 0 && (
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

            <p className="text-sm text-gray-600 mb-4">
              삭제 후 복구 불가능합니다.
              {activeOffersCount > 0 && ' 모든 제안이 취소됩니다.'}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className={`flex-1 ${activeOffersCount > 0 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
              >
                {deleting ? '삭제 중...' : activeOffersCount > 0 ? '패널티 감수하고 삭제' : '삭제하기'}
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
              <div className={`w-16 h-16 ${parseInt(offerAmount) === phone.price ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className={`text-3xl font-bold ${parseInt(offerAmount) === phone.price ? 'text-green-600' : 'text-blue-600'}`}>￦</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {parseInt(offerAmount) === phone.price ? '🎉 즉시구매 확인' : '가격 제안 확인'}
              </h3>
              <p className={`text-2xl font-bold ${parseInt(offerAmount) === phone.price ? 'text-green-600' : 'text-blue-600'} mb-2`}>
                {parseInt(offerAmount).toLocaleString()}원
              </p>
              {parseInt(offerAmount) === phone.price && (
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full mb-2">
                  판매자가 설정한 즉시구매가
                </div>
              )}
              <p className="text-sm text-gray-600">
                {parseInt(offerAmount) === phone.price
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
            
            <div className={`${parseInt(offerAmount) === phone.price ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border rounded-lg p-3 mb-4`}>
              <p className={`text-xs ${parseInt(offerAmount) === phone.price ? 'text-green-700' : 'text-amber-700'}`}>
                {parseInt(offerAmount) === phone.price 
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
                className={`flex-1 ${parseInt(offerAmount) === phone.price
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
              >
                {parseInt(offerAmount) === phone.price ? '즉시구매' : '예, 제안합니다'}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* 이미지 라이트박스 - Swiper */}
      {showImageLightbox && phone.images && phone.images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60]">
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="w-full h-full flex items-center justify-center">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{
                type: 'fraction',
              }}
              loop={true}
              speed={450}
              initialSlide={lightboxImageIndex}
              className="w-full h-full"
            >
              {phone.images.map((image, index) => (
                <SwiperSlide key={index}>
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <Image
                      src={image.imageUrl || '/images/phone-placeholder.png'}
                      alt={`${phone.model} ${index + 1}`}
                      width={1200}
                      height={1200}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

      {/* 거래완료 모달 */}
      {showTradeCompleteModal && (
        <TradeCompleteModal
          isOpen={showTradeCompleteModal}
          onClose={() => setShowTradeCompleteModal(false)}
          phoneId={parseInt(phoneId)}
          phoneModel={phone.model_name || phone.model || ''}
          isSeller={user?.id === phone.seller?.id}
          onComplete={() => {
            fetchPhoneDetail();
            fetchActiveOffersCount();
            setShowTradeCompleteModal(false);
            toast.success('거래가 완료되었습니다. 후기를 작성해주세요!', {
              duration: 3000,
            });
          }}
        />
      )}

      {/* 후기 작성 모달 */}
      {(() => {
        console.log('모달 렌더링 조건 체크:', {
          showTradeReviewModal,
          reviewTarget,
          phoneExists: !!phone,
          allConditionsMet: showTradeReviewModal && reviewTarget && phone
        });
        return null;
      })()}
      {showTradeReviewModal && reviewTarget && phone && (
        <TradeReviewModal
          isOpen={showTradeReviewModal}
          onClose={() => {
            setShowTradeReviewModal(false);
            setReviewTarget(null);
          }}
          transactionId={phone.transaction_id || 0} // 트랜잭션 ID가 필요함
          isSeller={reviewTarget === 'buyer'} // 판매자가 구매자를 평가하는 경우
          partnerName={reviewTarget === 'buyer' ? (phone.buyer?.nickname || phone.buyer?.username || '구매자') : (phone.seller?.nickname || phone.seller?.username || '판매자')}
          phoneModel={phone.model_name || phone.model || ''}
          onReviewComplete={() => {
            setReviewCompleted(true);  // 후기 작성 완료 상태 업데이트
            fetchPhoneDetail();
            fetchActiveOffersCount();
            setShowTradeReviewModal(false);
            setReviewTarget(null);
            toast.success('거래 후기가 등록되었습니다.', {
              duration: 2000,
            });
          }}
        />
      )}

      {/* 상태 등급 안내 모달 */}
      {showGradeInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">상품 상태 등급 안내</h3>
              <button
                onClick={() => setShowGradeInfo(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-blue-700">S급</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">최상급</span>
                </div>
                <p className="text-sm text-gray-600">
                  미개봉 또는 개봉 후 사용하지 않은 새 제품
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-green-700">A급</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">상급</span>
                </div>
                <p className="text-sm text-gray-600">
                  사용감이 거의 없고 미세한 흠집만 있는 상태
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-yellow-700">B급</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">중급</span>
                </div>
                <p className="text-sm text-gray-600">
                  일반적인 사용감과 작은 흠집이 있는 상태
                </p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-orange-700">C급</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">하급</span>
                </div>
                <p className="text-sm text-gray-600">
                  사용감이 많고 눈에 띄는 흠집이 있지만 작동에는 문제 없는 상태
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                onClick={() => setShowGradeInfo(false)}
                className="w-full"
                variant="outline"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 받은 제안 목록 모달 */}
      {showOffersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                받은 제안 목록 {offers.length > 0 && `(${offers.length}개)`}
              </h3>
              <button
                onClick={() => setShowOffersModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {offers.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">가격 제안을 기다리는 중입니다</p>
                <p className="text-sm text-gray-400 mt-2">
                  구매 희망자가 제안을 보내면 여기에 표시됩니다
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <div key={offer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">{offer.buyer?.nickname || offer.buyer?.username || '익명'}</span>
                          <span className="text-sm text-gray-500">
                            {offer.created_at && formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: ko })}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {offer.offered_price.toLocaleString()}원
                          </span>
                        </div>
                        {offer.message && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {offer.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOfferId(offer.id);
                            setShowAcceptModal(true);
                          }}
                        >
                          수락
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 제안 수락 확인 모달 */}
      {showAcceptModal && selectedOfferId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">제안을 수락하시겠습니까?</h3>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                제안 수락 시 즉시 거래가 진행됩니다.
              </p>
              <p className="text-sm text-gray-500">
                제안 금액: <span className="font-bold text-lg text-blue-600">
                  {offers.find(o => o.id === selectedOfferId)?.offered_price.toLocaleString()}원
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedOfferId(null);
                }}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={async () => {
                  await executeTransactionAction(
                    async () => {
                      const token = localStorage.getItem('accessToken');
                      const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/used/offers/${selectedOfferId}/respond/`,
                        { action: 'accept' },
                        { headers: { 'Authorization': `Bearer ${token}` } }
                      );
                      return response.data;
                    },
                    {
                      successMessage: '제안을 수락했습니다. 거래가 시작됩니다.',
                      onSuccess: () => {
                        setShowAcceptModal(false);
                        setShowOffersModal(false);
                        setSelectedOfferId(null);
                        // 1초 후 마이페이지 판매내역 거래중 탭으로 이동
                        setTimeout(() => {
                          router.push('/used/mypage?tab=sales&filter=trading');
                        }, 1000);
                      },
                      onError: () => {
                        setShowAcceptModal(false);
                        setSelectedOfferId(null);
                      }
                    }
                  );
                }}
                className="flex-1"
              >
                수락하기
              </Button>
            </div>
          </div>
        </div>
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
          /* 모바일에서 네비게이션 화살표 숨기기 */
          @media (max-width: 768px) {
            .used-phone-swiper .swiper-button-prev,
            .used-phone-swiper .swiper-button-next {
              display: none !important;
            }
          }

          /* 데스크톱 네비게이션 스타일 */
          @media (min-width: 769px) {
            .used-phone-swiper .swiper-button-prev,
            .used-phone-swiper .swiper-button-next {
              width: 40px !important;
              height: 40px !important;
              background: rgba(255, 255, 255, 0.2) !important;
              backdrop-filter: blur(4px) !important;
              border-radius: 50% !important;
              transition: all 0.3s ease !important;
            }

            .used-phone-swiper .swiper-button-prev:hover,
            .used-phone-swiper .swiper-button-next:hover {
              background: rgba(255, 255, 255, 0.3) !important;
              transform: scale(1.1) !important;
            }

            .used-phone-swiper .swiper-button-prev::after,
            .used-phone-swiper .swiper-button-next::after {
              font-size: 20px !important;
              font-weight: bold !important;
              color: rgba(255, 255, 255, 0.7) !important;
            }

            .used-phone-swiper .swiper-button-prev {
              left: 8px !important;
            }

            .used-phone-swiper .swiper-button-next {
              right: 8px !important;
            }
          }

          .swiper-pagination-bullet {
            background: rgba(255, 255, 255, 0.5) !important;
          }

          .swiper-pagination-bullet-active {
            background: rgba(255, 255, 255, 1) !important;
          }

          /* Thumbnail active state */
          .swiper-slide-thumb-active > div {
            border-color: #ff6b35 !important;
          }
        `}</style>
      </div>
    </div>
  );
}
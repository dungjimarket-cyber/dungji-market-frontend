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
  Check, X, Phone, User, Smartphone, Edit3, Trash2, DollarSign, Info, ZoomIn,
  CheckCircle2, MessageSquarePlus
} from 'lucide-react';
import TradeCompleteModal from '@/components/used/TradeCompleteModal';
import TradeReviewModal from '@/components/used/TradeReviewModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useUsedPhoneProfileCheck } from '@/hooks/useUsedPhoneProfileCheck';
import { UsedPhone, CONDITION_GRADES, BATTERY_STATUS_LABELS } from '@/types/used';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { executeTransactionAction } from '@/lib/utils/transactionHelper';

export default async function UsedPhoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UsedPhoneDetailClient phoneId={id} />;
}

function UsedPhoneDetailClient({ phoneId }: { phoneId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { isProfileComplete: hasUsedPhoneProfile } = useUsedPhoneProfileCheck();

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
  const [myOffer, setMyOffer] = useState<any>(null);
  const [loadingMyOffer, setLoadingMyOffer] = useState(false);
  const [remainingOffers, setRemainingOffers] = useState<number | null>(null); // null로 초기화하여 로딩 상태 표시
  const [showTradeCompleteModal, setShowTradeCompleteModal] = useState(false);
  const [showTradeReviewModal, setShowTradeReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<'buyer' | 'seller' | null>(null);

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

  // 상품 정보 조회
  useEffect(() => {
    fetchPhoneDetail();
    fetchOfferCount();
    // 로그인한 경우 내가 제안한 금액 확인
    if (isAuthenticated) {
      fetchMyOffer();
    }
  }, [phoneId, isAuthenticated]);
  
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
        if (data && data.offered_price) {
          setMyOffer(data);
          // 사용자의 총 제안 횟수 가져오기
          if (data.user_offer_count) {
            setOfferCount(data.user_offer_count);
            setRemainingOffers(Math.max(0, 5 - data.user_offer_count));
          }
        }
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
      setPhone(data);
      setIsFavorite(data.is_favorite || false);
      
      // 조회수는 백엔드에서 자동으로 증가됨 (retrieve 메서드에서 처리)
      // fetch(`/api/used/phones/${phoneId}/view`, { method: 'POST' });
      
    } catch (error) {
      console.error('Failed to fetch phone:', error);
      toast({
        title: '오류',
        description: '상품 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 사용자의 제안 횟수 조회
  const fetchOfferCount = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/offer_count/`
        : `${baseUrl}/api/used/phones/${phoneId}/offer_count/`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOfferCount(data.count || 0);
        setRemainingOffers(Math.max(0, 5 - (data.count || 0)));
      }
    } catch (error) {
      console.error('Failed to fetch offer count:', error);
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

  // 찜하기
  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: '로그인 필요',
        description: '찜하기는 로그인 후 이용 가능합니다.',
        variant: 'destructive',
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
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        toast({
          title: newFavoriteState ? '찜 완료' : '찜 해제',
          description: newFavoriteState ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.',
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
      toast({
        title: '제안 금액 확인',
        description: `최소 제안 금액은 ${phone?.min_offer_price?.toLocaleString()}원입니다.`,
        variant: 'destructive',
      });
      return;
    }

    // 천원 단위로 반올림 (1원 단위 입력 시 자동 반올림)
    const roundedAmount = Math.round(amount / 1000) * 1000;
    if (roundedAmount !== amount) {
      amount = roundedAmount;
      setOfferAmount(amount.toString());
      setDisplayAmount(amount.toLocaleString('ko-KR'));
      toast({
        title: '금액 자동 조정',
        description: `천원 단위로 조정되었습니다: ${amount.toLocaleString()}원`,
      });
    }

    if (amount > 9900000) {
      toast({
        title: '제안 금액 초과',
        description: '최대 제안 가능 금액은 990만원입니다.',
        variant: 'destructive',
      });
      return;
    }

    if (offerCount !== null && offerCount >= 5) {
      toast({
        title: '제안 횟수 초과',
        description: '해당 상품에 최대 5회까지만 제안 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmModal(true);
  };

  // 가격 제안
  const handleSubmitOffer = async () => {
    if (!isAuthenticated) {
      toast({
        title: '로그인 필요',
        description: '가격 제안은 로그인 후 이용 가능합니다.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    const amount = parseInt(offerAmount);
    // 수정인지 신규 제안인지 확인
    const isModification = myOffer && myOffer.status === 'pending';

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
            message: offerMessage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
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
          toast({
            title: '즉시구매 완료!',
            description: '거래가 시작되었습니다. 거래중 탭으로 이동합니다.',
          });

          // 판매자 연락처 표시 모달 또는 알림
          if (data.seller_contact) {
            // 연락처 정보를 표시하거나 저장
            console.log('판매자 연락처:', data.seller_contact);
          }

          // 2초 후 마이페이지 거래중 탭으로 이동
          setTimeout(() => {
            router.push('/used/mypage?tab=trading');
          }, 2000);
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

          // 내 제안 정보와 카운트 다시 불러오기
          await fetchMyOffer();
          await fetchOfferCount();
          await fetchPhoneDetail();
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
      toast({
        title: '링크 복사',
        description: '링크가 클립보드에 복사되었습니다.',
      });
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!phone) return;
    
    setDeleting(true);
    
    try {
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
          toast({
            title: '삭제 제한',
            description: errorData.message || '제안된 견적이 있어 6시간 패널티가 적용됩니다.',
            variant: 'destructive',
          });
          // 사용자가 확인 후에도 삭제하길 원할 수 있으므로 모달은 열어둠
          setDeleting(false);
          return;
        }
        
        throw new Error(errorData.message || '삭제 실패');
      }
      
      const result = await response.json();
      
      toast({
        title: '삭제 완료',
        description: result.penalty_applied 
          ? '상품이 삭제되었습니다. 견적 제안이 있어 6시간 후 재등록 가능합니다.'
          : '상품이 삭제되었습니다.',
      });
      
      setShowDeleteModal(false);
      router.push('/used');
      
    } catch (error) {
      console.error('Failed to delete phone:', error);
      toast({
        title: '삭제 실패',
        description: '상품 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
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
          <button onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={handleFavorite}>
              <Heart className={`w-5 h-5 ${isFavorite === true ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-hidden">
        <div className="container max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* 이미지 섹션 */}
          <div className="w-full">
            {/* 메인 이미지 */}
            <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden group shadow-sm border border-gray-200">
              {phone.images && phone.images.length > 0 && phone.images[currentImageIndex]?.imageUrl ? (
                <>
                  <Image
                    src={phone.images[currentImageIndex].imageUrl || '/images/phone-placeholder.png'}
                    alt={phone.model || '중고폰 이미지'}
                    fill
                    className="object-contain"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/phone-placeholder.png';
                    }}
                  />
                  
                  {/* 돋보기 버튼 */}
                  <button
                    onClick={() => {
                      setLightboxImageIndex(currentImageIndex);
                      setShowImageLightbox(true);
                    }}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white shadow-md transition-all group-hover:opacity-100 opacity-0"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  
                  {/* 이미지 네비게이션 */}
                  {phone.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      
                      {/* 이미지 인디케이터 */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {phone.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Smartphone className="w-24 h-24 mb-4 text-gray-300" />
                  <p>이미지가 없습니다</p>
                </div>
              )}

              {/* 상태 뱃지 */}
              {phone.status === 'sold' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">판매완료</span>
                </div>
              )}
            </div>

            {/* 썸네일 - 최대 5개까지 모두 표시 */}
            {phone.images && phone.images.length > 1 && (
              <div className="mt-4">
                <div className="grid grid-cols-5 gap-2">
                  {phone.images.slice(0, 5).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-dungji-primary shadow-lg scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={img.imageUrl}
                        alt={`${phone.model} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-dungji-primary text-white text-xs px-1.5 py-0.5 rounded font-medium">
                          대표
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* 이미지가 1개만 있을 때 안내 */}
            {phone.images && phone.images.length === 1 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  등록된 이미지가 1개입니다
                </p>
              </div>
            )}
            
            {/* 제품상태 및 설명 - 이미지 하단으로 이동 */}
            {phone.condition_description && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">제품상태 및 설명</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{phone.condition_description}</p>
              </div>
            )}
          </div>

          {/* 정보 섹션 */}
          <div className="w-full overflow-hidden">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold">{phone.model}</h1>
                {/* 수정됨 표시 */}
                {phone.is_modified && phone.offer_count > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    <Edit3 className="w-3 h-3" />
                    <span>수정됨</span>
                  </div>
                )}
              </div>
              
              {/* 가격 */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm text-gray-600">즉시구매</span>
                  <p className="text-3xl font-bold text-gray-900">
                    {phone.price.toLocaleString()}원
                  </p>
                </div>
                {phone.accept_offers && phone.min_offer_price && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-dungji-primary-900">
                      💰 가격 제안 가능
                    </p>
                    <p className="text-xs text-dungji-primary-700 mt-1">
                      최소 제안가: {phone.min_offer_price.toLocaleString()}원부터
                    </p>
                  </div>
                )}
              </div>

              {/* 상태 정보 */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    상태
                    <button
                      onClick={() => setShowGradeInfo(true)}
                      className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                      title="등급 안내 보기"
                    >
                      <Info className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </p>
                  <p className="font-medium">
                    {phone.condition_grade && CONDITION_GRADES[phone.condition_grade]}
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
                  <span className={`px-2 py-1 rounded text-sm ${phone.has_box ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                    박스
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${phone.has_charger ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                    충전기
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${phone.has_earphones ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                    이어폰
                  </span>
                </div>
              </div>

              {/* 조회수 및 통계 */}
              <div className="py-4 flex items-center justify-between text-sm text-gray-600">
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
                    제안 {phone.offer_count || 0}
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {phone.created_at ? formatDistanceToNow(new Date(phone.created_at), { addSuffix: true, locale: ko }) : '-'}
                </span>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleFavorite}
                    className="flex items-center justify-center gap-2 h-12"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite === true ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorite === true ? '찜 해제' : '찜하기'}
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
                {/* 본인이 등록한 상품인 경우 */}
                {user?.id === phone.seller?.id ? (
                  <>
                    {/* 거래중 상태일 때 거래완료 버튼 표시 */}
                    {phone.status === 'trading' && (
                      <Button
                        onClick={() => setShowTradeCompleteModal(true)}
                        className="w-full h-14 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white mb-3"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        거래완료
                      </Button>
                    )}

                    {/* 거래완료 상태일 때 후기 작성 버튼 표시 */}
                    {phone.status === 'completed' && !phone.seller_reviewed && (
                      <Button
                        onClick={() => {
                          setReviewTarget('buyer');
                          setShowTradeReviewModal(true);
                        }}
                        className="w-full h-14 text-lg font-semibold bg-purple-500 hover:bg-purple-600 text-white mb-3"
                      >
                        <MessageSquarePlus className="w-5 h-5 mr-2" />
                        후기 작성하기
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
                            toast({
                              title: '오류',
                              description: '제안 목록을 불러올 수 없습니다.',
                              variant: 'destructive'
                            });
                          } finally {
                            setLoadingOffers(false);
                          }
                        }}
                        className="w-full h-14 text-lg font-semibold bg-dungji-secondary hover:bg-dungji-secondary-dark"
                        disabled={loadingOffers}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        받은 제안 보기 {phone.offer_count > 0 && `(${phone.offer_count})`}
                      </Button>
                    )}
                  </>
                ) : (
                  /* 다른 사람의 상품인 경우 */
                  <>
                    {/* 거래완료 상태일 때 구매자도 후기 작성 가능 */}
                    {phone.status === 'completed' && phone.buyer?.id === user?.id && !phone.buyer_reviewed && (
                      <Button
                        onClick={() => {
                          setReviewTarget('seller');
                          setShowTradeReviewModal(true);
                        }}
                        className="w-full h-14 text-lg font-semibold bg-purple-500 hover:bg-purple-600 text-white mb-3"
                      >
                        <MessageSquarePlus className="w-5 h-5 mr-2" />
                        후기 작성하기
                      </Button>
                    )}

                    {/* 거래가 완료된 경우 안내 메시지 */}
                    {phone.status === 'completed' && phone.buyer?.id !== user?.id && (
                      <div className="p-4 bg-gray-100 rounded-lg mb-3">
                        <p className="text-center text-gray-600 font-medium">거래가 종료되었습니다</p>
                      </div>
                    )}

                    {phone.accept_offers ? (
                      <>
                        <div className="space-y-2">
                          <Button
                            onClick={() => {
                              // 로그인 체크
                              if (!isAuthenticated) {
                                toast({
                                  title: '로그인 필요',
                                  description: '가격 제안은 로그인 후 이용 가능합니다.',
                                  variant: 'destructive',
                                });
                                router.push('/login');
                                return;
                              }

                              // 프로필 체크
                              if (!hasUsedPhoneProfile) {
                                toast({
                                  title: '프로필 등록 필요',
                                  description: '중고폰 거래를 위해 프로필 등록이 필요합니다.',
                                  variant: 'destructive',
                                });
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
                                toast({
                                  title: '수정 제안',
                                  description: '기존 제안을 수정합니다.',
                                });
                              } else {
                                // 신규 제안
                                setShowOfferModal(true);
                              }
                            }}
                            className={`w-full h-14 text-lg font-semibold ${
                              phone.status !== 'active'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-dungji-primary hover:bg-dungji-primary-dark'
                            } text-white`}
                            disabled={phone.status !== 'active' || (remainingOffers !== null && remainingOffers <= 0 && !myOffer)}
                          >
                            <DollarSign className="w-5 h-5 mr-2" />
                            {phone.status === 'trading'
                              ? '거래중인 상품입니다'
                              : phone.status === 'sold'
                              ? '판매완료된 상품입니다'
                              : phone.status === 'completed'
                              ? '거래가 종료되었습니다'
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
                                      await fetchOfferCount(); // 서버에서 실제 카운트 다시 조회
                                      toast({
                                        title: '제안 취소',
                                        description: '가격 제안이 취소되었습니다.',
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
                        {phone.status === 'trading' && phone.buyer_id === user?.id && (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 text-orange-700">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium">
                                판매자와 거래가 진행중입니다
                              </span>
                            </div>
                          </div>
                        )}

                        {phone.status === 'sold' && phone.final_price && (
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <span className="text-sm font-medium">
                                {phone.final_price.toLocaleString()}원에 판매완료된 상품입니다
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {phone.status === 'sold' && !phone.final_price && (
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <span className="text-sm font-medium">판매완료된 상품입니다</span>
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
                              <div className="text-right">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  myOffer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  myOffer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  myOffer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {myOffer.status === 'pending' ? '대기중' :
                                   myOffer.status === 'accepted' ? '수락됨' :
                                   myOffer.status === 'rejected' ? '거절됨' :
                                   myOffer.status}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {myOffer.created_at && formatDistanceToNow(new Date(myOffer.created_at), { addSuffix: true, locale: ko })}
                                </p>
                              </div>
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
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-500">닉네임</span>
                    <p className="font-semibold text-lg">{phone.seller?.username || phone.seller?.name || '알 수 없음'}</p>
                  </div>
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
              
              {/* 거래 가능 지역 - 통합 표시 */}
              {(phone.regions && phone.regions.length > 0) && (
                <div className="mt-4 p-4 bg-dungji-primary-50 rounded-lg border border-dungji-primary-200">
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
              
              {/* 거래 요청사항 */}
              {phone.meeting_place && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    판매자 요청사항
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{phone.meeting_place}</p>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">가격 제안하기</h3>
                <p className="text-sm text-gray-500 mt-1">판매자에게 희망 가격을 제안해보세요</p>
              </div>
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  setOfferAmount('');
                  setDisplayAmount('');
                  setOfferMessage('');
                  setSelectedMessages([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* 제품 정보 미리보기 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-3">
                {phone.images?.[0] && (
                  <Image
                    src={phone.images[0].imageUrl}
                    alt={phone.model}
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{phone.model}</p>
                  <p className="text-xs text-gray-600">{phone.storage}GB | {phone.color}</p>
                  <p className="text-sm font-bold text-dungji-primary mt-1">
                    즉시 구매가: {phone.price?.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
            
            {/* 제안 횟수 표시 */}
            <div className="flex items-center justify-between mb-4 p-3 bg-dungji-cream rounded-lg border border-dungji-cream-dark">
              <span className="text-sm font-medium text-gray-700">
                남은 제안 횟수
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-dungji-primary">{remainingOffers !== null ? remainingOffers : '...'}</span>
                <span className="text-sm text-gray-600">/ 5회</span>
              </div>
            </div>
            
            {remainingOffers !== null && remainingOffers === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
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
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-900">
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
                  className="pr-12 h-12 text-lg font-semibold"
                  inputMode="numeric"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">원</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  최소: {phone.min_offer_price?.toLocaleString()}원 | 최대: {phone.price.toLocaleString()}원
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOfferAmount(phone.price.toString());
                    setDisplayAmount(phone.price.toLocaleString('ko-KR'));
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  즉시구매가 입력
                </button>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
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
              
              {/* 선택된 메시지 표시 */}
              {selectedMessages.length > 0 && (
                <div className="mb-2 p-2 bg-dungji-secondary rounded border border-dungji-primary-200">
                  <p className="text-xs text-dungji-primary-700 mb-1">선택된 메시지 ({selectedMessages.length}/5)</p>
                  <div className="space-y-1">
                    {selectedMessages.map((msg, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs text-dungji-primary-900">• {msg}</span>
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

              {/* 컴팩트한 템플릿 선택 영역 */}
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                {Object.entries(messageTemplates).map(([category, messages]) => (
                  <details key={category} className="mb-2 last:mb-0">
                    <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900 py-1">
                      {category}
                    </summary>
                    <div className="mt-1 pl-3 space-y-1">
                      {messages.map((msg) => (
                        <button
                          key={msg}
                          type="button"
                          onClick={() => {
                            if (selectedMessages.length < 5) {
                              setSelectedMessages(prev => [...prev, msg]);
                            }
                          }}
                          disabled={selectedMessages.length >= 5}
                          className={`block w-full text-left text-xs py-1 px-2 rounded hover:bg-gray-100 transition-colors ${
                            selectedMessages.includes(msg)
                              ? 'bg-dungji-secondary-light text-dungji-primary-700'
                              : 'text-gray-700'
                          } ${selectedMessages.length >= 5 && !selectedMessages.includes(msg) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {msg}
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* 제안 안내사항 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">제안 안내사항</p>
                  <ul className="space-y-0.5 text-amber-700">
                    <li>• 가격 제안은 신중하게 부탁드립니다</li>
                    <li>• 판매자가 제안을 수락하면 연락처가 공개됩니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOfferModal(false);
                  setOfferAmount('');
                  setDisplayAmount('');
                  setSelectedMessages([]);
                }}
                className="flex-1 h-12"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  // 선택된 메시지들을 합쳐서 하나의 메시지로 만들기
                  const combinedMessage = selectedMessages.join(' / ');
                  setOfferMessage(combinedMessage);
                  handleOfferConfirm();
                }}
                disabled={!offerAmount || (remainingOffers !== null && remainingOffers === 0)}
                className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                제안하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">상품 삭제</h3>
                <p className="text-sm text-gray-600">정말로 이 상품을 삭제하시겠습니까?</p>
              </div>
            </div>
            
            {phone.offer_count > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">제안된 견적이 있습니다</p>
                    <p className="text-sm text-amber-700 mt-1">
                      상품 삭제 시 6시간 동안 새로운 상품을 등록할 수 없습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                • 삭제된 상품은 복구할 수 없습니다<br/>
                • 관련된 모든 견적 제안이 취소됩니다<br/>
                {phone.offer_count > 0 && '• 6시간 패널티가 적용됩니다'}
              </p>
            </div>

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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? '삭제 중...' : '삭제하기'}
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
                <DollarSign className={`w-8 h-8 ${parseInt(offerAmount) === phone.price ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {parseInt(offerAmount) === phone.price ? '즉시구매 확인' : '가격 제안 확인'}
              </h3>
              <p className={`text-2xl font-bold ${parseInt(offerAmount) === phone.price ? 'text-green-600' : 'text-blue-600'} mb-2`}>
                {parseInt(offerAmount).toLocaleString()}원
              </p>
              <p className="text-sm text-gray-600">
                {parseInt(offerAmount) === phone.price
                  ? '즉시구매가로 구매하시겠습니까?'
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
                onClick={handleSubmitOffer}
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


      {/* 이미지 라이트박스 */}
      {showImageLightbox && phone.images && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4">
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={phone.images[lightboxImageIndex]?.imageUrl || '/images/phone-placeholder.png'}
              alt={phone.model || '중고폰 이미지'}
              width={1200}
              height={1200}
              className="object-contain max-w-full max-h-full"
            />
            
            {/* 라이트박스 네비게이션 */}
            {phone.images.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxImageIndex((prev) => 
                    prev === 0 ? phone.images!.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => setLightboxImageIndex((prev) => 
                    prev === phone.images!.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
                
                {/* 이미지 카운터 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                  {lightboxImageIndex + 1} / {phone.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 거래완료 모달 */}
      {showTradeCompleteModal && (
        <TradeCompleteModal
          isOpen={showTradeCompleteModal}
          onClose={() => setShowTradeCompleteModal(false)}
          phoneId={parseInt(phoneId)}
          phoneModel={phone.model}
          isSeller={user?.id === phone.seller?.id}
          onComplete={() => {
            fetchPhoneDetail();
            setShowTradeCompleteModal(false);
            toast({
              title: '거래완료',
              description: '거래가 완료되었습니다. 후기를 작성해주세요!',
            });
          }}
        />
      )}

      {/* 후기 작성 모달 */}
      {showTradeReviewModal && reviewTarget && phone && (
        <TradeReviewModal
          isOpen={showTradeReviewModal}
          onClose={() => {
            setShowTradeReviewModal(false);
            setReviewTarget(null);
          }}
          transactionId={phone.transaction_id || 0} // 트랜잭션 ID가 필요함
          isSeller={reviewTarget === 'buyer'} // 판매자가 구매자를 평가하는 경우
          partnerName={reviewTarget === 'buyer' ? (phone.buyer?.nickname || '구매자') : (phone.seller?.username || phone.seller?.nickname || '판매자')}
          phoneModel={phone.model}
          onReviewComplete={() => {
            fetchPhoneDetail();
            setShowTradeReviewModal(false);
            setReviewTarget(null);
            toast({
              title: '후기 작성 완료',
              description: '거래 후기가 등록되었습니다.',
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
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
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
                          <span className="font-semibold">{offer.buyer?.username || '익명'}</span>
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
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            // 수락 처리
                            if (confirm(`${offer.offered_price.toLocaleString()}원에 판매하시겠습니까?`)) {
                              // API 호출 로직
                            }
                          }}
                        >
                          수락
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // 거절 처리
                            if (confirm('이 제안을 거절하시겠습니까?')) {
                              // API 호출 로직
                            }
                          }}
                        >
                          거절
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
      </div>
    </div>
  );
}
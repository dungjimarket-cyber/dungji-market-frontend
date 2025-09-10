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
  Check, X, Phone, User, Smartphone, Edit3, Trash2, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UsedPhone, CONDITION_GRADES, BATTERY_STATUS_LABELS } from '@/types/used';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default async function UsedPhoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UsedPhoneDetailClient phoneId={id} />;
}

function UsedPhoneDetailClient({ phoneId }: { phoneId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  
  const [phone, setPhone] = useState<UsedPhone | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [offerCount, setOfferCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
  }, [phoneId]);

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
        setIsFavorite(!isFavorite);
        toast({
          title: isFavorite ? '찜 해제' : '찜 완료',
          description: isFavorite ? '찜 목록에서 제거되었습니다.' : '찜 목록에 추가되었습니다.',
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // 가격 포맷팅
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    return parseInt(numbers).toLocaleString();
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    if (parseInt(value) <= 9900000) { // 990만원 제한
      setOfferAmount(value);
    }
  };

  // 가격 제안 확인
  const handleOfferConfirm = () => {
    const amount = parseInt(offerAmount);
    
    if (!amount || amount < (phone?.min_offer_price || 0)) {
      toast({
        title: '제안 금액 확인',
        description: `최소 제안 금액은 ${phone?.min_offer_price?.toLocaleString()}원입니다.`,
        variant: 'destructive',
      });
      return;
    }

    if (amount > 9900000) {
      toast({
        title: '제안 금액 초과',
        description: '최대 제안 가능 금액은 990만원입니다.',
        variant: 'destructive',
      });
      return;
    }

    if (offerCount >= 5) {
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

    try {
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
          amount,
          message: offerMessage,
        }),
      });

      if (response.ok) {
        toast({
          title: '제안 완료',
          description: '판매자에게 가격 제안이 전달되었습니다.',
        });
        setShowOfferModal(false);
        setShowConfirmModal(false);
        setOfferAmount('');
        setOfferMessage('');
        setSelectedMessages([]);
        setOfferCount(prev => prev + 1);
      } else {
        const error = await response.json();
        if (error.message?.includes('5회')) {
          toast({
            title: '제안 횟수 초과',
            description: '해당 상품에 최대 5회까지만 제안 가능합니다.',
            variant: 'destructive',
          });
        } else {
          throw new Error(error.message || '제안 실패');
        }
      }
    } catch (error) {
      console.error('Failed to submit offer:', error);
      toast({
        title: '제안 실패',
        description: error instanceof Error ? error.message : '가격 제안 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setShowConfirmModal(false);
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-50">
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
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 이미지 섹션 */}
          <div>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
              {phone.status === 'reserved' && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded font-medium">
                  예약중
                </div>
              )}
              {phone.status === 'sold' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">판매완료</span>
                </div>
              )}
            </div>

            {/* 썸네일 */}
            {phone.images && phone.images.length > 1 && (
              <div className="mt-4 grid grid-cols-6 gap-2">
                {phone.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square rounded overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={img.imageUrl}
                      alt={`${phone.model} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 정보 섹션 */}
          <div>
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
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
                <p className="text-3xl font-bold text-gray-900">
                  {phone.price.toLocaleString()}원
                </p>
                {phone.accept_offers && phone.min_offer_price && (
                  <p className="text-sm text-blue-600 mt-1">
                    가격 제안 가능 (최소 {phone.min_offer_price.toLocaleString()}원)
                  </p>
                )}
              </div>

              {/* 상태 정보 */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-sm text-gray-600 mb-1">상태</p>
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

              {/* 위치 및 조회수 */}
              <div className="py-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{phone.region_name || '지역 미정'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {phone.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {phone.favorite_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {phone.created_at ? formatDistanceToNow(new Date(phone.created_at), { addSuffix: true, locale: ko }) : '-'}
                  </span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleFavorite}
                  className="flex items-center gap-2"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  찜하기
                </Button>
                {phone.accept_offers ? (
                  <Button
                    onClick={() => setShowOfferModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    가격 제안하기
                  </Button>
                ) : (
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    채팅하기
                  </Button>
                )}
              </div>
            </div>

            {/* 판매자 정보 */}
            <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
              <h2 className="font-semibold mb-4">판매자 정보</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">{phone.seller?.name || '판매자'}</p>
                    <p className="text-sm text-gray-600">
                      거래 {phone.seller?.tradeStats?.soldCount || 0}회
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* 판매자 본인인 경우 수정/삭제 버튼 표시 */}
                  {user?.id === phone.seller?.id && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/used/${phoneId}/edit`)}
                      >
                        수정하기
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowDeleteModal(true)}
                        className="text-red-600 hover:text-red-700"
                      >
                        삭제하기
                      </Button>
                    </>
                  )}
                  {user?.id !== phone.seller?.id && (
                    <Button variant="outline" size="sm">
                      프로필 보기
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 거래 가능 지역 - 다중 지역 표시 */}
              {phone.regions && phone.regions.length > 0 ? (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 mb-2">거래 가능 지역</p>
                  <div className="space-y-1">
                    {phone.regions.map((region, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{region.full_name || region.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* 단일 지역 표시 (기존 데이터 호환) */
                phone.region_name && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600 mb-2">거래 가능 지역</p>
                    <div className="text-sm">
                      <span className="font-medium">{phone.region_name}</span>
                    </div>
                  </div>
                )
              )}
              
              {/* 거래 요청사항 */}
              {phone.meeting_place && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 mb-1">거래 요청사항</p>
                  <p className="font-medium whitespace-pre-wrap">{phone.meeting_place}</p>
                </div>
              )}
            </div>

            {/* 상태 및 설명 */}
            {phone.condition_description && (
              <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
                <h2 className="font-semibold mb-4">상태 및 설명</h2>
                <p className="text-gray-800 whitespace-pre-wrap">{phone.condition_description}</p>
              </div>
            )}

            {/* 주의사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">안전거래 안내</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>직거래 시 안전한 장소에서 만나세요</li>
                    <li>제품 상태를 꼼꼼히 확인 후 거래하세요</li>
                    <li>선입금은 피하고 직접 확인 후 결제하세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 가격 제안 모달 - 컴팩트 버전 */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">가격 제안하기</h3>
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 rounded-full">
                <span className="text-xs font-medium text-blue-700">
                  제안 {offerCount}/5회
                </span>
              </div>
            </div>
            
            {offerCount >= 5 && (
              <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                <p className="text-xs text-red-700">
                  제안 횟수를 모두 사용했습니다.
                </p>
              </div>
            )}
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                제안 금액 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-1">
                  (최소: {phone.min_offer_price?.toLocaleString()}원)
                </span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="0"
                  value={formatCurrency(offerAmount)}
                  onChange={handlePriceChange}
                  className="pr-12 h-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  메시지 선택 
                  <span className="text-xs text-gray-500 ml-1">
                    (최대 5개)
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
                <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">선택된 메시지 ({selectedMessages.length}/5)</p>
                  <div className="space-y-1">
                    {selectedMessages.map((msg, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs text-blue-900">• {msg}</span>
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
                              ? 'bg-blue-100 text-blue-700'
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

            <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3">
              <p className="text-xs text-amber-700">
                <span className="font-medium">⚠️ 주의</span>
                <span className="ml-1">견적 제안은 구매 약속입니다.</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOfferModal(false);
                  setOfferAmount('');
                  setSelectedMessages([]);
                }}
                size="sm"
                className="flex-1"
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
                disabled={!offerAmount || selectedMessages.length === 0 || offerCount >= 5}
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">가격 제안 확인</h3>
              <p className="text-2xl font-bold text-blue-600 mb-2">
                {parseInt(offerAmount).toLocaleString()}원
              </p>
              <p className="text-sm text-gray-600">
                이 금액으로 제안하시겠습니까?
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
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-700">
                제안 후에는 취소할 수 없으며, 판매자가 수락 시 구매해야 합니다.
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
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                예, 제안합니다
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
  Check, X, Phone, User
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

  // 상품 정보 조회
  useEffect(() => {
    fetchPhoneDetail();
  }, [phoneId]);

  const fetchPhoneDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const response = await fetch(`${apiUrl}/api/used/phones/${phoneId}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setPhone(data);
      setIsFavorite(data.isFavorite || false);
      
      // 조회수 증가 (비동기)
      fetch(`/api/used/phones/${phoneId}/view`, { method: 'POST' });
      
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const response = await fetch(`${apiUrl}/api/used/phones/${phoneId}/favorite/`, {
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
    if (!amount || amount < (phone?.minOfferPrice || 0)) {
      toast({
        title: '제안 금액 확인',
        description: `최소 제안 금액은 ${phone?.minOfferPrice?.toLocaleString()}원입니다.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const response = await fetch(`${apiUrl}/api/used/phones/${phoneId}/offer/`, {
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
        setOfferAmount('');
        setOfferMessage('');
      }
    } catch (error) {
      console.error('Failed to submit offer:', error);
      toast({
        title: '제안 실패',
        description: '가격 제안 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
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
              {phone.images && phone.images.length > 0 ? (
                <>
                  <Image
                    src={phone.images[currentImageIndex].imageUrl}
                    alt={phone.model}
                    fill
                    className="object-contain"
                    priority
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
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>이미지 없음</p>
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
              <h1 className="text-2xl font-bold mb-2">{phone.model}</h1>
              
              {/* 가격 */}
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">
                  {phone.price.toLocaleString()}원
                </p>
                {phone.acceptOffers && phone.minOfferPrice && (
                  <p className="text-sm text-blue-600 mt-1">
                    가격 제안 가능 (최소 {phone.minOfferPrice.toLocaleString()}원)
                  </p>
                )}
              </div>

              {/* 상태 정보 */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-sm text-gray-600 mb-1">상태</p>
                  <p className="font-medium">
                    {phone.conditionGrade && CONDITION_GRADES[phone.conditionGrade]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">용량</p>
                  <p className="font-medium">{phone.storage}GB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">색상</p>
                  <p className="font-medium">{phone.color || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">배터리</p>
                  <p className="font-medium">
                    {phone.batteryStatus && BATTERY_STATUS_LABELS[phone.batteryStatus]}
                  </p>
                </div>
              </div>

              {/* 구성품 */}
              <div className="py-4 border-b">
                <p className="text-sm text-gray-600 mb-2">구성품</p>
                <div className="flex gap-3">
                  <span className={`px-2 py-1 rounded text-sm ${phone.hasBox ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                    박스
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${phone.hasCharger ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                    충전기
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${phone.hasEarphones ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                    이어폰
                  </span>
                </div>
              </div>

              {/* 위치 및 조회수 */}
              <div className="py-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{phone.sigungu || phone.sido || '지역 미정'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {phone.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {phone.favoriteCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDistanceToNow(new Date(phone.createdAt), { addSuffix: true, locale: ko })}
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
                {phone.acceptOffers ? (
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
                <Button variant="outline" size="sm">
                  프로필 보기
                </Button>
              </div>
              
              {phone.meetingPlace && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 mb-1">거래 희망 장소</p>
                  <p className="font-medium">{phone.meetingPlace}</p>
                </div>
              )}
            </div>

            {/* 상품 설명 */}
            {(phone.description || phone.conditionDescription) && (
              <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
                <h2 className="font-semibold mb-4">상품 설명</h2>
                {phone.conditionDescription && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">상태 설명</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{phone.conditionDescription}</p>
                  </div>
                )}
                {phone.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">추가 설명</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{phone.description}</p>
                  </div>
                )}
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

      {/* 가격 제안 모달 */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">가격 제안하기</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">제안 금액</label>
              <Input
                type="number"
                placeholder={`최소 ${phone.minOfferPrice?.toLocaleString()}원`}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">메시지 (선택)</label>
              <Textarea
                placeholder="판매자에게 전달할 메시지를 입력하세요"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowOfferModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSubmitOffer}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                제안하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
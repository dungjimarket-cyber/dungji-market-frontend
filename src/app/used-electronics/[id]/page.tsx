/**
 * 전자제품/가전 상세 페이지
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
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUsedPhoneProfileCheck } from '@/hooks/useUsedPhoneProfileCheck';
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
  const { isProfileComplete: hasUsedPhoneProfile } = useUsedPhoneProfileCheck();

  const [electronics, setElectronics] = useState<UsedElectronics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
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
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');

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
    fetchElectronicsDetail();
    if (isAuthenticated) {
      fetchMyOffer();
    }
  }, [electronicsId, isAuthenticated]);

  // 모달 스크롤 방지
  useEffect(() => {
    if (showOfferModal || showDeleteModal || showOffersModal || showAcceptModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showOfferModal, showDeleteModal, showOffersModal, showAcceptModal]);

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
    } catch (error) {
      console.error('Failed to fetch my offer:', error);
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

  // 가격 제안
  const handleOffer = () => {
    if (!isAuthenticated) {
      toast.error('가격 제안은 로그인 후 이용 가능합니다.');
      router.push('/login');
      return;
    }

    if (!hasUsedPhoneProfile) {
      toast.error('프로필을 완성해주세요.');
      router.push('/mypage/profile');
      return;
    }

    // 기존 제안이 있으면 값을 설정
    if (myOffer) {
      setOfferAmount(myOffer.offer_price?.toLocaleString() || '');
      setOfferMessage(myOffer.message || '');
    }
    setShowOfferModal(true);
  };

  const handleOfferSubmit = async () => {
    const amount = parseInt(offerAmount.replace(/,/g, ''));

    if (!amount) {
      toast.error('제안 금액을 입력해주세요.');
      return;
    }

    if (electronics?.min_offer_price && amount < electronics.min_offer_price) {
      toast.error(`최소 제안 가격은 ${electronics.min_offer_price?.toLocaleString() || electronics.min_offer_price}원입니다.`);
      return;
    }

    try {
      const combinedMessage = [...selectedMessages, offerMessage].filter(Boolean).join(' ');

      await electronicsApi.createOffer(Number(electronicsId), {
        offer_price: amount,
        message: combinedMessage
      });

      toast.success('가격 제안이 전송되었습니다.');
      setShowOfferModal(false);
      setOfferAmount('');
      setOfferMessage('');
      setSelectedMessages([]);
      fetchMyOffer();
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
      if (electronics.offer_count === 0 && latestOfferCount > 0) {
        setDeleting(false);
        toast.error('방금 새로운 제안이 도착했습니다. 제안이 있는 상품은 삭제 시 6시간 패널티가 적용됩니다.');
        // 상품 정보 새로고침
        await fetchElectronicsDetail();
        return;
      }

      await electronicsApi.deleteElectronics(Number(electronicsId));

      // TODO: 백엔드에서 패널티 정보 반환 시 처리
      toast.success('상품이 삭제되었습니다.');
      router.push('/used-electronics');
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

  // 거래 완료
  const handleCompleteTransaction = async () => {
    try {
      await electronicsApi.completeTransaction(Number(electronicsId));
      toast.success('거래가 완료되었습니다.');
      fetchElectronicsDetail();
    } catch (error) {
      console.error('Failed to complete transaction:', error);
      toast.error('거래 완료 처리에 실패했습니다.');
    }
  };

  // 거래 취소
  const handleCancelTrade = async () => {
    if (!cancelReason) {
      toast.error('취소 사유를 선택해주세요.');
      return;
    }

    if (cancelReason === 'other' && !customCancelReason.trim()) {
      toast.error('취소 사유를 입력해주세요.');
      return;
    }

    try {
      await electronicsApi.cancelTrade(Number(electronicsId), {
        reason: cancelReason,
        custom_reason: cancelReason === 'other' ? customCancelReason : undefined,
      });
      toast.success('거래가 취소되었습니다.');
      setShowCancelModal(false);
      fetchElectronicsDetail();
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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <button className="p-2">
                <Share2 className="w-5 h-5" />
              </button>
              {electronics.is_mine && (
                <Link href={`/used-electronics/${electronicsId}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-4 h-4 mr-1" />
                    수정
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* 이미지 갤러리 */}
        <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
          {electronics.images && electronics.images.length > 0 ? (
            <>
              <Image
                src={electronics.images[currentImageIndex]?.imageUrl || '/images/no-image.png'}
                alt={electronics.model_name}
                fill
                className="object-contain cursor-pointer"
                onClick={() => {
                  setLightboxImageIndex(currentImageIndex);
                  setShowImageLightbox(true);
                }}
              />

              {/* 이미지 네비게이션 */}
              {electronics.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* 인디케이터 */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {electronics.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* 상태 뱃지 */}
              <div className="absolute top-4 left-4">
                <Badge variant={electronics.status === 'active' ? 'default' : 'secondary'}>
                  {ELECTRONICS_STATUS[electronics.status]}
                </Badge>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-20 h-20 text-gray-400" />
            </div>
          )}
        </div>

        {/* 썸네일 */}
        {electronics.images && electronics.images.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {electronics.images.map((image, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`relative w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0 ${
                  idx === currentImageIndex ? 'border-primary' : 'border-gray-200'
                }`}
              >
                <Image
                  src={image.imageUrl || '/images/no-image.png'}
                  alt={`${electronics.model_name} ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* 기본 정보 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            {/* 카테고리 */}
            <div className="text-sm text-gray-500 mb-2">
              {ELECTRONICS_SUBCATEGORIES[electronics.subcategory as keyof typeof ELECTRONICS_SUBCATEGORIES]}
            </div>

            {/* 제품명 */}
            <h1 className="text-xl font-bold mb-3">
              {electronics.brand} {electronics.model_name}
            </h1>

            {/* 가격 정보 - 휴대폰과 동일한 스타일 */}
            <div className="mb-4">
              {electronics.status === 'sold' ? (
                // 거래완료 상품
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-700">
                    {electronics.price?.toLocaleString() || electronics.price}원
                  </span>
                  <Badge variant="secondary">거래완료</Badge>
                </div>
              ) : (
                // 판매중 상품
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm text-gray-500">즉시구매</span>
                    <span className="text-2xl font-bold">
                      {electronics.price?.toLocaleString() || electronics.price}원
                    </span>
                  </div>
                  {electronics.accept_offers && electronics.min_offer_price && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-dungji-primary-900">
                        💰 가격 제안 가능
                      </p>
                      <p className="text-xs text-dungji-primary-700 mt-1">
                        최소 제안가: {electronics.min_offer_price?.toLocaleString() || electronics.min_offer_price}원부터
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 상태 정보 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  상태: {electronics.is_unused ? '미개봉' : CONDITION_GRADES[electronics.condition_grade as keyof typeof CONDITION_GRADES]?.split(' ')[0]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  구매시기: {PURCHASE_PERIODS[electronics.purchase_period as keyof typeof PURCHASE_PERIODS]}
                </span>
              </div>
              {electronics.usage_period && (
                <div className="flex items-center gap-2 col-span-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    사용기간: {electronics.usage_period}
                  </span>
                </div>
              )}
            </div>

            {/* 구성품 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {electronics.has_box && (
                <Badge variant="secondary">
                  <Box className="w-3 h-3 mr-1" />
                  박스
                </Badge>
              )}
              {electronics.has_charger && (
                <Badge variant="secondary">
                  <Settings className="w-3 h-3 mr-1" />
                  충전기
                </Badge>
              )}
              {electronics.has_manual && (
                <Badge variant="secondary">
                  <FileCheck className="w-3 h-3 mr-1" />
                  설명서
                </Badge>
              )}
              {electronics.other_accessories && (
                <Badge variant="secondary">
                  <Package className="w-3 h-3 mr-1" />
                  {electronics.other_accessories}
                </Badge>
              )}
            </div>

            {/* 추가 정보 */}
            {(electronics.has_receipt || electronics.has_warranty_card) && (
              <div className="flex gap-2 mb-3">
                {electronics.has_receipt && (
                  <Badge variant="outline" className="text-green-600">
                    영수증 보유
                  </Badge>
                )}
                {electronics.has_warranty_card && (
                  <Badge variant="outline" className="text-green-600">
                    보증서 보유
                  </Badge>
                )}
              </div>
            )}

            {/* 조회수, 찜, 제안 */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {electronics.view_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {electronics.favorite_count}
              </span>
              {electronics.offer_count > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  제안 {electronics.offer_count}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDistanceToNow(new Date(electronics.created_at), {
                  addSuffix: true,
                  locale: ko
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 상품 설명 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">상품 설명</h2>
            <p className="whitespace-pre-wrap text-gray-700">
              {electronics.description}
            </p>
          </CardContent>
        </Card>

        {/* 거래 희망 지역 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">거래 희망 지역</h2>
            {electronics.regions && electronics.regions.length > 0 ? (
              <div className="space-y-2">
                {electronics.regions.map((region) => (
                  <div key={region.code} className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{region.name}</span>
                  </div>
                ))}
                {electronics.meeting_place && (
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">거래 시 요청사항</p>
                    <p className="text-sm mt-1">{electronics.meeting_place}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">지역 정보가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 판매자 정보 */}
        {electronics.seller_info && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">판매자 정보</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">{electronics.seller_info.nickname}</p>
                    <p className="text-sm text-gray-500">
                      판매 {electronics.seller_info.sell_count || 0}건
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 내가 한 제안 표시 */}
        {myOffer && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">내가 제안한 금액</p>
                  <p className="text-lg font-bold text-blue-900">
                    {myOffer.offer_price?.toLocaleString() || myOffer.offer_price}원
                  </p>
                  {myOffer.message && (
                    <p className="text-sm text-gray-600 mt-1">{myOffer.message}</p>
                  )}
                </div>
                <Badge variant={
                  myOffer.status === 'accepted' ? 'default' :
                  myOffer.status === 'rejected' ? 'destructive' :
                  'secondary'
                }>
                  {myOffer.status === 'pending' && '대기중'}
                  {myOffer.status === 'accepted' && '수락됨'}
                  {myOffer.status === 'rejected' && '거절됨'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 거래중/거래완료 시 거래 당사자에게 마이페이지 안내 */}
        {(electronics.status === 'trading' || electronics.status === 'sold') &&
         user && (electronics.is_mine || electronics.buyer_id === Number(user.id)) && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">
                    {electronics.status === 'trading' ? '거래 진행 중' : '거래 완료됨'}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    마이페이지에서 거래 상세 정보를 확인하세요
                  </p>
                </div>
                <Link href="/used/mypage?tab=trading">
                  <Button variant="outline" size="sm">
                    마이페이지로 이동
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 받은 제안 목록 (판매자만) */}
        {electronics.is_mine && electronics.offer_count > 0 && (
          <Card className="mb-20 md:mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">받은 제안</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchOffers();
                    setShowOffersModal(true);
                  }}
                >
                  전체 보기 ({electronics.offer_count})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      {!electronics.is_mine && electronics.status === 'active' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30">
          <div className="container mx-auto max-w-4xl flex gap-3">
            <button
              onClick={handleFavorite}
              className="p-3 border rounded-lg"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>

            {electronics.accept_offers && (
              <Button
                variant={myOffer ? "default" : "outline"}
                className="flex-1"
                onClick={handleOffer}
                disabled={electronics.status !== 'active'}
              >
                {myOffer ? '제안 수정하기' : '가격 제안하기'}
              </Button>
            )}

            <Button className="flex-1">
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              문의하기
            </Button>
          </div>
        </div>
      )}

      {/* 판매자용 하단 버튼 */}
      {electronics.is_mine && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30">
          <div className="container mx-auto max-w-4xl flex gap-3">
            {electronics.status === 'active' && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </Button>
            )}
            {electronics.status === 'trading' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelModal(true)}
                >
                  거래 취소
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCompleteTransaction}
                >
                  거래 완료
                </Button>
              </>
            )}
            {electronics.status === 'sold' && (
              <Link href={`/review/create?type=electronics&id=${electronicsId}&role=seller`} className="flex-1">
                <Button className="w-full">
                  후기 작성하기
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 구매자용 하단 버튼 */}
      {user && electronics.buyer_id === Number(user.id) && !electronics.is_mine && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30">
          <div className="container mx-auto max-w-4xl flex gap-3">
            {electronics.status === 'trading' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelModal(true)}
                >
                  거래 취소
                </Button>
                <Button
                  className="flex-1"
                  onClick={async () => {
                    try {
                      await electronicsApi.buyerCompleteTransaction(Number(electronicsId));
                      toast.success('구매 확정되었습니다.');
                      fetchElectronicsDetail();
                    } catch (error) {
                      toast.error('구매 확정에 실패했습니다.');
                    }
                  }}
                >
                  구매 확정
                </Button>
              </>
            )}
            {electronics.status === 'sold' && (
              <Link href={`/review/create?type=electronics&id=${electronicsId}&role=buyer`} className="flex-1">
                <Button className="w-full">
                  후기 작성하기
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 가격 제안 모달 */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-lg md:mx-4 rounded-t-2xl md:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{myOffer ? '제안 수정하기' : '가격 제안하기'}</h3>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">제안 금액</label>
              <div className="relative">
                <Input
                  type="text"
                  value={offerAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setOfferAmount(value ? Number(value)?.toLocaleString() || value : '');
                  }}
                  placeholder="제안 금액을 입력하세요"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  원
                </span>
              </div>
              {electronics.min_offer_price && (
                <p className="text-xs text-gray-500 mt-1">
                  최소 제안 가격: {electronics.min_offer_price.toLocaleString()}원
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">메시지 템플릿</label>
              <div className="space-y-2">
                {Object.entries(messageTemplates).map(([category, messages]) => (
                  <div key={category}>
                    <p className="text-xs text-gray-500 mb-1">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {messages.map((msg) => (
                        <button
                          key={msg}
                          onClick={() => {
                            if (selectedMessages.includes(msg)) {
                              setSelectedMessages(selectedMessages.filter(m => m !== msg));
                            } else {
                              setSelectedMessages([...selectedMessages, msg]);
                            }
                          }}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            selectedMessages.includes(msg)
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {msg}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">추가 메시지 (선택)</label>
              <Textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="추가로 전달하고 싶은 메시지를 입력하세요"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {offerMessage.length}/200
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowOfferModal(false);
                  setOfferAmount('');
                  setOfferMessage('');
                  setSelectedMessages([]);
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleOfferSubmit}
              >
                제안하기
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
                  <Card key={offer.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {typeof offer.buyer === 'object' ? offer.buyer.nickname : '구매자'}
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {offer.offer_price.toLocaleString()}원
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
                    </CardContent>
                  </Card>
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
                  ⚠️ 제안 {electronics.offer_count}개 있음
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
                  <SelectItem value="buyer_no_response">구매자 연락 두절</SelectItem>
                  <SelectItem value="seller_no_response">판매자 연락 두절</SelectItem>
                  <SelectItem value="changed_mind">구매 의사 변경</SelectItem>
                  <SelectItem value="found_better_price">더 나은 조건 발견</SelectItem>
                  <SelectItem value="product_issue">상품 문제 발견</SelectItem>
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
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setShowImageLightbox(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowImageLightbox(false);
            }}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative w-full h-full">
            <Image
              src={electronics.images[lightboxImageIndex]?.imageUrl || '/images/no-image.png'}
              alt={electronics.model_name}
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {electronics.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImageIndex(prev =>
                      prev > 0 ? prev - 1 : electronics.images!.length - 1
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImageIndex(prev =>
                      prev < electronics.images!.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 rounded-full"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
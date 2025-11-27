'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Smartphone,
  ChevronRight,
  Settings,
  User,
  FileText,
  MessageCircle,
  Camera,
  Edit2,
  CheckCircle,
  Loader2
} from 'lucide-react';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import PenaltyModal from '@/components/penalty/PenaltyModal';
import { getSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';
import { CustomPenalty } from '@/lib/api/custom/penaltyApi';
import { checkCanCreateCustomDeal } from '@/lib/api/custom/createDealCheck';
import {
  fetchMyExpertProfile,
  uploadExpertProfileImage,
  updateExpertProfile,
  ExpertProfile
} from '@/lib/api/expertService';
import { tokenUtils } from '@/lib/tokenUtils';

export default function DashboardClient() {
  const router = useRouter();
  const { user } = useAuth();

  const isSeller = user?.role === 'seller';
  const isExpert = user?.role === 'expert';

  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [customPenaltyInfo, setCustomPenaltyInfo] = useState<CustomPenalty | null>(null);
  const [showCustomPenaltyModal, setShowCustomPenaltyModal] = useState(false);
  const [showCustomProfileModal, setShowCustomProfileModal] = useState(false);
  const [customMissingFields, setCustomMissingFields] = useState<string[]>([]);

  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(user?.image || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tagline, setTagline] = useState('');
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [isSavingTagline, setIsSavingTagline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSellerProfileData = async () => {
    if (!isSeller) return;
    try {
      const profile = await getSellerProfile();
      setSellerProfile(profile);
    } catch (error) {
      console.error('판매자 프로필 조회 오류:', error);
    }
  };

  useEffect(() => {
    fetchSellerProfileData();
  }, [isSeller]);

  useEffect(() => {
    const loadExpertProfile = async () => {
      if (!isExpert) return;
      try {
        const token = await tokenUtils.getAccessToken();
        if (!token) return;
        const profile = await fetchMyExpertProfile(token);
        if (profile) {
          setExpertProfile(profile);
          setTagline(profile.tagline || '');
          setCurrentProfileImage(profile.profile_image || user?.image || null);
        }
      } catch (error) {
        console.error('전문가 프로필 로드 오류:', error);
      }
    };
    loadExpertProfile();
  }, [isExpert, user?.image]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지는 5MB 이하만 업로드할 수 있습니다.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    try {
      setIsUploadingImage(true);
      const token = await tokenUtils.getAccessToken();
      if (!token) return;
      const result = await uploadExpertProfileImage(file, token);
      if (result.success && result.image_url) {
        const nextImage = result.image_url || currentProfileImage || '';
        setCurrentProfileImage(nextImage);
        setExpertProfile((prev) => (prev ? { ...prev, profile_image: nextImage } : prev));
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveTagline = async () => {
    if (!isExpert) return;
    if (!tagline.trim()) {
      alert('전문가 노출을 위해 한줄소개를 입력해주세요.');
      return;
    }
    try {
      setIsSavingTagline(true);
      const token = await tokenUtils.getAccessToken();
      if (!token) return;
      const result = await updateExpertProfile({ tagline }, token);
      if (result.success) {
        setExpertProfile((prev) => (prev ? { ...prev, tagline } : prev));
        setIsEditingTagline(false);
      }
    } catch (error) {
      console.error('한줄소개 저장 오류:', error);
    } finally {
      setIsSavingTagline(false);
    }
  };

  const handleServiceClick = (serviceId: string, path: string) => {
    if (isSeller && serviceId === 'groupbuy') {
      if (!sellerProfile?.sellerCategory) {
        setMissingFields(['판매 유형']);
        setShowProfileModal(true);
        return;
      }
    }
    router.push(path);
  };

  const handleQuickMenuBidHistory = () => {
    if (!sellerProfile?.sellerCategory) {
      setMissingFields(['판매 유형']);
      setShowProfileModal(true);
      return;
    }
    router.push('/mypage/seller/bids');
  };

  const handleQuickMenuCreateDeal = async () => {
    const result = await checkCanCreateCustomDeal(user);

    if (!result.canProceed) {
      if (result.penaltyInfo) {
        setCustomPenaltyInfo(result.penaltyInfo);
        setShowCustomPenaltyModal(true);
        return;
      }
      if (result.duplicateMessage) {
        alert(result.duplicateMessage);
        return;
      }
      if (result.missingFields) {
        setCustomMissingFields(result.missingFields);
        setShowCustomProfileModal(true);
        return;
      }
    }
    router.push('/custom-deals/create');
  };

  const services = [
    {
      id: 'custom',
      title: '커공/이벤트 관리',
      description: '',
      icon: Sparkles,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      path: '/custom-deals/my'
    },
    {
      id: 'consultation',
      title: '상담내역 관리',
      description: '',
      icon: FileText,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      path: '/mypage/consultations'
    },
    {
      id: 'used',
      title: '중고거래 내역',
      description: '',
      icon: Smartphone,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      path: '/used/mypage'
    }
  ];

  const displayName = isExpert
    ? expertProfile?.representative_name || user?.nickname || user?.username || '이름 없음'
    : user?.nickname || user?.username || '이름 없음';
  const displayRegion = isExpert
    ? (expertProfile?.regions || []).map((r) => r.name).join(', ') || user?.address_region?.full_name || '지역 미입력'
    : user?.address_region?.full_name || '지역 미입력';
  const roleBadge = isSeller ? '판매자' : isExpert ? '전문가' : '구매자';

  return (
    <div className="container mx-auto px-3 pt-3 pb-0 bg-white">
      {/* 프로필 섹션 */}
      <Card className="mb-2.5 border-2 border-gray-200">
        <CardContent className="py-4">
          <div className="flex gap-4 items-start">
            {/* 프로필 이미지 */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
                {isUploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : currentProfileImage ? (
                  <img src={currentProfileImage} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              {isExpert && (
                <>
                  <button
                    onClick={handleImageClick}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs shadow hover:bg-blue-600"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-semibold text-gray-900 truncate">{displayName}</p>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700 border">{roleBadge}</span>
                {isExpert && expertProfile?.status === 'verified' && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-xs text-green-700 border border-green-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> 인증됨
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">주요활동지역</p>
              <p className="text-sm font-medium text-gray-800 truncate">{displayRegion}</p>

              {isExpert && (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">한줄소개</p>
                    {!expertProfile?.tagline && (
                      <span className="text-[11px] text-red-600">입력 필요</span>
                    )}
                  </div>
                  {isEditingTagline ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-xs"
                        maxLength={50}
                        placeholder="전문가 한줄소개를 입력해주세요"
                      />
                      <Button size="sm" className="text-xs" onClick={handleSaveTagline} disabled={isSavingTagline}>
                        {isSavingTagline ? '저장중' : '저장'}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => setIsEditingTagline(false)}>
                        취소
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="truncate">
                        {expertProfile?.tagline || '전문가 노출을 위해 한줄소개를 입력해주세요'}
                      </span>
                      <button
                        onClick={() => setIsEditingTagline(true)}
                        className="text-gray-400 hover:text-gray-600 transition"
                        aria-label="한줄소개 수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 설정/관리 버튼 */}
            <div className="flex flex-col items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/mypage/settings')}
                className="flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="text-xs">설정</span>
              </Button>
              {isExpert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/mypage/expert/manage')}
                  className="text-xs"
                >
                  상담 관리
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 서비스 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-2.5">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card
              key={service.id}
              className={`${service.color} border hover:shadow-md transition-all cursor-pointer`}
              onClick={() => handleServiceClick(service.id, service.path)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 rounded-lg bg-white shadow-sm">
                    <Icon className={`w-4 h-4 ${service.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{service.title}</h3>
                    <p className="text-xs text-gray-500">{service.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-between hover:bg-white/80 text-xs py-1.5 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleServiceClick(service.id, service.path);
                  }}
                >
                  자세히 보기
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 빠른 메뉴 */}
      <Card className="border-gray-200 mb-2.5">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">빠른 메뉴</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-auto flex items-center gap-1.5 px-3 py-2"
              onClick={handleQuickMenuCreateDeal}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs">커공/이벤트 등록</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex items-center gap-1.5 px-3 py-2"
              onClick={() => router.push('/local-businesses')}
            >
              <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs">상담신청</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex items-center gap-1.5 px-3 py-2"
              onClick={() => router.push('/used/create')}
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs">중고 판매하기</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 하단 배너 */}
      <div className="mb-0 flex justify-center">
        <div className="relative w-full md:w-[70%] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <Image
            src="https://dungjimarket.s3.ap-northeast-2.amazonaws.com/banners/4e9bc98db30c4100878e3f669820130d_20250924083943.png"
            alt="둥지마켓 배너"
            width={1200}
            height={300}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      </div>

      {/* 모달들 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
        onUpdateProfile={async () => {
          setShowProfileModal(false);
          const handleFocus = () => {
            fetchSellerProfileData();
            window.removeEventListener('focus', handleFocus);
          };
          window.addEventListener('focus', handleFocus);
          router.push('/mypage/seller/settings');
        }}
      />

      <PenaltyModal
        isOpen={showCustomPenaltyModal}
        onClose={() => setShowCustomPenaltyModal(false)}
        penaltyInfo={customPenaltyInfo}
        userRole="buyer"
      />

      <ProfileCheckModal
        isOpen={showCustomProfileModal}
        onClose={() => setShowCustomProfileModal(false)}
        missingFields={customMissingFields}
        onUpdateProfile={() => {
          setShowCustomProfileModal(false);
          router.push('/mypage');
        }}
      />
    </div>
  );
}

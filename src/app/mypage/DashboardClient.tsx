'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Sparkles,
  Smartphone,
  ChevronRight,
  Settings,
  User
} from 'lucide-react';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import { getSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';

export default function DashboardClient() {
  const router = useRouter();
  const { user } = useAuth();

  const isSeller = user?.role === 'seller';

  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // 판매자 프로필 조회 함수
  const fetchSellerProfile = async () => {
    if (isSeller) {
      try {
        const profile = await getSellerProfile();
        setSellerProfile(profile);
      } catch (error) {
        console.error('판매자 프로필 조회 오류:', error);
      }
    }
  };

  // 판매자인 경우 프로필 가져오기
  useEffect(() => {
    fetchSellerProfile();
  }, [isSeller]);

  // 서비스 카드 클릭 핸들러
  const handleServiceClick = (serviceId: string, path: string) => {
    // 판매자가 견적 서비스 클릭 시 판매유형 체크
    if (isSeller && serviceId === 'groupbuy') {
      if (!sellerProfile?.sellerCategory) {
        setMissingFields(['판매유형']);
        setShowProfileModal(true);
        return;
      }
    }
    router.push(path);
  };

  // 빠른메뉴 견적내역 버튼 클릭 핸들러
  const handleQuickMenuBidHistory = () => {
    if (!sellerProfile?.sellerCategory) {
      setMissingFields(['판매유형']);
      setShowProfileModal(true);
      return;
    }
    router.push('/mypage/seller/bids');
  };

  const services = [
    {
      id: 'custom',
      title: '커공 특가',
      description: '특별 할인 공동구매',
      icon: Sparkles,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      path: '/custom-deals/my'
    },
    {
      id: 'groupbuy',
      title: '견적 서비스 내역',
      description: '통신상품 공동구매 서비스',
      icon: ShoppingCart,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      path: isSeller ? '/mypage/seller/groupbuy' : '/mypage/groupbuy'
    },
    {
      id: 'used',
      title: '중고거래 내역',
      description: '지역기반 직거래',
      icon: Smartphone,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      path: '/used/mypage'
    }
  ];

  return (
    <div className="container mx-auto px-3 pt-3 pb-0 bg-white">
      {/* 프로필 섹션 */}
      <Card className="mb-2.5 border-2 border-gray-200">
        <CardContent className="py-3">
          <div className="flex gap-4 items-center">
            {/* 둥지마켓 메인 이미지 */}
            <div className="flex-shrink-0">
              <Image
                src="/logos/dungji_logo.jpg"
                alt="둥지마켓"
                width={50}
                height={50}
                className="rounded-lg object-contain"
              />
            </div>
            {/* 사용자 정보 */}
            <div className="flex-1 flex flex-col justify-center space-y-2">
              <div>
                <p className="text-xs text-gray-500">닉네임</p>
                <p className="text-sm font-medium">{user?.nickname || user?.username || '설정 필요'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">주요활동지역</p>
                <p className="text-sm font-medium">
                  {user?.address_region?.full_name || '설정 필요'}
                </p>
              </div>
            </div>
            {/* 설정 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/mypage/settings')}
              className="flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="text-xs">설정</span>
            </Button>
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
                  <div className={`p-1.5 rounded-lg bg-white shadow-sm`}>
                    <Icon className={`w-4 h-4 ${service.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      {service.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* 자세히 보기 버튼 */}
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
              onClick={() => router.push('/custom-deals/create')}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs">공구 등록</span>
            </Button>
            {!isSeller && (
              <Button
                variant="outline"
                className="h-auto flex items-center gap-1.5 px-3 py-2"
                onClick={() => router.push('/group-purchases/create')}
              >
                <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs">견적요청</span>
              </Button>
            )}
            {isSeller && (
              <Button
                variant="outline"
                className="h-auto flex items-center gap-1.5 px-3 py-2"
                onClick={handleQuickMenuBidHistory}
              >
                <User className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs">견적내역</span>
              </Button>
            )}
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

      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
        onUpdateProfile={async () => {
          setShowProfileModal(false);
          // 설정 페이지로 이동하기 전에 새 탭으로 열거나,
          // 설정 완료 후 돌아올 때를 대비해 window focus 이벤트로 프로필 갱신
          const handleFocus = () => {
            fetchSellerProfile();
            window.removeEventListener('focus', handleFocus);
          };
          window.addEventListener('focus', handleFocus);
          router.push('/mypage/seller/settings');
        }}
      />
    </div>
  );
}

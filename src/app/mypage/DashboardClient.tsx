'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Sparkles,
  Smartphone,
  ChevronRight,
  Settings,
  User,
  Bell
} from 'lucide-react';

interface ServiceStats {
  groupbuy: {
    participating: number;
    hosting: number;
  };
  custom: {
    recruiting: number;
    participating: number;
  };
  used: {
    selling: number;
    buying: number;
  };
}

interface NotificationCounts {
  groupbuy: number;
  custom: number;
  used: number;
}

export default function DashboardClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<ServiceStats>({
    groupbuy: { participating: 0, hosting: 0 },
    custom: { recruiting: 0, participating: 0 },
    used: { selling: 0, buying: 0 }
  });
  const [notifications, setNotifications] = useState<NotificationCounts>({
    groupbuy: 0,
    custom: 0,
    used: 0
  });
  const [loading, setLoading] = useState(true);

  const isSeller = user?.role === 'seller';

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // 병렬로 API 호출
      const [groupbuyRes, customSellerRes, customBuyerRes, usedRes] = await Promise.all([
        // 공구견적 참여
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/participating/`, { headers }).catch(() => null),
        // 커스텀 공구 (판매자)
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/?seller=me&status=recruiting`, { headers }).catch(() => null),
        // 커스텀 공구 (구매자)
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-participants/?status=confirmed`, { headers }).catch(() => null),
        // 중고거래
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/used-phones/?status=selling`, { headers }).catch(() => null)
      ]);

      const newStats: ServiceStats = {
        groupbuy: { participating: 0, hosting: 0 },
        custom: { recruiting: 0, participating: 0 },
        used: { selling: 0, buying: 0 }
      };

      // 공구견적 참여
      if (groupbuyRes?.ok) {
        const data = await groupbuyRes.json();
        newStats.groupbuy.participating = data.results?.length || 0;
      }

      // 커스텀 공구 판매
      if (customSellerRes?.ok) {
        const data = await customSellerRes.json();
        newStats.custom.recruiting = data.results?.length || 0;
      }

      // 커스텀 공구 참여
      if (customBuyerRes?.ok) {
        const data = await customBuyerRes.json();
        // 모집중인 공구만 카운트
        const recruitingCount = data.results?.filter((p: any) => {
          const groupbuy = typeof p.custom_groupbuy === 'object' ? p.custom_groupbuy : null;
          return groupbuy && groupbuy.status === 'recruiting';
        }).length || 0;
        newStats.custom.participating = recruitingCount;
      }

      // 중고거래
      if (usedRes?.ok) {
        const data = await usedRes.json();
        newStats.used.selling = data.results?.length || 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // 읽지 않은 알림 조회
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/?is_read=false`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        const unreadNotifications = data.results || [];

        // 서비스별 알림 분류
        const counts = {
          groupbuy: 0,
          custom: 0,
          used: 0
        };

        const customTypes = ['custom_completed', 'custom_code_issued', 'custom_closing_soon'];
        const usedTypes = ['offer_received', 'offer_accepted', 'trade_cancelled', 'trade_completed'];

        unreadNotifications.forEach((notification: any) => {
          const type = notification.notification_type;

          if (customTypes.includes(type)) {
            counts.custom++;
          } else if (usedTypes.includes(type)) {
            counts.used++;
          } else {
            counts.groupbuy++;
          }
        });

        setNotifications(counts);
      }
    } catch (error) {
      console.error('알림 로드 실패:', error);
    }
  };

  const services = [
    {
      id: 'groupbuy',
      title: '공구견적',
      description: '통신상품 공동구매 서비스',
      icon: ShoppingCart,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      stats: [
        { label: '참여중', count: stats.groupbuy.participating },
      ],
      path: isSeller ? '/mypage/seller/groupbuy' : '/mypage/groupbuy'
    },
    {
      id: 'custom',
      title: '커스텀 공구',
      description: '특별 할인 공동구매',
      icon: Sparkles,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      stats: [
        { label: '모집중', count: stats.custom.recruiting },
        { label: '참여중', count: stats.custom.participating },
      ],
      path: '/custom-deals/my'
    },
    {
      id: 'used',
      title: '중고거래',
      description: '지역기반 직거래',
      icon: Smartphone,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      stats: [
        { label: '판매중', count: stats.used.selling },
      ],
      path: '/used/mypage'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 bg-white min-h-screen">
      {/* 프로필 섹션 */}
      <Card className="mb-6 border-2 border-gray-200">
        <CardContent className="py-6">
          <div className="flex gap-6 items-center">
            {/* 둥지마켓 메인 이미지 */}
            <div className="flex-shrink-0">
              <Image
                src="/logos/dungji_logo.jpg"
                alt="둥지마켓"
                width={60}
                height={60}
                className="rounded-lg object-contain"
              />
            </div>
            {/* 사용자 정보 */}
            <div className="flex-1 flex flex-col justify-center space-y-3">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {services.map((service) => {
          const Icon = service.icon;
          const totalCount = service.stats.reduce((sum, stat) => sum + stat.count, 0);
          const notificationCount = notifications[service.id as keyof NotificationCounts];

          return (
            <Card
              key={service.id}
              className={`${service.color} border hover:shadow-md transition-all cursor-pointer relative`}
              onClick={() => router.push(service.path)}
            >
              <CardContent className="p-4">
                {/* 알림 배지 */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 z-10">
                    <Badge className="bg-red-500 text-white flex items-center gap-1 px-1.5 py-0.5 text-xs">
                      <Bell className="w-2.5 h-2.5" />
                      {notificationCount}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                    <Icon className={`w-5 h-5 ${service.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900">
                      {service.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {service.description}
                    </p>
                  </div>
                  {totalCount > 0 && (
                    <Badge className={`${service.iconColor} bg-white text-xs px-2`}>
                      {totalCount}
                    </Badge>
                  )}
                </div>

                {/* 통계 */}
                {service.stats.length > 0 && (
                  <div className="flex gap-3 py-2 border-t border-gray-200">
                    {service.stats.map((stat) => (
                      <div key={stat.label} className="flex-1">
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className="text-lg font-bold text-gray-900">{stat.count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 빠른 메뉴 - 주석처리 */}
      {/* <Card className="border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">빠른 메뉴</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/mypage/settings')}
            >
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm">프로필 관리</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/mypage/noshow-management')}
            >
              <Sparkles className="w-5 h-5 text-gray-600" />
              <span className="text-sm">노쇼관리</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/custom-deals/my')}
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm">커공관리</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/used/mypage')}
            >
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="text-sm">중고거래 내역</span>
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <p className="text-gray-600">통계 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}

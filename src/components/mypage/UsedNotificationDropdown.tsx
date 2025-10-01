'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Check, Bell, Package, ShoppingCart } from 'lucide-react';
import { sellerAPI, buyerAPI } from '@/lib/api/used';

interface UsedNotification {
  id: string;
  type: 'sell' | 'buy';
  subType: string;
  phoneId: number;
  phoneModel: string;
  offerId?: number;
  message: string;
  timestamp: Date;
}

interface UsedNotificationDropdownProps {
  type: 'sell' | 'buy';
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const UsedNotificationDropdown: React.FC<UsedNotificationDropdownProps> = ({
  type,
  isOpen,
  onClose,
  className = ''
}) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<{
    unread: UsedNotification[];
    read: UsedNotification[];
  }>({
    unread: [],
    read: []
  });
  const [activeTab, setActiveTab] = useState<string>('unread');
  const [loading, setLoading] = useState<boolean>(true);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  // localStorage에서 읽은 알림 ID 로드
  useEffect(() => {
    const storedIds = localStorage.getItem(`readUsed${type}Notifications`);
    if (storedIds) {
      setReadNotificationIds(JSON.parse(storedIds));
    }
  }, [type]);

  // 알림 데이터 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, type]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let allNotifications: UsedNotification[] = [];

      if (type === 'sell') {
        // 판매 알림: 받은 제안들 조회
        const offers = await sellerAPI.getReceivedOffers();

        if (offers && Array.isArray(offers)) {
          allNotifications = offers.map((offer: any) => ({
            id: `sell-offer-${offer.id}`,
            type: 'sell',
            subType: getOfferSubType(offer),
            phoneId: offer.phone_id || offer.phone?.id,
            phoneModel: offer.phone?.model || '상품',
            offerId: offer.id,
            message: getOfferMessage(offer, 'sell'),
            timestamp: new Date(offer.created_at || offer.updated_at)
          }));
        }
      } else {
        // 구매 알림: 보낸 제안들 조회
        const offers = await buyerAPI.getMySentOffers();

        if (offers && Array.isArray(offers)) {
          allNotifications = offers.map((offer: any) => ({
            id: `buy-offer-${offer.id}`,
            type: 'buy',
            subType: getOfferSubType(offer),
            phoneId: offer.phone_id || offer.phone?.id,
            phoneModel: offer.phone?.model || '상품',
            offerId: offer.id,
            message: getOfferMessage(offer, 'buy'),
            timestamp: new Date(offer.created_at || offer.updated_at)
          }));
        }
      }

      // 읽음 상태에 따라 분류
      const unread = allNotifications.filter(n => !readNotificationIds.includes(n.id));
      const read = allNotifications.filter(n => readNotificationIds.includes(n.id));

      setNotifications({ unread, read });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOfferSubType = (offer: any): string => {
    if (offer.status === 'accepted') return '제안수락';
    if (offer.status === 'trading') return '거래중';
    if (offer.status === 'completed') return '거래완료';
    if (offer.status === 'cancelled') return '거래취소';
    return '신규제안';
  };

  const getOfferMessage = (offer: any, type: 'sell' | 'buy'): string => {
    const price = offer.offered_price?.toLocaleString() || offer.price?.toLocaleString();

    if (type === 'sell') {
      switch (offer.status) {
        case 'accepted': return `${price}원 제안이 수락되었습니다`;
        case 'trading': return `거래가 진행중입니다`;
        case 'completed': return `거래가 완료되었습니다`;
        case 'cancelled': return `거래가 취소되었습니다`;
        default: return `${price}원 제안이 도착했습니다`;
      }
    } else {
      switch (offer.status) {
        case 'accepted': return `제안이 수락되었습니다`;
        case 'trading': return `거래가 진행중입니다`;
        case 'completed': return `구매가 완료되었습니다`;
        case 'cancelled': return `거래가 취소되었습니다`;
        default: return `${price}원 제안을 보냈습니다`;
      }
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    const newReadIds = [...readNotificationIds, notificationId];
    setReadNotificationIds(newReadIds);
    localStorage.setItem(`readUsed${type}Notifications`, JSON.stringify(newReadIds));

    // UI 업데이트
    const notification = notifications.unread.find(n => n.id === notificationId);
    if (notification) {
      setNotifications({
        unread: notifications.unread.filter(n => n.id !== notificationId),
        read: [...notifications.read, notification]
      });
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = [...readNotificationIds, ...notifications.unread.map(n => n.id)];
    setReadNotificationIds(allIds);
    localStorage.setItem(`readUsed${type}Notifications`, JSON.stringify(allIds));

    setNotifications({
      unread: [],
      read: [...notifications.read, ...notifications.unread]
    });
  };

  const handleNotificationClick = (notification: UsedNotification) => {
    if (!readNotificationIds.includes(notification.id)) {
      handleMarkAsRead(notification.id);
    }

    // 모든 알림은 마이페이지로 이동
    // 사용자가 직접 판매/구매 탭에서 확인
    router.push('/mypage');

    onClose();
  };

  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: ko
      });
    } catch (error) {
      return '방금 전';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${className} w-96 bg-white shadow-lg rounded-md border border-gray-200`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium flex items-center">
          {type === 'sell' ? (
            <>
              <Package className="h-4 w-4 mr-2" />
              판매 알림
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              구매 알림
            </>
          )}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Tabs defaultValue="unread" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b px-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">
              읽지 않음 {notifications.unread.length > 0 && `(${notifications.unread.length})`}
            </TabsTrigger>
            <TabsTrigger value="read">읽음</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="unread" className="p-0">
          {notifications.unread.length > 0 && (
            <div className="p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" /> 모두 읽음으로 표시
              </Button>
            </div>
          )}

          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <p>로딩 중...</p>
              </div>
            ) : notifications.unread.length === 0 ? (
              <div className="flex justify-center items-center h-20 text-gray-500">
                <p>읽지 않은 알림이 없습니다</p>
              </div>
            ) : (
              <div>
                {notifications.unread.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{notification.phoneModel}</p>
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="read" className="p-0">
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <p>로딩 중...</p>
              </div>
            ) : notifications.read.length === 0 ? (
              <div className="flex justify-center items-center h-20 text-gray-500">
                <p>읽은 알림이 없습니다</p>
              </div>
            ) : (
              <div>
                {notifications.read.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{notification.phoneModel}</p>
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsedNotificationDropdown;
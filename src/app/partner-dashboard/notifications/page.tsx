'use client';

import { useEffect, useState } from 'react';
import { usePartner } from '@/contexts/PartnerContext';
import { partnerService } from '@/lib/api/partnerService';
import { PartnerNotification, PaginatedResponse } from '@/types/partner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  UserPlus,
  CreditCard,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  X,
  CheckCheck
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'signup':
      return <UserPlus className="h-5 w-5 text-blue-500" />;
    case 'payment':
      return <CreditCard className="h-5 w-5 text-green-500" />;
    case 'cancellation':
      return <X className="h-5 w-5 text-red-500" />;
    case 'settlement':
      return <CreditCard className="h-5 w-5 text-purple-500" />;
    case 'system':
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationTypeText = (type: string) => {
  switch (type) {
    case 'signup':
      return '신규 가입';
    case 'payment':
      return '결제';
    case 'cancellation':
      return '취소';
    case 'settlement':
      return '정산';
    case 'system':
      return '시스템';
    default:
      return type;
  }
};

export default function NotificationsPage() {
  const { partner } = usePartner();
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<PartnerNotification | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: PaginatedResponse<PartnerNotification> = await partnerService.getNotifications();
      setNotifications(response.results || []);
    } catch (err) {
      console.error('알림 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알림을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (partner) {
      loadNotifications();
    }
  }, [partner]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await partnerService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await partnerService.markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('모든 알림 읽음 처리 실패:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">알림</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '모든 알림을 확인했습니다'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            모두 읽음 처리
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            알림 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                알림이 없습니다
              </h3>
              <p className="text-sm text-muted-foreground">
                새로운 알림이 도착하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50/50 border-blue-200' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={!notification.is_read ? "default" : "secondary"}>
                            {getNotificationTypeText(notification.notification_type)}
                          </Badge>
                          {!notification.is_read && (
                            <Badge variant="outline" className="text-xs">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0 ml-4 text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </p>
                        {notification.is_read && notification.read_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            읽음: {formatDate(notification.read_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Guide */}
      <Card>
        <CardHeader>
          <CardTitle>알림 유형 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <UserPlus className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">신규 가입</h4>
                  <p className="text-sm text-muted-foreground">
                    추천 링크를 통해 새로운 회원이 가입했을 때
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">결제</h4>
                  <p className="text-sm text-muted-foreground">
                    추천 회원이 구독료를 결제했을 때
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">취소</h4>
                  <p className="text-sm text-muted-foreground">
                    추천 회원이 구독을 취소했을 때
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">정산</h4>
                  <p className="text-sm text-muted-foreground">
                    정산 요청이 처리되었을 때
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">시스템</h4>
                  <p className="text-sm text-muted-foreground">
                    시스템 공지사항 및 업데이트
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
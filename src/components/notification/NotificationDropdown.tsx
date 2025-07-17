import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  type Notification 
} from '@/lib/api/notification';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Check, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 알림 드롭다운 컴포넌트
 * 
 * 사용자의 알림 목록을 표시하고 관리합니다.
 * 
 * @example
 * ```tsx
 * <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
 * ```
 */
const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<{
    unread: Notification[];
    read: Notification[];
    unread_count: number;
  }>({
    unread: [],
    read: [],
    unread_count: 0,
  });
  const [activeTab, setActiveTab] = useState<string>('unread');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications();
    }
  }, [isOpen, isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    // 공구 상세 페이지로 이동
    router.push(`/groupbuys/${notification.groupbuy}`);
    onClose();
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ko 
      });
    } catch (error) {
      return '날짜 정보 없음';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-white shadow-lg rounded-md border border-gray-200 z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium flex items-center">
          <Bell className="h-4 w-4 mr-2" />
          알림
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <Tabs defaultValue="unread" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b px-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">
              읽지 않음 {notifications.unread_count > 0 && `(${notifications.unread_count})`}
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
                      <p className="text-sm font-medium">{notification.groupbuy_title}</p>
                      <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
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
                      <p className="text-sm font-medium">{notification.groupbuy_title}</p>
                      <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
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

export default NotificationDropdown;

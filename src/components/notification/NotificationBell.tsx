import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications } from '@/lib/api/notification';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  onClick: () => void;
}

/**
 * 알림 벨 아이콘 컴포넌트
 * 
 * 읽지 않은 알림이 있을 경우 숫자 배지를 표시합니다.
 * 
 * @example
 * ```tsx
 * <NotificationBell onClick={() => setShowNotifications(true)} />
 * ```
 */
const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        setUnreadCount(response.unread_count);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    
    // 30초마다 알림 수 업데이트
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <div className={cn(
          "absolute -top-1 -right-1 bg-red-500 text-white rounded-full",
          "flex items-center justify-center",
          unreadCount > 9 ? "w-5 h-5 text-xs" : "w-4 h-4 text-xs"
        )}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

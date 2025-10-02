import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications } from '@/lib/api/notification';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationBellProps {
  onClick: () => void;
  unreadCount?: number;
  onUnreadCountChange?: (count: number) => void;
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
const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, unreadCount: propUnreadCount, onUnreadCountChange }) => {
  const [localUnreadCount, setLocalUnreadCount] = useState<number>(0);
  const { isAuthenticated } = useAuth();
  
  // prop으로 받은 unreadCount가 있으면 사용, 없으면 localUnreadCount 사용
  const unreadCount = propUnreadCount !== undefined ? propUnreadCount : localUnreadCount;

  useEffect(() => {
    // prop으로 unreadCount를 받는 경우 자동 fetch 안 함
    if (propUnreadCount !== undefined) {
      return;
    }

    // 로그인하지 않은 경우 알림을 가져오지 않음
    if (!isAuthenticated) {
      setLocalUnreadCount(0);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        setLocalUnreadCount(response.unread_count);
        if (onUnreadCountChange) {
          onUnreadCountChange(response.unread_count);
        }
      } catch (error) {
        // 401 에러는 콘솔에 출력하지 않음 (로그아웃 상태일 수 있음)
        if (error instanceof Error && !error.message.includes('401')) {
          console.error('Failed to fetch notifications:', error);
        }
      }
    };

    fetchNotifications();

    // 30초마다 알림 수 업데이트
    const intervalId = setInterval(fetchNotifications, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, onUnreadCountChange, propUnreadCount]);

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

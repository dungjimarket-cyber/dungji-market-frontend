'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 모바일용 알림 버튼 컴포넌트
 * 
 * 모바일 화면에서 알림 기능을 제공합니다.
 * 
 * @example
 * ```tsx
 * <MobileNotificationButton />
 * ```
 */
const MobileNotificationButton: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // 로그인하지 않은 상태에서는 알림 버튼을 표시하지 않음
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-full py-2 relative">
      <NotificationBell
        onClick={() => setShowNotifications(!showNotifications)}
        unreadCount={unreadCount}
        onUnreadCountChange={setUnreadCount}
      />
      <span className="text-[10px] font-black-han-sans">알림</span>

      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setShowNotifications(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 w-full max-h-[70vh] bg-white rounded-t-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%' }}
          >
            <div className="w-full">
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                isMobile={true}
                onUnreadCountChange={setUnreadCount}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNotificationButton;

'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';

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

  return (
    <div className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-500 w-1/5 py-2 relative">
      <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
      <span className="text-xs">알림</span>
      
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNotificationButton;

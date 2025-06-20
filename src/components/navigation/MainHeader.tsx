'use client';

import { ArrowLeft, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MainHeaderProps {
  title: string;
  showBackButton?: boolean;
  showNotification?: boolean;
  onBack?: () => void;
}

/**
 * 메인 헤더 컴포넌트
 * @param title - 헤더 제목
 * @param showBackButton - 뒤로가기 버튼 표시 여부
 * @param showNotification - 알림 버튼 표시 여부
 * @param onBack - 뒤로가기 버튼 클릭 핸들러
 */
export function MainHeader({ 
  title, 
  showBackButton = false, 
  showNotification = true,
  onBack 
}: MainHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-5 h-6 bg-white/20 rounded-sm flex items-center justify-center">
            <div className="w-3 h-4 bg-white rounded-xs"></div>
          </div>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>
      
      {showNotification && (
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      )}
    </header>
  );
}

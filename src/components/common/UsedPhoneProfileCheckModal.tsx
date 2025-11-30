'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UsedPhoneProfileCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  onUpdateProfile?: () => void;
}

export default function UsedPhoneProfileCheckModal({
  isOpen,
  onClose,
  missingFields,
  onUpdateProfile,
}: UsedPhoneProfileCheckModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToSettings = () => {
    if (onUpdateProfile) {
      onUpdateProfile();
    } else {
      onClose();
      router.push('/mypage/settings');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 아이콘 */}
        <div className="pt-8 pb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 pb-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            프로필 설정이 필요합니다
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            중고폰 거래를 위해 아래 정보를 입력해주세요.
          </p>

          {/* 누락된 필드 목록 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2">미입력 항목</p>
            <ul className="space-y-1">
              {missingFields.map((field, index) => (
                <li
                  key={index}
                  className="flex items-center justify-center gap-2 text-sm text-gray-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {field}
                </li>
              ))}
            </ul>
          </div>

          {/* 버튼 */}
          <div className="space-y-2">
            <Button
              onClick={handleGoToSettings}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              지금 설정하기
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-500"
            >
              나중에 하기
            </Button>
          </div>

          {/* 안내 문구 */}
          <p className="mt-4 text-xs text-gray-400">
            안전한 거래를 위해 정보 입력이 필요합니다
          </p>
        </div>
      </div>
    </div>
  );
}

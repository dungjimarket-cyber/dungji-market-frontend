'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const handleUpdateProfile = () => {
    // 프로필 업데이트 콜백 호출
    if (onUpdateProfile) {
      onUpdateProfile();
    }
  };

  const handleCancel = () => {
    // 취소 시 onClose 콜백만 호출
    onClose();
  };

  // 아이콘 매핑 (중고폰용 - 연락처만 필수)
  const getFieldIcon = (field: string) => {
    switch (field) {
      case '연락처':
        return <Phone className="h-4 w-4" />;
      case '활동지역':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // 모달이 닫히려고 할 때 (X 버튼 또는 배경 클릭)
        if (!open && isOpen) {
          // "나중에 할게요"와 동일하게 처리
          onClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <DialogTitle>중고폰 거래 정보 입력</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            중고폰 거래를 위해 아래 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-orange-900 mb-3">
              입력이 필요한 정보
            </p>
            <ul className="space-y-2">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-orange-800">
                  {getFieldIcon(field)}
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>안전한 거래를 위해 연락처와 활동지역 정보가 필요합니다.</p>
            <p className="mt-1">내 정보 설정 페이지로 이동하시겠습니까?</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            나중에 할게요
          </Button>
          <Button
            onClick={handleUpdateProfile}
            className="bg-blue-500 hover:bg-blue-600"
          >
            정보 입력하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
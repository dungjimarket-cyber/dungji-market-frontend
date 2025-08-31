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
import { AlertCircle, User, Phone, MapPin, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  onComplete?: () => void;
  onUpdateProfile?: () => void;
}

export default function ProfileCheckModal({
  isOpen,
  onClose,
  missingFields,
  onComplete,
  onUpdateProfile,
}: ProfileCheckModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // 디버깅 로그 추가
  console.log('[ProfileCheckModal] 렌더링됨:', {
    isOpen,
    missingFields,
    missingFieldsLength: missingFields?.length || 0
  });

  const handleUpdateProfile = () => {
    // 일반회원과 판매회원 구분하여 리다이렉트
    const redirectPath = user?.role === 'seller' 
      ? '/mypage/seller/settings' 
      : '/mypage/settings';
    
    // 프로필 업데이트 콜백 호출 (캐시 초기화 등)
    if (onUpdateProfile) {
      onUpdateProfile();
    }
    
    router.push(redirectPath);
    onClose();
  };

  const handleCancel = () => {
    // 취소 시 onClose 콜백만 호출
    // 실제 페이지 이동은 부모 컴포넌트에서 처리
    onClose();
  };

  // 아이콘 매핑
  const getFieldIcon = (field: string) => {
    switch (field) {
      case '연락처':
        return <Phone className="h-4 w-4" />;
      case '활동지역':
        return <MapPin className="h-4 w-4" />;
      case '사업자등록번호':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // 배경 클릭으로 모달이 닫히는 것을 방지
        // 오직 버튼 클릭으로만 닫을 수 있음
        if (!open && isOpen) {
          // 모달이 닫히려고 할 때 아무것도 하지 않음
          return;
        }
        onClose();
      }}
    >
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          e.preventDefault(); // 배경 클릭 방지
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault(); // ESC 키로 닫기 방지
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <DialogTitle>필수 정보 입력 안내</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            서비스 이용을 위해 아래 정보를 입력해주세요.
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
            <p>정보 입력 후 서비스를 이용하실 수 있습니다.</p>
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
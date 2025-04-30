'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { checkWishStatus, toggleWish } from '@/lib/wishlist-service';
import { Button } from '@/components/ui/button';

interface WishButtonProps {
  groupbuyId: number;
  className?: string;
  showCount?: boolean;
  count?: number;
}

/**
 * 찜하기 버튼 컴포넌트
 * @param props - 컴포넌트 속성
 * @returns 찜하기 버튼 컴포넌트
 * @example
 * <WishButton groupbuyId={5} showCount={true} />
 */
export function WishButton({ groupbuyId, className = '', showCount = false, count = 0 }: WishButtonProps) {
  const { status } = useSession();
  const { toast } = useToast();
  const [isWished, setIsWished] = useState<boolean>(false);
  const [wishCount, setWishCount] = useState<number>(count);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 찜하기 상태를 확인하는 함수
   */
  const checkWished = async (): Promise<void> => {
    if (status !== 'authenticated') return;
    
    try {
      const response = await checkWishStatus(groupbuyId);
      setIsWished(response.is_wished);
    } catch (error) {
      console.error('찜하기 상태 확인 실패:', error);
    }
  };

  /**
   * 찜하기 토글 함수
   */
  const handleToggleWish = async (): Promise<void> => {
    if (status !== 'authenticated') {
      toast({
        variant: 'destructive',
        title: '로그인이 필요합니다',
        description: '찜하기 기능은 로그인 후 이용 가능합니다.',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await toggleWish(groupbuyId);
      
      setIsWished(result.status === 'wished');
      setWishCount(prev => result.status === 'wished' ? prev + 1 : prev - 1);
      
      toast({
        variant: 'default',
        title: result.status === 'wished' ? '찜하기 완료' : '찜하기 취소',
        description: result.message,
        className: result.status === 'wished' ? 'border-pink-200 bg-pink-50' : '',
      });
    } catch (error) {
      console.error('찜하기 실패:', error);
      toast({
        variant: 'destructive',
        title: '찜하기 실패',
        description: '잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkWished();
  }, [groupbuyId, status]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`px-2 ${className}`}
      onClick={handleToggleWish}
      disabled={isLoading}
    >
      <Heart 
        className={`mr-1 ${isWished ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`} 
        size={16}
      />
      {showCount && (
        <span className={`text-xs ${isWished ? 'text-pink-500' : 'text-gray-500'}`}>
          {wishCount}
        </span>
      )}
    </Button>
  );
}

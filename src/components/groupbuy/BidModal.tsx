'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createBid, getSellerBids, cancelBid } from '@/lib/api/bidService';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatNumberWithCommas } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuyId: number;
  targetPrice: number;
  productName: string;
  minParticipants: number;
  currentParticipants: number;
  onBidSuccess: () => void;
  isClosed?: boolean; // 추가: 마감 여부
}

interface BidFormData {
  bidType: 'price' | 'support';
  amount: number;
  message?: string;
}

/**
 * 판매자(사업자회원)가 공구에 입찰하는 모달 컴포넌트
 */
export default function BidModal({
  isOpen,
  onClose,
  groupBuyId,
  targetPrice,
  productName,
  minParticipants,
  currentParticipants,
  onBidSuccess,
  isClosed = false
}: BidModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bidType, setBidType] = useState<'price' | 'support'>('price');
  const [existingBid, setExistingBid] = useState<{id: number, amount: number} | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // 마감된 경우 모달 자체에서 방어
  if (isClosed) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입찰 불가</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            마감된 공구에는 입찰할 수 없습니다.
          </DialogDescription>
          <DialogFooter>
            <Button onClick={onClose}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<BidFormData>({
    defaultValues: {
      bidType: 'price',
      amount: undefined, // 디폴트 0 제거
      message: ''
    }
  });
  
  // 현재 공구에 대한 판매자의 기존 입찰 확인
  useEffect(() => {
    const checkExistingBid = async () => {
      try {
        // 판매자의 입찰 목록 조회
        const bids = await getSellerBids();
        // 현재 공구에 대한 대기 중인 입찰이 있는지 확인
        const existing = bids.find(bid => 
          bid.groupbuy === groupBuyId && 
          bid.status === 'pending'
        );
        
        if (existing) {
          setExistingBid({
            id: existing.id,
            amount: existing.amount
          });
          // 기존 입찰 정보로 폼 초기화
          setValue('bidType', existing.bid_type);
          setValue('amount', existing.amount);
          setValue('message', existing.message || '');
          setBidType(existing.bid_type);
        }
      } catch (error) {
        console.error('기존 입찰 확인 중 오류:', error);
      }
    };
    
    if (isOpen && groupBuyId) {
      checkExistingBid();
    }
  }, [isOpen, groupBuyId, setValue]);

  // 입찰 유형 변경 핸들러
  const handleBidTypeChange = (value: 'price' | 'support') => {
    setBidType(value);
  };

  // 입찰 제출 핸들러
  const onSubmit = async (data: BidFormData) => {
    setLoading(true);
    
    try {
      const result = await createBid({
        groupbuy_id: groupBuyId,
        bid_type: data.bidType,
        amount: data.amount,
        message: data.message
      });

      toast({
        title: result.is_updated 
          ? '입찰이 성공적으로 수정되었습니다' 
          : '입찰이 성공적으로 등록되었습니다',
        description: result.is_updated
          ? '기존 입찰 정보가 새로운 금액으로 업데이트되었습니다.'
          : '입찰 내역은 마이페이지에서 확인할 수 있습니다.',
        variant: 'default'
      });
      reset();
      onBidSuccess();
      onClose();
    } catch (error: any) {
      console.error('입찰 등록 중 오류 발생:', error.response?.data);
      console.error('전체 요청 내용:', error.config?.data);
      toast({
        title: '입찰 등록에 실패했습니다',
        description: error.response?.data?.detail || '서버 오류가 발생했습니다. 다시 시도해 주세요.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">공동구매 입찰하기</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-black">{productName}</span> 공동구매에 입찰 정보를 입력해 주세요.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* 입찰 취소 버튼 - 기존 입찰이 있는 경우에만 표시 */}
          {existingBid && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
              <p className="text-amber-800 text-sm font-medium">
                이미 이 공구에 입찰하셨습니다. 새로운 금액으로 입찰하시거나 입찰을 취소하실 수 있습니다.
              </p>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={async (e) => {
                  e.preventDefault();
                  if (!existingBid?.id) return;
                  
                  if (!confirm('입찰을 취소하시겠습니까?')) return;
                  
                  try {
                    setCancelLoading(true);
                    await cancelBid(existingBid.id);
                    toast({
                      title: '입찰 취소 완료',
                      description: '입찰이 성공적으로 취소되었습니다.',
                      variant: 'default'
                    });
                    setExistingBid(null);
                    reset();
                    onBidSuccess();
                    onClose();
                  } catch (error: any) {
                    toast({
                      title: '입찰 취소 실패',
                      description: error.response?.data?.detail || '입찰 취소 중 오류가 발생했습니다.',
                      variant: 'destructive'
                    });
                  } finally {
                    setCancelLoading(false);
                  }
                }}
                disabled={cancelLoading}
                className="mt-2 w-full"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    취소 중...
                  </>
                ) : (
                  '입찰 취소하기'
                )}
              </Button>
            </div>
          )}
          {/* 공구 정보 요약 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">목표 가격:</div>
              <div className="font-medium">{formatNumberWithCommas(targetPrice)}원</div>
              <div className="text-gray-500">최소 인원:</div>
              <div className="font-medium">{minParticipants}명</div>
              <div className="text-gray-500">현재 참여인원:</div>
              <div className="font-medium">{currentParticipants}명</div>
            </div>
          </div>
          
          {/* 입찰 유형 선택 */}
          <div className="space-y-2">
            <Label>입찰 유형</Label>
            <RadioGroup 
              defaultValue="price"
              className="flex flex-col space-y-1"
              value={bidType}
              onValueChange={handleBidTypeChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price" id="price" {...register('bidType')} />
                <Label htmlFor="price" className="font-normal">
                  가격 입찰 - 제품을 판매할 가격을 제안합니다
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="support" id="support" {...register('bidType')} />
                <Label htmlFor="support" className="font-normal">
                  지원금 입찰 - 공구 참여자들에게 제공할 지원금을 제안합니다
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* 금액 입력 */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {bidType === 'price' ? '판매 가격' : '지원금'} (원)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder={bidType === 'price' ? '판매 가격을 입력하세요' : '지원금을 입력하세요'}
              {...register('amount', { 
                required: '금액을 입력해 주세요',
                min: {
                  value: 1,
                  message: '금액은 1원 이상이어야 합니다'
                }
              })}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
            
            {bidType === 'price' && (
              <p className="text-sm text-gray-500 mt-1">
                목표가격보다 낮게 입찰할수록 선정 가능성이 높아집니다.
              </p>
            )}
            {bidType === 'support' && (
              <p className="text-sm text-gray-500 mt-1">
                지원금은 공구 참여자 전체에게 제공되며, 금액이 높을수록 선정 가능성이 높아집니다.
              </p>
            )}
          </div>
          
          {/* 메시지 입력 (선택사항) */}
          <div className="space-y-2">
            <Label htmlFor="message">메시지 (선택사항)</Label>
            <textarea
              id="message"
              placeholder="공구 참여자에게 전달할 메시지를 입력하세요"
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
              rows={3}
              {...register('message')}
            />
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 처리 중
                </>
              ) : '입찰하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

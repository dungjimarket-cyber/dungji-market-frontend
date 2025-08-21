'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { createBid, getSellerBids, cancelBid } from '@/lib/api/bidService';
import bidTokenService from '@/lib/bid-token-service';
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
import { useAuth } from '@/hooks/useAuth';
import { tokenUtils } from '@/lib/tokenUtils';

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
  productCategory?: string; // 제품 카테고리 추가
}

interface BidFormData {
  bidType: 'price' | 'support';
  amount: number;
  message?: string;
}

/**
 * 판매자(사업자회원)가 공구에 견적을 제안하는 모달 컴포넌트
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
  isClosed = false,
  productCategory = 'electronics' // 기본값은 가전제품으로 설정
}: BidModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  // 휴대폰 카테고리(category_id=1 또는 category_name='휴대폰')는 지원금 입찰을 디폴트로, 그 외는 가격 입찰을 디폴트로 설정
  const isTelecom = productCategory === '휴대폰' || productCategory === '1';
  const defaultBidType = isTelecom ? 'support' : 'price';
  const [bidType, setBidType] = useState<'price' | 'support'>(defaultBidType);
  const [existingBid, setExistingBid] = useState<{id: number, amount: number} | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [bidTokenInfo, setBidTokenInfo] = useState<{
    single_tokens: number;
    unlimited_subscription: boolean;
    unlimited_expires_at: string | null;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBidData, setPendingBidData] = useState<BidFormData | null>(null);
  
  // 마감된 경우 모달 자체에서 방어
  if (isClosed) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>견적 제안 불가</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            마감된 공구에는 견적을 제안할 수 없습니다.
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
      bidType: defaultBidType, // 제품 카테고리에 따라 기본값 설정
      amount: undefined, // 디폴트 0 제거
      message: ''
    }
  });
  
  // 현재 공구에 대한 판매자의 기존 입찰 확인 및 견적티켓 정보 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 사용자 프로필 새로 가져오기
        if (user?.role === 'seller') {
          const token = await tokenUtils.getAccessToken();
          const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setUserProfile(profileData);
          }
        }
        
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
            amount: typeof existing.amount === 'string' ? 0 : existing.amount
          });
          // 기존 입찰 정보로 폼 초기화
          setValue('bidType', existing.bid_type);
          setValue('amount', typeof existing.amount === 'string' ? 0 : existing.amount);
          setValue('message', existing.message || '');
          setBidType(existing.bid_type);
        }
        
        // 견적티켓 정보 가져오기
        const tokenInfo = await bidTokenService.getBidTokens();
        setBidTokenInfo(tokenInfo);
      } catch (error) {
        console.error('데이터 확인 중 오류:', error);
      }
    };
    
    if (isOpen && groupBuyId) {
      fetchData();
    }
  }, [isOpen, groupBuyId, setValue]);

  // 입찰 유형 변경 핸들러
  const handleBidTypeChange = (value: 'price' | 'support') => {
    setBidType(value);
  };

  // 입찰 제출 핸들러
  const onSubmit = async (data: BidFormData) => {
    // 판매회원 필수 정보 완성도 체크
    if (user?.role === 'seller') {
      const missingFields = [];
      const sellerUser = userProfile || user; // 새로 가져온 프로필 사용
      
      // 필수 정보 체크 - 백엔드 필드명과 일치하도록 수정
      if (!sellerUser.nickname || sellerUser.nickname.trim() === '') {
        missingFields.push('닉네임 또는 상호명');
      }
      if (!sellerUser.address_region) {
        missingFields.push('사업장주소지/영업활동지역');
      }
      if (!sellerUser.first_name) {
        missingFields.push('사업자등록증상 대표자명');
      }
      // business_reg_number 필드명 사용 (백엔드와 일치)
      if (!sellerUser.business_reg_number && !sellerUser.business_number) {
        missingFields.push('사업자등록번호');
      }
      if (!sellerUser.is_business_verified) {
        missingFields.push('사업자등록번호 인증');
      }
      
      if (missingFields.length > 0) {
        toast({
          title: '필수 정보 입력 필요',
          description: `견적 제안을 위해 ${missingFields[0]} 등의 필수 정보를 완료해주세요.`,
          variant: 'destructive',
        });
        
        // 내정보 페이지로 이동
        router.push('/mypage/seller/settings');
        return;
      }
    }
    
    // 견적 수정/제안 시 항상 견적티켓 확인 (기획 요구사항에 따라 변경)
    if (!bidTokenInfo || (!bidTokenInfo.unlimited_subscription && bidTokenInfo.single_tokens === 0)) {
      toast({
        title: '견적티켓이 필요합니다',
        description: existingBid 
          ? '견적을 수정하시려면 견적티켓을 구매해주세요.' 
          : '견적을 제안하시려면 견적티켓을 구매해주세요.',
        variant: 'default'
      });
      router.push('/mypage/seller/bid-tokens');
      return;
    }
    
    // 입찰 확인 팝업 표시
    setPendingBidData(data);
    setShowConfirmDialog(true);
  };
  
  // 실제 입찰 진행
  const confirmBid = async () => {
    if (!pendingBidData) return;
    
    setLoading(true);
    setShowConfirmDialog(false);
    
    try {
      // 입찰 전송 데이터 로깅
      const bidData = {
        groupbuy_id: groupBuyId,
        bid_type: pendingBidData.bidType,
        amount: pendingBidData.amount,
        message: pendingBidData.message
      };
      console.log('입찰 전송 데이터:', bidData);
      
      const result = await createBid(bidData);

      // 견적티켓 정보 실시간 업데이트
      try {
        const updatedTokenInfo = await bidTokenService.getBidTokens();
        setBidTokenInfo(updatedTokenInfo);
      } catch (error) {
        console.error('견적티켓 정보 업데이트 오류:', error);
      }

      toast({
        title: result.is_updated 
          ? '견적이 성공적으로 수정되었습니다' 
          : '견적이 성공적으로 등록되었습니다',
        description: result.is_updated
          ? '기존 견적 정보가 새로운 금액으로 업데이트되었습니다.'
          : '견적 내역은 마이페이지에서 확인할 수 있습니다.',
        variant: 'default'
      });
      reset();
      onBidSuccess();
      onClose();
    } catch (error: any) {
      // 상세 오류 로깅
      console.error('입찰 등록 중 오류 발생:', error);
      console.error('오류 응답 데이터:', error.response?.data);
      console.error('오류 상태 코드:', error.response?.status);
      console.error('전체 요청 내용:', error.config?.data);
      
      // 에러 메시지 추출 및 가공
      let errorMessage = '서버 오류가 발생했습니다. 다시 시도해 주세요.';
      let errorTitle = '견적 등록에 실패했습니다';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // 구체적인 오류 메시지가 있는 경우
        if (errorData.detail) {
          errorMessage = errorData.detail;
          
          // 견적티켓 관련 오류인지 확인
          if (errorMessage.includes('입찰권') || errorMessage.includes('견적티켓') || 
              errorMessage.includes('사용 가능한 입찰권이 없습니다') || errorMessage.includes('사용 가능한 견적티켓이 없습니다') ||
              errorMessage.includes('구매') ||
              errorMessage.includes('다시 시도해주세요')) {
            errorTitle = '견적티켓 부족';
          }
          
          // 공구 상태 관련 오류인지 확인
          if (errorMessage.includes('공구') || errorMessage.includes('상태') || 
              errorMessage.includes('recruiting') || errorMessage.includes('bidding')) {
            errorTitle = '유효하지 않은 공구 상태';
          }
        }
        // 견적티켓 관련 오류
        else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(', ');
        }
        // 필드별 유효성 오류
        else if (typeof errorData === 'object') {
          const fieldErrors = [];
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${(errors as string[]).join(', ')}`);
            }
          }
          
          if (fieldErrors.length > 0) {
            errorMessage = `입력 오류: ${fieldErrors.join('; ')}`;
          }
        }
      }
      
      // 네트워크 오류 확인
      if (!error.response) {
        errorMessage = '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
        errorTitle = '네트워크 오류';
      }
      
      // 사용자에게 알림
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      });
      
      // 견적티켓 부족인 경우 구매 안내
      if (errorMessage.includes('입찰권') || errorMessage.includes('견적티켓') || 
          errorMessage.includes('사용 가능한 입찰권이 없습니다') || errorMessage.includes('사용 가능한 견적티켓이 없습니다') ||
          errorMessage.includes('구매') ||
          errorMessage.includes('다시 시도해주세요')) {
        setTimeout(() => {
          toast({
            title: '견적티켓 구매하기',
            description: (
              <div className="flex flex-col">
                <p>견적티켓을 구매하시면 더 많은 공구에 견적을 제안할 수 있습니다.</p>
                <Button
                  className="mt-2"
                  onClick={() => router.push('/mypage/seller/bid-tokens')}
                >
                  견적티켓 구매 페이지로 이동
                </Button>
              </div>
            ),
            variant: 'default',
          });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">공동구매 견적 제안하기</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-black">{productName}</span> 공동구매에 견적 정보를 입력해 주세요.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* 입찰 취소 버튼 - 기존 입찰이 있는 경우에만 표시 */}
          {existingBid && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
              <p className="text-amber-800 text-sm font-medium">
                ✅ 이미 이 공구에 견적을 제안하셨습니다. 
                <br />
                📝 견적 수정 시에도 견적티켓 1개가 소모됩니다.
                <br />
                새로운 금액으로 수정하시거나 견적을 철회하실 수 있습니다.
              </p>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={async (e) => {
                  e.preventDefault();
                  if (!existingBid?.id) return;
                  
                  if (!confirm('견적을 철회하시겠습니까?')) return;
                  
                  try {
                    setCancelLoading(true);
                    await cancelBid(existingBid.id);
                    
                    // 견적티켓 정보 실시간 업데이트 (철회 시)
                    try {
                      const updatedTokenInfo = await bidTokenService.getBidTokens();
                      setBidTokenInfo(updatedTokenInfo);
                    } catch (error) {
                      console.error('견적티켓 정보 업데이트 오류:', error);
                    }
                    
                    toast({
                      title: '견적 철회 완료',
                      description: '견적이 성공적으로 철회되었습니다.',
                      variant: 'default'
                    });
                    setExistingBid(null);
                    reset();
                    onBidSuccess();
                    onClose();
                  } catch (error: any) {
                    toast({
                      title: '견적 철회 실패',
                      description: error.response?.data?.detail || '견적 철회 중 오류가 발생했습니다.',
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
                  '견적 철회하기'
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
            <Label>견적 유형</Label>
            <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
              {isTelecom ? (
                // 통신/렌탈 카테고리: 지원금 입찰만 표시
                <div className="flex items-center space-x-2">
                  <input 
                    type="hidden" 
                    value="support" 
                    {...register('bidType')} 
                  />
                  <p className="text-sm font-medium">지원금 견적 - 공구 참여자들에게 제공할 지원금을 제안합니다</p>
                </div>
              ) : (
                // 그 외 카테고리: 가격 입찰만 표시
                <div className="flex items-center space-x-2">
                  <input 
                    type="hidden" 
                    value="price" 
                    {...register('bidType')} 
                  />
                  <p className="text-sm font-medium">가격 견적 - 제품을 판매할 가격을 제안합니다</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 금액 입력 */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {bidType === 'price' ? '판매 가격' : '지원금'} (원)
            </Label>
            <Input
              {...register('amount', { 
                required: '금액을 입력해주세요', 
                min: { value: 1000, message: '최소 1,000원 이상 입력해주세요' },
                max: { value: 10000000, message: '최대 1천만원까지 입력 가능합니다' },
                valueAsNumber: true
              })}
              type="number"
              placeholder={bidType === 'price' ? '견적 금액을 입력하세요' : '견적 금액을 입력하세요'}
              className="mt-1"
              onChange={(e) => {
                // 숫자 입력 시 자동으로 콤마 표시 (UI에만 적용)
                const value = e.target.value;
                if (value) {
                  const numericValue = parseInt(value.replace(/,/g, ''));
                  if (!isNaN(numericValue)) {
                    // 입력 필드 옆에 포맷된 금액 표시를 위해 data-formatted 속성 설정
                    e.target.setAttribute('data-formatted', numericValue.toLocaleString() + '원');
                  }
                }
              }}
            />
            {watch('amount') && (
              <div className="text-sm text-blue-600 font-medium mt-1">
                {parseInt(watch('amount').toString()).toLocaleString()}원
              </div>
            )}
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
            
            {/* 입찰 유형별 안내 문구 */}
            <div className="space-y-2 mt-2">
              {bidType === 'support' && (
                <div className="text-gray-500 text-sm p-2 bg-blue-50 border border-blue-100 rounded-md">
                  <p>카드 제휴할인이나 증정품을 제외한 순수 현금지원금입니다 (공시지원금+추가지원금)</p>
                </div>
              )}
              <div className="text-gray-500 text-sm">
                앞자리를 제외한 견적금액은 비공개 처리됩니다.
              </div>
            </div>
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
              ) : '견적 제안하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    {/* 입찰 확인 팝업 */}
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {existingBid ? '견적 수정하기' : '견적 제안하기'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            견적 확인 팝업
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {/* 나의 견적금액 */}
          <div className="text-sm text-gray-700">
            <span>나의 견적금액 : </span>
            <span className="font-medium">
              {pendingBidData && pendingBidData.amount ? formatNumberWithCommas(Number(pendingBidData.amount)) : '0'}원
            </span>
          </div>
          
          {/* 확인 메시지 */}
          <div className="text-sm text-gray-700">
            {existingBid
              ? bidTokenInfo?.unlimited_subscription
                ? '"견적을 수정하시겠습니까?"'
                : '"견적티켓 1개가 소모됩니다. 견적을 수정하시겠습니까?"'
              : bidTokenInfo?.unlimited_subscription
                ? '"견적을 제안하시겠습니까?"'
                : '"견적티켓 1개가 소모됩니다. 견적을 제안하시겠습니까?"'
            }
          </div>
          
          {/* 버튼 그룹 - DialogFooter 밖으로 이동 */}
          <div className="flex gap-2 justify-center py-2">
            <Button
              onClick={confirmBid}
              disabled={loading}
              size="sm"
              className="px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                '예'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              size="sm"
              className="px-4"
            >
              고민해볼게요
            </Button>
          </div>
          
          {/* 견적티켓 정보 */}
          <div className="text-sm text-gray-600">
            {bidTokenInfo?.unlimited_subscription ? (
              <span>무제한 구독권 이용중</span>
            ) : (
              <span>
                남은 견적티켓 갯수 {bidTokenInfo?.single_tokens || 0}개
                {existingBid && (
                  <span className="text-orange-600 block">
                    (수정 후 {Math.max(0, (bidTokenInfo?.single_tokens || 0) - 1)}개)
                  </span>
                )}
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            최소 견적 단위는 1,000원입니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

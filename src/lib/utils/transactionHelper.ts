import { toast } from '@/hooks/use-toast';

export interface TransactionError {
  code: string;
  message: string;
  shouldRefresh: boolean;
  redirectTab?: string;
}

// 거래 상태 충돌 에러 코드 매핑
export const TRANSACTION_ERROR_CODES = {
  OFFER_ALREADY_CANCELLED: 'offer_already_cancelled',
  OFFER_ALREADY_ACCEPTED: 'offer_already_accepted',
  PHONE_ALREADY_TRADING: 'phone_already_trading',
  PHONE_ALREADY_SOLD: 'phone_already_sold',
  PHONE_NOT_FOUND: 'phone_not_found',
  PHONE_DELETED: 'phone_deleted',
  PHONE_MODIFIED: 'phone_modified',
  PHONE_PRICE_CHANGED: 'phone_price_changed',
  TRANSACTION_ALREADY_COMPLETED: 'transaction_already_completed',
  TRANSACTION_ALREADY_CANCELLED: 'transaction_already_cancelled',
  BUYER_ALREADY_COMPLETED: 'buyer_already_completed',
  SELLER_ALREADY_COMPLETED: 'seller_already_completed',
  INVALID_TRANSACTION_STATE: 'invalid_transaction_state',
  NOT_AUTHORIZED: 'not_authorized',
};

// 에러 응답 파싱 및 처리
export function parseTransactionError(error: any): TransactionError {
  const errorCode = error.response?.data?.code || error.response?.data?.error_code;
  const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;

  switch (errorCode) {
    case TRANSACTION_ERROR_CODES.OFFER_ALREADY_CANCELLED:
      return {
        code: errorCode,
        message: '이미 취소된 제안입니다. 목록을 새로고침합니다.',
        shouldRefresh: true,
        redirectTab: 'offers',
      };

    case TRANSACTION_ERROR_CODES.OFFER_ALREADY_ACCEPTED:
      return {
        code: errorCode,
        message: '이미 수락된 제안입니다. 거래중 탭으로 이동합니다.',
        shouldRefresh: true,
        redirectTab: 'trading',
      };

    case TRANSACTION_ERROR_CODES.PHONE_ALREADY_TRADING:
      return {
        code: errorCode,
        message: '이미 다른 구매자와 거래중인 상품입니다.',
        shouldRefresh: true,
        redirectTab: 'trading',
      };

    case TRANSACTION_ERROR_CODES.PHONE_ALREADY_SOLD:
      return {
        code: errorCode,
        message: '이미 판매완료된 상품입니다.',
        shouldRefresh: true,
        redirectTab: 'sold',
      };

    case TRANSACTION_ERROR_CODES.PHONE_NOT_FOUND:
    case TRANSACTION_ERROR_CODES.PHONE_DELETED:
      return {
        code: errorCode,
        message: '상품이 삭제되었습니다. 목록으로 돌아갑니다.',
        shouldRefresh: true,
        redirectTab: 'list',
      };

    case TRANSACTION_ERROR_CODES.PHONE_MODIFIED:
    case TRANSACTION_ERROR_CODES.PHONE_PRICE_CHANGED:
      return {
        code: errorCode,
        message: '상품 정보가 변경되었습니다. 다시 확인 후 제안해주세요.',
        shouldRefresh: true,
        redirectTab: 'refresh',
      };

    case TRANSACTION_ERROR_CODES.TRANSACTION_ALREADY_COMPLETED:
      return {
        code: errorCode,
        message: '이미 완료된 거래입니다.',
        shouldRefresh: true,
        redirectTab: 'completed',
      };

    case TRANSACTION_ERROR_CODES.TRANSACTION_ALREADY_CANCELLED:
      return {
        code: errorCode,
        message: '상대방이 이미 거래를 취소했습니다.',
        shouldRefresh: true,
        redirectTab: 'active',
      };

    case TRANSACTION_ERROR_CODES.BUYER_ALREADY_COMPLETED:
      return {
        code: errorCode,
        message: '구매자가 이미 거래를 완료했습니다. 판매 완료 처리해주세요.',
        shouldRefresh: true,
        redirectTab: 'trading',
      };

    case TRANSACTION_ERROR_CODES.SELLER_ALREADY_COMPLETED:
      return {
        code: errorCode,
        message: '판매자가 이미 거래를 완료했습니다.',
        shouldRefresh: true,
        redirectTab: 'completed',
      };

    case TRANSACTION_ERROR_CODES.INVALID_TRANSACTION_STATE:
      return {
        code: errorCode,
        message: '유효하지 않은 거래 상태입니다. 목록을 새로고침합니다.',
        shouldRefresh: true,
      };

    case TRANSACTION_ERROR_CODES.NOT_AUTHORIZED:
      return {
        code: errorCode,
        message: '거래 당사자가 아닙니다.',
        shouldRefresh: false,
      };

    default:
      return {
        code: 'unknown',
        message: errorMessage || '거래 처리 중 오류가 발생했습니다.',
        shouldRefresh: true,
      };
  }
}

// 거래 액션 실행 래퍼 (상태 충돌 자동 처리)
export async function executeTransactionAction(
  action: () => Promise<any>,
  options: {
    onSuccess?: () => void;
    onError?: (error: TransactionError) => void;
    onRefresh?: () => void;
    onTabChange?: (tab: string) => void;
    successMessage?: string;
  } = {}
) {
  try {
    const result = await action();

    if (options.successMessage) {
      toast({
        title: '성공',
        description: options.successMessage,
      });
    }

    if (options.onSuccess) {
      options.onSuccess();
    }

    return result;
  } catch (error) {
    const transactionError = parseTransactionError(error);

    // 에러 토스트 표시
    toast({
      title: '알림',
      description: transactionError.message,
      variant: transactionError.code === 'unknown' ? 'destructive' : 'default',
    });

    // 새로고침 필요시
    if (transactionError.shouldRefresh && options.onRefresh) {
      setTimeout(() => {
        options.onRefresh?.();
      }, 1500);
    }

    // 탭 전환 필요시
    if (transactionError.redirectTab && options.onTabChange) {
      setTimeout(() => {
        options.onTabChange?.(transactionError.redirectTab!);
      }, 1000);
    }

    if (options.onError) {
      options.onError(transactionError);
    }

    throw transactionError;
  }
}

// 실시간 상태 동기화를 위한 폴링 헬퍼
export class TransactionPollingManager {
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling = false;

  start(callback: () => void, interval: number = 5000) {
    if (this.isPolling) return;

    this.isPolling = true;
    this.intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        callback();
      }
    }, interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
  }

  restart(callback: () => void, interval: number = 5000) {
    this.stop();
    this.start(callback, interval);
  }
}

// 낙관적 업데이트 후 롤백 헬퍼
export function optimisticUpdate<T>(
  currentState: T,
  optimisticState: T,
  action: () => Promise<any>,
  setState: (state: T) => void,
  rollbackDelay: number = 3000
) {
  // 낙관적 업데이트
  setState(optimisticState);

  return action().catch((error) => {
    // 에러 발생시 롤백
    setTimeout(() => {
      setState(currentState);
    }, rollbackDelay);
    throw error;
  });
}
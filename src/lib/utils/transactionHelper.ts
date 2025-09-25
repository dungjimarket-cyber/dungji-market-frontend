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

  // 에러 메시지로도 체크
  if (errorMessage && errorMessage.includes('거래가 이미 취소되었습니다')) {
    return {
      code: 'transaction_already_cancelled',
      message: errorMessage,
      shouldRefresh: true,
      redirectTab: 'active',
    };
  }

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
        message: '이미 거래완료된 상품입니다.',
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

    // 즉시구매 성공인 경우 toast를 건너뜀 (action 내부에서 이미 처리)
    if (result?.type === 'instant_purchase') {
      // 즉시구매는 별도 메시지를 이미 표시했으므로 건너뜀
    } else if (options.successMessage) {
      toast({
        title: '성공',
        description: options.successMessage,
      });
    }

    if (options.onSuccess) {
      options.onSuccess();
    }

    // 성공 시에도 onRefresh 실행
    if (options.onRefresh) {
      options.onRefresh();
    }

    // 성공 시에도 onTabChange 실행 (탭 전환이 필요한 경우)
    if (options.onTabChange) {
      // onTabChange는 탭 이름을 받아야 하므로 SalesActivityTab에서 처리
    }

    return result;
  } catch (error: any) {
    // 즉시구매 성공 처리를 위한 특별 케이스
    if (error?.skipSuccess) {
      return error.data;
    }

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
  private lastFetchTime = 0;
  private minInterval = 30000; // 최소 30초 간격
  private maxInterval = 120000; // 최대 2분 간격
  private currentInterval = 30000;
  private idleTime = 0;
  private idleCheckInterval: NodeJS.Timeout | null = null;

  start(callback: () => void, interval: number = 30000) {
    if (this.isPolling) return;

    this.isPolling = true;
    this.currentInterval = Math.max(this.minInterval, interval);

    // 초기 실행
    this.executeCallback(callback);

    // 주기적 실행
    this.intervalId = setInterval(() => {
      // 브라우저가 활성 상태이고, 최소 간격이 지났을 때만 실행
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - this.lastFetchTime >= this.currentInterval) {
          this.executeCallback(callback);
        }
      }
    }, this.currentInterval);

    // 유휴 시간 체크 (사용자 활동 감지)
    this.startIdleCheck(callback);
  }

  private executeCallback(callback: () => void) {
    this.lastFetchTime = Date.now();
    callback();
  }

  private startIdleCheck(callback: () => void) {
    let lastActivity = Date.now();

    const resetIdleTime = () => {
      lastActivity = Date.now();
      this.idleTime = 0;

      // 활동 감지시 간격을 짧게
      if (this.currentInterval > this.minInterval) {
        this.currentInterval = this.minInterval;
        this.restart(callback, this.currentInterval);
      }
    };

    // 사용자 활동 감지
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTime, { passive: true });
    });

    // 유휴 시간 체크 (10초마다)
    this.idleCheckInterval = setInterval(() => {
      const now = Date.now();
      this.idleTime = now - lastActivity;

      // 1분 이상 유휴시 간격을 늘림
      if (this.idleTime > 60000 && this.currentInterval < this.maxInterval) {
        this.currentInterval = Math.min(this.currentInterval * 2, this.maxInterval);
        this.restart(callback, this.currentInterval);
      }
    }, 10000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
    this.isPolling = false;

    // 이벤트 리스너 제거
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.removeEventListener(event, () => {});
    });
  }

  restart(callback: () => void, interval: number = 30000) {
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
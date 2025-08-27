import React from 'react';
import { SubscriptionProductDetail } from '@/types/product';

interface SubscriptionProductInfoProps {
  detail: SubscriptionProductDetail;
}

/**
 * 구독 상품 상세 정보를 표시하는 컴포넌트
 * @param {SubscriptionProductInfoProps} props - 구독 상품 상세 정보
 * @returns {JSX.Element} 구독 상품 상세 정보 컴포넌트
 * 
 * @example
 * <SubscriptionProductInfo detail={product.subscription_detail} />
 */
const SubscriptionProductInfo: React.FC<SubscriptionProductInfoProps> = ({ detail }) => {
  /**
   * 과금 주기를 한글로 변환
   * @param {string} cycle - 과금 주기 영문
   * @returns {string} 과금 주기 한글
   */
  const getBillingCycleText = (cycle: string): string => {
    switch (cycle) {
      case 'monthly':
        return '월간';
      case 'quarterly':
        return '분기(3개월)';
      case 'yearly':
        return '연간';
      default:
        return cycle;
    }
  };

  return (
    <div className="subscription-product-info space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="info-item">
          <span className="text-gray-500 text-sm">과금 주기:</span>
          <span className="font-medium ml-2">{getBillingCycleText(detail.billing_cycle)}</span>
        </div>
        
        <div className="info-item">
          <span className="text-gray-500 text-sm">자동 갱신:</span>
          <span className="font-medium ml-2">
            {detail.auto_renewal ? (
              <span className="text-blue-600">예</span>
            ) : (
              <span className="text-gray-600">아니오</span>
            )}
          </span>
        </div>
      </div>
      
      {detail.free_trial_days > 0 && (
        <div className="free-trial bg-green-50 p-3 rounded-md">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold text-green-700">
              {detail.free_trial_days}일 무료 체험
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionProductInfo;

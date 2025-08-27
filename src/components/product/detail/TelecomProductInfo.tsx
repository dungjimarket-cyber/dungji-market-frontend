import React from 'react';
import { TelecomProductDetail } from '@/types/product';
import { getPlanDisplay } from '@/lib/telecom-utils';

interface TelecomProductInfoProps {
  detail: TelecomProductDetail;
}

/**
 * 통신 상품 상세 정보를 표시하는 컴포넌트
 * @param {TelecomProductInfoProps} props - 통신 상품 상세 정보
 * @returns {JSX.Element} 통신 상품 상세 정보 컴포넌트
 * 
 * @example
 * <TelecomProductInfo detail={product.telecom_detail} />
 */
const TelecomProductInfo: React.FC<TelecomProductInfoProps> = ({ detail }) => {
  // 통신사별 색상 설정
  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case 'SKT':
        return 'text-red-600';
      case 'KT':
        return 'text-blue-600';
      case 'LGU':
        return 'text-red-400';
      default:
        return 'text-gray-600';
    }
  };

  // 가입 유형별 스타일 설정
  const getRegistrationTypeStyle = (type: string) => {
    switch (type) {
      case 'MNP':
        return 'bg-blue-100 text-blue-800';
      case 'NEW':
        return 'bg-green-100 text-green-800';
      case 'CHANGE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 가입 유형 한글 텍스트 반환
  const getRegistrationTypeText = (type: string) => {
    switch (type) {
      case 'MNP':
        return '번호이동';
      case 'NEW':
        return '신규가입';
      case 'CHANGE':
        return '기기변경';
      default:
        return type;
    }
  };

  /**
   * 지원금 마스킹 함수
   * @param {number} amount - 지원금 액수
   * @returns {string} 마스킹된 지원금 텍스트
   */
  const maskSupportAmount = (amount: number): string => {
    const amountStr = amount.toString();
    if (amountStr.length <= 2) return amountStr;
    return `${amountStr[0]}${'*'.repeat(amountStr.length - 2)}${amountStr[amountStr.length - 1]}`;
  };

  return (
    <div className="telecom-product-info space-y-3">
      <div className="flex justify-between items-center">
        <div className={`font-semibold ${getCarrierColor(detail.carrier)}`}>
          통신사: {detail.carrier}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs ${getRegistrationTypeStyle(detail.registration_type)}`}>
          {getRegistrationTypeText(detail.registration_type)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="info-item">
          <span className="text-gray-500 text-sm">요금제:</span>
          <span className="font-medium">{getPlanDisplay(detail.plan_info)}</span>
        </div>
        <div className="info-item">
          <span className="text-gray-500 text-sm">약정:</span>
          <span className="font-medium">{detail.contract_info}</span>
        </div>
      </div>
      
      <div className="total-support">
        <span className="text-gray-500 text-sm">총 지원금:</span>
        <span className="font-bold text-red-500">
          {maskSupportAmount(detail.total_support_amount)}원
        </span>
      </div>
    </div>
  );
};

export default TelecomProductInfo;

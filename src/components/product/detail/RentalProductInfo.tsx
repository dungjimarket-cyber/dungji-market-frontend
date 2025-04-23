import React from 'react';
import { RentalProductDetail } from '@/types/product';

interface RentalProductInfoProps {
  detail: RentalProductDetail;
}

/**
 * 렌탈 상품 상세 정보를 표시하는 컴포넌트
 * @param {RentalProductInfoProps} props - 렌탈 상품 상세 정보
 * @returns {JSX.Element} 렌탈 상품 상세 정보 컴포넌트
 * 
 * @example
 * <RentalProductInfo detail={product.rental_detail} />
 */
const RentalProductInfo: React.FC<RentalProductInfoProps> = ({ detail }) => {
  return (
    <div className="rental-product-info space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">월 렌탈료:</span>
        <span className="font-bold text-lg">₩{detail.monthly_fee.toLocaleString()}원</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="info-item">
          <span className="text-gray-500 text-sm">보증금:</span>
          <span className="font-medium ml-2">₩{detail.deposit_amount.toLocaleString()}원</span>
        </div>
        
        {detail.maintenance_info && (
          <div className="info-item">
            <span className="text-gray-500 text-sm">A/S 정보:</span>
            <span className="font-medium ml-2">{detail.maintenance_info}</span>
          </div>
        )}
      </div>
      
      {detail.rental_period_options && detail.rental_period_options.length > 0 && (
        <div className="rental-options mt-4">
          <h4 className="text-sm font-semibold mb-2">계약 기간 옵션</h4>
          <div className="flex flex-wrap gap-2">
            {detail.rental_period_options.map((option, index) => (
              <div 
                key={index} 
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {option.period}개월 
                {option.discount_rate ? 
                  <span className="text-red-500 ml-1">({option.discount_rate}% 할인)</span> : 
                  null
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalProductInfo;

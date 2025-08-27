import React from 'react';
import { StandardProductDetail } from '@/types/product';

interface StandardProductInfoProps {
  detail: StandardProductDetail;
}

/**
 * 일반 상품 상세 정보를 표시하는 컴포넌트
 * @param {StandardProductInfoProps} props - 일반 상품 상세 정보
 * @returns {JSX.Element} 일반 상품 상세 정보 컴포넌트
 * 
 * @example
 * <StandardProductInfo detail={product.standard_detail} />
 */
const StandardProductInfo: React.FC<StandardProductInfoProps> = ({ detail }) => {
  return (
    <div className="standard-product-info space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {detail.brand && (
          <div className="info-item">
            <span className="text-gray-500 text-sm">브랜드:</span>
            <span className="font-medium ml-2">{detail.brand}</span>
          </div>
        )}
        
        {detail.origin && (
          <div className="info-item">
            <span className="text-gray-500 text-sm">원산지:</span>
            <span className="font-medium ml-2">{detail.origin}</span>
          </div>
        )}
      </div>
      
      <div className="shipping-info mt-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">배송비:</span>
          <span className="font-medium">
            {detail.shipping_fee > 0 
              ? `₩${detail.shipping_fee.toLocaleString()}원` 
              : '무료배송'}
          </span>
        </div>
        
        {detail.shipping_info && (
          <div className="mt-2 text-sm text-gray-600">
            {detail.shipping_info}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandardProductInfo;

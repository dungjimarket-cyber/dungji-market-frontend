import React from 'react';
import { ElectronicsProductDetail } from '@/types/product';

interface ElectronicsProductInfoProps {
  detail: ElectronicsProductDetail;
}

/**
 * 가전 제품 상세 정보를 표시하는 컴포넌트
 * @param {ElectronicsProductInfoProps} props - 가전 제품 상세 정보
 * @returns {JSX.Element} 가전 제품 상세 정보 컴포넌트
 * 
 * @example
 * <ElectronicsProductInfo detail={product.electronics_detail} />
 */
const ElectronicsProductInfo: React.FC<ElectronicsProductInfoProps> = ({ detail }) => {
  return (
    <div className="electronics-product-info space-y-3">
      <div className="manufacturer">
        <span className="text-gray-500 text-sm">제조사:</span>
        <span className="font-medium ml-2">{detail.manufacturer}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="info-item">
          <span className="text-gray-500 text-sm">보증기간:</span>
          <span className="font-medium ml-2">{detail.warranty_period}개월</span>
        </div>
        
        {detail.power_consumption && (
          <div className="info-item">
            <span className="text-gray-500 text-sm">소비전력:</span>
            <span className="font-medium ml-2">{detail.power_consumption}</span>
          </div>
        )}
        
        {detail.dimensions && (
          <div className="info-item">
            <span className="text-gray-500 text-sm">제품 크기:</span>
            <span className="font-medium ml-2">{detail.dimensions}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectronicsProductInfo;

import React from 'react';
import { ProductDetail } from '@/types/product';
import TelecomProductInfo from './detail/TelecomProductInfo';
import ElectronicsProductInfo from './detail/ElectronicsProductInfo';
import RentalProductInfo from './detail/RentalProductInfo';
import SubscriptionProductInfo from './detail/SubscriptionProductInfo';
import StandardProductInfo from './detail/StandardProductInfo';
import CustomFieldsDisplay from './detail/CustomFieldsDisplay';

interface ProductDetailProps {
  product: ProductDetail;
}

/**
 * 상품 상세 정보를 표시하는 컴포넌트
 * 카테고리 유형에 따라 다른 상세 정보를 표시함
 */
const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product }) => {
  // 카테고리별 상세 정보 컴포넌트 렌더링
  const renderCategoryDetail = () => {
    const detailType = product.category_detail_type;
    
    switch (detailType) {
      case 'telecom':
        return product.telecom_detail ? (
          <TelecomProductInfo detail={product.telecom_detail} />
        ) : null;
      case 'electronics':
        return product.electronics_detail ? (
          <ElectronicsProductInfo detail={product.electronics_detail} />
        ) : null;
      case 'rental':
        return product.rental_detail ? (
          <RentalProductInfo detail={product.rental_detail} />
        ) : null;
      case 'subscription':
        return product.subscription_detail ? (
          <SubscriptionProductInfo detail={product.subscription_detail} />
        ) : null;
      default:
        return product.standard_detail ? (
          <StandardProductInfo detail={product.standard_detail} />
        ) : null;
    }
  };

  return (
    <div className="product-detail">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      <div className="product-image mb-4">
        <img src={product.image_url} alt={product.name} className="w-full rounded-lg" />
      </div>
      
      <div className="product-info">
        <div className="basic-info mb-4">
          <p className="text-gray-600">{product.category_name}</p>
          <p className="text-xl font-semibold">₩{product.base_price.toLocaleString()}</p>
          <p className="my-2">{product.description}</p>
        </div>
        
        {/* 카테고리별 상세 정보 */}
        <div className="category-detail mb-4 border-t border-b py-4">
          {renderCategoryDetail()}
        </div>
        
        {/* 커스텀 필드 값 표시 */}
        {product.custom_values && product.custom_values.length > 0 && (
          <div className="custom-fields mb-4">
            <h3 className="text-lg font-semibold mb-2">추가 정보</h3>
            <CustomFieldsDisplay values={product.custom_values} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailComponent;

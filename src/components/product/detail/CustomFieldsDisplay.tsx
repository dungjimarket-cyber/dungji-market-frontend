import React from 'react';
import { ProductCustomValue } from '@/types/product';

interface CustomFieldsDisplayProps {
  values: ProductCustomValue[];
}

/**
 * 상품 커스텀 필드 값을 표시하는 컴포넌트
 * @param {CustomFieldsDisplayProps} props - 커스텀 필드 값 목록
 * @returns {JSX.Element} 커스텀 필드 표시 컴포넌트
 * 
 * @example
 * <CustomFieldsDisplay values={product.custom_values} />
 */
const CustomFieldsDisplay: React.FC<CustomFieldsDisplayProps> = ({ values }) => {
  /**
   * 필드 유형에 따라 값을 포맷팅
   * @param {ProductCustomValue} field - 커스텀 필드 값 객체
   * @returns {string | React.ReactNode} 포맷팅된 필드 값
   */
  const formatFieldValue = (field: ProductCustomValue): string | React.ReactNode => {
    switch (field.field_type) {
      case 'text':
        return field.text_value || '-';
      case 'number':
        return field.number_value?.toLocaleString() || '-';
      case 'boolean':
        return field.boolean_value ? (
          <span className="text-green-600">예</span>
        ) : (
          <span className="text-gray-600">아니오</span>
        );
      case 'date':
        return field.date_value ? new Date(field.date_value).toLocaleDateString() : '-';
      default:
        return field.text_value || '-';
    }
  };

  return (
    <div className="custom-fields-display grid grid-cols-2 gap-x-4 gap-y-2">
      {values.map((field, index) => (
        <div key={index} className="field-item">
          <span className="text-gray-500 text-sm">{field.field_label}:</span>
          <span className="font-medium ml-2">{formatFieldValue(field)}</span>
        </div>
      ))}
    </div>
  );
};

export default CustomFieldsDisplay;

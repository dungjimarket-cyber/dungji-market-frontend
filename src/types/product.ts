// 상품 기본 타입
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: number;
  category_name: string;
  category_detail_type: string;
  product_type: string;
  base_price: number;
  image_url: string;
  is_available: boolean;
  release_date?: string;
  attributes: Record<string, any>;
  active_groupbuy?: {
    id: number;
    status: string;
    current_participants: number;
    max_participants: number;
  };
}

// 통신 상품 상세 정보
export interface TelecomProductDetail {
  carrier: string;
  registration_type: string;
  plan_info: string;
  contract_info: string;
  total_support_amount: number;
}

// 가전 상품 상세 정보
export interface ElectronicsProductDetail {
  manufacturer: string;
  warranty_period: number;
  power_consumption?: string;
  dimensions?: string;
}

// 렌탈 상품 상세 정보
export interface RentalProductDetail {
  rental_period_options: any[];
  maintenance_info?: string;
  deposit_amount: number;
  monthly_fee: number;
}

// 구독 상품 상세 정보
export interface SubscriptionProductDetail {
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  auto_renewal: boolean;
  free_trial_days: number;
}

// 일반 상품 상세 정보
export interface StandardProductDetail {
  brand?: string;
  origin?: string;
  shipping_fee: number;
  shipping_info?: string;
}

// 커스텀 필드 값
export interface ProductCustomValue {
  field_name: string;
  field_label: string;
  field_type: string;
  text_value?: string;
  number_value?: number;
  boolean_value?: boolean;
  date_value?: string;
}

// 통합 상품 상세 정보
export interface ProductDetail extends Product {
  telecom_detail?: TelecomProductDetail;
  electronics_detail?: ElectronicsProductDetail;
  rental_detail?: RentalProductDetail;
  subscription_detail?: SubscriptionProductDetail;
  standard_detail?: StandardProductDetail;
  custom_values?: ProductCustomValue[];
}

// 커스텀 필드 정의
export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date';
  required: boolean;
  options?: Array<{value: string, label: string}>;
}

// 카테고리 필드 정보
export interface CategoryFields {
  id: number;
  name: string;
  detail_type: string;
  required_fields: Record<string, any>;
  detail_fields: CustomField[];
  custom_fields: CustomField[];
}

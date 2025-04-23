import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, CategoryFields, CustomField } from '@/types/product';

interface ProductFormProps {
  initialData?: Product;
  isEdit?: boolean;
}

/**
 * 상품 등록/수정 폼 컴포넌트
 * 카테고리 선택에 따라 동적으로 필드 표시
 * 
 * @param {ProductFormProps} props - 상품 폼 속성
 * @returns {JSX.Element} 상품 등록/수정 폼
 * 
 * @example
 * <ProductForm isEdit={false} />
 * <ProductForm initialData={product} isEdit={true} />
 */
const ProductForm: React.FC<ProductFormProps> = ({ initialData, isEdit = false }) => {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFields, setCategoryFields] = useState<CategoryFields | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    category: '',
    base_price: '',
    release_date: '',
    is_available: true,
    ...initialData
  });

  // 선택된 카테고리 ID
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialData?.category || null
  );

  // 카테고리 목록 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories/');
        if (!response.ok) throw new Error('카테고리 로드 실패');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError('카테고리를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 선택된 카테고리의 필드 정보 로드
  useEffect(() => {
    if (!selectedCategoryId) return;

    const fetchCategoryFields = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/categories/${selectedCategoryId}/fields/`);
        if (!response.ok) throw new Error('카테고리 필드 로드 실패');
        const data = await response.json();
        setCategoryFields(data);
      } catch (err) {
        setError('카테고리 필드 정보를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryFields();
  }, [selectedCategoryId]);

  /**
   * 폼 입력 값 변경 처리
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - 이벤트 객체
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else if (name === 'category') {
      const categoryId = parseInt(value);
      setSelectedCategoryId(categoryId);
      setFormData({ ...formData, [name]: categoryId });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  /**
   * 카테고리 상세 정보 입력 값 변경 처리
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - 이벤트 객체
   * @param {string} detailType - 상세 정보 타입 (telecom, electronics 등)
   */
  const handleDetailInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    detailType: string
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [detailType]: {
          ...formData[detailType],
          [name]: target.checked
        }
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [detailType]: {
          ...formData[detailType],
          [name]: parseInt(value)
        }
      });
    } else {
      setFormData({
        ...formData,
        [detailType]: {
          ...formData[detailType],
          [name]: value
        }
      });
    }
  };

  /**
   * 커스텀 필드 입력 값 변경 처리
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - 이벤트 객체
   * @param {CustomField} field - 커스텀 필드 정보
   */
  const handleCustomFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    field: CustomField
  ) => {
    const { name, value, type } = e.target;
    let fieldValue: any = value;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      fieldValue = target.checked;
    } else if (field.type === 'number') {
      fieldValue = value ? parseInt(value) : null;
    } else if (field.type === 'select') {
      fieldValue = value;
    }
    
    setFormData({
      ...formData,
      custom_values: {
        ...formData.custom_values,
        [name]: {
          field_name: name,
          field_label: field.label,
          field_type: field.type,
          [field.type === 'text' || field.type === 'select' ? 'text_value' : 
           field.type === 'number' ? 'number_value' : 
           field.type === 'boolean' ? 'boolean_value' : 
           field.type === 'date' ? 'date_value' : 'text_value']: fieldValue
        }
      }
    });
  };

  /**
   * 폼 제출 처리
   * @param {React.FormEvent} e - 이벤트 객체
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // 폼 데이터 구성
      const dataToSend = {
        ...formData,
        custom_values: formData.custom_values ? 
          Object.values(formData.custom_values) : []
      };
      
      // API 엔드포인트 및 HTTP 메서드 설정
      const url = isEdit ? 
        `/api/products/${initialData?.id}/` : 
        '/api/products/';
      const method = isEdit ? 'PATCH' : 'POST';
      
      // API 요청
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '상품 저장에 실패했습니다');
      }
      
      // 성공시 상품 목록 페이지로 이동
      router.push('/products');
      
    } catch (err: any) {
      setError(err.message || '상품을 저장하는데 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 카테고리 유형에 맞는 상세 정보 폼 필드 렌더링
   * @returns {JSX.Element | null} 카테고리 상세 정보 폼
   */
  const renderCategoryDetailFields = () => {
    if (!categoryFields || !categoryFields.detail_type) return null;
    
    const detailType = categoryFields.detail_type;
    const detailKeyMap: Record<string, string> = {
      'telecom': 'telecom_detail',
      'electronics': 'electronics_detail',
      'rental': 'rental_detail',
      'subscription': 'subscription_detail',
      'standard': 'standard_detail'
    };
    
    const detailKey = detailKeyMap[detailType] || 'standard_detail';
    
    // 상세 정보 초기화 (폼 데이터에 없는 경우)
    if (!formData[detailKey]) {
      setFormData({
        ...formData,
        [detailKey]: {}
      });
    }
    
    // 카테고리 유형별 상세 정보 필드 렌더링
    switch (detailType) {
      case 'telecom':
        return (
          <div className="detail-fields mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">통신 상품 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="carrier" className="block text-sm font-medium text-gray-700">
                  통신사 <span className="text-red-500">*</span>
                </label>
                <select
                  id="carrier"
                  name="carrier"
                  value={formData.telecom_detail?.carrier || ''}
                  onChange={(e) => handleDetailInputChange(e, 'telecom_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">통신사 선택</option>
                  <option value="SKT">SKT</option>
                  <option value="KT">KT</option>
                  <option value="LGU">LGU+</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="registration_type" className="block text-sm font-medium text-gray-700">
                  가입 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  id="registration_type"
                  name="registration_type"
                  value={formData.telecom_detail?.registration_type || ''}
                  onChange={(e) => handleDetailInputChange(e, 'telecom_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">가입 유형 선택</option>
                  <option value="MNP">번호이동</option>
                  <option value="NEW">신규가입</option>
                  <option value="CHANGE">기기변경</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="plan_info" className="block text-sm font-medium text-gray-700">
                  요금제 정보 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="plan_info"
                  name="plan_info"
                  value={formData.telecom_detail?.plan_info || ''}
                  onChange={(e) => handleDetailInputChange(e, 'telecom_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contract_info" className="block text-sm font-medium text-gray-700">
                  계약 정보 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contract_info"
                  name="contract_info"
                  value={formData.telecom_detail?.contract_info || ''}
                  onChange={(e) => handleDetailInputChange(e, 'telecom_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="form-group col-span-2">
                <label htmlFor="total_support_amount" className="block text-sm font-medium text-gray-700">
                  총 지원금 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="total_support_amount"
                  name="total_support_amount"
                  value={formData.telecom_detail?.total_support_amount || ''}
                  onChange={(e) => handleDetailInputChange(e, 'telecom_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          </div>
        );
      case 'electronics':
        return (
          <div className="detail-fields mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">가전 제품 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                  제조사 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.electronics_detail?.manufacturer || ''}
                  onChange={(e) => handleDetailInputChange(e, 'electronics_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="warranty_period" className="block text-sm font-medium text-gray-700">
                  보증 기간(개월) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="warranty_period"
                  name="warranty_period"
                  value={formData.electronics_detail?.warranty_period || ''}
                  onChange={(e) => handleDetailInputChange(e, 'electronics_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="power_consumption" className="block text-sm font-medium text-gray-700">
                  소비 전력
                </label>
                <input
                  type="text"
                  id="power_consumption"
                  name="power_consumption"
                  value={formData.electronics_detail?.power_consumption || ''}
                  onChange={(e) => handleDetailInputChange(e, 'electronics_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">
                  제품 크기
                </label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  value={formData.electronics_detail?.dimensions || ''}
                  onChange={(e) => handleDetailInputChange(e, 'electronics_detail')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        );
      // 다른 카테고리 유형들도 비슷한 방식으로 구현 가능
      default:
        return null;
    }
  };

  /**
   * 커스텀 필드 입력 폼 렌더링
   * @returns {JSX.Element | null} 커스텀 필드 입력 폼
   */
  const renderCustomFields = () => {
    if (!categoryFields || !categoryFields.custom_fields || categoryFields.custom_fields.length === 0) {
      return null;
    }

    return (
      <div className="custom-fields mt-6 border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">추가 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          {categoryFields.custom_fields.map((field, index) => {
            // 필드 초기화
            if (!formData.custom_values || !formData.custom_values[field.name]) {
              setFormData((prev: any) => ({
                ...prev,
                custom_values: {
                  ...prev.custom_values,
                  [field.name]: {
                    field_name: field.name,
                    field_label: field.label,
                    field_type: field.type,
                  }
                }
              }));
            }

            const fieldValue = formData.custom_values?.[field.name];
            // 필드 타입별 값 추출
            const textValue = fieldValue?.text_value || '';
            const numberValue = fieldValue?.number_value?.toString() || '';
            const booleanValue = fieldValue?.boolean_value === true;
            const dateValue = fieldValue?.date_value || '';
            
            return (
              <div key={index} className="form-group">
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                
                {field.type === 'text' && (
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={textValue}
                    onChange={(e) => handleCustomFieldChange(e, field)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required={field.required}
                  />
                )}
                
                {field.type === 'number' && (
                  <input
                    type="number"
                    id={field.name}
                    name={field.name}
                    value={numberValue}
                    onChange={(e) => handleCustomFieldChange(e, field)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required={field.required}
                  />
                )}
                
                {field.type === 'boolean' && (
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      id={field.name}
                      name={field.name}
                      checked={booleanValue}
                      onChange={(e) => handleCustomFieldChange(e, field)}
                      className="mr-2"
                      required={field.required}
                    />
                    <label htmlFor={field.name} className="text-sm text-gray-600">
                      {field.label}
                    </label>
                  </div>
                )}
                
                {field.type === 'select' && (
                  <select
                    id={field.name}
                    name={field.name}
                    value={textValue}
                    onChange={(e) => handleCustomFieldChange(e, field)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required={field.required}
                  >
                    <option value="">선택해주세요</option>
                    {field.options?.map((option, idx) => (
                      <option key={idx} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {field.type === 'date' && (
                  <input
                    type="date"
                    id={field.name}
                    name={field.name}
                    value={dateValue}
                    onChange={(e) => handleCustomFieldChange(e, field)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required={field.required}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading && !initialData) {
    return <div className="text-center py-10">로딩 중...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="product-form space-y-6 max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? '상품 정보 수정' : '새 상품 등록'}
      </h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* 상품 기본 정보 */}
      <div className="basic-info">
        <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              상품명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="form-group col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              상품 설명
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">카테고리 선택</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="base_price" className="block text-sm font-medium text-gray-700">
              기본 가격 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="base_price"
              name="base_price"
              value={formData.base_price}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="release_date" className="block text-sm font-medium text-gray-700">
              출시일
            </label>
            <input
              type="date"
              id="release_date"
              name="release_date"
              value={formData.release_date}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="form-group flex items-center">
            <input
              type="checkbox"
              id="is_available"
              name="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({
                ...formData,
                is_available: e.target.checked
              })}
              className="mr-2"
            />
            <label htmlFor="is_available" className="text-sm text-gray-700">
              판매 가능 상태
            </label>
          </div>
        </div>
      </div>
      
      {/* 카테고리별 상세 정보 필드 */}
      {selectedCategoryId && renderCategoryDetailFields()}
      
      {/* 커스텀 필드 */}
      {selectedCategoryId && renderCustomFields()}
      
      <div className="form-actions flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
            loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {loading ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;

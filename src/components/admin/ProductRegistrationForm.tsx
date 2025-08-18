'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface ProductRegistrationFormProps {
  onSuccess?: () => void;
}

export function ProductRegistrationForm({ onSuccess }: ProductRegistrationFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category: '',
    detail_type: 'internet', // 기본값 인터넷
    // 인터넷 관련 필드
    carrier: '',
    speed: '',
    subscription_type: '',
    monthly_fee: '',
    installation_fee: '',
    has_tv: false,
    tv_channels: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.detail_type) {
      toast({
        title: '오류',
        description: '필수 항목을 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('dungji_auth_token');
      
      // 상품 데이터 준비
      const productData: any = {
        name: formData.name,
        description: formData.description,
        base_price: formData.base_price ? parseFloat(formData.base_price) : 0,
        category_name: formData.category,
        category_detail_type: formData.detail_type,
      };

      // 인터넷/인터넷+TV 상품인 경우 추가 정보
      if (formData.detail_type === 'internet' || formData.detail_type === 'internet_tv') {
        // 상품명에 속도와 통신사 정보 포함
        if (formData.speed && formData.carrier) {
          productData.name = `${formData.carrier} ${formData.speed} ${formData.subscription_type === 'new' ? '신규' : '통신사이동'}`;
        }
        
        // 추가 정보를 JSON 필드나 별도 테이블에 저장할 수 있도록 준비
        productData.extra_data = {
          carrier: formData.carrier,
          speed: formData.speed,
          subscription_type: formData.subscription_type,
          monthly_fee: formData.monthly_fee,
          installation_fee: formData.installation_fee,
          has_tv: formData.detail_type === 'internet_tv',
          tv_channels: formData.tv_channels,
        };
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || '상품 등록에 실패했습니다.');
      }

      toast({
        title: '성공',
        description: '상품이 성공적으로 등록되었습니다.',
      });

      // 폼 초기화
      setFormData({
        name: '',
        description: '',
        base_price: '',
        category: '',
        detail_type: 'internet',
        carrier: '',
        speed: '',
        subscription_type: '',
        monthly_fee: '',
        installation_fee: '',
        has_tv: false,
        tv_channels: '',
      });

      // 성공 콜백 호출
      onSuccess?.();
    } catch (error) {
      console.error('상품 등록 오류:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '상품 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 카테고리 선택 */}
        <div className="space-y-2">
          <Label htmlFor="category">카테고리*</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="휴대폰">휴대폰</SelectItem>
              <SelectItem value="인터넷">인터넷</SelectItem>
              <SelectItem value="인터넷+TV">인터넷+TV</SelectItem>
              <SelectItem value="가전">가전</SelectItem>
              <SelectItem value="렌탈">렌탈</SelectItem>
              <SelectItem value="구독">구독</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 세부 타입 선택 */}
        <div className="space-y-2">
          <Label htmlFor="detail_type">세부 타입*</Label>
          <Select
            value={formData.detail_type}
            onValueChange={(value) => setFormData({ ...formData, detail_type: value })}
          >
            <SelectTrigger id="detail_type">
              <SelectValue placeholder="세부 타입 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="telecom">통신(휴대폰)</SelectItem>
              <SelectItem value="internet">인터넷</SelectItem>
              <SelectItem value="internet_tv">인터넷+TV</SelectItem>
              <SelectItem value="electronics">가전</SelectItem>
              <SelectItem value="rental">렌탈</SelectItem>
              <SelectItem value="subscription">구독</SelectItem>
              <SelectItem value="none">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 인터넷/인터넷+TV 관련 필드 */}
      {(formData.detail_type === 'internet' || formData.detail_type === 'internet_tv') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 통신사 선택 */}
            <div className="space-y-2">
              <Label htmlFor="carrier">통신사*</Label>
              <Select
                value={formData.carrier}
                onValueChange={(value) => setFormData({ ...formData, carrier: value })}
              >
                <SelectTrigger id="carrier">
                  <SelectValue placeholder="통신사 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KT">KT</SelectItem>
                  <SelectItem value="SK">SK브로드밴드</SelectItem>
                  <SelectItem value="LGU">LG U+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 속도 선택 */}
            <div className="space-y-2">
              <Label htmlFor="speed">속도*</Label>
              <Select
                value={formData.speed}
                onValueChange={(value) => setFormData({ ...formData, speed: value })}
              >
                <SelectTrigger id="speed">
                  <SelectValue placeholder="속도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100M">100M</SelectItem>
                  <SelectItem value="500M">500M</SelectItem>
                  <SelectItem value="1G">1G</SelectItem>
                  <SelectItem value="2.5G">2.5G</SelectItem>
                  <SelectItem value="5G">5G</SelectItem>
                  <SelectItem value="10G">10G</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 가입유형 선택 */}
            <div className="space-y-2">
              <Label htmlFor="subscription_type">가입유형*</Label>
              <Select
                value={formData.subscription_type}
                onValueChange={(value) => setFormData({ ...formData, subscription_type: value })}
              >
                <SelectTrigger id="subscription_type">
                  <SelectValue placeholder="가입유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">신규가입</SelectItem>
                  <SelectItem value="transfer">통신사이동</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 월 이용료 */}
            <div className="space-y-2">
              <Label htmlFor="monthly_fee">월 이용료 (원)</Label>
              <Input
                id="monthly_fee"
                type="number"
                placeholder="예: 35000"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
              />
            </div>
          </div>

          {/* TV 채널 정보 (인터넷+TV일 경우) */}
          {formData.detail_type === 'internet_tv' && (
            <div className="space-y-2">
              <Label htmlFor="tv_channels">TV 채널 정보</Label>
              <Input
                id="tv_channels"
                placeholder="예: 기본 100채널 + 프리미엄 20채널"
                value={formData.tv_channels}
                onChange={(e) => setFormData({ ...formData, tv_channels: e.target.value })}
              />
            </div>
          )}

          {/* 설치비 */}
          <div className="space-y-2">
            <Label htmlFor="installation_fee">설치비 (원)</Label>
            <Input
              id="installation_fee"
              type="number"
              placeholder="예: 30000"
              value={formData.installation_fee}
              onChange={(e) => setFormData({ ...formData, installation_fee: e.target.value })}
            />
          </div>
        </>
      )}

      {/* 공통 필드 */}
      <div className="space-y-2">
        <Label htmlFor="name">상품명*</Label>
        <Input
          id="name"
          placeholder={
            formData.detail_type === 'internet' 
              ? "자동 생성됨 (예: KT 1G 신규)" 
              : "상품명을 입력하세요"
          }
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={formData.detail_type === 'internet' || formData.detail_type === 'internet_tv'}
        />
        {(formData.detail_type === 'internet' || formData.detail_type === 'internet_tv') && (
          <p className="text-sm text-gray-500">
            상품명은 선택한 옵션에 따라 자동으로 생성됩니다.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">상품 설명</Label>
        <Textarea
          id="description"
          placeholder="상품에 대한 자세한 설명을 입력하세요"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="base_price">기본 가격 (원)</Label>
        <Input
          id="base_price"
          type="number"
          placeholder="예: 50000"
          value={formData.base_price}
          onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
        />
        <p className="text-sm text-gray-500">
          지원금 계산의 기준이 되는 가격입니다.
        </p>
      </div>

      {/* 제출 버튼 */}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            등록 중...
          </>
        ) : (
          '상품 등록'
        )}
      </Button>
    </form>
  );
}
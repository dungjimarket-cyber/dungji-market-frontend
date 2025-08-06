'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save, Phone, Upload } from 'lucide-react';
import RegionDropdown from '@/components/address/RegionDropdown';
import { getSellerProfile, updateSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';
import { tokenUtils } from '@/lib/tokenUtils';
import { toast } from '@/components/ui/use-toast';

export default function SellerSettings() {
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
    addressProvince: '',
    addressCity: '',
    businessNumber1: '',
    businessNumber2: '',
    businessNumber3: '',
    isRemoteSales: false,
    businessRegFile: null as File | null
  });

  useEffect(() => {
    const loadSellerProfile = async () => {
      try {
        // JWT 토큰 확인
        const token = await tokenUtils.getAccessToken();
        if (!token) {
          router.push('/login?callbackUrl=/mypage/seller/settings');
          return;
        }

        // 판매자 프로필 정보 가져오기
        const data = await getSellerProfile();
        setProfile(data);
        
        // 폼 데이터 초기화
        const businessNumParts = (data.businessNumber || '').split('-');
        setFormData({
          nickname: data.nickname || data.username || '',
          phone: data.phone || '',
          addressProvince: '',
          addressCity: '',
          businessNumber1: businessNumParts[0] || '',
          businessNumber2: businessNumParts[1] || '',
          businessNumber3: businessNumParts[2] || '',
          isRemoteSales: data.isRemoteSales || false,
          businessRegFile: null
        });
        
        // address_region에서 시/도와 시/군/구 추출
        if (data.addressRegion) {
          const fullName = data.addressRegion.full_name || data.addressRegion.name || '';
          const parts = fullName.split(' ');
          
          // 세종특별자치시 특수 처리
          if (fullName === '세종특별자치시') {
            setFormData(prev => ({
              ...prev,
              addressProvince: '세종특별자치시',
              addressCity: '세종특별자치시'
            }));
          } else if (parts.length >= 2) {
            setFormData(prev => ({
              ...prev,
              addressProvince: parts[0],
              addressCity: parts[1]
            }));
          }
        }
      } catch (error) {
        console.error('판매자 프로필 로드 오류:', error);
        toast({
          variant: 'destructive',
          title: '프로필 로드 실패',
          description: '프로필 정보를 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSellerProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // API 호출을 위한 데이터 준비
      const businessNumber = `${formData.businessNumber1}-${formData.businessNumber2}-${formData.businessNumber3}`;
      const updateData: any = {
        nickname: formData.nickname,
        phone: formData.phone,
        business_number: businessNumber,
        is_remote_sales: formData.isRemoteSales
      };

      // 주소 정보 처리
      if (formData.addressProvince && formData.addressCity) {
        try {
          // 모든 지역 데이터 가져오기
          const regionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/`);
          const regionsData = await regionsResponse.json();
          
          // 시/군/구 레벨에서 일치하는 지역 찾기
          // 세종특별자치시는 특수한 경우로 level 1이면서 시/도와 시/군/구가 동일
          let cityRegion;
          
          if (formData.addressProvince === '세종특별자치시') {
            // 세종시는 특별한 처리 필요
            cityRegion = regionsData.find((r: any) => 
              r.level === 1 && 
              r.name === '세종특별자치시' &&
              r.full_name === '세종특별자치시'
            );
          } else {
            // 일반적인 시/도의 경우
            cityRegion = regionsData.find((r: any) => 
              (r.level === 1 || r.level === 2) && 
              r.name === formData.addressCity && 
              r.full_name.includes(formData.addressProvince)
            );
          }
          
          if (cityRegion) {
            updateData.address_region_id = cityRegion.code;
          } else {
            toast({
              variant: 'destructive',
              title: '지역 설정 오류',
              description: '선택한 지역을 찾을 수 없습니다.'
            });
            return;
          }
        } catch (err) {
          toast({
            variant: 'destructive',
            title: '지역 정보 오류',
            description: '지역 정보를 가져오는 중 오류가 발생했습니다.'
          });
          return;
        }
      }

      // 파일 업로드 처리
      if (formData.businessRegFile && formData.isRemoteSales) {
        const formDataWithFile = new FormData();
        Object.keys(updateData).forEach(key => {
          formDataWithFile.append(key, updateData[key]);
        });
        formDataWithFile.append('remote_sales_cert', formData.businessRegFile);
        
        // multipart/form-data로 전송
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/seller-profile/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await tokenUtils.getAccessToken()}`
          },
          body: formDataWithFile
        });
        
        if (!response.ok) {
          throw new Error('프로필 업데이트 실패');
        }
      } else {
        await updateSellerProfile(updateData);
      }
      
      toast({
        title: '저장 완료',
        description: '수정되었습니다'
      });
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      toast({
        variant: 'destructive',
        title: '프로필 저장 실패',
        description: '프로필 정보를 저장하는 중 오류가 발생했습니다.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push('/mypage/seller')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          뒤로가기
        </Button>
        <h1 className="text-2xl font-bold">판매자 설정</h1>
      </div>

          <Card>
            <CardHeader>
              <CardTitle>프로필 정보</CardTitle>
              <CardDescription>
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="nickname">닉네임 (상호명)</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="닉네임 또는 상호명을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    휴대폰번호(재인증)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="휴대폰 번호를 입력하세요 (예: 01012345678)"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm">
                      재인증
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">사업장주소/영업활동지역</Label>
                  <RegionDropdown
                    selectedProvince={formData.addressProvince}
                    selectedCity={formData.addressCity}
                    onSelect={(province, city) => {
                      setFormData(prev => ({
                        ...prev,
                        addressProvince: province,
                        addressCity: city
                      }));
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessNumber1">사업자등록번호</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="businessNumber1"
                      name="businessNumber1"
                      value={formData.businessNumber1}
                      onChange={handleChange}
                      placeholder="123"
                      maxLength={3}
                      className="flex-1"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      id="businessNumber2"
                      name="businessNumber2"
                      value={formData.businessNumber2}
                      onChange={handleChange}
                      placeholder="45"
                      maxLength={2}
                      className="flex-1"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      id="businessNumber3"
                      name="businessNumber3"
                      value={formData.businessNumber3}
                      onChange={handleChange}
                      placeholder="67890"
                      maxLength={5}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="remoteSales">비대면 판매가능 영업소 인증</Label>
                    <Switch
                      id="remoteSales"
                      checked={formData.isRemoteSales}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isRemoteSales: checked }))
                      }
                    />
                  </div>
                  {formData.isRemoteSales && (
                    <div className="mt-3 p-4 border rounded-lg bg-gray-50">
                      <Label htmlFor="businessRegFile" className="text-sm font-medium">비대면 판매가능 인증 파일 업로드</Label>
                      <div className="mt-2">
                        <Input
                          id="businessRegFile"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFormData(prev => ({ ...prev, businessRegFile: file }));
                          }}
                        />
                        {formData.businessRegFile && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ 파일 선택됨: {formData.businessRegFile.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          ※ 비대면 판매가 가능한 영업소 인증 서류를 업로드해주세요.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      저장하기
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
    </div>
  );
}

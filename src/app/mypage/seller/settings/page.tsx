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
import RegionDropdownWithCode from '@/components/address/RegionDropdownWithCode';
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
    addressCityCode: '',
    businessNumber1: '',
    businessNumber2: '',
    businessNumber3: '',
    isRemoteSales: false,
    businessRegFile: null as File | null
  });
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // formatPhoneNumber 함수를 먼저 정의
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 11자리 초과 방지
    if (numbers.length > 11) {
      return formData.phone;
    }
    
    // 포맷팅
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    
    return value;
  };

  // 전화번호 마스킹 함수
  const maskPhoneNumber = (phone: string) => {
    const numbers = phone.replace(/[^0-9]/g, '');
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-****-****`;
    } else if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-***-****`;
    }
    return phone;
  };

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
        
        // 휴대폰 번호 포맷팅
        const formattedPhone = data.phone ? formatPhoneNumber(data.phone) : '';
        const maskedPhoneDisplay = data.phone ? maskPhoneNumber(data.phone) : '';
        setMaskedPhone(maskedPhoneDisplay);
        
        // 사업자등록번호 파싱 - 하이픈이 없는 경우도 처리
        let businessNum1 = '';
        let businessNum2 = '';
        let businessNum3 = '';
        
        if (data.businessNumber) {
          const cleanBusinessNum = data.businessNumber.replace(/-/g, '');
          if (cleanBusinessNum.length === 10) {
            businessNum1 = cleanBusinessNum.slice(0, 3);
            businessNum2 = cleanBusinessNum.slice(3, 5);
            businessNum3 = cleanBusinessNum.slice(5, 10);
          } else {
            const businessNumParts = data.businessNumber.split('-');
            businessNum1 = businessNumParts[0] || '';
            businessNum2 = businessNumParts[1] || '';
            businessNum3 = businessNumParts[2] || '';
          }
        }
        
        setFormData({
          nickname: data.nickname || data.username || '',
          phone: formattedPhone,
          addressProvince: '',
          addressCity: '',
          addressCityCode: '',
          businessNumber1: businessNum1,
          businessNumber2: businessNum2,
          businessNumber3: businessNum3,
          isRemoteSales: data.isRemoteSales || false,
          businessRegFile: null
        });
        
        // address_region에서 시/도와 시/군/구 추출
        if (data.addressRegion) {
          const fullName = data.addressRegion.full_name || data.addressRegion.name || '';
          const parts = fullName.split(' ');
          const regionCode = data.addressRegion.code || '';
          
          // 세종특별자치시 특수 처리
          if (fullName === '세종특별자치시') {
            setFormData(prev => ({
              ...prev,
              addressProvince: '세종특별자치시',
              addressCity: '세종특별자치시',
              addressCityCode: regionCode
            }));
          } else if (parts.length >= 2) {
            const updateData = {
              addressProvince: parts[0],
              addressCity: parts[1],
              addressCityCode: regionCode
            };
            setFormData(prev => ({
              ...prev,
              ...updateData
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

  const checkNicknameDuplicate = async (nickname: string) => {
    if (!nickname || nickname === profile?.nickname) {
      setNicknameError('');
      return;
    }
    
    setCheckingNickname(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-nickname/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await tokenUtils.getAccessToken()}`
        },
        body: JSON.stringify({ nickname })
      });
      
      const data = await response.json();
      if (!data.available) {
        setNicknameError('이미 사용중인 닉네임입니다.');
      } else {
        setNicknameError('');
      }
    } catch (error) {
      console.error('닉네임 중복 확인 오류:', error);
    } finally {
      setCheckingNickname(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, phone: formatted }));
    } else if (name === 'nickname') {
      setFormData(prev => ({ ...prev, nickname: value }));
      // 디바운스를 위해 타이머 설정
      const timer = setTimeout(() => {
        checkNicknameDuplicate(value);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 닉네임 에러가 있으면 제출 방지
    if (nicknameError) {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '닉네임이 중복되었습니다. 다른 닉네임을 사용해주세요.'
      });
      return;
    }
    
    setSaving(true);

    try {
      // API 호출을 위한 데이터 준비
      const businessNumber = `${formData.businessNumber1}-${formData.businessNumber2}-${formData.businessNumber3}`;
      
      // 전화번호에서 하이픈 제거 (백엔드는 하이픈 없이 저장)
      const cleanPhone = formData.phone.replace(/-/g, '');
      
      const updateData: any = {
        nickname: formData.nickname,
        business_number: businessNumber,
        is_remote_sales: formData.isRemoteSales
      };
      
      // 전화번호가 변경된 경우에만 포함 (기존 전화번호와 비교)
      const originalPhone = profile?.phone?.replace(/-/g, '');
      if (cleanPhone !== originalPhone && cleanPhone) {
        updateData.phone = cleanPhone;
      }

      // 주소 정보 처리 - RegionDropdownWithCode에서 제공한 code 사용
      if (formData.addressProvince && formData.addressCityCode) {
        updateData.address_region_id = formData.addressCityCode;
      } else if (formData.addressProvince && formData.addressCity) {
        toast({
          variant: 'destructive', 
          title: '지역 설정 오류',
          description: '선택한 지역을 찾을 수 없습니다.'
        });
        return;
      }

      // 파일 업로드 처리
      let updateSuccess = false;
      
      if (formData.businessRegFile && formData.isRemoteSales) {
        const formDataWithFile = new FormData();
        Object.keys(updateData).forEach(key => {
          formDataWithFile.append(key, String(updateData[key]));
        });
        formDataWithFile.append('remote_sales_cert', formData.businessRegFile);
        
        // multipart/form-data로 전송
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/seller-profile/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await tokenUtils.getAccessToken()}`
            // Content-Type을 설정하지 않음 - FormData가 자동으로 설정
          },
          body: formDataWithFile
        });
        
        updateSuccess = response.ok;
        if (!response.ok) {
          throw new Error('프로필 업데이트 실패');
        }
      } else {
        const result = await updateSellerProfile(updateData);
        updateSuccess = !!result;
      }
      
      if (updateSuccess) {
        toast({
          title: '✅ 수정되었습니다',
          description: '판매자 정보가 성공적으로 저장되었습니다.',
          variant: 'default'
        });
        
        // 휴대폰 번호 수정 모드 종료
        setIsEditingPhone(false);
        
        // 프로필 정보 새로고침
        const updatedData = await getSellerProfile();
        setProfile(updatedData);
        
        // 마스킹된 전화번호 업데이트
        if (updatedData.phone) {
          setMaskedPhone(maskPhoneNumber(updatedData.phone));
        }
      }
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
                  <div className="relative">
                    <Input
                      id="nickname"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleChange}
                      placeholder="닉네임 또는 상호명을 입력하세요"
                      required
                      className={nicknameError ? 'border-red-500' : ''}
                    />
                    {checkingNickname && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                  {nicknameError && (
                    <p className="text-sm text-red-500 mt-1">{nicknameError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    휴대폰번호
                  </Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {isEditingPhone ? (
                      <>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="휴대폰 번호를 입력하세요 (예: 010-1234-5678)"
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setIsEditingPhone(false);
                            setMaskedPhone(maskPhoneNumber(formData.phone));
                          }}
                        >
                          취소
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          value={maskedPhone}
                          disabled
                          className="flex-1 bg-gray-50"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditingPhone(true)}
                        >
                          수정
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">사업장주소/영업활동지역</Label>
                  <RegionDropdownWithCode
                    selectedProvince={formData.addressProvince}
                    selectedCity={formData.addressCity}
                    selectedCityCode={formData.addressCityCode}
                    onSelect={(province, city, cityCode) => {
                      setFormData(prev => ({
                        ...prev,
                        addressProvince: province,
                        addressCity: city,
                        addressCityCode: cityCode
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

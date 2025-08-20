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
import { ArrowLeft, Loader2, Save, Phone, Upload, FileText, Trash2 } from 'lucide-react';
import RegionDropdown from '@/components/address/RegionDropdown';
import { getSellerProfile, updateSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';
import { tokenUtils } from '@/lib/tokenUtils';
import { useToast } from '@/hooks/use-toast';

export default function SellerSettings() {
  const router = useRouter();
  const { toast } = useToast();
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
    businessRegFile: null as File | null,
    existingCertification: null as string | null,
    deleteCertification: false
  });
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [remoteSalesStatus, setRemoteSalesStatus] = useState<any>(null);

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
        
        // 비대면 판매인증 상태 조회
        try {
          const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/remote-sales-status/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setRemoteSalesStatus(statusData);
          }
        } catch (err) {
          console.error('비대면 판매인증 상태 조회 실패:', err);
        }
        
        // 휴대폰 번호 포맷팅
        const formattedPhone = data.phone ? formatPhoneNumber(data.phone) : '';
        
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
          nickname: data.nickname || '',
          phone: formattedPhone,
          addressProvince: '',
          addressCity: '',
          businessNumber1: businessNum1,
          businessNumber2: businessNum2,
          businessNumber3: businessNum3,
          isRemoteSales: data.isRemoteSales || false,
          businessRegFile: null,
          existingCertification: data.remoteSalesCertification || null,
          deleteCertification: false
        });
        
        // address_region에서 시/도와 시/군/구 추출
        if (data.addressRegion) {
          const regionCode = data.addressRegion.code || '';
          const regionName = data.addressRegion.name || '';
          const fullName = data.addressRegion.full_name || '';
          
          console.log('주소 정보:', {
            code: regionCode,
            name: regionName,
            full_name: fullName
          });
          
          // 세종특별자치시 특수 처리
          if (fullName === '세종특별자치시' || regionName === '세종특별자치시') {
            setFormData(prev => ({
              ...prev,
              addressProvince: '세종특별자치시',
              addressCity: '세종특별자치시'
            }));
          } else {
            // full_name에서 시/도와 시/군/구 추출
            // 예: "경기도 안양시" -> ["경기도", "안양시"]
            const parts = fullName.split(' ').filter(part => part.length > 0);
            
            if (parts.length >= 2) {
              // 첫 번째 부분은 시/도
              const provinceName = parts[0];
              // 두 번째 부분은 시/군/구 (만강구, 동구 등의 경우 처리)
              const cityName = parts.length === 2 ? parts[1] : 
                              (parts[1].endsWith('시') || parts[1].endsWith('군') ? parts[1] : parts.slice(1).join(' '));
              
              console.log('주소 설정:', {
                provinceName,
                cityName,
                regionCode
              });
              
              setFormData(prev => ({
                ...prev,
                addressProvince: provinceName,
                addressCity: cityName
              }));
            } else if (regionName) {
              // full_name이 없거나 부족한 경우 name을 사용
              setFormData(prev => ({
                ...prev,
                addressProvince: '',
                addressCity: regionName
              }));
            }
          }
        }
      } catch (error) {
        console.error('판매자 프로필 로드 오류:', error);
        toast({
          variant: 'destructive',
          title: '오류',
          description: '프로필 정보를 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSellerProfile();
  }, [router]);

  const checkNicknameDuplicate = async () => {
    const nickname = formData.nickname;
    
    if (!nickname) {
      setNicknameError('닉네임을 입력해주세요.');
      setNicknameAvailable(false);
      return;
    }
    
    if (nickname === profile?.nickname) {
      setNicknameError('');
      setNicknameAvailable(true);
      return;
    }
    
    setCheckingNickname(true);
    setNicknameError('');
    
    try {
      const token = await tokenUtils.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-nickname/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ nickname })
      });
      
      const data = await response.json();
      if (!data.available) {
        setNicknameError('이미 사용중인 닉네임입니다.');
        setNicknameAvailable(false);
      } else {
        setNicknameError('');
        setNicknameAvailable(true);
        toast({
          title: '확인 완료',
          description: '사용 가능한 닉네임입니다'
        });
      }
    } catch (error) {
      console.error('닉네임 중복 확인 오류:', error);
      setNicknameError('중복 확인 중 오류가 발생했습니다.');
      setNicknameAvailable(false);
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
      setNicknameAvailable(false); // 닉네임 변경시 재확인 필요
      setNicknameError('');
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 닉네임 중복체크 확인
    if (formData.nickname !== profile?.nickname && !nicknameAvailable) {
      toast({
        variant: 'destructive',
        title: '확인 필요',
        description: '닉네임 중복체크를 해주세요.'
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

      // 주소 정보 처리 - 일반회원과 동일한 방식으로 처리
      if (formData.addressProvince && formData.addressCity) {
        try {
          // 모든 지역 데이터 가져오기
          const regionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/`);
          const regionsData = await regionsResponse.json();
          
          // 시/군/구 레벨에서 일치하는 지역 찾기
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
            // 백엔드는 code를 primary key로 사용하므로 code를 전송
            updateData.address_region_id = cityRegion.code;
          } else {
            toast({
              variant: 'destructive',
              title: '오류',
              description: '선택한 지역을 찾을 수 없습니다.'
            });
            return;
          }
        } catch (err) {
          toast({
            variant: 'destructive',
            title: '오류',
            description: '지역 정보를 가져오는 중 오류가 발생했습니다.'
          });
          return;
        }
      }

      // API 호출
      let updateSuccess = false;
      
      // 파일이 있는 경우 또는 비대면 판매 옵션이 켜진 경우 또는 삭제 요청이 있는 경우 FormData로 전송
      if (formData.businessRegFile || formData.isRemoteSales || formData.deleteCertification) {
        const formDataWithFile = new FormData();
        
        // 각 필드를 FormData에 추가
        formDataWithFile.append('nickname', updateData.nickname);
        formDataWithFile.append('business_number', updateData.business_number);
        formDataWithFile.append('is_remote_sales', String(updateData.is_remote_sales));
        
        if (updateData.phone) {
          formDataWithFile.append('phone', updateData.phone);
        }
        
        if (updateData.address_region_id) {
          formDataWithFile.append('address_region_id', updateData.address_region_id);
        }
        
        // 파일이 있는 경우 추가
        if (formData.businessRegFile) {
          formDataWithFile.append('remote_sales_certification', formData.businessRegFile);
        }
        
        // 삭제 요청이 있는 경우 추가
        if (formData.deleteCertification) {
          formDataWithFile.append('delete_remote_sales_certification', 'true');
        }
        
        // multipart/form-data로 전송
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/seller-profile/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await tokenUtils.getAccessToken()}`
            // Content-Type을 설정하지 않음 - FormData가 자동으로 설정
          },
          body: formDataWithFile
        });
        
        if (response.ok) {
          updateSuccess = true;
        } else {
          const errorText = await response.text();
          console.error('프로필 업데이트 실패:', errorText);
          throw new Error('프로필 업데이트 실패');
        }
      } else {
        // 파일이 없는 경우 JSON으로 전송
        const result = await updateSellerProfile(updateData);
        updateSuccess = !!result;
      }
      
      if (updateSuccess) {
        toast({
          title: '저장 완료',
          description: '판매자 정보가 성공적으로 저장되었습니다.'
        });
        
        // 프로필 정보 새로고침
        const updatedData = await getSellerProfile();
        setProfile(updatedData);
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      toast({
        variant: 'destructive',
        title: '저장 실패',
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
                {/* 아이디 표시 (수정 불가) */}
                <div className="space-y-2">
                  <Label>아이디</Label>
                  <Input
                    value={profile?.username || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">아이디는 변경할 수 없습니다</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">닉네임 (상호명)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="nickname"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        placeholder="닉네임 또는 상호명을 입력하세요"
                        required
                        className={nicknameError ? 'border-red-500' : nicknameAvailable ? 'border-green-500' : ''}
                      />
                      {checkingNickname && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={checkNicknameDuplicate}
                      disabled={checkingNickname || !formData.nickname}
                    >
                      중복체크
                    </Button>
                  </div>
                  {nicknameError && (
                    <p className="text-sm text-red-500 mt-1">{nicknameError}</p>
                  )}
                  {nicknameAvailable && !nicknameError && formData.nickname && (
                    <p className="text-sm text-green-600 mt-1">✓ 사용 가능한 닉네임입니다</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    휴대폰번호
                  </Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="휴대폰 번호를 입력하세요 (예: 010-1234-5678)"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500">하이픈(-)을 포함하여 입력해주세요</p>
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
                      disabled
                      placeholder="123"
                      maxLength={3}
                      className="flex-1 bg-gray-50"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      id="businessNumber2"
                      name="businessNumber2"
                      value={formData.businessNumber2}
                      disabled
                      placeholder="45"
                      maxLength={2}
                      className="flex-1 bg-gray-50"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      id="businessNumber3"
                      name="businessNumber3"
                      value={formData.businessNumber3}
                      disabled
                      placeholder="67890"
                      maxLength={5}
                      className="flex-1 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-400">*사업자등록번호를 변경하시려면, 고객센터를 통해 문의 부탁드립니다.</p>
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
                      <Label htmlFor="businessRegFile" className="text-sm font-medium">인증서 업로드</Label>
                      
                      {/* 인증 상태가 없는 경우 안내 메시지 */}
                      {!formData.existingCertification && !remoteSalesStatus?.status && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <p className="text-xs text-blue-600">
                            💡 비대면 판매 인증서를 업로드하면 관리자 승인 후 비대면 판매가 가능합니다.
                          </p>
                        </div>
                      )}
                      
                      {/* 기존 인증서가 있는 경우 */}
                      {formData.existingCertification && !formData.deleteCertification ? (
                        <div className="mt-2 p-3 bg-white rounded border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div>
                                <a 
                                  href={formData.existingCertification} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  파일 보기
                                </a>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('인증서를 삭제하시겠습니까?')) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    deleteCertification: true,
                                    businessRegFile: null
                                  }));
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              삭제
                            </Button>
                          </div>
                          {/* 인증 상태 표시 */}
                          {remoteSalesStatus?.status === 'pending' && (
                            <div className="text-xs text-amber-600 mt-2 p-2 bg-amber-50 rounded">
                              📋 비대면 판매 인증 심사중
                              <p className="text-xs text-gray-600 mt-1">관리자 확인 후 인증이 완료됩니다. (1~2일 소요)</p>
                              {remoteSalesStatus.submitted_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  제출일: {new Date(remoteSalesStatus.submitted_at).toLocaleDateString('ko-KR')}
                                </p>
                              )}
                            </div>
                          )}
                          {remoteSalesStatus?.status === 'approved' && (
                            <div className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded">
                              ✅ 비대면 판매 인증 완료
                              {remoteSalesStatus.expires_at && (
                                <p className="text-xs text-gray-600 mt-1">
                                  만료일: {new Date(remoteSalesStatus.expires_at).toLocaleDateString('ko-KR')}
                                </p>
                              )}
                            </div>
                          )}
                          {remoteSalesStatus?.status === 'rejected' && (
                            <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                              ❌ 인증 반려
                              {remoteSalesStatus.rejection_reason && (
                                <p className="text-xs text-gray-600 mt-1">사유: {remoteSalesStatus.rejection_reason}</p>
                              )}
                              <p className="text-xs text-gray-600 mt-1">새로운 인증서를 업로드해주세요.</p>
                            </div>
                          )}
                          {remoteSalesStatus?.status === 'expired' && (
                            <div className="text-xs text-orange-600 mt-2 p-2 bg-orange-50 rounded">
                              ⚠️ 인증 만료
                              <p className="text-xs text-gray-600 mt-1">비대면 판매 인증이 만료되었습니다. 재인증이 필요합니다.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* 새 파일 업로드 */
                        <div className="mt-2">
                          <Input
                            id="businessRegFile"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setFormData(prev => ({ 
                                ...prev, 
                                businessRegFile: file,
                                deleteCertification: false
                              }));
                            }}
                          />
                          {formData.businessRegFile && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ 새 파일 선택됨: {formData.businessRegFile.name}
                            </p>
                          )}
                          {formData.deleteCertification && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded">
                              <p className="text-sm text-yellow-800">
                                ⚠️ 기존 인증서가 삭제됩니다. 새 인증서를 업로드하거나 취소하세요.
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => setFormData(prev => ({ 
                                  ...prev, 
                                  deleteCertification: false
                                }))}
                              >
                                취소
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            ※ 비대면 판매가 가능한 영업소 인증 서류를 업로드해주세요.
                          </p>
                        </div>
                      )}
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

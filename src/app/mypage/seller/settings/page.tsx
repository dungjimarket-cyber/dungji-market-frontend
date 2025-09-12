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
import { ArrowLeft, Loader2, Save, Phone, Upload, FileText, Trash2, LogOut } from 'lucide-react';
import RegionDropdown from '@/components/address/RegionDropdown';
import { getSellerProfile, updateSellerProfile } from '@/lib/api/sellerService';
import { getRegions } from '@/lib/api/regionService';
import { SellerProfile } from '@/types/seller';
import { tokenUtils } from '@/lib/tokenUtils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Gift, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PhoneVerification } from '@/components/auth/PhoneVerification';
import NicknameLimitModal from '@/components/ui/nickname-limit-modal';

export default function SellerSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameChangeCount, setNicknameChangeCount] = useState(0);
  const [lastNicknameChangeDate, setLastNicknameChangeDate] = useState<Date | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState({ remainingChanges: 2, nextAvailableDate: null, canChange: true });
  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
    email: '',
    representativeName: '', // 대표자명 필드
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
  const [isBusinessNumberVerified, setIsBusinessNumberVerified] = useState(false);
  const [verifyingBusinessNumber, setVerifyingBusinessNumber] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [hasReferral, setHasReferral] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [savingReferral, setSavingReferral] = useState(false);
  const [showReferralSuccessModal, setShowReferralSuccessModal] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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
        setAccessToken(token); // 토큰 저장

        // 판매자 프로필 정보 가져오기
        const data = await getSellerProfile();
        setProfile(data);
        
        // 추천인 정보 확인
        try {
          const referralResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-referral-status/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (referralResponse.ok) {
            const referralData = await referralResponse.json();
            setHasReferral(referralData.has_referral);
            setReferrerName(referralData.referrer_name || '');
          }
        } catch (err) {
          console.error('추천인 정보 확인 실패:', err);
        }
        
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
        
        // 백엔드에서 받은 인증 상태 사용
        setIsBusinessNumberVerified(data.businessVerified || false);
        
        setFormData({
          nickname: data.nickname || '',
          phone: formattedPhone,
          email: data.email || '',
          representativeName: data.representativeName || '', // 대표자명 설정
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

    // 닉네임 길이 체크 (2-15자, 당근마켓 기준)
    if (nickname.length < 2 || nickname.length > 15) {
      setNicknameError('닉네임은 2자 이상 15자 이하로 입력해주세요.');
      setNicknameAvailable(false);
      return;
    }

    // 공백 체크
    if (nickname.includes(' ')) {
      setNicknameError('닉네임에 공백을 포함할 수 없습니다.');
      setNicknameAvailable(false);
      return;
    }
    
    // 특수문자 및 이모티콘 체크 (당근마켓 기준: 한글, 영문, 숫자만 허용)
    const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/;
    if (!nicknameRegex.test(nickname)) {
      setNicknameError('닉네임은 한글, 영문, 숫자만 사용 가능합니다.');
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
    } else if (name === 'businessNumber1' || name === 'businessNumber2' || name === 'businessNumber3') {
      // 사업자등록번호 입력 처리 - 숫자만 허용
      const numericValue = value.replace(/[^0-9]/g, '');
      if (name === 'businessNumber1' && numericValue.length <= 3) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      } else if (name === 'businessNumber2' && numericValue.length <= 2) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      } else if (name === 'businessNumber3' && numericValue.length <= 5) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 사업자등록번호 유효성 검증 함수
  const handleLogout = () => {
    logout();
    router.push('/');
  };
  
  const handleReferralSubmit = async () => {
    if (!referralCode || hasReferral) return;
    
    setSavingReferral(true);
    try {
      const token = await tokenUtils.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-referral-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referral_code: referralCode })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setHasReferral(true);
        setReferrerName(data.referrer_name || '');
        setShowReferralSuccessModal(true);
      } else {
        toast({
          variant: 'destructive',
          title: '등록 실패',
          description: data.error || '추천인 코드가 유효하지 않습니다.'
        });
      }
    } catch (error) {
      console.error('추천인 등록 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '추천인 등록 중 오류가 발생했습니다.'
      });
    } finally {
      setSavingReferral(false);
    }
  };
  
  const verifyBusinessNumber = async () => {
    const businessNumber = `${formData.businessNumber1}${formData.businessNumber2}${formData.businessNumber3}`;
    
    if (businessNumber.length !== 10) {
      toast({
        variant: 'destructive',
        title: '확인 필요',
        description: '사업자등록번호 10자리를 모두 입력해주세요.'
      });
      return;
    }
    
    setVerifyingBusinessNumber(true);
    
    try {
      const token = await tokenUtils.getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/business/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ business_number: businessNumber })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setIsBusinessNumberVerified(true);
          toast({
            title: '인증 완료',
            description: '사업자등록번호가 확인되었습니다.'
          });
        } else {
          toast({
            variant: 'destructive',
            title: '인증 실패',
            description: data.message || '유효하지 않은 사업자등록번호입니다.'
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '사업자등록번호 확인 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      console.error('사업자등록번호 검증 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '사업자등록번호 확인 중 오류가 발생했습니다.'
      });
    } finally {
      setVerifyingBusinessNumber(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 닉네임 수정 중인 경우 중복체크 확인
    if (isEditingNickname && formData.nickname !== profile?.nickname && !nicknameAvailable) {
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
        representative_name: formData.representativeName, // 대표자명 추가
        is_remote_sales: formData.isRemoteSales
      };
      
      // 이메일 추가
      if (formData.email) {
        updateData.email = formData.email;
      }
      
      
      // 전화번호가 변경된 경우에만 포함 (기존 전화번호와 비교)
      const originalPhone = profile?.phone?.replace(/-/g, '');
      if (cleanPhone !== originalPhone && cleanPhone) {
        updateData.phone = cleanPhone;
      }

      // 주소 정보 처리 - 일반회원과 동일한 방식으로 처리
      if (formData.addressProvince && formData.addressCity) {
        try {
          console.log('🔍 지역 정보 가져오기 시작...');
          console.log('🔍 accessToken 존재 여부:', !!accessToken);
          // 모든 지역 데이터 가져오기 - regionService 사용으로 인증 헤더 자동 포함
          const regionsData = await getRegions();
          console.log('✅ 지역 데이터 가져오기 성공:', regionsData?.length, '개');
          
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
            setSaving(false);
            return;
          }
        } catch (err: any) {
          console.error('❌ 지역 정보 가져오기 실패:', err);
          console.error('❌ 에러 응답:', err.response?.data);
          console.error('❌ 에러 상태:', err.response?.status);
          toast({
            variant: 'destructive',
            title: '오류',
            description: '지역 정보를 가져오는 중 오류가 발생했습니다.'
          });
          setSaving(false);
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
        
        if (updateData.email) {
          formDataWithFile.append('email', updateData.email);
        }
        
        if (updateData.representative_name) {
          formDataWithFile.append('representative_name', updateData.representative_name);
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
        // 닉네임이 변경된 경우 변경 횟수 업데이트
        if (isEditingNickname && formData.nickname !== profile?.nickname) {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          if (!lastNicknameChangeDate || lastNicknameChangeDate < thirtyDaysAgo) {
            // 30일이 지났으면 카운트 리셋
            setNicknameChangeCount(1);
            setLastNicknameChangeDate(now);
          } else {
            // 30일 이내면 카운트 증가
            setNicknameChangeCount(prev => prev + 1);
          }
          
          setIsEditingNickname(false);
        }
        
        toast({
          title: '저장 완료',
          description: '판매자 정보가 성공적으로 저장되었습니다.'
        });
        
        // 페이지를 새로고침하여 변경사항 반영
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nickname">닉네임 (상호명)</Label>
                    {!isEditingNickname && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          // 닉네임 변경 가능 여부 먼저 확인
                          try {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/nickname-change-status/`, {
                              headers: {
                                'Authorization': `Bearer ${accessToken}`
                              }
                            });
                            
                            if (response.ok) {
                              const data = await response.json();
                              
                              // 모달 데이터 설정
                              setLimitModalData({
                                remainingChanges: data.remaining_changes || 0,
                                nextAvailableDate: data.next_available_date,
                                canChange: data.can_change
                              });
                              
                              // 모달 표시
                              setShowLimitModal(true);
                            }
                          } catch (error) {
                            console.error('[판매자] 닉네임 변경 상태 확인 실패:', error);
                            // 에러 발생시에도 일단 모달 표시
                            setLimitModalData({ remainingChanges: 0, nextAvailableDate: null, canChange: false });
                            setShowLimitModal(true);
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        수정
                      </Button>
                    )}
                  </div>
                  
                  {!isEditingNickname ? (
                    <div>
                      <Input
                        value={formData.nickname}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="nickname"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleChange}
                            placeholder="닉네임 또는 상호명 (2-15자)"
                            maxLength={15}
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingNickname(false);
                            setFormData(prev => ({ ...prev, nickname: profile?.nickname || '' }));
                            setNicknameError('');
                            setNicknameAvailable(false);
                          }}
                        >
                          취소
                        </Button>
                      </div>
                      {nicknameError && (
                        <p className="text-sm text-red-500 mt-1">{nicknameError}</p>
                      )}
                      {nicknameAvailable && !nicknameError && formData.nickname && (
                        <p className="text-sm text-green-600 mt-1">✓ 사용 가능한 닉네임입니다</p>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  {/* 휴대폰 번호가 있으면 읽기 전용으로 표시 */}
                  {formData.phone ? (
                    <>
                      <Label>휴대폰 번호</Label>
                      <Input
                        value={formData.phone}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">휴대폰번호 수정을 원하시면 고객센터로 문의 부탁드립니다</p>
                    </>
                  ) : (
                    /* 휴대폰 번호가 없으면 PhoneVerification 컴포넌트가 자체 Label 표시 */
                    <PhoneVerification
                      purpose="profile"
                      defaultValue={formData.phone}
                      currentUserToken={accessToken || undefined}
                      onVerified={async (phoneNumber) => {
                        setFormData(prev => ({ ...prev, phone: phoneNumber }));
                        // 프로필 저장을 위해 handleSubmit 호출
                        const cleanPhone = phoneNumber.replace(/-/g, '');
                        try {
                          const updateData = {
                            phone: cleanPhone,
                            nickname: formData.nickname || profile?.nickname,
                            business_number: `${formData.businessNumber1}-${formData.businessNumber2}-${formData.businessNumber3}`,
                            is_remote_sales: formData.isRemoteSales
                          };
                          await updateSellerProfile(updateData);
                          toast({
                            title: '휴대폰 번호 등록 완료',
                            description: '휴대폰 번호가 등록되었습니다.',
                          });
                          // 페이지 새로고침
                          setTimeout(() => {
                            window.location.reload();
                          }, 500);
                        } catch (error) {
                          console.error('휴대폰 번호 저장 오류:', error);
                          toast({
                            variant: 'destructive',
                            title: '오류',
                            description: '휴대폰 번호 저장에 실패했습니다.',
                          });
                        }
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="이메일 주소를 입력하세요 (예: example@email.com)"
                  />
                  <p className="text-xs text-gray-500">비밀번호 찾기 및 중요 안내사항 수신에 필요합니다</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">
                    사업장주소/영업활동지역 <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="representativeName">
                    사업자등록증상 대표자명 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="representativeName"
                    name="representativeName"
                    value={formData.representativeName}
                    onChange={handleChange}
                    placeholder="사업자등록증상 대표자명을 입력하세요"
                    required={!formData.representativeName}
                  />
                  {!formData.representativeName ? (
                    <p className="text-xs text-red-500">* 사업자등록증에 명시된 대표자명을 정확히 입력해주세요</p>
                  ) : (
                    <p className="text-xs text-gray-500">사업자등록증에 명시된 대표자명</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessNumber1">
                    사업자등록번호 <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        id="businessNumber1"
                        name="businessNumber1"
                        value={formData.businessNumber1}
                        onChange={handleChange}
                        disabled={isBusinessNumberVerified}
                        placeholder="123"
                        maxLength={3}
                        className={`flex-1 ${isBusinessNumberVerified ? 'bg-gray-50' : ''}`}
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        id="businessNumber2"
                        name="businessNumber2"
                        value={formData.businessNumber2}
                        onChange={handleChange}
                        disabled={isBusinessNumberVerified}
                        placeholder="45"
                        maxLength={2}
                        className={`flex-1 ${isBusinessNumberVerified ? 'bg-gray-50' : ''}`}
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        id="businessNumber3"
                        name="businessNumber3"
                        value={formData.businessNumber3}
                        onChange={handleChange}
                        disabled={isBusinessNumberVerified}
                        placeholder="67890"
                        maxLength={5}
                        className={`flex-1 ${isBusinessNumberVerified ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                    {!isBusinessNumberVerified && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={verifyBusinessNumber}
                        disabled={verifyingBusinessNumber}
                        className="w-full sm:w-auto whitespace-nowrap"
                      >
                        {verifyingBusinessNumber ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            확인 중...
                          </>
                        ) : (
                          '유효성 검사'
                        )}
                      </Button>
                    )}
                  </div>
                  {isBusinessNumberVerified ? (
                    <p className="text-xs text-green-600">✓ 사업자등록번호가 인증되었습니다.</p>
                  ) : (
                    <p className="text-xs text-gray-400">사업자등록번호를 입력하고 유효성 검사를 진행해주세요.</p>
                  )}
                  {isBusinessNumberVerified && (
                    <p className="text-xs text-gray-400">*사업자등록번호를 변경하시려면, 고객센터를 통해 문의 부탁드립니다.</p>
                  )}
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

          {/* 추천인 코드 입력 카드 */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4" />
                추천인 코드
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {hasReferral ? (
                <Alert className="py-2">
                  <AlertCircle className="h-3 w-3" />
                  <AlertTitle className="text-xs">추천인 등록 완료</AlertTitle>
                  <AlertDescription className="text-xs">
                    추천인: {referrerName}
                    <p className="text-xs text-gray-500 mt-0.5">추천인 코드는 한 번만 등록 가능합니다.</p>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="추천인 코드를 입력하세요"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      disabled={hasReferral || savingReferral}
                      className="h-8 text-xs"
                    />
                    <Button
                      onClick={handleReferralSubmit}
                      disabled={!referralCode || hasReferral || savingReferral}
                      size="sm"
                      className="h-8 text-xs"
                    >
                      {savingReferral ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          등록 중...
                        </>
                      ) : (
                        '등록'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    * 추천인 코드는 회원가입 후 한 번만 등록 가능합니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 계정 관리 섹션 */}
          <div className="mt-8 pb-8">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center text-gray-600 hover:text-gray-800 border-gray-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </div>

          {/* 닉네임 제한 모달 */}
          <NicknameLimitModal
            isOpen={showLimitModal}
            onClose={() => {
              setShowLimitModal(false);
              // 변경 가능한 경우 수정 모드 활성화
              if (limitModalData.canChange) {
                setIsEditingNickname(true);
              }
            }}
            remainingChanges={limitModalData.remainingChanges}
            nextAvailableDate={limitModalData.nextAvailableDate}
            canChange={limitModalData.canChange}
          />

          {/* 추천인 등록 성공 모달 */}
          <Dialog open={showReferralSuccessModal} onOpenChange={setShowReferralSuccessModal}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader className="text-center">
                <div className="flex justify-center mb-3">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <DialogTitle className="text-center text-lg">추천인 등록 완료!</DialogTitle>
                <DialogDescription className="text-center text-sm">
                  견적 이용권 10매가 지급되었습니다!
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => setShowReferralSuccessModal(false)}
                  size="sm"
                  className="px-6"
                >
                  확인
                </Button>
              </div>
            </DialogContent>
          </Dialog>
    </div>
  );
}

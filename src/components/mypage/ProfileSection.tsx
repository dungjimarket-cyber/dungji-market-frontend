'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, ArrowLeft, Bell, Camera, Loader2, User } from 'lucide-react';
import RegionDropdown from '@/components/address/RegionDropdown';
import { PhoneVerification } from '@/components/auth/PhoneVerification';
import NicknameLimitModal from '@/components/ui/nickname-limit-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api/fetch';
import { fetchMyExpertProfile, updateExpertProfile, ExpertProfile } from '@/lib/api/expertService';
import { fetchCategories } from '@/lib/api/localBusiness';
import { LocalBusinessCategory } from '@/types/localBusiness';

/**
 * 사용자 객체가 소셜 공급자 정보를 포함하는지 확인하는 타입 가드 함수
 */
function isExtendedUser(user: any): user is { provider: string } {
  return typeof user?.provider === 'string';
}

function getLoginProviderLabel(user: any) {
  const type = user?.sns_type || user?.provider;
  if (type === 'kakao') return '카카오';
  if (type === 'google') return '구글';
  if (type === 'naver') return '네이버';
  if (type === 'apple') return '애플';
  if (type === 'email') return '아이디';
  if (!type) return '직접 가입';
  return type;
}

function getSellerCategoryLabel(category: string) {
  switch (category) {
    case 'telecom':
      return '통신상품판매(휴대폰,인터넷,TV개통 등)';
    case 'rental':
      return '렌탈서비스판매(정수기,비데,매트리스 등)';
    case 'electronics':
      return '가전제품판매(냉장고,세탁기,컴퓨터 등)';
    case 'general':
      return '온/오프라인 도소매,요식업 등';
    default:
      return category || '정보 없음';
  }
}

/**
 * 사용자 프로필 섹션 컴포넌트
 * 마이페이지에 표시되는 사용자 정보 섹션
 */

// 사용자 타입 정의 확장 (프로필 원활한 표시를 위한 필드 포함)
interface ExtendedUser {
  id?: number;
  email?: string;
  username?: string;  // 사용자 닉네임
  nickname?: string;  // 대체 닉네임 필드
  name?: string;      // 실명
  image?: string;
  roles?: string[];
  region?: string;    // 지역 정보
  user_type?: string; // 회원구분(일반/판매)
  birth_date?: string; // 생년월일
  gender?: 'M' | 'F'; // 성별
  first_name?: string; // 이름 (실명)
  phone_number?: string; // 휴대폰 번호
  address_region?: {
    code: string;
    name: string;
    full_name: string;
    level: number;
  };
  role?: string;
  seller_category?: string;
  is_business_verified?: boolean;
  business_number?: string;
  is_remote_sales?: boolean;
  sns_type?: string;  // 소셜 로그인 타입
  provider?: string;  // 소셜 로그인 제공자 (호환성)
}

export default function ProfileSection() {
  const { user: authUser, setUser, accessToken, isAuthenticated, isLoading, logout } = useAuth();
  // 확장된 타입으로 사용자 정보를 처리
  const user = authUser as unknown as ExtendedUser;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [originalNickname, setOriginalNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressRegion, setAddressRegion] = useState<any>(null);
  const [addressProvince, setAddressProvince] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [role, setRole] = useState('');
  const [sellerCategory, setSellerCategory] = useState('');
  const [isBusinessVerified, setIsBusinessVerified] = useState(false);
  const [businessNumber, setBusinessNumber] = useState('');  // 사업자등록번호
  const [isRemoteSales, setIsRemoteSales] = useState(false);
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [region, setRegion] = useState('');
  const [userType, setUserType] = useState('');
  const [birthDate, setBirthDate] = useState(''); // 생년월일
  const [gender, setGender] = useState<'M' | 'F' | ''>(''); // 성별
  const [firstName, setFirstName] = useState(''); // 실명
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState<'email' | 'nickname' | 'phone_number' | 'address' | 'business_number' | 'business_address' | 'remote_sales' | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [error, setError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState({ remainingChanges: 2, nextAvailableDate: null, canChange: true });
  const errorRef = useRef<HTMLDivElement>(null);
  const nicknameRef = useRef<HTMLDivElement>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const [expertCategory, setExpertCategory] = useState<string | null>(null);
  const [expertCategoryId, setExpertCategoryId] = useState<number | null>(null);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [categories, setCategories] = useState<LocalBusinessCategory[]>([]);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // 푸시 알림 설정 상태
  const [pushNotificationSettings, setPushNotificationSettings] = useState({
    trade_notifications: true,
    marketing_notifications: false,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // 프로필 이미지 상태
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 컴포넌트 마운트시 AuthContext의 user 정보에서 프로필 데이터 설정
  useEffect(() => {
    // AuthContext에서 이미 로그인 시 프로필을 가져왔으므로 중복 API 호출 제거
    if (user) {
      console.log('AuthContext에서 사용자 정보 사용:', user);
      
      // 프로필 정보 상태 업데이트
      setEmail(user.email || '');
      // nickname 필드 사용, 없으면 이메일 앞부분 사용 (username은 아이디이므로 닉네임으로 사용하지 않음)
      const displayNickname = user.nickname || (user.email ? user.email.split('@')[0] : '');
      setNickname(displayNickname);
      setOriginalNickname(displayNickname);
      setPhoneNumber(user.phone_number || '');
      setAddressRegion(user.address_region || null);
            
      // address_region 객체에서 시/도와 시/군/구 추출
      if (user.address_region) {
        const fullName = user.address_region.full_name || user.address_region.name || '';
        const parts = fullName.split(' ');
        
        // 세종특별자치시 특수 처리
        if (fullName === '세종특별자치시') {
          setAddressProvince('세종특별자치시');
          setAddressCity('세종특별자치시');
        } else if (parts.length >= 2) {
          setAddressProvince(parts[0]);
          setAddressCity(parts[1]);
        } else if (parts.length === 1) {
          setAddressProvince(parts[0]);
          setAddressCity('');
        }
      } else {
        setAddressProvince('');
        setAddressCity('');
      }
      
      setRole(user.role || 'buyer');
      setSellerCategory(user.seller_category || '');
      setIsBusinessVerified(user.is_business_verified || false);
      setRegion(user.region || '');
      setUserType(user.user_type || '일반');
      setBusinessNumber(user.business_number || '');  // 사업자등록번호 설정
      setIsRemoteSales(user.is_remote_sales || false);
      
      // 휴대폰 인증 정보
      setBirthDate(user.birth_date || '');
      setGender(user.gender || '');
      setFirstName(user.first_name || '');

      // 프로필 이미지
      setProfileImage((user as any).profile_image || null);
    }
  }, [user]); // user가 변경될 때만 업데이트
  
  // 회원구분 필드 초기화 (선택적 백업 용도)
  useEffect(() => {
    // 회원구분 초기화
    if (user?.user_type) {
      setUserType(user.user_type);
    } else {
      setUserType('일반');
    }
  }, [user?.user_type]);

  // 전문가 프로필 및 카테고리 로드
  useEffect(() => {
    const loadExpertData = async () => {
      if (user?.role !== 'expert' || !accessToken) return;
      try {
        const profile = await fetchMyExpertProfile(accessToken);
        if (profile) {
          setExpertProfile(profile);
          if (profile.category?.name) {
            setExpertCategory(profile.category.name);
            setExpertCategoryId(profile.category.id);
            setSelectedCategoryId(profile.category.id);
          }
        }
      } catch (error) {
        console.error('전문가 프로필 로드 오류:', error);
      }
    };
    loadExpertData();
  }, [user?.role, accessToken]);

  // 카테고리 목록 로드 (전문가인 경우)
  useEffect(() => {
    const loadCategories = async () => {
      if (user?.role !== 'expert') return;
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (error) {
        console.error('카테고리 목록 로드 오류:', error);
      }
    };
    loadCategories();
  }, [user?.role]);
  
  // 지역 목록 가져오기 - 현재 사용하지 않지만 향후 사용 가능성을 위해 유지
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        const regionsArray = data?.results || data;
        setRegions(regionsArray);
      } catch (error) {
        console.error('지역 정보 가져오기 오류:', error);
      }
    };
    fetchRegions();
  }, []);

  // 푸시 알림 설정 가져오기
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const response = await fetchWithAuth('/notifications/settings/');
        if (response.ok) {
          const data = await response.json();
          setPushNotificationSettings({
            trade_notifications: data.trade_notifications ?? true,
            marketing_notifications: data.marketing_notifications ?? false,
          });
        }
      } catch (error) {
        console.error('알림 설정 가져오기 실패:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    if (isAuthenticated) {
      fetchNotificationSettings();
    }
  }, [isAuthenticated]);

  /**
   * 프로필 이미지 업로드 함수
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '파일 크기 초과',
        description: '이미지는 5MB 이하만 업로드 가능합니다.',
      });
      return;
    }

    // 이미지 타입 체크
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: '잘못된 파일 형식',
        description: '이미지 파일만 업로드 가능합니다.',
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const nextImage = data.image_url || null;
        setProfileImage(nextImage);
        toast({
          title: '업로드 완료',
          description: '프로필 이미지가 변경되었습니다.',
        });

        // AuthContext 및 로컬스토리지 동기화
        if (setUser && authUser) {
          const updatedUser = {
            ...authUser,
            profile_image: nextImage,
          };
          setUser(updatedUser as any);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('auth.user', JSON.stringify(updatedUser));
        }
      } else {
        toast({
          variant: 'destructive',
          title: '업로드 실패',
          description: '이미지 업로드에 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '이미지 업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setIsUploadingImage(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  /**
   * 전문가 업종 저장 함수
   */
  const handleCategorySave = async () => {
    if (!accessToken || !selectedCategoryId) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '업종을 선택해주세요.',
      });
      return;
    }

    try {
      // 프로필 생성 시 필수 정보 포함 (기존 프로필 수정 시에는 category_id만 사용됨)
      const profileData: any = {
        category_id: selectedCategoryId,
        // 프로필 생성 시 필요한 기본값들
        representative_name: nickname || user?.nickname || user?.username || '미입력',
        contact_phone: phoneNumber || user?.phone_number || '미입력',
      };

      // 지역 정보가 있으면 추가
      if (addressRegion?.code) {
        profileData.region_codes = [addressRegion.code];
      }

      const result = await updateExpertProfile(
        profileData,
        accessToken
      );

      if (result.success) {
        const selectedCat = categories.find(c => c.id === selectedCategoryId);
        setExpertCategory(selectedCat?.name || null);
        setExpertCategoryId(selectedCategoryId);
        setIsEditingCategory(false);
        toast({
          title: '저장 완료',
          description: '전문 분야가 변경되었습니다.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: '저장 실패',
          description: result.message,
        });
      }
    } catch (error) {
      console.error('업종 저장 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '업종 저장 중 오류가 발생했습니다.',
      });
    }
  };

  /**
   * 푸시 알림 설정 변경 핸들러
   */
  const handlePushNotificationChange = async (key: 'trade_notifications' | 'marketing_notifications') => {
    try {
      const newValue = !pushNotificationSettings[key];

      // 알림을 켤 때 FCM 토큰 등록
      if (newValue) {
        try {
          const { requestNotificationPermission, registerPushToken } = await import('@/lib/firebase');
          const token = await requestNotificationPermission();
          if (token) {
            await registerPushToken(token);
            console.log('푸시 토큰 재등록 완료');
          }
        } catch (tokenError) {
          console.error('푸시 토큰 등록 실패:', tokenError);
          // 토큰 등록 실패해도 설정은 저장
        }
      }

      const response = await fetchWithAuth('/notifications/settings/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: newValue }),
      });

      if (response.ok) {
        setPushNotificationSettings((prev) => ({
          ...prev,
          [key]: newValue,
        }));
        toast({
          title: '설정이 변경되었습니다',
          description: newValue ? '알림이 활성화되었습니다' : '알림이 비활성화되었습니다',
        });
      } else {
        toast({
          title: '설정 변경 실패',
          description: '잠시 후 다시 시도해주세요',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      toast({
        title: '오류가 발생했습니다',
        description: '잠시 후 다시 시도해주세요',
        variant: 'destructive',
      });
    }
  };

  /**
   * 프로필 정보 업데이트 함수 (이메일 또는 닉네임)
   */
  const handleProfileUpdate = async (overridePhoneNumber?: string) => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return;
    }

    // 업데이트할 필드 확인
    if (!editField) {
      setError('업데이트할 필드를 선택해주세요.');
      return;
    }

    // 업데이트할 데이터 객체 준비
    const updateData: {
      email?: string,
      nickname?: string,  // username이 아닌 nickname 필드 사용
      phone_number?: string,
      address_region_id?: string | null,  // 지역 코드는 string 타입
      address_province?: string,
      address_city?: string,
      business_number?: string,
      is_remote_sales?: boolean
    } = {};
    
    if (editField === 'email') {
      updateData.email = email;
    } else if (editField === 'nickname') {
      // 닉네임 중복체크가 완료되지 않은 경우
      if (!nicknameChecked || !nicknameAvailable) {
        setNicknameError('닉네임 중복체크를 해주세요.');
        return;
      }
      
      // nickname 필드를 업데이트 (username은 아이디이므로 변경하지 않음)
      updateData.nickname = nickname;
    } else if (editField === 'phone_number') {
      // overridePhoneNumber가 있으면 우선 사용, 없으면 state 사용
      const phoneToUpdate = overridePhoneNumber || phoneNumber;
      updateData.phone_number = phoneToUpdate;
      console.log('휴대폰번호 업데이트 준비:', phoneToUpdate);
    } else if (editField === 'address') {
      // 주소 업데이트 시 지역 코드를 찾아서 전송
      if (addressProvince && addressCity) {
        try {
          // 모든 지역 데이터 가져오기 - fetch 직접 사용하여 limit 파라미터 전달
          const regionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/?limit=1000`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          const regionsJson = await regionsResponse.json();
          const regionsData = regionsJson?.results || regionsJson;
          
          // 시/군/구 레벨에서 일치하는 지역 찾기
          // 세종특별자치시는 특수한 경우로 level 1이면서 시/도와 시/군/구가 동일
          let cityRegion;
          
          if (addressProvince === '세종특별자치시') {
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
              r.name === addressCity && 
              r.full_name.includes(addressProvince)
            );
          }
          
          if (cityRegion) {
            // 백엔드는 code를 primary key로 사용하므로 code를 전송
            updateData.address_region_id = cityRegion.code;
          } else {
            setError('선택한 지역을 찾을 수 없습니다.');
            return;
          }
        } catch (err) {
          setError('지역 정보를 가져오는 중 오류가 발생했습니다.');
          return;
        }
      } else {
        // 지역이 선택되지 않은 경우 null로 설정
        updateData.address_region_id = null;
      }
    } else if (editField === 'business_number') {
      updateData.business_number = businessNumber;
    } else if (editField === 'remote_sales') {
      updateData.is_remote_sales = isRemoteSales;
    }

    console.log('프로필 업데이트 데이터:', updateData);
    console.log('editField:', editField);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updateData),
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
        if (response.status === 429) {
          // 닉네임 변경 제한
          const errorData = await response.json();
          setNicknameError(errorData.message || '닉네임 변경 제한에 도달했습니다.');
          return;
        }
        const errorData = await response.json();
        if (editField === 'nickname') {
          setNicknameError(errorData.error || '닉네임 업데이트에 실패했습니다.');
        } else {
          setError(errorData.error || '프로필 업데이트에 실패했습니다.');
        }
        return;
      }

      console.log('프로필 업데이트 성공');
      setSuccessMessage('프로필이 성공적으로 업데이트되었습니다.');

      // 최신 프로필 정보 GET
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        console.log('프로필 업데이트 후 백엔드 응답:', profileData);
        
        // 프로필 정보 상태 업데이트
        setEmail(profileData.email);
        setNickname(profileData.nickname || '');  // nickname만 사용
        setPhoneNumber(profileData.phone_number || '');
        setAddressRegion(profileData.address_region || null);
        
        // address_region 객체에서 시/도와 시/군/구 추출
        if (profileData.address_region) {
          const fullName = profileData.address_region.full_name || profileData.address_region.name || '';
          const parts = fullName.split(' ');
          if (parts.length >= 2) {
            setAddressProvince(parts[0]);
            setAddressCity(parts[1]);
          } else if (parts.length === 1) {
            setAddressProvince(parts[0]);
            setAddressCity('');
          }
        } else {
          setAddressProvince('');
          setAddressCity('');
        }
        
        setRole(profileData.role || 'buyer');
        setIsBusinessVerified(profileData.is_business_verified || false);
        
        // AuthContext 및 로컬스토리지 동기화
        if (setUser && authUser) {
          const updatedUser = {
            ...authUser,
            email: profileData.email,
            username: profileData.username, // ID는 변경되지 않음
            nickname: profileData.nickname, // 닉네임만 변경됨
            sns_type: profileData.sns_type,
            provider: profileData.sns_type, // 호환성을 위해 provider도 추가
            phone_number: profileData.phone_number,
            region: profileData.region,
            address_region: profileData.address_region, // 주요활동지역 필드 추가
            business_number: profileData.business_number,
          };
          
          console.log('새로운 사용자 정보:', updatedUser);
          setUser(updatedUser as any);
          
          // 로컬스토리지 업데이트
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('auth.user', JSON.stringify(updatedUser));
        }
        
        // 닉네임이나 이메일이 변경된 경우 페이지 새로고침하여 모든 데이터 업데이트
        if (editField === 'nickname' || editField === 'email') {
          setTimeout(() => {
            window.location.reload();
          }, 500); // 성공 메시지를 잠시 보여준 후 새로고침
        }
      }
      setIsEditing(false);
      setEditField(null);
      setError('');
      setNicknameError('');
      
    } catch (err: any) {
      setError(err.message || '업데이트 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) return null;
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      
      {/* 판매회원인 경우 이용권 관리 링크 표시 */}
      {role === 'seller' && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => router.push('/mypage/seller/bid-tokens')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            이용권 관리
          </button>
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-4">프로필 정보</h3>

          {/* 프로필 이미지 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity">
                {isUploadingImage ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                ) : profileImage ? (
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="w-full h-full"
                    aria-label="프로필 이미지 미리보기"
                  >
                    <img
                      src={profileImage}
                      alt="프로필 이미지"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {/* 카메라 아이콘 오버레이 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-md"
              >
                <Camera className="w-4 h-4 text-white" />
              </div>
              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mb-4">이미지를 눌러 미리보기, 카메라 아이콘으로 변경</p>

          {/* 프로필 이미지 미리보기 모달 */}
          {isPreviewOpen && profileImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
              <div className="relative max-w-[90vw] max-h-[80vh]">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="absolute -top-10 right-0 text-white text-sm hover:text-gray-200"
                >
                  닫기
                </button>
                <img
                  src={profileImage}
                  alt="프로필 이미지 미리보기"
                  className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-white/20"
                />
              </div>
            </div>
          )}

          {/* 아이디 섹션 - 카카오 계정이 아닌 경우에만 표시 */}
          {user?.sns_type !== 'kakao' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
              <span className="font-medium">{user?.username || '아이디 정보 없음'}</span>
            </div>
          )}
          
          {/* 닉네임 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <label className="block text-sm font-medium text-gray-700">닉네임</label>
              <button
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
                      
                      // 변경 가능하면 모달 닫힌 후 수정 모드 활성화 준비
                      if (data.can_change) {
                        // 모달에서 "계속 진행" 클릭시 수정 모드 활성화됨
                      }
                    }
                  } catch (error) {
                    console.error('닉네임 변경 상태 확인 실패:', error);
                    // 에러 발생시에도 일단 모달 표시
                    setLimitModalData({ remainingChanges: 0, nextAvailableDate: null, canChange: false });
                    setShowLimitModal(true);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                수정
              </button>
            </div>
            
            {isEditing && editField === 'nickname' ? (
              <div ref={nicknameRef}>
                {/* 모바일 최적화된 입력 폼 */}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 15자 초과시 입력 자체를 막음
                      if (value.length > 15) {
                        return;
                      }

                      setNickname(value);
                      setNicknameError('');
                      setNicknameChecked(false);
                      setNicknameAvailable(false);

                      // 실시간 유효성 검사
                      if (value && value.length < 2) {
                        setNicknameError('닉네임은 2자 이상이어야 합니다.');
                      } else if (value && value.includes(' ')) {
                        setNicknameError('닉네임에 공백을 포함할 수 없습니다.');
                      } else if (value && !/^[가-힣a-zA-Z0-9]+$/.test(value)) {
                        setNicknameError('한글, 영문, 숫자만 사용 가능합니다.');
                      }
                    }}
                    className={`w-full p-3 border rounded-md ${nicknameError ? 'border-blue-500' : nicknameAvailable ? 'border-green-500' : 'border-gray-300'}`}
                    placeholder="닉네임 (2-15자, 한글/영문/숫자만)"
                    maxLength={15}
                  />
                  
                  {/* 버튼들을 세로로 배치 (모바일 친화적) */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={async () => {
                        // 닉네임 유효성 검사
                        if (!nickname || nickname.length < 2 || nickname.length > 15) {
                          setNicknameError('닉네임은 2자 이상 15자 이하로 입력해주세요.');
                          return;
                        }
                        if (nickname.includes(' ')) {
                          setNicknameError('닉네임에 공백을 포함할 수 없습니다.');
                          return;
                        }
                        const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/;
                        if (!nicknameRegex.test(nickname)) {
                          setNicknameError('닉네임은 한글, 영문, 숫자만 사용 가능합니다.');
                          return;
                        }
                        
                        // 기존 닉네임과 같으면 사용 가능
                        if (nickname === originalNickname) {
                          setNicknameChecked(true);
                          setNicknameAvailable(true);
                          return;
                        }
                        
                        // 닉네임 중복 체크
                        try {
                          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-nickname/`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
                            },
                            body: JSON.stringify({ nickname })
                          });
                          const data = await response.json();
                          setNicknameChecked(true);
                          setNicknameAvailable(data.available);
                          if (!data.available) {
                            setNicknameError('이미 사용 중인 닉네임입니다.');
                          }
                        } catch (err) {
                          setNicknameError('닉네임 중복 확인 중 오류가 발생했습니다.');
                        }
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                    >
                      중복체크
                    </button>
                    
                    <div className="flex gap-2 flex-1">
                      <button
                        onClick={() => {
                          if (!nicknameChecked || !nicknameAvailable) {
                            setNicknameError('닉네임 중복체크를 해주세요.');
                            return;
                          }
                          handleProfileUpdate();
                        }}
                        className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium disabled:opacity-50"
                        disabled={!nicknameChecked || !nicknameAvailable}
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditField(null);
                          setNickname(originalNickname);
                          setNicknameError('');
                          setNicknameChecked(false);
                          setNicknameAvailable(false);
                        }}
                        className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                  
                  {/* 상태 메시지 */}
                  {nicknameError && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">{nicknameError}</p>
                    </div>
                  )}
                  {nicknameAvailable && !nicknameError && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">✓ 사용 가능한 닉네임입니다</p>
                    </div>
                  )}
                  {nickname && nickname.length === 15 && !nicknameError && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">최대 15자까지 입력 가능합니다.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-md">
                <span className="font-medium break-all">
                  {nickname || '닉네임 정보 없음'}
                </span>
              </div>
            )}
          </div>
          
          {/* 이메일 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <label className="block text-sm font-medium text-gray-700">
                이메일
                {user?.sns_type && user?.sns_type !== 'email' && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({getLoginProviderLabel(user)} 계정 연결됨)
                  </span>
                )}
              </label>
              {/* 모든 사용자 이메일 수정 가능 */}
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditField('email');
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                수정
              </button>
            </div>
            
            {isEditing && editField === 'email' ? (
              <div className="flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 p-2 border rounded-md mr-2"
                  placeholder="이메일을 입력하세요"
                />
                <button
                  onClick={() => handleProfileUpdate()}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditField(null);
                    setEmail(user?.email || '');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm ml-2"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="p-2 bg-gray-50 rounded-md">
                <span className="font-medium text-sm">{email || '이메일 정보 없음'}</span>
              </div>
            )}
          </div>
          
          {/* 휴대폰 인증 정보 섹션 - 이름만 표시 */}
          {firstName && (
            <>
              {/* 이름 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <div className="p-2 bg-gray-50 rounded-md">
                  <span className="font-medium text-sm">{firstName || '정보 없음'}</span>
                </div>
              </div>
            </>
          )}
          
          {/* 휴대폰 번호 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <label className="block text-sm font-medium text-gray-700">
                휴대폰 번호
                {!phoneNumber && (
                  <span className="text-orange-600 text-xs ml-2">
                    필수 입력 항목입니다
                  </span>
                )}
              </label>
              {/* 휴대폰 번호가 없을 때만 등록 버튼 표시 */}
              {!phoneNumber && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditField('phone_number');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  등록
                </button>
              )}
            </div>
            
            {isEditing && editField === 'phone_number' ? (
              <div className="space-y-2">
                <PhoneVerification
                  purpose="profile"
                  defaultValue={phoneNumber}
                  currentUserToken={accessToken || undefined}
                  onVerified={async (verifiedPhoneNumber) => {
                    console.log('휴대폰 인증 완료:', verifiedPhoneNumber);
                    setPhoneNumber(verifiedPhoneNumber);
                    // 인증된 번호를 직접 전달하여 state 업데이트 지연 문제 해결
                    await handleProfileUpdate(verifiedPhoneNumber);
                  }}
                />
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditField(null);
                    setPhoneNumber(phoneNumber || '');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                {phoneNumber ? (
                  <>
                    <span className="font-medium text-sm">
                      {phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      휴대폰번호 수정을 원하시면 고객센터로 문의 부탁드립니다
                    </p>
                  </>
                ) : (
                  <span className="text-gray-500">휴대폰 번호 정보 없음</span>
                )}
              </>
            )}
          </div>

          {/* 전문가 업종 섹션 - 전문가 회원만 표시 */}
          {role === 'expert' && (
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  전문 분야
                  {!expertCategory && (
                    <span className="text-orange-600 text-xs ml-2">
                      필수 입력 항목입니다
                    </span>
                  )}
                </label>
                <button
                  onClick={() => {
                    setIsEditingCategory(true);
                    setSelectedCategoryId(expertCategoryId);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  수정
                </button>
              </div>

              {isEditingCategory ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`p-2 border-2 rounded-lg text-center transition-all ${
                          selectedCategoryId === category.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{category.icon}</div>
                        <div className="font-medium text-gray-900 text-xs">{category.name}</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCategorySave}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingCategory(false);
                        setSelectedCategoryId(expertCategoryId);
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-gray-50 rounded-md">
                  {expertCategory ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {categories.find(c => c.id === expertCategoryId)?.icon || '📋'}
                      </span>
                      <span className="font-medium text-sm">{expertCategory}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">전문 분야를 선택해주세요</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 주소 섹션 - 모든 회원 공통 */}
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {role === 'seller' ? '사업장 주소/영업활동 지역' : '주요활동지역'}
                  {(!addressProvince || !addressCity) && (
                    <span className="text-orange-600 text-xs ml-2">
                      필수 입력 항목입니다
                    </span>
                  )}
                </label>
                <button
                  onClick={() => {
                    setIsEditingAddress(true);
                    setIsEditing(true);
                    setEditField('address');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  수정
                </button>
              </div>
              
              {isEditingAddress ? (
                <div className="space-y-2">
                  <RegionDropdown
                    selectedProvince={addressProvince}
                    selectedCity={addressCity}
                    onSelect={(province, city) => {
                      setAddressProvince(province);
                      setAddressCity(city);
                    }}
                    required={false}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        // editField를 설정해야 handleProfileUpdate에서 주소 업데이트 로직이 실행됨
                        setEditField('address');
                        await handleProfileUpdate();
                        setIsEditingAddress(false);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingAddress(false);
                        setIsEditing(false);
                        setEditField(null);
                        // Reset to saved values if available
                        if (addressRegion) {
                          const fullName = addressRegion.full_name || addressRegion.name || '';
                          const parts = fullName.split(' ');
                          if (fullName === '세종특별자치시') {
                            setAddressProvince('세종특별자치시');
                            setAddressCity('세종특별자치시');
                          } else if (parts.length >= 2) {
                            setAddressProvince(parts[0]);
                            setAddressCity(parts[1]);
                          }
                        }
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-gray-50 rounded-md">
                  <div className="font-medium text-sm">
                    {addressProvince && addressCity ? `${addressProvince} ${addressCity}` : '지역 정보 없음'}
                  </div>
                </div>
              )}
            </div>
          
          {/* 판매회원 추가 정보 섹션 */}
          {role === 'seller' && (
            <>
              {/* 판매회원 구분 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  판매회원 구분
                </label>
                <div className="p-2 bg-gray-50 rounded-md">
                  <span className="font-medium">{getSellerCategoryLabel(sellerCategory)}</span>
                </div>
              </div>

              {/* 사업자등록번호 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    사업자등록번호
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditField('business_number');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    수정
                  </button>
                </div>
                
                {isEditing && editField === 'business_number' ? (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={businessNumber}
                      onChange={(e) => setBusinessNumber(e.target.value)}
                      className="flex-1 p-2 border rounded-md mr-2"
                      placeholder="사업자등록번호를 입력하세요 (예: 123-45-67890)"
                    />
                    <button
                      onClick={() => handleProfileUpdate()}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditField(null);
                        setBusinessNumber(businessNumber || '');
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm ml-2"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    <span className="font-medium">{businessNumber || '사업자등록번호 정보 없음'}</span>
                  </div>
                )}
              </div>

              {/* 비대면 판매가능 영업소 인증 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    비대면 판매가능 영업소 인증
                  </label>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditField('remote_sales');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    수정
                  </button>
                </div>
                
                {isEditing && editField === 'remote_sales' ? (
                  <div className="space-y-2">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="remote_sales"
                        checked={isRemoteSales}
                        onChange={(e) => setIsRemoteSales(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remote_sales" className="ml-2 text-sm text-gray-700">
                        비대면 판매가능 영업소 인증
                      </label>
                    </div>
                    
                    {isRemoteSales && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          사업자등록증 업로드
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setBusinessRegFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProfileUpdate()}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditField(null);
                          setIsRemoteSales(false);
                          setBusinessRegFile(null);
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    <span className="font-medium">
                      {isRemoteSales ? '✓ 인증 완료' : '미인증'}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* 로그인 방식 */}
        <div>
          <p className="text-sm text-gray-500">로그인 방식</p>
          <p className="font-medium">{getLoginProviderLabel(user)}</p>
        </div>
        
        {/* 회원 구분 */}
        {/* 성공 메시지 */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm mt-2">
            {successMessage}
          </div>
        )}
        
        {/* 닉네임 제한 모달 */}
        <NicknameLimitModal
          isOpen={showLimitModal}
          onClose={() => {
            setShowLimitModal(false);
            // 변경 가능한 경우 수정 모드 활성화
            if (limitModalData.canChange) {
              setIsEditing(true);
              setEditField('nickname');
              setNicknameError('');
              setNicknameChecked(false);
              setNicknameAvailable(false);
            }
          }}
          remainingChanges={limitModalData.remainingChanges}
          nextAvailableDate={limitModalData.nextAvailableDate}
          canChange={limitModalData.canChange}
        />
        
        {/* 오류 메시지 */}
        {error && (
          <div ref={errorRef} className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm mt-2 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 회원 유형 (하단 요약) */}
      <div className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-100">
        <p className="text-sm text-gray-500">회원 유형</p>
        <p className="font-medium">
          {role === 'expert' ? '전문가' : role === 'seller' ? '판매자' : '구매자'}
        </p>
        {role === 'expert' && expertCategory && (
          <p className="text-xs text-gray-600 mt-1">{expertCategory}</p>
        )}
      </div>

      {/* 푸시 알림 설정 카드 - 마케팅 알림 시스템 구현 후 활성화 예정 */}
      {/* <Card className="p-6 mb-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          푸시 알림 설정
        </h3>

        {isLoadingSettings ? (
          <div className="text-center py-4 text-gray-500">설정을 불러오는 중...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Label htmlFor="trade-notifications" className="text-sm font-medium cursor-pointer">
                  거래 알림
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  공구, 중고거래 관련 알림 (가격제안, 거래확정 등)
                </p>
              </div>
              <Switch
                id="trade-notifications"
                checked={pushNotificationSettings.trade_notifications}
                onCheckedChange={() => handlePushNotificationChange('trade_notifications')}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Label htmlFor="marketing-notifications" className="text-sm font-medium cursor-pointer">
                  마케팅 알림
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  이벤트, 프로모션 등의 마케팅 알림
                </p>
              </div>
              <Switch
                id="marketing-notifications"
                checked={pushNotificationSettings.marketing_notifications}
                onCheckedChange={() => handlePushNotificationChange('marketing_notifications')}
              />
            </div>
          </div>
        )}
      </Card> */}

      {/* 로그아웃 버튼을 왼쪽 하단에 배치 */}
      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm text-gray-600"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  );
}

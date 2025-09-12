'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import RegionDropdown from '@/components/address/RegionDropdown';
import { PhoneVerification } from '@/components/auth/PhoneVerification';

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
  const [error, setError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const nicknameRef = useRef<HTMLDivElement>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  
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
  
  // 지역 목록 가져오기
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/`);
        if (response.ok) {
          const data = await response.json();
          setRegions(data);
        }
      } catch (error) {
        console.error('지역 정보 가져오기 오류:', error);
      }
    };
    fetchRegions();
  }, []);

  /**
   * 이메일 주소 업데이트 함수
   * JWT 토큰을 활용하여 사용자 프로필 업데이트
   */
  /**
   * 로그아웃 처리 함수
   */
  const handleLogout = () => {
    logout();
    router.push('/');
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
      address_region_id?: number | null,
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
          // 모든 지역 데이터 가져오기
          const regionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/`);
          const regionsData = await regionsResponse.json();
          
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">사용자 정보</h2>
        <div className="flex flex-col gap-4 mt-6">
          {/* 판매회원인 경우 이용권 관리 링크 표시 */}
          {role === 'seller' && (
            <button
              onClick={() => router.push('/mypage/seller/bid-tokens')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              이용권 관리
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">프로필 정보</h3>
          
          {/* 아이디 섹션 - 카카오 계정이 아닌 경우에만 표시 */}
          {user?.sns_type !== 'kakao' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
              <span className="font-medium text-lg">{user?.username || '아이디 정보 없음'}</span>
            </div>
          )}
          
          {/* 닉네임 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">닉네임</label>
              <button
                onClick={async () => {
                  console.log('🔥 닉네임 수정 버튼 클릭됨!');
                  console.log('Access Token:', accessToken ? 'exists' : 'missing');
                  
                  // 닉네임 변경 가능 여부 먼저 확인
                  try {
                    console.log('🌐 API 호출 시작:', `${process.env.NEXT_PUBLIC_API_URL}/auth/nickname-change-status/`);
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/nickname-change-status/`, {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`
                      }
                    });
                    
                    console.log('📡 Response:', response.status, response.ok);
                    
                    if (response.ok) {
                      const data = await response.json();
                      console.log('📊 Response data:', data);
                      if (!data.can_change) {
                        const nextDate = data.next_available_date ? new Date(data.next_available_date).toLocaleDateString('ko-KR') : '알 수 없음';
                        setNicknameError(`30일에 2회까지만 변경 가능합니다. 다음 변경 가능일: ${nextDate}`);
                        return;
                      }
                    } else {
                      console.log('❌ Error response:', await response.text());
                    }
                  } catch (error) {
                    console.error('💥 닉네임 변경 상태 확인 실패:', error);
                    // 에러가 발생해도 수정은 진행 (백엔드에서 최종 검증)
                  }
                  
                  // 변경 가능하면 수정 모드 활성화
                  console.log('✅ 수정 모드 활성화');
                  setIsEditing(true);
                  setEditField('nickname');
                  setNicknameError('');
                  setNicknameChecked(false);
                  setNicknameAvailable(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                수정
              </button>
            </div>
            
            {isEditing && editField === 'nickname' ? (
              <div ref={nicknameRef}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setNicknameError('');
                      setNicknameChecked(false);
                      setNicknameAvailable(false);
                    }}
                    className={`flex-1 p-2 border rounded-md ${nicknameError ? 'border-red-500' : nicknameAvailable ? 'border-green-500' : ''}`}
                    placeholder="닉네임 (2-15자)"
                    maxLength={15}
                  />
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
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    중복체크
                  </button>
                  <button
                    onClick={() => {
                      if (!nicknameChecked || !nicknameAvailable) {
                        setNicknameError('닉네임 중복체크를 해주세요.');
                        return;
                      }
                      handleProfileUpdate();
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
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
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    취소
                  </button>
                </div>
                {nicknameError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{nicknameError}</span>
                    </p>
                  </div>
                )}
                {nicknameAvailable && !nicknameError && (
                  <p className="text-sm text-green-600 mt-1">✓ 사용 가능한 닉네임입니다</p>
                )}
              </div>
            ) : (
              <div>
                <div className="p-2 bg-gray-50 rounded-md">
                  <span className="font-medium">{nickname || '닉네임 정보 없음'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">30일에 2회 변경 가능합니다</p>
              </div>
            )}
          </div>
          
          {/* 이메일 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
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
                <span className="font-medium">{email || '이메일 정보 없음'}</span>
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
                  <span className="font-medium">{firstName || '정보 없음'}</span>
                </div>
              </div>
            </>
          )}
          
          {/* 휴대폰 번호 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                휴대폰 번호
                {authUser?.sns_type === 'kakao' && !phoneNumber && (
                  <>
                    <span className="text-red-500 ml-1">⚠️</span>
                    <span className="text-red-500 text-xs ml-2">
                      {role === 'seller' ? '공구 입찰에 참여하기 위한 필수 입력 항목입니다.' : '공구에 참여하기 위한 필수 입력 항목입니다.'}
                    </span>
                  </>
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
                    <span className="font-medium text-lg">
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
          
          {/* 주소 섹션 - 모든 회원 공통 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {role === 'seller' ? '사업장 주소/영업활동 지역' : '주요활동지역'}
                  {authUser?.sns_type === 'kakao' && (!addressProvince || !addressCity) && (
                    <>
                      <span className="text-red-500 ml-1">⚠️</span>
                      <span className="text-red-500 text-xs ml-2">
                        {role === 'seller' ? '공구 입찰에 참여하기 위한 필수 입력 항목입니다.' : '공구에 참여하기 위한 필수 입력 항목입니다.'}
                      </span>
                    </>
                  )}
                </label>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditField('address');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  수정
                </button>
              </div>
              
              {isEditing && editField === 'address' ? (
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
                      onClick={() => handleProfileUpdate()}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditField(null);
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-gray-50 rounded-md">
                  <div className="font-medium">
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
        <div>
          <p className="text-sm text-gray-500">회원 구분</p>
          <p className="font-medium">
            {role === 'seller' ? '판매회원' : '일반회원'}
            {role === 'seller' && isBusinessVerified && (
              <span className="ml-2 text-xs text-green-600">✓ 사업자 인증 완료</span>
            )}
          </p>
        </div>
        
        {/* 성공 메시지 */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm mt-2">
            {successMessage}
          </div>
        )}
        
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
    </div>
  );
}

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import RegionDropdown from '@/components/address/RegionDropdown';

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
  if (type === 'email') return '이메일';
  if (!type) return '직접 가입';
  return type;
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
}

export default function ProfileSection() {
  const { user: authUser, setUser, accessToken, isAuthenticated, isLoading, logout } = useAuth();
  // 확장된 타입으로 사용자 정보를 처리
  const user = authUser as unknown as ExtendedUser;
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressRegion, setAddressRegion] = useState<any>(null);
  const [addressDetail, setAddressDetail] = useState('');
  const [addressProvince, setAddressProvince] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [role, setRole] = useState('');
  const [isBusinessVerified, setIsBusinessVerified] = useState(false);
  const [businessNumber, setBusinessNumber] = useState('');  // 사업자등록번호
  const [businessAddressProvince, setBusinessAddressProvince] = useState('');
  const [businessAddressCity, setBusinessAddressCity] = useState('');
  const [isRemoteSales, setIsRemoteSales] = useState(false);
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [region, setRegion] = useState('');
  const [userType, setUserType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState<'email' | 'nickname' | 'phone_number' | 'address' | 'business_number' | 'business_address' | 'remote_sales' | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  
  // 컴포넌트 마운트시 백엔드에서 최신 프로필 정보 가져오기
  useEffect(() => {
    const fetchProfileData = async () => {
      if (accessToken) {
        try {
          console.log('백엔드에서 최신 프로필 정보 가져오기 시도...');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            console.log('백엔드에서 가져온 프로필 정보:', profileData);
            
            // 프로필 정보 상태 업데이트
            setEmail(profileData.email || '');
            setNickname(profileData.username || '');
            setPhoneNumber(profileData.phone_number || '');
            setAddressRegion(profileData.address_region || null);
            setAddressDetail(profileData.address_detail || '');
            setAddressProvince(profileData.address_province || '');
            setAddressCity(profileData.address_city || '');
            setRole(profileData.role || 'user');
            setIsBusinessVerified(profileData.is_business_verified || false);
            setRegion(profileData.region || '');
            setUserType(profileData.user_type || '일반');
            setBusinessNumber(profileData.business_number || '');  // 사업자등록번호 설정
            setBusinessAddressProvince(profileData.business_address_province || '');
            setBusinessAddressCity(profileData.business_address_city || '');
            setIsRemoteSales(profileData.is_remote_sales || false);
            
            // AuthContext와 로컬스토리지 업데이트
            if (setUser && authUser) {
              // authUser 사용 (user가 아님) - 원본 AuthContext의 사용자 객체
              const updatedUser = {
                ...authUser,
                email: profileData.email,
                username: profileData.username,
                sns_type: profileData.sns_type,
              };
              
              // AuthContext 업데이트
              setUser(updatedUser as any); // 타입 캐스팅 추가
              
              // 로컬스토리지 업데이트
              localStorage.setItem('user', JSON.stringify(updatedUser));
              localStorage.setItem('auth.user', JSON.stringify(updatedUser));
              
              console.log('사용자 정보 업데이트 완료:', updatedUser);
            }
          } else {
            console.error('프로필 정보 가져오기 실패:', response.status);
          }
        } catch (error) {
          console.error('프로필 정보 가져오기 오류:', error);
        }
      }
    };
    
    fetchProfileData();
  }, [accessToken, setUser]); // user 의존성 제거
  
  // 이메일, 닉네임, 지역, 회원구분 필드 초기화 (선택적 백업 용도)
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    
    // 닉네임 초기화 - username 또는 nickname 또는 이메일 앞부분 사용
    if (user?.username) {
      setNickname(user.username);
    } else if (user?.nickname) {
      setNickname(user.nickname);
    } else if (user?.email) {
      // 닉네임이 없는 경우 이메일 앞부분을 기본 닉네임으로 사용
      const defaultNickname = user.email.split('@')[0];
      setNickname(defaultNickname);
    }
    
    // 지역 정보 초기화
    if (user?.region) {
      setRegion(user.region);
    }
    
    // 회원구분 초기화
    if (user?.user_type) {
      setUserType(user.user_type);
    } else {
      setUserType('일반');
    }
  }, [user?.email, user?.username, user?.nickname, user?.region, user?.user_type]);
  
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
  const handleProfileUpdate = async () => {
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
      username?: string,
      phone_number?: string,
      address_region_id?: number | null,
      address_detail?: string,
      address_province?: string,
      address_city?: string,
      business_number?: string,
      business_address_province?: string,
      business_address_city?: string,
      is_remote_sales?: boolean
    } = {};
    
    if (editField === 'email') {
      updateData.email = email;
    } else if (editField === 'nickname') {
      updateData.username = nickname; // 백엔드에서는 username 필드 사용
    } else if (editField === 'phone_number') {
      updateData.phone_number = phoneNumber;
    } else if (editField === 'address') {
      updateData.address_province = addressProvince;
      updateData.address_city = addressCity;
      updateData.address_detail = addressDetail;
    } else if (editField === 'business_number') {
      updateData.business_number = businessNumber;
    } else if (editField === 'business_address') {
      updateData.business_address_province = businessAddressProvince;
      updateData.business_address_city = businessAddressCity;
    } else if (editField === 'remote_sales') {
      updateData.is_remote_sales = isRemoteSales;
    }

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
        const errorData = await response.json();
        setError(errorData.error || '프로필 업데이트에 실패했습니다.');
        return;
      }

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
        setNickname(profileData.username);
        setPhoneNumber(profileData.phone_number || '');
        setAddressRegion(profileData.address_region || null);
        setAddressDetail(profileData.address_detail || '');
        setAddressProvince(profileData.address_province || '');
        setAddressCity(profileData.address_city || '');
        setRole(profileData.role || 'user');
        setIsBusinessVerified(profileData.is_business_verified || false);
        
        // AuthContext 및 로컬스토리지 동기화
        if (setUser) {
          const updatedUser = {
            ...authUser,
            email: profileData.email,
            username: profileData.username,
            sns_type: profileData.sns_type,
            provider: profileData.sns_type,
          };
          
          console.log('새로운 사용자 정보:', updatedUser);
          setUser(updatedUser as any);
          
          // 로컬스토리지 업데이트
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('auth.user', JSON.stringify(updatedUser));
        }
      }
      setIsEditing(false);
      setEditField(null);
      setError('');
      
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
          {/* 판매회원인 경우 입찰권 구매 링크 표시 */}
          {role === 'seller' && (
            <button
              onClick={() => router.push('/bid-tickets')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              입찰권 구매하기
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
          
          {/* 닉네임 섹션 */}
          {/* 닉네임 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">닉네임</label>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditField('nickname');
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                수정
              </button>
            </div>
            
            {isEditing && editField === 'nickname' ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 p-2 border rounded-md mr-2"
                  placeholder="닉네임을 입력하세요"
                />
                <button
                  onClick={handleProfileUpdate}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditField(null);
                    setNickname(user?.username || '');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm ml-2"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="p-2 bg-gray-50 rounded-md">
                <span className="font-medium">{nickname || '닉네임 정보 없음'}</span>
              </div>
            )}
          </div>
          
          {/* 이메일 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">이메일</label>
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
                  onClick={handleProfileUpdate}
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
          
          {/* 휴대폰 번호 섹션 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                휴대폰 번호 {role === 'seller' && '(재인증)'}
                {authUser?.sns_type === 'kakao' && !phoneNumber && (
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
                  setEditField('phone_number');
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {role === 'seller' ? '재인증' : '수정'}
              </button>
            </div>
            
            {isEditing && editField === 'phone_number' ? (
              <div className="flex items-center">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 p-2 border rounded-md mr-2"
                  placeholder="휴대폰 번호를 입력하세요 (예: 01012345678)"
                />
                <button
                  onClick={handleProfileUpdate}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditField(null);
                    setPhoneNumber(phoneNumber || '');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm ml-2"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="p-2 bg-gray-50 rounded-md">
                <span className="font-medium">{phoneNumber || '휴대폰 번호 정보 없음'}</span>
              </div>
            )}
          </div>
          
          {/* 주소 섹션 - 일반회원만 표시 */}
          {(role === 'user' || role === 'buyer') && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  주요활동지역
                  {authUser?.sns_type === 'kakao' && (!addressProvince || !addressCity) && (
                    <>
                      <span className="text-red-500 ml-1">⚠️</span>
                      <span className="text-red-500 text-xs ml-2">
                        공구에 참여하기 위한 필수 입력 항목입니다.
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
                  <input
                    type="text"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="상세 주소를 입력하세요"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleProfileUpdate}
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
                <div className="p-2 bg-gray-50 rounded-md space-y-1">
                  <div className="font-medium">
                    {addressProvince && addressCity ? `${addressProvince} ${addressCity}` : '지역 정보 없음'}
                  </div>
                  {addressDetail && (
                    <div className="text-sm text-gray-600">{addressDetail}</div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* 판매회원 추가 정보 섹션 */}
          {role === 'seller' && (
            <>
              {/* 사업장 주소/영업활동 지역 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    사업장 주소/영업활동 지역
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditField('business_address');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    수정
                  </button>
                </div>
                
                {isEditing && editField === 'business_address' ? (
                  <div className="space-y-2">
                    <RegionDropdown
                      selectedProvince={businessAddressProvince}
                      selectedCity={businessAddressCity}
                      onSelect={(province, city) => {
                        setBusinessAddressProvince(province);
                        setBusinessAddressCity(city);
                      }}
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleProfileUpdate}
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
                    <span className="font-medium">
                      {businessAddressProvince && businessAddressCity 
                        ? `${businessAddressProvince} ${businessAddressCity}` 
                        : '사업장 주소 정보 없음'}
                    </span>
                  </div>
                )}
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
                      onClick={handleProfileUpdate}
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
                        onClick={handleProfileUpdate}
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
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm mt-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

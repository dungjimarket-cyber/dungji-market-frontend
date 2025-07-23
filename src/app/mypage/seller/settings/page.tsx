'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save, Upload, Phone } from 'lucide-react';
import RegionDropdown from '@/components/address/RegionDropdown';
import { getSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';
import { tokenUtils } from '@/lib/tokenUtils';
import { toast } from '@/components/ui/use-toast';

export default function SellerSettings() {
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    description: '',
    phone: '',
    address: '',
    businessAddressProvince: '',
    businessAddressCity: '',
    businessNumber: '',
    isRemoteSales: false,
    businessRegFile: null as File | null,
    notificationEnabled: true,
    profileImage: ''
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
        setFormData({
          name: data.name || '',
          nickname: data.nickname || data.username || '',
          description: data.description || '',
          phone: data.phone || '',
          address: data.address || '',
          businessAddressProvince: data.businessAddressProvince || '',
          businessAddressCity: data.businessAddressCity || '',
          businessNumber: data.businessNumber || '',
          isRemoteSales: data.isRemoteSales || false,
          businessRegFile: null,
          notificationEnabled: data.notificationEnabled || true,
          profileImage: data.profileImage || ''
        });
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

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, notificationEnabled: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 여기서 실제 API 호출이 이루어져야 함
      // 아직 updateSellerProfile API가 없으므로 임시로 성공 처리
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: '프로필 저장 성공',
        description: '프로필 정보가 성공적으로 저장되었습니다.'
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

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">프로필 정보</TabsTrigger>
          <TabsTrigger value="account">계정 설정</TabsTrigger>
          <TabsTrigger value="notification">알림 설정</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>프로필 정보</CardTitle>
              <CardDescription>
                판매자 프로필 정보를 설정합니다. 입력한 정보는 공개적으로 표시될 수 있습니다.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileImage">프로필 이미지</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {formData.profileImage ? (
                        <img 
                          src={formData.profileImage} 
                          alt="프로필 이미지" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      이미지 업로드
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">닉네임</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="닉네임을 입력하세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">판매자명</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="판매자명을 입력하세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">소개</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="판매자 소개를 입력하세요"
                    rows={4}
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
                    selectedProvince={formData.businessAddressProvince}
                    selectedCity={formData.businessAddressCity}
                    onSelect={(province, city) => {
                      setFormData(prev => ({
                        ...prev,
                        businessAddressProvince: province,
                        businessAddressCity: city
                      }));
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessNumber">사업자등록번호</Label>
                  <Input
                    id="businessNumber"
                    name="businessNumber"
                    value={formData.businessNumber}
                    onChange={handleChange}
                    placeholder="사업자등록번호를 입력하세요 (예: 123-45-67890)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remoteSales">비대면 판매가능 영업소 인증</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">비대면 판매가능 영업소 인증</span>
                      <Switch
                        id="remoteSales"
                        checked={formData.isRemoteSales}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, isRemoteSales: checked }))
                        }
                      />
                    </div>
                    {formData.isRemoteSales && (
                      <div className="space-y-2">
                        <Label htmlFor="businessRegFile" className="text-sm">사업자등록증 업로드</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="businessRegFile"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setFormData(prev => ({ ...prev, businessRegFile: file }));
                            }}
                            className="flex-1"
                          />
                          <Button type="button" variant="outline" size="sm">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        {formData.businessRegFile && (
                          <p className="text-sm text-gray-600">
                            선택된 파일: {formData.businessRegFile.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>계정 설정</CardTitle>
              <CardDescription>
                계정 보안 및 접근 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  readOnly
                  disabled
                />
                <p className="text-sm text-gray-500">이메일은 변경할 수 없습니다.</p>
              </div>
              
              <div className="pt-4">
                <Button variant="outline">비밀번호 변경</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notification">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>
                알림 및 이메일 수신 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">알림 활성화</h3>
                  <p className="text-sm text-gray-500">입찰 및 채팅 알림을 받습니다.</p>
                </div>
                <Switch
                  checked={formData.notificationEnabled}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">이메일 알림</h3>
                  <p className="text-sm text-gray-500">중요 알림을 이메일로 받습니다.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>설정 저장</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
import { ArrowLeft, Loader2, Save, Phone } from 'lucide-react';
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
    businessNumber1: '',
    businessNumber2: '',
    businessNumber3: '',
    isRemoteSales: false
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
          businessNumber1: businessNumParts[0] || '',
          businessNumber2: businessNumParts[1] || '',
          businessNumber3: businessNumParts[2] || '',
          isRemoteSales: data.isRemoteSales || false
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

      await updateSellerProfile(updateData);
      
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
                  <Label htmlFor="nickname">닉네임 (상호명)</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="닉네임 또는 상호명을 입력하세요"
                    required
                  />
                  <p className="text-sm text-gray-500">판매자님의 닉네임이 공구에 표시됩니다.</p>
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

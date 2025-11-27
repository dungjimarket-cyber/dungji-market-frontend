'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Phone, LogOut, Bell, User, MapPin, Building2, FileText } from 'lucide-react';
import { tokenUtils } from '@/lib/tokenUtils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchMyExpertProfile,
  updateExpertProfile,
  ExpertProfile,
} from '@/lib/api/expertService';
import RequireAuth from '@/components/auth/RequireAuth';

export default function ExpertSettings() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout, accessToken } = useAuth();
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 편집 모드 상태
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [isEditingIntroduction, setIsEditingIntroduction] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    tagline: '',
    introduction: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    const loadExpertProfile = async () => {
      try {
        const token = await tokenUtils.getAccessToken();
        if (!token) {
          router.push('/login?callbackUrl=/mypage/expert/settings');
          return;
        }

        const data = await fetchMyExpertProfile(token);
        if (!data) {
          // 전문가 프로필이 없으면 등록 페이지로
          router.push('/expert/register');
          return;
        }

        setProfile(data);
        setFormData({
          tagline: data.tagline || '',
          introduction: data.introduction || '',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
        });
      } catch (error) {
        console.error('전문가 프로필 로드 오류:', error);
        toast({
          variant: 'destructive',
          title: '오류',
          description: '프로필 정보를 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadExpertProfile();
  }, [router, toast]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // 한 줄 소개 저장
  const saveTagline = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const result = await updateExpertProfile({ tagline: formData.tagline }, accessToken);
      if (result.success) {
        setIsEditingTagline(false);
        setProfile(prev => prev ? { ...prev, tagline: formData.tagline } : null);
        toast({
          title: '저장 완료',
          description: '한 줄 소개가 수정되었습니다.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: '저장 실패',
          description: result.message
        });
      }
    } catch (error) {
      console.error('한 줄 소개 저장 오류:', error);
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '저장 중 오류가 발생했습니다.'
      });
    } finally {
      setSaving(false);
    }
  };

  // 상세 소개 저장
  const saveIntroduction = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const result = await updateExpertProfile({ introduction: formData.introduction }, accessToken);
      if (result.success) {
        setIsEditingIntroduction(false);
        setProfile(prev => prev ? { ...prev, introduction: formData.introduction } : null);
        toast({
          title: '저장 완료',
          description: '상세 소개가 수정되었습니다.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: '저장 실패',
          description: result.message
        });
      }
    } catch (error) {
      console.error('상세 소개 저장 오류:', error);
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '저장 중 오류가 발생했습니다.'
      });
    } finally {
      setSaving(false);
    }
  };

  // 연락처 저장
  const saveContact = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const result = await updateExpertProfile({
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
      }, accessToken);
      if (result.success) {
        setIsEditingContact(false);
        setProfile(prev => prev ? {
          ...prev,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
        } : null);
        toast({
          title: '저장 완료',
          description: '연락처 정보가 수정되었습니다.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: '저장 실패',
          description: result.message
        });
      }
    } catch (error) {
      console.error('연락처 저장 오류:', error);
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '저장 중 오류가 발생했습니다.'
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

  if (!profile) {
    return null;
  }

  return (
    <RequireAuth>
      <div className="container py-8 max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold ml-2">전문가 정보 설정</h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/mypage')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            뒤로가기
          </Button>
        </div>

        {/* 기본 정보 (읽기 전용) */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 아이디 */}
            <div className="space-y-2">
              <Label>아이디</Label>
              <Input
                value={user?.username || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">아이디는 변경할 수 없습니다</p>
            </div>

            {/* 전문가 유형 */}
            <div className="space-y-2">
              <Label>전문 분야</Label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border">
                  {profile.category.icon} {profile.category.name}
                </span>
              </div>
              <p className="text-xs text-gray-500">전문 분야 변경은 고객센터로 문의해 주세요</p>
            </div>

            {/* 대표자명 */}
            <div className="space-y-2">
              <Label>대표자명</Label>
              <Input
                value={profile.representative_name}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* 사업자 정보 */}
            {profile.is_business && (
              <div className="space-y-2">
                <Label>상호명</Label>
                <Input
                  value={profile.business_name || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            )}

            {/* 인증 상태 */}
            <div className="space-y-2">
              <Label>인증 상태</Label>
              <div className="flex items-center gap-2">
                {profile.status === 'verified' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    인증 완료
                  </span>
                )}
                {profile.status === 'pending' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    심사 중
                  </span>
                )}
                {profile.status === 'rejected' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    반려됨
                  </span>
                )}
                {profile.status === 'suspended' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    정지됨
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 영업 지역 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" />
              영업 지역
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.regions.length > 0 ? (
                profile.regions.map((region) => (
                  <span
                    key={region.code}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    {region.full_name || region.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">등록된 영업 지역이 없습니다</p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">영업 지역 변경은 고객센터로 문의해 주세요</p>
          </CardContent>
        </Card>

        {/* 소개 정보 (수정 가능) */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              소개 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 한 줄 소개 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>한 줄 소개</Label>
                {!isEditingTagline && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingTagline(true)}
                    className="text-gray-500"
                  >
                    수정
                  </Button>
                )}
              </div>
              {!isEditingTagline ? (
                <Input
                  value={profile.tagline || '한 줄 소개를 입력해 주세요'}
                  disabled
                  className="bg-gray-50"
                />
              ) : (
                <>
                  <Input
                    value={formData.tagline}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="고객에게 보여질 한 줄 소개를 입력하세요"
                    maxLength={50}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingTagline(false);
                        setFormData(prev => ({ ...prev, tagline: profile.tagline || '' }));
                      }}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveTagline}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      저장
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* 상세 소개 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>상세 소개</Label>
                {!isEditingIntroduction && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingIntroduction(true)}
                    className="text-gray-500"
                  >
                    수정
                  </Button>
                )}
              </div>
              {!isEditingIntroduction ? (
                <Textarea
                  value={profile.introduction || '상세 소개를 입력해 주세요'}
                  disabled
                  className="bg-gray-50 min-h-[100px]"
                />
              ) : (
                <>
                  <Textarea
                    value={formData.introduction}
                    onChange={(e) => setFormData(prev => ({ ...prev, introduction: e.target.value }))}
                    placeholder="경력, 전문 분야, 서비스 특징 등을 자세히 소개해 주세요"
                    className="min-h-[150px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 text-right">{formData.introduction.length}/500</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingIntroduction(false);
                        setFormData(prev => ({ ...prev, introduction: profile.introduction || '' }));
                      }}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveIntroduction}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      저장
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 연락처 정보 (수정 가능) */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-5 w-5" />
              연락처 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">고객과 연결 시 공개되는 연락처입니다</p>
              {!isEditingContact && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingContact(true)}
                  className="text-gray-500"
                >
                  수정
                </Button>
              )}
            </div>

            {!isEditingContact ? (
              <>
                <div className="space-y-2">
                  <Label>연락처</Label>
                  <Input
                    value={profile.contact_phone || '미등록'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>이메일</Label>
                  <Input
                    value={profile.contact_email || '미등록'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>연락처</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>이메일</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingContact(false);
                      setFormData(prev => ({
                        ...prev,
                        contact_phone: profile.contact_phone || '',
                        contact_email: profile.contact_email || '',
                      }));
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveContact}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    저장
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 상담 수신 설정 안내 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              상담 수신 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              상담 수신 설정은 전문가 대시보드에서 변경할 수 있습니다.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/expert/dashboard')}
            >
              전문가 대시보드로 이동
            </Button>
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
      </div>
    </RequireAuth>
  );
}

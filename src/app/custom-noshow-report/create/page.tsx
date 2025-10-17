'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, AlertCircle, Upload, X, User, Phone } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

function CustomNoShowReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, accessToken, user } = useAuth();
  const groupbuyId = searchParams.get('groupbuy') || searchParams.get('groupbuyId') || searchParams.get('groupbuy_id');

  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [groupbuyInfo, setGroupbuyInfo] = useState<any>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>([]);
  const [sellerId, setSellerId] = useState<string>('');
  const [authChecked, setAuthChecked] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGroupbuySeller, setIsGroupbuySeller] = useState(false); // 이 공구에서 내가 판매자인지

  const isButtonDisabled = loading ||
                          !content.trim() ||
                          content.trim().length < 20 ||
                          (isGroupbuySeller && selectedBuyerIds.length === 0);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (typeof window === 'undefined') return;

      await new Promise(resolve => setTimeout(resolve, 1000));

      const token = accessToken ||
                   localStorage.getItem('accessToken') ||
                   sessionStorage.getItem('accessToken');

      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }

      setAuthChecked(true);

      if (groupbuyId) {
        fetchGroupbuyInfo();
        checkExistingReport();
      }
    };

    checkAuthAndFetch();
  }, [groupbuyId, user, accessToken]);

  useEffect(() => {
    // 공구 정보가 로드되고, 내가 이 공구의 판매자인 경우에만 참여자 목록 조회
    if (isGroupbuySeller && groupbuyId && accessToken && authChecked) {
      fetchParticipants();
    }
  }, [isGroupbuySeller, groupbuyId, accessToken, authChecked]);

  const fetchGroupbuyInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${groupbuyId}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroupbuyInfo(data);
        console.log('Custom groupbuy info fetched:', data);

        // 이 공구에서 내가 판매자인지 확인 (계정 role이 아닌 실제 공구의 판매자 여부)
        const amISeller = data.seller === user?.id || String(data.seller) === String(user?.id);
        setIsGroupbuySeller(amISeller);
        console.log('Am I the seller of this groupbuy?', amISeller, 'groupbuy seller:', data.seller, 'my id:', user?.id);

        // 내가 판매자가 아닌 경우(=참여자) 판매자 ID 저장
        if (!amISeller && data.seller) {
          setSellerId(String(data.seller));
          console.log('Seller ID:', data.seller);
        }
      }
    } catch (error) {
      console.error('공구 정보 조회 실패:', error);
    }
  };

  const checkExistingReport = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-noshow-reports/?groupbuy_id=${groupbuyId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const reports = Array.isArray(data) ? data : (data.results || []);

        const myReport = reports.find((report: any) =>
          report.reporter?.id === user?.id ||
          report.reporter === user?.id
        );

        if (myReport) {
          console.log('기존 노쇼 신고 발견:', myReport);
          setExistingReport(myReport);
          setContent(myReport.content || '');
          setIsEditMode(true);

          if (isGroupbuySeller && myReport.reported_user) {
            const reportedUserId = typeof myReport.reported_user === 'object'
              ? myReport.reported_user.id
              : myReport.reported_user;
            setSelectedBuyerIds([reportedUserId.toString()]);
          }
        }
      }
    } catch (error) {
      console.error('기존 노쇼 신고 확인 실패:', error);
    }
  };

  const fetchParticipants = async () => {
    console.log('fetchParticipants called with groupbuyId:', groupbuyId);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${groupbuyId}/participants/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Participants endpoint response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Raw participants data:', data);

        let participantsData = [];
        if (Array.isArray(data)) {
          participantsData = data;
        } else if (data.participants && Array.isArray(data.participants)) {
          participantsData = data.participants;
        } else if (data.results && Array.isArray(data.results)) {
          participantsData = data.results;
        }

        // confirmed 상태의 참여자만 필터링
        const confirmedParticipants = participantsData.filter((p: any) => p.status === 'confirmed');

        setParticipants(confirmedParticipants);
        console.log('Participants set successfully:', confirmedParticipants);
        console.log('Number of participants:', confirmedParticipants.length);
      } else {
        console.error('Failed to fetch participants, status:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        toast.error('참여자 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('참여자 목록 조회 실패:', error);
      toast.error('참여자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (evidenceFiles.length + files.length > 3) {
      toast.error('증빙 파일은 최대 3개까지 업로드 가능합니다.');
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`);
        continue;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: JPG, PNG, PDF 파일만 업로드 가능합니다.`);
        continue;
      }

      newFiles.push(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }

    setEvidenceFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!existingReport) return;

    if (!confirm('정말로 노쇼 신고를 취소하시겠습니까?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-noshow-reports/${existingReport.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        toast.success('노쇼 신고가 취소되었습니다.');
        router.push('/mypage');
      } else {
        toast.error('신고 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('노쇼 신고 삭제 오류:', error);
      toast.error('신고 취소 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit 시작');

    if (!content.trim()) {
      toast.error('신고 내용을 입력해주세요.');
      return;
    }

    if (content.trim().length < 20) {
      toast.error('신고 내용은 20자 이상 작성해주세요.');
      return;
    }

    setLoading(true);

    try {
      let reportType: 'buyer_noshow' | 'seller_noshow';

      if (!isGroupbuySeller) {
        // 내가 이 공구의 참여자 → 판매자 노쇼 신고
        reportType = 'seller_noshow';

        if (!sellerId) {
          toast.error('판매자 정보를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('reported_user', sellerId);
        formData.append('custom_groupbuy', groupbuyId || '');
        formData.append('report_type', reportType);
        formData.append('content', content.trim());

        evidenceFiles.forEach((file, index) => {
          formData.append(`evidence_image_${index + 1}`, file);
        });

        const url = isEditMode && existingReport
          ? `${process.env.NEXT_PUBLIC_API_URL}/custom-noshow-reports/${existingReport.id}/`
          : `${process.env.NEXT_PUBLIC_API_URL}/custom-noshow-reports/`;

        const method = isEditMode ? 'PATCH' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: formData
        });

        if (response.ok) {
          toast.success(isEditMode ? '노쇼 신고가 수정되었습니다.' : '노쇼 신고가 접수되었습니다.');
          router.push('/mypage');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || '신고 접수에 실패했습니다.');
        }
      } else if (isGroupbuySeller) {
        // 내가 이 공구의 판매자 → 구매자 노쇼 신고
        reportType = 'buyer_noshow';
        if (selectedBuyerIds.length === 0) {
          toast.error('신고할 구매자를 선택해주세요.');
          setLoading(false);
          return;
        }

        // 여러 구매자에 대해 각각 신고 제출
        const promises = selectedBuyerIds.map(async (buyerId) => {
          const formData = new FormData();
          formData.append('reported_user', buyerId);
          formData.append('custom_groupbuy', groupbuyId || '');
          formData.append('report_type', reportType);
          formData.append('content', content.trim());

          evidenceFiles.forEach((file, index) => {
            formData.append(`evidence_image_${index + 1}`, file);
          });

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-noshow-reports/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
          });

          return { buyerId, response };
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.response.ok).length;
        const failCount = results.length - successCount;

        if (successCount > 0) {
          toast.success(`${successCount}명의 구매자에 대한 노쇼 신고가 접수되었습니다.`);
          if (failCount > 0) {
            toast.warning(`${failCount}명의 신고는 실패했습니다. (이미 신고된 구매자일 수 있습니다)`);
          }
          router.push('/custom-deals/my');
        } else {
          toast.error('노쇼 신고 접수에 실패했습니다.');
        }
        setLoading(false);
        return;
      } else {
        toast.error('신고 권한이 없습니다.');
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('노쇼 신고 오류:', error);
      toast.error(`신고 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">인증 확인 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!groupbuyId || !groupbuyInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">공구 정보가 없습니다.</p>
            <div className="text-center mt-4">
              <Link href="/custom-deals/my">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  커공 관리로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-2xl min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          {isEditMode ? '노쇼 신고 수정' : '노쇼 신고하기'}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로가기
        </Button>
      </div>

      {groupbuyInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>공구:</strong> {groupbuyInfo.title}
          </p>
        </div>
      )}

      {/* 쿠폰전용 안내 */}
      {groupbuyInfo?.pricing_type === 'coupon_only' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>쿠폰전용 공구는 노쇼 신고가 제공되지 않습니다.</strong>
            </p>
          </div>
        </div>
      )}

      <Card className="flex-1 mb-4">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 판매자 정보 표시 (내가 참여자인 경우) */}
            {!isGroupbuySeller && groupbuyInfo && (
              <div className="space-y-2">
                <Label>신고 대상 판매자</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {groupbuyInfo.seller_name || '판매자'}
                      </p>
                      {groupbuyInfo.phone_number && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {groupbuyInfo.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 구매자 선택 (내가 판매자인 경우) */}
            {isGroupbuySeller && (
              <div className="space-y-2">
                <Label>노쇼한 구매자 선택 (필수)</Label>
                {participants.length > 0 ? (
                  <>
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      {participants.map((participant) => {
                        // backend는 user를 ID(integer)로 반환, user_name은 별도 필드
                        const userId = participant.user_id || participant.user;

                        if (!userId) {
                          console.warn('User ID not found for participant:', participant);
                          return null;
                        }

                        // user_name은 백엔드에서 이미 "회원{id}" 형식으로 처리됨
                        const displayName = participant.user_name || `참여자 ${userId}`;
                        const phoneNumber = participant.phone_number || participant.phone || '연락처 없음';

                        return (
                          <div key={userId} className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                            <Checkbox
                              id={`buyer-${userId}`}
                              checked={selectedBuyerIds.includes(userId.toString())}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBuyerIds([...selectedBuyerIds, userId.toString()]);
                                } else {
                                  setSelectedBuyerIds(selectedBuyerIds.filter(id => id !== userId.toString()));
                                }
                              }}
                            />
                            <label
                              htmlFor={`buyer-${userId}`}
                              className="flex-1 cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-sm">{displayName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{phoneNumber}</span>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      노쇼한 구매자를 체크해주세요. (복수 선택 가능)
                    </p>
                  </>
                ) : (
                  <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                    <p className="text-sm text-yellow-800 mb-2">
                      구매자 정보를 불러오는 중입니다...
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={fetchParticipants}
                    >
                      다시 시도
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 신고 사유 입력 */}
            <div className="space-y-2">
              <Label htmlFor="content">신고 사유 (필수)</Label>
              <Textarea
                id="content"
                placeholder="신고 사유를 자세히 설명해주세요. (최소 20자 이상)
예: 약속 시간, 장소, 연락 시도 내용 등"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none"
                required
              />
              <p className="text-xs text-gray-500 text-right">
                {content.length}/500자
              </p>
            </div>

            {/* 파일 업로드 */}
            <div className="space-y-2">
              <Label>증빙자료 첨부 (선택, 최대 3개)</Label>
              {evidenceFiles.length < 3 && (
                <div className="flex items-center gap-4">
                  <label htmlFor="evidence-file" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">파일 추가 ({evidenceFiles.length}/3)</span>
                    </div>
                    <input
                      id="evidence-file"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {evidenceFiles.length > 0 && (
                <div className="space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {filePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {filePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`증빙자료 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">
                JPG, PNG, PDF 파일만 업로드 가능합니다. (파일당 최대 5MB, 총 3개까지)
              </p>
            </div>

            {/* 주의 사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">신고 전 확인사항</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>허위 신고 시 불이익이 있을 수 있습니다.</li>
                    <li>가능한 증빙 자료(메시지 캡처 등)를 준비해주세요.</li>
                    <li>신고 내용은 관리자가 검토 후 처리됩니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-2">
              <Link href="/custom-deals/my">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  신고 취소
                </Button>
              )}
              <Button
                type="button"
                disabled={isButtonDisabled}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.confirm(isEditMode ?
                    '신고 내용을 수정하시겠습니까?\n주의: 수정은 1회만 가능합니다.' :
                    '노쇼를 신고하시겠습니까?')) {
                    handleSubmit(e as any);
                  }
                }}
              >
                {loading ? (
                  isEditMode ? '수정 중...' : '신고 접수 중...'
                ) : (
                  isEditMode ? '신고 내용 수정' : '노쇼 신고하기'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomNoShowReportPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">로딩 중...</p>
      </div>
    }>
      <CustomNoShowReportContent />
    </Suspense>
  );
}

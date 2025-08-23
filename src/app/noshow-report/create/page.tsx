'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, AlertCircle, Upload, X, User, Phone } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

function NoShowReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, accessToken, user } = useAuth();
  const groupbuyId = searchParams.get('groupbuy') || searchParams.get('groupbuyId') || searchParams.get('groupbuy_id');
  
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [groupbuyInfo, setGroupbuyInfo] = useState<any>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 버튼 비활성화 조건 디버깅
  const isButtonDisabled = loading || 
                          !content.trim() || 
                          content.trim().length < 20 ||
                          (user?.role === 'seller' && selectedBuyerIds.length === 0);
  
  useEffect(() => {
    console.log('노쇼 신고 제출 버튼 상태:');
    console.log('- loading:', loading);
    console.log('- content.trim():', content.trim());
    console.log('- content.trim().length:', content.trim().length);
    console.log('- user?.role:', user?.role);
    console.log('- selectedBuyerIds:', selectedBuyerIds);
    console.log('- isButtonDisabled:', isButtonDisabled);
  }, [loading, content, user?.role, selectedBuyerIds, isButtonDisabled]);

  useEffect(() => {
    // 인증 체크를 지연시켜 세션 복원 시간을 확보
    const checkAuthAndFetch = async () => {
      // 클라이언트 사이드에서만 실행
      if (typeof window === 'undefined') return;
      
      // 1초 대기하여 인증 상태가 완전히 로드되도록 함
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 토큰 직접 체크
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

  const fetchGroupbuyInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroupbuyInfo(data);
        
        // 판매자인 경우 참여자 목록도 가져오기
        console.log('Current user role:', user?.role);
        if (user?.role === 'seller') {
          console.log('Fetching participants for seller...');
          fetchParticipants();
        }
      }
    } catch (error) {
      console.error('공구 정보 조회 실패:', error);
    }
  };

  // 기존 노쇼 신고 확인
  const checkExistingReport = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/?groupbuy_id=${groupbuyId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const reports = Array.isArray(data) ? data : (data.results || []);
        
        // 현재 사용자가 신고한 내역 찾기
        const myReport = reports.find((report: any) => 
          report.reporter?.id === user?.id || 
          report.reporter === user?.id
        );
        
        if (myReport) {
          console.log('기존 노쇼 신고 발견:', myReport);
          setExistingReport(myReport);
          setContent(myReport.content || '');
          setIsEditMode(true);
        }
      }
    } catch (error) {
      console.error('기존 노쇼 신고 확인 실패:', error);
    }
  };

  const fetchParticipants = async () => {
    console.log('fetchParticipants called with groupbuyId:', groupbuyId);
    try {
      // 먼저 일반 participants 엔드포인트 시도
      console.log('Trying participants endpoint...');
      let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/participants/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('Participants endpoint response status:', response.status);
      
      // If that fails, try the participations endpoint
      if (!response.ok) {
        console.log('Trying alternative participations endpoint...');
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participations/?groupbuy=${groupbuyId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        console.log('Participations endpoint response status:', response.status);
      }
      
      // 마지막으로 confirmed_buyers 엔드포인트 시도
      if (!response.ok) {
        console.log('Trying confirmed_buyers endpoint...');
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/confirmed_buyers/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        console.log('Confirmed buyers endpoint response status:', response.status);
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw participants data:', data);
        // Handle both response formats
        const participantsData = Array.isArray(data) ? data : (data.results || data);
        setParticipants(participantsData);
        console.log('Participants set successfully:', participantsData);
        console.log('Number of participants:', participantsData.length);
      } else {
        console.error('Failed to fetch participants, all endpoints failed');
        // 참여자 정보를 못 가져왔을 때 안내 메시지
        toast.error('구매자 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('참여자 목록 조회 실패:', error);
      toast.error('구매자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('JPG, PNG, PDF 파일만 업로드 가능합니다.');
      return;
    }

    setEvidenceFile(file);

    // 이미지 파일인 경우 미리보기
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview('');
    }
  };

  const removeFile = () => {
    setEvidenceFile(null);
    setFilePreview('');
  };

  const handleDelete = async () => {
    if (!existingReport) return;
    
    if (!confirm('정말로 노쇼 신고를 취소하시겠습니까?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/${existingReport.id}/`, {
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
    console.log('Content:', content);
    console.log('Content length:', content.trim().length);
    console.log('User role:', user?.role);
    console.log('GroupBuy ID:', groupbuyId);
    console.log('Edit mode:', isEditMode);
    console.log('Existing report:', existingReport);
    
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
      // 신고자의 role에 따라 자동으로 신고 유형 결정
      let reportedUserId;
      let reportType: 'buyer_noshow' | 'seller_noshow';
      
      if (user?.role === 'buyer') {
        // 구매자가 신고 → 판매자 노쇼
        reportType = 'seller_noshow';
        
        // 공구 정보에서 선택된 입찰 정보 확인
        const bidsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/bids/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json();
          console.log('Bids data:', bidsData);
          
          // accepted 또는 selected 상태의 입찰 찾기
          const acceptedBid = bidsData.find((bid: any) => 
            bid.status === 'accepted' || bid.status === 'selected' || bid.is_selected
          );
          
          console.log('Accepted bid:', acceptedBid);
          
          if (acceptedBid) {
            reportedUserId = acceptedBid.seller?.id || acceptedBid.seller_id || acceptedBid.seller;
            console.log('Reported user ID:', reportedUserId);
          } else {
            console.error('No accepted bid found');
            toast.error('선택된 판매자를 찾을 수 없습니다.');
            setLoading(false);
            return;
          }
        } else {
          console.error('Failed to fetch bids:', bidsResponse.status);
          toast.error('판매자 정보를 가져올 수 없습니다.');
          setLoading(false);
          return;
        }
      } else if (user?.role === 'seller') {
        // 판매자가 신고 → 구매자 노쇼
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
          formData.append('groupbuy', groupbuyId || '');
          formData.append('report_type', reportType);
          formData.append('content', content.trim());
          
          if (evidenceFile) {
            formData.append('evidence_image', evidenceFile);
          }
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
          });
          
          return { buyerId, response };
        });
        
        try {
          const results = await Promise.all(promises);
          const successCount = results.filter(r => r.response.ok).length;
          const failCount = results.length - successCount;
          
          if (successCount > 0) {
            toast.success(`${successCount}명의 구매자에 대한 노쇼 신고가 접수되었습니다.`);
            if (failCount > 0) {
              toast.warning(`${failCount}명의 신고는 실패했습니다. (이미 신고된 구매자일 수 있습니다)`);
            }
            router.push('/mypage/seller');
          } else {
            toast.error('노쇼 신고 접수에 실패했습니다.');
          }
        } catch (error) {
          console.error('노쇼 신고 오류:', error);
          toast.error('신고 처리 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
        return; // 여기서 함수 종료
      } else {
        toast.error('신고 권한이 없습니다.');
        return;
      }

      // FormData 생성 (파일 업로드 포함)
      const formData = new FormData();
      formData.append('reported_user', reportedUserId.toString());
      formData.append('groupbuy', groupbuyId || '');
      formData.append('report_type', reportType);
      formData.append('content', content.trim());
      
      if (evidenceFile) {
        formData.append('evidence_image', evidenceFile);
      }
      
      // 디버깅을 위한 로그
      console.log('노쇼 신고 제출 데이터:', {
        reported_user: reportedUserId,
        groupbuy: groupbuyId,
        report_type: reportType,
        content_length: content.trim().length,
        has_file: !!evidenceFile
      });

      // 노쇼 신고 제출 또는 수정
      const url = isEditMode && existingReport 
        ? `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/${existingReport.id}/`
        : `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/`;
      
      const method = isEditMode ? 'PATCH' : 'POST';
      
      console.log(`${method} no-show report...`);
      console.log('API URL:', url);
      console.log('Access token exists:', !!accessToken);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Requested-With': 'XMLHttpRequest'
          // Content-Type은 설정하지 않음 (FormData가 자동으로 설정)
        },
        body: formData
      });
      
      console.log('Response status:', response.status);

      if (response.ok) {
        toast.success(isEditMode ? '노쇼 신고가 수정되었습니다.' : '노쇼 신고가 접수되었습니다.');
        // 판매자인 경우 판매자 마이페이지로, 구매자인 경우 일반 마이페이지로
        if (user?.role === 'seller') {
          router.push('/mypage/seller');
        } else {
          router.push('/mypage');
        }
      } else if (response.status === 400) {
        let errorMessage = '신고 접수에 실패했습니다.';
        try {
          const errorData = await response.json();
          console.error('노쇼 신고 오류 응답:', errorData);
          
          // 구체적인 오류 메시지 처리
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.content) {
            errorMessage = Array.isArray(errorData.content) ? errorData.content.join(', ') : errorData.content;
          } else if (errorData.evidence_image) {
            errorMessage = Array.isArray(errorData.evidence_image) ? errorData.evidence_image.join(', ') : errorData.evidence_image;
          } else if (errorData.reported_user) {
            errorMessage = Array.isArray(errorData.reported_user) ? errorData.reported_user.join(', ') : errorData.reported_user;
          } else if (errorData.non_field_errors) {
            errorMessage = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors.join(', ') : errorData.non_field_errors;
          }
          
          // 중복 신고 에러 체크
          if (errorMessage.includes('unique') || errorMessage.includes('duplicate') || errorMessage.includes('이미')) {
            errorMessage = '이미 해당 공구에 대한 노쇼 신고를 하셨습니다.';
          }
        } catch (parseError) {
          console.error('응답 파싱 오류:', parseError);
          errorMessage = `HTTP ${response.status}: 신고 처리 중 오류가 발생했습니다.`;
        }
        
        toast.error(errorMessage);
      } else {
        toast.error(`신고 ${isEditMode ? '수정' : '접수'}에 실패했습니다.`);
      }
    } catch (error) {
      console.error('노쇼 신고 오류 (catch block):', error);
      toast.error(`신고 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
      console.log('handleSubmit 종료');
    }
  };

  // 인증 체크 중일 때 로딩 표시
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
              <Link href="/mypage">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  마이페이지로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/mypage">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            마이페이지로 돌아가기
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? '노쇼 신고 수정' : '노쇼 신고하기'}
          </CardTitle>
          {groupbuyInfo && (
            <p className="text-sm text-gray-600 mt-2">
              공구: {groupbuyInfo.title}
            </p>
          )}
          {isEditMode && existingReport && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ 이미 신고한 내역이 있습니다.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                신고 날짜: {new Date(existingReport.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 구매자 선택 (판매자가 신고 시) */}
            {user?.role === 'seller' && (
              <div className="space-y-2">
                <Label>노쇼한 구매자 선택 (필수)</Label>
                <div className="text-xs text-gray-500 mb-2">
                  디버깅: user.role={user?.role}, participants.length={participants.length}
                </div>
                {participants.length > 0 ? (
                  <>
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      {participants.map((participant) => {
                        const userId = participant.user?.id || participant.user_id || participant.id;
                        const displayName = participant.user?.username || participant.user?.nickname || 
                                          participant.username || participant.nickname || 
                                          `참여자 ${userId}`;
                        const phoneNumber = participant.user?.phone_number || participant.phone_number || '연락처 없음';
                        
                        return (
                          <div key={userId} className="flex items-start space-x-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
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
                              className="mt-1"
                            />
                            <label 
                              htmlFor={`buyer-${userId}`} 
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-sm">{displayName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />
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
                    <p className="text-sm text-yellow-800">
                      구매자 정보를 불러오는 중입니다...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 신고 사유 입력 안내 */}
            <div className="space-y-2">
              <Label htmlFor="content">📝 신고 사유 (필수)</Label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-700 mb-2">
                  {user?.role === 'buyer' ? 
                    '판매자의 거래 거부 사유를 구체적으로 작성해주세요.' :
                    '구매자의 거래 거부 사유를 구체적으로 작성해주세요.'}
                </p>
                <p className="text-xs text-gray-600">
                  예시:
                </p>
                <ul className="text-xs text-gray-600 list-disc list-inside ml-2">
                  <li>약속 시간에 나타나지 않음</li>
                  <li>연락이 두절됨</li>
                  <li>약속된 가격으로 {user?.role === 'buyer' ? '판매' : '구매'} 거부</li>
                  <li>상품이 준비되지 않았다고 거래 취소</li>
                  <li>기타 부당한 거래 거부</li>
                </ul>
              </div>
            </div>

            {/* 신고 내용 */}
            <div className="space-y-2">
              <Textarea
                id="content"
                placeholder="신고 사유를 자세히 설명해주세요. (최소 20자 이상)
예: 약속 시간, 장소, 연락 시도 내용 등"
                rows={6}
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
              <Label>증빙자료 첨부 (선택)</Label>
              <div className="flex items-center gap-4">
                <label htmlFor="evidence-file" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">파일 선택</span>
                  </div>
                  <input
                    id="evidence-file"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {evidenceFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{evidenceFile.name}</span>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {filePreview && (
                <div className="mt-2">
                  <img 
                    src={filePreview} 
                    alt="증빙자료 미리보기" 
                    className="max-w-xs rounded-lg border"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                JPG, PNG, PDF 파일만 업로드 가능합니다. (최대 5MB)
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
              <Link href="/mypage">
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
                type="submit" 
                disabled={isButtonDisabled}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

export default function NoShowReportPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">로딩 중...</p>
      </div>
    }>
      <NoShowReportContent />
    </Suspense>
  );
}
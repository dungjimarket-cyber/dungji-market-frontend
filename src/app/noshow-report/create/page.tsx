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
  const sellerIdFromUrl = searchParams.get('seller_id');  // URL에서 seller_id 받기
  
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [groupbuyInfo, setGroupbuyInfo] = useState<any>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>([]);
  const [sellerId, setSellerId] = useState<string>(''); // 판매자 ID 추가
  const [authChecked, setAuthChecked] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 버튼 비활성화 조건 디버깅
  const isSeller = user?.role === 'seller' || user?.user_type === '판매';
  const isButtonDisabled = loading || 
                          !content.trim() || 
                          content.trim().length < 20 ||
                          (isSeller && selectedBuyerIds.length === 0);
  
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

      // URL에서 seller_id가 있으면 설정
      if (sellerIdFromUrl) {
        setSellerId(sellerIdFromUrl);
        console.log('Seller ID from URL:', sellerIdFromUrl);
      }

      if (groupbuyId) {
        fetchGroupbuyInfo();
        checkExistingReport();
      }
    };

    checkAuthAndFetch();
  }, [groupbuyId, user, accessToken, sellerIdFromUrl]);

  // 판매자일 때 참여자 목록 가져오기 위한 별도 useEffect
  useEffect(() => {
    const isSeller = user?.role === 'seller' || user?.user_type === '판매';
    if (isSeller && groupbuyId && accessToken && authChecked) {
      console.log('Seller detected, fetching participants...');
      console.log('User info:', { 
        id: user?.id, 
        role: user?.role, 
        user_type: user?.user_type,
        is_seller: isSeller
      });
      console.log('GroupBuy ID:', groupbuyId);
      console.log('Access Token exists:', !!accessToken);
      fetchParticipants();
    }
  }, [user, groupbuyId, accessToken, authChecked]);

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
        console.log('Group buy info fetched:', data);
        console.log('selected_bid:', data.selected_bid);
        console.log('winning_bid:', data.winning_bid);

        // 구매자인 경우 판매자 ID 저장
        const isBuyer = user?.role === 'buyer' || user?.user_type === '일반' || (!user?.role && !user?.user_type);
        if (isBuyer) {
          // selected_bid에서 판매자 정보 찾기
          if (data.selected_bid) {
            const sellerIdFromBid = data.selected_bid.seller?.id || data.selected_bid.seller_id || data.selected_bid.seller;
            if (sellerIdFromBid) {
              setSellerId(String(sellerIdFromBid));
              console.log('Seller ID from selected_bid:', sellerIdFromBid);
            }
          }
          // 또는 winning_bid에서 찾기
          else if (data.winning_bid) {
            const sellerIdFromWinning = data.winning_bid.seller?.id || data.winning_bid.seller_id || data.winning_bid.seller;
            if (sellerIdFromWinning) {
              setSellerId(String(sellerIdFromWinning));
              console.log('Seller ID from winning_bid:', sellerIdFromWinning);
            }
          }
          // 또는 bids에서 selected=true인 것 찾기
          else if (data.bids && Array.isArray(data.bids)) {
            const selectedBid = data.bids.find((bid: any) => bid.is_selected || bid.selected);
            if (selectedBid) {
              const sellerIdFromBids = selectedBid.seller?.id || selectedBid.seller_id || selectedBid.seller;
              if (sellerIdFromBids) {
                setSellerId(String(sellerIdFromBids));
                console.log('Seller ID from bids:', sellerIdFromBids);
              }
            }
          }
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
          
          // 기존에 신고했던 구매자 ID 설정 (판매자가 수정하는 경우)
          if ((user?.role === 'seller' || user?.user_type === '판매') && myReport.reported_user) {
            // reported_user가 객체인 경우 id 추출, 아니면 그대로 사용
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
    const isSeller = user?.role === 'seller' || user?.user_type === '판매';
    console.log('Is seller:', isSeller);
    
    try {
      let response;
      
      if (isSeller) {
        // 판매자인 경우 buyers 엔드포인트 먼저 시도 (낙찰된 판매자)
        console.log('Seller detected, trying buyers endpoint first...');
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/buyers/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        console.log('Buyers endpoint response status:', response.status);
        
        // buyers 엔드포인트가 실패하면 participants_detail 시도
        if (!response.ok) {
          console.log('Trying participants_detail endpoint...');
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/participants_detail/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          console.log('Participants detail endpoint response status:', response.status);
        }
      } else {
        // 구매자인 경우 participants_detail 엔드포인트 시도
        console.log('Buyer detected, trying participants_detail endpoint...');
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/participants_detail/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        console.log('Participants detail endpoint response status:', response.status);
      }
      
      // 그래도 실패하면 participations 엔드포인트 시도
      if (!response.ok) {
        console.log('Trying alternative participations endpoint...');
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participations/?groupbuy=${groupbuyId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        console.log('Participations endpoint response status:', response.status);
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw participants data:', data);
        console.log('Data structure:', {
          isArray: Array.isArray(data),
          hasParticipants: !!data.participants,
          hasBuyers: !!data.buyers,
          hasResults: !!data.results,
          keys: Object.keys(data)
        });
        
        // Handle different response formats
        let participantsData = [];
        if (Array.isArray(data)) {
          participantsData = data;
        } else if (data.buyers && Array.isArray(data.buyers)) {
          // buyers endpoint returns {buyers: [...]}
          participantsData = data.buyers;
        } else if (data.participants && Array.isArray(data.participants)) {
          // participants_detail returns {participants: [...]}
          participantsData = data.participants;
        } else if (data.results && Array.isArray(data.results)) {
          // participations endpoint returns {results: [...]}
          participantsData = data.results;
        }
        
        // 데이터 구조 정규화: buyers 엔드포인트는 다른 구조를 가질 수 있음
        const normalizedParticipants = participantsData.map((p: any) => {
          // buyers 엔드포인트의 경우 이미 user 객체를 가지고 있음
          if (p.user && typeof p.user === 'object') {
            // phone 필드를 phone_number로도 복사 (일관성을 위해)
            if (p.user.phone && !p.user.phone_number) {
              p.user.phone_number = p.user.phone;
            }
            return p;
          }
          // 다른 엔드포인트의 경우 구조 변환
          return {
            id: p.id,
            user: {
              id: p.user_id || p.id,
              username: p.username || p.user?.username,
              nickname: p.nickname || p.user?.nickname,
              email: p.email || p.user?.email,
              phone: p.phone || p.user?.phone,
              phone_number: p.phone_number || p.user?.phone_number || p.phone || p.user?.phone
            },
            final_decision: p.final_decision
          };
        }).filter((p: any) => {
          // 판매자인 경우 구매확정(confirmed)된 참여자만 표시
          const isSeller = user?.role === 'seller' || user?.user_type === '판매';
          if (isSeller) {
            // final_decision이 'confirmed'인 경우만 포함
            const isConfirmed = p.final_decision === 'confirmed';
            if (!isConfirmed) {
              console.log('Filtering out non-confirmed participant:', {
                id: p.id,
                user_id: p.user?.id,
                final_decision: p.final_decision
              });
            }
            return isConfirmed;
          }
          // 구매자인 경우 모든 참여자 표시
          return true;
        });
        
        setParticipants(normalizedParticipants);
        console.log('Participants set successfully:', normalizedParticipants);
        console.log('Number of participants:', normalizedParticipants.length);
        
        // 참여자 데이터 구조 확인
        if (normalizedParticipants.length > 0) {
          console.log('First participant structure:', normalizedParticipants[0]);
          console.log('All participants with user info:');
          normalizedParticipants.forEach((p: any, index: number) => {
            console.log(`Participant ${index}:`, {
              participation_id: p.id,
              user_id: p.user?.id,
              username: p.user?.username,
              nickname: p.user?.nickname,
              phone: p.user?.phone,
              phone_number: p.user?.phone_number,
              final_decision: p.final_decision
            });
          });
        }
      } else {
        console.error('Failed to fetch participants, status:', response.status);
        
        // 에러 응답 내용 확인
        try {
          const errorData = await response.text();
          console.error('Error response:', errorData);
          
          // JSON 파싱 시도
          try {
            const errorJson = JSON.parse(errorData);
            console.error('Error details:', errorJson);
            toast.error(errorJson.error || '구매자 정보를 불러올 수 없습니다.');
          } catch {
            console.error('Error response is not JSON:', errorData);
            toast.error('구매자 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
          }
        } catch (e) {
          console.error('Failed to read error response:', e);
          toast.error('구매자 정보를 불러올 수 없습니다.');
        }
      }
    } catch (error) {
      console.error('참여자 목록 조회 실패:', error);
      toast.error('구매자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 최대 3개 파일 제한
    if (evidenceFiles.length + files.length > 3) {
      toast.error('증빙 파일은 최대 3개까지 업로드 가능합니다.');
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`);
        continue;
      }

      // 파일 타입 체크
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: JPG, PNG, PDF 파일만 업로드 가능합니다.`);
        continue;
      }

      newFiles.push(file);

      // 이미지 파일인 경우 미리보기 생성
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }

    setEvidenceFiles(prev => [...prev, ...newFiles]);
    
    // 입력 필드 초기화
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
      
      if (user?.role === 'buyer' || user?.user_type === '일반' || (!user?.role && user?.user_type !== '판매')) {
        // 구매자가 신고 → 판매자 노쇼
        reportType = 'seller_noshow';

        // 이미 저장된 sellerId 사용
        if (sellerId) {
          reportedUserId = sellerId;
          console.log('Using saved seller ID:', reportedUserId);
        } else {
          // fallback: 공구 정보에서 선택된 입찰 정보 확인
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
              console.log('Reported user ID from bids:', reportedUserId);
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
        }
      } else if (user?.role === 'seller' || user?.user_type === '판매') {
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
          
          // 여러 증빙 파일 추가
          evidenceFiles.forEach((file, index) => {
            formData.append(`evidence_image_${index + 1}`, file);
          });
          
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
      
      // 여러 증빙 파일 추가
      evidenceFiles.forEach((file, index) => {
        formData.append(`evidence_image_${index + 1}`, file);
      });
      
      // 디버깅을 위한 로그
      console.log('노쇼 신고 제출 데이터:', {
        reported_user: reportedUserId,
        groupbuy: groupbuyId,
        report_type: reportType,
        content_length: content.trim().length,
        files_count: evidenceFiles.length
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
        // 구매자는 일반 마이페이지로
        router.push('/mypage');
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

      <Card className="flex-1 mb-4">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 판매자 정보 표시 (구매자가 신고 시) */}
            {(user?.role === 'buyer' || user?.user_type === '일반' || (!user?.role && user?.user_type !== '판매')) && groupbuyInfo && (
              <div className="space-y-2">
                <Label>신고 대상 판매자</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {groupbuyInfo.selected_bid?.seller_nickname ||
                         groupbuyInfo.selected_bid?.seller?.nickname ||
                         groupbuyInfo.selected_bid?.seller_name ||
                         groupbuyInfo.selected_bid?.seller?.username ||
                         groupbuyInfo.winning_bid?.seller_nickname ||
                         groupbuyInfo.winning_bid?.seller?.nickname ||
                         groupbuyInfo.winning_bid?.seller_name ||
                         groupbuyInfo.winning_bid?.seller?.username ||
                         '판매자'}
                      </p>
                      {(groupbuyInfo.selected_bid?.seller_phone || groupbuyInfo.selected_bid?.seller?.phone ||
                        groupbuyInfo.winning_bid?.seller_phone || groupbuyInfo.winning_bid?.seller?.phone) && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {groupbuyInfo.selected_bid?.seller_phone || groupbuyInfo.selected_bid?.seller?.phone ||
                           groupbuyInfo.winning_bid?.seller_phone || groupbuyInfo.winning_bid?.seller?.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 구매자 선택 (판매자가 신고 시) */}
            {(user?.role === 'seller' || user?.user_type === '판매') && (
              <div className="space-y-2">
                <Label>노쇼한 구매자 선택 (필수)</Label>
                {participants.length > 0 ? (
                  <>
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      {participants.map((participant) => {
                        // participant.id는 participation ID이므로 user.id를 사용해야 함
                        const userId = participant.user?.id || participant.user_id;

                        if (!userId) {
                          console.warn('User ID not found for participant:', participant);
                          return null;
                        }

                        // nickname이 비어있거나 username과 같으면 "회원{id}" 표시
                        const nickname = participant.user?.nickname || participant.nickname || '';
                        const username = participant.user?.username || participant.username || '';
                        const displayName = (nickname && nickname !== username)
                          ? nickname
                          : `회원${userId}`;
                        // buyers 엔드포인트는 'phone', participants_detail은 'phone_number' 사용
                        const phoneNumber = participant.user?.phone || participant.user?.phone_number ||
                                          participant.phone || participant.phone_number || '연락처 없음';
                        
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
                      onClick={() => {
                        console.log('Retry fetching participants...');
                        fetchParticipants();
                      }}
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
              
              {/* 업로드된 파일 목록 */}
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
              
              {/* 이미지 미리보기 */}
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
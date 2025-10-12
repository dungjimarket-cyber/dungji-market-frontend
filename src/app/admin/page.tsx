'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { Loader2, Upload, CheckCircle, XCircle, Building } from 'lucide-react';
import { Select } from '@/components/ui/select';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { GroupBuyConsentManager } from '@/components/admin/GroupBuyConsentManager';
import WinnerSelection from '@/components/admin/WinnerSelection';
import { ProductRegistrationForm } from '@/components/admin/ProductRegistrationForm';
import RefundManagement from '@/components/admin/RefundManagement';

// Helper function to convert seller category code to label
function getSellerCategoryLabel(category: string) {
  switch (category) {
    case 'telecom':
      return '통신상품판매';
    case 'rental':
      return '렌탈서비스판매';
    case 'electronics':
      return '가전제품판매';
    case 'general':
      return '온/오프라인 도소매,요식업';
    default:
      return category || '정보 없음';
  }
}

// 견적이용권 유형 정의
const TOKEN_TYPES = [
  { value: 'single', label: '견적이용권 단품 (1,990원)' },
  { value: 'unlimited', label: '무제한 구독권 (30일, 29,900원)' },
];

// API 호출 함수
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('dungji_auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || '요청 처리 중 오류가 발생했습니다.');
  }

  return response.json();
};

// 문의 아이템 컴포넌트
const InquiryItem = ({ inquiry, onAnswer }: { inquiry: any; onAnswer: (id: string, answer: string) => void }) => {
  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState(inquiry.answer || '');

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return;
    onAnswer(inquiry.id, answer);
    setIsAnswering(false);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{inquiry.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${
              inquiry.status === 'answered' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            작성자: {inquiry.user?.nickname || inquiry.user?.username || '알 수 없음'}
          </p>
          <p className="text-sm text-gray-500 mb-3">
            작성일: {new Date(inquiry.created_at).toLocaleString()}
          </p>
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">문의내용:</p>
            <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {inquiry.content}
            </p>
          </div>
          
          {inquiry.answer && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">답변내용:</p>
              <p className="text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded">
                {inquiry.answer}
              </p>
              {inquiry.answered_at && (
                <p className="text-xs text-gray-500 mt-1">
                  답변일: {new Date(inquiry.answered_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
          
          {!inquiry.answer && !isAnswering && (
            <Button 
              onClick={() => setIsAnswering(true)}
              size="sm"
              className="mt-2"
            >
              답변하기
            </Button>
          )}
          
          {isAnswering && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="답변을 입력해주세요..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitAnswer} size="sm">
                  답변 등록
                </Button>
                <Button 
                  onClick={() => {
                    setIsAnswering(false);
                    setAnswer(inquiry.answer || '');
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 파일 업로드 API 호출 함수
const uploadFileWithAuth = async (url: string, formData: FormData) => {
  const token = localStorage.getItem('dungji_auth_token');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || '요청 처리 중 오류가 발생했습니다.');
  }

  return response.json();
};

// 관리자 페이지 컴포넌트
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [groupPurchases, setGroupPurchases] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [sellersWithDetails, setSellersWithDetails] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidCount, setBidCount] = useState<number>(1);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [selectedTokenType, setSelectedTokenType] = useState<string>('single');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingBidPermission, setAddingBidPermission] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processingVerification, setProcessingVerification] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRejectUser, setSelectedRejectUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 상품 목록 재로드 함수
  const fetchProducts = async () => {
    try {
      const productsData = await fetchWithAuth('/products/');
      setProducts(productsData);
    } catch (error) {
      console.error('상품 목록 로드 실패:', error);
      toast({
        title: '오류',
        description: '상품 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 관리자 권한 확인
  useEffect(() => {
    if (status === 'loading') return;
    
    // 1. 먼저 로컬 스토리지에서 인증 상태 확인
    const token = localStorage.getItem('dungji_auth_token');
    const userDataStr = localStorage.getItem('user');
    let isAdmin = false;
    
    if (token && userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        isAdmin = userData?.role === 'admin';
        console.log('로컬 스토리지 인증 확인:', { isAuthenticated: !!token, role: userData?.role });
      } catch (e) {
        console.error('사용자 데이터 파싱 오류:', e);
      }
    }
    
    // 2. NextAuth 세션 확인
    const sessionRole = session?.user?.role;
    const isSessionAdmin = sessionRole === 'admin';
    console.log('NextAuth 세션 확인:', { isAuthenticated: status === 'authenticated', role: sessionRole });
    
    // 3. 둘 중 하나라도 관리자 권한이 확인되면 접근 허용
    if (!token && status === 'unauthenticated') {
      toast({
        title: '접근 권한 없음',
        description: '로그인이 필요합니다.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }
    
    // 4. 관리자 권한 확인 (로컬 스토리지 또는 세션)
    if (!isAdmin && !isSessionAdmin) {
      toast({
        title: '접근 권한 없음',
        description: '관리자만 접근할 수 있는 페이지입니다.',
        variant: 'destructive',
      });
      router.push('/');
      return;
    }
    
    // 5. 데이터 로드
    loadData();
  }, [status, session, router]);

  // 데이터 로드 함수
  const loadData = async () => {
    setLoading(true);
    try {
      // 공동구매 목록 로드
      const groupPurchasesData = await fetchWithAuth('/admin/group_purchases/');
      setGroupPurchases(groupPurchasesData);
      
      // 셀러 목록 로드 (기존 API)
      const sellersData = await fetchWithAuth('/admin/sellers/');
      setSellers(sellersData);
      
      // 셀러 상세 정보 포함 목록 로드 (새 API)
      try {
        const sellersDetailData = await fetchWithAuth('/admin/sellers_with_details/');
        setSellersWithDetails(sellersDetailData);
      } catch (error) {
        console.error('셀러 상세 정보 로드 실패:', error);
        setSellersWithDetails(sellersData); // 실패시 기본 데이터 사용
      }
      
      // 상품 목록 로드
      const productsData = await fetchWithAuth('/products/');
      setProducts(productsData);
      
      // 사업자 인증 대기 목록 로드
      const verificationsData = await fetchWithAuth('/admin/pending_business_verifications/');
      setPendingVerifications(verificationsData.results || []);
      
      // 문의 목록 로드
      const inquiriesData = await fetchWithAuth('/inquiries/');
      setInquiries(inquiriesData);
      
      // 통계 정보 로드
      const statsData = await fetchWithAuth('/admin/statistics/');
      setStatistics(statsData);
    } catch (error: any) {
      toast({
        title: '데이터 로드 실패',
        description: error.message || '데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 공동구매 삭제 함수
  const handleDeleteGroupPurchase = async (id: string) => {
    setDeletingId(id);
    try {
      await fetchWithAuth(`/admin/delete_group_purchase/${id}/`, {
        method: 'DELETE',
      });
      
      toast({
        title: '삭제 완료',
        description: '공동구매가 성공적으로 삭제되었습니다.',
      });
      
      // 목록 갱신
      setGroupPurchases(groupPurchases.filter(gp => gp.id !== id));
    } catch (error: any) {
      toast({
        title: '삭제 실패',
        description: error.message || '공동구매 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // 견적이용권 부여 함수
  const handleAddBidPermission = async () => {
    if (!selectedSellerId) {
      toast({
        title: '셀러 선택 필요',
        description: '견적이용권을 부여할 셀러를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    if (bidCount <= 0) {
      toast({
        title: '유효하지 않은 견적이용권 수',
        description: '견적이용권 수는 1 이상이어야 합니다.',
        variant: 'destructive',
      });
      return;
    }
    
    setAddingBidPermission(true);
    try {
      const response = await fetchWithAuth(`/admin/bid-tokens/adjust/`, {
        method: 'POST',
        body: JSON.stringify({ 
          seller_id: selectedSellerId,
          action: 'add',
          amount: bidCount,
          reason: `관리자 부여 (${TOKEN_TYPES.find(type => type.value === selectedTokenType)?.label || '견적이용권'})`
        }),
      });
      
      const tokenTypeLabel = TOKEN_TYPES.find(type => type.value === selectedTokenType)?.label || '견적이용권';
      
      toast({
        title: '견적이용권 부여 완료',
        description: `${response.username} 사용자에게 ${bidCount}개의 ${tokenTypeLabel}이(가) 부여되었습니다.`,
      });
      
      // 셀러 목록 갱신 - 이제 active_tokens_count를 사용
      const updatedSellers = sellers.map(seller => 
        seller.id === selectedSellerId 
          ? { ...seller, active_tokens_count: response.active_tokens_count } 
          : seller
      );
      setSellers(updatedSellers);
      
      // 입력값 초기화
      setBidCount(1);
      setSelectedSellerId('');
      setSelectedTokenType('single');
    } catch (error: any) {
      toast({
        title: '견적이용권 부여 실패',
        description: error.message || '견적이용권 부여 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setAddingBidPermission(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast({
        title: '파일 선택 필요',
        description: '업로드할 이미지 파일을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      if (selectedProductId) {
        formData.append('product_id', selectedProductId);
      }
      
      const response = await uploadFileWithAuth('/admin/upload_product_image/', formData);
      
      toast({
        title: '이미지 업로드 성공',
        description: '상품 이미지가 성공적으로 업로드되었습니다.',
      });
      
      // 상품 목록 갱신
      if (response.product_updated) {
        const updatedProducts = products.map(product => 
          product.id === response.product_id 
            ? { ...product, image_url: response.image_url } 
            : product
        );
        setProducts(updatedProducts);
      }
      
      // 입력값 초기화
      setSelectedFile(null);
      setSelectedProductId('');
      setImagePreview(null);
      
      // 파일 입력 필드 초기화
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      toast({
        title: '이미지 업로드 실패',
        description: error.message || '이미지 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // 사업자 인증 승인 핸들러
  const handleApproveVerification = async (userId: string) => {
    setProcessingVerification(userId);
    try {
      await fetchWithAuth(`/admin/approve_business_verification/${userId}/`, {
        method: 'POST',
      });
      
      toast({
        title: '승인 완료',
        description: '사업자 인증이 승인되었습니다.',
      });
      
      // 목록에서 제거
      setPendingVerifications(pendingVerifications.filter(user => user.id !== userId));
      
      // 통계 업데이트
      if (statistics) {
        setStatistics({
          ...statistics,
          users: {
            ...statistics.users,
            verified_sellers: statistics.users.verified_sellers + 1,
            pending_verifications: statistics.users.pending_verifications - 1
          }
        });
      }
    } catch (error: any) {
      toast({
        title: '승인 실패',
        description: error.message || '사업자 인증 승인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setProcessingVerification(null);
    }
  };

  // 사업자 인증 거절 핸들러
  const handleRejectVerification = async () => {
    if (!selectedRejectUser) return;
    
    setProcessingVerification(selectedRejectUser.id);
    try {
      await fetchWithAuth(`/admin/reject_business_verification/${selectedRejectUser.id}/`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason || '사업자 정보 확인 불가' }),
      });
      
      toast({
        title: '거절 완료',
        description: '사업자 인증이 거절되었습니다.',
      });
      
      // 목록에서 제거
      setPendingVerifications(pendingVerifications.filter(user => user.id !== selectedRejectUser.id));
      
      // 통계 업데이트
      if (statistics) {
        setStatistics({
          ...statistics,
          users: {
            ...statistics.users,
            pending_verifications: statistics.users.pending_verifications - 1
          }
        });
      }
      
      // 다이얼로그 닫기 및 초기화
      setRejectDialogOpen(false);
      setSelectedRejectUser(null);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        title: '거절 실패',
        description: error.message || '사업자 인증 거절 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setProcessingVerification(null);
    }
  };

  // 사업자등록증 업로드 핸들러
  const handleUploadBusinessLicense = async (userId: string) => {
    // 파일 선택을 위한 input 생성
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        toast({
          title: '파일 형식 오류',
          description: '이미지 파일만 업로드 가능합니다.',
          variant: 'destructive',
        });
        return;
      }
      
      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: '파일 크기 초과',
          description: '파일 크기는 10MB를 초과할 수 없습니다.',
          variant: 'destructive',
        });
        return;
      }
      
      setProcessingVerification(userId);
      
      try {
        const formData = new FormData();
        formData.append('business_license', file);
        
        const token = localStorage.getItem('dungji_auth_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload_business_license/${userId}/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '업로드 실패');
        }
        
        const data = await response.json();
        
        toast({
          title: '업로드 완료',
          description: '사업자등록증이 성공적으로 업로드되었습니다.',
        });
        
        // 목록 업데이트
        setPendingVerifications(pendingVerifications.map(user => 
          user.id === userId 
            ? { ...user, business_license_image: data.business_license_image }
            : user
        ));
        
      } catch (error: any) {
        toast({
          title: '업로드 실패',
          description: error.message || '사업자등록증 업로드 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      } finally {
        setProcessingVerification(null);
      }
    };
    
    input.click();
  };

  // 특정 상품 이미지 업데이트 핸들러
  const handleUpdateProductImage = async (productId: string) => {
    if (!selectedFile) {
      toast({
        title: '파일 선택 필요',
        description: '업로드할 이미지 파일을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await uploadFileWithAuth(`/admin/update_product_image/${productId}/`, formData);
      
      toast({
        title: '이미지 업데이트 성공',
        description: `${response.product_name} 상품의 이미지가 성공적으로 업데이트되었습니다.`,
      });
      
      // 상품 목록 갱신
      const updatedProducts = products.map(product => 
        product.id === response.product_id 
          ? { ...product, image_url: response.image_url } 
          : product
      );
      setProducts(updatedProducts);
      
      // 입력값 초기화
      setSelectedFile(null);
      setImagePreview(null);
      
      // 파일 입력 필드 초기화
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      toast({
        title: '이미지 업데이트 실패',
        description: error.message || '이미지 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // 문의 답변 처리 함수
  const handleAnswerInquiry = async (inquiryId: string, answer: string) => {
    try {
      await fetchWithAuth(`/inquiries/${inquiryId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          answer: answer.trim(),
          status: 'answered'
        })
      });

      // 성공 시 문의 목록 다시 로드
      const inquiriesData = await fetchWithAuth('/inquiries/');
      setInquiries(inquiriesData);

      toast({
        title: '답변 완료',
        description: '문의에 대한 답변이 성공적으로 등록되었습니다.',
      });
    } catch (error: any) {
      toast({
        title: '답변 등록 실패',
        description: error.message || '답변 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <Button 
          onClick={() => router.push('/admin/noshow')}
          variant="outline"
        >
          노쇼 신고 관리
        </Button>
      </div>
      
      {/* 통계 카드들 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">전체 사용자</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.users.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                구매자 {statistics.users.buyers} / 판매자 {statistics.users.sellers}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">인증 대기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.users.pending_verifications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                사업자 인증 대기중
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">활성 공구</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.groupbuys.active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                전체 {statistics.groupbuys.total}개 중
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">입찰 성공률</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.bids.success_rate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                전체 {statistics.bids.total}건 중 {statistics.bids.successful}건
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Tabs defaultValue="verifications" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="verifications">사업자 인증</TabsTrigger>
          <TabsTrigger value="refunds">환불 관리</TabsTrigger>
          <TabsTrigger value="group-purchases">공동구매 관리</TabsTrigger>
          <TabsTrigger value="winner-selection">낙찰자 선정</TabsTrigger>
          <TabsTrigger value="sellers">셀러 관리</TabsTrigger>
          <TabsTrigger value="products">상품 관리</TabsTrigger>
          <TabsTrigger value="inquiries">1:1 문의 관리</TabsTrigger>
        </TabsList>
        
        {/* 사업자 인증 관리 탭 */}
        <TabsContent value="verifications">
          <Card>
            <CardHeader>
              <CardTitle>사업자 인증 대기 목록</CardTitle>
              <CardDescription>
                사업자 등록증을 제출한 판매자들의 인증 요청 목록입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingVerifications.length > 0 ? (
                <div className="space-y-4">
                  {pendingVerifications.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold mb-2">
                            {user.actual_username || user.username || user.email?.split('@')[0] || '알 수 없음'}
                            {user.nickname && user.nickname !== (user.actual_username || user.username) && (
                              <span className="text-sm text-gray-500 font-normal"> ({user.nickname})</span>
                            )}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">아이디:</span> {user.actual_username || user.username || user.email?.split('@')[0] || '알 수 없음'}</p>
                            <p><span className="text-muted-foreground">이메일:</span> {user.email}</p>
                            <p><span className="text-muted-foreground">사업자번호:</span> {user.business_reg_number}</p>
                            <p><span className="text-muted-foreground">가입일:</span> {new Date(user.date_joined).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          {user.business_license_image ? (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">사업자등록증</p>
                              <a 
                                href={user.business_license_image} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:underline"
                              >
                                <Building className="h-4 w-4" />
                                이미지 확인
                              </a>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">등록증 이미지 없음</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUploadBusinessLicense(user.id)}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                사업자등록증 업로드
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleApproveVerification(user.id)}
                          disabled={processingVerification === user.id}
                        >
                          {processingVerification === user.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              처리중...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              승인
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRejectUser(user);
                            setRejectDialogOpen(true);
                          }}
                          disabled={processingVerification === user.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          거절
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  대기중인 사업자 인증 요청이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 환불 관리 탭 */}
        <TabsContent value="refunds">
          <RefundManagement />
        </TabsContent>
        
        {/* 공동구매 관리 탭 */}
        <TabsContent value="group-purchases">
          <Card>
            <CardHeader>
              <CardTitle>공동구매 목록</CardTitle>
              <CardDescription>
                시스템에 등록된 모든 공동구매 목록입니다. 필요한 경우 삭제할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">ID</th>
                      <th className="text-left py-2">제목</th>
                      <th className="text-left py-2">생성자</th>
                      <th className="text-left py-2">상태</th>
                      <th className="text-left py-2">생성일</th>
                      <th className="text-left py-2">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupPurchases.length > 0 ? (
                      groupPurchases.map((gp) => (
                        <tr key={gp.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{gp.id}</td>
                          <td className="py-2">{gp.title}</td>
                          <td className="py-2">{gp.creator?.username || '알 수 없음'}</td>
                          <td className="py-2">{gp.status}</td>
                          <td className="py-2">{new Date(gp.created_at).toLocaleDateString()}</td>
                          <td className="py-2">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteGroupPurchase(gp.id)}
                              disabled={deletingId === gp.id}
                            >
                              {deletingId === gp.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  삭제 중...
                                </>
                              ) : '삭제'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center">
                          등록된 공동구매가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* 참여자 동의 관리 */}
          <div className="mt-6">
            <GroupBuyConsentManager />
          </div>
        </TabsContent>
        
        {/* 셀러 관리 탭 */}
        <TabsContent value="sellers">
          {/* 셀러 목록 카드를 먼저 표시 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>판매회원 목록</CardTitle>
              <CardDescription>
                시스템에 등록된 모든 판매회원 목록입니다. 클릭하여 상세 관리 페이지로 이동합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">사용자 ID</th>
                      <th className="text-left py-2">아이디</th>
                      <th className="text-left py-2">이메일 주소</th>
                      <th className="text-left py-2">판매회원 구분</th>
                      <th className="text-left py-2">보유 견적이용권</th>
                      <th className="text-left py-2">구독권 상태</th>
                      <th className="text-left py-2">사업자 인증 상태</th>
                      <th className="text-left py-2">상세 관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellersWithDetails.length > 0 ? (
                      sellersWithDetails.map((seller) => (
                        <tr key={seller.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{seller.id}</td>
                          <td className="py-2">
                            {seller.actual_username || seller.username || seller.email?.split('@')[0] || '알 수 없음'}
                            {seller.nickname && seller.nickname !== (seller.actual_username || seller.username) && (
                              <div className="text-xs text-gray-500">({seller.nickname})</div>
                            )}
                          </td>
                          <td className="py-2 text-sm">{seller.email}</td>
                          <td className="py-2 text-sm">{getSellerCategoryLabel(seller.seller_category)}</td>
                          <td className="py-2">{seller.bid_tokens_count || 0}개</td>
                          <td className="py-2">
                            {seller.has_subscription ? (
                              <span className="text-green-600 font-medium">활성</span>
                            ) : (
                              <span className="text-gray-400">없음</span>
                            )}
                          </td>
                          <td className="py-2">
                            {seller.is_business_verified ? (
                              <span className="text-blue-600 font-medium">인증</span>
                            ) : (
                              <span className="text-gray-400">미인증</span>
                            )}
                          </td>
                          <td className="py-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => router.push(`/admin/seller/${seller.id}`)}
                            >
                              관리
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-4 text-center">
                          등록된 판매회원이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* 빠른 견적이용권 부여 카드 */}
          <div className="grid gap-6 md:grid-cols-1">
            {/* 견적이용권 부여 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>견적이용권 부여</CardTitle>
                <CardDescription>
                  셀러 사용자에게 견적이용권을 부여합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="seller">셀러 선택</Label>
                    <select
                      id="seller"
                      className="w-full p-2 border rounded-md"
                      value={selectedSellerId}
                      onChange={(e) => setSelectedSellerId(e.target.value)}
                    >
                      <option value="">-- 셀러 선택 --</option>
                      {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.username} ({seller.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <select
                      id="token-type"
                      className="w-full p-2 border rounded-md"
                      value={selectedTokenType}
                      onChange={(e) => setSelectedTokenType(e.target.value)}
                    >
                      {TOKEN_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bid-count">견적이용권 수</Label>
                    <Input
                      id="bid-count"
                      type="number"
                      min="1"
                      value={bidCount}
                      onChange={(e) => setBidCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAddBidPermission}
                  disabled={addingBidPermission || !selectedSellerId}
                >
                  {addingBidPermission ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      처리 중...
                    </>
                  ) : '견적이용권 부여'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* 낙찰자 선정 탭 */}
        <TabsContent value="winner-selection">
          <WinnerSelection />
        </TabsContent>
        
        {/* 상품 관리 탭 */}
        <TabsContent value="products">
          <div className="grid gap-6">
            {/* 새 상품 등록 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>새 상품 등록</CardTitle>
                <CardDescription>
                  인터넷, 인터넷+TV 등 새로운 상품을 등록합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductRegistrationForm onSuccess={fetchProducts} />
              </CardContent>
            </Card>

            {/* 이미지 업로드 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>상품 이미지 업로드</CardTitle>
                <CardDescription>
                  상품에 이미지를 업로드하거나 업데이트합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product">상품 선택 (선택사항)</Label>
                    <select
                      id="product"
                      className="w-full p-2 border rounded-md"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">-- 상품 선택 --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500">
                      상품을 선택하면 해당 상품의 이미지가 업데이트됩니다. 선택하지 않으면 이미지만 업로드됩니다.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="image-upload">이미지 파일</Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  {imagePreview && (
                    <div className="mt-4">
                      <Label>이미지 미리보기</Label>
                      <div className="mt-2 border rounded-md overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="미리보기"
                          className="w-full h-auto max-h-64 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleImageUpload}
                  disabled={uploadingImage || !selectedFile}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      이미지 업로드
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* 상품 목록 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>상품 목록</CardTitle>
                <CardDescription>
                  시스템에 등록된 모든 상품 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ID</th>
                        <th className="text-left py-2">이름</th>
                        <th className="text-left py-2">이미지</th>
                        <th className="text-left py-2">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length > 0 ? (
                        products.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-gray-50">
                            <td className="py-2">{product.id}</td>
                            <td className="py-2">{product.name}</td>
                            <td className="py-2">
                              {product.image_url ? (
                                <div className="w-16 h-16 relative">
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-400">이미지 없음</span>
                              )}
                            </td>
                            <td className="py-2">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProductId(product.id);
                                    document.getElementById('image-upload')?.click();
                                  }}
                                >
                                  이미지 변경
                                </Button>
                                {selectedFile && selectedProductId === product.id && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleUpdateProductImage(product.id)}
                                    disabled={uploadingImage}
                                  >
                                    {uploadingImage ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        업로드 중...
                                      </>
                                    ) : '업로드'}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center">
                            등록된 상품이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 1:1 문의 관리 탭 */}
        <TabsContent value="inquiries">
          <Card>
            <CardHeader>
              <CardTitle>1:1 문의 관리</CardTitle>
              <CardDescription>
                사용자들의 문의사항을 확인하고 답변을 등록할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inquiries.length > 0 ? (
                <div className="space-y-4">
                  {inquiries.map((inquiry) => (
                    <InquiryItem 
                      key={inquiry.id} 
                      inquiry={inquiry} 
                      onAnswer={handleAnswerInquiry}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  등록된 문의사항이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 사업자 인증 거절 다이얼로그 */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사업자 인증 거절</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRejectUser?.username}님의 사업자 인증을 거절하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">거절 사유</Label>
            <Textarea
              id="rejection-reason"
              placeholder="거절 사유를 입력해주세요 (선택사항)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedRejectUser(null);
              setRejectionReason('');
            }}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectVerification}
              disabled={processingVerification === selectedRejectUser?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingVerification === selectedRejectUser?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  처리중...
                </>
              ) : (
                '거절'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

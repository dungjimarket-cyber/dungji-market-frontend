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
import { Loader2, Upload } from 'lucide-react';
import { Select } from '@/components/ui/select';
import Image from 'next/image';

// 입찰권 유형 정의
const TOKEN_TYPES = [
  { value: 'single', label: '입찰권 단품 (1,990원)' },
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
  const [products, setProducts] = useState<any[]>([]);
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
      
      // 셀러 목록 로드
      const sellersData = await fetchWithAuth('/admin/sellers/');
      setSellers(sellersData);
      
      // 상품 목록 로드
      const productsData = await fetchWithAuth('/products/');
      setProducts(productsData);
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

  // 입찰권 부여 함수
  const handleAddBidPermission = async () => {
    if (!selectedSellerId) {
      toast({
        title: '셀러 선택 필요',
        description: '입찰권을 부여할 셀러를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    if (bidCount <= 0) {
      toast({
        title: '유효하지 않은 입찰권 수',
        description: '입찰권 수는 1 이상이어야 합니다.',
        variant: 'destructive',
      });
      return;
    }
    
    setAddingBidPermission(true);
    try {
      const response = await fetchWithAuth(`/admin/add_bid_permission/${selectedSellerId}/`, {
        method: 'POST',
        body: JSON.stringify({ 
          bid_count: bidCount,
          token_type: selectedTokenType
        }),
      });
      
      const tokenTypeLabel = TOKEN_TYPES.find(type => type.value === selectedTokenType)?.label || '입찰권';
      
      toast({
        title: '입찰권 부여 완료',
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
        title: '입찰권 부여 실패',
        description: error.message || '입찰권 부여 중 오류가 발생했습니다.',
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
      <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>
      
      <Tabs defaultValue="group-purchases" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="group-purchases">공동구매 관리</TabsTrigger>
          <TabsTrigger value="sellers">셀러 관리</TabsTrigger>
          <TabsTrigger value="products">상품 관리</TabsTrigger>
        </TabsList>
        
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
        </TabsContent>
        
        {/* 셀러 관리 탭 */}
        <TabsContent value="sellers">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 입찰권 부여 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>입찰권 부여</CardTitle>
                <CardDescription>
                  셀러 사용자에게 입찰권을 부여합니다.
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
                    <Label htmlFor="token-type">입찰권 유형</Label>
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
                    <Label htmlFor="bid-count">입찰권 수</Label>
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
                  ) : '입찰권 부여'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* 셀러 목록 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>셀러 목록</CardTitle>
                <CardDescription>
                  시스템에 등록된 모든 셀러 사용자 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ID</th>
                        <th className="text-left py-2">이름</th>
                        <th className="text-left py-2">이메일</th>
                        <th className="text-left py-2">활성 입찰권 수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellers.length > 0 ? (
                        sellers.map((seller) => (
                          <tr key={seller.id} className="border-b hover:bg-gray-50">
                            <td className="py-2">{seller.id}</td>
                            <td className="py-2">{seller.username}</td>
                            <td className="py-2">{seller.email}</td>
                            <td className="py-2">{seller.active_tokens_count || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center">
                            등록된 셀러가 없습니다.
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
        
        {/* 상품 관리 탭 */}
        <TabsContent value="products">
          <div className="grid gap-6 md:grid-cols-2">
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
      </Tabs>
    </div>
  );
}

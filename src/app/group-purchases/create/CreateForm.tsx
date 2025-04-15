'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, getSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';
import { tokenUtils } from '@/lib/tokenUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface Product {
  id: number;
  name: string;
  base_price: number;
  category_name: string;
}

const formSchema = z.object({
  product: z.string().min(1, '상품을 선택해주세요'),
  title: z.string().min(1, '공구 제목을 입력해주세요'),
  max_participants: z.union([
    z.string()
      .min(1, '최대 참여 인원을 입력해주세요')
      .transform(val => parseInt(val, 10)),
    z.number()
  ])
    .refine(val => val >= 1 && val <= 100, '최대 참여 인원은 1~100명 사이여야 합니다'),
  end_time_option: z.string().optional(),
  end_time: z.string()
    .min(1, '마감일시를 입력해주세요')
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const hours = diff / (1000 * 60 * 60);
      return hours >= 6 && hours <= 48; // 6시간 이상 48시간 이하로 변경
    }, '공구 기간은 6~48시간 사이여야 합니다'),
  min_participants: z.union([
    z.string()
      .min(1, '최소 참여 인원을 입력해주세요')
      .transform(val => parseInt(val, 10)),
    z.number()
  ])
    .refine(val => val >=1, '최소 참여 인원은 1명 이상이어야 합니다')
});

export default function CreateForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: '',
      title: '',
      max_participants: 10,
      min_participants: 1,
      end_time: '',
      end_time_option: '24hours',
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/group-purchases/create');
    }
  }, [status, router]);

  // Ensure we have a valid session before making requests
  useEffect(() => {
    const validateSession = async () => {
      const session = await getSession();
      console.log('공구 등록 페이지 세션 확인:', session);
      
      // 세션이 있고 로그인되어 있는 상태라면 계속 진행
      if (!session || status === 'unauthenticated') {
        router.push('/login?callbackUrl=/group-purchases/create');
      }
    };
    
    // status가 loading이 아닐 때만 세션 검증 실행
    if (status !== 'loading') {
      validateSession();
    }
  }, [router, status]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // API URL 준비
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/products/`;
        console.log('상품 목록 API URL:', apiUrl);
        
        // tokenUtils를 사용하여 상품 목록 가져오기
        const data = await tokenUtils.fetchWithAuth<Product[]>(apiUrl);
        console.log('상품 목록 데이터:', data);
        setProducts(data);
      } catch (error) {
        console.error('상품 목록 가져오기 실패:', error);
        
        // 토큰 관련 오류 처리
        if (error instanceof Error && (
            error.message.includes('token_not_valid') || 
            error.message.includes('Token is invalid or expired'))) {
          toast({
            variant: 'destructive',
            title: '세션이 만료되었습니다',
            description: '다시 로그인해주세요.'
          });
          router.push('/login?callbackUrl=/group-purchases/create');
          return;
        }
        
        // 오류 발생 시 빈 배열로 초기화
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProducts();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // 최소 참여 인원 <= 최대 참여 인원 검증
      if (values.min_participants > values.max_participants) {
        form.setError('min_participants', {
          type: 'manual',
          message: '최소 참여 인원은 최대 참여 인원보다 클 수 없습니다'
        });
        return;
      }

      // 세션에서 사용자 정보 가져오기
      const session = await getSession();
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      // 요청 데이터 준비
      // 마감 시간 계산
      let endTimeValue;
      
      // 옵션이 선택되었고 custom이 아닌 경우 현재 시간 기준으로 계산
      if (values.end_time_option && values.end_time_option !== 'custom') {
        const now = new Date();
        let hours = 24;
        
        if (values.end_time_option === '6hours') hours = 6;
        else if (values.end_time_option === '12hours') hours = 12;
        else if (values.end_time_option === '24hours') hours = 24;
        
        // 현재 시간에 설정한 시간을 더함
        const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
        endTimeValue = endTime.toISOString();
        console.log('계산된 마감 시간 (UTC):', endTimeValue);
        console.log('계산된 마감 시간 (한국시간):', endTime.toString());
      } else {
        // 직접 입력한 경우 ISO 문자열로 변환
        const inputDate = new Date(values.end_time);
        endTimeValue = inputDate.toISOString();
        console.log('직접 입력한 마감 시간 (UTC):', endTimeValue);
        console.log('직접 입력한 마감 시간 (한국시간):', inputDate.toString());
      }
      
      const requestData = {
        product: parseInt(values.product),
        title: values.title || `${products.find(p => p.id === parseInt(values.product))?.name} 공구`,
        creator: 1,  // 현재 로그인한 사용자 ID를 사용 (백엔드에서 현재 사용자로 자동 설정되도록 수정 필요)
        max_participants: values.max_participants,
        min_participants: values.min_participants,
        end_time: endTimeValue,
      };
      
      // API URL 준비
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`;
      console.log('공구 등록 API URL:', apiUrl);
      console.log('공구 등록 요청 데이터:', requestData);
      
      // tokenUtils를 사용하여 인증된 API 요청 수행
      try {
        const result = await tokenUtils.fetchWithAuth(apiUrl, {
          method: 'POST',
          body: JSON.stringify(requestData),
        });
        
        console.log('공구 등록 성공:', result);
        toast({
          title: '공구 등록 성공',
          description: '공구가 성공적으로 등록되었습니다.',
        });
        
        // 공구 목록 페이지로 이동
        router.push('/group-purchases');
      } catch (error: any) {
        console.error('공구 등록 실패:', error);
        
        // 토큰 관련 오류 처리
        if (error.message.includes('token_not_valid') || 
            error.message.includes('Token is invalid or expired')) {
          toast({
            variant: 'destructive',
            title: '세션이 만료되었습니다',
            description: '다시 로그인해주세요.'
          });
          router.push('/login?callbackUrl=/group-purchases/create');
          return;
        }
        
        // 기본 오류 처리
        toast({
          variant: 'destructive',
          title: '공구 등록 실패',
          description: '공구 등록 중 오류가 발생했습니다. 다시 시도해주세요.'
        });
      }
      router.push('/group-purchases');
    } catch (error: any) {
      console.error('공구 등록 실패:', error);
      
      // 인증 관련 오류 처리
      if (error.message === 'Not authenticated' || error.message === 'No access token available') {
        toast({
          variant: 'destructive',
          title: '로그인이 필요합니다',
          description: '공구를 등록하려면 먼저 로그인해주세요.'
        });
        router.push('/login?callbackUrl=/group-purchases/create');
        return;
      }
      
      // 401 Unauthorized 오류 처리
      if (error.response?.status === 401) {
        toast({
          variant: 'destructive',
          title: '로그인이 필요합니다',
          description: '세션이 만료되었습니다. 다시 로그인해주세요.'
        });
        router.push('/login?callbackUrl=/group-purchases/create');
        return;
      }
      
      // 403 Forbidden 오류 처리
      if (error.response?.status === 403) {
        toast({
          variant: 'destructive',
          title: '권한이 없습니다',
          description: '공구 등록 권한이 없습니다.'
        });
        return;
      }
      
      // 서버 오류 처리
      if (error.response?.status === 500) {
        toast({
          variant: 'destructive',
          title: '서버 오류',
          description: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
        return;
      }
      
      // API 유효성 검사 오류 처리
      if (error.response?.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach(key => {
          form.setError(key as any, {
            type: 'manual',
            message: Array.isArray(errors[key]) ? errors[key][0] : errors[key]
          });
        });
        
        toast({
          variant: 'destructive',
          title: '입력 정보를 확인해주세요',
          description: '입력하신 내용에 문제가 있습니다.'
        });
        return;
      }
      
      // 기본 오류 처리
      toast({
        variant: 'destructive',
        title: '공구 등록 실패',
        description: '공구 등록 중 오류가 발생했습니다. 다시 시도해주세요.'
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>공구 등록하기</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상품 선택</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="상품을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {product.base_price.toLocaleString()}원
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>공구 제목</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="공구 제목을 입력하세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="min_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최소 참여 인원</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="최소 1명 이상"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    공구에 참여할 최소 인원을 설정하세요 (1명 이상)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최대 참여 인원</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="최대 100명 이하"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    공구에 참여할 최대 인원을 설정하세요 (100명 이하)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time_option"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모집 마감시간 옵션</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      
                      // 선택한 옵션에 따라 마감 시간 자동 설정
                      if (value !== 'custom') {
                        const now = new Date();
                        let hoursToAdd = 24;
                        
                        if (value === '6hours') hoursToAdd = 6;
                        else if (value === '12hours') hoursToAdd = 12;
                        else if (value === '24hours') hoursToAdd = 24;
                        
                        // 현재 시간에 설정한 시간을 더함
                        const endTime = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
                        
                        // 로컬 시간 형식으로 변환 (YYYY-MM-DDTHH:MM)
                        const year = endTime.getFullYear();
                        const month = String(endTime.getMonth() + 1).padStart(2, '0');
                        const day = String(endTime.getDate()).padStart(2, '0');
                        const hourStr = String(endTime.getHours()).padStart(2, '0');
                        const minutes = String(endTime.getMinutes()).padStart(2, '0');
                        
                        const localDateTimeString = `${year}-${month}-${day}T${hourStr}:${minutes}`;
                        form.setValue('end_time', localDateTimeString);
                        
                        console.log('자동 설정된 마감 시간:', localDateTimeString);
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="마감시간 옵션 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="6hours">6시간 후</SelectItem>
                      <SelectItem value="12hours">12시간 후</SelectItem>
                      <SelectItem value="24hours">24시간 후</SelectItem>
                      <SelectItem value="custom">직접 입력</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모집 마감일시 (6~48시간 이내)</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field} 
                      min={new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                      max={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                      disabled={form.watch('end_time_option') !== 'custom'}
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch('end_time_option') === 'custom' ? '직접 입력하시거나 위 옵션에서 선택하세요.' : '위에서 선택한 시간이 자동 입력됩니다.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              공구 등록하기
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, getSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
  max_participants: z.string()
    .min(1, '최대 참여 인원을 입력해주세요')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 2 && val <= 5, '최대 참여 인원은 2~5명 사이여야 합니다'),
  end_time: z.string()
    .min(1, '마감일시를 입력해주세요')
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const hours = diff / (1000 * 60 * 60);
      return hours >= 24 && hours <= 48;
    }, '공구 기간은 24~48시간 사이여야 합니다'),
  min_participants: z.string()
    .min(1, '최소 참여 인원을 입력해주세요')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 2, '최소 참여 인원은 2명 이상이어야 합니다')
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
      max_participants: 2,
      end_time: '',
      min_participants: 2,
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
      if (!session?.accessToken) {
        router.push('/login?callbackUrl=/group-purchases/create');
      }
    };
    validateSession();
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProducts();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Validate min_participants <= max_participants
      if (values.min_participants > values.max_participants) {
        form.setError('min_participants', {
          type: 'manual',
          message: '최소 참여 인원은 최대 참여 인원보다 클 수 없습니다'
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: parseInt(values.product),
          max_participants: values.max_participants,
          min_participants: values.min_participants,
          end_time: new Date(values.end_time).toISOString(),
        }),
      });
  
      if (!response.ok) throw new Error('Failed to create group purchase');
      router.push('/group-purchases');
    } catch (error: any) {
      console.error('Failed to create group purchase:', error);
      
      if (error.response?.status === 401) {
        toast({
          variant: 'destructive',
          title: '로그인이 필요합니다',
          description: '공구를 등록하려면 먼저 로그인해주세요.'
        });
        router.push('/login?callbackUrl=/group-purchases/create');
        return;
      }
      
      // Handle API validation errors
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
      }
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
              name="min_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최소 참여 인원</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="2"
                      placeholder="최소 2명 이상"
                      {...field}
                    />
                  </FormControl>
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
                      min="2"
                      placeholder="최소 2명 이상"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모집 마감일시 (24~48시간 이내)</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field} 
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                      max={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                    />
                  </FormControl>
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

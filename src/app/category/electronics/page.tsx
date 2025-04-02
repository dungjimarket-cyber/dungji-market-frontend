'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  status: 'active' | 'ended';
  endTime: string;
}

export default function ElectronicsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/products?category=electronics');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProducts(data.products || []); // 빈 배열을 기본값으로 설정
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('상품을 불러오는데 실패했습니다.');
        setProducts([]); // 에러 발생 시 빈 배열로 설정
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">전자기기</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">전자기기</h1>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">전자기기</h1>
      
      {!loading && !error && products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">현재 진행중인 공동구매가 없습니다.</p>
          <p className="text-gray-500">나중에 다시 확인해주세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link href={`/products/${product.id}`} key={product.id}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.image && (
                    <div className="aspect-video relative mb-4 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="rounded-md object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.jpg';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-gray-600 line-clamp-2 mb-2">{product.description}</p>
                  <p className="font-semibold text-lg">
                    {product.price.toLocaleString()}원
                  </p>
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      product.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status === 'active' ? '진행중' : '종료'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(product.endTime).toLocaleDateString()}까지
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

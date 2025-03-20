'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useState } from 'react';
import GroupBuyFilter, { FilterOptions } from '@/components/GroupBuyFilter';
import GroupBuyProgress from '@/components/GroupBuyProgress';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: number;
  category_name: string;
  product_type: 'device' | 'service';
  base_price: number;
  image_url: string;
  is_available: boolean;
  active_groupbuy?: {
    id: number;
    status: string;
    current_participants: number;
    max_participants: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  parent_name: string | null;
  subcategories: Category[];
  product_count: number;
}

interface CategoryClientProps {
  category: Category | null;
  products: Product[];
}

export default function CategoryClient({ category, products }: CategoryClientProps) {
  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">카테고리를 찾을 수 없습니다</h1>
          <p>요청하신 카테고리가 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: 'default',
    category: category?.slug
  });

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      if (!a.active_groupbuy || !b.active_groupbuy) return 0;
      
      switch (filterOptions.sortBy) {
        case 'popularity':
          return (b.active_groupbuy.current_participants / b.active_groupbuy.max_participants) -
                 (a.active_groupbuy.current_participants / a.active_groupbuy.max_participants);
        case 'timeLeft':
          return new Date(a.active_groupbuy.end_time).getTime() - new Date(b.active_groupbuy.end_time).getTime();
        case 'participants':
          return b.active_groupbuy.current_participants - a.active_groupbuy.current_participants;
        default:
          return 0;
      }
    });
  };

  const sortedProducts = sortProducts(products);

  return (
    <div className="container mx-auto px-4 py-8">
      {category.parent_name && (
        <div className="text-sm breadcrumbs mb-4">
          <ul>
            <li>
              <Link href={`/category/${category.parent}`}>{category.parent_name}</Link>
            </li>
            <li>{category.name}</li>
          </ul>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">{category.name}</h1>

      {category.subcategories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">하위 카테고리</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {category.subcategories.map((subcat) => (
              <Link 
                key={subcat.id} 
                href={`/category/${subcat.slug}`}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">{subcat.name}</h3>
                <p className="text-sm text-gray-500">상품 {subcat.product_count}개</p>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {products.length === 0 ? (
        <div className="text-center py-8">
          <p>이 카테고리에 등록된 상품이 없습니다.</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">상품 목록</h2>
          <GroupBuyFilter
            options={filterOptions}
            onFilterChange={setFilterOptions}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/groupbuys/${product.active_groupbuy?.id || ''}`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.active_groupbuy && (
                    <GroupBuyProgress
                      endTime={product.active_groupbuy.end_time}
                      currentParticipants={product.active_groupbuy.current_participants}
                      maxParticipants={product.active_groupbuy.max_participants}
                    />
                  )}
                  <img
                    src={product.image_url || '/placeholder.png'}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <p className="mt-4 text-gray-600">{product.description}</p>
                  {product.active_groupbuy && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-800">
                        공구 진행중 ({product.active_groupbuy.current_participants}/{product.active_groupbuy.max_participants}명)
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    {product.base_price.toLocaleString()}원
                  </span>
                  <span className={`px-3 py-1 rounded-full ${
                    product.is_available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_available ? '판매중' : '품절'}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
          </div>
        </>
      )}
    </div>
  );
}

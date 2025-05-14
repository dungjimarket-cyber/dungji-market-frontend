'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // show_services=false 파라미터를 추가하여 휴대폰 카테고리만 가져오도록 설정
        // 데이터베이스에서 휴대폰은 is_service=true로 설정되어 있음
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/?show_services=false`);
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('카테고리를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          className="h-auto py-6 flex flex-col items-center gap-2"
          asChild
        >
          <Link href={`/category/${category.slug}`}>
            <span className="text-2xl">{category.emoji || '💼'}</span>
            <span className="font-medium">{category.name}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}

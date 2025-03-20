'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';

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
        const response = await apiClient.get('http://localhost:8000/api/categories/');
        setCategories(response.data);
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

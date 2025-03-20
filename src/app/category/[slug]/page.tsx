import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import CategoryClient from './CategoryClient';

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
    end_time: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
}

async function getCategory(slug: string) {
  const res = await fetch(`http://localhost:8000/api/category/${slug}/`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

async function getProducts(slug: string) {
  const res = await fetch(`http://localhost:8000/api/products/?category=${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export default async function CategoryPage(
  { params }: { params: { slug: string } }
) {
  const [category, products] = await Promise.all([
    getCategory(params.slug),
    getProducts(params.slug)
  ]);

  return <CategoryClient category={category} products={products} />;
}

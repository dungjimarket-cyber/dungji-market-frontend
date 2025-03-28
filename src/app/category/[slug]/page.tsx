// src/pages/category/[slug].tsx

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
  status: string;
  current_participants: number;
  max_participants: number;
  end_time: string;
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
  parent: string | null;
  parent_name: string | null;
  subcategories: Category[];
  product_count: number;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function getCategory(slug: string): Promise<Category | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/${slug}/`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) return null;
  return res.json();
}

async function getProducts(slug: string): Promise<Product[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/?category=${slug}`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) return [];
  return res.json();
}
// 페이지 컴포넌트 수정
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const [category, products] = await Promise.all([
    getCategory(slug),
    getProducts(slug)
  ]);

  return <div>Category: {slug}</div>;
}

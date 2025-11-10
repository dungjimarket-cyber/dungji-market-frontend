import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPlaceRankings } from '@/lib/api/googlePlaces';
import { POPULAR_CATEGORIES } from '@/types/ranking';
import RankingsList from '@/components/rankings/RankingsList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    region: string;
    category: string;
  }>;
  searchParams: Promise<{
    placeType?: string;
    q?: string;
  }>;
}

// 메타데이터 생성
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const region = decodeURIComponent(resolvedParams.region);
  const category = decodeURIComponent(resolvedParams.category);

  const categoryInfo = POPULAR_CATEGORIES.find(c => c.id === category);
  const categoryLabel = resolvedSearchParams.q || categoryInfo?.label || category;

  return {
    title: `${region} ${categoryLabel} 랭킹 Top 3 | 둥지마켓`,
    description: `${region} 지역의 인기 ${categoryLabel} 업체 Top 3를 Google 리뷰 기반으로 소개합니다.`,
    keywords: `${region}, ${categoryLabel}, 랭킹, 추천, 리뷰`,
  };
}

export default async function RankingsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const region = decodeURIComponent(resolvedParams.region);
  const category = decodeURIComponent(resolvedParams.category);

  // 카테고리 정보 가져오기
  let placeType = resolvedSearchParams.placeType;
  let displayCategory = category;

  if (category === 'search') {
    // 직접 검색인 경우
    if (!resolvedSearchParams.q) {
      notFound();
    }
    placeType = resolvedSearchParams.q;
    displayCategory = resolvedSearchParams.q;
  } else {
    // 인기 카테고리인 경우
    const categoryInfo = POPULAR_CATEGORIES.find(c => c.id === category);
    if (!categoryInfo) {
      notFound();
    }
    placeType = placeType || categoryInfo.placeType;
    displayCategory = categoryInfo.label;
  }

  // Google Places API 호출
  let places;
  try {
    places = await getPlaceRankings(region, displayCategory, placeType);
  } catch (error) {
    console.error('Failed to fetch rankings:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">데이터를 불러오는데 실패했습니다</h2>
          <p className="text-muted-foreground mb-6">
            잠시 후 다시 시도해주세요.
          </p>
          <Link href="/rankings">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/rankings">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              지역 선택으로 돌아가기
            </Button>
          </Link>
        </div>

        {/* 랭킹 리스트 */}
        <Suspense fallback={<LoadingFallback />}>
          <RankingsList
            initialPlaces={places}
            city={region}
            category={displayCategory}
          />
        </Suspense>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">랭킹 데이터를 불러오는 중...</span>
    </div>
  );
}

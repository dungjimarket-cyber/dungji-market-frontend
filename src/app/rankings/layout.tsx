import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지역별 업체 랭킹 | 둥지마켓',
  description: 'Google 리뷰 기반 지역별 인기 업체 랭킹을 확인하세요. 식당, 카페, 헤어샵 등 다양한 카테고리의 Top 3를 소개합니다.',
  keywords: '지역 랭킹, 업체 추천, 맛집 랭킹, 카페 추천, Google 리뷰',
};

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

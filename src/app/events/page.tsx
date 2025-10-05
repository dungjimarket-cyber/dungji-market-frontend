'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
// import DailyRoulette from '@/components/events/DailyRoulette'; // 테스트 중

interface Event {
  id: number;
  title: string;
  slug: string;
  thumbnail_url: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  is_valid?: boolean;
  status?: string;
  view_count: number;
}

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  // 이미지 로드 오류 처리
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder.png';
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        // 페이징 응답 형식과 배열 형식 모두 지원
        const eventItems = Array.isArray(data) ? data : (data.results || []);
        setEvents(eventItems);
      }
    } catch (error) {
      console.error('이벤트 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl lg:max-w-5xl xl:max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">이벤트</h1>

      {/* 매일 추첨 돌림판 - 테스트 중 */}
      {/* <div className="mb-8">
        <DailyRoulette />
      </div> */}

      {events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">진행 중인 이벤트가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {events.map((event) => {
            const isActive = event.is_active || event.is_valid || event.status === 'ongoing';
            const commonClassName = `bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 transform scale-90 lg:scale-[0.85] xl:scale-[0.8] ${
              isActive ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'cursor-not-allowed'
            }`;

            return isActive ? (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className={commonClassName}
              >
                <div className="aspect-square relative bg-gray-50">
                  <Image
                    src={event.thumbnail_url || '/placeholder.png'}
                    alt={event.title}
                    fill
                    className={`object-contain p-1 ${!isActive ? 'grayscale opacity-60' : ''}`}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    quality={70}
                    priority={false}
                  />
                  {!isActive && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                        마감
                      </div>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                      진행중
                    </div>
                  )}
                </div>
                <div className="p-2 sm:p-3">
                  <h2 className={`text-xs sm:text-sm font-semibold mb-1 line-clamp-2 ${!isActive ? 'text-gray-500' : ''}`}>
                    {event.title}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {format(new Date(event.start_date), 'MM.dd', { locale: ko })} ~
                    {format(new Date(event.end_date), 'MM.dd', { locale: ko })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    조회 {event.view_count.toLocaleString()}
                  </p>
                </div>
              </Link>
            ) : (
              <div
                key={event.id}
                className={commonClassName}
              >
                <div className="aspect-square relative bg-gray-50">
                  <Image
                    src={event.thumbnail_url || '/placeholder.png'}
                    alt={event.title}
                    fill
                    className="object-contain p-1 grayscale opacity-60"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    quality={70}
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                      마감
                    </div>
                  </div>
                </div>
                <div className="p-2 sm:p-3">
                  <h2 className="text-xs sm:text-sm font-semibold mb-1 line-clamp-2 text-gray-500">
                    {event.title}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {format(new Date(event.start_date), 'MM.dd', { locale: ko })} ~
                    {format(new Date(event.end_date), 'MM.dd', { locale: ko })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    조회 {event.view_count.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
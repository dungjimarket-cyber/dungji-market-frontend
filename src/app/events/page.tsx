'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
        setEvents(data);
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">이벤트</h1>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">진행 중인 이벤트가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1"
            >
              <div className="aspect-[4/3] relative bg-gray-100">
                <Image
                  src={event.thumbnail_url || '/placeholder.png'}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  quality={75}
                  priority={false}
                />
                {(event.is_active || event.is_valid || event.status === 'ongoing') && (
                  <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    진행중
                  </div>
                )}
              </div>
              <div className="p-3 md:p-4">
                <h2 className="text-base md:text-lg font-semibold mb-2 line-clamp-2">{event.title}</h2>
                <p className="text-xs md:text-sm text-gray-600">
                  {format(new Date(event.start_date), 'MM.dd', { locale: ko })} ~ 
                  {format(new Date(event.end_date), 'MM.dd', { locale: ko })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  조회 {event.view_count.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
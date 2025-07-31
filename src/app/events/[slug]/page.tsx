'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { IoMdArrowBack } from 'react-icons/io';

interface EventDetail {
  id: number;
  title: string;
  slug: string;
  thumbnail: string;
  content: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      fetchEventDetail(params.slug as string);
    }
  }, [params.slug]);

  const fetchEventDetail = async (slug: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${slug}/`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else if (response.status === 404) {
        router.push('/events');
      }
    } catch (error) {
      console.error('이벤트 상세 조회 오류:', error);
      router.push('/events');
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

  if (!event) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-800"
      >
        <IoMdArrowBack className="mr-2" />
        뒤로가기
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="aspect-[16/9] relative">
          <Image
            src={event.thumbnail}
            alt={event.title}
            fill
            className="object-cover"
          />
          {event.is_active && (
            <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              진행중
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{event.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            <p>
              이벤트 기간: {format(new Date(event.start_date), 'yyyy년 MM월 dd일', { locale: ko })} ~ 
              {format(new Date(event.end_date), 'yyyy년 MM월 dd일', { locale: ko })}
            </p>
            <p>조회수: {event.view_count.toLocaleString()}</p>
          </div>

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: event.content }}
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/events')}
          className="btn btn-outline px-6 py-2"
        >
          이벤트 목록으로
        </button>
      </div>
    </div>
  );
}
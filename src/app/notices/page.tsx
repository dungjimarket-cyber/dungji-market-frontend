'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface Notice {
  id: number;
  title: string;
  content: string;
  category: 'general' | 'event' | 'update' | 'maintenance';
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotices, setExpandedNotices] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notices/`);
      
      if (response.ok) {
        const data = await response.json();
        setNotices(data);
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (noticeId: number) => {
    setExpandedNotices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noticeId)) {
        newSet.delete(noticeId);
      } else {
        newSet.add(noticeId);
      }
      return newSet;
    });
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; className: string }> = {
      general: { label: '일반', className: 'bg-gray-100 text-gray-700' },
      event: { label: '이벤트', className: 'bg-purple-100 text-purple-700' },
      update: { label: '업데이트', className: 'bg-blue-100 text-blue-700' },
      maintenance: { label: '점검', className: 'bg-yellow-100 text-yellow-700' }
    };
    
    const config = categoryMap[category] || categoryMap.general;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">공지사항</h1>
        </div>
        <p className="text-gray-600">둥지마켓의 새로운 소식과 중요한 안내사항을 확인하세요.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-8">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">공지사항이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const isExpanded = expandedNotices.has(notice.id);
            
            return (
              <Card 
                key={notice.id}
                className={notice.is_important ? 'border-red-300 bg-red-50' : ''}
              >
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleExpand(notice.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.is_important && (
                          <Badge className="bg-red-500 text-white">중요</Badge>
                        )}
                        {getCategoryBadge(notice.category)}
                      </div>
                      <CardTitle className="text-lg">
                        {notice.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700">
                        {notice.content}
                      </p>
                    </div>
                    {notice.updated_at !== notice.created_at && (
                      <p className="text-xs text-gray-500 mt-4">
                        수정됨: {new Date(notice.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
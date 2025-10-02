'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import DOMPurify from 'dompurify';

interface Notice {
  id: number;
  title: string;
  content: string;
  category: 'general' | 'event' | 'update' | 'maintenance' | 'important';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
  view_count: number;
  is_new: boolean;
  show_in_main?: boolean;
  show_in_groupbuy?: boolean;
  show_in_used?: boolean;
}

export default function NoticesPage() {
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    // 탭 변경 시 페이지를 1로 리셋
    setCurrentPage(1);
    // 열린 공지사항 초기화
    setExpandedNoticeId(null);
  }, [activeTab]);

  const fetchNotices = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notices/`);

      if (response.ok) {
        const data = await response.json();
        // 페이징 응답 형식과 배열 형식 모두 지원
        const noticeItems = Array.isArray(data) ? data : (data.results || []);
        setAllNotices(noticeItems);
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 탭에 따라 필터링된 공지사항
  const getFilteredNotices = () => {
    switch (activeTab) {
      case 'groupbuy':
        return allNotices.filter(notice => notice.show_in_groupbuy);
      case 'used':
        return allNotices.filter(notice => notice.show_in_used);
      case 'all':
      default:
        return allNotices;
    }
  };

  const filteredNotices = getFilteredNotices();

  // 페이징 처리
  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const notices = filteredNotices.slice(startIndex, endIndex);

  const toggleExpand = (noticeId: number) => {
    // 이미 열린 공지를 다시 클릭하면 닫기, 아니면 새로 열기
    setExpandedNoticeId(prev => prev === noticeId ? null : noticeId);
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; className: string }> = {
      general: { label: '일반', className: 'bg-gray-100 text-gray-700' },
      event: { label: '이벤트', className: 'bg-purple-100 text-purple-700' },
      update: { label: '업데이트', className: 'bg-blue-100 text-blue-700' },
      maintenance: { label: '점검', className: 'bg-yellow-100 text-yellow-700' },
      important: { label: '중요', className: 'bg-orange-100 text-orange-700' }
    };

    const config = categoryMap[category] || categoryMap.general;
    return (
      <Badge className={`${config.className} text-xs px-2 py-0.5`}>
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

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="groupbuy">공구·견적</TabsTrigger>
          <TabsTrigger value="used">중고거래</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
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
                <p className="text-center text-gray-500">
                  {activeTab === 'groupbuy' ? '공구·견적 공지사항이 없습니다.' :
                   activeTab === 'used' ? '중고거래 공지사항이 없습니다.' :
                   '공지사항이 없습니다.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notices.map((notice) => {
                const isExpanded = expandedNoticeId === notice.id;

                return (
                  <Card
                    key={notice.id}
                    className={`hover:bg-gray-50 transition-colors ${notice.is_pinned ? 'border-l-4 border-l-blue-500' : ''}`}
                  >
                    <CardHeader
                      className="cursor-pointer py-3 px-4"
                      onClick={() => toggleExpand(notice.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {notice.is_new && (
                              <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">NEW</Badge>
                            )}
                            {getCategoryBadge(notice.category)}
                            <span className="text-xs text-gray-500">
                              {notice.published_at ? new Date(notice.published_at).toLocaleDateString('ko-KR') : new Date(notice.created_at).toLocaleDateString('ko-KR')}
                            </span>
                            {notice.view_count > 0 && (
                              <span className="text-xs text-gray-500">조회 {notice.view_count}</span>
                            )}
                          </div>
                          <h3 className="text-base font-medium text-gray-900 truncate pr-2">
                            {notice.title}
                          </h3>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {isExpanded && notice.content && (
                      <CardContent>
                        {notice.content.includes('<') ? (
                          <div
                            className="prose prose-sm max-w-none whitespace-pre-wrap prose-headings:text-gray-800 prose-p:text-gray-700 prose-p:whitespace-pre-wrap prose-strong:text-gray-800 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-blockquote:text-gray-600 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md prose-hr:border-gray-300 prose-table:border-collapse prose-td:border prose-td:border-gray-300 prose-td:p-2 prose-th:border prose-th:border-gray-300 prose-th:p-2 prose-th:bg-gray-50"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                notice.content.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>'),
                                {
                                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                                               'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'table', 'thead',
                                               'tbody', 'tr', 'th', 'td', 'caption', 'span', 'div', 'pre', 'code'],
                                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'width', 'height', 'class', 'style',
                                                'target', 'rel', 'colspan', 'rowspan'],
                                  ALLOW_DATA_ATTR: false
                                }
                              )
                            }}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-gray-700">
                            {notice.content}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* 페이징 */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0 text-sm"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
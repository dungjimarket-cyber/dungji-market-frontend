'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Inquiry {
  id: number;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  created_at: string;
  answer?: string;
  answered_at?: string;
}

export default function InquiriesPage() {
  const { isAuthenticated, accessToken, user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInquiries();
    }
  }, [isAuthenticated]);

  const fetchInquiries = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('문의 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim()
        })
      });

      if (response.ok) {
        toast.success('문의가 등록되었습니다.');
        setTitle('');
        setContent('');
        setShowForm(false);
        fetchInquiries();
      } else {
        toast.error('문의 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('문의 등록 오류:', error);
      toast.error('문의 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">로그인이 필요한 서비스입니다.</p>
            <div className="text-center mt-4">
              <Link href="/login">
                <Button>로그인하기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">1:1 문의</h1>
        <p className="text-gray-600">궁금한 점이나 불편한 점을 문의해주세요.</p>
        <p className="text-sm text-blue-600 mt-2">
          파일전송이 필요하시거나, 실시간 상담을 원하실 경우 카카오톡 문의하기를 이용해 주세요.
        </p>
      </div>

      {!showForm ? (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <MessageSquare className="w-4 h-4 mr-2" />
            새 문의하기
          </Button>
        </div>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>문의 작성</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="author">작성자</Label>
                <Input
                  id="author"
                  value={user?.nickname || user?.username || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문의 제목을 입력해주세요"
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="문의 내용을 자세히 작성해주세요"
                  rows={6}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? '작성 중...' : '작성완료'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setTitle('');
                    setContent('');
                  }}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">로딩 중...</p>
        ) : inquiries.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">아직 문의 내역이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{inquiry.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {inquiry.status === 'answered' ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">답변완료</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">답변대기</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">문의내용</p>
                    <p className="whitespace-pre-wrap">{inquiry.content}</p>
                  </div>
                  {inquiry.answer && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-600 mb-1">답변</p>
                      <p className="whitespace-pre-wrap">{inquiry.answer}</p>
                      {inquiry.answered_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          답변일시: {new Date(inquiry.answered_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
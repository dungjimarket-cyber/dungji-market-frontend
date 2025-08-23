'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);
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
        setTitle('');
        setContent('');
        setShowForm(false);
        setShowSuccessDialog(true);
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

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    fetchInquiries();
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">1:1 문의</h1>
            <p className="text-gray-600">궁금한 점이나 불편한 점을 문의해주세요.</p>
            <p className="text-sm text-blue-600 mt-2">
              파일전송이 필요하시거나, 실시간 상담을 원하실 경우 카카오톡 문의하기를 이용해 주세요.
            </p>
          </div>
          <button
            onClick={() => router.push('/mypage/withdraw')}
            className="text-sm text-red-600 hover:text-red-700 hover:underline whitespace-nowrap"
          >
            회원 탈퇴
          </button>
        </div>
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

      {/* 제출 확인 다이얼로그 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문의 제출 확인</AlertDialogTitle>
            <AlertDialogDescription>
              문의하신 내용을 제출하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니오</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit} disabled={submitting}>
              {submitting ? '제출 중...' : '예'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 성공 알림 다이얼로그 */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문의 접수 완료</AlertDialogTitle>
            <AlertDialogDescription>
              1:1문의 내용이 정상 접수되었습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessClose}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
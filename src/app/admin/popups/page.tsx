'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Eye, EyeOff, BarChart } from 'lucide-react';
import { getPopups, deletePopup, updatePopup, type Popup } from '@/lib/api/popupService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function PopupManagementPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState<Popup | null>(null);

  useEffect(() => {
    if (!user || user.userType !== 'admin') {
      router.push('/');
      return;
    }
    fetchPopups();
  }, [user, router]);

  const fetchPopups = async () => {
    try {
      setLoading(true);
      const data = await getPopups();
      setPopups(data);
    } catch (error) {
      console.error('팝업 목록 조회 실패:', error);
      toast.error('팝업 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (popup: Popup) => {
    if (!token) return;
    
    try {
      await updatePopup(
        popup.id,
        { ...popup, is_active: !popup.is_active },
        token
      );
      await fetchPopups();
      toast.success(popup.is_active ? '팝업이 비활성화되었습니다.' : '팝업이 활성화되었습니다.');
    } catch (error) {
      console.error('팝업 상태 변경 실패:', error);
      toast.error('팝업 상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!selectedPopup || !token) return;
    
    try {
      await deletePopup(selectedPopup.id, token);
      await fetchPopups();
      toast.success('팝업이 삭제되었습니다.');
      setDeleteDialogOpen(false);
      setSelectedPopup(null);
    } catch (error) {
      console.error('팝업 삭제 실패:', error);
      toast.error('팝업 삭제에 실패했습니다.');
    }
  };

  const getPopupTypeBadge = (type: string) => {
    const typeMap: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'outline' } } = {
      image: { label: '이미지', variant: 'default' },
      text: { label: '텍스트', variant: 'secondary' },
      mixed: { label: '이미지+텍스트', variant: 'outline' },
    };
    const config = typeMap[type] || { label: type, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPositionBadge = (position: string) => {
    const positionMap: { [key: string]: string } = {
      center: '중앙',
      top: '상단',
      bottom: '하단',
      custom: '사용자 지정',
    };
    return <Badge variant="outline">{positionMap[position] || position}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">팝업 관리</h1>
        <Button onClick={() => router.push('/admin/popups/create')}>
          <Plus className="w-4 h-4 mr-2" />
          새 팝업 등록
        </Button>
      </div>

      {popups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="mb-4">등록된 팝업이 없습니다.</p>
              <Button onClick={() => router.push('/admin/popups/create')}>
                첫 팝업 등록하기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {popups.map((popup) => (
            <Card key={popup.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{popup.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      {getPopupTypeBadge(popup.popup_type)}
                      {getPositionBadge(popup.position)}
                      {popup.show_on_main && <Badge variant="secondary">메인 표시</Badge>}
                      {popup.show_on_mobile && <Badge variant="secondary">모바일</Badge>}
                      <Badge variant={popup.is_active ? 'default' : 'outline'}>
                        {popup.is_active ? '활성' : '비활성'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={popup.is_active}
                      onCheckedChange={() => handleToggleActive(popup)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">표시 기간</p>
                    <p className="text-sm">
                      {formatDate(popup.start_date)} ~ {popup.end_date ? formatDate(popup.end_date) : '무제한'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">크기</p>
                    <p className="text-sm">{popup.width} x {popup.height}px</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">우선순위</p>
                    <p className="text-sm">{popup.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">통계</p>
                    <p className="text-sm">
                      조회: {popup.view_count} / 클릭: {popup.click_count}
                      {popup.view_count > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          (CTR: {((popup.click_count / popup.view_count) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {popup.image && (
                  <div className="mb-4">
                    <img
                      src={popup.image}
                      alt={popup.title}
                      className="max-w-xs max-h-40 object-contain rounded-lg border"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/popups/${popup.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    미리보기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/popups/${popup.id}/edit`)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/popups/${popup.id}/stats`)}
                  >
                    <BarChart className="w-4 h-4 mr-2" />
                    통계
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedPopup(popup);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팝업 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedPopup?.title}" 팝업을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
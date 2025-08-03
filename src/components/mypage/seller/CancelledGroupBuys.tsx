'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Info } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CancelledGroupBuy {
  id: number;
  product_name: string;
  product_category: string;
  status: string;
  end_time: string;
  created_at: string;
  cancel_reason?: string;
}

const CancelReasonBadge = ({ reason }: { reason?: string }) => {
  switch (reason) {
    case '판매 포기':
      return (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
          <Info className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">판매 포기</span>
        </div>
      );
    case '최종선택 기간 만료':
      return (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <Info className="h-4 w-4 text-yellow-700" />
          <span className="text-sm font-medium text-yellow-800">최종선택 기간 만료</span>
        </div>
      );
    case '구매자 전원 구매포기로 인한 공구 진행 취소':
      return (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-red-50 rounded-lg border border-gray-200">
          <Info className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">구매자 전원 구매포기로 인한 공구 진행 취소</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <Info className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">공구 취소</span>
        </div>
      );
  }
};

export default function CancelledGroupBuys() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [groupbuys, setGroupbuys] = useState<CancelledGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupBuy, setSelectedGroupBuy] = useState<CancelledGroupBuy | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchCancelledGroupBuys = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/cancelled_groupbuys/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setGroupbuys(data);
        } else {
          throw new Error('데이터 조회 실패');
        }
      } catch (error) {
        console.error('취소된 공구 조회 오류:', error);
        toast({
          variant: 'destructive',
          title: '조회 실패',
          description: '취소된 공구 목록을 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchCancelledGroupBuys();
    }
  }, [accessToken]);

  const handleGroupBuyClick = (groupBuyId: number) => {
    router.push(`/groupbuys/${groupBuyId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, groupBuy: CancelledGroupBuy) => {
    e.stopPropagation();
    setSelectedGroupBuy(groupBuy);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedGroupBuy) return;

    try {
      // 여기에 삭제 API 호출 추가 (현재는 UI에서만 제거)
      setGroupbuys(prev => prev.filter(gb => gb.id !== selectedGroupBuy.id));
      toast({
        title: '삭제 완료',
        description: '취소된 공구가 목록에서 삭제되었습니다.'
      });
    } catch (error) {
      console.error('삭제 오류:', error);
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '공구 삭제 중 오류가 발생했습니다.'
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedGroupBuy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (groupbuys.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">취소된 공구가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groupbuys.map((groupbuy) => (
          <Card 
            key={groupbuy.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleGroupBuyClick(groupbuy.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{groupbuy.product_name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{groupbuy.product_category}</p>
                </div>
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                  취소됨
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CancelReasonBadge reason={groupbuy.cancel_reason} />
              
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  취소일: {new Date(groupbuy.end_time).toLocaleDateString('ko-KR')}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => handleDeleteClick(e, groupbuy)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공구 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 취소된 공구를 목록에서 삭제하시겠습니까?<br />
              삭제 후에는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Package, Tag } from 'lucide-react';

interface RecentCustomDeal {
  id: number;
  title: string;
  type: 'online' | 'offline';
  type_display: string;
  primary_image?: string;
  completed_at: string;
  days_ago: number;
  current_participants?: number;
  seller_name?: string;
  seller_id?: number;
}

interface CustomNoShowReportSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: RecentCustomDeal[];
}

export function CustomNoShowReportSelectModal({
  isOpen,
  onClose,
  deals
}: CustomNoShowReportSelectModalProps) {
  const router = useRouter();

  const handleSelectDeal = (deal: RecentCustomDeal) => {
    let url = `/custom-noshow-report/create?groupbuy=${deal.id}`;
    if (deal.seller_id) {
      url += `&seller_id=${deal.seller_id}`;
    }
    router.push(url);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>노쇼 신고할 커스텀 공구 선택</DialogTitle>
          <DialogDescription>
            최근 종료된 공구 중 신고할 공구를 선택하세요. (종료 후 15일 이내)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelectDeal(deal)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* 이미지 */}
                  {deal.primary_image ? (
                    <img
                      src={deal.primary_image}
                      alt={deal.title}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <Tag className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* 공구 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {deal.type_display}
                      </span>
                    </div>
                    <h4 className="font-semibold text-base mb-1">
                      {deal.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        종료일: {new Date(deal.completed_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    {deal.current_participants && (
                      <div className="text-sm text-gray-500 mt-1">
                        참여자: {deal.current_participants}명
                      </div>
                    )}
                    {deal.seller_name && (
                      <div className="text-sm text-gray-500">
                        판매자: {deal.seller_name}
                      </div>
                    )}
                  </div>

                  {/* 선택 버튼 */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectDeal(deal);
                    }}
                  >
                    이 공구 신고하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

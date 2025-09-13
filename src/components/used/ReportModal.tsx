'use client';

import { useState } from 'react';
import { AlertTriangle, Flag, MessageSquare, Mail, Ban, MoreHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import axios from 'axios';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: number;
  reportedUserName: string;
  phoneId?: number;
  phoneModel?: string;
  onReportComplete?: () => void;
}

const REPORT_TYPES = [
  {
    value: 'fake_listing',
    label: '허위매물',
    description: '실제와 다른 상품 정보나 가짜 상품',
    icon: AlertTriangle,
  },
  {
    value: 'fraud',
    label: '사기',
    description: '돈을 받고 상품을 주지 않음, 가품 판매 등',
    icon: Ban,
  },
  {
    value: 'abusive_language',
    label: '욕설',
    description: '부적절한 언어 사용이나 모욕적 발언',
    icon: MessageSquare,
  },
  {
    value: 'inappropriate_behavior',
    label: '부적절한 행동',
    description: '거래 방해, 협박, 스토킹 등',
    icon: Flag,
  },
  {
    value: 'spam',
    label: '스팸/광고',
    description: '무관한 광고나 반복적인 스팸 게시',
    icon: Mail,
  },
  {
    value: 'other',
    label: '기타',
    description: '위 항목에 해당하지 않는 기타 사유',
    icon: MoreHorizontal,
  },
];

export default function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  phoneId,
  phoneModel,
  onReportComplete,
}: ReportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<string>('');
  const [description, setDescription] = useState('');

  const selectedReportType = REPORT_TYPES.find(type => type.value === reportType);

  const handleSubmit = async () => {
    if (!reportType) {
      toast.error('신고 사유를 선택해주세요.');
      return;
    }

    if (!description.trim()) {
      toast.error('신고 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/used/reports/`,
        {
          reported_user: reportedUserId,
          reported_phone: phoneId || null,
          report_type: reportType,
          description: description.trim(),
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      toast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      onReportComplete?.();
      onClose();

      // 폼 리셋
      setReportType('');
      setDescription('');
    } catch (error: any) {
      console.error('신고 실패:', error);
      if (error.response?.data?.error?.includes('24시간')) {
        toast.error('24시간 내에 같은 사용자를 중복 신고할 수 없습니다.');
      } else if (error.response?.data?.error?.includes('자신을 신고')) {
        toast.error('자신을 신고할 수 없습니다.');
      } else {
        toast.error(error.response?.data?.error || '신고 접수 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReportType('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            사용자 신고
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{reportedUserName}</span>님을 신고하시겠습니까?
            {phoneModel && (
              <span className="block text-sm text-gray-500 mt-1">
                상품: {phoneModel}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-base font-medium">신고 사유</Label>
            <RadioGroup value={reportType} onValueChange={setReportType} className="mt-2">
              {REPORT_TYPES.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div key={type.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                    <div className="flex items-start gap-3 flex-1">
                      <IconComponent className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor={type.value} className="font-medium cursor-pointer">
                          {type.label}
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description" className="text-base font-medium">
              신고 내용 *
            </Label>
            <Textarea
              id="description"
              placeholder="신고 사유에 대한 구체적인 내용을 입력해주세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 min-h-[100px]"
              maxLength={500}
            />
            <div className="text-sm text-gray-500 mt-1 text-right">
              {description.length}/500자
            </div>
          </div>

          {selectedReportType && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">신고 처리 안내</p>
                  <p className="text-amber-700 mt-1">
                    허위 신고 시 오히려 신고자에게 제재가 가해질 수 있습니다.
                    신중하게 신고해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !reportType || !description.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? '신고 접수 중...' : '신고하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
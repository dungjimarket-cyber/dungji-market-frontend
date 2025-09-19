'use client';

import { useState } from 'react';
import { AlertTriangle, Search, User, Phone as PhoneIcon, MapPin, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import axios from 'axios';
import { toast } from 'sonner';

interface ReportSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneId?: number;
  phoneModel?: string;
  onReportComplete?: () => void;
}

interface SearchedUser {
  id: number;
  nickname: string;
  username: string;
  phone_number?: string;
  region?: string;
}

const REPORT_TYPES = [
  { value: 'fake_listing', label: '허위매물', description: '실제와 다른 상품 정보' },
  { value: 'fraud', label: '사기', description: '돈을 받고 상품을 주지 않음' },
  { value: 'abusive_language', label: '욕설/비방', description: '부적절한 언어 사용' },
  { value: 'inappropriate_behavior', label: '부적절한 행동', description: '거래 방해, 협박 등' },
  { value: 'spam', label: '스팸/광고', description: '무관한 광고나 스팸' },
  { value: 'other', label: '기타', description: '위에 해당하지 않는 사유' },
];

export default function ReportSubmitModal({
  isOpen,
  onClose,
  phoneId,
  phoneModel,
  onReportComplete,
}: ReportSubmitModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // 사용자 검색
  const [searchPhone, setSearchPhone] = useState('');
  const [searchNickname, setSearchNickname] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);

  // 신고 정보
  const [reportType, setReportType] = useState('');
  const [productInfo, setProductInfo] = useState(phoneModel || '');
  const [description, setDescription] = useState('');

  const handleSearch = async () => {
    if (!searchPhone && !searchNickname) {
      toast.error('연락처 또는 닉네임을 입력해주세요.');
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (searchPhone) params.append('phone', searchPhone);
      if (searchNickname) params.append('nickname', searchNickname);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/used/reports/search_user/?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setSearchResults(response.data.users || []);
      if (response.data.users.length === 0) {
        toast.info('일치하는 사용자를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('User search failed:', error);
      toast.error('사용자 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: SearchedUser) => {
    setSelectedUser(user);
    setSearchResults([]);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedUser) {
        toast.error('신고 대상을 선택해주세요.');
        return;
      }
      setStep(2);
    }
  };

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

      const requestData = {
        reported_user: selectedUser!.id,
        reported_phone: phoneId || null,
        report_type: reportType,
        description: `[상대방 정보]
닉네임: ${selectedUser!.nickname}
연락처: ${selectedUser!.phone_number || '정보 없음'}
${productInfo ? `거래 상품: ${productInfo}\n` : ''}
[신고 내용]
${description}`,
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/used/reports/`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      toast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      onReportComplete?.();
      handleClose();
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
    setStep(1);
    setSearchPhone('');
    setSearchNickname('');
    setSearchResults([]);
    setSelectedUser(null);
    setReportType('');
    setProductInfo(phoneModel || '');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            중고거래 신고하기
          </DialogTitle>
          <DialogDescription>
            부정 거래나 사기 피해를 신고해주세요.
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          // Step 1: 사용자 검색
          <div className="space-y-4 py-4">
            <div>
              <Label>상대방 정보 입력</Label>
              <p className="text-sm text-gray-500 mb-3">
                연락처와 닉네임 중 하나 이상을 입력해주세요.
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="phone">연락처</Label>
                  <Input
                    id="phone"
                    placeholder="010-1234-5678"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="nickname">닉네임</Label>
                  <Input
                    id="nickname"
                    placeholder="상대방 닉네임"
                    value={searchNickname}
                    onChange={(e) => setSearchNickname(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={isSearching || (!searchPhone && !searchNickname)}
                  className="w-full"
                  variant="outline"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? '검색 중...' : '사용자 검색'}
                </Button>
              </div>
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <div>
                <Label>검색 결과</Label>
                <div className="space-y-2 mt-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{user.nickname}</p>
                          <div className="text-sm text-gray-500 space-y-1 mt-1">
                            {user.phone_number && (
                              <div className="flex items-center gap-1">
                                <PhoneIcon className="w-3 h-3" />
                                {user.phone_number}
                              </div>
                            )}
                            {user.region && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {user.region}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 선택된 사용자 */}
            {selectedUser && (
              <div>
                <Label>신고 대상</Label>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">{selectedUser.nickname}</p>
                        {selectedUser.phone_number && (
                          <p className="text-sm text-red-700">{selectedUser.phone_number}</p>
                        )}
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Step 2: 신고 내용 작성
          <div className="space-y-4 py-4">
            <div>
              <Label>신고 사유</Label>
              <RadioGroup value={reportType} onValueChange={setReportType} className="mt-2">
                {REPORT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-start space-x-3 p-2">
                    <RadioGroupItem value={type.value} id={type.value} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="font-medium cursor-pointer">
                        {type.label}
                      </Label>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="product">거래 상품 정보 (선택)</Label>
              <Input
                id="product"
                placeholder="예: 아이폰 14 Pro"
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">신고 내용 *</Label>
              <Textarea
                id="description"
                placeholder="구체적인 신고 사유를 입력해주세요..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
                maxLength={500}
              />
              <div className="text-sm text-gray-500 mt-1 text-right">
                {description.length}/500자
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                허위 신고 시 오히려 신고자에게 제재가 가해질 수 있습니다.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button onClick={handleNext} disabled={!selectedUser}>
                다음
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                이전
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !reportType || !description.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? '신고 접수 중...' : '신고하기'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
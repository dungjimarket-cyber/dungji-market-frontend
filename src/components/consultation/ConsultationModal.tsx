'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ConsultationModalProps,
  ConsultationFormData,
  ConsultationType,
  AIRecommendedType,
} from '@/types/consultation';
import { LocalBusinessCategory } from '@/types/localBusiness';
import { fetchCategories } from '@/lib/api/localBusiness';
import {
  fetchConsultationTypes,
  createConsultationRequest,
  getAIAssist,
} from '@/lib/api/consultationService';

// 시/도 목록
const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

export default function ConsultationModal({
  isOpen,
  onClose,
  preSelectedCategory,
}: ConsultationModalProps) {
  // 스텝 관리
  const [step, setStep] = useState(1);

  // 카테고리 & 상담 유형
  const [categories, setCategories] = useState<LocalBusinessCategory[]>([]);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);

  // 폼 데이터
  const [formData, setFormData] = useState<ConsultationFormData>({
    name: '',
    phone: '',
    email: '',
    category: preSelectedCategory?.id || null,
    region: '',
    regionDetail: '',
    content: '',
    consultationType: null,
    aiSummary: '',
    aiRecommendedTypes: [],
  });

  // 상태
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // 카테고리 로드
  useEffect(() => {
    if (isOpen) {
      fetchCategories().then(setCategories);
    }
  }, [isOpen]);

  // 선택된 카테고리 변경 시 상담 유형 로드
  useEffect(() => {
    if (formData.category) {
      fetchConsultationTypes(formData.category).then(setConsultationTypes);
    } else {
      setConsultationTypes([]);
    }
  }, [formData.category]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({
        name: '',
        phone: '',
        email: '',
        category: preSelectedCategory?.id || null,
        region: '',
        regionDetail: '',
        content: '',
        consultationType: null,
        aiSummary: '',
        aiRecommendedTypes: [],
      });
      setAgreed(false);
    }
  }, [isOpen, preSelectedCategory]);

  // 전화번호 포맷
  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // AI 내용 정리
  const handleAIAssist = async () => {
    if (!formData.category || formData.content.length < 10) return;

    setAiLoading(true);
    try {
      const result = await getAIAssist({
        category: formData.category,
        content: formData.content,
      });

      if (result) {
        setFormData(prev => ({
          ...prev,
          aiSummary: result.summary,
          aiRecommendedTypes: result.recommended_types,
        }));
        toast.success('AI가 내용을 정리했습니다!');
      } else {
        toast.error('AI 정리에 실패했습니다.');
      }
    } catch {
      toast.error('AI 정리 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  // 상담 신청 제출
  const handleSubmit = async () => {
    if (!agreed) {
      toast.error('개인정보 수집에 동의해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await createConsultationRequest({
        name: formData.name,
        phone: formData.phone.replace(/-/g, ''),
        email: formData.email || undefined,
        category: formData.category!,
        consultation_type: formData.consultationType || undefined,
        region: `${formData.region} ${formData.regionDetail}`.trim(),
        content: formData.content,
        ai_summary: formData.aiSummary || undefined,
        ai_recommended_types: formData.aiRecommendedTypes.length > 0
          ? formData.aiRecommendedTypes
          : undefined,
      });

      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('상담 신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 유효성 검사
  const isStep1Valid =
    formData.name.length >= 2 &&
    formData.phone.replace(/-/g, '').length >= 10 &&
    formData.category !== null &&
    formData.region !== '';

  // Step 2 유효성 검사
  const isStep2Valid = formData.content.length >= 10;

  // 선택된 카테고리 정보
  const selectedCategory = categories.find(c => c.id === formData.category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span>💬</span>
            <span>무료상담신청</span>
            <span className="text-sm text-slate-500 font-normal ml-2">
              {step}/3단계
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* 진행 표시 */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-dungji-primary' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <div className="space-y-4">
            {/* 이름 */}
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="홍길동"
                maxLength={20}
              />
            </div>

            {/* 연락처 */}
            <div>
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  phone: formatPhone(e.target.value)
                }))}
                placeholder="010-1234-5678"
                maxLength={13}
              />
            </div>

            {/* 이메일 */}
            <div>
              <Label htmlFor="email">이메일 (선택)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
              />
            </div>

            {/* 업종 선택 */}
            <div>
              <Label>상담 업종 *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      category: cat.id,
                      consultationType: null,
                    }))}
                    className={`p-2 rounded-lg border text-sm flex flex-col items-center gap-1 transition-colors ${
                      formData.category === cat.id
                        ? 'border-dungji-primary bg-dungji-primary/10 text-dungji-primary'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="text-xs">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 지역 선택 */}
            <div>
              <Label>희망 지역 *</Label>
              <div className="flex gap-2 mt-2">
                <select
                  value={formData.region}
                  onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">시/도 선택</option>
                  {REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Input
                  value={formData.regionDetail}
                  onChange={e => setFormData(prev => ({ ...prev, regionDetail: e.target.value }))}
                  placeholder="시/군/구"
                  className="flex-1"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className="w-full"
            >
              다음
            </Button>
          </div>
        )}

        {/* Step 2: 상담 내용 */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 선택된 업종 표시 */}
            {selectedCategory && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <span>{selectedCategory.icon}</span>
                <span className="font-medium">{selectedCategory.name}</span>
                <span className="text-slate-500">상담</span>
              </div>
            )}

            {/* 상담 내용 입력 */}
            <div>
              <Label htmlFor="content">상담 내용 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="상담받고 싶은 내용을 자유롭게 작성해주세요. (최소 10자)"
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.content.length}/500자
              </p>
            </div>

            {/* AI 정리 버튼 */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAIAssist}
              disabled={formData.content.length < 10 || aiLoading}
              className="w-full"
            >
              {aiLoading ? '정리 중...' : '✨ AI로 내용 정리하기'}
            </Button>

            {/* AI 정리 결과 */}
            {formData.aiSummary && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">📝 AI 정리 내용</p>
                  <p className="text-sm text-blue-700">{formData.aiSummary}</p>
                </div>

                {formData.aiRecommendedTypes.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-2">💡 추천 상담 유형</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.aiRecommendedTypes.map((type: AIRecommendedType) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            consultationType: type.id
                          }))}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            formData.consultationType === type.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 상담 유형 직접 선택 (AI 미사용 시) */}
            {!formData.aiSummary && consultationTypes.length > 0 && (
              <div>
                <Label>상담 유형 (선택)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {consultationTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        consultationType: prev.consultationType === type.id ? null : type.id
                      }))}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.consultationType === type.id
                          ? 'bg-dungji-primary text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {type.icon} {type.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                이전
              </Button>
              <Button onClick={() => setStep(3)} disabled={!isStep2Valid} className="flex-1">
                다음
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 확인 & 제출 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800">입력 내용 확인</h4>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-500">이름</div>
                <div>{formData.name}</div>
                <div className="text-slate-500">연락처</div>
                <div>{formData.phone}</div>
                {formData.email && (
                  <>
                    <div className="text-slate-500">이메일</div>
                    <div>{formData.email}</div>
                  </>
                )}
                <div className="text-slate-500">업종</div>
                <div>{selectedCategory?.icon} {selectedCategory?.name}</div>
                <div className="text-slate-500">지역</div>
                <div>{formData.region} {formData.regionDetail}</div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-slate-500 text-sm mb-1">상담 내용</div>
                <div className="text-sm whitespace-pre-wrap">{formData.content}</div>
              </div>

              {formData.aiSummary && (
                <div className="pt-2 border-t">
                  <div className="text-blue-600 text-sm mb-1">📝 AI 정리 내용</div>
                  <div className="text-sm text-blue-700">{formData.aiSummary}</div>
                </div>
              )}
            </div>

            {/* 개인정보 동의 */}
            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
              />
              <label htmlFor="agree" className="text-sm text-slate-600 cursor-pointer">
                상담 신청을 위한 개인정보 수집 및 이용에 동의합니다.
                (이름, 연락처, 이메일은 상담 연락 목적으로만 사용됩니다.)
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                이전
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!agreed || loading}
                className="flex-1"
              >
                {loading ? '신청 중...' : '상담 신청하기'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

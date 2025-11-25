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
  ConsultationFlow,
  FlowSelection,
} from '@/types/consultation';
import { LocalBusinessCategory } from '@/types/localBusiness';
import { fetchCategories } from '@/lib/api/localBusiness';
import {
  fetchConsultationFlows,
  createConsultationRequest,
  polishContent,
} from '@/lib/api/consultationService';
import RegionDropdown from '@/components/address/RegionDropdown';
import { useAuth } from '@/contexts/AuthContext';

export default function ConsultationModal({
  isOpen,
  onClose,
  preSelectedCategory,
}: ConsultationModalProps) {
  // 로그인 유저 정보
  const { user } = useAuth();

  // 스텝 관리
  const [step, setStep] = useState(1);

  // 카테고리 & 플로우
  const [categories, setCategories] = useState<LocalBusinessCategory[]>([]);
  const [flows, setFlows] = useState<ConsultationFlow[]>([]);
  const [currentFlowStep, setCurrentFlowStep] = useState(0);

  // 기본 정보
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<string | number | null>(preSelectedCategory?.id || null);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [userInfoLoaded, setUserInfoLoaded] = useState(false);

  // 플로우 선택 결과
  const [selections, setSelections] = useState<FlowSelection[]>([]);
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const [additionalContent, setAdditionalContent] = useState('');

  // 최종 상담 내용
  const [finalContent, setFinalContent] = useState('');

  // 상태
  const [loading, setLoading] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // 카테고리 로드
  useEffect(() => {
    if (isOpen) {
      fetchCategories().then(setCategories);
    }
  }, [isOpen]);

  // 로그인 유저 정보 자동 채우기
  useEffect(() => {
    if (isOpen && user && !userInfoLoaded) {
      // 이름 (name 또는 username/nickname)
      if (user.name) {
        setName(user.name);
      } else if (user.username) {
        setName(user.username);
      } else if (user.nickname) {
        setName(user.nickname);
      }

      // 연락처
      if (user.phone_number) {
        setPhone(formatPhone(user.phone_number));
      }

      // 이메일
      if (user.email) {
        setEmail(user.email);
      }

      // 지역 (address_region 객체에서 추출)
      if (user.address_region) {
        const regionObj = user.address_region;
        // 시/도 (full_name에서 첫 번째 부분 또는 name)
        if (regionObj.full_name) {
          const parts = regionObj.full_name.split(' ');
          if (parts.length >= 2) {
            setProvince(parts[0]);
            setCity(parts[1]);
          } else if (parts.length === 1) {
            setProvince(parts[0]);
          }
        } else if (regionObj.name) {
          setProvince(regionObj.name);
        }
      } else if (user.region) {
        // 구버전 region 문자열 처리
        const parts = user.region.split(' ');
        if (parts.length >= 2) {
          setProvince(parts[0]);
          setCity(parts[1]);
        } else if (parts.length === 1) {
          setProvince(parts[0]);
        }
      }

      setUserInfoLoaded(true);
    }
  }, [isOpen, user, userInfoLoaded]);

  // 선택된 카테고리 변경 시 플로우 로드
  useEffect(() => {
    if (category) {
      // 카테고리 ID (숫자 또는 문자열)로 플로우 조회
      fetchConsultationFlows(category).then(data => {
        setFlows(data);
        setCurrentFlowStep(0);
        setSelections([]);
        setCustomInputs({});
      });
    } else {
      setFlows([]);
    }
  }, [category]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setName('');
      setPhone('');
      setEmail('');
      setCategory(preSelectedCategory?.id || null);
      setProvince('');
      setCity('');
      setFlows([]);
      setCurrentFlowStep(0);
      setSelections([]);
      setCustomInputs({});
      setAdditionalContent('');
      setFinalContent('');
      setAgreed(false);
      setUserInfoLoaded(false); // 다음 열릴 때 다시 자동 채우기 가능
    }
  }, [isOpen, preSelectedCategory]);

  // 전화번호 포맷
  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 현재 플로우 단계
  const currentFlow = flows[currentFlowStep];

  // 플로우가 조건부인지 확인
  const shouldShowFlow = (flow: ConsultationFlow) => {
    if (!flow.depends_on_step || flow.depends_on_options.length === 0) {
      return true;
    }
    // 의존하는 단계에서 선택된 옵션 확인
    const dependentSelection = selections.find(s => s.step === flow.depends_on_step);
    if (!dependentSelection) return false;
    return flow.depends_on_options.includes(dependentSelection.optionKey);
  };

  // 옵션 선택 핸들러
  const handleOptionSelect = (optionKey: string, optionLabel: string, isCustom: boolean = false) => {
    if (!currentFlow) return;

    const answer = isCustom ? customInputs[currentFlow.step_number] || '' : optionLabel;

    if (isCustom && !answer.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    const newSelection: FlowSelection = {
      step: currentFlow.step_number,
      question: currentFlow.question,
      answer,
      optionKey,
      isCustom,
    };

    // 기존 선택 업데이트 또는 추가
    setSelections(prev => {
      const filtered = prev.filter(s => s.step !== currentFlow.step_number);
      return [...filtered, newSelection];
    });

    // 다음 단계로 이동
    moveToNextFlow();
  };

  // 다음 플로우로 이동
  const moveToNextFlow = () => {
    let nextStep = currentFlowStep + 1;

    // 조건부 플로우 스킵
    while (nextStep < flows.length && !shouldShowFlow(flows[nextStep])) {
      nextStep++;
    }

    if (nextStep >= flows.length) {
      // 모든 플로우 완료 → AI 다듬기
      handlePolish();
    } else {
      setCurrentFlowStep(nextStep);
    }
  };

  // 이전 플로우로 이동
  const moveToPrevFlow = () => {
    let prevStep = currentFlowStep - 1;

    // 조건부 플로우 스킵
    while (prevStep >= 0 && !shouldShowFlow(flows[prevStep])) {
      prevStep--;
    }

    if (prevStep >= 0) {
      setCurrentFlowStep(prevStep);
    }
  };

  // AI 다듬기
  const handlePolish = async () => {
    if (!category) return;

    setPolishing(true);
    try {
      const result = await polishContent({
        category,
        selections,
        additional_content: additionalContent,
      });

      if (result) {
        setFinalContent(result.polished_content);
        setStep(3); // 확인 단계로
      } else {
        // AI 실패 시 raw summary 사용
        const rawContent = selections.map(s => `${s.question}: ${s.answer}`).join('\n');
        setFinalContent(additionalContent ? `${rawContent}\n\n추가사항: ${additionalContent}` : rawContent);
        setStep(3);
      }
    } catch {
      toast.error('내용 정리에 실패했습니다.');
    } finally {
      setPolishing(false);
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
      // 카테고리가 문자열이면 숫자로 변환 시도, 아니면 그대로 사용
      const categoryValue = typeof category === 'string' && !isNaN(Number(category))
        ? Number(category)
        : category;

      const result = await createConsultationRequest({
        name,
        phone: phone.replace(/-/g, ''),
        email: email || undefined,
        category: categoryValue as number,
        region: `${province} ${city}`.trim(),
        content: finalContent,
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
    name.length >= 2 &&
    phone.replace(/-/g, '').length >= 10 &&
    category !== null &&
    province !== '' &&
    city !== '';

  // 선택된 카테고리 정보
  const selectedCategory = categories.find(c => c.id === category);

  // 현재 단계에서 선택된 옵션
  const currentSelection = currentFlow
    ? selections.find(s => s.step === currentFlow.step_number)
    : null;

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
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="홍길동"
                maxLength={20}
              />
            </div>

            {/* 연락처 */}
            <div>
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
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
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-lg border text-sm flex flex-col items-center gap-1 transition-colors ${
                      category === cat.id
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
              <div className="mt-2">
                <RegionDropdown
                  selectedProvince={province}
                  selectedCity={city}
                  onSelect={(p, c) => {
                    setProvince(p);
                    setCity(c);
                  }}
                  required
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

        {/* Step 2: 탭 기반 상담 내용 선택 */}
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

            {/* 플로우 로딩 */}
            {flows.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-dungji-primary"></div>
                <p className="mt-2 text-sm text-slate-500">질문을 불러오는 중...</p>
              </div>
            ) : polishing ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-dungji-primary"></div>
                <p className="mt-2 text-sm text-slate-500">내용을 정리하고 있습니다...</p>
              </div>
            ) : currentFlow ? (
              <>
                {/* 진행 상태 */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>질문 {currentFlowStep + 1} / {flows.filter(f => shouldShowFlow(f)).length}</span>
                  {selections.length > 0 && (
                    <button
                      onClick={moveToPrevFlow}
                      className="text-dungji-primary hover:underline"
                    >
                      ← 이전 질문
                    </button>
                  )}
                </div>

                {/* 질문 */}
                <div className="text-lg font-semibold text-slate-800">
                  {currentFlow.question}
                </div>

                {/* 선택지 */}
                <div className="grid grid-cols-2 gap-2">
                  {currentFlow.options.map(option => (
                    option.is_custom_input ? (
                      // 직접 입력 옵션
                      <div key={option.key} className="col-span-2 space-y-2">
                        <div className="border-t pt-3 mt-2">
                          <p className="text-sm text-slate-500 mb-2">원하는 내용이 없으신가요?</p>
                          <div className="flex gap-2">
                            <Input
                              value={customInputs[currentFlow.step_number] || ''}
                              onChange={e => setCustomInputs(prev => ({
                                ...prev,
                                [currentFlow.step_number]: e.target.value
                              }))}
                              placeholder="직접 입력해주세요"
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={() => handleOptionSelect(option.key, '', true)}
                              disabled={!customInputs[currentFlow.step_number]?.trim()}
                            >
                              선택
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 일반 옵션
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleOptionSelect(option.key, option.label)}
                        className={`p-3 rounded-lg border text-left transition-all hover:border-dungji-primary hover:bg-dungji-primary/5 ${
                          currentSelection?.optionKey === option.key
                            ? 'border-dungji-primary bg-dungji-primary/10'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {option.icon && <span className="text-lg">{option.icon}</span>}
                          <span className="text-sm font-medium">{option.label}</span>
                        </div>
                        {option.description && (
                          <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                        )}
                      </button>
                    )
                  ))}
                </div>

                {/* 선택 내역 미리보기 */}
                {selections.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800 mb-2">선택한 내용</p>
                    <div className="space-y-1">
                      {selections.map((sel, idx) => (
                        <p key={idx} className="text-xs text-blue-700">
                          • {sel.question}: <span className="font-medium">{sel.answer}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 마지막 단계면 추가 입력란 표시 */}
                {currentFlowStep === flows.filter(f => shouldShowFlow(f)).length - 1 && (
                  <div className="mt-4 pt-4 border-t">
                    <Label>추가로 전달하고 싶은 내용 (선택)</Label>
                    <Textarea
                      value={additionalContent}
                      onChange={e => setAdditionalContent(e.target.value)}
                      placeholder="추가 상황이나 요청사항이 있다면 자유롭게 작성해주세요."
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                )}
              </>
            ) : null}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                이전
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
                <div>{name}</div>
                <div className="text-slate-500">연락처</div>
                <div>{phone}</div>
                {email && (
                  <>
                    <div className="text-slate-500">이메일</div>
                    <div>{email}</div>
                  </>
                )}
                <div className="text-slate-500">업종</div>
                <div>{selectedCategory?.icon} {selectedCategory?.name}</div>
                <div className="text-slate-500">지역</div>
                <div>{province} {city}</div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-slate-500 text-sm mb-1">상담 내용</div>
                <div className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">
                  {finalContent}
                </div>
              </div>

              {/* 내용 수정 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentFlowStep(0);
                  setStep(2);
                }}
                className="w-full text-xs"
              >
                상담 내용 다시 선택하기
              </Button>
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

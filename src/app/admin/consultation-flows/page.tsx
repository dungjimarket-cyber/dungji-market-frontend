'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Wand2,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  GripVertical,
} from 'lucide-react';

interface FlowOption {
  id?: number;
  key: string;
  label: string;
  icon: string;
  logo: string;
  description: string;
  is_custom_input: boolean;
  order_index: number;
  is_active: boolean;
}

interface Flow {
  id?: number;
  step_number: number;
  question: string;
  is_required: boolean;
  depends_on_step: number | null;
  depends_on_options: string[];
  order_index: number;
  is_active: boolean;
  options: FlowOption[];
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('dungji_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || '요청 처리 중 오류가 발생했습니다.');
  }

  return response.json();
};

export default function ConsultationFlowsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [editingFlowIndex, setEditingFlowIndex] = useState<number | null>(null);

  // AI 생성 관련
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiReference, setAiReference] = useState('');

  // 관리자 권한 확인
  useEffect(() => {
    if (status === 'loading') return;

    const token = localStorage.getItem('dungji_auth_token');
    const userDataStr = localStorage.getItem('user');
    let isAdmin = false;

    if (token && userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        isAdmin = userData?.role === 'admin';
      } catch (e) {
        console.error('사용자 데이터 파싱 오류:', e);
      }
    }

    const sessionRole = session?.user?.role;
    const isSessionAdmin = sessionRole === 'admin';

    if (!token && status === 'unauthenticated') {
      toast.error('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (!isAdmin && !isSessionAdmin) {
      toast.error('관리자만 접근할 수 있는 페이지입니다.');
      router.push('/');
      return;
    }

    loadCategories();
  }, [status, session, router]);

  const loadCategories = async () => {
    try {
      const data = await fetchWithAuth('/admin/consultation-flows/categories/');
      setCategories(data.all || []);
    } catch (error: any) {
      toast.error(error.message || '카테고리 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const loadFlows = useCallback(async (categoryId: number) => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/admin/consultation-flows/?category=${categoryId}`);
      setFlows(data);
      setEditingFlowIndex(null);
    } catch (error: any) {
      toast.error(error.message || '플로우 로드 실패');
      setFlows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadFlows(selectedCategoryId);
    }
  }, [selectedCategoryId, loadFlows]);

  // 새 플로우 추가
  const addFlow = () => {
    const newFlow: Flow = {
      step_number: flows.length + 1,
      question: '',
      is_required: true,
      depends_on_step: null,
      depends_on_options: [],
      order_index: flows.length,
      is_active: true,
      options: [
        {
          key: 'custom',
          label: '직접 입력',
          icon: '✏️',
          logo: '',
          description: '',
          is_custom_input: true,
          order_index: 0,
          is_active: true,
        },
      ],
    };
    setFlows([...flows, newFlow]);
    setEditingFlowIndex(flows.length);
  };

  // 플로우 삭제
  const removeFlow = (index: number) => {
    const newFlows = flows.filter((_, i) => i !== index);
    // step_number 재정렬
    newFlows.forEach((f, i) => {
      f.step_number = i + 1;
      f.order_index = i;
    });
    setFlows(newFlows);
    setEditingFlowIndex(null);
  };

  // 플로우 이동
  const moveFlow = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= flows.length) return;

    const newFlows = [...flows];
    [newFlows[index], newFlows[newIndex]] = [newFlows[newIndex], newFlows[index]];
    newFlows.forEach((f, i) => {
      f.step_number = i + 1;
      f.order_index = i;
    });
    setFlows(newFlows);
  };

  // 플로우 필드 수정
  const updateFlow = (index: number, field: keyof Flow, value: any) => {
    const newFlows = [...flows];
    (newFlows[index] as any)[field] = value;
    setFlows(newFlows);
  };

  // 옵션 추가
  const addOption = (flowIndex: number) => {
    const newFlows = [...flows];
    const options = newFlows[flowIndex].options;
    const newOption: FlowOption = {
      key: `option_${Date.now()}`,
      label: '',
      icon: '',
      logo: '',
      description: '',
      is_custom_input: false,
      order_index: options.length,
      is_active: true,
    };
    // 직접 입력 옵션 앞에 추가
    const customIndex = options.findIndex((o) => o.is_custom_input);
    if (customIndex >= 0) {
      options.splice(customIndex, 0, newOption);
    } else {
      options.push(newOption);
    }
    options.forEach((o, i) => (o.order_index = i));
    setFlows(newFlows);
  };

  // 옵션 삭제
  const removeOption = (flowIndex: number, optionIndex: number) => {
    const newFlows = [...flows];
    newFlows[flowIndex].options = newFlows[flowIndex].options.filter((_, i) => i !== optionIndex);
    newFlows[flowIndex].options.forEach((o, i) => (o.order_index = i));
    setFlows(newFlows);
  };

  // 옵션 필드 수정
  const updateOption = (flowIndex: number, optionIndex: number, field: keyof FlowOption, value: any) => {
    const newFlows = [...flows];
    (newFlows[flowIndex].options[optionIndex] as any)[field] = value;
    setFlows(newFlows);
  };

  // 저장
  const handleSave = async () => {
    if (!selectedCategoryId) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }

    // 유효성 검사
    for (const flow of flows) {
      if (!flow.question.trim()) {
        toast.error('모든 질문을 입력해주세요.');
        return;
      }
      for (const opt of flow.options) {
        if (!opt.is_custom_input && !opt.label.trim()) {
          toast.error('모든 옵션의 라벨을 입력해주세요.');
          return;
        }
      }
    }

    setSaving(true);
    try {
      await fetchWithAuth('/admin/consultation-flows/bulk-save/', {
        method: 'POST',
        body: JSON.stringify({
          category_id: selectedCategoryId,
          flows: flows,
        }),
      });

      toast.success('플로우가 저장되었습니다.');
      loadFlows(selectedCategoryId);
    } catch (error: any) {
      toast.error(error.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  // AI 생성
  const handleAIGenerate = async () => {
    if (!selectedCategoryId) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }

    setGenerating(true);
    try {
      const data = await fetchWithAuth('/admin/consultation-flows/ai-generate/', {
        method: 'POST',
        body: JSON.stringify({
          category_id: selectedCategoryId,
          keywords: aiKeywords,
          reference_text: aiReference,
        }),
      });

      if (data.success && data.flows) {
        setFlows(data.flows);
        toast.success(`${data.flows.length}개의 플로우가 생성되었습니다.`);
        setEditingFlowIndex(null);
      } else {
        toast.error(data.error || 'AI 생성 실패');
      }
    } catch (error: any) {
      toast.error(error.message || 'AI 생성 실패');
    } finally {
      setGenerating(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">상담 질문 플로우 관리</h1>
          <p className="text-sm text-gray-500">카테고리별 상담 질문과 선택지를 설정합니다.</p>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">카테고리 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCategoryId?.toString() || ''}
            onValueChange={(v) => setSelectedCategoryId(Number(v))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="카테고리를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCategoryId && (
        <>
          {/* AI 생성 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI로 플로우 생성
              </CardTitle>
              <CardDescription>
                키워드나 참고 텍스트를 입력하면 AI가 질문 플로우를 추천합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>참고 키워드 (선택)</Label>
                <Input
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  placeholder="예: 종소세, 법인세, 부가세 신고"
                />
              </div>
              <div>
                <Label>참고 텍스트 (선택)</Label>
                <Textarea
                  value={aiReference}
                  onChange={(e) => setAiReference(e.target.value)}
                  placeholder="기존 플로우나 참고할 내용을 입력하세요"
                  rows={3}
                />
              </div>
              <Button onClick={handleAIGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI로 플로우 생성
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 플로우 목록 */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedCategory?.icon} {selectedCategory?.name} 플로우
                </CardTitle>
                <CardDescription>{flows.length}개의 질문 단계</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={addFlow}>
                  <Plus className="h-4 w-4 mr-2" />
                  질문 추가
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : flows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  등록된 플로우가 없습니다. 위의 &apos;AI로 플로우 생성&apos; 또는 &apos;질문 추가&apos; 버튼을 이용하세요.
                </div>
              ) : (
                <div className="space-y-4">
                  {flows.map((flow, flowIndex) => (
                    <div
                      key={flowIndex}
                      className={`border rounded-lg p-4 ${
                        editingFlowIndex === flowIndex ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      {/* 플로우 헤더 */}
                      <div className="flex items-center gap-2 mb-3">
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        <span className="font-semibold text-sm bg-gray-100 px-2 py-1 rounded">
                          Step {flow.step_number}
                        </span>
                        <div className="flex-1">
                          <Input
                            value={flow.question}
                            onChange={(e) => updateFlow(flowIndex, 'question', e.target.value)}
                            placeholder="질문을 입력하세요"
                            className="font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveFlow(flowIndex, 'up')}
                            disabled={flowIndex === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveFlow(flowIndex, 'down')}
                            disabled={flowIndex === flows.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeFlow(flowIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 플로우 설정 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={flow.is_required}
                            onCheckedChange={(c) => updateFlow(flowIndex, 'is_required', c)}
                          />
                          <Label className="text-xs">필수</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={flow.is_active}
                            onCheckedChange={(c) => updateFlow(flowIndex, 'is_active', c)}
                          />
                          <Label className="text-xs">활성화</Label>
                        </div>
                        <div>
                          <Label className="text-xs">의존 단계</Label>
                          <Select
                            value={flow.depends_on_step?.toString() || 'none'}
                            onValueChange={(v) =>
                              updateFlow(flowIndex, 'depends_on_step', v === 'none' ? null : Number(v))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">없음</SelectItem>
                              {flows
                                .filter((_, i) => i < flowIndex)
                                .map((f) => (
                                  <SelectItem key={f.step_number} value={f.step_number.toString()}>
                                    Step {f.step_number}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {flow.depends_on_step && (
                          <div>
                            <Label className="text-xs">의존 옵션 (콤마 구분)</Label>
                            <Input
                              value={flow.depends_on_options.join(', ')}
                              onChange={(e) =>
                                updateFlow(
                                  flowIndex,
                                  'depends_on_options',
                                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                                )
                              }
                              placeholder="option_key1, option_key2"
                              className="h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* 옵션 목록 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">선택지</Label>
                          <Button variant="ghost" size="sm" onClick={() => addOption(flowIndex)}>
                            <Plus className="h-3 w-3 mr-1" />
                            옵션 추가
                          </Button>
                        </div>
                        {flow.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 p-2 rounded ${
                              option.is_custom_input ? 'bg-blue-50' : 'bg-gray-50'
                            }`}
                          >
                            <Input
                              value={option.key}
                              onChange={(e) => updateOption(flowIndex, optIndex, 'key', e.target.value)}
                              placeholder="key"
                              className="w-24 h-8 text-xs"
                            />
                            <Input
                              value={option.icon}
                              onChange={(e) => updateOption(flowIndex, optIndex, 'icon', e.target.value)}
                              placeholder="아이콘"
                              className="w-16 h-8 text-xs text-center"
                            />
                            <Input
                              value={option.label}
                              onChange={(e) => updateOption(flowIndex, optIndex, 'label', e.target.value)}
                              placeholder="라벨"
                              className="flex-1 h-8 text-xs"
                            />
                            <Input
                              value={option.description}
                              onChange={(e) => updateOption(flowIndex, optIndex, 'description', e.target.value)}
                              placeholder="설명"
                              className="flex-1 h-8 text-xs"
                            />
                            <div className="flex items-center gap-1">
                              <Checkbox
                                checked={option.is_custom_input}
                                onCheckedChange={(c) =>
                                  updateOption(flowIndex, optIndex, 'is_custom_input', c)
                                }
                              />
                              <Label className="text-xs whitespace-nowrap">직접입력</Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => removeOption(flowIndex, optIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

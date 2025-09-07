'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getPopup, updatePopup, type PopupFormData, type Popup } from '@/lib/api/popupService';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Upload } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  popup_type: z.enum(['image', 'text', 'mixed']),
  content: z.string().optional(),
  link_url: z.string().url().optional().or(z.literal('')),
  link_target: z.enum(['_self', '_blank']),
  position: z.enum(['center', 'top', 'bottom', 'custom']),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  width: z.number().min(200).max(1200),
  height: z.number().min(200).max(900),
  start_date: z.string(),
  end_date: z.string().optional(),
  priority: z.number().min(0),
  is_active: z.boolean(),
  show_on_main: z.boolean(),
  show_on_mobile: z.boolean(),
  show_today_close: z.boolean(),
  show_week_close: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPopupPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { token } = useAuth();
  const [popup, setPopup] = useState<Popup | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      popup_type: 'image',
      link_target: '_blank',
      position: 'center',
      width: 500,
      height: 600,
      priority: 0,
      is_active: true,
      show_on_main: true,
      show_on_mobile: true,
      show_today_close: true,
      show_week_close: false,
    }
  });

  const popupType = watch('popup_type');
  const position = watch('position');

  useEffect(() => {
    fetchPopup();
  }, [id]);

  const fetchPopup = async () => {
    try {
      const data = await getPopup(Number(id));
      setPopup(data);

      // 폼 데이터 설정
      setValue('title', data.title);
      setValue('popup_type', data.popup_type);
      setValue('content', data.content || '');
      setValue('link_url', data.link_url || '');
      setValue('link_target', data.link_target);
      setValue('position', data.position);
      setValue('position_x', data.position_x || 0);
      setValue('position_y', data.position_y || 0);
      setValue('width', data.width);
      setValue('height', data.height);
      setValue('start_date', data.start_date.split('T')[0]);
      setValue('end_date', data.end_date ? data.end_date.split('T')[0] : '');
      setValue('priority', data.priority);
      setValue('is_active', data.is_active);
      setValue('show_on_main', data.show_on_main);
      setValue('show_on_mobile', data.show_on_mobile);
      setValue('show_today_close', data.show_today_close);
      setValue('show_week_close', data.show_week_close);

      if (data.image) {
        setImagePreview(data.image);
      }
    } catch (error) {
      console.error('팝업 조회 실패:', error);
      toast.error('팝업 정보를 불러올 수 없습니다.');
      router.push('/admin/popups');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!token || !popup) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setSubmitting(true);
    try {
      const formData: PopupFormData = {
        ...data,
        image: imageFile || popup.image || undefined,
        show_pages: popup.show_pages,
        exclude_pages: popup.exclude_pages,
      };

      await updatePopup(popup.id, formData, token);
      toast.success('팝업이 수정되었습니다.');
      router.push('/admin/popups');
    } catch (error) {
      console.error('팝업 수정 실패:', error);
      toast.error('팝업 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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
      <div className="mb-6">
        <Button
          onClick={() => router.push('/admin/popups')}
          variant="ghost"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>팝업 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="팝업 제목"
                  />
                  {errors.title && (
                    <span className="text-sm text-red-500">{errors.title.message}</span>
                  )}
                </div>

                <div>
                  <Label htmlFor="popup_type">팝업 타입 *</Label>
                  <Select
                    value={watch('popup_type')}
                    onValueChange={(value: 'image' | 'text' | 'mixed') => setValue('popup_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">이미지</SelectItem>
                      <SelectItem value="text">텍스트</SelectItem>
                      <SelectItem value="mixed">이미지 + 텍스트</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="priority">우선순위</Label>
                <Input
                  id="priority"
                  type="number"
                  {...register('priority', { valueAsNumber: true })}
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">높은 숫자가 먼저 표시됩니다</span>
              </div>
            </div>

            {/* 내용 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">내용</h3>

              {(popupType === 'text' || popupType === 'mixed') && (
                <div>
                  <Label htmlFor="content">텍스트 내용</Label>
                  <Textarea
                    id="content"
                    {...register('content')}
                    placeholder="팝업 내용을 입력하세요"
                    rows={5}
                  />
                </div>
              )}

              {(popupType === 'image' || popupType === 'mixed') && (
                <div>
                  <Label htmlFor="image">이미지</Label>
                  <div className="space-y-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs max-h-48 object-contain border rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="link_url">링크 URL</Label>
                  <Input
                    id="link_url"
                    {...register('link_url')}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="link_target">링크 열기 방식</Label>
                  <Select
                    value={watch('link_target')}
                    onValueChange={(value: '_self' | '_blank') => setValue('link_target', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_self">현재 창</SelectItem>
                      <SelectItem value="_blank">새 창</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 표시 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">표시 설정</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="position">위치</Label>
                  <Select
                    value={watch('position')}
                    onValueChange={(value: 'center' | 'top' | 'bottom' | 'custom') => setValue('position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">중앙</SelectItem>
                      <SelectItem value="top">상단</SelectItem>
                      <SelectItem value="bottom">하단</SelectItem>
                      <SelectItem value="custom">사용자 지정</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {position === 'custom' && (
                  <>
                    <div>
                      <Label htmlFor="position_x">X 좌표</Label>
                      <Input
                        id="position_x"
                        type="number"
                        {...register('position_x', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position_y">Y 좌표</Label>
                      <Input
                        id="position_y"
                        type="number"
                        {...register('position_y', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">너비 (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    {...register('width', { valueAsNumber: true })}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="height">높이 (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    {...register('height', { valueAsNumber: true })}
                    placeholder="600"
                  />
                </div>
              </div>
            </div>

            {/* 표시 기간 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">표시 기간</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">시작일 *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register('start_date')}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">종료일</Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...register('end_date')}
                  />
                  <span className="text-sm text-gray-500">비워두면 계속 표시</span>
                </div>
              </div>
            </div>

            {/* 옵션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">옵션</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">활성화</Label>
                  <Switch
                    id="is_active"
                    checked={watch('is_active')}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_on_main">메인 페이지 표시</Label>
                  <Switch
                    id="show_on_main"
                    checked={watch('show_on_main')}
                    onCheckedChange={(checked) => setValue('show_on_main', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_on_mobile">모바일 표시</Label>
                  <Switch
                    id="show_on_mobile"
                    checked={watch('show_on_mobile')}
                    onCheckedChange={(checked) => setValue('show_on_mobile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_today_close">오늘 하루 보지 않기 옵션</Label>
                  <Switch
                    id="show_today_close"
                    checked={watch('show_today_close')}
                    onCheckedChange={(checked) => setValue('show_today_close', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show_week_close">일주일 보지 않기 옵션</Label>
                  <Switch
                    id="show_week_close"
                    checked={watch('show_week_close')}
                    onCheckedChange={(checked) => setValue('show_week_close', checked)}
                  />
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/popups')}
              >
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '수정 중...' : '수정'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
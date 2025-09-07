'use client';

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

export default function EditPopupPage({ params }: { params: { id: string } }) {
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
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    fetchPopup();
  }, [params.id]);

  const fetchPopup = async () => {
    try {
      const data = await getPopup(Number(params.id));
      setPopup(data);
      setImagePreview(data.image || '');
      
      const formData: FormData = {
        title: data.title,
        popup_type: data.popup_type,
        content: data.content || '',
        link_url: data.link_url || '',
        link_target: data.link_target,
        position: data.position,
        position_x: data.position_x || 0,
        position_y: data.position_y || 0,
        width: data.width,
        height: data.height,
        start_date: data.start_date.slice(0, 16),
        end_date: data.end_date?.slice(0, 16) || '',
        priority: data.priority,
        is_active: data.is_active,
        show_on_main: data.show_on_main,
        show_on_mobile: data.show_on_mobile,
        show_today_close: data.show_today_close,
        show_week_close: data.show_week_close,
      };
      
      reset(formData);
    } catch (error) {
      console.error('팝업 조회 실패:', error);
      toast.error('팝업 정보를 불러오는데 실패했습니다.');
      router.push('/admin/popups');
    } finally {
      setLoading(false);
    }
  };

  const popupType = watch('popup_type');
  const position = watch('position');

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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/popups')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold">팝업 수정</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">팝업 제목 (관리용)</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="예: 2024 신년 이벤트 팝업"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="popup_type">팝업 타입</Label>
                <Select
                  value={popupType}
                  onValueChange={(value) => setValue('popup_type', value as any)}
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

              <div>
                <Label htmlFor="priority">우선순위</Label>
                <Input
                  id="priority"
                  type="number"
                  {...register('priority', { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">높은 숫자가 먼저 표시됩니다</p>
              </div>
            </div>

            {(popupType === 'text' || popupType === 'mixed') && (
              <div>
                <Label htmlFor="content">팝업 내용</Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  rows={5}
                  placeholder="팝업에 표시할 텍스트 내용을 입력하세요"
                />
              </div>
            )}

            {(popupType === 'image' || popupType === 'mixed') && (
              <div>
                <Label htmlFor="image">팝업 이미지</Label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">클릭하여 이미지 업로드</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>표시 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">팝업 위치</Label>
                <Select
                  value={position}
                  onValueChange={(value) => setValue('position', value as any)}
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
                    <Label htmlFor="position_x">X 좌표 (px)</Label>
                    <Input
                      id="position_x"
                      type="number"
                      {...register('position_x', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="position_y">Y 좌표 (px)</Label>
                    <Input
                      id="position_y"
                      type="number"
                      {...register('position_y', { valueAsNumber: true })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">너비 (px)</Label>
                <Input
                  id="width"
                  type="number"
                  {...register('width', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground mt-1">200-1200px</p>
              </div>

              <div>
                <Label htmlFor="height">높이 (px)</Label>
                <Input
                  id="height"
                  type="number"
                  {...register('height', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground mt-1">200-900px</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">시작일시</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  {...register('start_date')}
                />
              </div>

              <div>
                <Label htmlFor="end_date">종료일시 (선택)</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  {...register('end_date')}
                />
                <p className="text-xs text-muted-foreground mt-1">비어있으면 계속 표시</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>링크 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="link_url">링크 URL (선택)</Label>
              <Input
                id="link_url"
                type="url"
                {...register('link_url')}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="link_target">링크 열기 방식</Label>
              <Select
                value={watch('link_target')}
                onValueChange={(value) => setValue('link_target', value as any)}
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
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>옵션</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">팝업 활성화</Label>
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
          </CardContent>
        </Card>

        {popup && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>통계 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">조회수:</span> {popup.view_count}
                </div>
                <div>
                  <span className="text-muted-foreground">클릭수:</span> {popup.click_count}
                </div>
                {popup.view_count > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">CTR:</span>{' '}
                    {((popup.click_count / popup.view_count) * 100).toFixed(2)}%
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">생성일:</span>{' '}
                  {new Date(popup.created_at).toLocaleString('ko-KR')}
                </div>
                <div>
                  <span className="text-muted-foreground">수정일:</span>{' '}
                  {new Date(popup.updated_at).toLocaleString('ko-KR')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/popups')}
          >
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '수정 중...' : '팝업 수정'}
          </Button>
        </div>
      </form>
    </div>
  );
}
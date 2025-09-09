/**
 * 중고폰 등록 API
 * POST /api/used/phones/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { compressImage } from '@/lib/api/used/image-utils';

// 파일 업로드 제한
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    // FormData 파싱
    const formData = await request.formData();
    
    // 이미지 파일 추출
    const imageFiles: File[] = [];
    const images = formData.getAll('images');
    
    for (const image of images) {
      if (image instanceof File) {
        // 파일 유효성 검사
        if (!ALLOWED_TYPES.includes(image.type)) {
          return NextResponse.json(
            { error: '지원하지 않는 이미지 형식입니다.' },
            { status: 400 }
          );
        }
        if (image.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: '이미지 크기는 10MB 이하여야 합니다.' },
            { status: 400 }
          );
        }
        imageFiles.push(image);
      }
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: '최소 1장 이상의 이미지를 업로드해주세요.' },
        { status: 400 }
      );
    }

    if (imageFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `최대 ${MAX_FILES}장까지 업로드 가능합니다.` },
        { status: 400 }
      );
    }

    // 대표 이미지 인덱스
    const mainImageIndex = parseInt(formData.get('mainImageIndex') as string || '0');

    // 이미지 압축 처리
    const processedImages = await Promise.all(
      imageFiles.map(async (file, index) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const compressed = await compressImage(buffer, {
          quality: 85,
          maxWidth: 1200,
          maxHeight: 1200,
        });

        return {
          originalName: file.name,
          webp: compressed.webp,
          thumbnail: compressed.thumbnail,
          isMain: index === mainImageIndex,
          order: index,
        };
      })
    );

    // 폰 정보 추출
    const phoneData = {
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      storage: formData.get('storage') ? parseInt(formData.get('storage') as string) : null,
      color: formData.get('color') as string || null,
      price: parseInt(formData.get('price') as string),
      minOfferPrice: formData.get('minOfferPrice') ? parseInt(formData.get('minOfferPrice') as string) : null,
      acceptOffers: formData.get('acceptOffers') === 'true',
      conditionGrade: formData.get('conditionGrade') as string || null,
      conditionDescription: formData.get('conditionDescription') as string || null,
      batteryStatus: formData.get('batteryStatus') as string || null,
      hasBox: formData.get('hasBox') === 'true',
      hasCharger: formData.get('hasCharger') === 'true',
      hasEarphones: formData.get('hasEarphones') === 'true',
      description: formData.get('description') as string || null,
      sido: formData.get('sido') as string || null,
      sigungu: formData.get('sigungu') as string || null,
      dong: formData.get('dong') as string || null,
      meetingPlace: formData.get('meetingPlace') as string || null,
    };

    // 유효성 검사
    if (!phoneData.brand || !phoneData.model || !phoneData.price) {
      return NextResponse.json(
        { error: '필수 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 실제 환경에서는 여기서 데이터베이스에 저장
    // 1. used_phones 테이블에 폰 정보 저장
    // 2. used_phone_images 테이블에 이미지 정보 저장
    // 3. 실제 이미지 파일을 S3 등 스토리지에 업로드

    // 개발 환경 - 임시 응답
    const mockPhoneId = Date.now();
    
    // 이미지 URL 생성 (실제로는 S3 URL)
    const savedImages = processedImages.map((img, index) => ({
      id: index + 1,
      phoneId: mockPhoneId,
      imageUrl: `/api/used/images/${mockPhoneId}/${index}.webp`,
      thumbnailUrl: `/api/used/images/${mockPhoneId}/${index}_thumb.webp`,
      isMain: img.isMain,
      order: img.order,
    }));

    const savedPhone = {
      id: mockPhoneId,
      ...phoneData,
      images: savedImages,
      status: 'active',
      viewCount: 0,
      favoriteCount: 0,
      offerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 성공 응답
    return NextResponse.json({
      success: true,
      id: mockPhoneId,
      data: savedPhone,
    });

  } catch (error) {
    console.error('Phone registration error:', error);
    return NextResponse.json(
      { error: '상품 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
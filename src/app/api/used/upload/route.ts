/**
 * 중고폰 이미지 업로드 API
 * POST /api/used/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  compressImage, 
  validateImage, 
  saveImageToLocal,
  createThumbnail 
} from '@/lib/api/used/image-utils';

// 업로드 설정
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    // FormData 파싱
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    // 파일 개수 검증
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '업로드할 이미지를 선택해주세요.' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `최대 ${MAX_FILES}개의 이미지만 업로드 가능합니다.` },
        { status: 400 }
      );
    }

    const uploadedImages = [];
    const errors = [];

    // 각 파일 처리
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // 파일 타입 검증
        if (!ALLOWED_FORMATS.includes(file.type)) {
          errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`);
          continue;
        }

        // 파일 크기 검증
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: 파일 크기가 5MB를 초과합니다.`);
          continue;
        }

        // ArrayBuffer를 Buffer로 변환
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 이미지 검증
        const validation = await validateImage(buffer);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // 이미지 압축
        const compressed = await compressImage(buffer, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 85,
          format: 'webp'
        });

        // 썸네일 생성
        const thumbnail = await createThumbnail(buffer, 300);
        const thumbnailFilename = `thumb_${compressed.filename}`;

        // 로컬 저장 (프로덕션에서는 S3 등으로 변경)
        const imageUrl = await saveImageToLocal(compressed.buffer, compressed.filename);
        const thumbnailUrl = await saveImageToLocal(thumbnail, thumbnailFilename);

        // 결과 저장
        uploadedImages.push({
          url: imageUrl,
          thumbnailUrl: thumbnailUrl,
          width: compressed.width,
          height: compressed.height,
          size: compressed.size,
          originalName: file.name,
          order: i
        });

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errors.push(`${file.name}: 처리 중 오류가 발생했습니다.`);
      }
    }

    // 결과 반환
    if (uploadedImages.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: '이미지 업로드에 실패했습니다.', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 이미지 삭제 API
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: '삭제할 이미지 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // 로컬 파일 삭제 로직 (프로덕션에서는 S3 삭제 등으로 변경)
    // TODO: 실제 삭제 로직 구현

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
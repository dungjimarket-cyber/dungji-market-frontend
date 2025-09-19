/**
 * 중고폰 등록 API
 * POST /api/used/phones/create
 * 
 * Sharp 제거하여 Vercel 배포 크기 문제 해결
 * 이미지 압축은 클라이언트에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';

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
    let mainImageIndex = 0;
    
    for (let i = 0; i < MAX_FILES; i++) {
      const file = formData.get(`image${i}`) as File;
      if (file && file.size > 0) {
        // 파일 크기 검증
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `이미지 ${file.name}의 크기가 10MB를 초과합니다.` },
            { status: 400 }
          );
        }
        
        // 파일 형식 검증
        if (!ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: `이미지 ${file.name}의 형식이 지원되지 않습니다.` },
            { status: 400 }
          );
        }
        
        imageFiles.push(file);
      }
    }
    
    // 대표 이미지 인덱스
    const mainIdx = formData.get('mainImageIndex');
    if (mainIdx) {
      mainImageIndex = parseInt(mainIdx as string);
    }
    
    // 이미지가 없는 경우
    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: '최소 1개의 이미지를 업로드해주세요.' },
        { status: 400 }
      );
    }
    
    // 이미지는 이미 클라이언트에서 압축되었으므로 그대로 저장
    // 실제 저장 로직은 백엔드 API로 전달
    const processedImages = imageFiles.map((file, index) => ({
      originalName: file.name,
      size: file.size,
      type: file.type,
      isMain: index === mainImageIndex,
      order: index,
    }));
    
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
      purchasePeriod: formData.get('purchasePeriod') as string || null,
      manufactureDate: formData.get('manufactureDate') as string || null,
      accessories: formData.get('accessories') ? JSON.parse(formData.get('accessories') as string) : [],
      hasBox: formData.get('hasBox') === 'true',
      hasCharger: formData.get('hasCharger') === 'true',
      hasEarphones: formData.get('hasEarphones') === 'true',
      tradeLocation: formData.get('tradeLocation') as string || null,
      meetingPlace: formData.get('meetingPlace') as string || null,
      description: formData.get('description') as string || null,
      sido: formData.get('sido') as string,
      sigungu: formData.get('sigungu') as string,
    };
    
    // TODO: 실제 백엔드 API 호출하여 데이터 저장
    // const response = await fetch(`${process.env.BACKEND_URL}/api/used/phones/`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //   },
    //   body: formData,
    // });
    
    // 임시 응답
    return NextResponse.json({
      success: true,
      data: {
        ...phoneData,
        images: processedImages,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('POST /api/used/phones/create error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
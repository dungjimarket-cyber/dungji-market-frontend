/**
 * 이미지 업로드 및 압축 유틸리티
 */

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

/**
 * 이미지 압축 옵션
 */
interface ImageCompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

/**
 * 압축된 이미지 정보
 */
interface CompressedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
  filename: string;
}

/**
 * 이미지 압축 처리
 */
export async function compressImage(
  inputBuffer: Buffer,
  options: ImageCompressOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    format = 'webp'
  } = options;

  try {
    // Sharp 인스턴스 생성
    let sharpInstance = sharp(inputBuffer);
    
    // 메타데이터 가져오기
    const metadata = await sharpInstance.metadata();
    
    // 리사이즈 (비율 유지)
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // 자동 회전 (EXIF 데이터 기반)
    sharpInstance = sharpInstance.rotate();

    // 포맷 변환 및 압축
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
      default:
        sharpInstance = sharpInstance.webp({ quality });
        break;
    }

    // 최종 버퍼 생성
    const outputBuffer = await sharpInstance.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
      size: outputBuffer.length,
      format: outputMetadata.format || format,
      filename: `${uuidv4()}.${format}`
    };
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('이미지 압축 중 오류가 발생했습니다.');
  }
}

/**
 * 썸네일 생성
 */
export async function createThumbnail(
  inputBuffer: Buffer,
  size: number = 200
): Promise<Buffer> {
  try {
    return await sharp(inputBuffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    throw new Error('썸네일 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 이미지 검증
 */
export async function validateImage(
  buffer: Buffer,
  maxSizeMB: number = 5
): Promise<{ valid: boolean; error?: string }> {
  try {
    // 파일 크기 검증
    const sizeInMB = buffer.length / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      return { valid: false, error: `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.` };
    }

    // 이미지 메타데이터 검증
    const metadata = await sharp(buffer).metadata();
    
    // 지원 포맷 검증
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
    if (!metadata.format || !supportedFormats.includes(metadata.format)) {
      return { valid: false, error: '지원하지 않는 이미지 형식입니다.' };
    }

    // 최소 크기 검증
    if (!metadata.width || !metadata.height || 
        metadata.width < 100 || metadata.height < 100) {
      return { valid: false, error: '이미지가 너무 작습니다. (최소 100x100px)' };
    }

    // 최대 크기 검증
    if (metadata.width > 10000 || metadata.height > 10000) {
      return { valid: false, error: '이미지가 너무 큽니다. (최대 10000x10000px)' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: false, error: '유효하지 않은 이미지 파일입니다.' };
  }
}

/**
 * 여러 이미지 일괄 압축
 */
export async function compressMultipleImages(
  buffers: Buffer[],
  options: ImageCompressOptions = {}
): Promise<CompressedImage[]> {
  const compressed = await Promise.all(
    buffers.map(buffer => compressImage(buffer, options))
  );
  return compressed;
}

/**
 * Base64를 Buffer로 변환
 */
export function base64ToBuffer(base64: string): Buffer {
  // data:image/jpeg;base64, 형식 제거
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Buffer를 Base64로 변환
 */
export function bufferToBase64(buffer: Buffer, mimeType: string = 'image/webp'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * 로컬 저장소에 이미지 저장 (개발 환경용)
 */
export async function saveImageToLocal(
  buffer: Buffer,
  filename: string,
  uploadDir: string = 'public/uploads/used'
): Promise<string> {
  try {
    // 업로드 디렉토리 생성
    const fullUploadDir = path.join(process.cwd(), uploadDir);
    await fs.mkdir(fullUploadDir, { recursive: true });

    // 파일 저장
    const filePath = path.join(fullUploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // 웹 접근 경로 반환
    return `/uploads/used/${filename}`;
  } catch (error) {
    console.error('Local save error:', error);
    throw new Error('이미지 저장 중 오류가 발생했습니다.');
  }
}

/**
 * 이미지 삭제 (로컬)
 */
export async function deleteLocalImage(filename: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), 'public/uploads/used', filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Image deletion error:', error);
    // 파일이 없어도 에러 무시
  }
}

/**
 * 이미지 정보 추출
 */
export async function getImageInfo(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  orientation?: number;
}> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length,
    orientation: metadata.orientation
  };
}

/**
 * 워터마크 추가 (선택적)
 */
export async function addWatermark(
  inputBuffer: Buffer,
  watermarkText: string = '둥지마켓'
): Promise<Buffer> {
  try {
    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // SVG 워터마크 생성
    const watermarkSvg = `
      <svg width="${width}" height="${height}">
        <text
          x="${width - 100}"
          y="${height - 20}"
          font-family="Arial"
          font-size="20"
          fill="white"
          stroke="black"
          stroke-width="1"
          opacity="0.7"
        >${watermarkText}</text>
      </svg>
    `;

    return await sharp(inputBuffer)
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          gravity: 'southeast'
        }
      ])
      .toBuffer();
  } catch (error) {
    console.error('Watermark error:', error);
    return inputBuffer; // 실패 시 원본 반환
  }
}
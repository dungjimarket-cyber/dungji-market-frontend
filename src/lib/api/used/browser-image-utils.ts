/**
 * 브라우저 기반 이미지 압축 유틸리티
 * Sharp 대신 Canvas API를 사용하여 Vercel 배포 크기 문제 해결
 */

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
 * DataURL을 Blob으로 변환 (호환성)
 */
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * 브라우저에서 이미지 압축
 */
export async function compressImageInBrowser(
  file: File,
  options: ImageCompressOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    format = 'webp'
  } = options;

  // 브라우저 호환성 체크
  if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
    console.warn('Browser APIs not available, returning original file');
    return file;
  }

  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onerror = () => {
        console.error('FileReader error');
        reject(new Error('Failed to read file'));
      };

      reader.onload = (e) => {
        const img = new Image();

        img.onerror = () => {
          console.error('Image loading error');
          reject(new Error('Failed to load image'));
        };

        img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 크기 계산
        let { width, height } = img;
        
        // 최대 크기 제한
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Canvas 크기 설정
        canvas.width = width;
        canvas.height = height;
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blob으로 변환 (Safari 호환성)
        if (canvas.toBlob) {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                // toBlob 실패 시 dataURL 방식 시도
                try {
                  const dataUrl = canvas.toDataURL(`image/${format}`, quality);
                  const blob = dataURLtoBlob(dataUrl);
                  resolve(blob);
                } catch (e) {
                  reject(new Error('Failed to compress image'));
                }
              }
            },
            `image/${format}`,
            quality
          );
        } else {
          // toBlob 미지원 브라우저 (매우 구형)
          try {
            const dataUrl = canvas.toDataURL(`image/${format}`, quality);
            const blob = dataURLtoBlob(dataUrl);
            resolve(blob);
          } catch (e) {
            reject(new Error('Canvas API not supported'));
          }
        }
      };

      // img.src 설정
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file result'));
      }
    };

    reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image compression error:', error);
      reject(error);
    }
  });
}

/**
 * 썸네일 생성
 */
export async function createThumbnailInBrowser(
  file: File,
  size: number = 200
): Promise<Blob> {
  return compressImageInBrowser(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.8,
    format: 'webp'
  });
}

/**
 * 이미지 유효성 검사
 */
export function validateImage(file: File): { isValid: boolean; error?: string } {
  // 파일 크기 검사 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: '이미지 크기는 10MB를 초과할 수 없습니다.' };
  }
  
  // 파일 형식 검사
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP만 지원)' };
  }
  
  return { isValid: true };
}

/**
 * 여러 이미지 압축
 */
export async function compressMultipleImagesInBrowser(
  files: File[],
  options: ImageCompressOptions = {}
): Promise<Blob[]> {
  return Promise.all(files.map(file => compressImageInBrowser(file, options)));
}
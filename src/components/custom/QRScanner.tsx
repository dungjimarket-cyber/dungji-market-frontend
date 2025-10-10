'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, X } from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: { participationCode: string; discountCode: string; groupbuyId: string }) => void;
  groupbuyId: string;
}

export default function QRScanner({ isOpen, onClose, onScanSuccess, groupbuyId }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      // DOM이 렌더링될 때까지 약간 대기
      const timer = setTimeout(() => {
        const element = document.getElementById('qr-reader');
        if (!element) {
          console.error('QR reader element not found');
          return;
        }

        try {
          // QR 스캐너 초기화
          scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            false // verbose를 false로 설정
          );

          scannerRef.current.render(
            (decodedText) => {
              // QR 데이터 파싱: "참여코드|할인코드|공구ID"
              const parts = decodedText.split('|');

              if (parts.length !== 3) {
                toast.error('유효하지 않은 QR 코드입니다');
                return;
              }

              const [participationCode, discountCode, scannedGroupbuyId] = parts;

              // 공구 ID 검증
              if (scannedGroupbuyId !== groupbuyId) {
                toast.error('다른 공구의 QR 코드입니다');
                return;
              }

              // 성공
              onScanSuccess({ participationCode, discountCode, groupbuyId: scannedGroupbuyId });

              // 스캐너 정지
              if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
              }
            },
            (error) => {
              // 스캔 에러 (무시 - 계속 스캔)
            }
          );

          setIsScanning(true);

          // 영어 텍스트를 한글로 변경
          setTimeout(() => {
            const qrReaderElement = document.getElementById('qr-reader');
            if (qrReaderElement) {
              // "Scanning" 텍스트 숨기기
              const statusSpan = qrReaderElement.querySelector('#html5-qrcode-button-camera-permission');
              if (statusSpan) {
                const parent = statusSpan.parentElement;
                if (parent) {
                  parent.style.display = 'none';
                }
              }

              // 파일 선택 버튼 한글화
              const fileButton = qrReaderElement.querySelector('#html5-qrcode-button-file-selection') as HTMLElement;
              if (fileButton) {
                fileButton.textContent = '파일에서 선택';
              }

              // 카메라 시작/중지 버튼 한글화
              const cameraStartButton = qrReaderElement.querySelector('#html5-qrcode-button-camera-start') as HTMLElement;
              if (cameraStartButton) {
                cameraStartButton.textContent = '카메라 시작';
              }

              const cameraStopButton = qrReaderElement.querySelector('#html5-qrcode-button-camera-stop') as HTMLElement;
              if (cameraStopButton) {
                cameraStopButton.textContent = '카메라 중지';
              }

              // "Select Camera" 텍스트 한글화
              const selectTexts = qrReaderElement.querySelectorAll('span');
              selectTexts.forEach(span => {
                if (span.textContent?.includes('Select Camera')) {
                  span.textContent = '카메라 선택';
                }
                if (span.textContent?.includes('Choose Image')) {
                  span.textContent = '이미지 선택';
                }
                if (span.textContent?.includes('No cameras found')) {
                  span.textContent = '카메라를 찾을 수 없습니다';
                }
                if (span.textContent?.includes('Permission denied')) {
                  span.textContent = '카메라 권한이 거부되었습니다';
                }
              });
            }
          }, 200);
        } catch (error) {
          console.error('QR Scanner 초기화 실패:', error);
        }
      }, 100); // 100ms 대기

      return () => clearTimeout(timer);
    }

    return () => {
      // 컴포넌트 언마운트 시 정리
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, groupbuyId, onScanSuccess]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR 코드 스캔
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden border-2 border-slate-200"></div>

          <div className="text-sm text-slate-600 text-center">
            <p>고객의 QR 코드를 카메라에 비춰주세요</p>
            <p className="text-xs text-slate-500 mt-1">자동으로 할인코드가 인증됩니다</p>
          </div>

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

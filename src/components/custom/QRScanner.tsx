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
      // QR 스캐너 초기화
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
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
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        },
        (error) => {
          // 스캔 에러 (무시 - 계속 스캔)
        }
      );

      setIsScanning(true);
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

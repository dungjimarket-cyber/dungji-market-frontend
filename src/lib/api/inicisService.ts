/**
 * 이니시스 결제 서비스
 * KG이니시스 표준결제 연동
 */

interface InicisPaymentParams {
  orderId: string;
  productName: string;
  amount: number;
  buyerName: string;
  buyerTel: string;
  buyerEmail: string;
  returnUrl?: string;
  closeUrl?: string;
}

class InicisService {
  private readonly MID = 'INIpayTest'; // 테스트 상점 아이디 (계약 전)
  private readonly isProduction = false; // 테스트 환경 강제 설정
  
  /**
   * 이니시스 결제창 호출
   */
  async requestPayment(params: InicisPaymentParams) {
    try {
      // 결제 요청 데이터 생성
      const timestamp = Date.now();
      const orderId = `BT_${timestamp}_${params.orderId}`;
      
      // 백엔드에서 서명 생성 및 결제 준비
      const prepareResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/prepare/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify({
          orderId,
          amount: params.amount,
          productName: params.productName,
          buyerName: params.buyerName,
          buyerTel: params.buyerTel,
          buyerEmail: params.buyerEmail,
        }),
      });

      if (!prepareResponse.ok) {
        throw new Error('결제 준비에 실패했습니다.');
      }

      const prepareData = await prepareResponse.json();
      
      // 이니시스 SDK 스크립트 로드 시도
      const sdkLoaded = await this.loadInicisScript();
      
      // SDK가 로드되고 사용 가능한 경우
      if (sdkLoaded && typeof (window as any).INIStdPay !== 'undefined') {
        console.log('이니시스 SDK를 사용합니다.');
        const iniStdPay = (window as any).INIStdPay;
        
        iniStdPay.pay({
          mid: this.MID,
          oid: orderId,
          price: params.amount,
          goodname: params.productName,
          buyername: params.buyerName,
          buyertel: params.buyerTel,
          buyeremail: params.buyerEmail,
          timestamp: prepareData.timestamp,
          signature: prepareData.signature,
          mkey: prepareData.mkey,
          currency: 'WON',
          returnUrl: `${window.location.origin}/payment/inicis/return`,
          closeUrl: `${window.location.origin}/payment/inicis/close`,
          acceptmethod: 'SKIN(YELLOW):HPP(1):below1000',
          gopaymethod: 'Card:VBank:DirectBank',
          version: '1.0',
          charset: 'UTF-8'
        });
      } else {
        // 폼 전송 방식으로 직접 처리
        console.log('폼 전송 방식을 사용합니다.');
        
        // 숨겨진 iframe 생성 (Mixed Content 문제 회피)
        const iframe = document.createElement('iframe');
        iframe.name = 'inicis_payment_frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // 폼 생성
        const form = document.createElement('form');
        form.method = 'POST';
        form.acceptCharset = 'UTF-8';
        form.action = 'https://stgstdpay.inicis.com/INIStdPaySvc';  // 서비스 URL로 변경
        form.target = 'inicis_payment_frame';

        // 필수 파라미터
        const formParams = {
          // 기본 정보
          version: '1.0',
          mid: this.MID,
          oid: orderId,
          price: params.amount,
          goodname: params.productName,
          buyername: params.buyerName,
          buyertel: params.buyerTel,
          buyeremail: params.buyerEmail,
          
          // 인증 정보
          timestamp: prepareData.timestamp,
          signature: prepareData.signature,
          mkey: prepareData.mkey,
          
          // 결제 설정
          currency: 'WON',
          gopaymethod: 'Card:VBank:DirectBank',
          acceptmethod: 'HPP(1):below1000:no_receipt:SKIN(YELLOW)',
          
          // URL 설정
          returnUrl: `${window.location.origin}/payment/inicis/return`,
          closeUrl: `${window.location.origin}/payment/inicis/close`,
          
          // 추가 설정
          charset: 'UTF-8',
          payViewType: 'popup',  // 팝업 방식
          popupUrl: `${window.location.origin}/payment/inicis/popup`,
          quotabase: '2:3:4:5:6:7:8:9:10:11:12'  // 할부 개월
        };

        // 폼 필드 추가
        Object.entries(formParams).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        // 폼 전송 후 새창으로 리다이렉트
        document.body.appendChild(form);
        
        // 팝업창 열기
        const payWindow = window.open('about:blank', 'inicis_payment_popup', 'width=720,height=630,scrollbars=yes,resizable=yes');
        
        if (payWindow) {
          form.target = 'inicis_payment_popup';
          form.submit();
        } else {
          alert('팝업 차단을 해제해주세요. 결제창을 열 수 없습니다.');
        }
        
        // 정리
        setTimeout(() => {
          if (form.parentNode) document.body.removeChild(form);
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1000);
      }

    } catch (error) {
      console.error('이니시스 결제 요청 실패:', error);
      throw error;
    }
  }

  /**
   * 이니시스 스크립트 로드
   */
  private async loadInicisScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // 이미 로드되어 있으면 바로 리턴
      if (document.getElementById('inicis-script')) {
        resolve(true);
        return;
      }

      // Mixed Content 문제로 SDK 로드 건너뛰기
      // 이니시스 테스트 서버가 HTTP 스크립트를 요구하므로 SDK 사용 불가
      console.warn('이니시스 SDK 로드를 건너뜁니다 (Mixed Content 문제)');
      resolve(false);
      
      /* SDK 로드 시도 (현재 비활성화)
      const script = document.createElement('script');
      script.id = 'inicis-script';
      script.src = 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js';
      script.charset = 'UTF-8';
      script.onload = () => {
        console.log('이니시스 SDK 로드 성공');
        resolve(true);
      };
      script.onerror = () => {
        console.warn('이니시스 SDK 로드 실패');
        resolve(false);
      };
      document.head.appendChild(script);
      */
    });
  }

  /**
   * 결제 결과 확인
   */
  async verifyPayment(orderId: string, authUrl: string, authToken: string, authResultCode: string) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify({
          orderId,
          authUrl,
          authToken,
          authResultCode,
        }),
      });

      if (!response.ok) {
        throw new Error('결제 검증에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('결제 검증 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment(tid: string, reason: string = '구매자 요청') {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify({
          tid,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('결제 취소에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('결제 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 가상계좌 입금 확인 (웹훅)
   */
  async confirmVBankDeposit(data: any) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/vbank-confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('가상계좌 입금 확인에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('가상계좌 입금 확인 실패:', error);
      throw error;
    }
  }
}

export const inicisService = new InicisService();
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
      
      // 이니시스 SDK는 jQuery 의존성 문제로 폼 전송 방식 사용
      // const sdkLoaded = await this.loadInicisScript();
      
      // 폼 전송 방식으로 직접 처리
      console.log('이니시스 결제 - 폼 전송 방식을 사용합니다.');
      this.submitPaymentForm(orderId, params, prepareData);

    } catch (error) {
      console.error('이니시스 결제 요청 실패:', error);
      throw error;
    }
  }
  
  /**
   * 폼 전송 방식 결제 (SDK 사용 불가시 폴백)
   */
  private submitPaymentForm(orderId: string, params: InicisPaymentParams, prepareData: any) {
    // 폼 생성
    const form = document.createElement('form');
    form.method = 'POST';
    form.acceptCharset = 'UTF-8';
    
    // 테스트/운영 환경에 따른 URL 설정
    if (this.isProduction) {
      form.action = 'https://stdpay.inicis.com/INIStdPayRequest.jsp';
    } else {
      form.action = 'https://stgstdpay.inicis.com/INIStdPayRequest.jsp';
    }
    
    form.target = '_blank';  // 새 창에서 열기

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
      gopaymethod: 'Card:VBank:DirectBank',  // 카드, 가상계좌, 계좌이체
      acceptmethod: 'HPP(1):below1000:no_receipt',  // 휴대폰결제, 1000원 이하, 현금영수증 미발행
      
      // URL 설정
      returnUrl: `${window.location.origin}/payment/inicis/complete`,
      closeUrl: `${window.location.origin}/payment/inicis/close`
    };

    // 폼 필드 추가
    Object.entries(formParams).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    // 폼 추가 및 전송
    document.body.appendChild(form);
    form.submit();
    
    // 폼 제거
    setTimeout(() => {
      if (form.parentNode) document.body.removeChild(form);
    }, 1000);
  }

  /**
   * 이니시스 스크립트 로드
   */
  private async loadInicisScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // 이미 로드되어 있으면 확인
      if (typeof (window as any).INIStdPay !== 'undefined') {
        console.log('이니시스 SDK가 이미 로드되어 있습니다.');
        resolve(true);
        return;
      }

      // 스크립트가 이미 추가되었는지 확인
      if (document.getElementById('inicis-script')) {
        // 스크립트는 있지만 아직 로드 중일 수 있음
        setTimeout(() => {
          resolve(typeof (window as any).INIStdPay !== 'undefined');
        }, 500);
        return;
      }

      const script = document.createElement('script');
      script.id = 'inicis-script';
      script.async = true;
      
      // 환경에 따른 SDK URL 설정
      if (this.isProduction) {
        script.src = 'https://stdpay.inicis.com/stdjs/INIStdPay.js';
      } else {
        script.src = 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js';
      }
      
      script.onload = () => {
        console.log('이니시스 SDK 로드 성공');
        // SDK 로드 후 잠시 대기 (초기화 시간)
        setTimeout(() => {
          resolve(typeof (window as any).INIStdPay !== 'undefined');
        }, 100);
      };
      
      script.onerror = () => {
        console.warn('이니시스 SDK 로드 실패 - 폼 전송 방식을 사용합니다.');
        resolve(false);
      };
      
      document.head.appendChild(script);
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
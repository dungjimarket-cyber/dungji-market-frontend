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
      
      // 이니시스 스크립트 동적 로드
      await this.loadInicisScript();
      
      // window에 INIStdPay가 있는지 확인
      if (typeof (window as any).INIStdPay !== 'undefined') {
        // JavaScript SDK 방식
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
          acceptmethod: 'HPP(1):below1000',
          version: '1.0'
        });
      } else {
        // 폼 전송 방식 (폴백)
        console.warn('INIStdPay SDK를 사용할 수 없습니다. 폼 전송 방식으로 시도합니다.');
        
        const form = document.createElement('form');
        form.id = 'inicis_form';
        form.name = 'inicis_form';
        form.method = 'POST';
        form.acceptCharset = 'UTF-8';
        form.action = 'https://stgstdpay.inicis.com/stdpay/INIStdPayRequest.jsp';
        form.target = '_blank';

        // 파라미터 설정
        const formParams = {
          version: '1.0',
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
          gopaymethod: 'Card:VBank',
          acceptmethod: 'HPP(1):below1000:no_receipt',
          returnUrl: `${window.location.origin}/payment/inicis/return`,
          closeUrl: `${window.location.origin}/payment/inicis/close`
        };

        // 폼 필드 생성
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
          if (form.parentNode) {
            document.body.removeChild(form);
          }
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
  private async loadInicisScript(): Promise<void> {
    return new Promise((resolve) => {
      // 이미 로드되어 있으면 바로 리턴
      if (document.getElementById('inicis-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'inicis-script';
      script.src = 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js';
      script.charset = 'UTF-8';
      script.onload = () => resolve();
      script.onerror = () => {
        console.warn('이니시스 스크립트 로드 실패, 폼 전송 방식을 사용합니다.');
        resolve();
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
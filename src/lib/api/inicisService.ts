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
  private readonly MID = 'dungjima14'; // 상점 아이디
  private readonly isProduction = process.env.NODE_ENV === 'production';
  
  /**
   * 이니시스 결제창 호출
   */
  async requestPayment(params: InicisPaymentParams) {
    try {
      // 결제 요청 데이터 생성
      const timestamp = Date.now();
      const orderId = `BT_${timestamp}_${params.orderId}`;
      
      // 백엔드에서 서명 생성 및 결제 준비
      const prepareResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/inicis/prepare/`, {
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
      
      // 이니시스 결제 폼 생성
      const form = document.createElement('form');
      form.method = 'POST';
      form.acceptCharset = 'UTF-8';
      
      // 결제 환경에 따른 URL 설정
      if (this.isProduction) {
        form.action = 'https://stdpay.inicis.com/stdpay/INIStdPayRequest.jsp';
      } else {
        form.action = 'https://stgstdpay.inicis.com/stdpay/INIStdPayRequest.jsp';
      }

      // 필수 파라미터 설정
      const payParams = {
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
        gopaymethod: 'Card:Directbank:VBank', // 신용카드, 계좌이체, 가상계좌
        acceptmethod: 'SKIN(YELLOW):HPP(1):below1000', // 노란색 스킨, 휴대폰결제, 1000원 이하 결제 허용
        returnUrl: params.returnUrl || `${window.location.origin}/api/payments/inicis/return`,
        closeUrl: params.closeUrl || `${window.location.origin}/api/payments/inicis/close`,
        popupUrl: `${window.location.origin}/api/payments/inicis/popup`,
      };

      // 폼에 파라미터 추가
      Object.entries(payParams).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      // 폼을 body에 추가하고 제출
      document.body.appendChild(form);
      form.submit();
      
      // 폼 제거
      setTimeout(() => {
        document.body.removeChild(form);
      }, 1000);

    } catch (error) {
      console.error('이니시스 결제 요청 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 결과 확인
   */
  async verifyPayment(orderId: string, authUrl: string, authToken: string, authResultCode: string) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/inicis/verify/`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/inicis/cancel/`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/inicis/vbank-confirm/`, {
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
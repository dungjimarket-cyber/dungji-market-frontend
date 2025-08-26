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
    // 이니시스 공식 샘플 기반 HTML 생성
    const testHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>KG이니시스 결제</title>
  <!-- 테스트 JS -->
  <script language="javascript" type="text/javascript" src="https://stgstdpay.inicis.com/stdjs/INIStdPay.js" charset="UTF-8"></script>
  <script type="text/javascript">
    function startPayment() {
      INIStdPay.pay('SendPayForm_id');
    }
  </script>
</head>
<body>
  <form name="" id="SendPayForm_id" method="post">
    <!-- 버전 -->
    <input type="hidden" name="version" value="1.0">
    
    <!-- 결제 수단 -->
    <input type="hidden" name="gopaymethod" value="Card:DirectBank:VBank:HPP">
    
    <!-- 상점 정보 -->
    <input type="hidden" name="mid" value="${this.MID}">
    <input type="hidden" name="oid" value="${orderId}">
    <input type="hidden" name="price" value="${params.amount}">
    <input type="hidden" name="timestamp" value="${prepareData.timestamp}">
    
    <!-- 인증 정보 -->
    <input type="hidden" name="use_chkfake" value="Y">
    <input type="hidden" name="signature" value="${prepareData.signature}">
    <input type="hidden" name="verification" value="${prepareData.verification}">
    <input type="hidden" name="mKey" value="${prepareData.mkey}">
    <input type="hidden" name="currency" value="WON">
    
    <!-- 상품 정보 -->
    <input type="hidden" name="goodname" value="${params.productName}">
    
    <!-- 구매자 정보 -->
    <input type="hidden" name="buyername" value="${params.buyerName}">
    <input type="hidden" name="buyertel" value="${params.buyerTel}">
    <input type="hidden" name="buyeremail" value="${params.buyerEmail}">
    
    <!-- 리턴 URL -->
    <input type="hidden" name="returnUrl" value="${window.location.origin}/api/payment/inicis/complete">
    <input type="hidden" name="closeUrl" value="${window.location.origin}/api/payment/inicis/close">
    
    <!-- 추가 옵션 -->
    <input type="hidden" name="acceptmethod" value="HPP(1):va_receipt:below1000:centerCd(Y)">
    <input type="hidden" name="charset" value="UTF-8">
    <input type="hidden" name="payViewType" value="overlay">
  </form>
  
  <div style="padding: 50px; text-align: center; font-family: sans-serif;">
    <h2>결제 준비 중...</h2>
    <p style="color: #666;">잠시만 기다려주세요.</p>
  </div>
  
  <script>
    // 페이지 로드 후 자동 결제 시작
    window.onload = function() {
      setTimeout(function() {
        if (typeof INIStdPay !== 'undefined') {
          console.log('이니시스 결제 시작');
          INIStdPay.pay('SendPayForm_id');
        } else {
          console.error('이니시스 스크립트 로드 실패');
          alert('결제 모듈 로드에 실패했습니다. 다시 시도해주세요.');
        }
      }, 1000);
    };
  </script>
</body>
</html>
    `;
    
    // 새 창 열기
    const payWindow = window.open('', 'inicis_payment', 'width=720,height=630,scrollbars=yes,resizable=yes');
    
    if (payWindow) {
      payWindow.document.write(testHtml);
      payWindow.document.close();
    } else {
      alert('팝업 차단을 해제해주세요. 결제창을 열 수 없습니다.');
    }
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
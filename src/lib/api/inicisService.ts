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
  private readonly MID = 'dungjima14'; // 실제 상점 아이디
  private readonly MOBILE_HASHKEY = 'D1EEF4CE7B4D9B1795BBFD255D35FE24'; // 모바일 hashkey
  
  /**
   * 모바일 디바이스 여부 확인
   */
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    // 모바일 디바이스 체크
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    // 화면 크기로 추가 체크
    const isMobileScreen = window.innerWidth <= 768;
    
    return mobileRegex.test(userAgent.toLowerCase()) || isMobileScreen;
  }
  
  /**
   * 이니시스 결제창 호출
   */
  async requestPayment(params: InicisPaymentParams) {
    try {
      // 결제 요청 데이터 생성
      const timestamp = Date.now();
      const orderId = `BT_${timestamp}_${params.orderId}`;
      
      // 모바일/PC 구분
      const isMobile = this.isMobileDevice();
      console.log('결제 환경:', isMobile ? '모바일' : 'PC');
      console.log('결제 파라미터:', { orderId, amount: params.amount, productName: params.productName });
      
      if (isMobile) {
        // 모바일 전용 결제 방식
        console.log('모바일 결제 진행');
        await this.submitMobilePaymentForm(orderId, params);
      } else {
        // PC 전용 결제 방식
        console.log('PC 결제 준비 요청 시작');
        
        const prepareData = {
          orderId,
          amount: params.amount,
          productName: params.productName,
          buyerName: params.buyerName,
          buyerTel: params.buyerTel,
          buyerEmail: params.buyerEmail,
        };
        
        console.log('백엔드 prepare 요청:', prepareData);
        
        const prepareResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/prepare/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
          },
          body: JSON.stringify(prepareData),
        });

        console.log('prepare 응답 상태:', prepareResponse.status);

        if (!prepareResponse.ok) {
          const errorText = await prepareResponse.text();
          console.error('prepare 실패:', errorText);
          throw new Error(`결제 준비에 실패했습니다: ${prepareResponse.status}`);
        }

        const prepareResponseData = await prepareResponse.json();
        console.log('prepare 응답 데이터:', prepareResponseData);
        
        console.log('PC 팝업 열기 시작');
        console.log('PC 팝업용 데이터:', prepareResponseData);
        this.submitPCPaymentForm(orderId, params, prepareResponseData);
      }

    } catch (error) {
      console.error('이니시스 결제 요청 실패:', error);
      throw error;
    }
  }
  
  /**
   * 모바일 전용 결제 폼 전송
   */
  private async submitMobilePaymentForm(orderId: string, params: InicisPaymentParams) {
    // 모바일 결제는 해시키 생성이 필요
    const mobileHash = await this.generateMobileHash(orderId, params.amount);
    
    // DOM에 직접 폼을 생성하고 제출
    const form = document.createElement('form');
    form.method = 'post';
    form.action = 'https://mobile.inicis.com/smart/payment/';
    form.acceptCharset = 'euc-kr';
    form.style.display = 'none';
    
    // 폼 필드 추가 함수
    const addField = (name: string, value: string) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    };
    
    // 모바일 결제 파라미터 설정
    addField('P_INI_PAYMENT', 'CARD'); // 결제수단 (CARD, VBANK, MOBILE 등)
    addField('P_MID', this.MID); // 상점 ID
    addField('P_OID', orderId); // 주문번호
    addField('P_AMT', String(params.amount)); // 금액
    addField('P_GOODS', params.productName); // 상품명
    addField('P_UNAME', params.buyerName); // 구매자명
    addField('P_MOBILE', params.buyerTel); // 구매자 전화번호
    addField('P_EMAIL', params.buyerEmail); // 구매자 이메일
    addField('P_NEXT_URL', `${window.location.origin}/api/payments/inicis/return/`); // 결과 리턴 URL
    addField('P_CHARSET', 'utf8'); // 인코딩
    addField('P_RESERVED', 'below1000=Y&vbank_receipt=Y&centerCd=Y'); // 추가 옵션
    addField('P_NOTI', orderId); // 가맹점 임의 데이터
    addField('P_HPP_METHOD', '1'); // 휴대폰 결제 허용
    addField('P_VBANK_DT', '7'); // 가상계좌 입금기한 (7일)
    if (mobileHash) {
      addField('P_HASH', mobileHash); // 모바일 해시키
    }
    
    // 폼을 body에 추가하고 제출
    document.body.appendChild(form);
    
    // 로딩 화면 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: sans-serif;
    `;
    loadingDiv.innerHTML = `
      <h2 style="margin-bottom: 10px;">결제 준비 중...</h2>
      <p style="color: #666;">잠시만 기다려주세요.</p>
      <p style="color: #999; font-size: 12px;">모바일 결제 페이지로 이동합니다.</p>
    `;
    document.body.appendChild(loadingDiv);
    
    // 약간의 딜레이 후 폼 제출
    setTimeout(() => {
      console.log('이니시스 모바일 결제 시작');
      form.submit();
    }, 100);
  }

  /**
   * PC 전용 결제 폼 (팝업)
   */
  private submitPCPaymentForm(orderId: string, params: InicisPaymentParams, prepareData: any) {
    console.log('submitPCPaymentForm 호출됨');
    console.log('orderId:', orderId);
    console.log('params:', params);
    console.log('prepareData:', prepareData);
    // 이니시스 공식 샘플 기반 HTML 생성
    const paymentHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Permissions-Policy" content="browsing-topics=()">
  <title>KG이니시스 결제</title>
  <!-- 운영 JS - 개선된 로딩 방식 -->
  <script type="text/javascript">
    // 이니시스 스크립트 동적 로드 (document.write 대신 사용)
    function loadInicisScript() {
      console.log('loadInicisScript 호출됨');
      return new Promise((resolve, reject) => {
        if (typeof INIStdPay !== 'undefined') {
          console.log('INIStdPay 이미 로드되어 있음');
          resolve(true);
          return;
        }
        
        console.log('INIStdPay 스크립트 로딩 시작');
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'UTF-8';
        script.src = 'https://stdpay.inicis.com/stdjs/INIStdPay.js';
        script.async = false; // 순서 보장
        
        script.onload = function() {
          console.log('이니시스 스크립트 로드 성공');
          console.log('INIStdPay 객체:', typeof INIStdPay);
          resolve(true);
        };
        
        script.onerror = function() {
          console.error('이니시스 스크립트 로드 실패');
          reject(new Error('이니시스 스크립트 로드 실패'));
        };
        
        console.log('스크립트 태그 추가');
        document.head.appendChild(script);
      });
    }
    
    function startPayment() {
      console.log('startPayment 호출됨');
      loadInicisScript().then(() => {
        console.log('스크립트 로드 완료, 결제 시작');
        if (typeof INIStdPay !== 'undefined') {
          console.log('INIStdPay.pay 호출 시작');
          INIStdPay.pay('SendPayForm_id');
          console.log('INIStdPay.pay 호출 완료');
        } else {
          console.error('INIStdPay가 정의되지 않음');
          throw new Error('INIStdPay not loaded');
        }
      }).catch((error) => {
        console.error('결제 시작 실패:', error);
        alert('결제 모듈 로드에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
      });
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
    <p style="color: #999; font-size: 12px;">PC 결제창을 준비하고 있습니다.</p>
  </div>
  
  <script>
    // 페이지 로드 후 자동 결제 시작 (개선된 방식)
    document.addEventListener('DOMContentLoaded', function() {
      console.log('결제 페이지 로드 완료, 이니시스 스크립트 로딩 시작');
      console.log('document.readyState:', document.readyState);
      
      // 약간의 딜레이 후 결제 시작
      setTimeout(function() {
        console.log('500ms 딜레이 후 결제 시작');
        startPayment();
      }, 500);
    });
    
    // fallback for older browsers
    window.onload = function() {
      console.log('window.onload 이벤트 발생');
      console.log('document.readyState:', document.readyState);
      if (document.readyState === 'complete') {
        console.log('fallback으로 결제 시작');
        setTimeout(startPayment, 500);
      }
    };
  </script>
</body>
</html>
    `;
    
    // PC용 팝업 창 열기
    console.log('팝업 창 열기 시도...');
    const payWindow = window.open('', 'inicis_payment', 'width=720,height=630,scrollbars=yes,resizable=yes');
    console.log('팝업 창 객체:', payWindow);
    
    if (payWindow) {
      console.log('팝업 창 열기 성공, HTML 작성 중...');
      payWindow.document.open();
      payWindow.document.write(paymentHtml);
      payWindow.document.close();
      console.log('팝업 창 HTML 작성 완료');
    } else {
      console.error('팝업 창 열기 실패 - 팝업 차단 또는 브라우저 제한');
      alert('팝업 차단을 해제해주세요. 결제창을 열 수 없습니다.');
    }
  }

  /**
   * 모바일 해시키 생성 (백엔드에서 처리)
   */
  private async generateMobileHash(orderId: string, amount: number): Promise<string | null> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/mobile-hash/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify({
          orderId,
          amount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.hash;
      }
      return null;
    } catch (error) {
      console.warn('모바일 해시키 생성 실패:', error);
      return null;
    }
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
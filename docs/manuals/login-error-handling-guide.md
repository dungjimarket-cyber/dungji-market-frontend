# 둥지마켓 로그인 에러 처리 기능 사용자 매뉴얼

## 📋 목차

1. [기능 개요](#1-기능-개요)
2. [에러 피드백 시스템](#2-에러-피드백-시스템)
3. [에러 코드 및 메시지](#3-에러-코드-및-메시지)
4. [개발자 가이드](#4-개발자-가이드)
5. [사용자 가이드](#5-사용자-가이드)
6. [문제 해결 가이드](#6-문제-해결-가이드)

## 1. 기능 개요

둥지마켓의 로그인 에러 처리 시스템은 사용자에게 로그인 과정에서 발생하는 문제점을 명확하게 전달하기 위해 설계되었습니다. 이 시스템은 다양한 유형의 로그인 오류에 대해 구체적인 메시지를 제공하여 사용자가 문제를 쉽게 해결할 수 있도록 돕습니다.

### 주요 특징

- **상세한 에러 메시지**: 각 에러 유형별 맞춤형 메시지 제공
- **시각적 피드백**: 에러 발생 시 관련 입력 필드 강조 표시
- **안내 메시지 박스**: 알림 아이콘과 함께 에러 내용 표시
- **자동 에러 초기화**: 사용자가 입력 내용을 수정하면 에러 메시지 자동 제거

## 2. 에러 피드백 시스템

둥지마켓 로그인 페이지는 다음 세 가지 방식으로 에러 피드백을 제공합니다:

1. **입력 필드 강조**: 문제가 있는 입력 필드를 빨간색 테두리로 강조
2. **인라인 에러 메시지**: 입력 폼 내부에 에러 메시지 박스 표시
3. **토스트 알림**: 화면 상단에 나타나는 팝업 알림

![로그인 에러 피드백 예시](https://via.placeholder.com/600x300?text=Login+Error+Feedback+Example)

## 3. 에러 코드 및 메시지

로그인 과정에서 발생할 수 있는 주요 에러 코드와 해당 메시지는 다음과 같습니다:

| 에러 코드 | 메시지 | 발생 원인 |
|---------|-------|----------|
| `invalid_email` | 유효한 이메일 주소를 입력해주세요. | 이메일 형식이 잘못됨 |
| `invalid_password` | 비밀번호는 6자 이상이어야 합니다. | 비밀번호가 너무 짧음 |
| `invalid_credentials` | 이메일 또는 비밀번호가 일치하지 않습니다. | 로그인 정보가 일치하지 않음 |
| `service_unavailable` | 로그인 서비스를 찾을 수 없습니다. 관리자에게 문의하세요. | API 엔드포인트 접근 불가 |
| `too_many_requests` | 너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요. | 로그인 시도 횟수 초과 |
| `server_error` | 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요. | 백엔드 서버 오류 |
| `network_error` | 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요. | 인터넷 연결 문제 |

## 4. 개발자 가이드

### 로그인 에러 처리 구현 방법

#### 1. 에러 상태 관리

```tsx
// 컴포넌트에 에러 상태 추가
const [errorMessage, setErrorMessage] = useState('');
const [errorCode, setErrorCode] = useState('');

// 에러 초기화 함수
const clearError = () => {
  setErrorMessage('');
  setErrorCode('');
};

// 입력 필드 변경 시 에러 초기화
useEffect(() => {
  clearError();
}, [email, password]);
```

#### 2. 로그인 결과 타입 정의

```tsx
// AuthContext.tsx에 로그인 결과 타입 정의
type LoginResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
  errorMessage?: string;
};

type AuthContextType = {
  // ...기존 속성들
  login: (email: string, password: string) => Promise<LoginResult>;
  // ...기타 메서드들
};
```

#### 3. 백엔드 에러 처리 구현

```tsx
// 로그인 함수에서 에러 처리
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  
  // HTTP 상태 코드에 따른 에러 메시지
  let errorMessage = '로그인에 실패했습니다.';
  let errorCode = 'unknown';
  
  if (response.status === 401) {
    errorMessage = '이메일 또는 비밀번호가 일치하지 않습니다.';
    errorCode = 'invalid_credentials';
  } else if (response.status === 404) {
    // ...다른 상태 코드별 처리
  }
  
  // 백엔드에서 반환한 에러 메시지가 있는 경우 사용
  if (errorData.detail) {
    errorMessage = errorData.detail;
  }
  
  return {
    success: false,
    error: `로그인 실패 (${response.status})`,
    errorCode,
    errorMessage
  };
}
```

#### 4. 에러 표시 컴포넌트

```tsx
{/* 에러 메시지 표시 */}
{errorMessage && (
  <div className="bg-red-50 border-l-4 border-red-500 p-4">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-red-500" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-700">{errorMessage}</p>
      </div>
    </div>
  </div>
)}
```

### 새로운 에러 타입 추가 방법

1. `AuthContext.tsx`의 에러 처리 로직에 새 에러 코드와 메시지 추가
2. 필요한 경우 백엔드 API 응답에 새 에러 타입 추가
3. 로그인 페이지에서 새 에러 코드에 대한 처리 로직 구현

## 5. 사용자 가이드

### 로그인 문제 해결 방법

| 에러 메시지 | 해결 방법 |
|----------|----------|
| 유효한 이메일 주소를 입력해주세요. | 이메일 주소에 '@'가 포함되어 있는지 확인하세요. |
| 비밀번호는 6자 이상이어야 합니다. | 비밀번호를 6자 이상 입력하세요. |
| 이메일 또는 비밀번호가 일치하지 않습니다. | 이메일과 비밀번호를 다시 확인하세요. 대소문자를 구분합니다. |
| 로그인 서비스를 찾을 수 없습니다. | 잠시 후 다시 시도하거나 관리자에게 문의하세요. |
| 너무 많은 요청이 발생했습니다. | 몇 분 후에 다시 로그인을 시도하세요. |
| 서버 오류가 발생했습니다. | 잠시 후 다시 시도하세요. 문제가 지속되면 관리자에게 문의하세요. |
| 네트워크 오류가 발생했습니다. | 인터넷 연결을 확인하고 다시 시도하세요. |

## 6. 문제 해결 가이드

### 로그인 문제 해결 단계

1. **계정 정보 확인**
   - 올바른 이메일 주소를 사용하고 있는지 확인
   - 비밀번호 대소문자 확인

2. **브라우저 관련 문제**
   - 브라우저 캐시 및 쿠키 삭제 시도
   - 다른 브라우저로 로그인 시도

3. **네트워크 문제**
   - 인터넷 연결 상태 확인
   - VPN을 사용 중인 경우 비활성화 후 시도

4. **계정 잠금 확인**
   - 여러 번 로그인 실패 시 계정이 일시적으로 잠길 수 있음
   - 비밀번호 재설정 시도

5. **관리자 문의**
   - 지속적인 문제 발생 시 관리자에게 다음 정보와 함께 문의:
     - 발생한 에러 메시지
     - 사용 중인 브라우저 및 버전
     - 로그인 시도 시간

---

이 문서는 2025년 5월 26일에 마지막으로 업데이트되었습니다.

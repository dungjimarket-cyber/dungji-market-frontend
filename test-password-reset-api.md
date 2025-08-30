# 비밀번호 재설정 API 테스트 가이드

## 현재 상황
- 프론트엔드에서 500 에러 → "비밀번호 변경 중 오류가 발생했습니다" 메시지
- 백엔드 status='pending' 상태 필요
- 인증코드 검증 실패 가능성

## 브라우저 콘솔에서 확인할 사항

### 1. 사용자 확인 단계
```
사용자 확인 요청: {username: "...", phone_number: "..."}
사용자 확인 응답 상태: 200
User ID 저장: 123 타입: number
```

### 2. 인증번호 입력 단계
```
인증코드 입력 완료: 123456
verify API 호출하지 않음 (status=pending 유지)
```

### 3. 비밀번호 재설정 단계
```
========== 비밀번호 재설정 API 호출 ==========
Request Body: {
  "user_id": 123,        // 숫자 타입
  "phone_number": "010-1234-5678",
  "verification_code": "123456",
  "new_password": "...",
  "purpose": "reset"
}
```

## 수동 API 테스트 (PowerShell)

```powershell
# 1. 사용자 확인
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    username = "testuser"
    phone_number = "010-1234-5678"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.dungjimarket.com/api/auth/verify-user-phone/" `
    -Method POST -Headers $headers -Body $body

# 2. 인증번호 발송
$body = @{
    phone_number = "010-1234-5678"
    purpose = "password_reset"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.dungjimarket.com/api/phone/send-verification/" `
    -Method POST -Headers $headers -Body $body

# 3. 비밀번호 재설정 (verify 호출 없이)
$body = @{
    user_id = 123  # 숫자 타입
    phone_number = "010-1234-5678"
    verification_code = "123456"
    new_password = "newPassword123"
    purpose = "reset"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.dungjimarket.com/api/auth/reset-password-phone/" `
    -Method POST -Headers $headers -Body $body
```

## 백엔드 로그에서 확인할 내용

1. **인증 상태 확인**
   - "존재하는 인증: code=..., status=pending" (정상)
   - "존재하는 인증: code=..., status=verified" (문제 - 이미 verify됨)

2. **인증 실패 원인**
   - "인증 실패: phone=..." 
   - "전화번호 불일치:"
   - "인증 코드 불일치:"
   - "인증 만료:"

3. **user_id 타입 확인**
   - user_id가 숫자인지 문자열인지

## 체크리스트

- [ ] user_id가 숫자 타입으로 전송되는가?
- [ ] 인증코드 6자리가 정확히 전송되는가?
- [ ] /api/phone/verify/를 호출하지 않고 있는가?
- [ ] 인증 상태가 pending인가?
- [ ] 30분 이내 인증인가?
- [ ] 전화번호 형식이 일치하는가?

## 문제 해결

### 1. user_id가 null인 경우
- `/auth/verify-user-phone/` 응답에서 user_id 반환 확인
- 백엔드에서 user_id 필드 추가 필요

### 2. 인증코드가 빈 문자열인 경우
- phoneVerificationCode 상태 확인
- 인증번호 입력 UI 확인

### 3. status가 verified인 경우
- verify API 호출 제거 확인
- 백엔드에서 pending 상태 인증만 찾도록 수정

### 4. 인증 만료
- 30분 타이머 확인
- 재발송 기능 사용
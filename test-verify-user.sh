#!/bin/bash

# 백엔드 API 테스트 스크립트
# 사용자 확인 API (/auth/verify-user-phone/) 테스트

# API URL 설정 (환경에 맞게 수정)
API_URL="http://localhost:8000/api"

# 테스트 데이터 (실제 데이터로 변경 필요)
USERNAME="testuser"
PHONE_NUMBER="01012345678"

echo "========================================="
echo "사용자 확인 API 테스트"
echo "========================================="
echo "API URL: $API_URL/auth/verify-user-phone/"
echo "Username: $USERNAME"
echo "Phone: $PHONE_NUMBER"
echo "========================================="

# API 호출
echo "요청 전송 중..."
curl -X POST "$API_URL/auth/verify-user-phone/" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"phone_number\": \"$PHONE_NUMBER\"}" \
  -v

echo ""
echo "========================================="
echo "테스트 완료"
echo "========================================="

# Windows PowerShell 버전
echo ""
echo "Windows PowerShell에서 실행하려면:"
echo "----------------------------------------"
cat << 'EOF'
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    username = "testuser"
    phone_number = "01012345678"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/verify-user-phone/" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -UseBasicParsing

Write-Host "Status Code:" $response.StatusCode
Write-Host "Response:" $response.Content
EOF
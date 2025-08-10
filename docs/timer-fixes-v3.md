# 타이머 수정사항 (v3.0)

## 수정 완료 사항

### 1. 중복 타이머 제거 ✅
- **문제**: 구매자/판매자 최종선택 타이머가 상단과 공구 상태 정보 섹션에 중복 표시
- **해결**: 상단 타이머 제거, 공구 상태 정보 섹션에 통합

### 2. 상태별 동적 타이머 구현 ✅
- **위치**: 공구 상태 정보 섹션의 "남은 시간" 영역
- **구현된 상태별 타이머**:
  - `recruiting`: 공구 마감까지 (기존 타이머)
  - `final_selection_buyers`: 구매자 최종선택 마감까지 (12시간)
  - `final_selection_seller`: 판매자 최종선택 마감까지 (6시간)
  - `in_progress/completed/cancelled`: 거래 상태 텍스트 표시

### 3. 판매자 최종선택 타이머 시작점 수정 ✅
- **문제**: 6시간 타이머가 50%부터 시작 (12시간 기준으로 계산)
- **해결**: `maxHours` prop 추가하여 동적 계산
  - 구매자: 12시간 기준
  - 판매자: 6시간 기준

### 4. SimpleFinalSelectionTimer 컴포넌트 개선 ✅
```tsx
interface SimpleFinalSelectionTimerProps {
  endTime?: string;
  onTimeEnd?: () => void;
  maxHours?: number; // 최대 시간 (기본값: 12시간)
  label?: string; // 타이머 레이블
}
```

## 타이머 표시 로직

### 공구 상태 정보 섹션
```
recruiting → 공구 마감까지 (start_time ~ end_time)
final_selection_buyers → 구매자 최종선택 마감까지 (12시간)
final_selection_seller → 판매자 최종선택 마감까지 (6시간)
in_progress/completed/cancelled → 거래 상태 텍스트
```

### Progress Bar 계산
- recruiting: `(remaining / (end - start)) * 100`
- final_selection_buyers: `(remaining / (12 * 60 * 60 * 1000)) * 100`
- final_selection_seller: `(remaining / (6 * 60 * 60 * 1000)) * 100`

## 입찰 정보 히든 처리 ✅
- 판매자용 "입찰 정보" 섹션 주석 처리
- "아직 입찰하지 않았습니다" 메시지 제거

## 테스트 체크리스트
- [x] recruiting 상태 타이머 정상 표시
- [x] final_selection_buyers 타이머 12시간 기준 계산
- [x] final_selection_seller 타이머 6시간 기준 계산
- [x] 타이머 중복 표시 없음
- [x] Progress bar 100%에서 시작
- [x] 빌드 에러 없음
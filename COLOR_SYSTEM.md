# 둥지마켓 색상 시스템 가이드

## 🎨 메인 색상 팔레트

### 1. Primary Color - Green (메인톤)
- **기본**: `#27AE60` (dungji-primary)
- **밝은**: `#2ECC71` (dungji-primary-light)
- **더 밝은**: `#52E584` (dungji-primary-lighter)
- **어두운**: `#229954` (dungji-primary-dark)
- **더 어두운**: `#1E7E34` (dungji-primary-darker)

### 2. Secondary Color - Sky Blue (서브톤)
- **기본**: `#3B82F6` (dungji-secondary)
- **밝은**: `#60A5FA` (dungji-secondary-light)
- **더 밝은**: `#93BBFD` (dungji-secondary-lighter)
- **어두운**: `#2563EB` (dungji-secondary-dark)
- **더 어두운**: `#1D4ED8` (dungji-secondary-darker)

### 3. Base Color - Cream White (베이스톤)
- **기본**: `#FDF9F0` (dungji-cream)
- **밝은**: `#FFFEF9` (dungji-cream-light)
- **어두운**: `#FAF4E8` (dungji-cream-dark)
- **더 어두운**: `#F5EDD8` (dungji-cream-darker)

### 4. Danger Color - Red (경고/위험)
- **기본**: `#DC3545` (dungji-danger)
- **밝은**: `#E74C5C` (dungji-danger-light)
- **더 밝은**: `#F08080` (dungji-danger-lighter)
- **어두운**: `#C82333` (dungji-danger-dark)
- **더 어두운**: `#A71D2A` (dungji-danger-darker)

## 🔘 버튼 스타일 가이드

### Primary Buttons (주요 액션)
```jsx
<Button variant="default">구매하기</Button>  // 그린 배경
<Button variant="secondary">정보 보기</Button>  // 블루 배경
<Button variant="gradient">특별 제안</Button>  // 그린-블루 그라디언트
```

### Outline Buttons (보조 액션)
```jsx
<Button variant="outline">취소</Button>  // 그린 테두리
<Button variant="outline-secondary">옵션</Button>  // 블루 테두리
<Button variant="outline-soft">필터</Button>  // 연한 테두리
```

### Soft Buttons (부드러운 액션)
```jsx
<Button variant="soft">수정</Button>  // 크림 배경 + 그린 텍스트
<Button variant="ghost">더보기</Button>  // 호버시만 배경
```

### Danger Buttons (경고/삭제 액션)
```jsx
<Button variant="danger">삭제</Button>  // 빨간 배경
<Button variant="destructive">제거</Button>  // 빨간 배경 (별칭)
<Button variant="outline-danger">취소</Button>  // 빨간 테두리
<Button variant="soft-danger">경고</Button>  // 연한 빨간 배경
```

## 🏷️ 배지 스타일 가이드

### Status Badges (상태 표시)
```jsx
<Badge variant="default">활성</Badge>  // 그린 배경
<Badge variant="success">완료</Badge>  // 그린 배경
<Badge variant="warning">대기중</Badge>  // 황색 배경
<Badge variant="info">정보</Badge>  // 블루 배경
<Badge variant="danger">오류</Badge>  // 빨간 배경
<Badge variant="destructive">삭제됨</Badge>  // 빨간 배경 (별칭)
```

### Soft Badges (부드러운 표시)
```jsx
<Badge variant="soft">태그</Badge>  // 연한 그린 배경
<Badge variant="soft-secondary">카테고리</Badge>  // 연한 블루 배경
<Badge variant="cream">할인</Badge>  // 크림 배경
<Badge variant="soft-danger">주의</Badge>  // 연한 빨간 배경
```

### Outline Badges (테두리형)
```jsx
<Badge variant="outline">기본</Badge>  // 그린 테두리
<Badge variant="outline-danger">경고</Badge>  // 빨간 테두리
```

## 📱 페이지별 색상 적용

### 1. 공동구매 페이지
- **메인 CTA**: 그린 버튼 (참여하기, 구매하기)
- **정보 표시**: 블루 배지/버튼
- **배경**: 크림 화이트

### 2. 중고거래 페이지
- **판매 액션**: 그린 버튼 (판매하기, 등록하기)
- **구매 액션**: 블루 버튼 (제안하기, 문의하기)
- **상태 표시**: 그린(판매중), 황색(예약중), 연한그린(완료)

### 3. 마이페이지
- **탭 활성**: 그린 하이라이트
- **통계**: 그린/블루 차트
- **버튼**: Soft 스타일 위주

## 🎯 사용 원칙

### DO ✅
1. **주요 CTA는 항상 그린** - 사용자의 주 행동 유도
2. **정보성 요소는 블루** - 부가 정보, 링크 등
3. **배경은 크림 화이트** - 편안한 시각적 경험
4. **상태는 의미에 맞게** - 성공(그린), 경고(황색), 오류(빨강)

### DON'T ❌
1. 한 화면에 너무 많은 색상 혼용
2. 텍스트에 너무 밝은 색상 사용
3. 대비가 낮은 색상 조합
4. 의미 없는 색상 사용

## 🔧 Tailwind 클래스 참조

### 텍스트 색상
```css
text-dungji-primary       /* 그린 텍스트 */
text-dungji-secondary     /* 블루 텍스트 */
text-dungji-cream         /* 크림 텍스트 */
text-dungji-danger        /* 빨간 텍스트 */
```

### 배경 색상
```css
bg-dungji-primary         /* 그린 배경 */
bg-dungji-secondary       /* 블루 배경 */
bg-dungji-cream           /* 크림 배경 */
bg-dungji-danger          /* 빨간 배경 */
```

### 테두리 색상
```css
border-dungji-primary     /* 그린 테두리 */
border-dungji-secondary   /* 블루 테두리 */
border-dungji-cream       /* 크림 테두리 */
border-dungji-danger      /* 빨간 테두리 */
```

### 그라디언트
```css
bg-gradient-to-r from-dungji-primary to-dungji-secondary  /* 그린→블루 */
bg-gradient-to-r from-dungji-primary to-dungji-primary-light  /* 그린 톤 */
bg-gradient-to-r from-dungji-danger to-dungji-danger-dark  /* 빨간 톤 */
```

## 📊 접근성 고려사항

1. **WCAG AA 기준 충족**
   - 텍스트 대비율 4.5:1 이상
   - 큰 텍스트 대비율 3:1 이상

2. **색맹 사용자 고려**
   - 색상만으로 정보 구분 X
   - 아이콘, 텍스트 병행 사용

3. **다크모드 지원** (향후)
   - 각 색상의 다크 버전 정의
   - 자동 전환 지원

## 🔄 마이그레이션 가이드

### 기존 Purple (#845ec2) → Green (#27AE60)
```jsx
// Before
<Button className="bg-purple-600">버튼</Button>
<div className="text-purple-700">텍스트</div>

// After
<Button variant="default">버튼</Button>
<div className="text-dungji-primary">텍스트</div>
```

### 기존 Blue (#3B82F6) → 유지 (Secondary)
```jsx
// Before & After (동일)
<Button variant="secondary">버튼</Button>
<Badge variant="info">정보</Badge>
```

---

이 색상 시스템은 모든 페이지에 일관되게 적용되어야 하며, 
새로운 기능 개발 시에도 반드시 참조해야 합니다.
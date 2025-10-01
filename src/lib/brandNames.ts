/**
 * 브랜드명 영어 → 한글 매핑
 */

export const BRAND_NAMES: Record<string, string> = {
  // 휴대폰 브랜드
  'apple': '애플',
  'samsung': '삼성',
  'lg': 'LG',
  'google': '구글',
  'xiaomi': '샤오미',
  'oppo': '오포',
  'vivo': '비보',
  'huawei': '화웨이',
  'oneplus': '원플러스',
  'motorola': '모토로라',
  'nokia': '노키아',
  'sony': '소니',
  'asus': '에이수스',

  // 전자제품 브랜드
  'dell': '델',
  'hp': 'HP',
  'lenovo': '레노버',
  'acer': '에이서',
  'msi': 'MSI',
  'razer': '레이저',
  'alienware': '에일리언웨어',
  'microsoft': '마이크로소프트',
  'surface': '서피스',
  'macbook': '맥북',
  'thinkpad': '씽크패드',
  'gram': '그램',
  'galaxy': '갤럭시',
  'ipad': '아이패드',
};

/**
 * 브랜드명을 한글로 변환
 * @param brand 영어 브랜드명
 * @returns 한글 브랜드명 (매핑이 없으면 원본 반환)
 */
export function getBrandNameKo(brand: string | undefined | null): string {
  if (!brand) return '';
  const normalized = brand.toLowerCase().trim();
  return BRAND_NAMES[normalized] || brand;
}

/**
 * 영어-한글 키워드 매핑 유틸리티
 * 검색 시 영어와 한글을 상호 호환하여 검색할 수 있도록 지원
 */

// 브랜드 및 제품명 매핑
const brandMapping: Record<string, string[]> = {
  // Apple 제품
  '아이폰': ['iphone', 'iPhone', '아이폰'],
  'iphone': ['아이폰', 'iPhone', 'iphone'],
  '아이패드': ['ipad', 'iPad', '아이패드'],
  'ipad': ['아이패드', 'iPad', 'ipad'],
  '애플워치': ['apple watch', 'applewatch', '애플워치'],
  'applewatch': ['애플워치', 'apple watch', 'applewatch'],
  '에어팟': ['airpods', 'AirPods', '에어팟'],
  'airpods': ['에어팟', 'AirPods', 'airpods'],
  '맥북': ['macbook', 'MacBook', '맥북'],
  'macbook': ['맥북', 'MacBook', 'macbook'],
  
  // Samsung 제품
  '갤럭시': ['galaxy', 'Galaxy', '갤럭시'],
  'galaxy': ['갤럭시', 'Galaxy', 'galaxy'],
  '갤럭시s': ['galaxy s', 'galaxys', '갤럭시s', '갤럭시에스'],
  'galaxys': ['갤럭시s', '갤럭시에스', 'galaxy s', 'galaxys'],
  '갤럭시노트': ['galaxy note', 'galaxynote', '갤럭시노트'],
  'galaxynote': ['갤럭시노트', 'galaxy note', 'galaxynote'],
  '갤럭시탭': ['galaxy tab', 'galaxytab', '갤럭시탭'],
  'galaxytab': ['갤럭시탭', 'galaxy tab', 'galaxytab'],
  '갤럭시워치': ['galaxy watch', 'galaxywatch', '갤럭시워치'],
  'galaxywatch': ['갤럭시워치', 'galaxy watch', 'galaxywatch'],
  '갤럭시버즈': ['galaxy buds', 'galaxybuds', '갤럭시버즈'],
  'galaxybuds': ['갤럭시버즈', 'galaxy buds', 'galaxybuds'],
  
  // 통신사
  'skt': ['에스케이티', 'SKT', 'sk텔레콤', 'SK텔레콤'],
  '에스케이티': ['SKT', 'skt', 'SK텔레콤', 'sk텔레콤'],
  'kt': ['케이티', 'KT', 'kt'],
  '케이티': ['KT', 'kt', '케이티'],
  'lg': ['엘지', 'LG', 'lg유플러스', 'LG유플러스'],
  '엘지': ['LG', 'lg', 'LG유플러스', 'lg유플러스'],
  '유플러스': ['uplus', 'u+', 'U+', '유플러스'],
  'uplus': ['유플러스', 'u+', 'U+', 'uplus'],
  
  // 인터넷/TV 서비스
  '기가인터넷': ['giga internet', 'gigainternet', '기가인터넷'],
  'gigainternet': ['기가인터넷', 'giga internet', 'gigainternet'],
  '아이피티비': ['iptv', 'IPTV', '아이피티비'],
  'iptv': ['아이피티비', 'IPTV', 'iptv'],
  '케이블티비': ['cable tv', 'cabletv', '케이블티비', '케이블TV'],
  'cabletv': ['케이블티비', '케이블TV', 'cable tv', 'cabletv'],
  
  // 기타 전자제품
  '노트북': ['notebook', 'laptop', '노트북', '랩탑'],
  'notebook': ['노트북', 'notebook', 'laptop'],
  'laptop': ['노트북', '랩탑', 'laptop', 'notebook'],
  '태블릿': ['tablet', '태블릿', '타블렛'],
  'tablet': ['태블릿', '타블렛', 'tablet'],
  '스마트폰': ['smartphone', '스마트폰'],
  'smartphone': ['스마트폰', 'smartphone'],
  '이어폰': ['earphone', 'earphones', '이어폰'],
  'earphone': ['이어폰', 'earphone', 'earphones'],
  '헤드폰': ['headphone', 'headphones', '헤드폰'],
  'headphone': ['헤드폰', 'headphone', 'headphones'],
  '스마트워치': ['smartwatch', 'smart watch', '스마트워치'],
  'smartwatch': ['스마트워치', 'smart watch', 'smartwatch'],
};

// 일반 키워드 매핑
const generalMapping: Record<string, string[]> = {
  '휴대폰': ['phone', 'mobile', '휴대폰', '핸드폰'],
  'phone': ['휴대폰', '핸드폰', 'phone', 'mobile'],
  '인터넷': ['internet', '인터넷'],
  'internet': ['인터넷', 'internet'],
  '티비': ['tv', 'TV', '티비', '텔레비전'],
  'tv': ['티비', '텔레비전', 'TV', 'tv'],
  '와이파이': ['wifi', 'wi-fi', 'WiFi', '와이파이'],
  'wifi': ['와이파이', 'wifi', 'wi-fi', 'WiFi'],
  '5지': ['5g', '5G', '5지'],
  '5g': ['5지', '5G', '5g'],
  '4지': ['4g', '4G', '4지', 'lte', 'LTE'],
  '4g': ['4지', '4G', '4g', 'lte', 'LTE'],
  'lte': ['4지', '4G', '4g', 'lte', 'LTE'],
  '무제한': ['unlimited', '무제한'],
  'unlimited': ['무제한', 'unlimited'],
  '요금제': ['plan', '요금제', '플랜'],
  'plan': ['요금제', '플랜', 'plan'],
  '할인': ['discount', 'sale', '할인', '세일'],
  'discount': ['할인', 'discount', 'sale'],
  'sale': ['할인', '세일', 'sale', 'discount'],
};

/**
 * 검색어를 확장하여 영어/한글 변형을 포함한 배열 반환
 * @param query 원본 검색어
 * @returns 확장된 검색어 배열
 */
export function expandSearchQuery(query: string): string[] {
  if (!query || query.trim() === '') return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  const results = new Set<string>([query]); // 원본 쿼리 포함
  
  // 전체 매핑 통합
  const allMappings = { ...brandMapping, ...generalMapping };
  
  // 정확한 매칭 확인 (완전히 일치하는 경우만)
  if (allMappings[normalizedQuery]) {
    allMappings[normalizedQuery].forEach(variant => results.add(variant));
    return Array.from(results); // 정확한 매칭이 있으면 바로 반환
  }
  
  // 단어 경계를 고려한 부분 매칭
  // 최소 3글자 이상인 경우만 부분 매칭 적용
  if (normalizedQuery.length >= 3) {
    Object.entries(allMappings).forEach(([key, variants]) => {
      // 완전한 단어로 시작하는 경우만 매칭 (예: "아이폰" 검색시 "아이폰" 포함 제품만)
      const keyLower = key.toLowerCase();
      if (keyLower.startsWith(normalizedQuery) || normalizedQuery.startsWith(keyLower)) {
        // 검색어가 키의 시작 부분이거나, 키가 검색어의 시작 부분인 경우
        if (Math.abs(keyLower.length - normalizedQuery.length) <= 2) { // 길이 차이가 2글자 이내
          variants.forEach(variant => results.add(variant));
        }
      }
    });
  }
  
  // 공백 제거 버전도 추가 (예: "galaxy s" -> "galaxys")
  const noSpaceQuery = normalizedQuery.replace(/\s+/g, '');
  if (noSpaceQuery !== normalizedQuery && allMappings[noSpaceQuery]) {
    allMappings[noSpaceQuery].forEach(variant => results.add(variant));
  }
  
  // 띄어쓰기 추가 버전도 확인 (예: "galaxys" -> "galaxy s")
  // 일반적인 패턴 확인 (영문자+숫자)
  const spacedQuery = normalizedQuery.replace(/([a-z])(\d)/gi, '$1 $2');
  if (spacedQuery !== normalizedQuery && allMappings[spacedQuery]) {
    allMappings[spacedQuery].forEach(variant => results.add(variant));
  }
  
  // 결과가 너무 많으면 제한 (최대 5개)
  const resultArray = Array.from(results);
  if (resultArray.length > 5) {
    return resultArray.slice(0, 5);
  }
  
  return resultArray;
}

/**
 * 여러 검색어를 OR 조건으로 결합하여 검색 쿼리 생성
 * @param queries 검색어 배열
 * @returns 결합된 검색 쿼리 문자열
 */
export function combineSearchQueries(queries: string[]): string {
  // 중복 제거 및 빈 문자열 필터링
  const uniqueQueries = Array.from(new Set(queries.filter(q => q && q.trim())));
  
  // 백엔드에서 OR 검색을 지원한다면 파이프(|) 또는 쉼표로 구분
  // 또는 각 쿼리를 따로 검색하고 프론트에서 결과를 병합
  return uniqueQueries.join(',');
}

/**
 * 지역명 정규화 및 매핑
 * 다양한 형태의 지역명을 표준 형태로 변환
 */
export const regionMapping: Record<string, string> = {
  // 서울
  '서울': '서울특별시',
  '서울시': '서울특별시',
  'seoul': '서울특별시',
  
  // 부산
  '부산': '부산광역시',
  '부산시': '부산광역시',
  'busan': '부산광역시',
  
  // 대구
  '대구': '대구광역시',
  '대구시': '대구광역시',
  'daegu': '대구광역시',
  
  // 인천
  '인천': '인천광역시',
  '인천시': '인천광역시',
  'incheon': '인천광역시',
  
  // 광주
  '광주': '광주광역시',
  '광주시': '광주광역시',
  'gwangju': '광주광역시',
  
  // 대전
  '대전': '대전광역시',
  '대전시': '대전광역시',
  'daejeon': '대전광역시',
  
  // 울산
  '울산': '울산광역시',
  '울산시': '울산광역시',
  'ulsan': '울산광역시',
  
  // 세종
  '세종': '세종특별자치시',
  '세종시': '세종특별자치시',
  'sejong': '세종특별자치시',
  
  // 경기
  '경기': '경기도',
  'gyeonggi': '경기도',
  
  // 강원
  '강원': '강원도',
  'gangwon': '강원도',
  
  // 충북
  '충북': '충청북도',
  '충청북도': '충청북도',
  'chungbuk': '충청북도',
  
  // 충남
  '충남': '충청남도',
  '충청남도': '충청남도',
  'chungnam': '충청남도',
  
  // 전북
  '전북': '전라북도',
  '전라북도': '전라북도',
  'jeonbuk': '전라북도',
  
  // 전남
  '전남': '전라남도',
  '전라남도': '전라남도',
  'jeonnam': '전라남도',
  
  // 경북
  '경북': '경상북도',
  '경상북도': '경상북도',
  'gyeongbuk': '경상북도',
  
  // 경남
  '경남': '경상남도',
  '경상남도': '경상남도',
  'gyeongnam': '경상남도',
  
  // 제주
  '제주': '제주특별자치도',
  '제주도': '제주특별자치도',
  'jeju': '제주특별자치도',
};

/**
 * 지역명을 표준 형태로 정규화
 * @param region 입력된 지역명
 * @returns 정규화된 지역명
 */
export function normalizeRegion(region: string): string {
  if (!region) return '';
  
  const normalized = region.toLowerCase().trim();
  return regionMapping[normalized] || region;
}

/**
 * 지역 검색어를 확장하여 관련 지역을 포함
 * 시/군/구 입력 시 해당 시/도도 포함하여 검색
 * @param region 지역 검색어
 * @returns 확장된 지역 검색어 배열
 */
export function expandRegionSearch(region: string): string[] {
  if (!region || region.trim() === '') return [];
  
  const results = new Set<string>();
  const normalizedInput = region.toLowerCase().trim();
  
  // 원본 추가
  results.add(region);
  
  // 정규화된 버전 추가
  const normalized = normalizeRegion(region);
  if (normalized !== region) {
    results.add(normalized);
  }
  
  // 시/도별 하위 지역 매핑 (regions.ts와 동일한 데이터)
  const cityRegions: Record<string, string[]> = {
    '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
    '부산광역시': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
    '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구', '군위군'],
    '인천광역시': ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'],
    '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
    '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
    '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
    '세종특별자치시': ['세종시'],
    '경기도': ['수원시', '성남시', '용인시', '부천시', '안산시', '안양시', '고양시', '남양주시', '화성시', '평택시', '의정부시', '파주시', '시흥시', '김포시', '광명시', '광주시', '군포시', '이천시', '양주시', '오산시', '구리시', '안성시', '포천시', '의왕시', '하남시', '여주시', '동두천시', '과천시', '양평군', '가평군', '연천군'],
    '강원도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
    '충청북도': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
    '충청남도': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
    '전라북도': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
    '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
    '경상북도': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
    '경상남도': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
    '제주특별자치도': ['제주시', '서귀포시']
  };
  
  // 입력이 "시/도 시/군/구" 형식인 경우 처리
  if (region.includes(' ')) {
    const parts = region.split(' ');
    const province = parts[0];
    const city = parts.slice(1).join(' ');
    
    results.add(province);
    results.add(city);
    
    // 해당 시/도의 정식 명칭 추가
    const normalizedProvince = normalizeRegion(province);
    if (normalizedProvince !== province) {
      results.add(normalizedProvince);
    }
    
    // "서울특별시 강남구" 형식도 추가
    results.add(`${normalizedProvince} ${city}`);
  } 
  // 시/도만 입력된 경우 - 모든 하위 지역 추가
  else {
    // 정규화된 시/도 이름 확인
    const normalizedProvince = normalizeRegion(region);
    
    // 해당 시/도의 모든 하위 지역 추가
    if (cityRegions[normalizedProvince]) {
      results.add(normalizedProvince);
      // 모든 하위 시/군/구 추가
      cityRegions[normalizedProvince].forEach(city => {
        results.add(city);
        results.add(`${normalizedProvince} ${city}`); // "서울특별시 강남구" 형식도 추가
      });
    }
    // 시/군/구만 입력된 경우 - 해당 시/도 찾기
    else {
      for (const [province, cities] of Object.entries(cityRegions)) {
        if (cities.some(city => city === region || city.includes(region))) {
          results.add(province);
          // 매칭되는 시/군/구 추가
          cities.forEach(city => {
            if (city === region || city.includes(region)) {
              results.add(city);
              results.add(`${province} ${city}`);
            }
          });
        }
      }
    }
  }
  
  return Array.from(results);
}
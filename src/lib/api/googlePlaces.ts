// Google Places API 서비스 레이어

import { PlaceRanking, REGION_COORDINATES } from '@/types/ranking';
import { generateGoogleMapsUrl } from '@/lib/naverMap';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
const CACHE_DURATION = 3600; // 1시간 캐싱

interface GooglePlaceResult {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  rating: number;
  userRatingCount: number;
  types: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
}

interface GooglePlacesResponse {
  places: GooglePlaceResult[];
}

/**
 * Google Places API를 사용하여 지역별 업체 랭킹 조회
 *
 * @param city 시/군/구 (예: "강남구")
 * @param category 카테고리 (예: "restaurant")
 * @param placeType Google Places type
 * @param minRating 최소 평점 (기본: 4.0)
 * @returns PlaceRanking 배열
 */
export async function fetchPlaceRankings(
  city: string,
  category: string,
  placeType: string,
  minRating: number = 4.0
): Promise<PlaceRanking[]> {
  console.log('========================================');
  console.log('🔍 [Google Places] fetchPlaceRankings 시작');
  console.log('========================================');
  console.log('📍 파라미터:', { city, category, placeType, minRating });

  console.log('🔑 API Key 확인:', {
    exists: !!GOOGLE_PLACES_API_KEY,
    prefix: GOOGLE_PLACES_API_KEY?.substring(0, 20) + '...',
    envVarName: 'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY'
  });

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('❌ Google Places API key is not configured');
    console.error('💡 Vercel 환경변수에 NEXT_PUBLIC_GOOGLE_PLACES_API_KEY 추가 필요');
    throw new Error('GOOGLE_PLACES_API_KEY_MISSING');
  }

  try {
    // 지역 좌표 가져오기
    const coordinates = REGION_COORDINATES[city] || REGION_COORDINATES['강남구'];
    console.log('🗺️ 지역 좌표:', { city, coordinates });

    // 검색 쿼리 생성 - 자연스러운 한국어 형식 사용
    // "강남구 식당", "강남구 카페" 형식이 가장 잘 작동함
    const searchQuery = `${city} ${category}`;

    console.log('🔎 검색 쿼리:', searchQuery);
    console.log('🏷️ placeType:', placeType);

    const requestBody = {
      textQuery: searchQuery,
      languageCode: 'ko',
      locationBias: {
        circle: {
          center: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          },
          radius: 5000.0 // 5km 반경
        }
      },
      minRating,
      maxResultCount: 20 // 최대 20개 결과
    };

    console.log('📤 API 요청 Body:', JSON.stringify(requestBody, null, 2));

    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    console.log('🌐 API URL:', apiUrl);

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location,places.photos'
    };
    console.log('📋 요청 헤더:', {
      'Content-Type': headers['Content-Type'],
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY?.substring(0, 20) + '...',
      'X-Goog-FieldMask': headers['X-Goog-FieldMask']
    });

    console.log('⏳ API 호출 중...');
    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      next: { revalidate: CACHE_DURATION }
    });

    const endTime = Date.now();
    console.log(`⏱️ API 응답 시간: ${endTime - startTime}ms`);

    console.log('📥 응답 상태:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('========================================');
      console.error('❌ Google Places API 에러');
      console.error('========================================');
      console.error('상태 코드:', response.status);
      console.error('에러 메시지:', errorText);
      console.error('========================================');
      throw new Error(`Google Places API failed: ${response.status}`);
    }

    const data: GooglePlacesResponse = await response.json();
    console.log('✅ API 응답 성공');
    console.log('📊 결과 개수:', data.places?.length || 0);

    if (!data.places || data.places.length === 0) {
      console.warn('⚠️ 검색 결과 없음');
      console.warn('검색어:', searchQuery);
      console.warn('지역:', city);
      throw new Error(`NO_RESULTS: ${searchQuery}`);
    }

    console.log('🏆 첫 3개 결과:', data.places.slice(0, 3).map(p => ({
      name: p.displayName?.text,
      rating: p.rating,
      reviews: p.userRatingCount
    })));

    // PlaceRanking 객체로 변환 및 인기도 점수 계산
    const rankings: PlaceRanking[] = data.places.map((place) => {
      const popularityScore = calculatePopularityScore(place.rating, place.userRatingCount);

      // 첫 번째 사진 URL 생성 (있는 경우)
      let photoUrl: string | undefined;
      if (place.photos && place.photos.length > 0) {
        const photoName = place.photos[0].name;
        // Google Places Photo API URL
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${GOOGLE_PLACES_API_KEY}`;
      }

      return {
        placeId: place.id,
        name: place.displayName.text,
        address: place.formattedAddress,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        types: place.types,
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        googleMapsUrl: generateGoogleMapsUrl(
          place.displayName.text,
          { lat: place.location.latitude, lng: place.location.longitude }
        ),
        popularityScore,
        photoUrl
      };
    });

    console.log('========================================');
    console.log('✅ 최종 결과:', rankings.length, '개');
    console.log('========================================');
    return rankings;

  } catch (error) {
    console.error('========================================');
    console.error('💥 예외 발생');
    console.error('========================================');
    console.error('에러:', error);
    console.error('타입:', typeof error);
    console.error('메시지:', error instanceof Error ? error.message : String(error));
    console.error('========================================');
    throw error;
  }
}

/**
 * 인기도 점수 계산
 *
 * 공식: rating × log10(userRatingCount + 1)
 * - 평점이 높을수록 점수 높음
 * - 리뷰가 많을수록 가중치 증가 (로그 스케일)
 *
 * @param rating 평점 (0.0 ~ 5.0)
 * @param userRatingCount 리뷰 개수
 * @returns 인기도 점수
 */
function calculatePopularityScore(rating: number, userRatingCount: number): number {
  return rating * Math.log10(userRatingCount + 1);
}

/**
 * 장소 목록을 정렬
 *
 * @param places PlaceRanking 배열
 * @param sortBy 정렬 기준
 * @returns 정렬된 PlaceRanking 배열
 */
export function sortPlaces(
  places: PlaceRanking[],
  sortBy: 'rating' | 'reviews' | 'popularity' = 'popularity'
): PlaceRanking[] {
  return [...places].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        // 평점 높은 순 → 동점이면 리뷰 많은 순
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.userRatingCount - a.userRatingCount;

      case 'reviews':
        // 리뷰 많은 순 → 동점이면 평점 높은 순
        if (b.userRatingCount !== a.userRatingCount) {
          return b.userRatingCount - a.userRatingCount;
        }
        return b.rating - a.rating;

      case 'popularity':
      default:
        // 인기도 점수 높은 순
        return b.popularityScore - a.popularityScore;
    }
  });
}

/**
 * 서버 컴포넌트용 캐시된 랭킹 조회 함수
 */
export async function getPlaceRankings(
  city: string,
  category: string,
  placeType: string,
  sortBy: 'rating' | 'reviews' | 'popularity' = 'popularity'
): Promise<PlaceRanking[]> {
  try {
    const places = await fetchPlaceRankings(city, category, placeType);
    return sortPlaces(places, sortBy);
  } catch (error) {
    console.error('[getPlaceRankings Error]:', error);
    return [];
  }
}

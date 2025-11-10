// Google Places API 서비스 레이어

import { PlaceRanking, REGION_COORDINATES } from '@/types/ranking';
import { generateGoogleMapsUrl, generateNaverPlaceSearchUrl } from '@/lib/naverMap';

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
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key is not configured');
    return [];
  }

  try {
    // 지역 좌표 가져오기
    const coordinates = REGION_COORDINATES[city] || REGION_COORDINATES['강남구'];

    // 검색 쿼리 생성
    const searchQuery = category === 'search'
      ? placeType  // 직접 검색인 경우 placeType이 검색어
      : `${category} in ${city}`;

    console.log(`[Google Places] Searching: ${searchQuery} near ${coordinates.latitude},${coordinates.longitude}`);

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

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location'
      },
      body: JSON.stringify(requestBody),
      next: { revalidate: CACHE_DURATION }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Google Places API Error] ${response.status}: ${errorText}`);
      throw new Error(`Google Places API failed: ${response.status}`);
    }

    const data: GooglePlacesResponse = await response.json();

    if (!data.places || data.places.length === 0) {
      console.warn(`[Google Places] No results found for: ${searchQuery}`);
      return [];
    }

    // PlaceRanking 객체로 변환 및 인기도 점수 계산
    const rankings: PlaceRanking[] = data.places.map((place) => {
      const popularityScore = calculatePopularityScore(place.rating, place.userRatingCount);

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
        naverSearchUrl: generateNaverPlaceSearchUrl(
          place.displayName.text,
          place.formattedAddress
        ),
        popularityScore
      };
    });

    console.log(`[Google Places] Found ${rankings.length} places`);
    return rankings;

  } catch (error) {
    console.error('[Google Places API Error]:', error);
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

-- ============================================
-- 중고폰 직거래 초기 데이터 (시드)
-- Version: 1.0.0
-- Created: 2024-09-10
-- ============================================

-- 테스트용 샘플 데이터 (개발 환경에서만 실행)
-- 주의: 프로덕션 환경에서는 실행하지 마세요!

-- 1. 샘플 중고폰 데이터 삽입
INSERT INTO `used_phones` (
    `user_id`, `brand`, `series`, `model`, `storage`, `color`,
    `condition_grade`, `battery_status`, `purchase_period`,
    `price`, `accept_offers`, `min_offer_price`,
    `accessories`, `trade_location`, `description`,
    `sido`, `sigungu`, `status`, `view_count`
) VALUES
-- 삼성 갤럭시 시리즈
(1, 'samsung', 'Galaxy S', 'Galaxy S24 Ultra', 512, '티타늄 블랙', 
 'A', '85+', '3', 
 1100000, true, 1000000,
 '["charger", "box", "case"]', '강남역 11번 출구', 
 '3개월 사용한 S24 울트라입니다. 상태 매우 깨끗합니다. 액정 기스 없고 케이스 착용해서 사용했습니다.',
 '서울특별시', '강남구', 'active', 152),

(2, 'samsung', 'Galaxy S', 'Galaxy S23 Ultra', 256, '그린', 
 'B', '80-85', '12', 
 750000, true, 700000,
 '["charger", "box"]', '판교역 근처', 
 '1년 정도 사용했습니다. 약간의 사용감 있지만 기능 완벽합니다.',
 '경기도', '성남시', 'active', 89),

(3, 'samsung', 'Galaxy Z', 'Galaxy Z Fold 5', 512, '팬텀 블랙', 
 'A', '85+', '6', 
 1500000, true, 1400000,
 '["charger", "box", "case", "s-pen"]', '역삼역', 
 'Z폴드5 판매합니다. 6개월 사용했고 상태 최상입니다. S펜 포함',
 '서울특별시', '강남구', 'active', 234),

(4, 'samsung', 'Galaxy Z', 'Galaxy Z Flip 5', 256, '라벤더', 
 'B', '80-85', '9', 
 650000, true, 600000,
 '["charger"]', '신도림역', 
 'Z플립5 판매합니다. 여성분이 사용하기 좋아요.',
 '서울특별시', '구로구', 'active', 67),

-- 애플 아이폰 시리즈
(5, 'apple', 'iPhone', 'iPhone 15 Pro Max', 256, '내추럴 티타늄', 
 'A', '85+', '3', 
 1450000, true, 1400000,
 '["charger", "box", "airpods"]', '홍대입구역', 
 '아이폰 15 프로맥스 판매합니다. 애플케어+ 가입되어 있습니다.',
 '서울특별시', '마포구', 'active', 198),

(6, 'apple', 'iPhone', 'iPhone 14 Pro', 128, '딥 퍼플', 
 'B', '80-85', '12', 
 950000, true, 900000,
 '["charger", "box"]', '수원역', 
 '아이폰 14프로 판매합니다. 배터리 성능 83%입니다.',
 '경기도', '수원시', 'active', 156),

(7, 'apple', 'iPhone', 'iPhone 13', 128, '미드나이트', 
 'C', 'under', 'over', 
 550000, true, 500000,
 '["charger"]', '부평역', 
 '아이폰13 판매합니다. 배터리 교체 필요할 수 있습니다.',
 '인천광역시', '부평구', 'active', 43),

(8, 'apple', 'iPhone', 'iPhone 15', 128, '핑크', 
 'A', '85+', '1', 
 1050000, false, null,
 '["charger", "box", "case"]', '잠실역', 
 '거의 새제품입니다. 한달 사용했습니다. 가격 제안 받지 않습니다.',
 '서울특별시', '송파구', 'active', 321),

-- LG 및 기타 브랜드
(9, 'lg', 'V', 'LG V50', 128, '블랙', 
 'C', 'unknown', 'over', 
 150000, true, 100000,
 '[]', '인천시청역', 
 'LG V50 판매합니다. 서브폰으로 적당합니다.',
 '인천광역시', '남동구', 'active', 12),

(10, 'xiaomi', 'Redmi', 'Redmi Note 12 Pro', 256, '블루', 
 'B', '85+', '6', 
 280000, true, 250000,
 '["charger", "box"]', '안양역', 
 '샤오미 레드미노트12프로 판매합니다. 가성비 좋습니다.',
 '경기도', '안양시', 'active', 34);

-- 2. 샘플 이미지 데이터
INSERT INTO `used_phone_images` (`phone_id`, `image_url`, `image_order`) VALUES
(1, 'https://example.com/images/s24ultra_1.jpg', 0),
(1, 'https://example.com/images/s24ultra_2.jpg', 1),
(1, 'https://example.com/images/s24ultra_3.jpg', 2),
(2, 'https://example.com/images/s23ultra_1.jpg', 0),
(3, 'https://example.com/images/zfold5_1.jpg', 0),
(3, 'https://example.com/images/zfold5_2.jpg', 1),
(4, 'https://example.com/images/zflip5_1.jpg', 0),
(5, 'https://example.com/images/iphone15pm_1.jpg', 0),
(5, 'https://example.com/images/iphone15pm_2.jpg', 1),
(6, 'https://example.com/images/iphone14pro_1.jpg', 0),
(7, 'https://example.com/images/iphone13_1.jpg', 0),
(8, 'https://example.com/images/iphone15_1.jpg', 0),
(9, 'https://example.com/images/lgv50_1.jpg', 0),
(10, 'https://example.com/images/redmi12pro_1.jpg', 0);

-- 3. 샘플 제안 데이터
INSERT INTO `used_offers` (`phone_id`, `user_id`, `offered_price`, `message`, `status`) VALUES
(1, 10, 1050000, '오늘 바로 거래 가능합니다. 현금 준비되어 있습니다.', 'pending'),
(1, 11, 1080000, '내일 오후에 거래 가능할까요?', 'pending'),
(1, 12, 1020000, '케이스 포함해서 이 가격에 가능할까요?', 'rejected'),
(2, 13, 720000, '직거래 가능합니다.', 'pending'),
(3, 14, 1450000, '폴드5 찾고 있었는데 연락주세요.', 'pending'),
(5, 15, 1420000, '애플케어 남은 기간이 얼마나 되나요?', 'pending'),
(6, 16, 920000, '배터리 성능 확인 후 구매하고 싶습니다.', 'pending');

-- 4. 샘플 찜 데이터
INSERT INTO `used_favorites` (`user_id`, `phone_id`) VALUES
(10, 1), (10, 3), (10, 5),
(11, 1), (11, 2),
(12, 5), (12, 6), (12, 8),
(13, 2), (13, 4),
(14, 3), (14, 4), (14, 5);

-- 5. 샘플 거래 완료 데이터 (통계용)
INSERT INTO `used_phones` (
    `user_id`, `brand`, `series`, `model`, `storage`, `color`,
    `condition_grade`, `battery_status`, `price`, 
    `sido`, `sigungu`, `status`, `view_count`, `offer_count`,
    `created_at`, `sold_at`
) VALUES
(20, 'samsung', 'Galaxy S', 'Galaxy S23', 256, '크림', 
 'A', '85+', 850000,
 '서울특별시', '강남구', 'sold', 445, 12,
 DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),

(21, 'apple', 'iPhone', 'iPhone 14', 256, '블루', 
 'B', '80-85', 780000,
 '경기도', '성남시', 'sold', 332, 8,
 DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY));

-- 6. 완료된 거래 데이터
INSERT INTO `used_transactions` (
    `phone_id`, `seller_id`, `buyer_id`, `final_price`, 
    `status`, `completed_at`, `seller_rating`, `buyer_rating`
) VALUES
(11, 20, 25, 850000, 'completed', DATE_SUB(NOW(), INTERVAL 3 DAY), 5, 5),
(12, 21, 26, 780000, 'completed', DATE_SUB(NOW(), INTERVAL 7 DAY), 4, 5);

-- 7. 통계 캐시 초기화
INSERT INTO `used_stats_cache` (`stat_key`, `stat_value`) VALUES
('popular_brands', '{"samsung": 45, "apple": 38, "lg": 10, "other": 7}'),
('avg_prices', '{"samsung": 750000, "apple": 950000, "lg": 200000}'),
('top_regions', '{"서울특별시": 156, "경기도": 98, "인천광역시": 34}');

-- 8. 이벤트 스케줄러 설정 (일일 통계 업데이트)
CREATE EVENT IF NOT EXISTS `event_update_used_stats`
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 3 HOUR
DO CALL sp_update_used_daily_stats();

-- 통계 확인 쿼리
SELECT '=== 중고폰 데이터 시드 완료 ===' as message;
SELECT COUNT(*) as total_phones FROM used_phones WHERE status = 'active';
SELECT COUNT(*) as total_offers FROM used_offers WHERE status = 'pending';
SELECT COUNT(*) as total_favorites FROM used_favorites;
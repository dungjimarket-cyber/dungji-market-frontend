-- ============================================
-- 중고폰 직거래 Views & Stored Procedures
-- Version: 1.0.0
-- Created: 2024-09-10
-- ============================================

-- 1. 인기 모델 통계 뷰
CREATE OR REPLACE VIEW `v_used_popular_models` AS
SELECT 
    brand,
    series,
    model,
    COUNT(*) as listing_count,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price,
    AVG(view_count) as avg_views,
    SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_count,
    AVG(CASE WHEN status = 'sold' 
        THEN DATEDIFF(sold_at, created_at) END) as avg_days_to_sell
FROM used_phones
WHERE status IN ('active', 'sold')
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY brand, series, model
ORDER BY listing_count DESC;

-- 2. 지역별 거래 통계 뷰
CREATE OR REPLACE VIEW `v_used_region_stats` AS
SELECT 
    sido,
    sigungu,
    COUNT(DISTINCT up.id) as total_listings,
    COUNT(DISTINCT CASE WHEN up.status = 'active' THEN up.id END) as active_listings,
    COUNT(DISTINCT CASE WHEN up.status = 'sold' THEN up.id END) as sold_count,
    AVG(up.price) as avg_price,
    AVG(CASE WHEN up.status = 'sold' 
        THEN DATEDIFF(up.sold_at, up.created_at) END) as avg_days_to_sell,
    COUNT(DISTINCT up.user_id) as unique_sellers
FROM used_phones up
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY sido, sigungu;

-- 3. 사용자 거래 통계 뷰
CREATE OR REPLACE VIEW `v_used_user_stats` AS
SELECT 
    u.id as user_id,
    u.name,
    u.phone,
    -- 판매 통계
    COUNT(DISTINCT up.id) as total_listings,
    COUNT(DISTINCT CASE WHEN up.status = 'active' THEN up.id END) as active_listings,
    COUNT(DISTINCT CASE WHEN up.status = 'sold' THEN up.id END) as sold_count,
    AVG(CASE WHEN up.status = 'sold' THEN up.price END) as avg_selling_price,
    
    -- 구매 통계
    COUNT(DISTINCT ut.id) as purchase_count,
    AVG(CASE WHEN ut.buyer_id = u.id THEN ut.final_price END) as avg_buying_price,
    
    -- 평점
    AVG(CASE WHEN ut.seller_id = u.id THEN ut.seller_rating END) as avg_seller_rating,
    AVG(CASE WHEN ut.buyer_id = u.id THEN ut.buyer_rating END) as avg_buyer_rating,
    
    -- 활동 지표
    COUNT(DISTINCT uo.id) as total_offers_made,
    COUNT(DISTINCT uo2.id) as total_offers_received,
    MAX(GREATEST(
        COALESCE(up.updated_at, '1970-01-01'),
        COALESCE(ut.completed_at, '1970-01-01'),
        COALESCE(uo.created_at, '1970-01-01')
    )) as last_activity
FROM users u
LEFT JOIN used_phones up ON u.id = up.user_id
LEFT JOIN used_transactions ut ON u.id = ut.seller_id OR u.id = ut.buyer_id
LEFT JOIN used_offers uo ON u.id = uo.user_id
LEFT JOIN used_offers uo2 ON uo2.phone_id = up.id AND up.user_id = u.id
GROUP BY u.id;

-- 4. 활성 상품 목록 뷰 (성능 최적화)
CREATE OR REPLACE VIEW `v_used_active_phones` AS
SELECT 
    p.*,
    u.name as seller_name,
    u.phone as seller_phone,
    COUNT(DISTINCT o.id) as offer_count_real,
    MAX(o.offered_price) as highest_offer,
    COUNT(DISTINCT f.user_id) as favorite_count,
    GROUP_CONCAT(DISTINCT pi.image_url ORDER BY pi.image_order SEPARATOR ',') as image_urls
FROM used_phones p
INNER JOIN users u ON p.user_id = u.id
LEFT JOIN used_offers o ON p.id = o.phone_id AND o.status = 'pending'
LEFT JOIN used_favorites f ON p.id = f.phone_id
LEFT JOIN used_phone_images pi ON p.id = pi.phone_id
WHERE p.status = 'active'
GROUP BY p.id;

-- 5. 제안 현황 뷰
CREATE OR REPLACE VIEW `v_used_offer_status` AS
SELECT 
    o.*,
    p.model,
    p.price as asking_price,
    p.user_id as seller_id,
    u1.name as buyer_name,
    u2.name as seller_name,
    (o.offered_price / p.price * 100) as offer_percentage,
    CASE 
        WHEN o.status = 'pending' AND DATEDIFF(NOW(), o.created_at) > 7 THEN 'stale'
        WHEN o.status = 'pending' AND DATEDIFF(NOW(), o.created_at) > 3 THEN 'aging'
        ELSE 'fresh'
    END as freshness
FROM used_offers o
INNER JOIN used_phones p ON o.phone_id = p.id
INNER JOIN users u1 ON o.user_id = u1.id
INNER JOIN users u2 ON p.user_id = u2.id;

-- 6. 저장 프로시저: 일일 통계 업데이트
DELIMITER $$
CREATE PROCEDURE `sp_update_used_daily_stats`()
BEGIN
    -- 일일 등록 제한 체크 및 초기화
    DELETE FROM used_daily_limits 
    WHERE date < DATE_SUB(CURDATE(), INTERVAL 7 DAY);
    
    -- 30일 이상 된 pending 제안 자동 만료
    UPDATE used_offers 
    SET status = 'expired', 
        expired_at = NOW()
    WHERE status = 'pending' 
        AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- 90일 이상 활성 상태인 상품 자동 숨김
    UPDATE used_phones 
    SET status = 'deleted',
        deleted_at = NOW()
    WHERE status = 'active'
        AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
        AND offer_count = 0;
END$$
DELIMITER ;

-- 7. 저장 프로시저: 제안 수락 처리
DELIMITER $$
CREATE PROCEDURE `sp_accept_offer`(
    IN p_offer_id BIGINT,
    IN p_seller_id BIGINT
)
BEGIN
    DECLARE v_phone_id BIGINT;
    DECLARE v_buyer_id BIGINT;
    DECLARE v_price INT;
    
    -- 트랜잭션 시작
    START TRANSACTION;
    
    -- 제안 정보 조회
    SELECT phone_id, user_id, offered_price 
    INTO v_phone_id, v_buyer_id, v_price
    FROM used_offers 
    WHERE id = p_offer_id AND status = 'pending';
    
    -- 제안 수락
    UPDATE used_offers 
    SET status = 'accepted', responded_at = NOW()
    WHERE id = p_offer_id;
    
    -- 다른 제안들 거절 처리
    UPDATE used_offers 
    SET status = 'rejected', responded_at = NOW()
    WHERE phone_id = v_phone_id 
        AND id != p_offer_id 
        AND status = 'pending';
    
    -- 상품 상태 변경
    UPDATE used_phones 
    SET status = 'reserved', reserved_at = NOW()
    WHERE id = v_phone_id;
    
    -- 거래 생성
    INSERT INTO used_transactions (
        phone_id, seller_id, buyer_id, offer_id, final_price
    ) VALUES (
        v_phone_id, p_seller_id, v_buyer_id, p_offer_id, v_price
    );
    
    -- 알림 생성
    INSERT INTO used_notifications (
        user_id, type, target_id, title, message
    ) VALUES (
        v_buyer_id, 'offer_accepted', p_offer_id,
        '제안이 수락되었습니다',
        '판매자가 회원님의 제안을 수락했습니다. 거래를 진행해주세요.'
    );
    
    COMMIT;
END$$
DELIMITER ;

-- 8. 트리거: 제안 수 자동 업데이트
DELIMITER $$
CREATE TRIGGER `trg_update_offer_count_insert`
AFTER INSERT ON used_offers
FOR EACH ROW
BEGIN
    IF NEW.status = 'pending' THEN
        UPDATE used_phones 
        SET offer_count = offer_count + 1
        WHERE id = NEW.phone_id;
    END IF;
END$$

CREATE TRIGGER `trg_update_offer_count_update`
AFTER UPDATE ON used_offers
FOR EACH ROW
BEGIN
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
        UPDATE used_phones 
        SET offer_count = GREATEST(0, offer_count - 1)
        WHERE id = NEW.phone_id;
    END IF;
END$$
DELIMITER ;

-- 9. 인덱스 추가 (성능 최적화)
ALTER TABLE used_phones 
ADD FULLTEXT INDEX `ft_search` (`model`, `description`);

ALTER TABLE used_offers
ADD INDEX `idx_offer_price` (`phone_id`, `offered_price` DESC);

ALTER TABLE used_transactions
ADD INDEX `idx_date_status` (`completed_at`, `status`);

-- 10. 통계 테이블 (캐싱용)
CREATE TABLE IF NOT EXISTS `used_stats_cache` (
    `stat_key` VARCHAR(100) PRIMARY KEY,
    `stat_value` JSON,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='통계 캐시';
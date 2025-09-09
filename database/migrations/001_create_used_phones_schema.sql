-- ============================================
-- 둥지마켓 중고폰 직거래 서비스 DB Schema
-- Version: 1.0.0
-- Created: 2024-09-10
-- ============================================

-- 1. 중고폰 상품 테이블
CREATE TABLE IF NOT EXISTS `used_phones` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL COMMENT '판매자 ID',
    
    -- 기본 정보
    `brand` VARCHAR(50) NOT NULL COMMENT '브랜드 (samsung, apple, lg, etc)',
    `series` VARCHAR(50) COMMENT '시리즈 (Galaxy S, iPhone, etc)',
    `model` VARCHAR(100) NOT NULL COMMENT '모델명 (S24 Ultra, iPhone 15 Pro, etc)',
    `storage` INT COMMENT '저장용량 (128, 256, 512, 1024)',
    `color` VARCHAR(30) COMMENT '색상',
    
    -- 상태 정보
    `condition_grade` CHAR(1) NOT NULL COMMENT '상태등급 (A, B, C)',
    `battery_status` VARCHAR(10) COMMENT '배터리 상태 (85+, 80-85, under, unknown)',
    `purchase_period` VARCHAR(10) COMMENT '구매시기 (1, 3, 6, 12, over)',
    `manufacture_date` DATE COMMENT '제조년월',
    
    -- 판매 정보
    `price` INT NOT NULL COMMENT '희망 가격',
    `accept_offers` BOOLEAN DEFAULT TRUE COMMENT '제안 받기 여부',
    `min_offer_price` INT COMMENT '최소 제안 가격',
    `accessories` JSON COMMENT '구성품 ["charger", "box", "earphone"]',
    
    -- 거래 정보
    `trade_location` VARCHAR(200) COMMENT '거래 희망 장소',
    `description` TEXT COMMENT '상품 설명',
    
    -- 지역 정보 (검색 성능을 위해 중복 저장)
    `sido` VARCHAR(50) NOT NULL COMMENT '시/도',
    `sigungu` VARCHAR(50) NOT NULL COMMENT '시/군/구',
    
    -- 상태 관리
    `status` ENUM('active', 'reserved', 'sold', 'deleted') DEFAULT 'active',
    `view_count` INT DEFAULT 0 COMMENT '조회수',
    `offer_count` INT DEFAULT 0 COMMENT '제안 수 (캐싱용)',
    
    -- 타임스탬프
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `reserved_at` TIMESTAMP NULL COMMENT '예약 시간',
    `sold_at` TIMESTAMP NULL COMMENT '판매 완료 시간',
    `deleted_at` TIMESTAMP NULL COMMENT '삭제 시간',
    
    -- 인덱스
    INDEX `idx_status_created` (`status`, `created_at` DESC),
    INDEX `idx_user_status` (`user_id`, `status`),
    INDEX `idx_model_price` (`model`, `price`),
    INDEX `idx_region` (`sido`, `sigungu`, `status`),
    INDEX `idx_brand_model` (`brand`, `series`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='중고폰 상품';

-- 2. 상품 이미지 테이블
CREATE TABLE IF NOT EXISTS `used_phone_images` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `phone_id` BIGINT NOT NULL COMMENT '상품 ID',
    
    `image_url` VARCHAR(500) NOT NULL COMMENT '이미지 URL',
    `image_order` TINYINT DEFAULT 0 COMMENT '이미지 순서 (0: 대표이미지)',
    `file_size` INT COMMENT '파일 크기 (bytes)',
    `width` INT COMMENT '이미지 너비',
    `height` INT COMMENT '이미지 높이',
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`phone_id`) REFERENCES `used_phones`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_phone_order` (`phone_id`, `image_order`),
    INDEX `idx_phone_id` (`phone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='중고폰 이미지';

-- 3. 가격 제안 테이블 (기존 공구의 bid 시스템 참고)
CREATE TABLE IF NOT EXISTS `used_offers` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `phone_id` BIGINT NOT NULL COMMENT '상품 ID',
    `user_id` BIGINT NOT NULL COMMENT '제안한 사용자 ID',
    
    `offered_price` INT NOT NULL COMMENT '제안 가격',
    `message` VARCHAR(200) COMMENT '제안 메시지',
    
    -- 상태 관리
    `status` ENUM('pending', 'accepted', 'rejected', 'cancelled', 'expired') DEFAULT 'pending',
    
    -- 타임스탬프
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `responded_at` TIMESTAMP NULL COMMENT '수락/거절 시간',
    `cancelled_at` TIMESTAMP NULL,
    `expired_at` TIMESTAMP NULL COMMENT '만료 시간',
    
    -- 외래키 및 인덱스
    FOREIGN KEY (`phone_id`) REFERENCES `used_phones`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_phone_user` (`phone_id`, `user_id`) COMMENT '한 상품에 한 사용자는 하나의 제안만',
    INDEX `idx_phone_status` (`phone_id`, `status`),
    INDEX `idx_user_status` (`user_id`, `status`),
    INDEX `idx_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='가격 제안';

-- 4. 거래 내역 테이블
CREATE TABLE IF NOT EXISTS `used_transactions` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `phone_id` BIGINT NOT NULL COMMENT '상품 ID',
    `seller_id` BIGINT NOT NULL COMMENT '판매자 ID',
    `buyer_id` BIGINT NOT NULL COMMENT '구매자 ID',
    `offer_id` BIGINT COMMENT '수락된 제안 ID',
    
    `final_price` INT NOT NULL COMMENT '최종 거래 가격',
    `trade_method` ENUM('direct', 'safety') DEFAULT 'direct' COMMENT '거래 방식',
    
    -- 상태 관리
    `status` ENUM('in_progress', 'completed', 'cancelled', 'disputed') DEFAULT 'in_progress',
    
    -- 타임스탬프
    `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL,
    `cancelled_at` TIMESTAMP NULL,
    
    -- 거래 후기
    `seller_rating` TINYINT COMMENT '판매자 평점 (1-5)',
    `buyer_rating` TINYINT COMMENT '구매자 평점 (1-5)',
    `seller_review` VARCHAR(200) COMMENT '판매자 후기',
    `buyer_review` VARCHAR(200) COMMENT '구매자 후기',
    
    -- 외래키 및 인덱스
    FOREIGN KEY (`phone_id`) REFERENCES `used_phones`(`id`),
    FOREIGN KEY (`offer_id`) REFERENCES `used_offers`(`id`),
    INDEX `idx_seller` (`seller_id`, `status`),
    INDEX `idx_buyer` (`buyer_id`, `status`),
    INDEX `idx_completed` (`completed_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='거래 내역';

-- 5. 찜 목록 테이블
CREATE TABLE IF NOT EXISTS `used_favorites` (
    `user_id` BIGINT NOT NULL COMMENT '사용자 ID',
    `phone_id` BIGINT NOT NULL COMMENT '상품 ID',
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `notified_at` TIMESTAMP NULL COMMENT '알림 발송 시간',
    
    PRIMARY KEY (`user_id`, `phone_id`),
    FOREIGN KEY (`phone_id`) REFERENCES `used_phones`(`id`) ON DELETE CASCADE,
    INDEX `idx_phone` (`phone_id`),
    INDEX `idx_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='찜 목록';

-- 6. 신고 관리 테이블
CREATE TABLE IF NOT EXISTS `used_reports` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `reporter_id` BIGINT NOT NULL COMMENT '신고자 ID',
    `phone_id` BIGINT COMMENT '신고된 상품 ID',
    `reported_user_id` BIGINT COMMENT '신고된 사용자 ID',
    
    `reason` ENUM('spam', 'fraud', 'inappropriate', 'duplicate', 'price_manipulation', 'other') NOT NULL,
    `description` TEXT COMMENT '상세 설명',
    `evidence_urls` JSON COMMENT '증거 이미지 URLs',
    
    -- 처리 상태
    `status` ENUM('pending', 'reviewing', 'confirmed', 'dismissed') DEFAULT 'pending',
    `admin_note` VARCHAR(500) COMMENT '관리자 메모',
    `action_taken` VARCHAR(100) COMMENT '조치 내용',
    
    -- 타임스탬프
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `processed_at` TIMESTAMP NULL,
    `processed_by` BIGINT NULL COMMENT '처리한 관리자 ID',
    
    -- 외래키 및 인덱스
    FOREIGN KEY (`phone_id`) REFERENCES `used_phones`(`id`),
    INDEX `idx_status_created` (`status`, `created_at`),
    INDEX `idx_reported_user` (`reported_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='신고 관리';

-- 7. 채팅 메시지 테이블 (간단한 구조)
CREATE TABLE IF NOT EXISTS `used_chats` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `phone_id` BIGINT NOT NULL COMMENT '상품 ID',
    `offer_id` BIGINT COMMENT '관련 제안 ID',
    `sender_id` BIGINT NOT NULL COMMENT '발신자 ID',
    `receiver_id` BIGINT NOT NULL COMMENT '수신자 ID',
    
    `message` TEXT NOT NULL COMMENT '메시지 내용',
    `is_read` BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',
    `message_type` ENUM('text', 'image', 'system') DEFAULT 'text',
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `read_at` TIMESTAMP NULL,
    
    -- 외래키 및 인덱스
    FOREIGN KEY (`phone_id`) REFERENCES `used_phones`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`offer_id`) REFERENCES `used_offers`(`id`) ON DELETE SET NULL,
    INDEX `idx_phone_users` (`phone_id`, `sender_id`, `receiver_id`),
    INDEX `idx_receiver_read` (`receiver_id`, `is_read`),
    INDEX `idx_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='채팅 메시지';

-- 8. 일일 등록 제한 관리 테이블
CREATE TABLE IF NOT EXISTS `used_daily_limits` (
    `user_id` BIGINT NOT NULL COMMENT '사용자 ID',
    `date` DATE NOT NULL COMMENT '날짜',
    
    `post_count` INT DEFAULT 0 COMMENT '당일 등록 수',
    `offer_count` INT DEFAULT 0 COMMENT '당일 제안 수',
    
    PRIMARY KEY (`user_id`, `date`),
    INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='일일 제한';

-- 9. 알림 설정 테이블
CREATE TABLE IF NOT EXISTS `used_notifications` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL COMMENT '사용자 ID',
    `type` ENUM('offer_received', 'offer_accepted', 'offer_rejected', 'price_changed', 'chat_message') NOT NULL,
    `target_id` BIGINT COMMENT '대상 ID (phone_id, offer_id 등)',
    
    `title` VARCHAR(100) NOT NULL,
    `message` VARCHAR(200) NOT NULL,
    `data` JSON COMMENT '추가 데이터',
    
    `is_read` BOOLEAN DEFAULT FALSE,
    `is_sent` BOOLEAN DEFAULT FALSE COMMENT 'FCM 발송 여부',
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `read_at` TIMESTAMP NULL,
    `sent_at` TIMESTAMP NULL,
    
    INDEX `idx_user_unread` (`user_id`, `is_read`),
    INDEX `idx_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='알림';

-- 10. 검색 기록 테이블 (추천 시스템용)
CREATE TABLE IF NOT EXISTS `used_search_history` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `keyword` VARCHAR(100) NOT NULL,
    `filters` JSON COMMENT '적용된 필터',
    `result_count` INT DEFAULT 0,
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_user_created` (`user_id`, `created_at` DESC),
    INDEX `idx_keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='검색 기록';
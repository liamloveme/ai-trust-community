-- Schema for MySQL 8.4 / utf8mb4. Created automatically only on a fresh MySQL volume.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(40) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('member','moderator','super_admin') NOT NULL DEFAULT 'member',
  state ENUM('active','suspended') NOT NULL DEFAULT 'active',
  mute_until DATETIME NULL,
  mute_reason VARCHAR(300) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  csrf_token CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_session_token (token_hash),
  KEY idx_sessions_expiry (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- V2.6 -> V2.7. Back up data first. Use only once on existing installations.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_password_reset_token (token_hash),
  KEY idx_password_reset_expiration (expires_at),
  KEY idx_password_reset_user (user_id),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_name VARCHAR(48) NOT NULL,
  granted_by BIGINT UNSIGNED NULL,
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_name),
  CONSTRAINT fk_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_permissions_granter FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id BIGINT UNSIGNED NOT NULL,
  type ENUM('discussion','exposure') NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'chat',
  title VARCHAR(140) NOT NULL,
  body TEXT NOT NULL,
  anonymous TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('pending','published','rejected','removed') NOT NULL DEFAULT 'pending',
  home_pinned TINYINT(1) NOT NULL DEFAULT 0,
  section_pinned TINYINT(1) NOT NULL DEFAULT 0,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  moderation_note VARCHAR(500) NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_posts_type_status_created (type, status, created_at),
  KEY idx_posts_author (author_id),
  KEY idx_posts_home_pin (status,home_pinned,created_at,id),
  KEY idx_posts_section_pin (category,status,section_pinned,created_at,id),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id),
  CONSTRAINT fk_posts_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  author_id BIGINT UNSIGNED NOT NULL,
  body VARCHAR(1600) NOT NULL,
  status ENUM('pending','published','hidden') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_comments_post_status (post_id, status, created_at),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uploader_id BIGINT UNSIGNED NOT NULL,
  post_id BIGINT UNSIGNED NULL,
  comment_id BIGINT UNSIGNED NULL,
  purpose ENUM('public','private') NOT NULL,
  filename VARCHAR(90) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  mime VARCHAR(30) NOT NULL DEFAULT 'image/webp',
  size_bytes INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_attach_post (post_id),
  KEY idx_attachments_comment (comment_id),
  CONSTRAINT fk_attach_owner FOREIGN KEY (uploader_id) REFERENCES users(id),
  CONSTRAINT fk_attach_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_attach_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Personal sticker library: private inventory, public only when used in published content.
CREATE TABLE IF NOT EXISTS custom_stickers (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 owner_id BIGINT UNSIGNED NOT NULL,
 filename VARCHAR(90) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 bytes INT UNSIGNED NOT NULL,
 label VARCHAR(80) NOT NULL DEFAULT '自定义表情',
 status ENUM('active','disabled','deleted') NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_sticker_owner (owner_id,status),
 KEY idx_sticker_status (status,id),
 CONSTRAINT fk_sticker_owner FOREIGN KEY(owner_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS sticker_usages (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 sticker_id BIGINT UNSIGNED NOT NULL,
 post_id BIGINT UNSIGNED NULL,
 comment_id BIGINT UNSIGNED NULL,
 KEY idx_sticker_uses (sticker_id,post_id,comment_id),
 CONSTRAINT fk_sticker_usage_sticker FOREIGN KEY(sticker_id) REFERENCES custom_stickers(id),
 CONSTRAINT fk_sticker_usage_post FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
 CONSTRAINT fk_sticker_usage_comment FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS post_likes (
  user_id BIGINT UNSIGNED NOT NULL,
  post_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_like_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('post','comment') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  reason ENUM('fraud','privacy','false_info','abuse','other') NOT NULL,
  details VARCHAR(2000) NOT NULL,
  status ENUM('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
  handling_note VARCHAR(500) NULL,
  handled_by BIGINT UNSIGNED NULL,
  handled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_reports_status (status, created_at),
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_reports_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appeals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  applicant_id BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(2000) NOT NULL,
  status ENUM('pending','accepted','denied') NOT NULL DEFAULT 'pending',
  handling_note VARCHAR(500) NULL,
  handled_by BIGINT UNSIGNED NULL,
  handled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_appeals_status (status, created_at),
  CONSTRAINT fk_appeals_post FOREIGN KEY (post_id) REFERENCES posts(id),
  CONSTRAINT fk_appeals_user FOREIGN KEY (applicant_id) REFERENCES users(id),
  CONSTRAINT fk_appeals_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id VARCHAR(40) NOT NULL,
  details JSON NULL,
  actor_name VARCHAR(40) NULL,
  actor_role VARCHAR(24) NULL,
  target_name VARCHAR(80) NULL,
  summary VARCHAR(500) NULL,
  request_ip VARCHAR(48) NULL,
  request_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_created (created_at),
  KEY idx_audit_actor_time (actor_id,created_at),
  KEY idx_audit_target_time (target_type,target_id,created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Configurable navigation sections: custom forum categories or stand-alone content pages.
CREATE TABLE IF NOT EXISTS forum_sections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(40) NOT NULL,
  icon VARCHAR(8) NOT NULL DEFAULT '◈',
  kind ENUM('discussion','exposure','page') NOT NULL DEFAULT 'discussion',
  description VARCHAR(240) NOT NULL DEFAULT '',
  page_content TEXT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sections_slug (slug),
  KEY idx_sections_order (enabled,sort_order),
  CONSTRAINT fk_sections_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;


INSERT IGNORE INTO forum_sections (slug,title,icon,kind,description,sort_order) VALUES
('chat','灌水闲聊','☕','discussion','自由聊天、交流与互助',10),
('api','API Key 交流','⚡','discussion','中转接口、调用与稳定性',20),
('accounts','模型账号','◈','discussion','大模型账号使用与经验',30),
('warning','交易防骗','🛡','exposure','交易纠纷及风险线索（人工审核）',40),
('experience','交易经验','◇','discussion','交易安全与行业交流',50);
-- V2.3 -> V2.4: execute ONCE after verified backup; no changes to posts/users.
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(60) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  setting_value JSON NOT NULL,
  revision INT UNSIGNED NOT NULL DEFAULT 1,
  integrity_mac CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_editor FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

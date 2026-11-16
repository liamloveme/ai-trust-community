-- V1 -> V2 迁移；务必先全量备份数据库。仅运行一次，不要直接对新库运行。
ALTER TABLE users ADD COLUMN mute_until DATETIME NULL, ADD COLUMN mute_reason VARCHAR(300) NULL;
ALTER TABLE posts MODIFY COLUMN category VARCHAR(64) NOT NULL DEFAULT 'chat';
ALTER TABLE attachments ADD COLUMN comment_id BIGINT UNSIGNED NULL;
ALTER TABLE attachments ADD CONSTRAINT fk_attach_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;
CREATE INDEX idx_attachments_comment ON attachments(comment_id);
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
 UNIQUE KEY uk_sections_slug (slug), KEY idx_sections_order (enabled,sort_order),
 CONSTRAINT fk_sections_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
INSERT IGNORE INTO forum_sections (slug,title,icon,kind,description,sort_order) VALUES
('chat','灌水闲聊','☕','discussion','自由聊天、交流与互助',10),
('api','API Key 交流','⚡','discussion','中转接口、调用与稳定性',20),
('accounts','模型账号','◈','discussion','大模型账号使用与经验',30),
('warning','交易防骗','🛡','exposure','交易纠纷及风险线索（人工审核）',40),
('experience','交易经验','◇','discussion','交易安全与行业交流',50);

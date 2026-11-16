-- V2.1 -> V2.2: run once AFTER a verified backup. Do not rerun.
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

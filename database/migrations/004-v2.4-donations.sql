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

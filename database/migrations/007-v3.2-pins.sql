-- V3.1/v1.0.1 -> V3.2/v1.1.0. Back up the database before applying once.
-- Footer contacts use the existing site_settings table; no contact data is seeded.
ALTER TABLE posts
 ADD COLUMN home_pinned TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
 ADD COLUMN section_pinned TINYINT(1) NOT NULL DEFAULT 0 AFTER home_pinned,
 ADD KEY idx_posts_home_pin (status,home_pinned,created_at,id),
 ADD KEY idx_posts_section_pin (category,status,section_pinned,created_at,id);

-- V2.5 -> V2.6; back up BEFORE executing. MySQL 8.4; run exactly once.
-- Old audit entries retain existing details and actor JOIN fallback.
ALTER TABLE audit_logs
 ADD COLUMN actor_name VARCHAR(40) NULL,
 ADD COLUMN actor_role VARCHAR(24) NULL,
 ADD COLUMN target_name VARCHAR(80) NULL,
 ADD COLUMN summary VARCHAR(500) NULL,
 ADD COLUMN request_ip VARCHAR(48) NULL,
 ADD COLUMN request_id CHAR(36) NULL,
 ADD KEY idx_audit_actor_time (actor_id,created_at),
 ADD KEY idx_audit_target_time (target_type,target_id,created_at);

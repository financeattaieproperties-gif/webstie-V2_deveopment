-- THIRD Submission database ONLY. Upgrade existing 055 installations; retain all records.
CREATE TABLE IF NOT EXISTS sub_post_assets (
  sub_post_id INT UNSIGNED NOT NULL, sort_order TINYINT UNSIGNED NOT NULL,
  mime VARCHAR(100) NOT NULL, content LONGBLOB NOT NULL,
  PRIMARY KEY(sub_post_id,sort_order), FOREIGN KEY(sub_post_id) REFERENCES sub_posts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

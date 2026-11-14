-- THIRD SUBMISSION DATABASE ONLY. Apply once after 055/101; no existing assets are deleted.
ALTER TABLE sub_posts ADD current_revision INT UNSIGNED NOT NULL DEFAULT 1,
  ADD published_revision INT UNSIGNED NULL,
  MODIFY social_platform ENUM('Facebook','YouTube','Instagram') NULL;
UPDATE sub_posts SET published_revision=1 WHERE publish_status='Published';
ALTER TABLE sub_post_photos ADD revision INT UNSIGNED NOT NULL DEFAULT 1,
  DROP INDEX uq_sub_photo_order, ADD UNIQUE KEY uq_sub_photo_revision(sub_post_id,revision,sort_order);
ALTER TABLE sub_post_assets ADD revision INT UNSIGNED NOT NULL DEFAULT 1,
  DROP PRIMARY KEY, ADD PRIMARY KEY(sub_post_id,revision,sort_order);
ALTER TABLE sub_publish_events ADD revision INT UNSIGNED NOT NULL DEFAULT 1;
CREATE TABLE sub_post_revisions (
 sub_post_id INT UNSIGNED NOT NULL, revision INT UNSIGNED NOT NULL,
 payload_json MEDIUMTEXT NOT NULL, submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(sub_post_id,revision), FOREIGN KEY(sub_post_id) REFERENCES sub_posts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO sub_post_revisions(sub_post_id,revision,payload_json,submitted_at)
 SELECT id,1,JSON_OBJECT('serialNumber',serial_number,'propertyInfoNote',property_info_note,'submittedBy',submitted_by_name),submitted_at FROM sub_posts;

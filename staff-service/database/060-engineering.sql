-- V2 ONLY. Import ONCE after 050-marketing-production.sql in the Internal Office CRM Database.
-- Phase 6: Engineering & Graphic Department Project Tasks, Versioned Deliverables & Manager Review.
SET NAMES utf8mb4;

CREATE TABLE eng_deliverables (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  apartment_id INT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  assigned_role ENUM('architect','graphic_designer','visual_designer_3d') NOT NULL,
  assignee_id INT UNSIGNED NOT NULL,
  assigned_by_id INT UNSIGNED NOT NULL,
  deadline_at DATETIME NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  FOREIGN KEY (apartment_id) REFERENCES inv_apartments(id),
  FOREIGN KEY (assignee_id) REFERENCES core_users(id),
  FOREIGN KEY (assigned_by_id) REFERENCES core_users(id),
  INDEX (assignee_id, deadline_at),
  INDEX (project_id, assigned_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE eng_deliverable_versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  deliverable_id INT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  format VARCHAR(100) NOT NULL,
  notes TEXT NOT NULL,
  submitted_by_id INT UNSIGNED NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('submitted','approved','revision_requested') NOT NULL DEFAULT 'submitted',
  reviewer_comment TEXT NULL,
  reviewed_by_id INT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  UNIQUE KEY uq_deliv_version (deliverable_id, version_number),
  FOREIGN KEY (deliverable_id) REFERENCES eng_deliverables(id),
  FOREIGN KEY (submitted_by_id) REFERENCES core_users(id),
  FOREIGN KEY (reviewed_by_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO core_modules VALUES ('engineering','Engineering and Graphic Deliverables',UTC_TIMESTAMP());
INSERT INTO core_module_versions VALUES ('engineering',1,UTC_TIMESTAMP());
INSERT INTO core_permissions VALUES
  ('engineering.deliverables.submit','engineering','Upload versioned architectural, graphic, and 3D deliverables'),
  ('engineering.deliverables.review','engineering','Review, approve, or request revisions on Engineering deliverables');
INSERT INTO core_role_permissions VALUES
  ('architect','engineering.deliverables.submit'),
  ('graphic_designer','engineering.deliverables.submit'),
  ('visual_designer_3d','engineering.deliverables.submit'),
  ('ceo','engineering.deliverables.review');

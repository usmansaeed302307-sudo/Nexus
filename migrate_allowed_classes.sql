-- ============================================================
-- MIGRATION: Add allowed_classes column to sub_admins table
-- Run this ONCE on your existing database if you already
-- created the sub_admins table without this column.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

ALTER TABLE sub_admins
  ADD COLUMN IF NOT EXISTS allowed_classes JSON DEFAULT NULL
  COMMENT 'List of class IDs this sub-admin can access (NULL = all classes)';

-- Verify
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'sub_admins'
  AND TABLE_SCHEMA = DATABASE();

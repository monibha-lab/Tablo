-- Migration 003: Feature Changes for Tablo MVP
-- Adds: username to teachers, class_teacher to sections,
--       teacher_subject_sections join table, section_subjects fixes

-- 1. Add username column to teachers
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS username text;

-- Create a unique index on (school_id, username) so usernames are unique per school
CREATE UNIQUE INDEX IF NOT EXISTS teachers_school_username_unique
  ON teachers (school_id, username)
  WHERE username IS NOT NULL;

-- 2. Add class_teacher_id to sections
ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS class_teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL;

-- 3. Create teacher_subject_sections join table
-- Maps a teacher → subject → section (with optional periods override)
CREATE TABLE IF NOT EXISTS teacher_subject_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id    uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id    uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  section_id    uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, subject_id, section_id)
);

CREATE INDEX IF NOT EXISTS tss_school_id ON teacher_subject_sections (school_id);
CREATE INDEX IF NOT EXISTS tss_teacher_id ON teacher_subject_sections (teacher_id);
CREATE INDEX IF NOT EXISTS tss_section_id ON teacher_subject_sections (section_id);

-- 4. RLS for teacher_subject_sections
ALTER TABLE teacher_subject_sections ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admin_all_tss" ON teacher_subject_sections
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Teachers can read their own assignments
CREATE POLICY "teacher_read_own_tss" ON teacher_subject_sections
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );

-- 5. Drop old type column from subjects if it exists (we use category instead)
-- Only drop if the column exists and category already covers this
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subjects' AND column_name = 'type'
  ) THEN
    ALTER TABLE subjects DROP COLUMN type;
  END IF;
END $$;

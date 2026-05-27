-- Migration 005: grade_subjects table + teacher_subject_sections RLS

-- grade_subjects: which subjects are taught in each grade
CREATE TABLE IF NOT EXISTS grade_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  grade_id uuid NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  periods_per_week integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  UNIQUE (grade_id, subject_id)
);

ALTER TABLE grade_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_grade_subjects" ON grade_subjects
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_grade_subjects" ON grade_subjects
  FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- teacher_subject_sections: which sections a teacher covers for a given subject
ALTER TABLE teacher_subject_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_teacher_subject_sections" ON teacher_subject_sections
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_teacher_subject_sections" ON teacher_subject_sections
  FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Make teachers.email nullable (teachers can use auto-generated internal addresses)
ALTER TABLE teachers ALTER COLUMN email DROP NOT NULL;

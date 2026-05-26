-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- schools
CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- terms
CREATE TABLE terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- bell_schedules
CREATE TABLE bell_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_start time NOT NULL,
  school_end time NOT NULL,
  period_duration_minutes integer NOT NULL,
  periods_per_day integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- period_slots
CREATE TABLE period_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bell_schedule_id uuid NOT NULL REFERENCES bell_schedules(id) ON DELETE CASCADE,
  slot_number integer NOT NULL,
  label text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_break boolean DEFAULT false,
  is_assembly boolean DEFAULT false,
  applies_to_days integer[] DEFAULT '{1,2,3,4,5}'
);

-- rooms
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('classroom','lab','sports','library','auditorium','other')) DEFAULT 'classroom',
  max_simultaneous_use integer DEFAULT 1
);

-- teachers
CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  max_periods_per_day integer DEFAULT 6,
  is_active boolean DEFAULT true,
  notification_push boolean DEFAULT true,
  notification_email boolean DEFAULT true,
  dnd_start time,
  dnd_end time,
  created_at timestamptz DEFAULT now()
);

-- subjects
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('academic','lab','sports','elective','homeroom')) DEFAULT 'academic',
  color_hex text DEFAULT '#E8E0D0'
);

-- grades
CREATE TABLE grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0
);

-- sections
CREATE TABLE sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  name text NOT NULL,
  class_teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  class_teacher_period_first boolean DEFAULT false
);

-- teacher_subjects
CREATE TABLE teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  grade_id uuid NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  UNIQUE(teacher_id, subject_id, grade_id)
);

-- section_subjects
CREATE TABLE section_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  periods_per_week integer NOT NULL DEFAULT 1,
  allow_double_periods boolean DEFAULT false,
  max_double_periods_per_week integer DEFAULT 1,
  UNIQUE(section_id, subject_id)
);

-- fixed_periods
CREATE TABLE fixed_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  applies_to text CHECK (applies_to IN ('section','grade','school')) NOT NULL,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  grade_id uuid REFERENCES grades(id) ON DELETE CASCADE,
  day_of_week integer,
  slot_number integer,
  is_last_period boolean DEFAULT false,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  label text
);

-- combined_classes
CREATE TABLE combined_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL
);

-- combined_class_sections
CREATE TABLE combined_class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combined_class_id uuid NOT NULL REFERENCES combined_classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE(combined_class_id, section_id)
);

-- elective_blocks
CREATE TABLE elective_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  day_of_week integer NOT NULL,
  slot_number integer NOT NULL
);

-- elective_offerings
CREATE TABLE elective_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elective_block_id uuid NOT NULL REFERENCES elective_blocks(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL
);

-- elective_enrollments
CREATE TABLE elective_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elective_block_id uuid NOT NULL REFERENCES elective_blocks(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  offering_id uuid REFERENCES elective_offerings(id) ON DELETE SET NULL,
  UNIQUE(elective_block_id, section_id)
);

-- timetables
CREATE TABLE timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  label text DEFAULT 'Timetable',
  is_published boolean DEFAULT false,
  is_active boolean DEFAULT false,
  generated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  created_by uuid REFERENCES teachers(id) ON DELETE SET NULL
);

-- timetable_slots
CREATE TABLE timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id uuid NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  slot_number integer NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  is_double_period boolean DEFAULT false,
  is_fixed boolean DEFAULT false,
  is_combined boolean DEFAULT false,
  combined_class_id uuid REFERENCES combined_classes(id) ON DELETE SET NULL,
  is_elective boolean DEFAULT false,
  elective_offering_id uuid REFERENCES elective_offerings(id) ON DELETE SET NULL,
  is_locked boolean DEFAULT false
);

-- teacher_absences
CREATE TABLE teacher_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, date)
);

-- substitution_requests
CREATE TABLE substitution_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_slot_id uuid NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
  date date NOT NULL,
  absent_teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  status text CHECK (status IN ('open','filled','cancelled','escalated')) DEFAULT 'open',
  note_for_sub text,
  created_at timestamptz DEFAULT now()
);

-- substitution_assignments
CREATE TABLE substitution_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES substitution_requests(id) ON DELETE CASCADE,
  substitute_teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  status text CHECK (status IN ('accepted','withdrawn')) NOT NULL,
  accepted_at timestamptz,
  withdrawn_at timestamptz
);

-- period_unavailabilities
CREATE TABLE period_unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  timetable_slot_id uuid NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
  date date NOT NULL,
  note_for_sub text,
  status text CHECK (status IN ('open','filled','cancelled')) DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

-- admin_events
CREATE TABLE admin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  start_slot integer NOT NULL,
  end_slot integer NOT NULL,
  applies_to text CHECK (applies_to IN ('sections','grade','school')) NOT NULL,
  grade_id uuid REFERENCES grades(id) ON DELETE SET NULL,
  location text,
  created_by uuid REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- admin_event_sections
CREATE TABLE admin_event_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES admin_events(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE
);

-- notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- push_subscriptions
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- timetable_edits
CREATE TABLE timetable_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id uuid NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz DEFAULT now()
);

-- timetable_snapshots
CREATE TABLE timetable_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id uuid NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  snapshot_data jsonb NOT NULL,
  label text,
  created_at timestamptz DEFAULT now()
);

-- share_links
CREATE TABLE share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  timetable_id uuid NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- holidays
CREATE TABLE holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  date date NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, date)
);

-- Indexes
CREATE INDEX idx_terms_school_id ON terms(school_id);
CREATE INDEX idx_timetable_slots_timetable_id ON timetable_slots(timetable_id);
CREATE INDEX idx_timetable_slots_section_id ON timetable_slots(section_id);
CREATE INDEX idx_timetable_slots_teacher_id ON timetable_slots(teacher_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_substitution_requests_status ON substitution_requests(status);
CREATE INDEX idx_teacher_absences_date ON teacher_absences(date);

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bell_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE combined_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE combined_class_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE elective_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE elective_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE elective_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_unavailabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_event_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- schools: admins can manage, authenticated users can read their school
CREATE POLICY "admins_manage_schools" ON schools
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_schools" ON schools
  FOR SELECT USING (auth.role() = 'authenticated');

-- teachers: own row readable/updatable by matching user_id; admin manages all
CREATE POLICY "teachers_read_own" ON teachers
  FOR SELECT USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "teachers_update_own" ON teachers
  FOR UPDATE USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admins_insert_teachers" ON teachers
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admins_delete_teachers" ON teachers
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- timetable_slots: readable by authenticated, writable by admin
CREATE POLICY "authenticated_read_slots" ON timetable_slots
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_slots" ON timetable_slots
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- notifications: users read/update only their own
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- push_subscriptions: users manage own
CREATE POLICY "users_own_push_subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- substitution_requests: readable by all teachers, insertable by absent teacher or admin
CREATE POLICY "authenticated_read_sub_requests" ON substitution_requests
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert_sub_requests" ON substitution_requests
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'role' = 'admin' OR
      absent_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "admins_update_sub_requests" ON substitution_requests
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- substitution_assignments: insertable by any teacher, updatable by same or admin
CREATE POLICY "authenticated_read_sub_assignments" ON substitution_assignments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert_sub_assignments" ON substitution_assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "teachers_update_own_assignment" ON substitution_assignments
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    substitute_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  );

-- Generic read policies for all other tables (authenticated school members)
CREATE POLICY "authenticated_read_terms" ON terms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_terms" ON terms FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_bell_schedules" ON bell_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_bell_schedules" ON bell_schedules FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_period_slots" ON period_slots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_period_slots" ON period_slots FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_rooms" ON rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_rooms" ON rooms FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_subjects" ON subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_subjects" ON subjects FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_grades" ON grades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_grades" ON grades FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_sections" ON sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_sections" ON sections FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_teacher_subjects" ON teacher_subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_teacher_subjects" ON teacher_subjects FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_section_subjects" ON section_subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_section_subjects" ON section_subjects FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_fixed_periods" ON fixed_periods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_fixed_periods" ON fixed_periods FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_combined_classes" ON combined_classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_combined_classes" ON combined_classes FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_combined_class_sections" ON combined_class_sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_combined_class_sections" ON combined_class_sections FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_elective_blocks" ON elective_blocks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_elective_blocks" ON elective_blocks FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_elective_offerings" ON elective_offerings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_elective_offerings" ON elective_offerings FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_elective_enrollments" ON elective_enrollments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_elective_enrollments" ON elective_enrollments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_timetables" ON timetables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_timetables" ON timetables FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_teacher_absences" ON teacher_absences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert_absences" ON teacher_absences
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'role' = 'admin' OR
      teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "authenticated_read_period_unavailabilities" ON period_unavailabilities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert_period_unavailabilities" ON period_unavailabilities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_admin_events" ON admin_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_admin_events" ON admin_events FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_admin_event_sections" ON admin_event_sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_admin_event_sections" ON admin_event_sections FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_timetable_edits" ON timetable_edits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_timetable_edits" ON timetable_edits FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_timetable_snapshots" ON timetable_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_timetable_snapshots" ON timetable_snapshots FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "public_read_share_links" ON share_links FOR SELECT USING (true);
CREATE POLICY "admins_write_share_links" ON share_links FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "authenticated_read_holidays" ON holidays FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_holidays" ON holidays FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

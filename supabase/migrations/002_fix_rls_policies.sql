-- Fix RLS policies: role check must use user_metadata

DROP POLICY IF EXISTS "admins_manage_schools" ON schools;
DROP POLICY IF EXISTS "authenticated_read_schools" ON schools;
DROP POLICY IF EXISTS "teachers_read_own" ON teachers;
DROP POLICY IF EXISTS "teachers_update_own" ON teachers;
DROP POLICY IF EXISTS "admins_insert_teachers" ON teachers;
DROP POLICY IF EXISTS "admins_delete_teachers" ON teachers;
DROP POLICY IF EXISTS "authenticated_read_slots" ON timetable_slots;
DROP POLICY IF EXISTS "admins_write_slots" ON timetable_slots;
DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_own_push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "authenticated_read_sub_requests" ON substitution_requests;
DROP POLICY IF EXISTS "teachers_insert_sub_requests" ON substitution_requests;
DROP POLICY IF EXISTS "admins_update_sub_requests" ON substitution_requests;
DROP POLICY IF EXISTS "authenticated_read_sub_assignments" ON substitution_assignments;
DROP POLICY IF EXISTS "teachers_insert_sub_assignments" ON substitution_assignments;
DROP POLICY IF EXISTS "teachers_update_own_assignment" ON substitution_assignments;
DROP POLICY IF EXISTS "authenticated_read_terms" ON terms;
DROP POLICY IF EXISTS "admins_write_terms" ON terms;
DROP POLICY IF EXISTS "authenticated_read_bell_schedules" ON bell_schedules;
DROP POLICY IF EXISTS "admins_write_bell_schedules" ON bell_schedules;
DROP POLICY IF EXISTS "authenticated_read_period_slots" ON period_slots;
DROP POLICY IF EXISTS "admins_write_period_slots" ON period_slots;
DROP POLICY IF EXISTS "authenticated_read_rooms" ON rooms;
DROP POLICY IF EXISTS "admins_write_rooms" ON rooms;
DROP POLICY IF EXISTS "authenticated_read_subjects" ON subjects;
DROP POLICY IF EXISTS "admins_write_subjects" ON subjects;
DROP POLICY IF EXISTS "authenticated_read_grades" ON grades;
DROP POLICY IF EXISTS "admins_write_grades" ON grades;
DROP POLICY IF EXISTS "authenticated_read_sections" ON sections;
DROP POLICY IF EXISTS "admins_write_sections" ON sections;
DROP POLICY IF EXISTS "authenticated_read_teacher_subjects" ON teacher_subjects;
DROP POLICY IF EXISTS "admins_write_teacher_subjects" ON teacher_subjects;
DROP POLICY IF EXISTS "authenticated_read_section_subjects" ON section_subjects;
DROP POLICY IF EXISTS "admins_write_section_subjects" ON section_subjects;
DROP POLICY IF EXISTS "authenticated_read_fixed_periods" ON fixed_periods;
DROP POLICY IF EXISTS "admins_write_fixed_periods" ON fixed_periods;
DROP POLICY IF EXISTS "authenticated_read_combined_classes" ON combined_classes;
DROP POLICY IF EXISTS "admins_write_combined_classes" ON combined_classes;
DROP POLICY IF EXISTS "authenticated_read_combined_class_sections" ON combined_class_sections;
DROP POLICY IF EXISTS "admins_write_combined_class_sections" ON combined_class_sections;
DROP POLICY IF EXISTS "authenticated_read_elective_blocks" ON elective_blocks;
DROP POLICY IF EXISTS "admins_write_elective_blocks" ON elective_blocks;
DROP POLICY IF EXISTS "authenticated_read_elective_offerings" ON elective_offerings;
DROP POLICY IF EXISTS "admins_write_elective_offerings" ON elective_offerings;
DROP POLICY IF EXISTS "authenticated_read_elective_enrollments" ON elective_enrollments;
DROP POLICY IF EXISTS "admins_write_elective_enrollments" ON elective_enrollments;
DROP POLICY IF EXISTS "authenticated_read_timetables" ON timetables;
DROP POLICY IF EXISTS "admins_write_timetables" ON timetables;
DROP POLICY IF EXISTS "authenticated_read_teacher_absences" ON teacher_absences;
DROP POLICY IF EXISTS "teachers_insert_absences" ON teacher_absences;
DROP POLICY IF EXISTS "authenticated_read_period_unavailabilities" ON period_unavailabilities;
DROP POLICY IF EXISTS "teachers_insert_period_unavailabilities" ON period_unavailabilities;
DROP POLICY IF EXISTS "authenticated_read_admin_events" ON admin_events;
DROP POLICY IF EXISTS "admins_write_admin_events" ON admin_events;
DROP POLICY IF EXISTS "authenticated_read_admin_event_sections" ON admin_event_sections;
DROP POLICY IF EXISTS "admins_write_admin_event_sections" ON admin_event_sections;
DROP POLICY IF EXISTS "authenticated_read_timetable_edits" ON timetable_edits;
DROP POLICY IF EXISTS "admins_write_timetable_edits" ON timetable_edits;
DROP POLICY IF EXISTS "authenticated_read_timetable_snapshots" ON timetable_snapshots;
DROP POLICY IF EXISTS "admins_write_timetable_snapshots" ON timetable_snapshots;
DROP POLICY IF EXISTS "public_read_share_links" ON share_links;
DROP POLICY IF EXISTS "admins_write_share_links" ON share_links;
DROP POLICY IF EXISTS "authenticated_read_holidays" ON holidays;
DROP POLICY IF EXISTS "admins_write_holidays" ON holidays;

CREATE POLICY "admins_manage_schools" ON schools
  FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_schools" ON schools
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_read_own" ON teachers
  FOR SELECT USING (user_id = auth.uid() OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "teachers_update_own" ON teachers
  FOR UPDATE USING (user_id = auth.uid() OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admins_insert_teachers" ON teachers
  FOR INSERT WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "admins_delete_teachers" ON teachers
  FOR DELETE USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_slots" ON timetable_slots
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_slots" ON timetable_slots
  FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_push_subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "authenticated_read_sub_requests" ON substitution_requests
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert_sub_requests" ON substitution_requests
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
      absent_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "admins_update_sub_requests" ON substitution_requests
  FOR UPDATE USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_sub_assignments" ON substitution_assignments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert_sub_assignments" ON substitution_assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "teachers_update_own_assignment" ON substitution_assignments
  FOR UPDATE USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    substitute_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  );
CREATE POLICY "authenticated_read_terms" ON terms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_terms" ON terms FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_bell_schedules" ON bell_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_bell_schedules" ON bell_schedules FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_period_slots" ON period_slots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_period_slots" ON period_slots FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_rooms" ON rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_rooms" ON rooms FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_subjects" ON subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_subjects" ON subjects FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_grades" ON grades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_grades" ON grades FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_sections" ON sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_sections" ON sections FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_teacher_subjects" ON teacher_subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_teacher_subjects" ON teacher_subjects FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_section_subjects" ON section_subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_section_subjects" ON section_subjects FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_fixed_periods" ON fixed_periods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_fixed_periods" ON fixed_periods FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_combined_classes" ON combined_classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_combined_classes" ON combined_classes FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_combined_class_sections" ON combined_class_sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_combined_class_sections" ON combined_class_sections FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_elective_blocks" ON elective_blocks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_elective_blocks" ON elective_blocks FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_elective_offerings" ON elective_offerings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_elective_offerings" ON elective_offerings FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_elective_enrollments" ON elective_enrollments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_elective_enrollments" ON elective_enrollments FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_timetables" ON timetables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_timetables" ON timetables FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_teacher_absences" ON teacher_absences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert_absences" ON teacher_absences
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
      teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "authenticated_read_period_unavailabilities" ON period_unavailabilities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teachers_insert_period_unavailabilities" ON period_unavailabilities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read_admin_events" ON admin_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_admin_events" ON admin_events FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_admin_event_sections" ON admin_event_sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_admin_event_sections" ON admin_event_sections FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_timetable_edits" ON timetable_edits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_timetable_edits" ON timetable_edits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read_timetable_snapshots" ON timetable_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_timetable_snapshots" ON timetable_snapshots FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "public_read_share_links" ON share_links FOR SELECT USING (true);
CREATE POLICY "admins_write_share_links" ON share_links FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "authenticated_read_holidays" ON holidays FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write_holidays" ON holidays FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

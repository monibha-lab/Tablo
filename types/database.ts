export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          created_at?: string | null
        }
      }
      terms: {
        Row: {
          id: string
          school_id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string | null
        }
      }
      bell_schedules: {
        Row: {
          id: string
          school_id: string
          school_start: string
          school_end: string
          period_duration_minutes: number
          periods_per_day: number
          created_at: string | null
        }
        Insert: {
          id?: string
          school_id: string
          school_start: string
          school_end: string
          period_duration_minutes: number
          periods_per_day: number
          created_at?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          school_start?: string
          school_end?: string
          period_duration_minutes?: number
          periods_per_day?: number
          created_at?: string | null
        }
      }
      period_slots: {
        Row: {
          id: string
          bell_schedule_id: string
          slot_number: number
          label: string
          start_time: string
          end_time: string
          is_break: boolean
          is_assembly: boolean
          applies_to_days: number[]
        }
        Insert: {
          id?: string
          bell_schedule_id: string
          slot_number: number
          label: string
          start_time: string
          end_time: string
          is_break?: boolean
          is_assembly?: boolean
          applies_to_days?: number[]
        }
        Update: {
          id?: string
          bell_schedule_id?: string
          slot_number?: number
          label?: string
          start_time?: string
          end_time?: string
          is_break?: boolean
          is_assembly?: boolean
          applies_to_days?: number[]
        }
      }
      rooms: {
        Row: {
          id: string
          school_id: string
          name: string
          type: 'classroom' | 'lab' | 'sports' | 'library' | 'auditorium' | 'other'
          max_simultaneous_use: number
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          type?: 'classroom' | 'lab' | 'sports' | 'library' | 'auditorium' | 'other'
          max_simultaneous_use?: number
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          type?: 'classroom' | 'lab' | 'sports' | 'library' | 'auditorium' | 'other'
          max_simultaneous_use?: number
        }
      }
      teachers: {
        Row: {
          id: string
          user_id: string | null
          school_id: string
          name: string
          email: string
          max_periods_per_day: number
          is_active: boolean
          notification_push: boolean
          notification_email: boolean
          dnd_start: string | null
          dnd_end: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          school_id: string
          name: string
          email: string
          max_periods_per_day?: number
          is_active?: boolean
          notification_push?: boolean
          notification_email?: boolean
          dnd_start?: string | null
          dnd_end?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          school_id?: string
          name?: string
          email?: string
          max_periods_per_day?: number
          is_active?: boolean
          notification_push?: boolean
          notification_email?: boolean
          dnd_start?: string | null
          dnd_end?: string | null
          created_at?: string | null
        }
      }
      subjects: {
        Row: {
          id: string
          school_id: string
          name: string
          type: 'academic' | 'lab' | 'sports' | 'elective' | 'homeroom'
          color_hex: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          type?: 'academic' | 'lab' | 'sports' | 'elective' | 'homeroom'
          color_hex?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          type?: 'academic' | 'lab' | 'sports' | 'elective' | 'homeroom'
          color_hex?: string
        }
      }
      grades: {
        Row: {
          id: string
          school_id: string
          name: string
          order_index: number
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          order_index?: number
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          order_index?: number
        }
      }
      sections: {
        Row: {
          id: string
          grade_id: string
          name: string
          class_teacher_id: string | null
          class_teacher_period_first: boolean
        }
        Insert: {
          id?: string
          grade_id: string
          name: string
          class_teacher_id?: string | null
          class_teacher_period_first?: boolean
        }
        Update: {
          id?: string
          grade_id?: string
          name?: string
          class_teacher_id?: string | null
          class_teacher_period_first?: boolean
        }
      }
      teacher_subjects: {
        Row: {
          id: string
          teacher_id: string
          subject_id: string
          grade_id: string
        }
        Insert: {
          id?: string
          teacher_id: string
          subject_id: string
          grade_id: string
        }
        Update: {
          id?: string
          teacher_id?: string
          subject_id?: string
          grade_id?: string
        }
      }
      section_subjects: {
        Row: {
          id: string
          section_id: string
          subject_id: string
          periods_per_week: number
          allow_double_periods: boolean
          max_double_periods_per_week: number
        }
        Insert: {
          id?: string
          section_id: string
          subject_id: string
          periods_per_week?: number
          allow_double_periods?: boolean
          max_double_periods_per_week?: number
        }
        Update: {
          id?: string
          section_id?: string
          subject_id?: string
          periods_per_week?: number
          allow_double_periods?: boolean
          max_double_periods_per_week?: number
        }
      }
      fixed_periods: {
        Row: {
          id: string
          school_id: string
          applies_to: 'section' | 'grade' | 'school'
          section_id: string | null
          grade_id: string | null
          day_of_week: number | null
          slot_number: number | null
          is_last_period: boolean
          subject_id: string | null
          teacher_id: string | null
          room_id: string | null
          label: string | null
        }
        Insert: {
          id?: string
          school_id: string
          applies_to: 'section' | 'grade' | 'school'
          section_id?: string | null
          grade_id?: string | null
          day_of_week?: number | null
          slot_number?: number | null
          is_last_period?: boolean
          subject_id?: string | null
          teacher_id?: string | null
          room_id?: string | null
          label?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          applies_to?: 'section' | 'grade' | 'school'
          section_id?: string | null
          grade_id?: string | null
          day_of_week?: number | null
          slot_number?: number | null
          is_last_period?: boolean
          subject_id?: string | null
          teacher_id?: string | null
          room_id?: string | null
          label?: string | null
        }
      }
      combined_classes: {
        Row: {
          id: string
          school_id: string
          name: string
          room_id: string | null
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          room_id?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          room_id?: string | null
        }
      }
      combined_class_sections: {
        Row: {
          id: string
          combined_class_id: string
          section_id: string
        }
        Insert: {
          id?: string
          combined_class_id: string
          section_id: string
        }
        Update: {
          id?: string
          combined_class_id?: string
          section_id?: string
        }
      }
      elective_blocks: {
        Row: {
          id: string
          school_id: string
          name: string
          day_of_week: number
          slot_number: number
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          day_of_week: number
          slot_number: number
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          day_of_week?: number
          slot_number?: number
        }
      }
      elective_offerings: {
        Row: {
          id: string
          elective_block_id: string
          subject_id: string
          teacher_id: string | null
          room_id: string | null
        }
        Insert: {
          id?: string
          elective_block_id: string
          subject_id: string
          teacher_id?: string | null
          room_id?: string | null
        }
        Update: {
          id?: string
          elective_block_id?: string
          subject_id?: string
          teacher_id?: string | null
          room_id?: string | null
        }
      }
      elective_enrollments: {
        Row: {
          id: string
          elective_block_id: string
          section_id: string
          offering_id: string | null
        }
        Insert: {
          id?: string
          elective_block_id: string
          section_id: string
          offering_id?: string | null
        }
        Update: {
          id?: string
          elective_block_id?: string
          section_id?: string
          offering_id?: string | null
        }
      }
      timetables: {
        Row: {
          id: string
          school_id: string
          term_id: string
          label: string
          is_published: boolean
          is_active: boolean
          generated_at: string | null
          published_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          school_id: string
          term_id: string
          label?: string
          is_published?: boolean
          is_active?: boolean
          generated_at?: string | null
          published_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          term_id?: string
          label?: string
          is_published?: boolean
          is_active?: boolean
          generated_at?: string | null
          published_at?: string | null
          created_by?: string | null
        }
      }
      timetable_slots: {
        Row: {
          id: string
          timetable_id: string
          section_id: string
          day_of_week: number
          slot_number: number
          subject_id: string | null
          teacher_id: string | null
          room_id: string | null
          is_double_period: boolean
          is_fixed: boolean
          is_combined: boolean
          combined_class_id: string | null
          is_elective: boolean
          elective_offering_id: string | null
          is_locked: boolean
        }
        Insert: {
          id?: string
          timetable_id: string
          section_id: string
          day_of_week: number
          slot_number: number
          subject_id?: string | null
          teacher_id?: string | null
          room_id?: string | null
          is_double_period?: boolean
          is_fixed?: boolean
          is_combined?: boolean
          combined_class_id?: string | null
          is_elective?: boolean
          elective_offering_id?: string | null
          is_locked?: boolean
        }
        Update: {
          id?: string
          timetable_id?: string
          section_id?: string
          day_of_week?: number
          slot_number?: number
          subject_id?: string | null
          teacher_id?: string | null
          room_id?: string | null
          is_double_period?: boolean
          is_fixed?: boolean
          is_combined?: boolean
          combined_class_id?: string | null
          is_elective?: boolean
          elective_offering_id?: string | null
          is_locked?: boolean
        }
      }
      teacher_absences: {
        Row: {
          id: string
          teacher_id: string
          date: string
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          teacher_id: string
          date: string
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          teacher_id?: string
          date?: string
          reason?: string | null
          created_at?: string | null
        }
      }
      substitution_requests: {
        Row: {
          id: string
          timetable_slot_id: string
          date: string
          absent_teacher_id: string
          status: 'open' | 'filled' | 'cancelled' | 'escalated'
          note_for_sub: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          timetable_slot_id: string
          date: string
          absent_teacher_id: string
          status?: 'open' | 'filled' | 'cancelled' | 'escalated'
          note_for_sub?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          timetable_slot_id?: string
          date?: string
          absent_teacher_id?: string
          status?: 'open' | 'filled' | 'cancelled' | 'escalated'
          note_for_sub?: string | null
          created_at?: string | null
        }
      }
      substitution_assignments: {
        Row: {
          id: string
          request_id: string
          substitute_teacher_id: string
          status: 'accepted' | 'withdrawn'
          accepted_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          substitute_teacher_id: string
          status: 'accepted' | 'withdrawn'
          accepted_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          substitute_teacher_id?: string
          status?: 'accepted' | 'withdrawn'
          accepted_at?: string | null
          withdrawn_at?: string | null
        }
      }
      period_unavailabilities: {
        Row: {
          id: string
          teacher_id: string
          timetable_slot_id: string
          date: string
          note_for_sub: string | null
          status: 'open' | 'filled' | 'cancelled'
          created_at: string | null
        }
        Insert: {
          id?: string
          teacher_id: string
          timetable_slot_id: string
          date: string
          note_for_sub?: string | null
          status?: 'open' | 'filled' | 'cancelled'
          created_at?: string | null
        }
        Update: {
          id?: string
          teacher_id?: string
          timetable_slot_id?: string
          date?: string
          note_for_sub?: string | null
          status?: 'open' | 'filled' | 'cancelled'
          created_at?: string | null
        }
      }
      admin_events: {
        Row: {
          id: string
          school_id: string
          title: string
          date: string
          start_slot: number
          end_slot: number
          applies_to: 'sections' | 'grade' | 'school'
          grade_id: string | null
          location: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          school_id: string
          title: string
          date: string
          start_slot: number
          end_slot: number
          applies_to: 'sections' | 'grade' | 'school'
          grade_id?: string | null
          location?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          title?: string
          date?: string
          start_slot?: number
          end_slot?: number
          applies_to?: 'sections' | 'grade' | 'school'
          grade_id?: string | null
          location?: string | null
          created_by?: string | null
          created_at?: string | null
        }
      }
      admin_event_sections: {
        Row: {
          id: string
          event_id: string
          section_id: string
        }
        Insert: {
          id?: string
          event_id: string
          section_id: string
        }
        Update: {
          id?: string
          event_id?: string
          section_id?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          data: Json | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          data?: Json | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          data?: Json | null
          read_at?: string | null
          created_at?: string | null
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string | null
        }
      }
      timetable_edits: {
        Row: {
          id: string
          timetable_id: string
          slot_id: string
          changed_by: string
          field_changed: string
          old_value: Json | null
          new_value: Json | null
          changed_at: string | null
        }
        Insert: {
          id?: string
          timetable_id: string
          slot_id: string
          changed_by: string
          field_changed: string
          old_value?: Json | null
          new_value?: Json | null
          changed_at?: string | null
        }
        Update: {
          id?: string
          timetable_id?: string
          slot_id?: string
          changed_by?: string
          field_changed?: string
          old_value?: Json | null
          new_value?: Json | null
          changed_at?: string | null
        }
      }
      timetable_snapshots: {
        Row: {
          id: string
          timetable_id: string
          snapshot_data: Json
          label: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          timetable_id: string
          snapshot_data: Json
          label?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          timetable_id?: string
          snapshot_data?: Json
          label?: string | null
          created_at?: string | null
        }
      }
      share_links: {
        Row: {
          id: string
          token: string
          section_id: string
          timetable_id: string
          expires_at: string
          created_at: string | null
        }
        Insert: {
          id?: string
          token: string
          section_id: string
          timetable_id: string
          expires_at: string
          created_at?: string | null
        }
        Update: {
          id?: string
          token?: string
          section_id?: string
          timetable_id?: string
          expires_at?: string
          created_at?: string | null
        }
      }
      holidays: {
        Row: {
          id: string
          school_id: string
          date: string
          name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          school_id: string
          date: string
          name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          school_id?: string
          date?: string
          name?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

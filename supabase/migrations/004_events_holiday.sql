-- Migration 004: Add holiday flag and section_ids array to admin_events

ALTER TABLE admin_events
  ADD COLUMN IF NOT EXISTS is_holiday boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS section_ids uuid[];

-- Allow start_slot / end_slot to be NULL for holidays
ALTER TABLE admin_events
  ALTER COLUMN start_slot DROP NOT NULL,
  ALTER COLUMN end_slot DROP NOT NULL;

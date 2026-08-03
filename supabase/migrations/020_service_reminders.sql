-- 020: Reminder bookkeeping for the daily Service Desk cron.
-- Each reminder is sent at most once, ever; these timestamps are the guard.

-- "Still time to share your experience" nudge, 3 days after an unanswered
-- deliberate service request (source = 'service' only).
alter table service_requests add column if not exists reminder_sent_at timestamptz;

-- "Did they resolve it?" nudge, 7 days after a resolution offer the customer
-- has not answered.
alter table service_cases add column if not exists confirm_reminder_sent_at timestamptz;

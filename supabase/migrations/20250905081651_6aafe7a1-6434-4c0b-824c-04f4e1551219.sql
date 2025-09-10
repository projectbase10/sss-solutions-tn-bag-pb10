
-- 1) Backfill month from date where missing
UPDATE public.attendance
SET month = to_char(date, 'YYYY-MM')
WHERE month IS NULL;

-- 2) Normalize records where "month" (YYYY-MM) doesn't match the stored "date" month
--    Move those records into the correct month by setting date to the first day of that month.
UPDATE public.attendance
SET date = to_date(month || '-01', 'YYYY-MM-DD')
WHERE month IS NOT NULL
  AND to_char(date, 'YYYY-MM') <> month;

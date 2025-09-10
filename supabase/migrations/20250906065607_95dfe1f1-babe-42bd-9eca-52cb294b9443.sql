
-- 1) Deduplicate monthly attendance rows (keep the latest per employee_id, month)
WITH ranked AS (
  SELECT
    id,
    employee_id,
    month,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY employee_id, month
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.attendance
  WHERE month IS NOT NULL
)
DELETE FROM public.attendance a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

-- 2) Add a partial unique index to prevent future duplicates
--    This index only applies when month IS NOT NULL, so daily rows (with month NULL) are allowed.
CREATE UNIQUE INDEX IF NOT EXISTS attendance_employee_month_unique
  ON public.attendance (employee_id, month)
  WHERE month IS NOT NULL;

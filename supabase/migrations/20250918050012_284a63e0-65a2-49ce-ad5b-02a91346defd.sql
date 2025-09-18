-- Add missing columns to attendance table for comprehensive attendance tracking
ALTER TABLE public.attendance 
ADD COLUMN present_days numeric DEFAULT 0,
ADD COLUMN absent_days numeric DEFAULT 0,
ADD COLUMN late_days numeric DEFAULT 0,
ADD COLUMN ot_hours numeric DEFAULT 0,
ADD COLUMN food numeric DEFAULT 0,
ADD COLUMN uniform numeric DEFAULT 0,
ADD COLUMN rent_deduction numeric DEFAULT 0,
ADD COLUMN advance numeric DEFAULT 0,
ADD COLUMN deduction numeric DEFAULT 0,
ADD COLUMN month text;

-- Add missing columns to payroll table for enhanced payroll features
ALTER TABLE public.payroll
ADD COLUMN worked_days numeric DEFAULT 30,
ADD COLUMN net_pay numeric DEFAULT 0,
ADD COLUMN gross_earnings numeric DEFAULT 0,
ADD COLUMN gross_pay numeric DEFAULT 0,
ADD COLUMN pf_12_percent numeric DEFAULT 0,
ADD COLUMN esi_0_75_percent numeric DEFAULT 0,
ADD COLUMN ot_amount numeric DEFAULT 0,
ADD COLUMN take_home numeric DEFAULT 0,
ADD COLUMN food numeric DEFAULT 0,
ADD COLUMN uniform numeric DEFAULT 0,
ADD COLUMN lunch numeric DEFAULT 0,
ADD COLUMN deductions numeric DEFAULT 0,
ADD COLUMN pf_number text,
ADD COLUMN esi_number text,
ADD COLUMN status text DEFAULT 'draft';
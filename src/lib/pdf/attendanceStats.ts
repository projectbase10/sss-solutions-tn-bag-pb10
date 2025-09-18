import { supabase } from '@/integrations/supabase/client';

export interface AttendanceStats {
  employee_id: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  ot_hours: number;
  food: number;
  uniform: number;
  rent_deduction: number;
  advance: number;
}

export const fetchAttendanceStats = async (selectedMonth: string): Promise<Record<string, AttendanceStats>> => {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const startOfMonth = formatLocalDate(new Date(year, month - 1, 1));
  const endOfMonth = formatLocalDate(new Date(year, month, 0));

  console.log('=== Attendance Stats Debug ===');
  console.log('Selected month:', selectedMonth);
  console.log('Date range:', startOfMonth, 'to', endOfMonth);

  const { data, error } = await supabase
    .from('attendance')
    .select('employee_id, status, check_in_time, check_out_time, notes, overtime_hours')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth);

  if (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }

  console.log('Raw attendance data:', data);
  console.log('Number of attendance records:', data?.length || 0);

  const employeeStats: Record<string, AttendanceStats> = {};

  data.forEach(record => {
    if (!employeeStats[record.employee_id]) {
      employeeStats[record.employee_id] = {
        employee_id: record.employee_id,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        ot_hours: 0,
        food: 0,
        uniform: 0,
        rent_deduction: 0,
        advance: 0,
      };
    }

    const stats = employeeStats[record.employee_id];

    // First try to parse from notes (for manual entries with JSON data)
    try {
      if (record.notes && record.status === 'present') {
        const parsedNotes = JSON.parse(record.notes);
        if (parsedNotes.present_days !== undefined) {
          stats.present_days += parsedNotes.present_days || 0;
          stats.absent_days += parsedNotes.absent_days || 0;
          stats.late_days += parsedNotes.late_days || 0;
          stats.ot_hours += parsedNotes.ot_hours || 0;
          stats.food += parsedNotes.food || 0;
          stats.uniform += parsedNotes.uniform || 0;
          stats.rent_deduction += parsedNotes.rent_deduction || 0;
          stats.advance += parsedNotes.advance || 0;
          return;
        }
      }
    } catch (e) {
      // If JSON parsing fails, fall back to counting individual records
    }

    // Count individual records based on status
    switch (record.status) {
      case 'present':
        stats.present_days++;
        break;
      case 'absent':
        stats.absent_days++;
        break;
      case 'late':
        stats.late_days++;
        break;
    }

    // Add overtime hours from the database field
    if (record.overtime_hours) {
      stats.ot_hours += Number(record.overtime_hours);
    }

    // Calculate OT hours based on check-in/check-out times if not already in overtime_hours
    if (!record.overtime_hours && record.check_in_time && record.check_out_time) {
      const checkIn = new Date(`1970-01-01T${record.check_in_time}`);
      const checkOut = new Date(`1970-01-01T${record.check_out_time}`);
      const workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      
      if (workHours > 8) {
        stats.ot_hours += (workHours - 8);
      }
    }
  });

  console.log('Processed employee stats:', employeeStats);
  console.log('Number of employees with stats:', Object.keys(employeeStats).length);
  console.log('===============================');

  return employeeStats;
};
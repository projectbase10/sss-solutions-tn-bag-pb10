
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import ExportDialog from './ExportDialog';

const AttendanceExcelExport: React.FC = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const { data: attendanceData = [] } = useQuery({
    queryKey: ['attendanceExport'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees (
            name,
            employee_id,
            pf_number,
            esi_number,
            per_day_salary,
            day_rate,
            basic_salary,
            da_amount,
            branch_id,
            rent_deduction,
            shoe_uniform_allowance,
            branches (name)
          )
        `);
      if (error) throw error;
      return data;
    }
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employeesForExport'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const handleExport = async (month: string, format: 'excel' | 'pdf', branchId?: string) => {
    if (format === 'excel') {
      await exportToExcel(month, branchId);
    }
    setShowExportDialog(false);
  };

  const getEmployeePerDaySalary = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return 0;
    
    // Priority: per_day_salary -> day_rate -> calculated from basic + da
    if (employee.per_day_salary && employee.per_day_salary > 0) {
      return employee.per_day_salary;
    }
    
    if (employee.day_rate && employee.day_rate > 0) {
      return employee.day_rate;
    }
    
    // Fallback: calculate from basic_salary + da_amount
    const basicSalary = employee.basic_salary || 0;
    const daAmount = employee.da_amount || 0;
    return basicSalary + daAmount;
  };

  const exportToExcel = async (exportMonth: string, branchId?: string) => {
    try {
      // Fetch attendance stats for the selected month directly with ALL needed columns
      const { data: monthAttendanceData } = await supabase
        .from('attendance')
        .select('employee_id, status, date, present_days, absent_days, late_days, notes')
        .gte('date', `${exportMonth}-01`)
        .lte('date', `${exportMonth}-31`);

      // Calculate present days per employee using CORRECT 3-priority logic
      // This matches the same logic used in payroll calculations
      const attendanceStats: Record<string, { present_days: number }> = {};
      
      if (monthAttendanceData && Array.isArray(monthAttendanceData)) {
        monthAttendanceData.forEach((record: any) => {
          if (!attendanceStats[record.employee_id]) {
            attendanceStats[record.employee_id] = { present_days: 0 };
          }
          
          // PRIORITY 1: Direct column value (present_days) - if it exists, use it
          const directPresent = Number(record.present_days) || 0;
          
          if (directPresent > 0) {
            // Accumulate direct column value (for records that have aggregate data)
            attendanceStats[record.employee_id].present_days += directPresent;
          } else if (record.notes) {
            // PRIORITY 2: Parse from notes JSON field
            try {
              const parsedNotes = JSON.parse(record.notes);
              const notesPresent = Number(parsedNotes.present_days) || 0;
              if (notesPresent > 0) {
                // Use notes value (this is typically an aggregate already)
                attendanceStats[record.employee_id].present_days = notesPresent;
              } else if (record.status === 'present') {
                // PRIORITY 3: Fallback to status count
                attendanceStats[record.employee_id].present_days += 1;
              }
            } catch (e) {
              // PRIORITY 3: Fallback to status count if JSON parse fails
              if (record.status === 'present') {
                attendanceStats[record.employee_id].present_days += 1;
              }
            }
          } else if (record.status === 'present') {
            // PRIORITY 3: Fallback to status count
            attendanceStats[record.employee_id].present_days += 1;
          }
        });
      }

      console.log('Attendance stats for month:', exportMonth, attendanceStats);

      let filteredData = attendanceData;
      
      if (exportMonth) {
        filteredData = filteredData.filter(record => 
          (record.date && record.date.startsWith(exportMonth))
        );
      }

      if (branchId) {
        filteredData = filteredData.filter(record => 
          record.employees?.branch_id === branchId
        );
      }

      // Get branch info for ESI calculation logic
      const selectedBranch = branches.find(b => b.id === branchId);
      const isSpecialESIBranch = selectedBranch && ['UP-TN', 'UP-BAG'].includes(selectedBranch.name);

      // Group attendance records by employee to create one row per employee
      const employeeDataMap = new Map<string, any>();
      
      filteredData.forEach(record => {
        const empId = record.employee_id;
        if (!employeeDataMap.has(empId)) {
          employeeDataMap.set(empId, {
            employee_id: empId,
            employees: record.employees,
            total_ot_hours: 0,
            attendance_count: 0
          });
        }
        const empData = employeeDataMap.get(empId);
        empData.total_ot_hours += (record.overtime_hours || 0);
        empData.attendance_count += 1;
      });

      // Convert to array and create Excel data with one row per employee
      const excelData = Array.from(employeeDataMap.values()).map((empData, index) => {
        // Get per_day_salary using the improved logic for ALL employees
        const perDaySalary = getEmployeePerDaySalary(empData.employee_id);
        
        console.log(`Employee ${empData.employees?.name}: Per Day Salary = ${perDaySalary}`);
        
        // FIXED CALCULATION: Use the formula specified by user for ALL employees with EXACT precision
        // basic salary = perday salary * 0.60
        // da salary = perday salary * 0.40
        const basicSalary = perDaySalary * 0.60;
        const daSalary = perDaySalary * 0.40;
        
        // Get ACTUAL worked days from attendance stats (present days)
        const employeeStats = attendanceStats[empData.employee_id];
        const workedDays = employeeStats?.present_days || 0;
        const otHours = empData.total_ot_hours;
        
        console.log(`Employee ${empData.employees?.name}: Actual Worked Days = ${workedDays}`);
        
        // FIXED CALCULATION: Use the formula specified by user for ALL employees with EXACT precision
        // basic salary earned = basic salary * worked days
        // da earned = da * worked days
        const basicEarned = basicSalary * workedDays;
        const daEarned = daSalary * workedDays;
        
        const extraHours = otHours * 60;
        const grossEarnings = basicEarned + daEarned + extraHours;
        
        // PF calculation (12% of basic + DA earned, max 1800) - keep rounding for PF only
        const pfAmount = Math.min(Math.round((basicEarned + daEarned) * 0.12), 1800);
        
        // ESI calculation - Basic + DA only (OT excluded)
        const esiBaseAmount = basicEarned + daEarned;
        const esiAmount = esiBaseAmount > 21000 ? 0 : Math.round(esiBaseAmount * 0.0075);
        
        // Get deductions from employee record
        const rentDeduction = Math.round(empData.employees?.rent_deduction || 0);
        const advance = 0; // Not available in attendance table
        const food = 0; // Not available in attendance table
        const shoeUniformAllowance = Math.round(empData.employees?.shoe_uniform_allowance || 0);
        
        const totalDeduction = pfAmount + esiAmount + rentDeduction + advance + food - shoeUniformAllowance;
        const takeHome = grossEarnings - totalDeduction + extraHours;

        return {
          'Sl. No': index + 1,
          'EMP. No': empData.employees?.employee_id || '',
          'Name of the Employee': empData.employees?.name || '',
          'PF.No': empData.employees?.pf_number || '',
          'ESI.No': empData.employees?.esi_number || '',
          'Worked Days': workedDays,
          'OT Hrs': otHours,
          'Per Day Salary': perDaySalary,
          'Basic': basicSalary, // This is 60% of per day salary for ALL employees
          'DA': daSalary, // This is 40% of per day salary for ALL employees
          'Basic Earned': basicEarned, // Basic * worked days for ALL employees
          'DA Earned': daEarned, // DA * worked days for ALL employees
          'Extra Hours': extraHours,
          'Gross Earnings': grossEarnings,
          'PF 12%': pfAmount,
          'ESI 0.75%': esiAmount,
          'Rent': rentDeduction,
          'Advance': advance,
          'Food': food,
          'Shoe & Uniform': shoeUniformAllowance,
          'Take Home': takeHome,
          'Month': exportMonth,
          'Branch': empData.employees?.branches?.name || 'N/A'
        };
      });

      if (excelData.length === 0) {
        toast({
          title: "No Data",
          description: "No attendance records found for the selected month.",
          variant: "destructive"
        });
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 5 },   // Sl No
        { wch: 10 },  // Emp No
        { wch: 25 },  // Name
        { wch: 15 },  // PF No
        { wch: 15 },  // ESI No
        { wch: 12 },  // Worked Days
        { wch: 10 },  // OT Hours
        { wch: 15 },  // Per Day Salary
        { wch: 12 },  // Basic (60% of per day)
        { wch: 10 },  // DA (40% of per day)
        { wch: 12 },  // Basic Earned
        { wch: 10 },  // DA Earned
        { wch: 12 },  // Extra Hours
        { wch: 15 },  // Gross Earnings
        { wch: 10 },  // PF
        { wch: 10 },  // ESI
        { wch: 10 },  // Rent
        { wch: 10 },  // Advance
        { wch: 10 },  // Food
        { wch: 15 },  // Shoe & Uniform
        { wch: 15 },  // Take Home
        { wch: 12 },  // Month
        { wch: 10 },  // Status
        { wch: 12 },  // Date
        { wch: 15 }   // Branch
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

      let title = `ATTENDANCE REPORT FOR THE MONTH OF ${exportMonth?.toUpperCase() || 'ALL MONTHS'}`;
      if (isSpecialESIBranch) {
        title += ` (${selectedBranch?.name} - ESI: Basic + DA only)`;
      }
      
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
      
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }];

      const dataRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = dataRange.e.r; R >= 1; --R) {
        for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
          const new_cell_address = XLSX.utils.encode_cell({ r: R + 2, c: C });
          if (ws[cell_address]) {
            ws[new_cell_address] = ws[cell_address];
            delete ws[cell_address];
          }
        }
      }

      ws['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: dataRange.e.r + 2, c: dataRange.e.c }
      });

      const branchSuffix = selectedBranch ? `_${selectedBranch.name}` : '';
      const fileName = `Attendance_Report_All_Employees_Fixed${branchSuffix}_${exportMonth || 'All_Months'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Export Successful",
        description: `Attendance report exported successfully for ALL EMPLOYEES with FIXED calculations: Basic = Per Day × 60%, DA = Per Day × 40%`,
      });

    } catch (error) {
      console.error('Error exporting attendance to Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button 
        onClick={() => setShowExportDialog(true)}
        variant="outline" 
        className="bg-green-600 text-white hover:bg-green-700"
      >
        <Download className="h-4 w-4 mr-2" />
        Export Attendance Report
      </Button>
      
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        title="Export Attendance Report"
        description="Select month and format to export attendance report with FIXED salary calculations for ALL EMPLOYEES (Basic = 60% × Per Day, DA = 40% × Per Day)"
      />
    </>
  );
};

export default AttendanceExcelExport;

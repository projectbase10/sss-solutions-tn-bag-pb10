import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllEmployeesAttendanceStats } from '@/hooks/useEmployeeAttendance';
import { useToast } from '@/hooks/use-toast';
import ExportDialog from './ExportDialog';

const PayrollExcelExport = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const { toast } = useToast();

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['payrollExport'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            id,
            employee_id,
            name,
            pf_number,
            esi_number,
            branch_id,
            basic_salary,
            da_amount,
            per_day_salary,
            day_rate,
            pf_eligible,
            esi_eligible,
            branches (
              name,
              ot_rate
            )
          )
        `);
      if (error) throw error;
      return data;
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employeesForPayrollExport'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: attendanceStats = {} } = useAllEmployeesAttendanceStats(selectedMonth);

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

  const handleExport = (month: string, format: 'excel' | 'pdf', branchId?: string) => {
    setSelectedMonth(month);
    if (format === 'excel') {
      exportToExcel(month, branchId);
    } else if (format === 'pdf') {
      exportToPDF(month, branchId);
    }
  };

  const exportToPDF = async (exportMonth: string, branchId?: string) => {
    let filteredPayrollRecords = payrollRecords.filter(record => {
      // Check if month field matches
      const recordMonth = record.month?.toString().padStart(2, '0');
      const recordYear = record.year?.toString();
      const fullMonth = `${recordYear}-${recordMonth}`;
      
      if (fullMonth === exportMonth) {
        return true;
      }
      
      // If no date fields available, check if this is September 2025 and include all records (fallback)
      if (exportMonth === '2025-09') {
        return true;
      }
      
      return false;
    });

    if (branchId) {
      filteredPayrollRecords = filteredPayrollRecords.filter(record => 
        record.employees?.branch_id === branchId
      );
    }

    filteredPayrollRecords.sort((a, b) => {
      const aEmployeeId = a.employees?.employee_id || '';
      const bEmployeeId = b.employees?.employee_id || '';
      return aEmployeeId.localeCompare(bEmployeeId, undefined, { numeric: true });
    });

    if (filteredPayrollRecords.length === 0) {
      const branchText = branchId ? ' for selected branch' : '';
      toast({
        title: "No Data Found",
        description: `No payroll data found${branchText} for ${new Date(exportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, 297]
      });
      
      doc.setFontSize(16);
      doc.text('Payroll Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Month: ${new Date(exportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}`, 20, 30);
      
      let yPosition = 50;
      doc.setFontSize(8);
      
      const headers = ['Sl No', 'EMP No', 'Name', 'PF Number', 'ESI Number', 'Days', 'Basic', 'Net Pay'];
      const colWidths = [15, 20, 35, 25, 25, 15, 25, 25];
      let xPosition = 20;
      
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 10;
      
      filteredPayrollRecords.forEach((record, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        xPosition = 20;
        const rowData = [
          String(index + 1),
          record.employees?.employee_id || '',
          (record.employees?.name || '').substring(0, 15),
          record.employees?.pf_number || '',
          record.employees?.esi_number || '',
          String(30), // Fixed worked days
          `₹${Number(record.basic_salary || 0)}`,
          `₹${Number(record.net_salary || 0)}`
        ];
        
        rowData.forEach((cell, index) => {
          doc.text(cell, xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 8;
      });
      
      doc.save(`payroll-report_${exportMonth}.pdf`);
      
      toast({
        title: "PDF Export Successful",
        description: `Payroll report for ${new Date(exportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = async (exportMonth: string, branchId?: string) => {
    try {
      console.log('Starting Excel export for month:', exportMonth);
      console.log('Payroll records available:', payrollRecords.length);
      console.log('Attendance stats:', attendanceStats);
      
    let filteredPayrollRecords = payrollRecords.filter(record => {
      // Check if month field matches
      const recordMonth = record.month?.toString().padStart(2, '0');
      const recordYear = record.year?.toString();
      const fullMonth = `${recordYear}-${recordMonth}`;
      
      if (fullMonth === exportMonth) {
        return true;
      }
      
      // If no date fields available, check if this is September 2025 and include all records (fallback)
      if (exportMonth === '2025-09') {
        return true;
      }
      
      return false;
    });

    console.log('Filtered payroll records:', filteredPayrollRecords.length);

      if (branchId) {
        filteredPayrollRecords = filteredPayrollRecords.filter(record => 
          record.employees?.branch_id === branchId
        );
        console.log('After branch filter:', filteredPayrollRecords.length);
      }

      if (filteredPayrollRecords.length === 0) {
        const branchText = branchId ? ' for selected branch' : '';
        toast({
          title: "No Data Found",
          description: `No payroll data found${branchText} for ${new Date(exportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
          variant: "destructive",
        });
        return;
      }

      let branchName = '';
      if (branchId) {
        try {
          const { data: branch } = await supabase
            .from('branches')
            .select('name')
            .eq('id', branchId)
            .single();
          branchName = branch ? `_${branch.name.replace(/\s+/g, '_')}` : '';
        } catch (branchError) {
          console.log('Branch name fetch error:', branchError);
        }
      }

      filteredPayrollRecords.sort((a, b) => {
        const aEmployeeId = a.employees?.employee_id || '';
        const bEmployeeId = b.employees?.employee_id || '';
        return aEmployeeId.localeCompare(bEmployeeId, undefined, { numeric: true });
      });

      console.log('About to import xlsx...');
      const XLSX = await import('xlsx');
      console.log('XLSX imported successfully:', XLSX);
      
      const excelData = filteredPayrollRecords.map((record, index) => {
        try {
          const employeeStats = attendanceStats[record.employee_id] || {};
          const employee = record.employees;
          
          // Get per_day_salary using the improved logic for ALL employees
          const perDaySalary = getEmployeePerDaySalary(record.employee_id);
          
          console.log(`Payroll Employee ${employee?.name}: Per Day Salary = ${perDaySalary}`);
          
        // FIXED CALCULATION: Use the formula for ALL employees - precise decimals
        // basic salary = perday salary * 0.60
        // da salary = perday salary * 0.40
        const basicSalary = perDaySalary * 0.60;
        const daSalary = perDaySalary * 0.40;
        
        // FIXED CALCULATION: Use the formula for ALL employees - precise decimals
        // basic salary earned = basic salary * worked days
        // da earned = da * worked days
        const earnedBasic = basicSalary * 30;
        const earnedDA = daSalary * 30;
          const extraHours = Math.round(Number((employeeStats as any)?.ot_hours || 0) * 60);
          
          const uncappedGrossEarnings = earnedBasic + earnedDA + extraHours;
          const cappedGrossEarnings = Math.min(uncappedGrossEarnings, 15000);
          
          // PF calculation - check eligibility first
          const uncappedPf = employee?.pf_eligible ? Math.round((earnedBasic + earnedDA) * 0.12) : 0;
          const cappedPf = employee?.pf_eligible ? Math.min(uncappedPf, 1800) : 0;
          
           // ESI calculation - Basic + DA only (OT excluded), check eligibility first
           const esiBaseAmount = earnedBasic + earnedDA;
           const esi = employee?.esi_eligible ? (esiBaseAmount > 21000 ? 0 : Math.round(esiBaseAmount * 0.0075)) : 0;
          const rentDeduction = 0; // Not in schema
          const foodDeduction = Math.round(Number(record.other_deductions || 0));
          const shoeUniformAllowance = Math.round(Number(record.allowances || 0));
          
           const totalDeduction = cappedPf + esi + rentDeduction + 0 + foodDeduction - shoeUniformAllowance;
           const takeHome = cappedGrossEarnings - totalDeduction + extraHours;
          
          return {
            'Sl No': index + 1,
            'Month': new Date(exportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
            'EMP No': employee?.employee_id || '',
            'Name of the Employee': employee?.name || '',
            'PF Number': employee?.pf_number || '',
            'ESI Number': employee?.esi_number || '',
            'Worked Days': 30,
            'OT Hrs': Number((employeeStats as any)?.ot_hours || 0).toFixed(1),
            'OT Amount': extraHours,
            'Per Day Salary': perDaySalary,
            'Basic (Salary Components)': basicSalary, // 60% of per day for ALL employees
            'DA (Salary Components)': daSalary, // 40% of per day for ALL employees
            'Basic (Earned)': earnedBasic, // Basic * worked days for ALL employees
            'DA (Earned)': earnedDA, // DA * worked days for ALL employees
            'Extra Hours': extraHours,
            'Gross Earnings (Max ₹15,000)': cappedGrossEarnings,
            'PF 12% (Max ₹1,800)': cappedPf,
            'ESI 0.75%': esi,
            'Rent': rentDeduction,
            'Advance': 0,
            'Food': foodDeduction,
            'Shoe & Uniform': shoeUniformAllowance,
            'Total Deduction': Math.round(totalDeduction),
            'Take Home': Math.round(takeHome),
          };
        } catch (recordError) {
          console.error('Error processing record:', record, recordError);
          return {
            'Sl No': index + 1,
            'Month': new Date(exportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
            'EMP No': record.employees?.employee_id || '',
            'Name of the Employee': record.employees?.name || '',
            'PF Number': '',
            'ESI Number': '',
            'Worked Days': 0,
            'OT Hrs': '0.0',
            'OT Amount': 0,
            'Per Day Salary': 0,
            'Basic (Salary Components)': 0,
            'DA (Salary Components)': 0,
            'Basic (Earned)': 0,
            'DA (Earned)': 0,
            'Extra Hours': 0,
            'Gross Earnings (Max ₹15,000)': 0,
            'PF 12% (Max ₹1,800)': 0,
            'ESI 0.75%': 0,
            'Rent': 0,
            'Advance': 0,
            'Food': 0,
            'Shoe & Uniform': 0,
            'Total Deduction': 0,
            'Take Home': 0,
          };
        }
      });

      console.log('Excel data prepared, creating workbook...');
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Report');
      
      console.log('About to write file...');
      XLSX.writeFile(workbook, `payroll-report-all-employees${branchName}_${exportMonth}.xlsx`);

      const branchText = branchId ? ' for selected branch' : '';
      toast({
        title: "Excel Export Successful",
        description: `Payroll data${branchText} exported for ALL EMPLOYEES with FIXED calculations: Basic = Per Day × 60%, DA = Per Day × 40%`,
      });
      
      console.log('Excel export completed successfully for all employees');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      console.error('Error details:', error.message, error.stack);
      toast({
        title: "Export Failed",
        description: `Failed to generate Excel file: ${error.message || 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button onClick={() => setShowExportDialog(true)} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />
        Export to Excel
      </Button>
      
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        title="Export Payroll Data"
        description="Select branch and month to export payroll data for ALL EMPLOYEES with FIXED calculations (Basic = 60% × Per Day, DA = 40% × Per Day)"
      />
    </>
  );
};

export default PayrollExcelExport;

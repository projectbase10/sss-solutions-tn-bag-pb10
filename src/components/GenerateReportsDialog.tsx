
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranches } from '@/hooks/useBranches';
import { useAllEmployeesAttendanceStats } from '@/hooks/useEmployeeAttendance';
import { useToast } from '@/hooks/use-toast';
import { Download, Calendar, FileText } from 'lucide-react';
import MonthSelector from './MonthSelector';

interface GenerateReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerateReportsDialog: React.FC<GenerateReportsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [reportType, setReportType] = useState<'pf' | 'esi'>('pf');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const { data: employees = [] } = useEmployees();
  const { data: branches = [] } = useBranches();
  const { data: attendanceStats = {} } = useAllEmployeesAttendanceStats(selectedMonth);
  const { toast } = useToast();

  const generatePFReport = () => {
    // Filter employees by branch and attendance data for the selected month
    const employeesWithData = employees.filter(emp => {
      const stats = attendanceStats[emp.id];
      const branchMatch = selectedBranch === 'all' || emp.branch_id === selectedBranch;
      return stats && (stats.present_days > 0 || stats.ot_hours > 0) && branchMatch;
    });

    if (employeesWithData.length === 0) {
      const branchText = selectedBranch !== 'all' ? ' for selected branch' : '';
      toast({
        title: "No Data Found",
        description: `No employee data found${branchText} for ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
        variant: "destructive"
      });
      return;
    }

    // Create PF report data with calculations
    const pfData = employeesWithData.map((employee, index) => {
      const stats = attendanceStats[employee.id];
      const presentDays = stats?.present_days || 0;
      const otHours = stats?.ot_hours || 0;
      const basicSalary = employee.basic_salary || 0;
      const daAmount = employee.da_amount || 0;
      const branch = branches.find(b => b.id === employee.branch_id);
      
      // Calculate earned amounts based on present days - precise decimals
      const earnedBasic = basicSalary * presentDays;
      const earnedDA = daAmount * presentDays;
      
      // Use branch-specific OT rate or default to 60
      const otRate = employee.is_driver ? (branch?.driver_rate || 60) : (branch?.ot_rate || 60);
      const otAmount = Math.round(otHours * otRate);
      
      // PF calculation: Basic + DA only (excludes OT)
      const pfBasic = earnedBasic + earnedDA;
      const emp12Amount = Math.min(Math.round(pfBasic * 0.12), 1800);
      const employerEPF = Math.round(pfBasic * 0.0833); // 8.33% EPF
      const employerEPS = Math.round(pfBasic * 0.0367); // 3.67% EPS

      return {
        'Emp.No': employee.employee_id || '',
        'Employee Name': employee.name || '',
        'PF NO': employee.pf_number || '',
        'Branch': branch?.name || 'N/A',
        'Days Present': presentDays,
        'Basic+DA': pfBasic,
        'PF.Basic': pfBasic,
        'Emp.12 Amt': emp12Amount,
        'E.P.F': employerEPF,
        'E.P.S': employerEPS,
        'Total Employer': employerEPF + employerEPS
      };
    });

    // Convert to CSV
    const headers = Object.keys(pfData[0] || {});
    const csvContent = [
      headers.join(','),
      ...pfData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Download file with selected month and branch
    const branchName = selectedBranch !== 'all' ? branches.find(b => b.id === selectedBranch)?.name?.replace(/\s+/g, '_') || 'branch' : 'all';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pf_report_${branchName}_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const branchText = selectedBranch !== 'all' ? ` for ${branches.find(b => b.id === selectedBranch)?.name || 'selected branch'}` : '';
    toast({
      title: "PF Report Generated",
      description: `PF report${branchText} for ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })} has been downloaded successfully.`
    });

    onOpenChange(false);
  };

  const generateESIReport = () => {
    // Filter employees by branch and attendance data for the selected month
    const employeesWithData = employees.filter(emp => {
      const stats = attendanceStats[emp.id];
      const branchMatch = selectedBranch === 'all' || emp.branch_id === selectedBranch;
      return stats && (stats.present_days > 0 || stats.ot_hours > 0) && branchMatch;
    });

    if (employeesWithData.length === 0) {
      const branchText = selectedBranch !== 'all' ? ' for selected branch' : '';
      toast({
        title: "No Data Found",
        description: `No employee data found${branchText} for ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
        variant: "destructive"
      });
      return;
    }

    // Create ESI report data with calculations
    const esiData = employeesWithData.map((employee, index) => {
      const stats = attendanceStats[employee.id];
      const presentDays = stats?.present_days || 0;
      const otHours = stats?.ot_hours || 0;
      const basicSalary = employee.basic_salary || 0;
      const daAmount = employee.da_amount || 0;
      const branch = branches.find(b => b.id === employee.branch_id);
      
      // Calculate earned amounts based on present days - precise decimals
      const earnedBasic = basicSalary * presentDays;
      const earnedDA = daAmount * presentDays;
      
      // Use branch-specific OT rate or default to 60
      const otRate = employee.is_driver ? (branch?.driver_rate || 60) : (branch?.ot_rate || 60);
      const otAmount = Math.round(otHours * otRate);
      
      // ESI calculation - Basic + DA only (OT excluded)
      const esiBase = earnedBasic + earnedDA;
      
      // ESI calculation: 0 if base > ₹21,000, otherwise 0.75%
      const employeeESI = esiBase > 21000 ? 0 : Math.round(esiBase * 0.0075);
      const employerESI = esiBase > 21000 ? 0 : Math.round(esiBase * 0.0325);

      return {
        'Emp.No': employee.employee_id || '',
        'Employee Name': employee.name || '',
        'ESI NO': employee.esi_number || '',
        'Branch': branch?.name || 'N/A',
        'Days Present': presentDays,
        'ESI Base': esiBase,
        'Employee ESI (0.75%)': employeeESI,
        'Employer ESI (3.25%)': employerESI,
        'Total ESI': employeeESI + employerESI
      };
    });

    // Convert to CSV
    const headers = Object.keys(esiData[0] || {});
    const csvContent = [
      headers.join(','),
      ...esiData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Download file with selected month and branch
    const branchName = selectedBranch !== 'all' ? branches.find(b => b.id === selectedBranch)?.name?.replace(/\s+/g, '_') || 'branch' : 'all';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `esi_report_${branchName}_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const branchText = selectedBranch !== 'all' ? ` for ${branches.find(b => b.id === selectedBranch)?.name || 'selected branch'}` : '';
    toast({
      title: "ESI Report Generated", 
      description: `ESI report${branchText} for ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })} has been downloaded successfully.`
    });

    onOpenChange(false);
  };

  const handleExportExcel = () => {
    if (!selectedMonth) {
      toast({
        title: "Month Required",
        description: "Please select a month to generate the report.",
        variant: "destructive"
      });
      return;
    }

    if (reportType === 'pf') {
      generatePFReport();
    } else {
      generateESIReport();
    }
  };

  const handleExportPDF = () => {
    if (!selectedMonth) {
      toast({
        title: "Month Required",
        description: "Please select a month to generate the report.",
        variant: "destructive"
      });
      return;
    }

    // For now, use the same logic as Excel export but could be customized for PDF
    if (reportType === 'pf') {
      generatePFReport();
    } else {
      generateESIReport();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Reports</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="month" className="text-sm font-medium mb-2 block">Select Month</Label>
              <MonthSelector
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            </div>
            
            <div>
              <Label htmlFor="branch" className="text-sm font-medium mb-2 block">Select Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reportType" className="text-sm font-medium mb-2 block">Select Report Type</Label>
              <Select value={reportType} onValueChange={(value: 'pf' | 'esi') => setReportType(value)}>
                <SelectTrigger>
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="pf">PF Reports</SelectItem>
                  <SelectItem value="esi">ESI Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleExportExcel}
              disabled={!selectedMonth}
              className="flex-1"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={!selectedMonth}
              className="flex-1 bg-gray-500 hover:bg-gray-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportsDialog;

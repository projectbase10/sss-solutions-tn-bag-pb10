import React, { useState, useMemo } from 'react';
import { Clock, Plus, Download, Calendar, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAttendance, useCreateAttendance, useAttendanceStats } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranches } from '@/hooks/useBranches';
import { useAllEmployeesAttendanceStats } from '@/hooks/useEmployeeAttendance';
import { useToast } from '@/hooks/use-toast';
import MetricCard from '@/components/MetricCard';
import AttendanceExcelExport from '@/components/AttendanceExcelExport';
import DynamicOTLabel from '@/components/DynamicOTLabel';

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: '',
    branch_id: '',
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7),
    status: 'present' as 'present' | 'absent' | 'late' | 'on_leave',
    check_in_time: '',
    check_out_time: '',
    notes: '',
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    ot_hours: 0,
    food: 0,
    uniform: 0,
    rent_deduction: 0,
    advance: 0
  });

  const { data: attendance = [] } = useAttendance(selectedDate);
  const { data: attendanceStats } = useAttendanceStats();
  const { data: employees = [] } = useEmployees();
  const { data: branches = [] } = useBranches();
  const { data: allEmployeesStats = {} } = useAllEmployeesAttendanceStats(selectedMonth);
  const createAttendance = useCreateAttendance();
  const { toast } = useToast();

  // Filter employees by selected branch
  const filteredEmployees = useMemo(() => {
    if (selectedBranch === 'all') return employees;
    return employees.filter(emp => emp.branch_id === selectedBranch);
  }, [employees, selectedBranch]);

  const handleAddAttendance = async () => {
    try {
      if (!attendanceForm.employee_id) {
        toast({
          title: "Error",
          description: "Please select an employee.",
          variant: "destructive",
        });
        return;
      }

      // Get employee's branch_id
      const selectedEmployee = employees.find(emp => emp.id === attendanceForm.employee_id);
      const branchId = selectedEmployee?.branch_id || attendanceForm.branch_id;

      if (!branchId || branchId === 'all') {
        toast({
          title: "Error",
          description: "Employee must be assigned to a valid branch.",
          variant: "destructive",
        });
        return;
      }

      // Create attendance record with monthly summary data
      const attendanceData = {
        employee_id: attendanceForm.employee_id,
        branch_id: branchId,
        date: attendanceForm.date,
        month: attendanceForm.month,
        status: attendanceForm.status,
        check_in_time: attendanceForm.check_in_time || null,
        check_out_time: attendanceForm.check_out_time || null,
        present_days: attendanceForm.present_days,
        absent_days: attendanceForm.absent_days,
        late_days: attendanceForm.late_days,
        overtime_hours: attendanceForm.ot_hours,
        food: attendanceForm.food,
        uniform: attendanceForm.uniform,
        rent_deduction: attendanceForm.rent_deduction,
        advance: attendanceForm.advance,
        notes: JSON.stringify({
          present_days: attendanceForm.present_days,
          absent_days: attendanceForm.absent_days,
          late_days: attendanceForm.late_days,
          ot_hours: attendanceForm.ot_hours,
          food: attendanceForm.food,
          uniform: attendanceForm.uniform,
          rent_deduction: attendanceForm.rent_deduction,
          advance: attendanceForm.advance
        })
      };

      await createAttendance.mutateAsync(attendanceData);

      setShowAddDialog(false);
      setAttendanceForm({
        employee_id: '',
        branch_id: '',
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().slice(0, 7),
        status: 'present',
        check_in_time: '',
        check_out_time: '',
        notes: '',
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        ot_hours: 0,
        food: 0,
        uniform: 0,
        rent_deduction: 0,
        advance: 0
      });

      toast({
        title: "Success!",
        description: "Attendance record added successfully.",
      });
    } catch (error) {
      console.error('Error adding attendance:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['present_days', 'absent_days', 'late_days', 'ot_hours', 'food', 'uniform', 'rent_deduction', 'advance'];
    
    setAttendanceForm(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setAttendanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <div className="flex space-x-4">
          <AttendanceExcelExport />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Monthly Attendance Summary</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee">Employee *</Label>
                    <Select value={attendanceForm.employee_id} onValueChange={(value) => handleSelectChange('employee_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.employee_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="month">Month *</Label>
                    <Input
                      id="month"
                      name="month"
                      type="month"
                      value={attendanceForm.month}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="present_days">Present Days</Label>
                    <Input
                      id="present_days"
                      name="present_days"
                      type="number"
                      value={attendanceForm.present_days}
                      onChange={handleInputChange}
                      min="0"
                      max="31"
                    />
                  </div>
                  <div>
                    <Label htmlFor="absent_days">Absent Days</Label>
                    <Input
                      id="absent_days"
                      name="absent_days"
                      type="number"
                      value={attendanceForm.absent_days}
                      onChange={handleInputChange}
                      min="0"
                      max="31"
                    />
                  </div>
                  <div>
                    <Label htmlFor="late_days">Late Days</Label>
                    <Input
                      id="late_days"
                      name="late_days"
                      type="number"
                      value={attendanceForm.late_days}
                      onChange={handleInputChange}
                      min="0"
                      max="31"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ot_hours">
                      <DynamicOTLabel branchId={attendanceForm.branch_id} />
                    </Label>
                    <Input
                      id="ot_hours"
                      name="ot_hours"
                      type="number"
                      step="0.5"
                      value={attendanceForm.ot_hours}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={attendanceForm.status} onValueChange={(value: 'present' | 'absent' | 'late' | 'on_leave') => handleSelectChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="food">Food</Label>
                    <Input
                      id="food"
                      name="food"
                      type="number"
                      value={attendanceForm.food}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="uniform">Uniform</Label>
                    <Input
                      id="uniform"
                      name="uniform"
                      type="number"
                      value={attendanceForm.uniform}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rent_deduction">Rent Deduction</Label>
                    <Input
                      id="rent_deduction"
                      name="rent_deduction"
                      type="number"
                      value={attendanceForm.rent_deduction}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="advance">Advance</Label>
                    <Input
                      id="advance"
                      name="advance"
                      type="number"
                      value={attendanceForm.advance}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={attendanceForm.notes}
                    onChange={handleInputChange}
                    placeholder="Enter any additional notes..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddAttendance} className="w-full" disabled={createAttendance.isPending}>
                  {createAttendance.isPending ? 'Adding...' : 'Add Attendance Record'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Present Today"
          value={attendanceStats?.present || 0}
          icon={Users}
          color="green"
          subtitle={`${attendanceStats?.presentPercentage || 0}% attendance`}
        />
        <MetricCard
          title="Absent Today"
          value={attendanceStats?.absent || 0}
          icon={AlertCircle}
          color="red"
        />
        <MetricCard
          title="Late Today"
          value={attendanceStats?.late || 0}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="On Leave"
          value={attendanceStats?.on_leave || 0}
          icon={Calendar}
          color="blue"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="month-filter">Month (for stats)</Label>
              <Input
                id="month-filter"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="branch-filter">Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance Summary ({new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-center">Present Days</TableHead>
                <TableHead className="text-center">Absent Days</TableHead>
                <TableHead className="text-center">Late Days</TableHead>
                <TableHead className="text-center">
                  <DynamicOTLabel branchId={selectedBranch !== 'all' ? selectedBranch : undefined} />
                </TableHead>
                <TableHead className="text-center">Food</TableHead>
                <TableHead className="text-center">Uniform</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map(employee => {
                const stats = allEmployeesStats[employee.id] || {
                  present_days: 0,
                  absent_days: 0,
                  late_days: 0,
                  ot_hours: 0,
                  food: 0,
                  uniform: 0
                };

                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{employee.employee_id}</TableCell>
                    <TableCell>
                      {employee.branches && (
                        <Badge variant="secondary" className="text-xs">
                          {employee.branches.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        {stats.present_days}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold text-red-600">
                        {stats.absent_days}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold text-yellow-600">
                        {stats.late_days}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold text-blue-600">
                        {stats.ot_hours?.toFixed(1) || '0.0'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold text-purple-600">
                        {stats.food || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold text-orange-600">
                        {stats.uniform || 0}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Daily Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Records ({selectedDate})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map(record => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.employees?.name}</div>
                    <div className="text-sm text-gray-500">{record.employees?.employee_id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      record.status === 'present' ? 'default' :
                      record.status === 'late' ? 'secondary' :
                      'destructive'
                    }>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.check_in_time || '-'}</TableCell>
                  <TableCell>{record.check_out_time || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {attendance.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No attendance records found for {selectedDate}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
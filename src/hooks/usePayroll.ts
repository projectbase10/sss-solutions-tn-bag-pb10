
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  da_amount?: number | null;
  hra: number;
  allowances: number;
  overtime_amount?: number | null;
  advance_deduction?: number | null;
  esi_deduction?: number | null;
  pf_deduction?: number | null;
  esi_employee_deduction?: number | null;
  esi_employer_contribution?: number | null;
  other_deductions?: number | null;
  total_deductions?: number | null;
  gross_salary?: number | null;
  net_salary?: number | null;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  employees?: {
    name: string;
    employee_id: string;
    pf_number?: string | null;
    esi_number?: string | null;
    branch_id?: string | null;
    da_rate?: number | null;
    day_rate?: number | null;
    rent_deduction?: number | null;
    shoe_uniform_allowance?: number | null;
  };
}

export const usePayroll = () => {
  return useQuery({
    queryKey: ['payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select('*, employees(name, employee_id, pf_number, esi_number, branch_id)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PayrollRecord[];
    },
  });
};

export const usePayrollStats = () => {
  return useQuery({
    queryKey: ['payroll-stats'],
    queryFn: async () => {
      console.log('Fetching payroll stats...');
      const { data, error } = await supabase
        .from('payroll')
        .select('net_salary');
      
      if (error) {
        console.error('Error fetching payroll stats:', error);
        throw error;
      }

      const stats = {
        totalPayroll: data.reduce((sum, record) => sum + (record.net_salary || 0), 0),
        processedCount: 0, // Payroll table doesn't have status field
        pendingCount: 0, // Payroll table doesn't have status field
        totalEmployees: data.length,
      };

      console.log('Payroll stats:', stats);
      return stats;
    },
  });
};

export const useCreatePayroll = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (payrollData: Omit<PayrollRecord, 'id' | 'created_at' | 'updated_at' | 'employees'>) => {
      const { data, error } = await supabase
        .from('payroll')
        .insert([payrollData])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] });
      toast({
        title: "Success!",
        description: "Payroll record created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to create payroll record. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePayroll = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PayrollRecord> }) => {
      const { data, error } = await supabase
        .from('payroll')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] });
      toast({
        title: "Success!",
        description: "Payroll record updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll record. Please try again.",
        variant: "destructive",
      });
    },
  });
};

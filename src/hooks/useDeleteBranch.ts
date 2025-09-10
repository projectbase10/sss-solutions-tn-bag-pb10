import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (branchId: string) => {
      // First, delete all employees associated with this branch
      const { error: employeesError } = await supabase
        .from('employees')
        .delete()
        .eq('branch_id', branchId);
      
      if (employeesError) throw employeesError;
      
      // Then delete the branch itself
      const { error: branchError } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);
      
      if (branchError) throw branchError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Success!",
        description: "Branch and all associated employees deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting branch:', error);
      toast({
        title: "Error",
        description: "Failed to delete branch and employees. Please try again.",
        variant: "destructive",
      });
    },
  });
};
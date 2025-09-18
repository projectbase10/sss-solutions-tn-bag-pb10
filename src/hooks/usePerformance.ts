
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period: string;
  overall_score: number;
  goals_progress: any;
  strengths: string | null;
  areas_for_improvement: string | null;
  status: string;
  review_date: string;
  created_at: string;
  updated_at: string;
  employees: {
    name: string;
    employee_id: string;
  };
  reviewer: {
    name: string;
  };
}

export interface Goal {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  target_date: string;
  progress: number;
  status: string;
  created_at: string;
  updated_at: string;
  employees: {
    name: string;
    employee_id: string;
  };
}

export const usePerformanceReviews = () => {
  return useQuery({
    queryKey: ['performance-reviews'],
    queryFn: async () => {
      // Note: performance_reviews table doesn't exist in schema, using employees as fallback
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return [] as PerformanceReview[]; // Return empty array since table doesn't exist
    },
  });
};

export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      // Note: goals table doesn't exist in schema, using employees as fallback
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return [] as Goal[]; // Return empty array since table doesn't exist
    },
  });
};

export const usePerformanceStats = () => {
  return useQuery({
    queryKey: ['performance-stats'],
    queryFn: async () => {
      // Mock data since tables don't exist
      const reviewsResult = { data: [], error: null };
      const goalsResult = { data: [], error: null };
      
      if (reviewsResult.error) throw reviewsResult.error;
      if (goalsResult.error) throw goalsResult.error;
      
      const completedReviews = reviewsResult.data.filter(r => r.status === 'completed');
      const averageScore = completedReviews.length > 0 
        ? completedReviews.reduce((sum, r) => sum + r.overall_score, 0) / completedReviews.length 
        : 0;
      
      const completedGoals = goalsResult.data.filter(g => g.status === 'completed').length;
      const pendingReviews = reviewsResult.data.filter(r => r.status === 'draft').length;
      const topPerformers = completedReviews.filter(r => r.overall_score >= 4.5).length;
      
      return {
        averageScore: averageScore.toFixed(1),
        completedGoals,
        pendingReviews,
        topPerformers,
      };
    },
  });
};

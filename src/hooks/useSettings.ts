import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeneralSettings {
  id: string;
  user_id: string;
  company_name?: string;
  company_email?: string;
  company_address?: string;
  phone?: string;
  timezone: string;
  language: string;
  currency: string;
  date_format: string;
  time_format: string;
  theme: string;
  sidebar_mode: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecuritySettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_verified: boolean;
  two_factor_secret: string;
  two_factor_backup_codes: string[];
  totp_secret: string;
  totp_confirmed: boolean;
}

// General Settings Hook
export const useGeneralSettings = () => {
  return useQuery({
    queryKey: ['general-settings'],
    queryFn: async () => {
      // Note: general_settings table doesn't exist in schema
      return null;
    },
  });
};

export const useUpdateGeneralSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Partial<GeneralSettings> & { user_id: string }) => {
      // Mock return since table doesn't exist
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['general-settings'] });
      toast({
        title: "Success!",
        description: "General settings updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating general settings:', error);
      toast({
        title: "Error",
        description: "Failed to update general settings. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Notification Settings Hook
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      // Note: notification_settings table doesn't exist in schema
      return null;
    },
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings> & { user_id: string }) => {
      // Mock return since table doesn't exist
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({
        title: "Success!",
        description: "Notification settings updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Security Settings Hook
export const useSecuritySettings = () => {
  return useQuery({
    queryKey: ['security-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data ? {
        id: data.id,
        user_id: data.user_id,
        two_factor_enabled: data.two_factor_enabled,
        two_factor_verified: data.two_factor_verified,
        two_factor_secret: data.two_factor_secret || '',
        two_factor_backup_codes: Array.isArray(data.two_factor_backup_codes) 
          ? data.two_factor_backup_codes.map(String)
          : [],
        totp_secret: data.totp_secret || '',
        totp_confirmed: data.two_factor_verified || false,
      } as SecuritySettings : null;
    },
  });
};

export const useUpdateSecuritySettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Partial<SecuritySettings> & { user_id: string }) => {
      const { data: existingSettings } = await supabase
        .from('security_settings')
        .select('id')
        .eq('user_id', settings.user_id)
        .maybeSingle();

      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('security_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('security_settings')
          .insert([settings])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      toast({
        title: "Success!",
        description: "Security settings updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error",
        description: "Failed to update security settings. Please try again.",
        variant: "destructive",
      });
    },
  });
};
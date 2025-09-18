export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          absent_days: number | null
          advance: number | null
          branch_id: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          deduction: number | null
          employee_id: string
          food: number | null
          hours_worked: number | null
          id: string
          late_days: number | null
          month: string | null
          notes: string | null
          ot_hours: number | null
          overtime_hours: number | null
          present_days: number | null
          rent_deduction: number | null
          status: string | null
          uniform: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          absent_days?: number | null
          advance?: number | null
          branch_id: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          deduction?: number | null
          employee_id: string
          food?: number | null
          hours_worked?: number | null
          id?: string
          late_days?: number | null
          month?: string | null
          notes?: string | null
          ot_hours?: number | null
          overtime_hours?: number | null
          present_days?: number | null
          rent_deduction?: number | null
          status?: string | null
          uniform?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          absent_days?: number | null
          advance?: number | null
          branch_id?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          deduction?: number | null
          employee_id?: string
          food?: number | null
          hours_worked?: number | null
          id?: string
          late_days?: number | null
          month?: string | null
          notes?: string | null
          ot_hours?: number | null
          overtime_hours?: number | null
          present_days?: number | null
          rent_deduction?: number | null
          status?: string | null
          uniform?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          departments: Json | null
          driver_enabled: boolean | null
          driver_rate: number | null
          email: string | null
          id: string
          manager: string | null
          name: string
          ot_rate: number | null
          phone: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          departments?: Json | null
          driver_enabled?: boolean | null
          driver_rate?: number | null
          email?: string | null
          id?: string
          manager?: string | null
          name: string
          ot_rate?: number | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          departments?: Json | null
          driver_enabled?: boolean | null
          driver_rate?: number | null
          email?: string | null
          id?: string
          manager?: string | null
          name?: string
          ot_rate?: number | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          document_name: string
          document_type: string
          employee_id: string
          file_url: string
          id: string
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          document_name: string
          document_type: string
          employee_id: string
          file_url: string
          id?: string
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string
          employee_id?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          aadhar_card: string | null
          account_number: string | null
          advance: number | null
          allowances: number | null
          avatar_url: string | null
          bank_name: string | null
          basic_salary: number | null
          basic_salary_percentage: number | null
          branch_id: string | null
          branch_name: string | null
          contract_name: string | null
          conveyance: number | null
          created_at: string
          da_amount: number | null
          da_percentage: number | null
          da_rate: number | null
          date_of_birth: string | null
          day_rate: number | null
          department: string | null
          document_url: string | null
          email: string | null
          employee_id: string
          esi_eligible: boolean | null
          esi_number: string | null
          fathers_name: string | null
          gross_salary: number | null
          hra: number | null
          id: string
          ifsc_code: string | null
          is_driver: boolean | null
          join_date: string
          late_deduction_eligible: boolean | null
          location: string | null
          mode_of_payment: string | null
          name: string
          notes: string | null
          ot_amount: number | null
          other_allowances: number | null
          overtime_eligible: boolean | null
          pan_card: string | null
          per_day_salary: number | null
          pf: number | null
          pf_eligible: boolean | null
          pf_number: string | null
          phone: string | null
          position: string
          rent_deduction: number | null
          row_number: number | null
          shift_code: string | null
          shoe_uniform_allowance: number | null
          status: string | null
          tea_allowance: number | null
          transfer_mode: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aadhar_card?: string | null
          account_number?: string | null
          advance?: number | null
          allowances?: number | null
          avatar_url?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          basic_salary_percentage?: number | null
          branch_id?: string | null
          branch_name?: string | null
          contract_name?: string | null
          conveyance?: number | null
          created_at?: string
          da_amount?: number | null
          da_percentage?: number | null
          da_rate?: number | null
          date_of_birth?: string | null
          day_rate?: number | null
          department?: string | null
          document_url?: string | null
          email?: string | null
          employee_id: string
          esi_eligible?: boolean | null
          esi_number?: string | null
          fathers_name?: string | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          ifsc_code?: string | null
          is_driver?: boolean | null
          join_date: string
          late_deduction_eligible?: boolean | null
          location?: string | null
          mode_of_payment?: string | null
          name: string
          notes?: string | null
          ot_amount?: number | null
          other_allowances?: number | null
          overtime_eligible?: boolean | null
          pan_card?: string | null
          per_day_salary?: number | null
          pf?: number | null
          pf_eligible?: boolean | null
          pf_number?: string | null
          phone?: string | null
          position: string
          rent_deduction?: number | null
          row_number?: number | null
          shift_code?: string | null
          shoe_uniform_allowance?: number | null
          status?: string | null
          tea_allowance?: number | null
          transfer_mode?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aadhar_card?: string | null
          account_number?: string | null
          advance?: number | null
          allowances?: number | null
          avatar_url?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          basic_salary_percentage?: number | null
          branch_id?: string | null
          branch_name?: string | null
          contract_name?: string | null
          conveyance?: number | null
          created_at?: string
          da_amount?: number | null
          da_percentage?: number | null
          da_rate?: number | null
          date_of_birth?: string | null
          day_rate?: number | null
          department?: string | null
          document_url?: string | null
          email?: string | null
          employee_id?: string
          esi_eligible?: boolean | null
          esi_number?: string | null
          fathers_name?: string | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          ifsc_code?: string | null
          is_driver?: boolean | null
          join_date?: string
          late_deduction_eligible?: boolean | null
          location?: string | null
          mode_of_payment?: string | null
          name?: string
          notes?: string | null
          ot_amount?: number | null
          other_allowances?: number | null
          overtime_eligible?: boolean | null
          pan_card?: string | null
          per_day_salary?: number | null
          pf?: number | null
          pf_eligible?: boolean | null
          pf_number?: string | null
          phone?: string | null
          position?: string
          rent_deduction?: number | null
          row_number?: number | null
          shift_code?: string | null
          shoe_uniform_allowance?: number | null
          status?: string | null
          tea_allowance?: number | null
          transfer_mode?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          advance_deduction: number | null
          allowances: number | null
          basic_salary: number | null
          created_at: string
          da_amount: number | null
          deductions: number | null
          employee_id: string
          esi_0_75_percent: number | null
          esi_deduction: number | null
          esi_employee_deduction: number | null
          esi_employer_contribution: number | null
          esi_number: string | null
          food: number | null
          gross_earnings: number | null
          gross_pay: number | null
          gross_salary: number | null
          hra: number | null
          id: string
          lunch: number | null
          month: number
          net_pay: number | null
          net_salary: number | null
          ot_amount: number | null
          other_deductions: number | null
          overtime_amount: number | null
          pf_12_percent: number | null
          pf_deduction: number | null
          pf_number: string | null
          status: string | null
          take_home: number | null
          total_deductions: number | null
          uniform: number | null
          updated_at: string
          user_id: string | null
          worked_days: number | null
          year: number
        }
        Insert: {
          advance_deduction?: number | null
          allowances?: number | null
          basic_salary?: number | null
          created_at?: string
          da_amount?: number | null
          deductions?: number | null
          employee_id: string
          esi_0_75_percent?: number | null
          esi_deduction?: number | null
          esi_employee_deduction?: number | null
          esi_employer_contribution?: number | null
          esi_number?: string | null
          food?: number | null
          gross_earnings?: number | null
          gross_pay?: number | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          lunch?: number | null
          month: number
          net_pay?: number | null
          net_salary?: number | null
          ot_amount?: number | null
          other_deductions?: number | null
          overtime_amount?: number | null
          pf_12_percent?: number | null
          pf_deduction?: number | null
          pf_number?: string | null
          status?: string | null
          take_home?: number | null
          total_deductions?: number | null
          uniform?: number | null
          updated_at?: string
          user_id?: string | null
          worked_days?: number | null
          year: number
        }
        Update: {
          advance_deduction?: number | null
          allowances?: number | null
          basic_salary?: number | null
          created_at?: string
          da_amount?: number | null
          deductions?: number | null
          employee_id?: string
          esi_0_75_percent?: number | null
          esi_deduction?: number | null
          esi_employee_deduction?: number | null
          esi_employer_contribution?: number | null
          esi_number?: string | null
          food?: number | null
          gross_earnings?: number | null
          gross_pay?: number | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          lunch?: number | null
          month?: number
          net_pay?: number | null
          net_salary?: number | null
          ot_amount?: number | null
          other_deductions?: number | null
          overtime_amount?: number | null
          pf_12_percent?: number | null
          pf_deduction?: number | null
          pf_number?: string | null
          status?: string | null
          take_home?: number | null
          total_deductions?: number | null
          uniform?: number | null
          updated_at?: string
          user_id?: string | null
          worked_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_settings: {
        Row: {
          created_at: string
          esi_employee_rate: number | null
          esi_employer_rate: number | null
          esi_rate: number | null
          id: string
          income_tax_rate: number | null
          monthly_pay_date: number | null
          overtime_rate: number | null
          pay_frequency: string | null
          pf_rate: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          esi_employee_rate?: number | null
          esi_employer_rate?: number | null
          esi_rate?: number | null
          id?: string
          income_tax_rate?: number | null
          monthly_pay_date?: number | null
          overtime_rate?: number | null
          pay_frequency?: string | null
          pf_rate?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          esi_employee_rate?: number | null
          esi_employer_rate?: number | null
          esi_rate?: number | null
          id?: string
          income_tax_rate?: number | null
          monthly_pay_date?: number | null
          overtime_rate?: number | null
          pay_frequency?: string | null
          pf_rate?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          id: string
          totp_secret: string | null
          two_factor_backup_codes: Json | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          two_factor_verified: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          totp_secret?: string | null
          two_factor_backup_codes?: Json | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          two_factor_verified?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          totp_secret?: string | null
          two_factor_backup_codes?: Json | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          two_factor_verified?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

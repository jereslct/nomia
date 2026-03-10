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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      absences: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          date: string
          type: Database["public"]["Enums"]["absence_type"]
          justification: string | null
          certificate_url: string | null
          certificate_file_name: string | null
          status: Database["public"]["Enums"]["absence_status"]
          reported_by: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          date: string
          type?: Database["public"]["Enums"]["absence_type"]
          justification?: string | null
          certificate_url?: string | null
          certificate_file_name?: string | null
          status?: Database["public"]["Enums"]["absence_status"]
          reported_by: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          date?: string
          type?: Database["public"]["Enums"]["absence_type"]
          justification?: string | null
          certificate_url?: string | null
          certificate_file_name?: string | null
          status?: Database["public"]["Enums"]["absence_status"]
          reported_by?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string
          id: string
          location_id: string
          qr_code_id: string | null
          record_type: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          qr_code_id?: string | null
          record_type: string
          recorded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          qr_code_id?: string | null
          record_type?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          category: Database["public"]["Enums"]["document_category"]
          file_name: string
          file_url: string
          file_size: number
          description: string | null
          uploaded_by: string
          status: Database["public"]["Enums"]["document_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          category?: Database["public"]["Enums"]["document_category"]
          file_name: string
          file_url: string
          file_size?: number
          description?: string | null
          uploaded_by: string
          status?: Database["public"]["Enums"]["document_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          category?: Database["public"]["Enums"]["document_category"]
          file_name?: string
          file_url?: string
          file_size?: number
          description?: string | null
          uploaded_by?: string
          status?: Database["public"]["Enums"]["document_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_templates: {
        Row: {
          id: string
          organization_id: string
          name: string
          criteria: Json
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          criteria?: Json
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          criteria?: Json
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          organization_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by: string
          invited_email: string
          organization_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          organization_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_stubs: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          period_month: number
          period_year: number
          file_name: string
          file_url: string
          file_size: number
          uploaded_by: string
          downloaded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          period_month: number
          period_year: number
          file_name: string
          file_url: string
          file_size?: number
          uploaded_by: string
          downloaded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          period_month?: number
          period_year?: number
          file_name?: string
          file_url?: string
          file_size?: number
          uploaded_by?: string
          downloaded_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_stubs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_evaluations: {
        Row: {
          id: string
          template_id: string
          user_id: string
          evaluator_id: string
          organization_id: string
          period_start: string
          period_end: string
          scores: Json
          overall_score: number | null
          comments: string | null
          status: Database["public"]["Enums"]["evaluation_status"]
          shared_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          user_id: string
          evaluator_id: string
          organization_id: string
          period_start: string
          period_end: string
          scores?: Json
          overall_score?: number | null
          comments?: string | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          shared_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          user_id?: string
          evaluator_id?: string
          organization_id?: string
          period_start?: string
          period_end?: string
          scores?: Json
          overall_score?: number | null
          comments?: string | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          shared_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "evaluation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          location_id: string
          signature: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          location_id: string
          signature?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          location_id?: string
          signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_balances: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          year: number
          total_days: number
          used_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          year: number
          total_days?: number
          used_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          year?: number
          total_days?: number
          used_days?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_requests: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          start_date: string
          end_date: string
          days_count: number
          reason: string | null
          status: Database["public"]["Enums"]["vacation_request_status"]
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          start_date: string
          end_date: string
          days_count: number
          reason?: string | null
          status?: Database["public"]["Enums"]["vacation_request_status"]
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          start_date?: string
          end_date?: string
          days_count?: number
          reason?: string | null
          status?: Database["public"]["Enums"]["vacation_request_status"]
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_shifts: {
        Row: {
          active_days: number[]
          created_at: string
          end_time: string
          entry_grace_minutes: number
          exit_grace_minutes: number
          id: string
          is_default: boolean
          name: string
          organization_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          active_days?: number[]
          created_at?: string
          end_time?: string
          entry_grace_minutes?: number
          exit_grace_minutes?: number
          id?: string
          is_default?: boolean
          name?: string
          organization_id: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          active_days?: number[]
          created_at?: string
          end_time?: string
          entry_grace_minutes?: number
          exit_grace_minutes?: number
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_org_default_shift: {
        Args: { _org_id: string }
        Returns: {
          active_days: number[]
          end_time: string
          entry_grace_minutes: number
          exit_grace_minutes: number
          id: string
          start_time: string
        }[]
      }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_organization_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      users_share_organization: {
        Args: { _profile_user_id: string; _viewer_id: string }
        Returns: boolean
      }
    }
    Enums: {
      absence_status: "pending" | "approved" | "rejected"
      absence_type: "unjustified" | "justified" | "medical_certificate" | "birth_leave" | "other_leave"
      app_role: "admin" | "user"
      document_category: "curriculum" | "arca_registration" | "signed_receipt" | "other"
      document_status: "pending" | "approved" | "rejected"
      evaluation_status: "draft" | "completed" | "shared"
      vacation_request_status: "pending" | "approved" | "rejected" | "cancelled"
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
    Enums: {
      absence_status: ["pending", "approved", "rejected"],
      absence_type: ["unjustified", "justified", "medical_certificate", "birth_leave", "other_leave"],
      app_role: ["admin", "user"],
      document_category: ["curriculum", "arca_registration", "signed_receipt", "other"],
      document_status: ["pending", "approved", "rejected"],
      evaluation_status: ["draft", "completed", "shared"],
      vacation_request_status: ["pending", "approved", "rejected", "cancelled"],
    },
  },
} as const

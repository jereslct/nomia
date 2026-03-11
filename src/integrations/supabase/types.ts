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
          certificate_file_name: string | null
          certificate_url: string | null
          created_at: string
          date: string
          id: string
          justification: string | null
          organization_id: string
          reported_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["absence_status"]
          type: Database["public"]["Enums"]["absence_type"]
          user_id: string
        }
        Insert: {
          certificate_file_name?: string | null
          certificate_url?: string | null
          created_at?: string
          date: string
          id?: string
          justification?: string | null
          organization_id: string
          reported_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["absence_status"]
          type?: Database["public"]["Enums"]["absence_type"]
          user_id: string
        }
        Update: {
          certificate_file_name?: string | null
          certificate_url?: string | null
          created_at?: string
          date?: string
          id?: string
          justification?: string | null
          organization_id?: string
          reported_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["absence_status"]
          type?: Database["public"]["Enums"]["absence_type"]
          user_id?: string
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
      afip_config: {
        Row: {
          certificado_url: string | null
          created_at: string
          cuit: string | null
          environment: string
          id: string
          is_active: boolean
          organization_id: string
          punto_venta: number | null
          updated_at: string
        }
        Insert: {
          certificado_url?: string | null
          created_at?: string
          cuit?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          organization_id: string
          punto_venta?: number | null
          updated_at?: string
        }
        Update: {
          certificado_url?: string | null
          created_at?: string
          cuit?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          punto_venta?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "afip_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
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
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expenses: {
        Row: {
          amount: number
          business_unit_id: string
          category_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          period_month: number
          period_year: number
          receipt_url: string | null
        }
        Insert: {
          amount?: number
          business_unit_id: string
          category_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          period_month: number
          period_year: number
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          business_unit_id?: string
          category_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          period_month?: number
          period_year?: number
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_expenses_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location_id: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_id?: string | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_id?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_units_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          credit_limit: number
          cuit: string | null
          current_balance: number
          email: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          phone: string | null
          tax_condition: Database["public"]["Enums"]["tax_condition"]
        }
        Insert: {
          address?: string | null
          created_at?: string
          credit_limit?: number
          cuit?: string | null
          current_balance?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          phone?: string | null
          tax_condition?: Database["public"]["Enums"]["tax_condition"]
        }
        Update: {
          address?: string | null
          created_at?: string
          credit_limit?: number
          cuit?: string | null
          current_balance?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          tax_condition?: Database["public"]["Enums"]["tax_condition"]
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          description: string | null
          file_name: string
          file_size: number
          file_url: string
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          uploaded_by: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number
          file_url: string
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by?: string
          user_id?: string
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
      employee_sales_objectives: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          objective_type: Database["public"]["Enums"]["objective_type"]
          organization_id: string
          period_type: Database["public"]["Enums"]["objective_period"]
          target_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          objective_type?: Database["public"]["Enums"]["objective_type"]
          organization_id: string
          period_type?: Database["public"]["Enums"]["objective_period"]
          target_value?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          objective_type?: Database["public"]["Enums"]["objective_type"]
          organization_id?: string
          period_type?: Database["public"]["Enums"]["objective_period"]
          target_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sales_objectives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_templates: {
        Row: {
          created_at: string
          created_by: string
          criteria: Json
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          criteria?: Json
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          criteria?: Json
          id?: string
          name?: string
          organization_id?: string
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
      exchange_rates: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          date: string
          id: string
          organization_id: string
          rate: number
          source: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          date?: string
          id?: string
          organization_id: string
          rate: number
          source?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          date?: string
          id?: string
          organization_id?: string
          rate?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          sort_order: number
          type: Database["public"]["Enums"]["expense_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          sort_order?: number
          type?: Database["public"]["Enums"]["expense_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["expense_type"]
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_sheets: {
        Row: {
          approved_by: string | null
          business_unit_id: string | null
          created_at: string
          id: string
          organization_id: string
          period_month: number
          period_year: number
          status: Database["public"]["Enums"]["expense_sheet_status"]
          total: number
          total_fixed: number
          total_variable: number
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          business_unit_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          period_month: number
          period_year: number
          status?: Database["public"]["Enums"]["expense_sheet_status"]
          total?: number
          total_fixed?: number
          total_variable?: number
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          business_unit_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          period_month?: number
          period_year?: number
          status?: Database["public"]["Enums"]["expense_sheet_status"]
          total?: number
          total_fixed?: number
          total_variable?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_sheets_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_sheets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          iva_amount: number
          iva_rate: number
          product_id: string | null
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          iva_amount?: number
          iva_rate?: number
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          iva_amount?: number
          iva_rate?: number
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          afip_cae: string | null
          afip_vencimiento_cae: string | null
          client_cuit: string | null
          client_name: string | null
          client_tax_condition: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          date: string
          direction: Database["public"]["Enums"]["invoice_direction"]
          id: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          iva_amount: number
          notes: string | null
          number: string | null
          organization_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
        }
        Insert: {
          afip_cae?: string | null
          afip_vencimiento_cae?: string | null
          client_cuit?: string | null
          client_name?: string | null
          client_tax_condition?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          date?: string
          direction?: Database["public"]["Enums"]["invoice_direction"]
          id?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          iva_amount?: number
          notes?: string | null
          number?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
        }
        Update: {
          afip_cae?: string | null
          afip_vencimiento_cae?: string | null
          client_cuit?: string | null
          client_name?: string | null
          client_tax_condition?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          date?: string
          direction?: Database["public"]["Enums"]["invoice_direction"]
          id?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          iva_amount?: number
          notes?: string | null
          number?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
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
      organization_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string
          plan_id: string
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id: string
          plan_id: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
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
      pay_stubs: {
        Row: {
          created_at: string
          downloaded_at: string | null
          file_name: string
          file_size: number
          file_url: string
          id: string
          organization_id: string
          period_month: number
          period_year: number
          uploaded_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          downloaded_at?: string | null
          file_name: string
          file_size?: number
          file_url: string
          id?: string
          organization_id: string
          period_month: number
          period_year: number
          uploaded_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          downloaded_at?: string | null
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          organization_id?: string
          period_month?: number
          period_year?: number
          uploaded_by?: string
          user_id?: string
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
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          date: string
          id: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
          sale_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          date?: string
          id?: string
          organization_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          sale_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          date?: string
          id?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_evaluations: {
        Row: {
          comments: string | null
          created_at: string
          evaluator_id: string
          id: string
          organization_id: string
          overall_score: number | null
          period_end: string
          period_start: string
          scores: Json
          shared_at: string | null
          status: Database["public"]["Enums"]["evaluation_status"]
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          evaluator_id: string
          id?: string
          organization_id: string
          overall_score?: number | null
          period_end: string
          period_start: string
          scores?: Json
          shared_at?: string | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          evaluator_id?: string
          id?: string
          organization_id?: string
          overall_score?: number | null
          period_end?: string
          period_start?: string
          scores?: Json
          shared_at?: string | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "evaluation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      points_of_sale: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location_id: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_of_sale_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_of_sale_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          cost_currency: string
          cost_exchange_rate: number | null
          cost_price: number
          created_at: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          iva_rate: number
          min_stock: number
          name: string
          organization_id: string
          reorder_point: number
          sell_price: number
          sku: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_currency?: string
          cost_exchange_rate?: number | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          iva_rate?: number
          min_stock?: number
          name: string
          organization_id: string
          reorder_point?: number
          sell_price?: number
          sku?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_currency?: string
          cost_exchange_rate?: number | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          iva_rate?: number
          min_stock?: number
          name?: string
          organization_id?: string
          reorder_point?: number
          sell_price?: number
          sku?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
      purchase_items: {
        Row: {
          id: string
          product_id: string | null
          purchase_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          id?: string
          product_id?: string | null
          purchase_id: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Update: {
          id?: string
          product_id?: string | null
          purchase_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          invoice_id: string | null
          is_formal: boolean
          iva_amount: number
          notes: string | null
          organization_id: string
          subtotal: number
          supplier_id: string | null
          total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          invoice_id?: string | null
          is_formal?: boolean
          iva_amount?: number
          notes?: string | null
          organization_id: string
          subtotal?: number
          supplier_id?: string | null
          total?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          invoice_id?: string | null
          is_formal?: boolean
          iva_amount?: number
          notes?: string | null
          organization_id?: string
          subtotal?: number
          supplier_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      salary_records: {
        Row: {
          base_salary: number
          business_unit_id: string | null
          created_at: string
          created_by: string | null
          deductions: number
          extras: number
          id: string
          notes: string | null
          organization_id: string
          period_month: number
          period_year: number
          total: number
          user_id: string
        }
        Insert: {
          base_salary?: number
          business_unit_id?: string | null
          created_at?: string
          created_by?: string | null
          deductions?: number
          extras?: number
          id?: string
          notes?: string | null
          organization_id: string
          period_month: number
          period_year: number
          total?: number
          user_id: string
        }
        Update: {
          base_salary?: number
          business_unit_id?: string | null
          created_at?: string
          created_by?: string | null
          deductions?: number
          extras?: number
          id?: string
          notes?: string | null
          organization_id?: string
          period_month?: number
          period_year?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_price_snapshot: number
          id: string
          product_id: string | null
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          cost_price_snapshot?: number
          id?: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          subtotal?: number
          unit_price?: number
        }
        Update: {
          cost_price_snapshot?: number
          id?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          date: string
          id: string
          invoice_id: string | null
          is_formal: boolean
          iva_amount: number
          location_id: string | null
          notes: string | null
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          pos_id: string | null
          sale_channel: Database["public"]["Enums"]["sale_channel"]
          seller_id: string | null
          subtotal: number
          total: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          date?: string
          id?: string
          invoice_id?: string | null
          is_formal?: boolean
          iva_amount?: number
          location_id?: string | null
          notes?: string | null
          organization_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pos_id?: string | null
          sale_channel?: Database["public"]["Enums"]["sale_channel"]
          seller_id?: string | null
          subtotal?: number
          total?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          date?: string
          id?: string
          invoice_id?: string | null
          is_formal?: boolean
          iva_amount?: number
          location_id?: string | null
          notes?: string | null
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pos_id?: string | null
          sale_channel?: Database["public"]["Enums"]["sale_channel"]
          seller_id?: string | null
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pos_id_fkey"
            columns: ["pos_id"]
            isOneToOne: false
            referencedRelation: "points_of_sale"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          min_stock_override: number | null
          notify_email: boolean
          organization_id: string
          product_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_stock_override?: number | null
          notify_email?: boolean
          organization_id: string
          product_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_stock_override?: number | null
          notify_email?: boolean
          organization_id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          organization_id: string
          product_id: string
          quantity: number
          reference_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          organization_id: string
          product_id: string
          quantity: number
          reference_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          organization_id?: string
          product_id?: string
          quantity?: number
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          apps_included: string[]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
        }
        Insert: {
          apps_included?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
        }
        Update: {
          apps_included?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          cuit: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
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
      vacation_balances: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          total_days: number
          updated_at: string
          used_days: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          total_days?: number
          updated_at?: string
          used_days?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          total_days?: number
          updated_at?: string
          used_days?: number
          user_id?: string
          year?: number
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
          created_at: string
          days_count: number
          end_date: string
          id: string
          organization_id: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["vacation_request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          days_count: number
          end_date: string
          id?: string
          organization_id: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["vacation_request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          days_count?: number
          end_date?: string
          id?: string
          organization_id?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["vacation_request_status"]
          user_id?: string
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
      v_product_stock: {
        Row: {
          calculated_stock: number | null
          product_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bulk_update_prices_from_exchange_rate: {
        Args: {
          _currency: string
          _margin_pct?: number
          _new_rate: number
          _org_id: string
        }
        Returns: number
      }
      get_iva_summary: {
        Args: { _org_id: string; _period_end: string; _period_start: string }
        Returns: {
          iva_a_pagar: number
          iva_credito: number
          iva_debito: number
        }[]
      }
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
      get_org_subscription_apps: {
        Args: { _user_id: string }
        Returns: string[]
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
      user_belongs_to_org: { Args: { _org_id: string }; Returns: boolean }
      users_share_organization: {
        Args: { _profile_user_id: string; _viewer_id: string }
        Returns: boolean
      }
    }
    Enums: {
      absence_status: "pending" | "approved" | "rejected"
      absence_type:
        | "unjustified"
        | "justified"
        | "medical_certificate"
        | "birth_leave"
        | "other_leave"
      app_role: "admin" | "user"
      document_category:
        | "curriculum"
        | "arca_registration"
        | "signed_receipt"
        | "other"
      document_status: "pending" | "approved" | "rejected"
      evaluation_status: "draft" | "completed" | "shared"
      expense_sheet_status: "draft" | "approved" | "closed"
      expense_type: "fijo" | "variable"
      invoice_direction: "emitida" | "recibida"
      invoice_status: "draft" | "confirmed" | "cancelled" | "afip_sent"
      invoice_type:
        | "factura_a"
        | "factura_b"
        | "factura_c"
        | "nota_credito"
        | "nota_debito"
        | "informal"
      objective_period: "diario" | "semanal" | "mensual"
      objective_type:
        | "ventas_monto"
        | "ventas_cantidad"
        | "mix_productos"
        | "personalizado"
      payment_method: "efectivo" | "tarjeta" | "transferencia" | "otro"
      payment_status: "pending" | "partial" | "paid" | "overdue"
      sale_channel: "local_fisico" | "catalogo" | "online"
      stock_movement_type:
        | "compra"
        | "venta"
        | "ajuste_positivo"
        | "ajuste_negativo"
        | "devolucion"
      subscription_status: "active" | "trial" | "expired" | "cancelled"
      tax_condition:
        | "responsable_inscripto"
        | "monotributista"
        | "consumidor_final"
        | "exento"
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
      absence_type: [
        "unjustified",
        "justified",
        "medical_certificate",
        "birth_leave",
        "other_leave",
      ],
      app_role: ["admin", "user"],
      document_category: [
        "curriculum",
        "arca_registration",
        "signed_receipt",
        "other",
      ],
      document_status: ["pending", "approved", "rejected"],
      evaluation_status: ["draft", "completed", "shared"],
      expense_sheet_status: ["draft", "approved", "closed"],
      expense_type: ["fijo", "variable"],
      invoice_direction: ["emitida", "recibida"],
      invoice_status: ["draft", "confirmed", "cancelled", "afip_sent"],
      invoice_type: [
        "factura_a",
        "factura_b",
        "factura_c",
        "nota_credito",
        "nota_debito",
        "informal",
      ],
      objective_period: ["diario", "semanal", "mensual"],
      objective_type: [
        "ventas_monto",
        "ventas_cantidad",
        "mix_productos",
        "personalizado",
      ],
      payment_method: ["efectivo", "tarjeta", "transferencia", "otro"],
      payment_status: ["pending", "partial", "paid", "overdue"],
      sale_channel: ["local_fisico", "catalogo", "online"],
      stock_movement_type: [
        "compra",
        "venta",
        "ajuste_positivo",
        "ajuste_negativo",
        "devolucion",
      ],
      subscription_status: ["active", "trial", "expired", "cancelled"],
      tax_condition: [
        "responsable_inscripto",
        "monotributista",
        "consumidor_final",
        "exento",
      ],
      vacation_request_status: ["pending", "approved", "rejected", "cancelled"],
    },
  },
} as const

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          overlay_color: string
          overlay_opacity: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          overlay_color?: string
          overlay_opacity?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          overlay_color?: string
          overlay_opacity?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_order: number | null
          icon: string
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_order?: number | null
          icon: string
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          deleted_at: string | null
          discount_percent: number | null
          discount_type: string | null
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          deleted_at?: string | null
          discount_percent?: number | null
          discount_type?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          deleted_at?: string | null
          discount_percent?: number | null
          discount_type?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_history: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          description: string
          id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          description: string
          id?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_requests: {
        Row: {
          admin_notes: string | null
          brand: string | null
          category: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          converted_to_receivable_id: string | null
          cost_price: number | null
          created_at: string
          customer_id: string
          customer_name: string
          deleted_at: string | null
          id: string
          installment_rate: number | null
          installments: number | null
          notes: string | null
          payment_method: string | null
          product_name: string
          sale_price: number
          status: string
          updated_at: string
          warranty_days: number | null
        }
        Insert: {
          admin_notes?: string | null
          brand?: string | null
          category?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          converted_to_receivable_id?: string | null
          cost_price?: number | null
          created_at?: string
          customer_id: string
          customer_name: string
          deleted_at?: string | null
          id?: string
          installment_rate?: number | null
          installments?: number | null
          notes?: string | null
          payment_method?: string | null
          product_name: string
          sale_price: number
          status?: string
          updated_at?: string
          warranty_days?: number | null
        }
        Update: {
          admin_notes?: string | null
          brand?: string | null
          category?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          converted_to_receivable_id?: string | null
          cost_price?: number | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          deleted_at?: string | null
          id?: string
          installment_rate?: number | null
          installments?: number | null
          notes?: string | null
          payment_method?: string | null
          product_name?: string
          sale_price?: number
          status?: string
          updated_at?: string
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_requests_converted_to_receivable_id_fkey"
            columns: ["converted_to_receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          code: string
          cpf_cnpj: string | null
          created_at: string
          credit_balance: number
          credit_limit: number
          customer_type: string
          deleted_at: string | null
          email: string | null
          has_portal_access: boolean | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          portal_password: string | null
          portal_username: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          code: string
          cpf_cnpj?: string | null
          created_at?: string
          credit_balance?: number
          credit_limit?: number
          customer_type: string
          deleted_at?: string | null
          email?: string | null
          has_portal_access?: boolean | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          portal_password?: string | null
          portal_username?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          code?: string
          cpf_cnpj?: string | null
          created_at?: string
          credit_balance?: number
          credit_limit?: number
          customer_type?: string
          deleted_at?: string | null
          email?: string | null
          has_portal_access?: boolean | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          portal_password?: string | null
          portal_username?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          average_margin: number
          generated_at: string
          id: string
          month: string
          net_profit: number
          sold_count: number
          taxes: number
          total_purchases: number
          total_sales: number
        }
        Insert: {
          average_margin?: number
          generated_at?: string
          id?: string
          month: string
          net_profit?: number
          sold_count?: number
          taxes?: number
          total_purchases?: number
          total_sales?: number
        }
        Update: {
          average_margin?: number
          generated_at?: string
          id?: string
          month?: string
          net_profit?: number
          sold_count?: number
          taxes?: number
          total_purchases?: number
          total_sales?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number
          brand: string
          category: string
          created_at: string
          customer_id: string | null
          customer_name: string | null
          deleted_at: string | null
          description: string | null
          digital_tax: number | null
          discount_price: number | null
          expenses: Json | null
          id: string
          images: string[] | null
          installment_rate: number | null
          installments: number | null
          margin: number | null
          name: string
          notes: string | null
          paid_amount: number | null
          pass_on_cash_discount: boolean | null
          payment_breakdown: Json | null
          payment_method: string | null
          payment_status: string | null
          product_order: number | null
          profit: number | null
          receivable_id: string | null
          remaining_amount: number | null
          sale_price: number | null
          show_sold_overlay: boolean | null
          sold: boolean
          sold_date: string | null
          sold_on_credit: boolean
          specifications: Json | null
          specs: string | null
          warranty_days: number | null
        }
        Insert: {
          base_price: number
          brand: string
          category: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          description?: string | null
          digital_tax?: number | null
          discount_price?: number | null
          expenses?: Json | null
          id?: string
          images?: string[] | null
          installment_rate?: number | null
          installments?: number | null
          margin?: number | null
          name: string
          notes?: string | null
          paid_amount?: number | null
          pass_on_cash_discount?: boolean | null
          payment_breakdown?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          product_order?: number | null
          profit?: number | null
          receivable_id?: string | null
          remaining_amount?: number | null
          sale_price?: number | null
          show_sold_overlay?: boolean | null
          sold?: boolean
          sold_date?: string | null
          sold_on_credit?: boolean
          specifications?: Json | null
          specs?: string | null
          warranty_days?: number | null
        }
        Update: {
          base_price?: number
          brand?: string
          category?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          description?: string | null
          digital_tax?: number | null
          discount_price?: number | null
          expenses?: Json | null
          id?: string
          images?: string[] | null
          installment_rate?: number | null
          installments?: number | null
          margin?: number | null
          name?: string
          notes?: string | null
          paid_amount?: number | null
          pass_on_cash_discount?: boolean | null
          payment_breakdown?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          product_order?: number | null
          profit?: number | null
          receivable_id?: string | null
          remaining_amount?: number | null
          sale_price?: number | null
          show_sold_overlay?: boolean | null
          sold?: boolean
          sold_date?: string | null
          sold_on_credit?: boolean
          specifications?: Json | null
          specs?: string | null
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quick_sales: {
        Row: {
          brand: string | null
          category: string | null
          cost_price: number
          created_at: string
          customer_id: string | null
          customer_name: string
          deleted_at: string | null
          digital_tax: number | null
          id: string
          installment_rate: number | null
          installments: number | null
          margin: number
          notes: string | null
          payment_breakdown: Json
          payment_method: string
          product_name: string
          profit: number
          sale_date: string
          sale_price: number
          updated_at: string
          warranty_days: number | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost_price: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          deleted_at?: string | null
          digital_tax?: number | null
          id?: string
          installment_rate?: number | null
          installments?: number | null
          margin: number
          notes?: string | null
          payment_breakdown: Json
          payment_method: string
          product_name: string
          profit: number
          sale_date?: string
          sale_price: number
          updated_at?: string
          warranty_days?: number | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          deleted_at?: string | null
          digital_tax?: number | null
          id?: string
          installment_rate?: number | null
          installments?: number | null
          margin?: number
          notes?: string | null
          payment_breakdown?: Json
          payment_method?: string
          product_name?: string
          profit?: number
          sale_date?: string
          sale_price?: number
          updated_at?: string
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      receivables: {
        Row: {
          archived: boolean
          base_price: number
          brand: string | null
          category: string | null
          cost_price: number | null
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string
          customer_id: string
          customer_name: string
          deleted_at: string | null
          due_date: string
          hidden_from_portal: boolean | null
          id: string
          installment_rate: number | null
          installments: number
          notes: string | null
          paid_amount: number
          payments: Json | null
          product_id: string | null
          product_name: string
          profit: number | null
          remaining_amount: number
          sale_date: string | null
          sale_price: number
          status: string
          total_amount: number
          updated_at: string
          warranty_days: number | null
        }
        Insert: {
          archived?: boolean
          base_price: number
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string
          customer_id: string
          customer_name: string
          deleted_at?: string | null
          due_date: string
          hidden_from_portal?: boolean | null
          id?: string
          installment_rate?: number | null
          installments: number
          notes?: string | null
          paid_amount?: number
          payments?: Json | null
          product_id?: string | null
          product_name: string
          profit?: number | null
          remaining_amount: number
          sale_date?: string | null
          sale_price: number
          status: string
          total_amount: number
          updated_at?: string
          warranty_days?: number | null
        }
        Update: {
          archived?: boolean
          base_price?: number
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          deleted_at?: string | null
          due_date?: string
          hidden_from_portal?: boolean | null
          id?: string
          installment_rate?: number | null
          installments?: number
          notes?: string | null
          paid_amount?: number
          payments?: Json | null
          product_id?: string | null
          product_name?: string
          profit?: number | null
          remaining_amount?: number
          sale_date?: string | null
          sale_price?: number
          status?: string
          total_amount?: number
          updated_at?: string
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receivables_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          digital_tax_rate: number
          id: string
          include_cash_in_tax: boolean
          installment_rates: Json
          processor_options: Json | null
          ram_options: Json | null
          updated_at: string
        }
        Insert: {
          digital_tax_rate?: number
          id?: string
          include_cash_in_tax?: boolean
          installment_rates?: Json
          processor_options?: Json | null
          ram_options?: Json | null
          updated_at?: string
        }
        Update: {
          digital_tax_rate?: number
          id?: string
          include_cash_in_tax?: boolean
          installment_rates?: Json
          processor_options?: Json | null
          ram_options?: Json | null
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_deleted_items: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

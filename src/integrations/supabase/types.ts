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
      consultation_fields: {
        Row: {
          created_at: string
          created_by: string | null
          field_label: string
          field_name: string
          field_options: Json | null
          field_order: number
          field_type: Database["public"]["Enums"]["field_type"]
          id: string
          is_active: boolean
          required_for_levels: string[]
          updated_at: string
          visible_for_levels: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          field_label: string
          field_name: string
          field_options?: Json | null
          field_order?: number
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          is_active?: boolean
          required_for_levels?: string[]
          updated_at?: string
          visible_for_levels?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_order?: number
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          is_active?: boolean
          required_for_levels?: string[]
          updated_at?: string
          visible_for_levels?: string[]
        }
        Relationships: []
      }
      consultation_history: {
        Row: {
          ai_response: string | null
          attachments: Json | null
          consulta_original_id: string | null
          created_at: string | null
          epidemiological_info: Json | null
          exam_results: Json | null
          family_symptoms: boolean | null
          id: string
          status: string
          symptom_duration: number | null
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          attachments?: Json | null
          consulta_original_id?: string | null
          created_at?: string | null
          epidemiological_info?: Json | null
          exam_results?: Json | null
          family_symptoms?: boolean | null
          id?: string
          status?: string
          symptom_duration?: number | null
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          ai_response?: string | null
          attachments?: Json | null
          consulta_original_id?: string | null
          created_at?: string | null
          epidemiological_info?: Json | null
          exam_results?: Json | null
          family_symptoms?: boolean | null
          id?: string
          status?: string
          symptom_duration?: number | null
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_history_consulta_original_id_fkey"
            columns: ["consulta_original_id"]
            isOneToOne: false
            referencedRelation: "consultation_history"
            referencedColumns: ["id"]
          },
        ]
      }
      healthcare_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          department: string | null
          healthcare_role: Database["public"]["Enums"]["healthcare_role"]
          id: string
          license_number: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          department?: string | null
          healthcare_role: Database["public"]["Enums"]["healthcare_role"]
          id?: string
          license_number?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          department?: string | null
          healthcare_role?: Database["public"]["Enums"]["healthcare_role"]
          id?: string
          license_number?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      page_components: {
        Row: {
          component_type: string
          content: Json
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          page_id: string
          updated_at: string
        }
        Insert: {
          component_type: string
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          page_id: string
          updated_at?: string
        }
        Update: {
          component_type?: string
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          page_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_components_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          order_index: number
          page_type: string
          parent_id: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          order_index?: number
          page_type: string
          parent_id?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          order_index?: number
          page_type?: string
          parent_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      paginas_conteudo: {
        Row: {
          conteudo_texto: string
          created_at: string
          id: string
          slug: string
          titulo: string
          updated_at: string
          url_imagem: string | null
        }
        Insert: {
          conteudo_texto: string
          created_at?: string
          id?: string
          slug: string
          titulo: string
          updated_at?: string
          url_imagem?: string | null
        }
        Update: {
          conteudo_texto?: string
          created_at?: string
          id?: string
          slug?: string
          titulo?: string
          updated_at?: string
          url_imagem?: string | null
        }
        Relationships: []
      }
      profile_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string | null
          accessed_profile_id: string
          created_at: string
          department: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by?: string | null
          accessed_profile_id: string
          created_at?: string
          department?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string | null
          accessed_profile_id?: string
          created_at?: string
          department?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string
          birth_date: string
          city: string
          created_at: string | null
          id: string
          name: string
          profile_type: Database["public"]["Enums"]["user_profile_type"]
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address: string
          birth_date: string
          city: string
          created_at?: string | null
          id?: string
          name: string
          profile_type?: Database["public"]["Enums"]["user_profile_type"]
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          birth_date?: string
          city?: string
          created_at?: string | null
          id?: string
          name?: string
          profile_type?: Database["public"]["Enums"]["user_profile_type"]
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      saiba_mais_cards: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          ordem: number
          titulo: string
          updated_at: string
          url_imagem: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
          url_imagem: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
          url_imagem?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      can_access_healthcare_data: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_manage_roles: {
        Args: { _user_id: string }
        Returns: boolean
      }
      email_exists: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_healthcare_role: {
        Args: {
          _role: Database["public"]["Enums"]["healthcare_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_profile_access: {
        Args: { _access_type: string; _profile_id: string; _reason?: string }
        Returns: boolean
      }
      log_profile_select: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      field_type:
        | "text"
        | "textarea"
        | "select"
        | "checkbox"
        | "number"
        | "date"
        | "aglomerado"
        | "file_upload"
        | "imc"
      healthcare_role:
        | "healthcare_professional"
        | "healthcare_admin"
        | "system_admin"
      user_profile_type: "patient" | "academic" | "health_professional"
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
      field_type: [
        "text",
        "textarea",
        "select",
        "checkbox",
        "number",
        "date",
        "aglomerado",
        "file_upload",
        "imc",
      ],
      healthcare_role: [
        "healthcare_professional",
        "healthcare_admin",
        "system_admin",
      ],
      user_profile_type: ["patient", "academic", "health_professional"],
    },
  },
} as const

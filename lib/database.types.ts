// PROVISIONAL: hand-written to match supabase/migrations/0001_schema.sql.
// Regenerate with `npm run gen:types` once the Supabase project is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          nombre_negocio: string;
          logo_url: string | null;
          ciudad: string | null;
          telefono: string | null;
          plan: string | null;
          estado_suscripcion: Database["public"]["Enums"]["estado_suscripcion"];
          trial_hasta: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre_negocio: string;
          logo_url?: string | null;
          ciudad?: string | null;
          telefono?: string | null;
          plan?: string | null;
          estado_suscripcion?: Database["public"]["Enums"]["estado_suscripcion"];
          trial_hasta?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre_negocio?: string;
          logo_url?: string | null;
          ciudad?: string | null;
          telefono?: string | null;
          plan?: string | null;
          estado_suscripcion?: Database["public"]["Enums"]["estado_suscripcion"];
          trial_hasta?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          nombre_completo: string;
          rol: Database["public"]["Enums"]["rol"];
          telefono: string | null;
          activo: boolean;
          ultimo_acceso: string | null;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          nombre_completo?: string;
          rol: Database["public"]["Enums"]["rol"];
          telefono?: string | null;
          activo?: boolean;
          ultimo_acceso?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          nombre_completo?: string;
          rol?: Database["public"]["Enums"]["rol"];
          telefono?: string | null;
          activo?: boolean;
          ultimo_acceso?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          id: string;
          organization_id: string;
          nombre: string;
          cedula: string | null;
          telefono: string | null;
          direccion: string | null;
          barrio: string | null;
          notas: string | null;
          score_pago: number;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          nombre: string;
          cedula?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          barrio?: string | null;
          notas?: string | null;
          score_pago?: number;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          nombre?: string;
          cedula?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          barrio?: string | null;
          notas?: string | null;
          score_pago?: number;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clientes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      prestamos: {
        Row: {
          id: string;
          organization_id: string;
          cliente_id: string;
          cobrador_id: string | null;
          capital: number;
          modelo_interes: Database["public"]["Enums"]["modelo_interes"];
          tasa_mensual: number;
          total_pagar: number | null;
          cuota_diaria: number | null;
          plazo_dias: number;
          dias_habiles: number | null;
          excluir_sabados: boolean;
          excluir_domingos: boolean;
          fecha_inicio: string | null;
          fecha_fin: string | null;
          estado: Database["public"]["Enums"]["estado_prestamo"];
          prestamo_anterior_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          cliente_id: string;
          cobrador_id?: string | null;
          capital: number;
          modelo_interes: Database["public"]["Enums"]["modelo_interes"];
          tasa_mensual: number;
          total_pagar?: number | null;
          cuota_diaria?: number | null;
          plazo_dias: number;
          dias_habiles?: number | null;
          excluir_sabados?: boolean;
          excluir_domingos?: boolean;
          fecha_inicio?: string | null;
          fecha_fin?: string | null;
          estado?: Database["public"]["Enums"]["estado_prestamo"];
          prestamo_anterior_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          cliente_id?: string;
          cobrador_id?: string | null;
          capital?: number;
          modelo_interes?: Database["public"]["Enums"]["modelo_interes"];
          tasa_mensual?: number;
          total_pagar?: number | null;
          cuota_diaria?: number | null;
          plazo_dias?: number;
          dias_habiles?: number | null;
          excluir_sabados?: boolean;
          excluir_domingos?: boolean;
          fecha_inicio?: string | null;
          fecha_fin?: string | null;
          estado?: Database["public"]["Enums"]["estado_prestamo"];
          prestamo_anterior_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prestamos_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prestamos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prestamos_cobrador_id_fkey";
            columns: ["cobrador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prestamos_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prestamos_prestamo_anterior_id_fkey";
            columns: ["prestamo_anterior_id"];
            isOneToOne: false;
            referencedRelation: "prestamos";
            referencedColumns: ["id"];
          },
        ];
      };
      cronograma_pagos: {
        Row: {
          id: string;
          prestamo_id: string;
          organization_id: string;
          numero_cuota: number;
          fecha_esperada: string;
          monto_esperado: number;
          estado: Database["public"]["Enums"]["estado_cuota"];
          fecha_pago: string | null;
          monto_pagado: number;
          medio_pago: Database["public"]["Enums"]["medio_pago"] | null;
          cobrador_id: string | null;
          lat: number | null;
          lng: number | null;
        };
        Insert: {
          id?: string;
          prestamo_id: string;
          organization_id: string;
          numero_cuota: number;
          fecha_esperada: string;
          monto_esperado: number;
          estado?: Database["public"]["Enums"]["estado_cuota"];
          fecha_pago?: string | null;
          monto_pagado?: number;
          medio_pago?: Database["public"]["Enums"]["medio_pago"] | null;
          cobrador_id?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Update: {
          id?: string;
          prestamo_id?: string;
          organization_id?: string;
          numero_cuota?: number;
          fecha_esperada?: string;
          monto_esperado?: number;
          estado?: Database["public"]["Enums"]["estado_cuota"];
          fecha_pago?: string | null;
          monto_pagado?: number;
          medio_pago?: Database["public"]["Enums"]["medio_pago"] | null;
          cobrador_id?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "cronograma_pagos_prestamo_id_fkey";
            columns: ["prestamo_id"];
            isOneToOne: false;
            referencedRelation: "prestamos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cronograma_pagos_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cronograma_pagos_cobrador_id_fkey";
            columns: ["cobrador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mora_registros: {
        Row: {
          id: string;
          prestamo_id: string;
          organization_id: string;
          fecha_inicio_mora: string | null;
          dias_mora: number | null;
          monto_mora: number | null;
          monto_pagado_mora: number;
          estado: Database["public"]["Enums"]["estado_mora"];
        };
        Insert: {
          id?: string;
          prestamo_id: string;
          organization_id: string;
          fecha_inicio_mora?: string | null;
          dias_mora?: number | null;
          monto_mora?: number | null;
          monto_pagado_mora?: number;
          estado?: Database["public"]["Enums"]["estado_mora"];
        };
        Update: {
          id?: string;
          prestamo_id?: string;
          organization_id?: string;
          fecha_inicio_mora?: string | null;
          dias_mora?: number | null;
          monto_mora?: number | null;
          monto_pagado_mora?: number;
          estado?: Database["public"]["Enums"]["estado_mora"];
        };
        Relationships: [
          {
            foreignKeyName: "mora_registros_prestamo_id_fkey";
            columns: ["prestamo_id"];
            isOneToOne: false;
            referencedRelation: "prestamos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mora_registros_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      cierres_caja: {
        Row: {
          id: string;
          organization_id: string;
          cobrador_id: string | null;
          fecha: string;
          total_esperado: number | null;
          total_recaudado: number | null;
          efectivo_declarado: number | null;
          cerrado_por: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          cobrador_id?: string | null;
          fecha: string;
          total_esperado?: number | null;
          total_recaudado?: number | null;
          efectivo_declarado?: number | null;
          cerrado_por?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          cobrador_id?: string | null;
          fecha?: string;
          total_esperado?: number | null;
          total_recaudado?: number | null;
          efectivo_declarado?: number | null;
          cerrado_por?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cierres_caja_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cierres_caja_cobrador_id_fkey";
            columns: ["cobrador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cierres_caja_cerrado_por_fkey";
            columns: ["cerrado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      rol: "super_admin" | "admin" | "cobrador";
      estado_suscripcion: "activo" | "trial" | "vencido" | "suspendido";
      modelo_interes: "cuota_fija" | "solo_interes" | "sobre_saldo";
      estado_prestamo: "activo" | "en_mora" | "saldado" | "refinanciado" | "cancelado";
      estado_cuota: "pendiente" | "pagado" | "parcial" | "vencido";
      medio_pago: "efectivo" | "nequi" | "transferencia";
      estado_mora: "activa" | "pagada" | "condonada";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

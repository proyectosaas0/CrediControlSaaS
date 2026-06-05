// PROVISIONAL: hand-written to match current Supabase migrations.
// Regenerate with `npm run gen:types` once the Supabase project is linked with sufficient privileges.

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
          monto_capital: number | null;
          monto_interes: number | null;
          saldo_estimado: number | null;
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
          monto_capital?: number | null;
          monto_interes?: number | null;
          saldo_estimado?: number | null;
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
          monto_capital?: number | null;
          monto_interes?: number | null;
          saldo_estimado?: number | null;
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
      tenant_settings: {
        Row: {
          organization_id: string;
          tasa_interes_default: number;
          mora_tipo: "porcentaje" | "monto_fijo";
          mora_valor: number;
          dias_gracia: number;
          cobrar_sabados_default: boolean;
          cobrar_domingos_default: boolean;
          whatsapp_template: string;
          geolocalizacion_requerida: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          tasa_interes_default?: number;
          mora_tipo?: "porcentaje" | "monto_fijo";
          mora_valor?: number;
          dias_gracia?: number;
          cobrar_sabados_default?: boolean;
          cobrar_domingos_default?: boolean;
          whatsapp_template?: string;
          geolocalizacion_requerida?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          tasa_interes_default?: number;
          mora_tipo?: "porcentaje" | "monto_fijo";
          mora_valor?: number;
          dias_gracia?: number;
          cobrar_sabados_default?: boolean;
          cobrar_domingos_default?: boolean;
          whatsapp_template?: string;
          geolocalizacion_requerida?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      prestamo_saldos: {
        Row: {
          prestamo_id: string;
          organization_id: string;
          capital_original: number;
          total_original: number;
          total_pagado: number;
          saldo_pendiente: number;
          mora_pendiente: number;
          updated_at: string;
        };
        Insert: {
          prestamo_id: string;
          organization_id: string;
          capital_original: number;
          total_original: number;
          total_pagado?: number;
          saldo_pendiente: number;
          mora_pendiente?: number;
          updated_at?: string;
        };
        Update: {
          prestamo_id?: string;
          organization_id?: string;
          capital_original?: number;
          total_original?: number;
          total_pagado?: number;
          saldo_pendiente?: number;
          mora_pendiente?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prestamo_saldos_prestamo_id_fkey";
            columns: ["prestamo_id"];
            isOneToOne: true;
            referencedRelation: "prestamos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prestamo_saldos_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      pagos: {
        Row: {
          id: string;
          organization_id: string;
          prestamo_id: string;
          cronograma_pago_id: string | null;
          cliente_id: string;
          cobrador_id: string;
          registrado_por: string;
          monto: number;
          medio_pago: Database["public"]["Enums"]["medio_pago"];
          tipo: "cuota" | "parcial" | "vencida" | "mora" | "liquidacion";
          lat: number | null;
          lng: number | null;
          nota: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          prestamo_id: string;
          cronograma_pago_id?: string | null;
          cliente_id: string;
          cobrador_id: string;
          registrado_por: string;
          monto: number;
          medio_pago: Database["public"]["Enums"]["medio_pago"];
          tipo: "cuota" | "parcial" | "vencida" | "mora" | "liquidacion";
          lat?: number | null;
          lng?: number | null;
          nota?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          prestamo_id?: string;
          cronograma_pago_id?: string | null;
          cliente_id?: string;
          cobrador_id?: string;
          registrado_por?: string;
          monto?: number;
          medio_pago?: Database["public"]["Enums"]["medio_pago"];
          tipo?: "cuota" | "parcial" | "vencida" | "mora" | "liquidacion";
          lat?: number | null;
          lng?: number | null;
          nota?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      visitas_cobro: {
        Row: {
          id: string;
          organization_id: string;
          cronograma_pago_id: string;
          prestamo_id: string;
          cliente_id: string;
          cobrador_id: string;
          resultado: "pagado" | "parcial" | "no_encontrado" | "promesa_pago" | "rechazado";
          lat: number | null;
          lng: number | null;
          nota: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          cronograma_pago_id: string;
          prestamo_id: string;
          cliente_id: string;
          cobrador_id: string;
          resultado: "pagado" | "parcial" | "no_encontrado" | "promesa_pago" | "rechazado";
          lat?: number | null;
          lng?: number | null;
          nota?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          cronograma_pago_id?: string;
          prestamo_id?: string;
          cliente_id?: string;
          cobrador_id?: string;
          resultado?: "pagado" | "parcial" | "no_encontrado" | "promesa_pago" | "rechazado";
          lat?: number | null;
          lng?: number | null;
          nota?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string | null;
          actor_id: string | null;
          actor_rol: string | null;
          accion: string;
          entidad: string;
          entidad_id: string | null;
          estado_anterior: Json | null;
          estado_nuevo: Json | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          actor_id?: string | null;
          actor_rol?: string | null;
          accion: string;
          entidad: string;
          entidad_id?: string | null;
          estado_anterior?: Json | null;
          estado_nuevo?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          actor_id?: string | null;
          actor_rol?: string | null;
          accion?: string;
          entidad?: string;
          entidad_id?: string | null;
          estado_anterior?: Json | null;
          estado_nuevo?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      audit_action: {
        Args: {
          p_organization_id: string;
          p_actor_id: string;
          p_actor_rol: string;
          p_accion: string;
          p_entidad: string;
          p_entidad_id?: string | null;
          p_estado_anterior?: Json | null;
          p_estado_nuevo?: Json | null;
          p_ip?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      register_payment: {
        Args: {
          p_organization_id: string;
          p_prestamo_id: string;
          p_cronograma_pago_id: string;
          p_cliente_id: string;
          p_cobrador_id: string;
          p_registrado_por: string;
          p_monto: number;
          p_medio_pago: Database["public"]["Enums"]["medio_pago"];
          p_tipo: string;
          p_lat?: number | null;
          p_lng?: number | null;
          p_nota?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      rol: "super_admin" | "admin" | "cobrador";
      estado_suscripcion: "activo" | "trial" | "vencido" | "suspendido";
      modelo_interes: "cuota_fija" | "solo_interes" | "sobre_saldo";
      estado_prestamo: "activo" | "en_mora" | "saldado" | "refinanciado" | "cancelado";
      estado_cuota: "pendiente" | "pagado" | "parcial" | "vencido" | "cancelado";
      medio_pago: "efectivo" | "nequi" | "transferencia";
      estado_mora: "activa" | "pagada" | "condonada";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

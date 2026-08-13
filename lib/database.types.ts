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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          accion: string
          actor_id: string | null
          actor_rol: string | null
          created_at: string
          entidad: string
          entidad_id: string | null
          estado_anterior: Json | null
          estado_nuevo: Json | null
          id: string
          ip: unknown
          organization_id: string | null
          user_agent: string | null
        }
        Insert: {
          accion: string
          actor_id?: string | null
          actor_rol?: string | null
          created_at?: string
          entidad: string
          entidad_id?: string | null
          estado_anterior?: Json | null
          estado_nuevo?: Json | null
          id?: string
          ip?: unknown
          organization_id?: string | null
          user_agent?: string | null
        }
        Update: {
          accion?: string
          actor_id?: string | null
          actor_rol?: string | null
          created_at?: string
          entidad?: string
          entidad_id?: string | null
          estado_anterior?: Json | null
          estado_nuevo?: Json | null
          id?: string
          ip?: unknown
          organization_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cierres_caja: {
        Row: {
          cerrado_por: string | null
          cobrador_id: string | null
          created_at: string
          efectivo_declarado: number | null
          fecha: string
          id: string
          organization_id: string
          total_esperado: number | null
          total_recaudado: number | null
        }
        Insert: {
          cerrado_por?: string | null
          cobrador_id?: string | null
          created_at?: string
          efectivo_declarado?: number | null
          fecha: string
          id?: string
          organization_id: string
          total_esperado?: number | null
          total_recaudado?: number | null
        }
        Update: {
          cerrado_por?: string | null
          cobrador_id?: string | null
          created_at?: string
          efectivo_declarado?: number | null
          fecha?: string
          id?: string
          organization_id?: string
          total_esperado?: number | null
          total_recaudado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cierres_caja_cerrado_por_fkey"
            columns: ["cerrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_caja_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_caja_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean
          barrio: string | null
          cedula: string | null
          created_at: string
          direccion: string | null
          id: string
          nombre: string
          notas: string | null
          organization_id: string
          score_pago: number
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          barrio?: string | null
          cedula?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
          notas?: string | null
          organization_id: string
          score_pago?: number
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          barrio?: string | null
          cedula?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          organization_id?: string
          score_pago?: number
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_pagos: {
        Row: {
          cobrador_id: string | null
          estado: Database["public"]["Enums"]["estado_cuota"]
          fecha_esperada: string
          fecha_pago: string | null
          id: string
          lat: number | null
          lng: number | null
          medio_pago: Database["public"]["Enums"]["medio_pago"] | null
          monto_capital: number | null
          monto_esperado: number
          monto_interes: number | null
          monto_pagado: number
          numero_cuota: number
          organization_id: string
          prestamo_id: string
          saldo_estimado: number | null
        }
        Insert: {
          cobrador_id?: string | null
          estado?: Database["public"]["Enums"]["estado_cuota"]
          fecha_esperada: string
          fecha_pago?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          medio_pago?: Database["public"]["Enums"]["medio_pago"] | null
          monto_capital?: number | null
          monto_esperado: number
          monto_interes?: number | null
          monto_pagado?: number
          numero_cuota: number
          organization_id: string
          prestamo_id: string
          saldo_estimado?: number | null
        }
        Update: {
          cobrador_id?: string | null
          estado?: Database["public"]["Enums"]["estado_cuota"]
          fecha_esperada?: string
          fecha_pago?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          medio_pago?: Database["public"]["Enums"]["medio_pago"] | null
          monto_capital?: number | null
          monto_esperado?: number
          monto_interes?: number | null
          monto_pagado?: number
          numero_cuota?: number
          organization_id?: string
          prestamo_id?: string
          saldo_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_pagos_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_pagos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_pagos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      mora_registros: {
        Row: {
          dias_mora: number | null
          estado: Database["public"]["Enums"]["estado_mora"]
          fecha_inicio_mora: string | null
          id: string
          monto_mora: number | null
          monto_pagado_mora: number
          condonado_at: string | null
          condonado_por: string | null
          motivo_condonacion: string | null
          organization_id: string
          prestamo_id: string
        }
        Insert: {
          dias_mora?: number | null
          estado?: Database["public"]["Enums"]["estado_mora"]
          fecha_inicio_mora?: string | null
          id?: string
          monto_mora?: number | null
          monto_pagado_mora?: number
          condonado_at?: string | null
          condonado_por?: string | null
          motivo_condonacion?: string | null
          organization_id: string
          prestamo_id: string
        }
        Update: {
          dias_mora?: number | null
          estado?: Database["public"]["Enums"]["estado_mora"]
          fecha_inicio_mora?: string | null
          id?: string
          monto_mora?: number | null
          monto_pagado_mora?: number
          condonado_at?: string | null
          condonado_por?: string | null
          motivo_condonacion?: string | null
          organization_id?: string
          prestamo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mora_registros_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mora_registros_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          canal: string
          created_at: string
          destino: string | null
          estado: string
          id: string
          organization_id: string | null
          payload: Json
          tipo: string
          user_id: string | null
        }
        Insert: {
          canal: string
          created_at?: string
          destino?: string | null
          estado?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          tipo: string
          user_id?: string | null
        }
        Update: {
          canal?: string
          created_at?: string
          destino?: string | null
          estado?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ciudad: string | null
          cobrar_domingos: boolean
          cobrar_sabados: boolean
          color_primario: string | null
          created_at: string
          estado_suscripcion: Database["public"]["Enums"]["estado_suscripcion"]
          geolocalizacion_requerida: boolean
          horario_fin: string | null
          horario_inicio: string | null
          id: string
          logo_url: string | null
          moneda: string
          nombre_negocio: string
          plan: string | null
          telefono: string | null
          trial_hasta: string | null
          whatsapp_template: string | null
        }
        Insert: {
          ciudad?: string | null
          cobrar_domingos?: boolean
          cobrar_sabados?: boolean
          color_primario?: string | null
          created_at?: string
          estado_suscripcion?: Database["public"]["Enums"]["estado_suscripcion"]
          geolocalizacion_requerida?: boolean
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          logo_url?: string | null
          moneda?: string
          nombre_negocio: string
          plan?: string | null
          telefono?: string | null
          trial_hasta?: string | null
          whatsapp_template?: string | null
        }
        Update: {
          ciudad?: string | null
          cobrar_domingos?: boolean
          cobrar_sabados?: boolean
          color_primario?: string | null
          created_at?: string
          estado_suscripcion?: Database["public"]["Enums"]["estado_suscripcion"]
          geolocalizacion_requerida?: boolean
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          logo_url?: string | null
          moneda?: string
          nombre_negocio?: string
          plan?: string | null
          telefono?: string | null
          trial_hasta?: string | null
          whatsapp_template?: string | null
        }
        Relationships: []
      }
      pagos: {
        Row: {
          anulado_at: string | null
          anulado_por: string | null
          cliente_id: string
          cobrador_id: string
          created_at: string
          cronograma_pago_id: string | null
          id: string
          lat: number | null
          lng: number | null
          medio_pago: Database["public"]["Enums"]["medio_pago"]
          monto: number
          nota: string | null
          organization_id: string
          prestamo_id: string
          registrado_por: string
          tipo: string
        }
        Insert: {
          anulado_at?: string | null
          anulado_por?: string | null
          cliente_id: string
          cobrador_id: string
          created_at?: string
          cronograma_pago_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          medio_pago: Database["public"]["Enums"]["medio_pago"]
          monto: number
          nota?: string | null
          organization_id: string
          prestamo_id: string
          registrado_por: string
          tipo: string
        }
        Update: {
          anulado_at?: string | null
          anulado_por?: string | null
          cliente_id?: string
          cobrador_id?: string
          created_at?: string
          cronograma_pago_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          medio_pago?: Database["public"]["Enums"]["medio_pago"]
          monto?: number
          nota?: string | null
          organization_id?: string
          prestamo_id?: string
          registrado_por?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cronograma_pago_id_fkey"
            columns: ["cronograma_pago_id"]
            isOneToOne: false
            referencedRelation: "cronograma_pagos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prestamo_saldos: {
        Row: {
          capital_original: number
          mora_pendiente: number
          organization_id: string
          prestamo_id: string
          saldo_pendiente: number
          total_original: number
          total_pagado: number
          updated_at: string
        }
        Insert: {
          capital_original: number
          mora_pendiente?: number
          organization_id: string
          prestamo_id: string
          saldo_pendiente: number
          total_original: number
          total_pagado?: number
          updated_at?: string
        }
        Update: {
          capital_original?: number
          mora_pendiente?: number
          organization_id?: string
          prestamo_id?: string
          saldo_pendiente?: number
          total_original?: number
          total_pagado?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestamo_saldos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamo_saldos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: true
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      prestamos: {
        Row: {
          cancelado_at: string | null
          capital: number
          cliente_id: string
          cobrador_id: string | null
          created_at: string
          created_by: string | null
          cuota_diaria: number | null
          dia_cobro: string[] | null
          dias_habiles: number | null
          estado: Database["public"]["Enums"]["estado_prestamo"]
          excluir_domingos: boolean
          excluir_sabados: boolean
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          modelo_interes: Database["public"]["Enums"]["modelo_interes"]
          motivo_cancelacion: string | null
          organization_id: string
          plazo_dias: number
          prestamo_anterior_id: string | null
          tasa_mensual: number
          total_pagar: number | null
        }
        Insert: {
          cancelado_at?: string | null
          capital: number
          cliente_id: string
          cobrador_id?: string | null
          created_at?: string
          created_by?: string | null
          cuota_diaria?: number | null
          dia_cobro?: string[] | null
          dias_habiles?: number | null
          estado?: Database["public"]["Enums"]["estado_prestamo"]
          excluir_domingos?: boolean
          excluir_sabados?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          modelo_interes: Database["public"]["Enums"]["modelo_interes"]
          motivo_cancelacion?: string | null
          organization_id: string
          plazo_dias: number
          prestamo_anterior_id?: string | null
          tasa_mensual: number
          total_pagar?: number | null
        }
        Update: {
          cancelado_at?: string | null
          capital?: number
          cliente_id?: string
          cobrador_id?: string | null
          created_at?: string
          created_by?: string | null
          cuota_diaria?: number | null
          dia_cobro?: string[] | null
          dias_habiles?: number | null
          estado?: Database["public"]["Enums"]["estado_prestamo"]
          excluir_domingos?: boolean
          excluir_sabados?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          modelo_interes?: Database["public"]["Enums"]["modelo_interes"]
          motivo_cancelacion?: string | null
          organization_id?: string
          plazo_dias?: number
          prestamo_anterior_id?: string | null
          tasa_mensual?: number
          total_pagar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prestamos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_prestamo_anterior_id_fkey"
            columns: ["prestamo_anterior_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          id: string
          nombre_completo: string
          organization_id: string | null
          rol: Database["public"]["Enums"]["rol"]
          telefono: string | null
          ultimo_acceso: string | null
        }
        Insert: {
          activo?: boolean
          id: string
          nombre_completo?: string
          organization_id?: string | null
          rol: Database["public"]["Enums"]["rol"]
          telefono?: string | null
          ultimo_acceso?: string | null
        }
        Update: {
          activo?: boolean
          id?: string
          nombre_completo?: string
          organization_id?: string | null
          rol?: Database["public"]["Enums"]["rol"]
          telefono?: string | null
          ultimo_acceso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          created_at: string
          estado: string
          id: string
          metadata: Json
          monto: number
          organization_id: string
          provider: string
          provider_payment_id: string | null
          subscription_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          metadata?: Json
          monto: number
          organization_id: string
          provider: string
          provider_payment_id?: string | null
          subscription_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          metadata?: Json
          monto?: number
          organization_id?: string
          provider?: string
          provider_payment_id?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          activo: boolean
          created_at: string
          features: Json
          id: string
          limite_cobradores: number
          limite_prestamos_activos: number
          nombre: string
          precio_mensual: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          features?: Json
          id?: string
          limite_cobradores?: number
          limite_prestamos_activos?: number
          nombre: string
          precio_mensual: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          features?: Json
          id?: string
          limite_cobradores?: number
          limite_prestamos_activos?: number
          nombre?: string
          precio_mensual?: number
        }
        Relationships: []
      }
      tenant_settings: {
        Row: {
          cobrar_domingos_default: boolean
          cobrar_sabados_default: boolean
          created_at: string
          dias_gracia: number
          geolocalizacion_requerida: boolean
          mora_tipo: string
          mora_valor: number
          organization_id: string
          tasa_interes_default: number
          updated_at: string
          whatsapp_template: string
        }
        Insert: {
          cobrar_domingos_default?: boolean
          cobrar_sabados_default?: boolean
          created_at?: string
          dias_gracia?: number
          geolocalizacion_requerida?: boolean
          mora_tipo?: string
          mora_valor?: number
          organization_id: string
          tasa_interes_default?: number
          updated_at?: string
          whatsapp_template?: string
        }
        Update: {
          cobrar_domingos_default?: boolean
          cobrar_sabados_default?: boolean
          created_at?: string
          dias_gracia?: number
          geolocalizacion_requerida?: boolean
          mora_tipo?: string
          mora_valor?: number
          organization_id?: string
          tasa_interes_default?: number
          updated_at?: string
          whatsapp_template?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          created_at: string
          estado: string
          id: string
          organization_id: string
          periodo_fin: string
          periodo_inicio: string
          plan_id: string
          provider: string | null
          provider_customer_id: string | null
          trial_hasta: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          organization_id: string
          periodo_fin: string
          periodo_inicio?: string
          plan_id: string
          provider?: string | null
          provider_customer_id?: string | null
          trial_hasta?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          organization_id?: string
          periodo_fin?: string
          periodo_inicio?: string
          plan_id?: string
          provider?: string | null
          provider_customer_id?: string | null
          trial_hasta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas_cobro: {
        Row: {
          cliente_id: string
          cobrador_id: string
          created_at: string
          cronograma_pago_id: string
          id: string
          lat: number | null
          lng: number | null
          nota: string | null
          organization_id: string
          prestamo_id: string
          resultado: string
        }
        Insert: {
          cliente_id: string
          cobrador_id: string
          created_at?: string
          cronograma_pago_id: string
          id?: string
          lat?: number | null
          lng?: number | null
          nota?: string | null
          organization_id: string
          prestamo_id: string
          resultado: string
        }
        Update: {
          cliente_id?: string
          cobrador_id?: string
          created_at?: string
          cronograma_pago_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          nota?: string | null
          organization_id?: string
          prestamo_id?: string
          resultado: string
        }
        Relationships: [
          {
            foreignKeyName: "visitas_cobro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_cobro_cobrador_id_fkey"
            columns: ["cobrador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_cobro_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_action: {
        Args: {
          p_accion: string
          p_actor_id: string
          p_actor_rol: string
          p_entidad: string
          p_entidad_id?: string
          p_estado_anterior?: Json
          p_estado_nuevo?: Json
          p_ip?: unknown
          p_organization_id: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      register_payment: {
        Args: {
          p_cliente_id: string
          p_cobrador_id: string
          p_cronograma_pago_id: string
          p_lat?: number
          p_lng?: number
          p_medio_pago: Database["public"]["Enums"]["medio_pago"]
          p_monto: number
          p_nota?: string
          p_organization_id: string
          p_prestamo_id: string
          p_registrado_por: string
          p_tipo: string
        }
        Returns: string
      }
    }
    Enums: {
      estado_cuota: "pendiente" | "pagado" | "parcial" | "vencido" | "cancelado"
      estado_mora: "activa" | "pagada" | "condonada"
      estado_prestamo:
        | "activo"
        | "en_mora"
        | "saldado"
        | "refinanciado"
        | "cancelado"
      estado_suscripcion: "activo" | "trial" | "vencido" | "suspendido"
      medio_pago: "efectivo" | "nequi" | "transferencia"
      modelo_interes: "cuota_fija" | "solo_interes" | "sobre_saldo"
      rol: "super_admin" | "admin" | "cobrador"
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
      estado_cuota: ["pendiente", "pagado", "parcial", "vencido", "cancelado"],
      estado_mora: ["activa", "pagada", "condonada"],
      estado_prestamo: [
        "activo",
        "en_mora",
        "saldado",
        "refinanciado",
        "cancelado",
      ],
      estado_suscripcion: ["activo", "trial", "vencido", "suspendido"],
      medio_pago: ["efectivo", "nequi", "transferencia"],
      modelo_interes: ["cuota_fija", "solo_interes", "sobre_saldo"],
      rol: ["super_admin", "admin", "cobrador"],
    },
  },
} as const

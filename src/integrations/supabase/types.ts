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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          staff_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          staff_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_actions: {
        Row: {
          action_type: string
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          payload: Json
          result: Json | null
          run_id: string | null
          status: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          payload: Json
          result?: Json | null
          run_id?: string | null
          status?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          payload?: Json
          result?: Json | null
          run_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_configs: {
        Row: {
          agent_id: string | null
          business_context: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          language_policy: Json | null
          read_permissions: Json | null
          system_instruction: string
          tool_policy: Json | null
          triggers: Json | null
          version: number | null
          write_permissions: Json | null
        }
        Insert: {
          agent_id?: string | null
          business_context?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_policy?: Json | null
          read_permissions?: Json | null
          system_instruction: string
          tool_policy?: Json | null
          triggers?: Json | null
          version?: number | null
          write_permissions?: Json | null
        }
        Update: {
          agent_id?: string | null
          business_context?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_policy?: Json | null
          read_permissions?: Json | null
          system_instruction?: string
          tool_policy?: Json | null
          triggers?: Json | null
          version?: number | null
          write_permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_configs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_key: string
          avatar_url: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          instance_count: number | null
          mode: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          agent_key: string
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          instance_count?: number | null
          mode?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          agent_key?: string
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          instance_count?: number | null
          mode?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_events: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      ai_memory: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string | null
          id: string
          importance: number | null
          scope: string
          scope_id: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          importance?: number | null
          scope: string
          scope_id?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          importance?: number | null
          scope?: string
          scope_id?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_runs: {
        Row: {
          agent_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_context: Json | null
          model_used: string | null
          output: Json | null
          status: string | null
          tokens_used: number | null
          trigger_event_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_context?: Json | null
          model_used?: string | null
          output?: Json | null
          status?: string | null
          tokens_used?: number | null
          trigger_event_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_context?: Json | null
          model_used?: string | null
          output?: Json | null
          status?: string | null
          tokens_used?: number | null
          trigger_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_trigger_event_id_fkey"
            columns: ["trigger_event_id"]
            isOneToOne: false
            referencedRelation: "ai_events"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_communications: {
        Row: {
          alert_id: string
          communication_type: Database["public"]["Enums"]["communication_type"]
          created_at: string | null
          direction: Database["public"]["Enums"]["communication_direction"]
          duration_seconds: number | null
          id: string
          message_content: string | null
          notes: string | null
          recipient_phone: string
          recipient_type: Database["public"]["Enums"]["recipient_type"]
          recording_url: string | null
          staff_id: string | null
          twilio_sid: string | null
        }
        Insert: {
          alert_id: string
          communication_type: Database["public"]["Enums"]["communication_type"]
          created_at?: string | null
          direction: Database["public"]["Enums"]["communication_direction"]
          duration_seconds?: number | null
          id?: string
          message_content?: string | null
          notes?: string | null
          recipient_phone: string
          recipient_type: Database["public"]["Enums"]["recipient_type"]
          recording_url?: string | null
          staff_id?: string | null
          twilio_sid?: string | null
        }
        Update: {
          alert_id?: string
          communication_type?: Database["public"]["Enums"]["communication_type"]
          created_at?: string | null
          direction?: Database["public"]["Enums"]["communication_direction"]
          duration_seconds?: number | null
          id?: string
          message_content?: string | null
          notes?: string | null
          recipient_phone?: string
          recipient_type?: Database["public"]["Enums"]["recipient_type"]
          recording_url?: string | null
          staff_id?: string | null
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_communications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_communications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          claimed_at: string | null
          claimed_by: string | null
          device_id: string | null
          emergency_services_called: boolean | null
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          member_id: string
          next_of_kin_notified: boolean | null
          received_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["alert_status"] | null
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          claimed_at?: string | null
          claimed_by?: string | null
          device_id?: string | null
          emergency_services_called?: boolean | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          member_id: string
          next_of_kin_notified?: boolean | null
          received_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["alert_status"] | null
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          claimed_at?: string | null
          claimed_by?: string | null
          device_id?: string | null
          emergency_services_called?: boolean | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          member_id?: string
          next_of_kin_notified?: boolean | null
          received_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["alert_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          member_id: string
          priority: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          member_id: string
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          member_id?: string
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          assigned_to_staff_id: string | null
          city: string | null
          country: string | null
          created_at: string
          email_primary: string | null
          first_name: string | null
          full_name: string | null
          groups: string[] | null
          id: string
          last_name: string | null
          last_synced_at: string | null
          linked_member_id: string | null
          notes: string | null
          phone_primary: string | null
          postal_code: string | null
          province: string | null
          referral_source: string | null
          source: string
          stage: string | null
          status: string | null
          tags: string[] | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          assigned_to_staff_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email_primary?: string | null
          first_name?: string | null
          full_name?: string | null
          groups?: string[] | null
          id?: string
          last_name?: string | null
          last_synced_at?: string | null
          linked_member_id?: string | null
          notes?: string | null
          phone_primary?: string | null
          postal_code?: string | null
          province?: string | null
          referral_source?: string | null
          source?: string
          stage?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          assigned_to_staff_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email_primary?: string | null
          first_name?: string | null
          full_name?: string | null
          groups?: string[] | null
          id?: string
          last_name?: string | null
          last_synced_at?: string | null
          linked_member_id?: string | null
          notes?: string | null
          phone_primary?: string | null
          postal_code?: string | null
          province?: string | null
          referral_source?: string | null
          source?: string
          stage?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_assigned_to_staff_id_fkey"
            columns: ["assigned_to_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_linked_member_id_fkey"
            columns: ["linked_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: []
      }
      crm_import_batches: {
        Row: {
          created_at: string
          created_by: string | null
          failed_rows: number
          filename: string
          id: string
          imported_rows: number
          notes: string | null
          skipped_rows: number
          source: string
          status: Database["public"]["Enums"]["import_batch_status"]
          total_rows: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failed_rows?: number
          filename: string
          id?: string
          imported_rows?: number
          notes?: string | null
          skipped_rows?: number
          source?: string
          status?: Database["public"]["Enums"]["import_batch_status"]
          total_rows?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failed_rows?: number
          filename?: string
          id?: string
          imported_rows?: number
          notes?: string | null
          skipped_rows?: number
          source?: string
          status?: Database["public"]["Enums"]["import_batch_status"]
          total_rows?: number
        }
        Relationships: []
      }
      crm_import_rows: {
        Row: {
          batch_id: string
          created_at: string
          dedupe_key: string | null
          error_message: string | null
          id: string
          import_status: Database["public"]["Enums"]["import_row_status"]
          import_target: Database["public"]["Enums"]["import_row_target"] | null
          imported_crm_contact_id: string | null
          imported_member_id: string | null
          parsed_city: string | null
          parsed_country: string | null
          parsed_device_imei: string | null
          parsed_email_primary: string | null
          parsed_first_name: string | null
          parsed_full_name: string | null
          parsed_last_name: string | null
          parsed_membership_type: string | null
          parsed_notes: string | null
          parsed_phone_primary: string | null
          parsed_postal_code: string | null
          parsed_referral_source: string | null
          parsed_stage: string | null
          parsed_status: string | null
          raw: Json
          row_index: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          dedupe_key?: string | null
          error_message?: string | null
          id?: string
          import_status?: Database["public"]["Enums"]["import_row_status"]
          import_target?:
            | Database["public"]["Enums"]["import_row_target"]
            | null
          imported_crm_contact_id?: string | null
          imported_member_id?: string | null
          parsed_city?: string | null
          parsed_country?: string | null
          parsed_device_imei?: string | null
          parsed_email_primary?: string | null
          parsed_first_name?: string | null
          parsed_full_name?: string | null
          parsed_last_name?: string | null
          parsed_membership_type?: string | null
          parsed_notes?: string | null
          parsed_phone_primary?: string | null
          parsed_postal_code?: string | null
          parsed_referral_source?: string | null
          parsed_stage?: string | null
          parsed_status?: string | null
          raw: Json
          row_index: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          dedupe_key?: string | null
          error_message?: string | null
          id?: string
          import_status?: Database["public"]["Enums"]["import_row_status"]
          import_target?:
            | Database["public"]["Enums"]["import_row_target"]
            | null
          imported_crm_contact_id?: string | null
          imported_member_id?: string | null
          parsed_city?: string | null
          parsed_country?: string | null
          parsed_device_imei?: string | null
          parsed_email_primary?: string | null
          parsed_first_name?: string | null
          parsed_full_name?: string | null
          parsed_last_name?: string | null
          parsed_membership_type?: string | null
          parsed_notes?: string | null
          parsed_phone_primary?: string | null
          parsed_postal_code?: string | null
          parsed_referral_source?: string | null
          parsed_stage?: string | null
          parsed_status?: string | null
          raw?: Json
          row_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "crm_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_import_rows_imported_crm_contact_id_fkey"
            columns: ["imported_crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_import_rows_imported_member_id_fkey"
            columns: ["imported_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_profiles: {
        Row: {
          assigned_to_staff_id: string | null
          department: string | null
          groups: string[] | null
          industry: string | null
          member_id: string
          referral_source: string | null
          stage: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to_staff_id?: string | null
          department?: string | null
          groups?: string[] | null
          industry?: string | null
          member_id: string
          referral_source?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to_staff_id?: string | null
          department?: string | null
          groups?: string[] | null
          industry?: string | null
          member_id?: string
          referral_source?: string | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_profiles_assigned_to_staff_id_fkey"
            columns: ["assigned_to_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_profiles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          assigned_at: string | null
          battery_level: number | null
          configuration_status:
            | Database["public"]["Enums"]["device_config_status"]
            | null
          created_at: string | null
          device_type: string | null
          id: string
          imei: string
          last_checkin_at: string | null
          last_location_address: string | null
          last_location_lat: number | null
          last_location_lng: number | null
          member_id: string | null
          notes: string | null
          purchased_at: string | null
          sim_phone_number: string
          status: Database["public"]["Enums"]["device_status"] | null
        }
        Insert: {
          assigned_at?: string | null
          battery_level?: number | null
          configuration_status?:
            | Database["public"]["Enums"]["device_config_status"]
            | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          imei: string
          last_checkin_at?: string | null
          last_location_address?: string | null
          last_location_lat?: number | null
          last_location_lng?: number | null
          member_id?: string | null
          notes?: string | null
          purchased_at?: string | null
          sim_phone_number: string
          status?: Database["public"]["Enums"]["device_status"] | null
        }
        Update: {
          assigned_at?: string | null
          battery_level?: number | null
          configuration_status?:
            | Database["public"]["Enums"]["device_config_status"]
            | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          imei?: string
          last_checkin_at?: string | null
          last_location_address?: string | null
          last_location_lat?: number | null
          last_location_lng?: number | null
          member_id?: string | null
          notes?: string | null
          purchased_at?: string | null
          sim_phone_number?: string
          status?: Database["public"]["Enums"]["device_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          contact_name: string
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          member_id: string
          notes: string | null
          phone: string
          priority_order: number
          relationship: string
          speaks_spanish: boolean | null
        }
        Insert: {
          contact_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          member_id: string
          notes?: string | null
          phone: string
          priority_order: number
          relationship: string
          speaks_spanish?: boolean | null
        }
        Update: {
          contact_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          member_id?: string
          notes?: string | null
          phone?: string
          priority_order?: number
          relationship?: string
          speaks_spanish?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          created_by: string
          description: string
          id: string
          member_id: string | null
          priority: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          created_by: string
          description: string
          id?: string
          member_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          member_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_tickets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          contacted_at: string | null
          converted_at: string | null
          converted_member_id: string | null
          created_at: string
          email: string
          enquiry_type: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          notes: string | null
          phone: string
          preferred_language: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          converted_member_id?: string | null
          created_at?: string
          email: string
          enquiry_type?: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          notes?: string | null
          phone: string
          preferred_language?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          converted_member_id?: string | null
          created_at?: string
          email?: string
          enquiry_type?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          notes?: string | null
          phone?: string
          preferred_language?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_information: {
        Row: {
          additional_notes: string | null
          allergies: string[] | null
          blood_type: string | null
          doctor_name: string | null
          doctor_phone: string | null
          hospital_preference: string | null
          id: string
          medical_conditions: string[] | null
          medications: string[] | null
          member_id: string
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          hospital_preference?: string | null
          id?: string
          medical_conditions?: string[] | null
          medications?: string[] | null
          member_id: string
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          hospital_preference?: string | null
          id?: string
          medical_conditions?: string[] | null
          medications?: string[] | null
          member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_information_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_contact_methods: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          label: string | null
          member_id: string
          type: Database["public"]["Enums"]["contact_method_type"]
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          member_id: string
          type: Database["public"]["Enums"]["contact_method_type"]
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          member_id?: string
          type?: Database["public"]["Enums"]["contact_method_type"]
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_contact_methods_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_interactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          interaction_type: string
          member_id: string
          metadata: Json | null
          staff_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_type: string
          member_id: string
          metadata?: Json | null
          staff_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_type?: string
          member_id?: string
          metadata?: Json | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_interactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_interactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notes: {
        Row: {
          content: string
          created_at: string | null
          followup_completed: boolean | null
          followup_date: string | null
          id: string
          is_pinned: boolean | null
          is_private: boolean | null
          member_id: string
          note_type: string | null
          staff_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          followup_completed?: boolean | null
          followup_date?: string | null
          id?: string
          is_pinned?: boolean | null
          is_private?: boolean | null
          member_id: string
          note_type?: string | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          followup_completed?: boolean | null
          followup_date?: string | null
          id?: string
          is_pinned?: boolean | null
          is_private?: boolean | null
          member_id?: string
          note_type?: string | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string | null
          courtesy_call_frequency: string | null
          courtesy_calls_enabled: boolean | null
          created_at: string | null
          date_of_birth: string
          email: string
          first_name: string
          id: string
          last_name: string
          next_courtesy_call_date: string | null
          nie_dni: string | null
          phone: string
          photo_url: string | null
          postal_code: string
          preferred_contact_method: string | null
          preferred_contact_time: string | null
          preferred_language:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          province: string
          special_instructions: string | null
          status: Database["public"]["Enums"]["member_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string | null
          courtesy_call_frequency?: string | null
          courtesy_calls_enabled?: boolean | null
          created_at?: string | null
          date_of_birth: string
          email: string
          first_name: string
          id?: string
          last_name: string
          next_courtesy_call_date?: string | null
          nie_dni?: string | null
          phone: string
          photo_url?: string | null
          postal_code: string
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          province: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string | null
          courtesy_call_frequency?: string | null
          courtesy_calls_enabled?: boolean | null
          created_at?: string | null
          date_of_birth?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          next_courtesy_call_date?: string | null
          nie_dni?: string | null
          phone?: string
          photo_url?: string | null
          postal_code?: string
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          province?: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          metadata: Json | null
          read_at: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error: string | null
          event_type: string
          id: string
          message: string | null
          provider_message_id: string | null
          status: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          event_type: string
          id?: string
          message?: string | null
          provider_message_id?: string | null
          status?: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          event_type?: string
          id?: string
          message?: string | null
          provider_message_id?: string | null
          status?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          admin_user_id: string
          created_at: string | null
          id: string
          updated_at: string | null
          whatsapp_hot_sales: boolean | null
          whatsapp_number: string | null
          whatsapp_paid_sales: boolean | null
          whatsapp_partner_signup: boolean | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          whatsapp_hot_sales?: boolean | null
          whatsapp_number?: string | null
          whatsapp_paid_sales?: boolean | null
          whatsapp_partner_signup?: boolean | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          whatsapp_hot_sales?: boolean | null
          whatsapp_number?: string | null
          whatsapp_paid_sales?: boolean | null
          whatsapp_partner_signup?: boolean | null
        }
        Relationships: []
      }
      operational_costs: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["cost_category"]
          created_at: string
          due_date: string | null
          frequency: Database["public"]["Enums"]["cost_frequency"]
          id: string
          name: string
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["cost_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["cost_category"]
          created_at?: string
          due_date?: string | null
          frequency?: Database["public"]["Enums"]["cost_frequency"]
          id?: string
          name: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["cost_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["cost_category"]
          created_at?: string
          due_date?: string | null
          frequency?: Database["public"]["Enums"]["cost_frequency"]
          id?: string
          name?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["cost_status"]
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cost_price: number | null
          created_at: string | null
          description: string
          device_id: string | null
          id: string
          item_type: Database["public"]["Enums"]["order_item_type"]
          order_id: string
          product_id: string | null
          quantity: number | null
          tax_amount: number
          tax_rate: number
          total_price: number
          unit_price: number
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          description: string
          device_id?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["order_item_type"]
          order_id: string
          product_id?: string | null
          quantity?: number | null
          tax_amount: number
          tax_rate: number
          total_price: number
          unit_price: number
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          description?: string
          device_id?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["order_item_type"]
          order_id?: string
          product_id?: string | null
          quantity?: number | null
          tax_amount?: number
          tax_rate?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          id: string
          member_id: string
          notes: string | null
          order_number: string
          shipped_at: string | null
          shipping_address_line_1: string
          shipping_address_line_2: string | null
          shipping_amount: number | null
          shipping_city: string
          shipping_country: string | null
          shipping_postal_code: string
          shipping_province: string
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_number: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          member_id: string
          notes?: string | null
          order_number: string
          shipped_at?: string | null
          shipping_address_line_1: string
          shipping_address_line_2?: string | null
          shipping_amount?: number | null
          shipping_city: string
          shipping_country?: string | null
          shipping_postal_code: string
          shipping_province: string
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_number?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          order_number?: string
          shipped_at?: string | null
          shipping_address_line_1?: string
          shipping_address_line_2?: string | null
          shipping_amount?: number | null
          shipping_city?: string
          shipping_country?: string | null
          shipping_postal_code?: string
          shipping_province?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_agreements: {
        Row: {
          agreement_html: string
          confirmed_accept: boolean
          confirmed_read: boolean
          confirmed_understand: boolean
          created_at: string
          id: string
          ip_address: string | null
          partner_id: string
          signed_at: string
          signer_id_number: string
          signer_id_type: string
          signer_name: string
          user_agent: string | null
          version: string
        }
        Insert: {
          agreement_html: string
          confirmed_accept?: boolean
          confirmed_read?: boolean
          confirmed_understand?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          partner_id: string
          signed_at?: string
          signer_id_number: string
          signer_id_type: string
          signer_name: string
          user_agent?: string | null
          version?: string
        }
        Update: {
          agreement_html?: string
          confirmed_accept?: boolean
          confirmed_read?: boolean
          confirmed_understand?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          partner_id?: string
          signed_at?: string
          signer_id_number?: string
          signer_id_type?: string
          signer_name?: string
          user_agent?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_agreements_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_attributions: {
        Row: {
          created_at: string
          first_touch_at: string
          id: string
          last_touch_at: string
          member_id: string
          metadata: Json | null
          partner_id: string
          ref_param: string | null
          source: string
        }
        Insert: {
          created_at?: string
          first_touch_at?: string
          id?: string
          last_touch_at?: string
          member_id: string
          metadata?: Json | null
          partner_id: string
          ref_param?: string | null
          source: string
        }
        Update: {
          created_at?: string
          first_touch_at?: string
          id?: string
          last_touch_at?: string
          member_id?: string
          metadata?: Json | null
          partner_id?: string
          ref_param?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_attributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_attributions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commissions: {
        Row: {
          amount_eur: number
          approved_at: string | null
          cancel_reason: string | null
          created_at: string
          device_id: string | null
          id: string
          member_id: string
          order_id: string | null
          paid_at: string | null
          partner_id: string
          release_at: string | null
          status: Database["public"]["Enums"]["commission_status"]
          trigger_at: string | null
          trigger_event: string
        }
        Insert: {
          amount_eur?: number
          approved_at?: string | null
          cancel_reason?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          member_id: string
          order_id?: string | null
          paid_at?: string | null
          partner_id: string
          release_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          trigger_at?: string | null
          trigger_event?: string
        }
        Update: {
          amount_eur?: number
          approved_at?: string | null
          cancel_reason?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          member_id?: string
          order_id?: string | null
          paid_at?: string | null
          partner_id?: string
          release_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          trigger_at?: string | null
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_invites: {
        Row: {
          channel: Database["public"]["Enums"]["invite_channel"]
          converted_member_id: string | null
          created_at: string
          id: string
          invitee_email: string | null
          invitee_name: string
          invitee_phone: string | null
          metadata: Json | null
          partner_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["invite_status"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["invite_channel"]
          converted_member_id?: string | null
          created_at?: string
          id?: string
          invitee_email?: string | null
          invitee_name: string
          invitee_phone?: string | null
          metadata?: Json | null
          partner_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["invite_channel"]
          converted_member_id?: string | null
          created_at?: string
          id?: string
          invitee_email?: string | null
          invitee_name?: string
          invitee_phone?: string | null
          metadata?: Json | null
          partner_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_invites_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_invites_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_presentations: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          partner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          partner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          partner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          partner_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          partner_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          partner_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_verification_tokens_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          agreement_signed_at: string | null
          agreement_version: string | null
          cif: string | null
          company_name: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          notes_internal: string | null
          payout_beneficiary_name: string | null
          payout_iban: string | null
          payout_method: string
          phone: string | null
          preferred_language: string
          referral_code: string
          status: Database["public"]["Enums"]["partner_status"]
          user_id: string | null
        }
        Insert: {
          agreement_signed_at?: string | null
          agreement_version?: string | null
          cif?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          notes_internal?: string | null
          payout_beneficiary_name?: string | null
          payout_iban?: string | null
          payout_method?: string
          phone?: string | null
          preferred_language?: string
          referral_code: string
          status?: Database["public"]["Enums"]["partner_status"]
          user_id?: string | null
        }
        Update: {
          agreement_signed_at?: string | null
          agreement_version?: string | null
          cif?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          notes_internal?: string | null
          payout_beneficiary_name?: string | null
          payout_iban?: string | null
          payout_method?: string
          phone?: string | null
          preferred_language?: string
          referral_code?: string
          status?: Database["public"]["Enums"]["partner_status"]
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_number: string | null
          member_id: string
          notes: string | null
          order_id: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          member_id: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          member_id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cost_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          selling_price_net: number
          selling_tax_rate: number
          sku: string | null
          supplier_name: string | null
          updated_at: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          selling_price_net?: number
          selling_tax_rate?: number
          sku?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          selling_price_net?: number
          selling_tax_rate?: number
          sku?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registration_drafts: {
        Row: {
          abandoned_at: string | null
          converted_member_id: string | null
          created_at: string
          current_step: number
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          session_id: string
          source: string
          status: string
          updated_at: string
          wizard_data: Json
        }
        Insert: {
          abandoned_at?: string | null
          converted_member_id?: string | null
          created_at?: string
          current_step?: number
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          session_id: string
          source?: string
          status?: string
          updated_at?: string
          wizard_data?: Json
        }
        Update: {
          abandoned_at?: string | null
          converted_member_id?: string | null
          created_at?: string
          current_step?: number
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          session_id?: string
          source?: string
          status?: string
          updated_at?: string
          wizard_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "registration_drafts_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_notes: {
        Row: {
          created_at: string | null
          followup_completed: boolean | null
          id: string
          member_id: string | null
          note_content: string
          requires_followup: boolean | null
          staff_id: string | null
        }
        Insert: {
          created_at?: string | null
          followup_completed?: boolean | null
          id?: string
          member_id?: string | null
          note_content: string
          requires_followup?: boolean | null
          staff_id?: string | null
        }
        Update: {
          created_at?: string | null
          followup_completed?: boolean | null
          id?: string
          member_id?: string | null
          note_content?: string
          requires_followup?: boolean | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_notes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string
          phone: string | null
          preferred_language:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name: string
          phone?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string
          phone?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          billing_frequency: Database["public"]["Enums"]["billing_frequency"]
          created_at: string | null
          has_pendant: boolean | null
          id: string
          member_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          registration_fee_paid: boolean | null
          renewal_date: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          amount: number
          billing_frequency: Database["public"]["Enums"]["billing_frequency"]
          created_at?: string | null
          has_pendant?: boolean | null
          id?: string
          member_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          registration_fee_paid?: boolean | null
          renewal_date: string
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          amount?: number
          billing_frequency?: Database["public"]["Enums"]["billing_frequency"]
          created_at?: string | null
          has_pendant?: boolean | null
          id?: string
          member_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          registration_fee_paid?: boolean | null
          renewal_date?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          member_id: string | null
          priority: string | null
          status: string | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          member_id?: string | null
          priority?: string | null
          status?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          member_id?: string | null
          priority?: string | null
          status?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          staff_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          staff_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          staff_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "internal_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      website_events: {
        Row: {
          browser: string | null
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          device_type: string | null
          event_type: string
          id: string
          language: string | null
          metadata: Json | null
          operating_system: string | null
          page_path: string | null
          page_title: string | null
          referrer: string | null
          region: string | null
          screen_resolution: string | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          language?: string | null
          metadata?: Json | null
          operating_system?: string | null
          page_path?: string | null
          page_title?: string | null
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          language?: string | null
          metadata?: Json | null
          operating_system?: string | null
          page_path?: string | null
          page_title?: string | null
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      website_images: {
        Row: {
          alt_text: string | null
          blur_placeholder: string | null
          created_at: string
          dominant_color: string | null
          id: string
          image_url: string
          location_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alt_text?: string | null
          blur_placeholder?: string | null
          created_at?: string
          dominant_color?: string | null
          id?: string
          image_url: string
          location_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alt_text?: string | null
          blur_placeholder?: string | null
          created_at?: string
          dominant_color?: string | null
          id?: string
          image_url?: string
          location_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_images_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_member_id: { Args: { _user_id: string }; Returns: string }
      get_partner_id: { Args: { _user_id: string }; Returns: string }
      get_sales_command_stats: { Args: never; Returns: Json }
      get_staff_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_todays_birthdays: {
        Args: never
        Returns: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string | null
          courtesy_call_frequency: string | null
          courtesy_calls_enabled: boolean | null
          created_at: string | null
          date_of_birth: string
          email: string
          first_name: string
          id: string
          last_name: string
          next_courtesy_call_date: string | null
          nie_dni: string | null
          phone: string
          photo_url: string | null
          postal_code: string
          preferred_contact_method: string | null
          preferred_contact_time: string | null
          preferred_language:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          province: string
          special_instructions: string | null
          status: Database["public"]["Enums"]["member_status"] | null
          updated_at: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "members"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_role_info: { Args: { _user_id: string }; Returns: Json }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_partner: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      alert_status: "incoming" | "in_progress" | "resolved" | "escalated"
      alert_type:
        | "sos_button"
        | "fall_detected"
        | "low_battery"
        | "geo_fence"
        | "check_in"
        | "manual"
      app_role:
        | "super_admin"
        | "admin"
        | "call_centre"
        | "call_centre_supervisor"
      billing_frequency: "monthly" | "annual"
      commission_status: "pending_release" | "approved" | "paid" | "cancelled"
      communication_direction: "inbound" | "outbound"
      communication_type: "call_inbound" | "call_outbound" | "sms" | "whatsapp"
      contact_method_type: "email" | "phone" | "social" | "other"
      cost_category:
        | "supplier_payment"
        | "operational"
        | "marketing"
        | "staff"
        | "other"
      cost_frequency: "one_time" | "monthly" | "annual"
      cost_status: "pending" | "paid" | "overdue"
      device_config_status: "pending" | "configured" | "failed"
      device_status: "active" | "inactive" | "faulty" | "returned" | "in_stock"
      import_batch_status:
        | "uploaded"
        | "parsed"
        | "importing"
        | "completed"
        | "failed"
      import_row_status: "pending" | "imported" | "failed" | "skipped"
      import_row_target: "member" | "crm_contact" | "skip"
      invite_channel: "email" | "sms" | "whatsapp" | "link"
      invite_status: "draft" | "sent" | "registered" | "converted" | "expired"
      member_status: "active" | "inactive" | "suspended"
      order_item_type:
        | "pendant"
        | "registration_fee"
        | "subscription"
        | "shipping"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      partner_status: "pending" | "active" | "suspended"
      payment_method: "stripe" | "bank_transfer" | "paypal"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      payment_type:
        | "registration"
        | "subscription"
        | "device"
        | "shipping"
        | "order"
      plan_type: "single" | "couple"
      preferred_language: "en" | "es"
      recipient_type: "member" | "emergency_contact" | "emergency_services"
      subscription_status: "active" | "cancelled" | "expired" | "paused"
      ticket_category:
        | "pendant_help"
        | "technical_issue"
        | "member_query"
        | "billing_question"
        | "general"
        | "other"
      ticket_status: "open" | "in_progress" | "pending" | "resolved" | "closed"
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
      alert_status: ["incoming", "in_progress", "resolved", "escalated"],
      alert_type: [
        "sos_button",
        "fall_detected",
        "low_battery",
        "geo_fence",
        "check_in",
        "manual",
      ],
      app_role: [
        "super_admin",
        "admin",
        "call_centre",
        "call_centre_supervisor",
      ],
      billing_frequency: ["monthly", "annual"],
      commission_status: ["pending_release", "approved", "paid", "cancelled"],
      communication_direction: ["inbound", "outbound"],
      communication_type: ["call_inbound", "call_outbound", "sms", "whatsapp"],
      contact_method_type: ["email", "phone", "social", "other"],
      cost_category: [
        "supplier_payment",
        "operational",
        "marketing",
        "staff",
        "other",
      ],
      cost_frequency: ["one_time", "monthly", "annual"],
      cost_status: ["pending", "paid", "overdue"],
      device_config_status: ["pending", "configured", "failed"],
      device_status: ["active", "inactive", "faulty", "returned", "in_stock"],
      import_batch_status: [
        "uploaded",
        "parsed",
        "importing",
        "completed",
        "failed",
      ],
      import_row_status: ["pending", "imported", "failed", "skipped"],
      import_row_target: ["member", "crm_contact", "skip"],
      invite_channel: ["email", "sms", "whatsapp", "link"],
      invite_status: ["draft", "sent", "registered", "converted", "expired"],
      member_status: ["active", "inactive", "suspended"],
      order_item_type: [
        "pendant",
        "registration_fee",
        "subscription",
        "shipping",
      ],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      partner_status: ["pending", "active", "suspended"],
      payment_method: ["stripe", "bank_transfer", "paypal"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      payment_type: [
        "registration",
        "subscription",
        "device",
        "shipping",
        "order",
      ],
      plan_type: ["single", "couple"],
      preferred_language: ["en", "es"],
      recipient_type: ["member", "emergency_contact", "emergency_services"],
      subscription_status: ["active", "cancelled", "expired", "paused"],
      ticket_category: [
        "pendant_help",
        "technical_issue",
        "member_query",
        "billing_question",
        "general",
        "other",
      ],
      ticket_status: ["open", "in_progress", "pending", "resolved", "closed"],
    },
  },
} as const

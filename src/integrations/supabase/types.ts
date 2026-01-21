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
          created_at: string | null
          date_of_birth: string
          email: string
          first_name: string
          id: string
          last_name: string
          nie_dni: string | null
          phone: string
          photo_url: string | null
          postal_code: string
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
          created_at?: string | null
          date_of_birth: string
          email: string
          first_name: string
          id?: string
          last_name: string
          nie_dni?: string | null
          phone: string
          photo_url?: string | null
          postal_code: string
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
          created_at?: string | null
          date_of_birth?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          nie_dni?: string | null
          phone?: string
          photo_url?: string | null
          postal_code?: string
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
      order_items: {
        Row: {
          created_at: string | null
          description: string
          device_id: string | null
          id: string
          item_type: Database["public"]["Enums"]["order_item_type"]
          order_id: string
          quantity: number | null
          tax_amount: number
          tax_rate: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          device_id?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["order_item_type"]
          order_id: string
          quantity?: number | null
          tax_amount: number
          tax_rate: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          device_id?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["order_item_type"]
          order_id?: string
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
      website_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          location_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          location_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
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
      get_member_id: { Args: { _user_id: string }; Returns: string }
      get_staff_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
      app_role: "super_admin" | "admin" | "call_centre"
      billing_frequency: "monthly" | "annual"
      communication_direction: "inbound" | "outbound"
      communication_type: "call_inbound" | "call_outbound" | "sms" | "whatsapp"
      device_config_status: "pending" | "configured" | "failed"
      device_status: "active" | "inactive" | "faulty" | "returned" | "in_stock"
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
      app_role: ["super_admin", "admin", "call_centre"],
      billing_frequency: ["monthly", "annual"],
      communication_direction: ["inbound", "outbound"],
      communication_type: ["call_inbound", "call_outbound", "sms", "whatsapp"],
      device_config_status: ["pending", "configured", "failed"],
      device_status: ["active", "inactive", "faulty", "returned", "in_stock"],
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

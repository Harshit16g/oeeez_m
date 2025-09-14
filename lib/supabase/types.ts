export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          phone: string | null
          website: string | null
          social_links: Json | null
          skills: string[] | null
          portfolio_url: string | null
          hourly_rate: number | null
          availability: "available" | "busy" | "unavailable" | null
          preferences: Json | null
          is_onboarded: boolean
          is_artist: boolean
          user_type: "client" | "artist"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          website?: string | null
          social_links?: Json | null
          skills?: string[] | null
          portfolio_url?: string | null
          hourly_rate?: number | null
          availability?: "available" | "busy" | "unavailable" | null
          preferences?: Json | null
          is_onboarded?: boolean
          is_artist?: boolean
          user_type?: "client" | "artist"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          website?: string | null
          social_links?: Json | null
          skills?: string[] | null
          portfolio_url?: string | null
          hourly_rate?: number | null
          availability?: "available" | "busy" | "unavailable" | null
          preferences?: Json | null
          is_onboarded?: boolean
          is_artist?: boolean
          user_type?: "client" | "artist"
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          client_id: string
          artist_id: string
          event_type: string
          event_date: string
          event_location: string
          budget: number | null
          description: string | null
          status: "pending" | "confirmed" | "cancelled" | "completed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          artist_id: string
          event_type: string
          event_date: string
          event_location: string
          budget?: number | null
          description?: string | null
          status?: "pending" | "confirmed" | "cancelled" | "completed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          artist_id?: string
          event_type?: string
          event_date?: string
          event_location?: string
          budget?: number | null
          description?: string | null
          status?: "pending" | "confirmed" | "cancelled" | "completed"
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: "info" | "success" | "warning" | "error"
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: "info" | "success" | "warning" | "error"
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: "info" | "success" | "warning" | "error"
          read?: boolean
          created_at?: string
        }
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

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: "event_planner" | "artist_manager" | "admin"
          verified: boolean
          phone: string | null
          bio: string | null
          location: string | null
          company: string | null
          onboarding_completed: boolean
          is_onboarded: boolean
          preferences: {
            notifications: {
              email: boolean
              push: boolean
              sms: boolean
            }
            privacy: {
              profileVisible: boolean
              showEmail: boolean
              showPhone: boolean
            }
            theme: "light" | "dark" | "system"
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          role?: "event_planner" | "artist_manager" | "admin"
          verified?: boolean
          phone?: string | null
          bio?: string | null
          location?: string | null
          company?: string | null
          onboarding_completed?: boolean
          is_onboarded?: boolean
          preferences?: {
            notifications: {
              email: boolean
              push: boolean
              sms: boolean
            }
            privacy: {
              profileVisible: boolean
              showEmail: boolean
              showPhone: boolean
            }
            theme: "light" | "dark" | "system"
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: "event_planner" | "artist_manager" | "admin"
          verified?: boolean
          phone?: string | null
          bio?: string | null
          location?: string | null
          company?: string | null
          onboarding_completed?: boolean
          is_onboarded?: boolean
          preferences?: {
            notifications: {
              email: boolean
              push: boolean
              sms: boolean
            }
            privacy: {
              profileVisible: boolean
              showEmail: boolean
              showPhone: boolean
            }
            theme: "light" | "dark" | "system"
          }
          created_at?: string
          updated_at?: string
        }
      }
      artists: {
        Row: {
          id: string
          name: string
          image_url: string | null
          genre: string
          location: string
          availability: "available" | "busy" | "unavailable"
          rating: number
          reviews_count: number
          events_count: number
          price: number
          bio: string
          specialties: string[]
          equipment: string[]
          duration: string
          manager_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          genre: string
          location: string
          availability?: "available" | "busy" | "unavailable"
          rating?: number
          reviews_count?: number
          events_count?: number
          price: number
          bio: string
          specialties?: string[]
          equipment?: string[]
          duration?: string
          manager_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          genre?: string
          location?: string
          availability?: "available" | "busy" | "unavailable"
          rating?: number
          reviews_count?: number
          events_count?: number
          price?: number
          bio?: string
          specialties?: string[]
          equipment?: string[]
          duration?: string
          manager_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          artist_id: string
          event_name: string
          event_type: string
          event_date: string
          event_time: string
          duration: string
          venue: string
          expected_guests: string
          budget: string
          status: "pending" | "confirmed" | "cancelled" | "completed"
          amount: number
          contact_name: string
          contact_email: string
          contact_phone: string
          additional_requirements: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          artist_id: string
          event_name: string
          event_type: string
          event_date: string
          event_time: string
          duration: string
          venue: string
          expected_guests: string
          budget: string
          status?: "pending" | "confirmed" | "cancelled" | "completed"
          amount: number
          contact_name: string
          contact_email: string
          contact_phone: string
          additional_requirements?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          artist_id?: string
          event_name?: string
          event_type?: string
          event_date?: string
          event_time?: string
          duration?: string
          venue?: string
          expected_guests?: string
          budget?: string
          status?: "pending" | "confirmed" | "cancelled" | "completed"
          amount?: number
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          additional_requirements?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: "booking" | "payment" | "review" | "system" | "reminder"
          title: string
          message: string
          read: boolean
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "booking" | "payment" | "review" | "system" | "reminder"
          title: string
          message: string
          read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "booking" | "payment" | "review" | "system" | "reminder"
          title?: string
          message?: string
          read?: boolean
          action_url?: string | null
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
  }
}

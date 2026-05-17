export type UserRole = "client" | "barber" | "owner" | "admin";
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "trialing";
export type PaymentMethod = "card" | "pix" | "cash";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
        };
        Relationships: [];
      };
      barbers: {
        Row: {
          id: string;
          profile_id: string;
          bio: string | null;
          commission_rate: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          bio?: string | null;
          commission_rate?: number;
          is_active?: boolean;
        };
        Update: {
          bio?: string | null;
          commission_rate?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "barbers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          duration_minutes: number;
          category: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          duration_minutes: number;
          category?: string | null;
          image_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          duration_minutes?: number;
          category?: string | null;
          image_url?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      barber_services: {
        Row: {
          barber_id: string;
          service_id: string;
        };
        Insert: {
          barber_id: string;
          service_id: string;
        };
        Update: {
          barber_id?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "barber_services_barber_id_fkey";
            columns: ["barber_id"];
            isOneToOne: false;
            referencedRelation: "barbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "barber_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      working_hours: {
        Row: {
          id: string;
          barber_id: string;
          day: DayOfWeek;
          start_time: string;
          end_time: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          barber_id: string;
          day: DayOfWeek;
          start_time: string;
          end_time: string;
          is_active?: boolean;
        };
        Update: {
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "working_hours_barber_id_fkey";
            columns: ["barber_id"];
            isOneToOne: false;
            referencedRelation: "barbers";
            referencedColumns: ["id"];
          }
        ];
      };
      time_blocks: {
        Row: {
          id: string;
          barber_id: string;
          start_at: string;
          end_at: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          barber_id: string;
          start_at: string;
          end_at: string;
          reason?: string | null;
        };
        Update: {
          start_at?: string;
          end_at?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "time_blocks_barber_id_fkey";
            columns: ["barber_id"];
            isOneToOne: false;
            referencedRelation: "barbers";
            referencedColumns: ["id"];
          }
        ];
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          barber_id: string;
          service_id: string;
          scheduled_at: string;
          ends_at: string;
          status: AppointmentStatus;
          price_paid: number | null;
          notes: string | null;
          reminder_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          barber_id: string;
          service_id: string;
          scheduled_at: string;
          ends_at: string;
          status?: AppointmentStatus;
          price_paid?: number | null;
          notes?: string | null;
          reminder_sent?: boolean;
        };
        Update: {
          status?: AppointmentStatus;
          price_paid?: number | null;
          notes?: string | null;
          scheduled_at?: string;
          ends_at?: string;
          reminder_sent?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_barber_id_fkey";
            columns: ["barber_id"];
            isOneToOne: false;
            referencedRelation: "barbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          client_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status: SubscriptionStatus;
          plan_name: string;
          price: number;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: SubscriptionStatus;
          plan_name?: string;
          price?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          appointment_id: string;
          client_id: string;
          barber_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          client_id: string;
          barber_id: string;
          rating: number;
          comment?: string | null;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: true;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          type: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body?: string | null;
          type?: string | null;
          read?: boolean;
        };
        Update: {
          read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      appointment_status: AppointmentStatus;
      subscription_status: SubscriptionStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      day_of_week: DayOfWeek;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Barber = Database["public"]["Tables"]["barbers"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type WorkingHour = Database["public"]["Tables"]["working_hours"]["Row"];
export type TimeBlock = Database["public"]["Tables"]["time_blocks"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

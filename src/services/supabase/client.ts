import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from '@/config/env'

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type AppDatabase = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          image_url: string
          external_url: string
          tags: string[]
          brand: string | null
          price: number | null
          category_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          image_url: string
          external_url: string
          tags: string[]
          brand?: string | null
          price?: number | null
          category_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          image_url?: string
          external_url?: string
          tags?: string[]
          brand?: string | null
          price?: number | null
          category_id?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          id: string
          created_at: string
          user_id: string
          metrics: Json
          score: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          metrics: Json
          score: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          metrics?: Json
          score?: number
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          id: string
          created_at: string
          scan_id: string
          product_id: string
          reason: string
        }
        Insert: {
          id?: string
          created_at?: string
          scan_id: string
          product_id: string
          reason: string
        }
        Update: {
          id?: string
          created_at?: string
          scan_id?: string
          product_id?: string
          reason?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          api_category_key: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          api_category_key: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          api_category_key?: string
          created_at?: string
        }
        Relationships: []
      }
      product_configs: {
        Row: {
          id: string
          product_id: string
          hex_color: string | null
          texture: string | null
          color_intensity: string | null
          pattern_name: string | null
          extra_params: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          hex_color?: string | null
          texture?: string | null
          color_intensity?: string | null
          pattern_name?: string | null
          extra_params?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          hex_color?: string | null
          texture?: string | null
          color_intensity?: string | null
          pattern_name?: string | null
          extra_params?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

const supabaseEnv = getSupabaseEnv()

export const supabase = createClient<AppDatabase>(
  supabaseEnv.url,
  supabaseEnv.anonKey,
)

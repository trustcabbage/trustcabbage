export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          email: string
          role: 'reviewer' | 'company_admin' | 'admin'
          company_id: string | null
          reviewer_credibility_score: number
          total_reviews_written: number
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          email: string
          role?: 'reviewer' | 'company_admin' | 'admin'
          company_id?: string | null
          reviewer_credibility_score?: number
          total_reviews_written?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          cover_url: string | null
          website: string | null
          founded_year: number | null
          employee_count: string | null
          gst_number: string | null
          cin_number: string | null
          city: string | null
          state: string | null
          status: 'unclaimed' | 'pending' | 'claimed'
          claimed_by: string | null
          created_by: string | null
          average_rating: number
          total_reviews: number
          is_featured: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          website?: string | null
          founded_year?: number | null
          employee_count?: string | null
          gst_number?: string | null
          cin_number?: string | null
          city?: string | null
          state?: string | null
          status?: 'unclaimed' | 'pending' | 'claimed'
          claimed_by?: string | null
          created_by?: string | null
          average_rating?: number
          total_reviews?: number
          is_featured?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          icon: string | null
          description: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          parent_id?: string | null
          icon?: string | null
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      company_categories: {
        Row: { company_id: string; category_id: string }
        Insert: { company_id: string; category_id: string }
        Update: { company_id?: string; category_id?: string }
      }
      products_services: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          type: 'product' | 'service'
          price_range: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          type: 'product' | 'service'
          price_range?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['products_services']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          company_id: string
          reviewer_id: string
          product_service_id: string | null
          association_type: 'current_client' | 'past_client' | 'pilot' | 'partner' | 'vendor' | 'evaluator'
          reviewer_role: 'decision_maker' | 'end_user' | 'evaluator' | 'procurement' | 'other'
          engagement_phase: 'pre_sales' | 'onboarding' | 'active' | 'post_project' | 'long_term'
          association_duration: 'lt_3m' | '3_12m' | '1_3y' | '3y_plus'
          rating_overall: number
          rating_staff: number
          rating_quality: number
          rating_communication: number
          rating_billing: number
          rating_after_sales: number
          rating_delivery: number
          what_went_well: string | null
          what_to_improve: string | null
          would_recommend: 'yes' | 'no' | 'conditional'
          recommend_reason: string | null
          additional_notes: string | null
          is_verified_buyer: boolean
          proof_document_url: string | null
          status: 'pending' | 'published' | 'flagged' | 'removed'
          is_anonymous: boolean
          helpful_votes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          reviewer_id: string
          product_service_id?: string | null
          association_type: 'current_client' | 'past_client' | 'pilot' | 'partner' | 'vendor' | 'evaluator'
          reviewer_role: 'decision_maker' | 'end_user' | 'evaluator' | 'procurement' | 'other'
          engagement_phase: 'pre_sales' | 'onboarding' | 'active' | 'post_project' | 'long_term'
          association_duration: 'lt_3m' | '3_12m' | '1_3y' | '3y_plus'
          rating_overall: number
          rating_staff: number
          rating_quality: number
          rating_communication: number
          rating_billing: number
          rating_after_sales: number
          rating_delivery: number
          what_went_well?: string | null
          what_to_improve?: string | null
          would_recommend: 'yes' | 'no' | 'conditional'
          recommend_reason?: string | null
          additional_notes?: string | null
          is_verified_buyer?: boolean
          proof_document_url?: string | null
          status?: 'pending' | 'published' | 'flagged' | 'removed'
          is_anonymous?: boolean
          helpful_votes?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      review_responses: {
        Row: {
          id: string
          review_id: string
          company_id: string
          responder_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          review_id: string
          company_id: string
          responder_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['review_responses']['Insert']>
      }
      company_claims: {
        Row: {
          id: string
          company_id: string
          claimant_id: string
          proof_type: 'gst' | 'cin' | 'domain_email' | 'other'
          proof_document_url: string | null
          proof_notes: string | null
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          claimant_id: string
          proof_type: 'gst' | 'cin' | 'domain_email' | 'other'
          proof_document_url?: string | null
          proof_notes?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['company_claims']['Insert']>
      }
      review_flags: {
        Row: {
          id: string
          review_id: string
          flagged_by: string
          reason: string
          status: 'open' | 'resolved'
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          flagged_by: string
          reason: string
          status?: 'open' | 'resolved'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['review_flags']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

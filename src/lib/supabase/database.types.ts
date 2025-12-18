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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          icon: string
          id: string
          is_secret: boolean | null
          key: string
          name: string
          points: number | null
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_secret?: boolean | null
          key: string
          name: string
          points?: number | null
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_secret?: boolean | null
          key?: string
          name?: string
          points?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
          vote_type: number
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: number
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_staff_reply: boolean | null
          is_verified_answer: boolean
          parent_id: string | null
          post_id: string
          updated_at: string | null
          upvotes: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_staff_reply?: boolean | null
          is_verified_answer?: boolean
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          upvotes?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_staff_reply?: boolean | null
          is_verified_answer?: boolean
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          created_at: string | null
          email: string
          id: string
          internal_notes: string | null
          message: string
          name: string
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string | null
          email: string
          id?: string
          internal_notes?: string | null
          message: string
          name: string
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          internal_notes?: string | null
          message?: string
          name?: string
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string
          duration_minutes: number
          id: string
          product_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          product_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          product_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          image_url: string | null
          is_public: boolean
          location: string
          rsvp_url: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_public?: boolean
          location: string
          rsvp_url?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_public?: boolean
          location?: string
          rsvp_url?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          module_id: string
          slug: string
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          module_id: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          module_id?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          claim_token: string | null
          claimed_at: string | null
          code: string
          created_at: string | null
          customer_email: string | null
          id: string
          owner_id: string | null
          product_id: string
          source: string | null
          stripe_session_id: string | null
        }
        Insert: {
          claim_token?: string | null
          claimed_at?: string | null
          code: string
          created_at?: string | null
          customer_email?: string | null
          id?: string
          owner_id?: string | null
          product_id: string
          source?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          claim_token?: string | null
          claimed_at?: string | null
          code?: string
          created_at?: string | null
          customer_email?: string | null
          id?: string
          owner_id?: string | null
          product_id?: string
          source?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_custom_page: boolean | null
          last_updated_by: string | null
          page_key: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_custom_page?: boolean | null
          last_updated_by?: string | null
          page_key: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_custom_page?: boolean | null
          last_updated_by?: string | null
          page_key?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      post_votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
          vote_type: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
          vote_type: number
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          product_id: string | null
          slug: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          upvotes: number | null
          view_count: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          view_count?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string | null
          created_by: string | null
          file_size: number | null
          filename: string
          id: string
          image_type: Database["public"]["Enums"]["product_image_type"] | null
          is_primary: boolean | null
          metadata: Json | null
          mime_type: string | null
          product_id: string
          sort_order: number | null
          storage_path: string | null
          type: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          filename: string
          id?: string
          image_type?: Database["public"]["Enums"]["product_image_type"] | null
          is_primary?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          product_id: string
          sort_order?: number | null
          storage_path?: string | null
          type: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          image_type?: Database["public"]["Enums"]["product_image_type"] | null
          is_primary?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          product_id?: string
          sort_order?: number | null
          storage_path?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          priority: number | null
          product_id: string
          tag: Database["public"]["Enums"]["product_tag_type"]
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          priority?: number | null
          product_id: string
          tag: Database["public"]["Enums"]["product_tag_type"]
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          priority?: number | null
          product_id?: string
          tag?: Database["public"]["Enums"]["product_tag_type"]
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          discount_expires_at: string | null
          discount_percent: number | null
          id: string
          is_featured: boolean | null
          low_stock_threshold: number | null
          name: string
          original_price_cents: number | null
          price_cents: number
          slug: string
          specs: Json | null
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number | null
          stripe_price_id: string | null
          track_inventory: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_expires_at?: string | null
          discount_percent?: number | null
          id?: string
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          name: string
          original_price_cents?: number | null
          price_cents: number
          slug: string
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number | null
          stripe_price_id?: string | null
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_expires_at?: string | null
          discount_percent?: number | null
          id?: string
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          original_price_cents?: number | null
          price_cents?: number
          slug?: string
          specs?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number | null
          stripe_price_id?: string | null
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_banners: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          created_by: string | null
          dismiss_duration_hours: number | null
          ends_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_dismissible: boolean | null
          link_text: string | null
          link_url: string | null
          message: string
          pages: string[] | null
          sort_order: number | null
          starts_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          created_by?: string | null
          dismiss_duration_hours?: number | null
          ends_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_dismissible?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message: string
          pages?: string[] | null
          sort_order?: number | null
          starts_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          created_by?: string | null
          dismiss_duration_hours?: number | null
          ends_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_dismissible?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message?: string
          pages?: string[] | null
          sort_order?: number | null
          starts_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          category: string
          content: string
          content_key: string
          content_type: string
          default_value: string | null
          description: string | null
          id: string
          last_updated_by: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          content_key: string
          content_type?: string
          default_value?: string | null
          description?: string | null
          id?: string
          last_updated_by?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          content_key?: string
          content_type?: string
          default_value?: string | null
          description?: string | null
          id?: string
          last_updated_by?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          auto_source: string | null
          created_at: string | null
          description: string | null
          id: string
          is_auto_calculated: boolean | null
          key: string
          label: string
          sort_order: number | null
          suffix: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          auto_source?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_auto_calculated?: boolean | null
          key: string
          label: string
          sort_order?: number | null
          suffix?: string | null
          updated_at?: string | null
          value?: number
        }
        Update: {
          auto_source?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_auto_calculated?: boolean | null
          key?: string
          label?: string
          sort_order?: number | null
          suffix?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          role: string
          social_links: Json | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          role: string
          social_links?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          role?: string
          social_links?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      troubleshooting_articles: {
        Row: {
          category: string
          causes: string[] | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_published: boolean | null
          not_helpful_count: number | null
          problem: string
          related_articles: string[] | null
          slug: string
          solutions: string
          sort_order: number | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          causes?: string[] | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          not_helpful_count?: number | null
          problem: string
          related_articles?: string[] | null
          slug: string
          solutions: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          causes?: string[] | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          not_helpful_count?: number | null
          problem?: string
          related_articles?: string[] | null
          slug?: string
          solutions?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_achievement: {
        Args: {
          p_achievement_key: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_expired_tags: { Args: never; Returns: undefined }
      get_course_progress: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: number
      }
      get_site_stats: {
        Args: never
        Returns: {
          key: string
          label: string
          suffix: string
          value: number
        }[]
      }
      increment_article_view: {
        Args: { article_id: string }
        Returns: undefined
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      is_staff: { Args: { user_id: string }; Returns: boolean }
      record_article_feedback: {
        Args: { article_id: string; is_helpful: boolean }
        Returns: undefined
      }
      update_comment_upvotes: {
        Args: { p_comment_id: string }
        Returns: undefined
      }
      update_post_upvotes: { Args: { p_post_id: string }; Returns: undefined }
      user_owns_product: { Args: { p_product_id: string }; Returns: boolean }
    }
    Enums: {
      product_image_type:
        | "hero"
        | "knolling"
        | "detail"
        | "action"
        | "packaging"
        | "other"
      product_status: "active" | "coming_soon" | "draft"
      product_tag_type:
        | "featured"
        | "discount"
        | "new"
        | "bestseller"
        | "limited"
        | "bundle"
        | "out_of_stock"
      user_role: "admin" | "staff" | "user"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      product_image_type: [
        "hero",
        "knolling",
        "detail",
        "action",
        "packaging",
        "other",
      ],
      product_status: ["active", "coming_soon", "draft"],
      product_tag_type: [
        "featured",
        "discount",
        "new",
        "bestseller",
        "limited",
        "bundle",
        "out_of_stock",
      ],
      user_role: ["admin", "staff", "user"],
    },
  },
} as const

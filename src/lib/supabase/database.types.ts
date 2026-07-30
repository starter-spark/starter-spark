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
    PostgrestVersion: '14.5'
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
          unlock_hint: string | null
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
          unlock_hint?: string | null
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
          unlock_hint?: string | null
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
      analytics_daily_summary: {
        Row: {
          avg_cls: number | null
          avg_fcp: number | null
          avg_inp: number | null
          avg_lcp: number | null
          avg_ttfb: number | null
          created_at: string | null
          date: string
          id: string
          top_pages: Json | null
          total_custom_events: number | null
          total_errors: number | null
          total_pageviews: number | null
          total_warnings: number | null
          unique_sessions: number | null
          unique_visitors: number | null
          updated_at: string | null
        }
        Insert: {
          avg_cls?: number | null
          avg_fcp?: number | null
          avg_inp?: number | null
          avg_lcp?: number | null
          avg_ttfb?: number | null
          created_at?: string | null
          date: string
          id?: string
          top_pages?: Json | null
          total_custom_events?: number | null
          total_errors?: number | null
          total_pageviews?: number | null
          total_warnings?: number | null
          unique_sessions?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_cls?: number | null
          avg_fcp?: number | null
          avg_inp?: number | null
          avg_lcp?: number | null
          avg_ttfb?: number | null
          created_at?: string | null
          date?: string
          id?: string
          top_pages?: Json | null
          total_custom_events?: number | null
          total_errors?: number | null
          total_pageviews?: number | null
          total_warnings?: number | null
          unique_sessions?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_logs: {
        Row: {
          created_at: string | null
          error_count: number | null
          error_paths: Json | null
          fatal_count: number | null
          hour_bucket: string
          id: string
          info_count: number | null
          source: string
          status_codes: Json | null
          total_count: number | null
          updated_at: string | null
          warning_count: number | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          error_paths?: Json | null
          fatal_count?: number | null
          hour_bucket: string
          id?: string
          info_count?: number | null
          source: string
          status_codes?: Json | null
          total_count?: number | null
          updated_at?: string | null
          warning_count?: number | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          error_paths?: Json | null
          fatal_count?: number | null
          hour_bucket?: string
          id?: string
          info_count?: number | null
          source?: string
          status_codes?: Json | null
          total_count?: number | null
          updated_at?: string | null
          warning_count?: number | null
        }
        Relationships: []
      }
      analytics_speed_insights: {
        Row: {
          cls_count: number | null
          cls_p75: number | null
          created_at: string | null
          desktop_count: number | null
          fcp_count: number | null
          fcp_p75: number | null
          hour_bucket: string
          id: string
          inp_count: number | null
          inp_p75: number | null
          lcp_count: number | null
          lcp_p75: number | null
          mobile_count: number | null
          path: string
          route: string | null
          tablet_count: number | null
          total_samples: number | null
          ttfb_count: number | null
          ttfb_p75: number | null
          updated_at: string | null
        }
        Insert: {
          cls_count?: number | null
          cls_p75?: number | null
          created_at?: string | null
          desktop_count?: number | null
          fcp_count?: number | null
          fcp_p75?: number | null
          hour_bucket: string
          id?: string
          inp_count?: number | null
          inp_p75?: number | null
          lcp_count?: number | null
          lcp_p75?: number | null
          mobile_count?: number | null
          path: string
          route?: string | null
          tablet_count?: number | null
          total_samples?: number | null
          ttfb_count?: number | null
          ttfb_p75?: number | null
          updated_at?: string | null
        }
        Update: {
          cls_count?: number | null
          cls_p75?: number | null
          created_at?: string | null
          desktop_count?: number | null
          fcp_count?: number | null
          fcp_p75?: number | null
          hour_bucket?: string
          id?: string
          inp_count?: number | null
          inp_p75?: number | null
          lcp_count?: number | null
          lcp_p75?: number | null
          mobile_count?: number | null
          path?: string
          route?: string | null
          tablet_count?: number | null
          total_samples?: number | null
          ttfb_count?: number | null
          ttfb_p75?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_web_events: {
        Row: {
          created_at: string | null
          event_count: number | null
          event_name: string | null
          event_type: string
          hour_bucket: string
          id: string
          path: string
          route: string | null
          top_countries: Json | null
          top_referrers: Json | null
          unique_devices: number | null
          unique_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_count?: number | null
          event_name?: string | null
          event_type: string
          hour_bucket: string
          id?: string
          path: string
          route?: string | null
          top_countries?: Json | null
          top_referrers?: Json | null
          unique_devices?: number | null
          unique_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_count?: number | null
          event_name?: string | null
          event_type?: string
          hour_bucket?: string
          id?: string
          path?: string
          route?: string | null
          top_countries?: Json | null
          top_referrers?: Json | null
          unique_devices?: number | null
          unique_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          draft_version_id: string | null
          id: string
          key: string
          published_version_id: string | null
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          draft_version_id?: string | null
          id?: string
          key: string
          published_version_id?: string | null
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          draft_version_id?: string | null
          id?: string
          key?: string
          published_version_id?: string | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cms_documents_draft_version_fkey'
            columns: ['draft_version_id']
            isOneToOne: false
            referencedRelation: 'cms_versions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cms_documents_published_version_fkey'
            columns: ['published_version_id']
            isOneToOne: false
            referencedRelation: 'cms_versions'
            referencedColumns: ['id']
          },
        ]
      }
      cms_versions: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          document_id: string
          id: string
          note: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: Json
          document_id: string
          id?: string
          note?: string | null
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          document_id?: string
          id?: string
          note?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'cms_versions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cms_versions_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'cms_documents'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'comment_votes_comment_id_fkey'
            columns: ['comment_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comment_votes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
            foreignKeyName: 'comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
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
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          difficulty: string
          duration_minutes: number
          icon: string | null
          id: string
          is_published: boolean | null
          product_id: string
          slug: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          icon?: string | null
          id?: string
          is_published?: boolean | null
          product_id: string
          slug?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          icon?: string | null
          id?: string
          is_published?: boolean | null
          product_id?: string
          slug?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'courses_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      doc_attachments: {
        Row: {
          created_at: string | null
          file_size: number | null
          filename: string
          id: string
          mime_type: string | null
          page_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          filename: string
          id?: string
          mime_type?: string | null
          page_id: string
          storage_path: string
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string | null
          page_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: 'doc_attachments_page_id_fkey'
            columns: ['page_id']
            isOneToOne: false
            referencedRelation: 'doc_pages'
            referencedColumns: ['id']
          },
        ]
      }
      doc_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'doc_categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'doc_categories'
            referencedColumns: ['id']
          },
        ]
      }
      doc_pages: {
        Row: {
          category_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'doc_pages_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'doc_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'doc_pages_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'doc_pages_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
      lesson_content: {
        Row: {
          code_solution: string | null
          code_starter: string | null
          content: string
          content_blocks: Json
          downloads: Json
          lesson_id: string
          updated_at: string | null
          video_url: string | null
          visual_blocks: Json | null
        }
        Insert: {
          code_solution?: string | null
          code_starter?: string | null
          content?: string
          content_blocks?: Json
          downloads?: Json
          lesson_id: string
          updated_at?: string | null
          video_url?: string | null
          visual_blocks?: Json | null
        }
        Update: {
          code_solution?: string | null
          code_starter?: string | null
          content?: string
          content_blocks?: Json
          downloads?: Json
          lesson_id?: string
          updated_at?: string | null
          video_url?: string | null
          visual_blocks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_content_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'lesson_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number
          estimated_minutes: number | null
          id: string
          is_optional: boolean | null
          is_published: boolean | null
          lesson_type: string | null
          module_id: string
          prerequisites: string[] | null
          slug: string
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number
          estimated_minutes?: number | null
          id?: string
          is_optional?: boolean | null
          is_published?: boolean | null
          lesson_type?: string | null
          module_id: string
          prerequisites?: string[] | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number
          estimated_minutes?: number | null
          id?: string
          is_optional?: boolean | null
          is_published?: boolean | null
          lesson_type?: string | null
          module_id?: string
          prerequisites?: string[] | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'modules'
            referencedColumns: ['id']
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
          purchase_item_ref: string | null
          source: string | null
          status: Database['public']['Enums']['license_status']
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
          purchase_item_ref?: string | null
          source?: string | null
          status?: Database['public']['Enums']['license_status']
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
          purchase_item_ref?: string | null
          source?: string | null
          status?: Database['public']['Enums']['license_status']
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'licenses_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'licenses_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          slug: string | null
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string | null
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string | null
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'modules_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_bookmarks_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_bookmarks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string | null
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason?: string | null
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_reports_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'post_votes_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_votes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
            foreignKeyName: 'posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
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
            foreignKeyName: 'product_media_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_review_reports: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reporter_id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_review_reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_review_reports_review_id_fkey'
            columns: ['review_id']
            isOneToOne: false
            referencedRelation: 'product_reviews'
            referencedColumns: ['id']
          },
        ]
      }
      product_reviews: {
        Row: {
          author_id: string
          body: string
          created_at: string
          edited_at: string | null
          id: string
          incentive_disclosure: string | null
          is_verified_purchase: boolean
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          product_id: string
          rating: number
          status: Database['public']['Enums']['product_review_status']
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          edited_at?: string | null
          id?: string
          incentive_disclosure?: string | null
          is_verified_purchase?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          product_id: string
          rating: number
          status?: Database['public']['Enums']['product_review_status']
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          incentive_disclosure?: string | null
          is_verified_purchase?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          product_id?: string
          rating?: number
          status?: Database['public']['Enums']['product_review_status']
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_reviews_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_reviews_moderated_by_fkey'
            columns: ['moderated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_reviews_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
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
          tag: Database['public']['Enums']['product_tag_type']
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          priority?: number | null
          product_id: string
          tag: Database['public']['Enums']['product_tag_type']
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          priority?: number | null
          product_id?: string
          tag?: Database['public']['Enums']['product_tag_type']
        }
        Relationships: [
          {
            foreignKeyName: 'product_tags_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
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
          max_quantity_per_order: number | null
          name: string
          original_price_cents: number | null
          price_cents: number
          slug: string
          specs: Json | null
          status: Database['public']['Enums']['product_status']
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
          max_quantity_per_order?: number | null
          name: string
          original_price_cents?: number | null
          price_cents: number
          slug: string
          specs?: Json | null
          status?: Database['public']['Enums']['product_status']
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
          max_quantity_per_order?: number | null
          name?: string
          original_price_cents?: number | null
          price_cents?: number
          slug?: string
          specs?: Json | null
          status?: Database['public']['Enums']['product_status']
          stock_quantity?: number | null
          stripe_price_id?: string | null
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_seed: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_banned_from_forums: boolean | null
          preferred_learning_style: string | null
          role: Database['public']['Enums']['user_role'] | null
          skill_level: string | null
          skip_basics: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_seed?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_banned_from_forums?: boolean | null
          preferred_learning_style?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          skill_level?: string | null
          skip_basics?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_seed?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_banned_from_forums?: boolean | null
          preferred_learning_style?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          skill_level?: string | null
          skip_basics?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_checkout_fulfillments: {
        Row: {
          attempt_count: number
          created_at: string
          email_sent_at: string | null
          last_error: string | null
          processed_at: string | null
          status: string
          stock_decremented_at: string | null
          stripe_event_id: string | null
          stripe_session_id: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          email_sent_at?: string | null
          last_error?: string | null
          processed_at?: string | null
          status?: string
          stock_decremented_at?: string | null
          stripe_event_id?: string | null
          stripe_session_id: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          email_sent_at?: string | null
          last_error?: string | null
          processed_at?: string | null
          status?: string
          stock_decremented_at?: string | null
          stripe_event_id?: string | null
          stripe_session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teapot_stats: {
        Row: {
          key: string
          updated_at: string | null
          value: number
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: number
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      teapot_viewers: {
        Row: {
          user_id: string
          viewed_at: string
        }
        Insert: {
          user_id: string
          viewed_at?: string
        }
        Update: {
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teapot_viewers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'user_achievements_achievement_id_fkey'
            columns: ['achievement_id']
            isOneToOne: false
            referencedRelation: 'achievements'
            referencedColumns: ['id']
          },
        ]
      }
      user_learning_stats: {
        Row: {
          last_streak_date: string | null
          level: number
          streak_days: number
          updated_at: string | null
          user_id: string
          xp: number
        }
        Insert: {
          last_streak_date?: string | null
          level?: number
          streak_days?: number
          updated_at?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          last_streak_date?: string | null
          level?: number
          streak_days?: number
          updated_at?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      vercel_log_entries: {
        Row: {
          branch: string | null
          build_id: string | null
          deployment_id: string | null
          destination: string | null
          edge_type: string | null
          entrypoint: string | null
          environment: string | null
          execution_region: string | null
          host: string | null
          id: string
          ja3_digest: string | null
          ja4_digest: string | null
          level: string
          message: string | null
          path: string | null
          project_id: string | null
          project_name: string | null
          proxy: Json | null
          raw: Json
          received_at: string
          request_id: string | null
          source: string
          span_id: string | null
          status_code: number | null
          timestamp: string
          trace_id: string | null
          type: string | null
        }
        Insert: {
          branch?: string | null
          build_id?: string | null
          deployment_id?: string | null
          destination?: string | null
          edge_type?: string | null
          entrypoint?: string | null
          environment?: string | null
          execution_region?: string | null
          host?: string | null
          id: string
          ja3_digest?: string | null
          ja4_digest?: string | null
          level: string
          message?: string | null
          path?: string | null
          project_id?: string | null
          project_name?: string | null
          proxy?: Json | null
          raw: Json
          received_at?: string
          request_id?: string | null
          source: string
          span_id?: string | null
          status_code?: number | null
          timestamp: string
          trace_id?: string | null
          type?: string | null
        }
        Update: {
          branch?: string | null
          build_id?: string | null
          deployment_id?: string | null
          destination?: string | null
          edge_type?: string | null
          entrypoint?: string | null
          environment?: string | null
          execution_region?: string | null
          host?: string | null
          id?: string
          ja3_digest?: string | null
          ja4_digest?: string | null
          level?: string
          message?: string | null
          path?: string | null
          project_id?: string | null
          project_name?: string | null
          proxy?: Json | null
          raw?: Json
          received_at?: string
          request_id?: string | null
          source?: string
          span_id?: string | null
          status_code?: number | null
          timestamp?: string
          trace_id?: string | null
          type?: string | null
        }
        Relationships: []
      }
      vercel_speed_insights_events: {
        Row: {
          browser_engine: string | null
          browser_engine_version: string | null
          city: string | null
          client_name: string | null
          client_type: string | null
          client_version: string | null
          connection_speed: string | null
          country: string | null
          deployment_id: string | null
          device_brand: string | null
          device_id: string | null
          device_type: string | null
          event_id: string
          metric_type: string
          origin: string | null
          os_name: string | null
          os_version: string | null
          owner_id: string | null
          path: string | null
          project_id: string | null
          raw: Json
          received_at: string
          region: string | null
          route: string | null
          sdk_name: string | null
          sdk_version: string | null
          timestamp: string
          value: number
          vercel_environment: string | null
          vercel_url: string | null
        }
        Insert: {
          browser_engine?: string | null
          browser_engine_version?: string | null
          city?: string | null
          client_name?: string | null
          client_type?: string | null
          client_version?: string | null
          connection_speed?: string | null
          country?: string | null
          deployment_id?: string | null
          device_brand?: string | null
          device_id?: string | null
          device_type?: string | null
          event_id: string
          metric_type: string
          origin?: string | null
          os_name?: string | null
          os_version?: string | null
          owner_id?: string | null
          path?: string | null
          project_id?: string | null
          raw: Json
          received_at?: string
          region?: string | null
          route?: string | null
          sdk_name?: string | null
          sdk_version?: string | null
          timestamp: string
          value: number
          vercel_environment?: string | null
          vercel_url?: string | null
        }
        Update: {
          browser_engine?: string | null
          browser_engine_version?: string | null
          city?: string | null
          client_name?: string | null
          client_type?: string | null
          client_version?: string | null
          connection_speed?: string | null
          country?: string | null
          deployment_id?: string | null
          device_brand?: string | null
          device_id?: string | null
          device_type?: string | null
          event_id?: string
          metric_type?: string
          origin?: string | null
          os_name?: string | null
          os_version?: string | null
          owner_id?: string | null
          path?: string | null
          project_id?: string | null
          raw?: Json
          received_at?: string
          region?: string | null
          route?: string | null
          sdk_name?: string | null
          sdk_version?: string | null
          timestamp?: string
          value?: number
          vercel_environment?: string | null
          vercel_url?: string | null
        }
        Relationships: []
      }
      vercel_trace_events: {
        Row: {
          body_base64: string | null
          body_json: Json | null
          content_type: string
          event_id: string
          received_at: string
        }
        Insert: {
          body_base64?: string | null
          body_json?: Json | null
          content_type: string
          event_id: string
          received_at?: string
        }
        Update: {
          body_base64?: string | null
          body_json?: Json | null
          content_type?: string
          event_id?: string
          received_at?: string
        }
        Relationships: []
      }
      vercel_web_analytics_events: {
        Row: {
          browser_engine: string | null
          browser_engine_version: string | null
          city: string | null
          client_name: string | null
          client_type: string | null
          client_version: string | null
          country: string | null
          data_source_name: string | null
          deployment: string | null
          device_brand: string | null
          device_id: string | null
          device_model: string | null
          device_type: string | null
          event_data: string | null
          event_data_json: Json | null
          event_id: string
          event_name: string | null
          event_type: string
          flags: Json | null
          origin: string | null
          os_name: string | null
          os_version: string | null
          owner_id: string | null
          path: string
          project_id: string | null
          query_params: string | null
          raw: Json
          received_at: string
          referrer: string | null
          region: string | null
          route: string | null
          schema: string | null
          sdk_name: string | null
          sdk_version: string | null
          sdk_version_full: string | null
          session_id: string | null
          timestamp: string
          vercel_environment: string | null
          vercel_url: string | null
        }
        Insert: {
          browser_engine?: string | null
          browser_engine_version?: string | null
          city?: string | null
          client_name?: string | null
          client_type?: string | null
          client_version?: string | null
          country?: string | null
          data_source_name?: string | null
          deployment?: string | null
          device_brand?: string | null
          device_id?: string | null
          device_model?: string | null
          device_type?: string | null
          event_data?: string | null
          event_data_json?: Json | null
          event_id: string
          event_name?: string | null
          event_type: string
          flags?: Json | null
          origin?: string | null
          os_name?: string | null
          os_version?: string | null
          owner_id?: string | null
          path: string
          project_id?: string | null
          query_params?: string | null
          raw: Json
          received_at?: string
          referrer?: string | null
          region?: string | null
          route?: string | null
          schema?: string | null
          sdk_name?: string | null
          sdk_version?: string | null
          sdk_version_full?: string | null
          session_id?: string | null
          timestamp: string
          vercel_environment?: string | null
          vercel_url?: string | null
        }
        Update: {
          browser_engine?: string | null
          browser_engine_version?: string | null
          city?: string | null
          client_name?: string | null
          client_type?: string | null
          client_version?: string | null
          country?: string | null
          data_source_name?: string | null
          deployment?: string | null
          device_brand?: string | null
          device_id?: string | null
          device_model?: string | null
          device_type?: string | null
          event_data?: string | null
          event_data_json?: Json | null
          event_id?: string
          event_name?: string | null
          event_type?: string
          flags?: Json | null
          origin?: string | null
          os_name?: string | null
          os_version?: string | null
          owner_id?: string | null
          path?: string
          project_id?: string | null
          query_params?: string | null
          raw?: Json
          received_at?: string
          referrer?: string | null
          region?: string | null
          route?: string | null
          schema?: string | null
          sdk_name?: string | null
          sdk_version?: string | null
          sdk_version_full?: string | null
          session_id?: string | null
          timestamp?: string
          vercel_environment?: string | null
          vercel_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      cms_published: {
        Row: {
          data: Json | null
          key: string | null
          published_at: string | null
          sort_order: number | null
          type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_daily_analytics: {
        Args: { target_date?: string }
        Returns: undefined
      }
      analytics_logs_overview: {
        Args: { end_ts: string; start_ts: string }
        Returns: Json
      }
      analytics_speed_insights_p75: {
        Args: { end_ts: string; start_ts: string }
        Returns: {
          metric_type: string
          p75: number
          sample_count: number
        }[]
      }
      analytics_web_analytics_overview: {
        Args: { end_ts: string; start_ts: string }
        Returns: Json
      }
      apply_learning_xp: {
        Args: { p_completed_at?: string; p_user_id: string; p_xp: number }
        Returns: {
          last_streak_date: string
          level: number
          streak_days: number
          xp: number
        }[]
      }
      award_achievement: {
        Args: {
          p_achievement_key: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: boolean
      }
      ban_user_from_forums: {
        Args: { reason?: string; target_user_id: string }
        Returns: boolean
      }
      cleanup_expired_tags: { Args: never; Returns: undefined }
      decrement_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: {
          stock_quantity: number
        }[]
      }
      get_course_progress: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: number
      }
      increment_article_view: {
        Args: { article_id: string }
        Returns: undefined
      }
      increment_post_view: { Args: { p_post_id: string }; Returns: undefined }
      increment_teapot_api_calls: { Args: never; Returns: number }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      is_banned_from_forums: { Args: { user_id: string }; Returns: boolean }
      is_staff:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      record_article_feedback: {
        Args: { article_id: string; is_helpful: boolean }
        Returns: undefined
      }
      search_docs: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          category_name: string
          category_slug: string
          excerpt: string
          id: string
          rank: number
          slug: string
          title: string
        }[]
      }
      track_teapot_view: { Args: never; Returns: number }
      unban_user_from_forums: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      update_comment_upvotes: {
        Args: { p_comment_id: string }
        Returns: undefined
      }
      update_post_upvotes: { Args: { p_post_id: string }; Returns: undefined }
      user_owns_product: { Args: { p_product_id: string }; Returns: boolean }
    }
    Enums: {
      license_status: 'pending' | 'claimed' | 'rejected' | 'claimed_by_other'
      product_review_status: 'published' | 'flagged' | 'hidden' | 'pending'
      product_status: 'active' | 'coming_soon' | 'draft'
      product_tag_type:
        | 'featured'
        | 'discount'
        | 'new'
        | 'bestseller'
        | 'limited'
        | 'bundle'
        | 'out_of_stock'
      user_role: 'admin' | 'staff' | 'user'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      license_status: ['pending', 'claimed', 'rejected', 'claimed_by_other'],
      product_review_status: ['published', 'flagged', 'hidden', 'pending'],
      product_status: ['active', 'coming_soon', 'draft'],
      product_tag_type: [
        'featured',
        'discount',
        'new',
        'bestseller',
        'limited',
        'bundle',
        'out_of_stock',
      ],
      user_role: ['admin', 'staff', 'user'],
    },
  },
} as const

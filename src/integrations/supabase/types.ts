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
      affiliate_settings: {
        Row: {
          attribution_window_days: number
          commission_percent: number
          discount_percent: number
          id: string
          is_enabled: boolean
          min_withdrawal: number
          updated_at: string
        }
        Insert: {
          attribution_window_days?: number
          commission_percent?: number
          discount_percent?: number
          id?: string
          is_enabled?: boolean
          min_withdrawal?: number
          updated_at?: string
        }
        Update: {
          attribution_window_days?: number
          commission_percent?: number
          discount_percent?: number
          id?: string
          is_enabled?: boolean
          min_withdrawal?: number
          updated_at?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          code_edited: boolean
          created_at: string
          id: string
          payment_bank_account: string | null
          payment_bank_ifsc: string | null
          payment_bank_name: string | null
          payment_upi: string | null
          pending_earnings: number
          referral_code: string
          status: string
          total_clicks: number
          total_earnings: number
          total_paid_referrals: number
          total_referrals: number
          updated_at: string
          user_id: string
          withdrawn_earnings: number
        }
        Insert: {
          code_edited?: boolean
          created_at?: string
          id?: string
          payment_bank_account?: string | null
          payment_bank_ifsc?: string | null
          payment_bank_name?: string | null
          payment_upi?: string | null
          pending_earnings?: number
          referral_code: string
          status?: string
          total_clicks?: number
          total_earnings?: number
          total_paid_referrals?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
          withdrawn_earnings?: number
        }
        Update: {
          code_edited?: boolean
          created_at?: string
          id?: string
          payment_bank_account?: string | null
          payment_bank_ifsc?: string | null
          payment_bank_name?: string | null
          payment_upi?: string | null
          pending_earnings?: number
          referral_code?: string
          status?: string
          total_clicks?: number
          total_earnings?: number
          total_paid_referrals?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
          withdrawn_earnings?: number
        }
        Relationships: []
      }
      ai_strategy_cache: {
        Row: {
          created_at: string
          id: string
          prompt: string
          prompt_hash: string
          strategy_json: Json
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          prompt: string
          prompt_hash: string
          strategy_json: Json
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          prompt_hash?: string
          strategy_json?: Json
          usage_count?: number
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          request_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_runs: {
        Row: {
          created_at: string
          dataset: string
          date_range_end: string | null
          date_range_start: string | null
          equity_curve: Json
          id: string
          metrics: Json
          strategy_config: Json
          trades: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset: string
          date_range_end?: string | null
          date_range_start?: string | null
          equity_curve?: Json
          id?: string
          metrics?: Json
          strategy_config?: Json
          trades?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          dataset?: string
          date_range_end?: string | null
          date_range_start?: string | null
          equity_curve?: Json
          id?: string
          metrics?: Json
          strategy_config?: Json
          trades?: Json
          user_id?: string
        }
        Relationships: []
      }
      backtests: {
        Row: {
          confidence_score: number | null
          created_at: string
          deleted_at: string | null
          end_date: string
          id: string
          initial_capital: number
          is_deleted: boolean
          losing_trades: number | null
          max_drawdown: number | null
          net_pnl: number | null
          profit_factor: number | null
          project_id: string | null
          results: Json | null
          start_date: string
          strategy_id: string
          strategy_version_id: string | null
          symbol: string
          timeframe: string
          total_trades: number | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          deleted_at?: string | null
          end_date: string
          id?: string
          initial_capital: number
          is_deleted?: boolean
          losing_trades?: number | null
          max_drawdown?: number | null
          net_pnl?: number | null
          profit_factor?: number | null
          project_id?: string | null
          results?: Json | null
          start_date: string
          strategy_id: string
          strategy_version_id?: string | null
          symbol: string
          timeframe: string
          total_trades?: number | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string
          id?: string
          initial_capital?: number
          is_deleted?: boolean
          losing_trades?: number | null
          max_drawdown?: number | null
          net_pnl?: number | null
          profit_factor?: number | null
          project_id?: string | null
          results?: Json | null
          start_date?: string
          strategy_id?: string
          strategy_version_id?: string | null
          symbol?: string
          timeframe?: string
          total_trades?: number | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backtests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backtests_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backtests_strategy_version_id_fkey"
            columns: ["strategy_version_id"]
            isOneToOne: false
            referencedRelation: "strategy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          affiliate_id: string
          amount_paid: number
          approved_at: string | null
          commission_amount: number
          commission_percent: number
          created_at: string
          id: string
          paid_at: string | null
          plan_purchased: string
          referral_id: string
          referred_user_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          amount_paid: number
          approved_at?: string | null
          commission_amount: number
          commission_percent: number
          created_at?: string
          id?: string
          paid_at?: string | null
          plan_purchased: string
          referral_id: string
          referred_user_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount_paid?: number
          approved_at?: string | null
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          plan_purchased?: string
          referral_id?: string
          referred_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      community_strategies: {
        Row: {
          created_at: string
          dataset_used: string
          date_range_end: string | null
          date_range_start: string | null
          equity_curve: Json
          id: string
          performance_metrics: Json
          strategy_config: Json
          strategy_name: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          dataset_used: string
          date_range_end?: string | null
          date_range_start?: string | null
          equity_curve?: Json
          id?: string
          performance_metrics?: Json
          strategy_config?: Json
          strategy_name: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          dataset_used?: string
          date_range_end?: string | null
          date_range_start?: string | null
          equity_curve?: Json
          id?: string
          performance_metrics?: Json
          strategy_config?: Json
          strategy_name?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      data_versions: {
        Row: {
          created_at: string
          csv_hash: string | null
          data_source: string | null
          exchange_source: string | null
          id: string
          import_date: string
          uploaded_file_id: string
          user_id: string
          version_id: string | null
        }
        Insert: {
          created_at?: string
          csv_hash?: string | null
          data_source?: string | null
          exchange_source?: string | null
          id?: string
          import_date?: string
          uploaded_file_id: string
          user_id: string
          version_id?: string | null
        }
        Update: {
          created_at?: string
          csv_hash?: string | null
          data_source?: string | null
          exchange_source?: string | null
          id?: string
          import_date?: string
          uploaded_file_id?: string
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_versions_uploaded_file_id_fkey"
            columns: ["uploaded_file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_history: {
        Row: {
          created_at: string
          event_data: Json
          event_type: Database["public"]["Enums"]["experiment_event_type"]
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: Database["public"]["Enums"]["experiment_event_type"]
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: Database["public"]["Enums"]["experiment_event_type"]
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["feedback_status"]
          type: Database["public"]["Enums"]["feedback_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["feedback_status"]
          type?: Database["public"]["Enums"]["feedback_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["feedback_status"]
          type?: Database["public"]["Enums"]["feedback_type"]
          user_id?: string
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          close: number
          created_at: string
          high: number
          id: string
          low: number
          open: number
          symbol: string
          timeframe: string
          timestamp: string
          volume: number
        }
        Insert: {
          close: number
          created_at?: string
          high: number
          id?: string
          low: number
          open: number
          symbol: string
          timeframe: string
          timestamp: string
          volume?: number
        }
        Update: {
          close?: number
          created_at?: string
          high?: number
          id?: string
          low?: number
          open?: number
          symbol?: string
          timeframe?: string
          timestamp?: string
          volume?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_capital: number | null
          display_name: string | null
          email: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id: string
          monthly_backtests_used: number
          monthly_reset_date: string
          onboarding_completed: boolean | null
          phone: string | null
          referred_by: string | null
          strategies_count: number | null
          terms_accepted_at: string | null
          total_backtests_used: number | null
          trading_preference:
            | Database["public"]["Enums"]["trading_preference"]
            | null
          updated_at: string
          uploaded_files_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          default_capital?: number | null
          display_name?: string | null
          email?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          monthly_backtests_used?: number
          monthly_reset_date?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          referred_by?: string | null
          strategies_count?: number | null
          terms_accepted_at?: string | null
          total_backtests_used?: number | null
          trading_preference?:
            | Database["public"]["Enums"]["trading_preference"]
            | null
          updated_at?: string
          uploaded_files_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          default_capital?: number | null
          display_name?: string | null
          email?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          monthly_backtests_used?: number
          monthly_reset_date?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          referred_by?: string | null
          strategies_count?: number | null
          terms_accepted_at?: string | null
          total_backtests_used?: number | null
          trading_preference?:
            | Database["public"]["Enums"]["trading_preference"]
            | null
          updated_at?: string
          uploaded_files_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string
          id: string
          ip_address: string | null
          referral_code: string
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referral_code: string
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referral_code?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          affiliate_id: string
          converted_at: string | null
          created_at: string
          discount_applied: number | null
          id: string
          referral_code: string
          referred_user_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          converted_at?: string | null
          created_at?: string
          discount_applied?: number | null
          id?: string
          referral_code: string
          referred_user_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          converted_at?: string | null
          created_at?: string
          discount_applied?: number | null
          id?: string
          referral_code?: string
          referred_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          created_at: string
          current_version: number
          description: string | null
          id: string
          is_ai_generated: boolean | null
          name: string
          project_id: string | null
          rules: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_version?: number
          description?: string | null
          id?: string
          is_ai_generated?: boolean | null
          name: string
          project_id?: string | null
          rules?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_version?: number
          description?: string | null
          id?: string
          is_ai_generated?: boolean | null
          name?: string
          project_id?: string | null
          rules?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_health: {
        Row: {
          created_at: string
          health_score: number | null
          id: string
          last_checked_at: string | null
          metrics: Json | null
          status: Database["public"]["Enums"]["health_status"] | null
          strategy_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          health_score?: number | null
          id?: string
          last_checked_at?: string | null
          metrics?: Json | null
          status?: Database["public"]["Enums"]["health_status"] | null
          strategy_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          health_score?: number | null
          id?: string
          last_checked_at?: string | null
          metrics?: Json | null
          status?: Database["public"]["Enums"]["health_status"] | null
          strategy_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_health_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_journals: {
        Row: {
          content: string | null
          created_at: string
          id: string
          strategy_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          strategy_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          strategy_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_journals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_likes: {
        Row: {
          created_at: string
          id: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          strategy_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_likes_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "community_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_versions: {
        Row: {
          changelog: string | null
          created_at: string
          id: string
          rules: Json
          strategy_id: string
          version_number: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          id?: string
          rules?: Json
          strategy_id: string
          version_number?: number
        }
        Update: {
          changelog?: string | null
          created_at?: string
          id?: string
          rules?: Json
          strategy_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategy_versions_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          backtest_id: string
          created_at: string
          entry_price: number
          entry_time: string
          exit_price: number | null
          exit_time: string | null
          id: string
          pnl: number | null
          quantity: number
          side: string
        }
        Insert: {
          backtest_id: string
          created_at?: string
          entry_price: number
          entry_time: string
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          pnl?: number | null
          quantity: number
          side: string
        }
        Update: {
          backtest_id?: string
          created_at?: string
          entry_price?: number
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          pnl?: number | null
          quantity?: number
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_backtest_id_fkey"
            columns: ["backtest_id"]
            isOneToOne: false
            referencedRelation: "backtests"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_files: {
        Row: {
          created_at: string
          csv_hash: string | null
          data_source: string | null
          date_range_end: string | null
          date_range_start: string | null
          exchange_source: string | null
          file_name: string
          file_size: number | null
          id: string
          project_id: string | null
          row_count: number | null
          symbol: string
          timeframe: string
          user_id: string
        }
        Insert: {
          created_at?: string
          csv_hash?: string | null
          data_source?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          exchange_source?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          project_id?: string | null
          row_count?: number | null
          symbol: string
          timeframe?: string
          user_id: string
        }
        Update: {
          created_at?: string
          csv_hash?: string | null
          data_source?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          exchange_source?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          project_id?: string | null
          row_count?: number | null
          symbol?: string
          timeframe?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          consented_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          consent_type: string
          consented_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          consent_type?: string
          consented_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          payment_details: Json
          payment_method: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json
          payment_method?: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json
          payment_method?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_strategy_like_count: {
        Args: { _strategy_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_affiliate_stats: {
        Args: { _affiliate_id: string; _commission_amount: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "affiliate"
      experience_level: "beginner" | "intermediate" | "advanced"
      experiment_event_type:
        | "strategy_change"
        | "param_change"
        | "backtest_run"
        | "data_change"
      feedback_status: "open" | "in_progress" | "resolved" | "closed"
      feedback_type: "bug" | "feature" | "general"
      health_status: "stable" | "weakening" | "needs_review"
      subscription_status: "active" | "cancelled" | "expired" | "pending"
      trading_preference: "intraday" | "swing" | "long_term"
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
      app_role: ["admin", "user", "affiliate"],
      experience_level: ["beginner", "intermediate", "advanced"],
      experiment_event_type: [
        "strategy_change",
        "param_change",
        "backtest_run",
        "data_change",
      ],
      feedback_status: ["open", "in_progress", "resolved", "closed"],
      feedback_type: ["bug", "feature", "general"],
      health_status: ["stable", "weakening", "needs_review"],
      subscription_status: ["active", "cancelled", "expired", "pending"],
      trading_preference: ["intraday", "swing", "long_term"],
    },
  },
} as const

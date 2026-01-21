export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
          created_at: string;
          updated_at: string;
          streak_count: number;
          last_activity: string | null;
          total_words_learned: number;
          quiz_high_score: number;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
          streak_count?: number;
          last_activity?: string | null;
          total_words_learned?: number;
          quiz_high_score?: number;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
          streak_count?: number;
          last_activity?: string | null;
          total_words_learned?: number;
          quiz_high_score?: number;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          word: string;
          definition_data: Json;
          created_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          word: string;
          definition_data: Json;
          created_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          word?: string;
          definition_data?: Json;
          created_at?: string;
          notes?: string | null;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_words: {
        Row: {
          id: string;
          collection_id: string;
          word: string;
          definition_data: Json;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          word: string;
          definition_data: Json;
          added_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          word?: string;
          definition_data?: Json;
          added_at?: string;
        };
      };
      quiz_results: {
        Row: {
          id: string;
          user_id: string;
          quiz_type: string;
          score: number;
          total_questions: number;
          time_taken_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_type: string;
          score: number;
          total_questions: number;
          time_taken_seconds: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_type?: string;
          score?: number;
          total_questions?: number;
          time_taken_seconds?: number;
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          unlocked_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_type: string;
          unlocked_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_type?: string;
          unlocked_at?: string;
          metadata?: Json | null;
        };
      };
      word_of_the_day: {
        Row: {
          id: string;
          word: string;
          definition_data: Json;
          featured_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          definition_data: Json;
          featured_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          definition_data?: Json;
          featured_date?: string;
          created_at?: string;
        };
      };
      flashcard_progress: {
        Row: {
          id: string;
          user_id: string;
          word: string;
          ease_factor: number;
          interval_days: number;
          next_review: string;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word: string;
          ease_factor?: number;
          interval_days?: number;
          next_review?: string;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          word?: string;
          ease_factor?: number;
          interval_days?: number;
          next_review?: string;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

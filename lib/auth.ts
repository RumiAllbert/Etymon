import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { createServerClient, isSupabaseConfigured } from "./supabase";

// Build providers array based on available credentials
const providers: NextAuthOptions["providers"] = [];

// Only add Google provider if credentials are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Only add GitHub provider if credentials are set
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

// Add a credentials provider as fallback for development
if (providers.length === 0) {
  providers.push(
    CredentialsProvider({
      name: "Demo",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" },
      },
      async authorize(credentials) {
        // Demo mode - accept any email
        if (credentials?.email) {
          return {
            id: "demo-user",
            email: credentials.email,
            name: "Demo User",
          };
        }
        return null;
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Skip Supabase integration if not configured
      if (!isSupabaseConfigured()) {
        return true;
      }

      const supabase = createServerClient();
      if (!supabase) return true;

      try {
        // Check if user exists, if not create them
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();

        if (!existingUser) {
          const { error } = await supabase.from("users").insert({
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          } as { email: string; name: string | null; image: string | null });

          if (error) {
            console.error("Error creating user:", error);
            // Don't block sign in if DB insert fails
          }
        }
      } catch (err) {
        console.error("Error in signIn callback:", err);
        // Don't block sign in if DB operations fail
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Skip Supabase integration if not configured
        if (!isSupabaseConfigured()) {
          session.user.id = token.sub;
          return session;
        }

        const supabase = createServerClient();
        if (!supabase) {
          session.user.id = token.sub;
          return session;
        }

        try {
          const { data: user } = await supabase
            .from("users")
            .select("id, streak_count, total_words_learned, quiz_high_score")
            .eq("email", session.user.email!)
            .single();

          if (user) {
            const typedUser = user as {
              id: string;
              streak_count: number;
              total_words_learned: number;
              quiz_high_score: number;
            };
            session.user.id = typedUser.id;
            session.user.streakCount = typedUser.streak_count;
            session.user.totalWordsLearned = typedUser.total_words_learned;
            session.user.quizHighScore = typedUser.quiz_high_score;
          } else {
            session.user.id = token.sub;
          }
        } catch (err) {
          console.error("Error in session callback:", err);
          session.user.id = token.sub;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key-change-in-production",
};

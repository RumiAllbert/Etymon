import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      streakCount?: number;
      totalWordsLearned?: number;
      quizHighScore?: number;
    };
  }

  interface User {
    id: string;
    streakCount?: number;
    totalWordsLearned?: number;
    quizHighScore?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

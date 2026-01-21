"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import {
  User,
  LogIn,
  LogOut,
  Heart,
  FolderOpen,
  Trophy,
  Flame,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-700/50 animate-pulse" />
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg dark:bg-gray-800/80 bg-white/80 border dark:border-gray-700/50 border-gray-200/50 hover:dark:bg-gray-700/80 hover:bg-gray-100/80 transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span className="text-sm font-medium">Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg dark:bg-gray-800/80 bg-white/80 border dark:border-gray-700/50 border-gray-200/50 hover:dark:bg-gray-700/80 hover:bg-gray-100/80 transition-colors"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm border dark:border-gray-700/50 border-gray-200/50 shadow-xl z-50 overflow-hidden">
            {/* User info */}
            <div className="p-4 border-b dark:border-gray-700/50 border-gray-200/50">
              <div className="flex items-center gap-3">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{session.user?.name}</p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-b dark:border-gray-700/50 border-gray-200/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-bold">
                      {session.user?.streakCount || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Streak</p>
                </div>
                <div>
                  <span className="font-bold">
                    {session.user?.totalWordsLearned || 0}
                  </span>
                  <p className="text-xs text-gray-500">Words</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">
                      {session.user?.quizHighScore || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Best</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <Link
                href="/favorites"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:dark:bg-gray-700/50 hover:bg-gray-100/50 transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </Link>
              <Link
                href="/collections"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:dark:bg-gray-700/50 hover:bg-gray-100/50 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Collections</span>
              </Link>
              <Link
                href="/quiz"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:dark:bg-gray-700/50 hover:bg-gray-100/50 transition-colors"
              >
                <Trophy className="w-4 h-4" />
                <span>Quizzes</span>
              </Link>
            </div>

            {/* Sign out */}
            <div className="p-2 border-t dark:border-gray-700/50 border-gray-200/50">
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:dark:bg-gray-700/50 hover:bg-gray-100/50 transition-colors w-full text-left text-red-500"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

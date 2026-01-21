"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "Access was denied. You may not have permission to sign in.",
    Verification: "The verification link may have expired or already been used.",
    Default: "An error occurred during authentication.",
  };

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-medium dark:text-white text-gray-900 mb-2">
          Authentication Error
        </h1>
        <p className="dark:text-gray-400 text-gray-600 mb-6">
          {errorMessages[error || ""] || errorMessages.Default}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="px-6 py-2 rounded-lg border dark:border-gray-700 border-gray-300 hover:dark:bg-gray-800 hover:bg-gray-100 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen dark:bg-gray-900 bg-white" />}>
      <ErrorContent />
    </Suspense>
  );
}

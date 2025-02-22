import { Github, Home } from "lucide-react";
import Link from "next/link";

export default function Outbound() {
  return (
    <div className="flex gap-4">
      <Link
        href="/"
        className="dark:text-gray-400 text-gray-600 hover:dark:text-gray-100 hover:text-gray-900 transition-colors"
      >
        <Home className="w-5 h-5" />
      </Link>
      <Link
        href="https://github.com/rumiallbert/etymon"
        target="_blank"
        className="dark:text-gray-400 text-gray-600 hover:dark:text-gray-100 hover:text-gray-900 transition-colors"
      >
        <Github className="w-5 h-5" />
      </Link>
    </div>
  );
}

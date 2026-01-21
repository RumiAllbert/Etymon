"use client";

import { useAtom } from "jotai";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Clock,
  Globe,
  Sparkles,
  BookOpen,
  Gamepad2,
  ArrowLeftRight,
  Moon,
  Sun,
  History,
} from "lucide-react";
import {
  showTimelinePanelAtom,
  timelineWordAtom,
  showCognatesPanelAtom,
  cognatesWordAtom,
  showWotdPanelAtom,
  inputValueAtom,
  showHistoryAtom,
} from "../utils/atoms";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  index: number;
  isOpen: boolean;
  color: string;
  total: number;
}

function MenuItem({ icon, label, onClick, href, index, isOpen, color, total }: MenuItemProps) {
  const baseClasses = `
    flex items-center gap-3
    px-4 py-2.5 rounded-full
    bg-white dark:bg-gray-800
    shadow-lg shadow-black/5 dark:shadow-black/20
    border border-gray-100 dark:border-gray-700
    whitespace-nowrap
    transition-all duration-300
    hover:scale-105 hover:shadow-xl hover:bg-gray-50 dark:hover:bg-gray-750
  `;

  const content = (
    <>
      <span className={color}>{icon}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
}

export default function FloatingMenu() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [, setShowTimeline] = useAtom(showTimelinePanelAtom);
  const [, setTimelineWord] = useAtom(timelineWordAtom);
  const [, setShowCognates] = useAtom(showCognatesPanelAtom);
  const [, setCognatesWord] = useAtom(cognatesWordAtom);
  const [, setShowWotd] = useAtom(showWotdPanelAtom);
  const [, setShowHistory] = useAtom(showHistoryAtom);
  const [inputValue] = useAtom(inputValueAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTimeline = () => {
    if (inputValue) {
      setTimelineWord(inputValue);
      setShowTimeline(true);
    }
    setIsOpen(false);
  };

  const handleCognates = () => {
    if (inputValue) {
      setCognatesWord(inputValue);
      setShowCognates(true);
    }
    setIsOpen(false);
  };

  const hasWord = !!inputValue;

  // Build menu items
  const menuItems = [
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Word of Day",
      onClick: () => { setShowWotd(true); setIsOpen(false); },
      color: "text-yellow-500",
    },
    {
      icon: <History className="w-4 h-4" />,
      label: "History",
      onClick: () => { setShowHistory(true); setIsOpen(false); },
      color: "text-gray-500",
    },
    ...(hasWord ? [
      {
        icon: <Clock className="w-4 h-4" />,
        label: "Timeline",
        onClick: handleTimeline,
        color: "text-purple-500",
      },
      {
        icon: <Globe className="w-4 h-4" />,
        label: "Cognates",
        onClick: handleCognates,
        color: "text-cyan-500",
      },
    ] : []),
    {
      icon: <Gamepad2 className="w-4 h-4" />,
      label: "Quiz",
      href: "/quiz",
      color: "text-green-500",
    },
    {
      icon: <ArrowLeftRight className="w-4 h-4" />,
      label: "Compare",
      href: "/compare",
      color: "text-orange-500",
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Explore",
      href: "/explore",
      color: "text-indigo-500",
    },
  ];

  const allItems = [
    ...menuItems,
    ...(mounted ? [{
      icon: theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
      label: theme === "light" ? "Dark Mode" : "Light Mode",
      onClick: () => { setTheme(theme === "light" ? "dark" : "light"); },
      color: theme === "light" ? "text-gray-600" : "text-yellow-400",
    }] : []),
  ];

  return (
    <div
      className="fixed bottom-6 left-6 z-50"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Invisible hover area to prevent jank */}
      <div
        className={`
          absolute bottom-0 left-0
          transition-all duration-300 ease-out
          ${isOpen ? "w-48 h-[500px]" : "w-14 h-14"}
        `}
      />

      {/* Menu Items Container */}
      <div
        className={`
          absolute bottom-16 left-0
          flex flex-col gap-2
          transition-all duration-500 ease-out
          ${isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
          }
        `}
      >
        {allItems.map((item, index) => (
          <div
            key={item.label}
            className="transition-all duration-300 ease-out"
            style={{
              transitionDelay: isOpen ? `${index * 40}ms` : "0ms",
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateX(0)" : "translateX(-20px)",
            }}
          >
            <MenuItem
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
              href={item.href}
              index={index}
              isOpen={isOpen}
              color={item.color}
              total={allItems.length}
            />
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-14 h-14 rounded-2xl
          bg-gradient-to-br from-blue-500 to-blue-600
          shadow-lg shadow-blue-500/30
          flex items-center justify-center
          transition-all duration-500 ease-out
          hover:shadow-xl hover:shadow-blue-500/40
          hover:scale-105
          ${isOpen ? "rounded-xl" : ""}
        `}
      >
        <div className="relative w-6 h-6">
          <Menu
            className={`
              absolute inset-0 w-6 h-6 text-white
              transition-all duration-300 ease-out
              ${isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}
            `}
          />
          <X
            className={`
              absolute inset-0 w-6 h-6 text-white
              transition-all duration-300 ease-out
              ${isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"}
            `}
          />
        </div>
      </button>
    </div>
  );
}

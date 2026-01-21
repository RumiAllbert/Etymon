"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GripHorizontal, X } from "lucide-react";

interface DraggablePanelProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  className?: string;
}

export default function DraggablePanel({
  children,
  title,
  icon,
  onClose,
  initialPosition,
  className = "",
}: DraggablePanelProps) {
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on the close button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);

    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: rect.left,
        initialY: rect.top,
      };
      if (!hasBeenDragged) {
        setHasBeenDragged(true);
        setPosition({ x: rect.left, y: rect.top });
      }
    }
  }, [hasBeenDragged]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    let newX = dragRef.current.initialX + deltaX;
    let newY = dragRef.current.initialY + deltaY;

    // Keep panel within viewport bounds
    const panelWidth = panelRef.current?.offsetWidth || 400;
    const panelHeight = panelRef.current?.offsetHeight || 300;

    newX = Math.max(0, Math.min(newX, window.innerWidth - panelWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - panelHeight));

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Dynamic positioning styles
  const positionStyles = hasBeenDragged
    ? {
        position: "fixed" as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "none",
      }
    : {};

  return (
    <div
      ref={panelRef}
      className={`
        ${className}
        ${isDragging ? "shadow-2xl scale-[1.02]" : "shadow-xl"}
        transition-shadow duration-200
      `}
      style={positionStyles}
    >
      {/* Drag Handle Header */}
      <div
        data-drag-handle
        onMouseDown={handleMouseDown}
        className={`
          flex items-center justify-between
          px-4 py-3
          border-b border-gray-200/50 dark:border-gray-700/50
          rounded-t-xl
          ${isDragging ? "cursor-grabbing" : "cursor-grab"}
          bg-gray-50/50 dark:bg-gray-800/50
          select-none
        `}
      >
        <div className="flex items-center gap-3">
          {/* Drag indicator */}
          <div className="flex items-center text-gray-400 dark:text-gray-500">
            <GripHorizontal className="w-5 h-5" />
          </div>

          {/* Title with icon */}
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-serif font-medium">{title}</h2>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="
            p-1 rounded-lg
            text-gray-400 hover:text-gray-600
            dark:text-gray-500 dark:hover:text-gray-300
            hover:bg-gray-200/50 dark:hover:bg-gray-700/50
            transition-colors
          "
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Panel Content */}
      {children}
    </div>
  );
}

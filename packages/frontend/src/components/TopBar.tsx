"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { TextMorph } from "torph/react";
import { ShareMenu } from "./ShareMenu";
import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
  status?: string;
  toastVisible?: boolean;
  onOpen?: () => void;
  onDownload?: (format: "md" | "txt" | "pdf") => void;
  onCopyLink?: () => void;
  onEdit?: () => void;
  onToggleReading?: () => void;
  readingMode?: boolean;
  hasContent?: boolean;
  openLabel?: string;
}

export function TopBar({ status = "sendmd", toastVisible, onOpen, onDownload, onCopyLink, onEdit, onToggleReading, readingMode, hasContent, openLabel = "Open" }: TopBarProps) {
  const [shareOpen, setShareOpen] = useState(false);

  const handleShareClick = useCallback(() => {
    setShareOpen((prev) => !prev);
  }, []);

  const handleDownload = useCallback(
    (format: "md" | "txt" | "pdf") => {
      onDownload?.(format);
      setShareOpen(false);
    },
    [onDownload]
  );

  const handleClose = useCallback(() => {
    setShareOpen(false);
  }, []);

  const btnClass = "text-[11px] font-medium uppercase tracking-[0.08em] text-ink opacity-80 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0";

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] items-center h-full pt-2">
      <div className="flex gap-6">
        {onOpen && (
          <button onClick={onOpen} className={btnClass}>
            {openLabel}
          </button>
        )}
        {onEdit && (
          <button onClick={onEdit} className={btnClass}>
            Edit
          </button>
        )}
        {onToggleReading && (
          <button onClick={onToggleReading} className={btnClass}>
            {readingMode ? "Edit" : "Read"}
          </button>
        )}
      </div>

      <Link href="/" className={`font-serif italic text-2xl tracking-[-0.02em] transition-opacity duration-300 no-underline text-ink ${toastVisible ? "opacity-0" : "opacity-100"}`}>
        <TextMorph>{status}</TextMorph>
      </Link>

      <div className="relative flex gap-6 justify-end items-center">
        <ThemeToggle />
        <button
          onClick={handleShareClick}
          className={`text-[11px] font-medium uppercase tracking-[0.08em] text-ink transition-opacity bg-transparent border-none cursor-pointer p-0 ${hasContent ? "opacity-80 hover:opacity-100" : "opacity-30 cursor-default"}`}
          disabled={!hasContent}
        >
          Share
        </button>
        <ShareMenu
          open={shareOpen && !!hasContent}
          onClose={handleClose}
          onDownload={handleDownload}
          onCopyLink={onCopyLink}
        />
      </div>
    </nav>
  );
}

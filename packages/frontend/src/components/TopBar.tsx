"use client";

import { useState, useCallback } from "react";
import { TextMorph } from "torph/react";
import { ShareMenu } from "./ShareMenu";
import type { TtlHours } from "@sendmd/shared";

interface TopBarProps {
  status?: string;
  toastVisible?: boolean;
  onOpen?: () => void;
  onDownload?: (format: "md" | "txt" | "pdf") => void;
  onShare?: (ttlHours: TtlHours) => void;
  hasContent?: boolean;
}

export function TopBar({ status = "sendmd", toastVisible, onOpen, onDownload, onShare, hasContent }: TopBarProps) {
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

  return (
    <nav className="flex items-center justify-between h-full pt-5">
      <div className="flex gap-6">
        <button
          onClick={onOpen}
          className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink opacity-80 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0"
        >
          Open
        </button>
      </div>

      <div className={`font-serif italic text-2xl tracking-[-0.02em] transition-opacity duration-300 ${toastVisible ? "opacity-0" : "opacity-100"}`}>
        <TextMorph>{status}</TextMorph>
      </div>

      <div className="relative flex gap-6">
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
          onShare={onShare}
        />
      </div>
    </nav>
  );
}

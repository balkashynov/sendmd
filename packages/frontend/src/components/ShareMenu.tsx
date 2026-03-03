"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TtlHours } from "@sendmd/shared";

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  onDownload: (format: "md" | "txt" | "pdf") => void;
  onShare?: (ttlHours: TtlHours) => void;
}

const TTL_OPTIONS: { label: string; value: TtlHours }[] = [
  { label: "1 hour", value: 1 },
  { label: "24 hours", value: 24 },
  { label: "7 days", value: 168 },
  { label: "30 days", value: 720 },
];

export function ShareMenu({ open, onClose, onDownload, onShare }: ShareMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showTtl, setShowTtl] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowTtl(false);
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  const handleCopyLinkClick = useCallback(() => {
    setShowTtl((prev) => !prev);
  }, []);

  const handleTtlSelect = useCallback(
    (ttl: TtlHours) => {
      onShare?.(ttl);
      setShowTtl(false);
      onClose();
    },
    [onShare, onClose]
  );

  if (!open) return null;

  const itemClass =
    "w-full text-left px-4 py-2.5 text-[12px] uppercase tracking-[0.06em] text-ink bg-transparent border-none hover:bg-ink/5 transition-colors cursor-pointer";

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-2 bg-parchment border border-rule shadow-lg z-50 min-w-[180px] py-1"
    >
      <button onClick={() => onDownload("md")} className={itemClass}>
        Download .md
      </button>
      <button onClick={() => onDownload("txt")} className={itemClass}>
        Download .txt
      </button>
      <div className="h-px bg-rule mx-3 my-1" />
      <button onClick={() => onDownload("pdf")} className={itemClass}>
        Download .pdf
      </button>
      <div className="h-px bg-rule mx-3 my-1" />
      <button
        onClick={handleCopyLinkClick}
        className={`${itemClass} ${!onShare ? "opacity-30 cursor-not-allowed" : ""}`}
        disabled={!onShare}
      >
        Copy link
        {!onShare && <span className="text-[10px] normal-case tracking-normal text-muted ml-2">soon</span>}
      </button>
      {showTtl && onShare && (
        <div className="border-t border-rule mt-1 pt-1">
          {TTL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTtlSelect(opt.value)}
              className={`${itemClass} pl-8 text-[11px] normal-case`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

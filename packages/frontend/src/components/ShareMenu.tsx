"use client";

import { useEffect, useRef } from "react";

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  onDownload: (format: "md" | "txt" | "pdf") => void;
  onCopyLink?: () => void;
}

export function ShareMenu({ open, onClose, onDownload, onCopyLink }: ShareMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
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
        onClick={() => { onCopyLink?.(); onClose(); }}
        className={`${itemClass} ${!onCopyLink ? "opacity-30 cursor-not-allowed" : ""}`}
        disabled={!onCopyLink}
      >
        Copy link
        {!onCopyLink && <span className="text-[10px] normal-case tracking-normal text-muted ml-2">soon</span>}
      </button>
    </div>
  );
}

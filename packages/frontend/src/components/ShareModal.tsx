"use client";

import { useState, useCallback, useEffect } from "react";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<string>; // returns the full URL
}

export function ShareModal({ open, onClose, onConfirm }: ShareModalProps) {
  const [state, setState] = useState<"confirm" | "loading" | "success" | "error">("confirm");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setState("confirm");
      setUrl("");
      setError("");
      setCopied(false);
    }
  }, [open]);

  const handleConfirm = useCallback(async () => {
    setState("loading");
    try {
      const resultUrl = await onConfirm();
      setUrl(resultUrl);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, [onConfirm]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, handleEsc]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-parchment border border-rule px-8 py-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {state === "confirm" && (
          <>
            <h2 className="font-serif italic text-2xl mb-4">Share link</h2>
            <p className="text-[13px] text-ink leading-[1.6] mb-2">
              This will create a snapshot of your current document and generate a shareable link.
            </p>
            <p className="text-[12px] text-muted leading-[1.5] mb-6">
              The link will be available for 7 days. Any further edits you make will not be reflected in the shared version.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="text-[11px] uppercase tracking-[0.08em] text-muted hover:text-ink transition-colors bg-transparent border-none cursor-pointer px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="text-[11px] uppercase tracking-[0.08em] text-white bg-ink hover:bg-ink/80 transition-colors border-none cursor-pointer px-4 py-2"
              >
                Create link
              </button>
            </div>
          </>
        )}

        {state === "loading" && (
          <>
            <h2 className="font-serif italic text-2xl mb-4">Share link</h2>
            <p className="text-[13px] text-muted">Creating link...</p>
          </>
        )}

        {state === "success" && (
          <>
            <h2 className="font-serif italic text-2xl mb-4">Link ready</h2>
            <p className="text-[12px] text-muted leading-[1.5] mb-4">
              Anyone with this link can view your document. Expires in 7 days.
            </p>
            <div className="flex items-center border border-rule bg-white/50 mb-6">
              <span className="flex-1 px-3 py-2.5 text-[13px] text-ink truncate select-all">
                {url}
              </span>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 px-3 py-2.5 border-l border-rule bg-transparent hover:bg-ink/5 transition-colors cursor-pointer border-t-0 border-b-0 border-r-0"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="text-[11px] uppercase tracking-[0.08em] text-muted hover:text-ink transition-colors bg-transparent border-none cursor-pointer px-3 py-2"
              >
                Done
              </button>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <h2 className="font-serif italic text-2xl mb-4">Share failed</h2>
            <p className="text-[13px] text-red-600 leading-[1.5] mb-6">{error}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="text-[11px] uppercase tracking-[0.08em] text-muted hover:text-ink transition-colors bg-transparent border-none cursor-pointer px-3 py-2"
              >
                Close
              </button>
              <button
                onClick={handleConfirm}
                className="text-[11px] uppercase tracking-[0.08em] text-white bg-ink hover:bg-ink/80 transition-colors border-none cursor-pointer px-4 py-2"
              >
                Retry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

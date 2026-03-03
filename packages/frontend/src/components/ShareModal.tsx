"use client";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShareModal({ open, onClose }: ShareModalProps) {
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
        <h2 className="font-serif italic text-2xl mb-4">Share</h2>
        <p className="text-[11px] uppercase tracking-[0.06em] text-muted">
          Coming soon
        </p>
      </div>
    </div>
  );
}

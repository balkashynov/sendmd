"use client";

import { useState, useCallback, useRef } from "react";
import { sileo } from "sileo";
import type { TtlHours } from "@sendmd/shared";
import { TopBar } from "@/components/TopBar";
import { DropZone } from "@/components/DropZone";
import { uploadDoc } from "@/lib/api";

export default function Home() {
  const [content, setContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropZoneRef = useRef<{ handleIncomingText: (text: string) => void }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: "error" | "success", opts: Parameters<typeof sileo.error>[0]) => {
    const duration = opts.duration ?? 6000;
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), duration + 300);
    const style = type === "error"
      ? { fill: "#DC2626", styles: { title: "!text-white font-semibold", description: "!text-white/90", badge: "!bg-white/20 [&_svg]:!text-white [&_svg]:!stroke-white" } }
      : { fill: "#16A34A", styles: { title: "!text-white font-semibold", description: "!text-white/90", badge: "!bg-white/20 [&_svg]:!text-white [&_svg]:!stroke-white" } };
    sileo[type]({ ...style, ...opts, duration });
  }, []);

  const editing = content.length > 0;
  const lineCount = content ? content.split("\n").length : 0;
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleOpen = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (text) {
            dropZoneRef.current?.handleIncomingText(text);
          }
        };
        reader.readAsText(file);
      } else {
        const ext = file.name.split(".").pop() || "unknown";
        showToast("error", {
          title: "Unsupported file",
          description: `.${ext} files are not supported. Use .md or .txt`,
          duration: 4000,
        });
      }
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [showToast]
  );

  const handleDownload = useCallback(
    (format: "md" | "txt" | "pdf") => {
      if (!content) return;
      const date = new Date().toISOString().slice(0, 10);
      const filename = `sendmd-${date}`;

      if (format === "pdf") {
        const preview = document.querySelector("[data-preview]") as HTMLElement;
        if (!preview) return;

        // Clone the preview so we can style it for PDF without affecting the UI
        const clone = preview.cloneNode(true) as HTMLElement;
        clone.style.height = "auto";
        clone.style.overflow = "visible";
        clone.style.padding = "0";
        clone.style.width = "700px";
        document.body.appendChild(clone);

        import("html2pdf.js").then((mod) => {
          const html2pdf = mod.default;
          html2pdf()
            .set({
              margin: [0.75, 0.75, 0.75, 0.75],
              filename: `${filename}.pdf`,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
            })
            .from(clone)
            .save()
            .then(() => {
              document.body.removeChild(clone);
              showToast("success", {
                title: "Downloaded",
                description: `Saved as ${filename}.pdf`,
                duration: 3000,
              });
            });
        });
        return;
      }

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      showToast("success", {
        title: "Downloaded",
        description: `Saved as ${filename}.${format}`,
        duration: 3000,
      });
    },
    [content, showToast]
  );

  const handleShare = useCallback(
    async (ttlHours: TtlHours) => {
      if (!content) return;
      try {
        const result = await uploadDoc(content, ttlHours);
        const fullUrl = `${window.location.origin}${result.url}`;
        await navigator.clipboard.writeText(fullUrl);
        setStatusOverride("shared");
        setTimeout(() => setStatusOverride(null), 2000);
        showToast("success", {
          title: "Link copied!",
          description: fullUrl,
          duration: 5000,
        });
      } catch (err) {
        showToast("error", {
          title: "Share failed",
          description: err instanceof Error ? err.message : "Something went wrong",
          duration: 4000,
        });
      }
    },
    [content, showToast]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const text = ev.target?.result as string;
            if (text) {
              dropZoneRef.current?.handleIncomingText(text);
            }
          };
          reader.readAsText(file);
        } else {
          const ext = file.name.split(".").pop() || "unknown";
          showToast("error", {
            title: "Unsupported file",
            description: `.${ext} files are not supported. Use .md or .txt`,
            duration: 4000,
          });
        }
        return;
      }

      const text = e.dataTransfer.getData("text/plain");
      if (text) {
        dropZoneRef.current?.handleIncomingText(text);
      }
    },
    []
  );

  return (
    <div
      className="h-screen w-screen relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
    <div className="grid grid-rows-[80px_1fr_120px] h-full max-w-[1600px] mx-auto px-10 relative max-md:px-5 max-md:grid-rows-[60px_1fr_auto] max-md:h-[100dvh]">
      {/* Nav header */}
      <TopBar status={statusOverride ?? (editing ? "editing" : "sendmd")} toastVisible={toastVisible} onOpen={handleOpen} onDownload={handleDownload} onShare={editing ? handleShare : undefined} hasContent={editing} />
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Main stage */}
      <main
        className={`
          flex flex-col relative overflow-hidden
          ${editing ? "" : "justify-center items-center"}
        `}
      >
        {/* Horizon line — only in prompt mode */}
        {!editing && (
          <div className="absolute top-1/2 -left-10 -right-10 h-px bg-rule z-0 pointer-events-none max-md:-left-5 max-md:-right-5" />
        )}

        <DropZone ref={dropZoneRef} onContentChange={setContent} />
      </main>

      {/* Footer */}
      <footer className="grid grid-cols-3 pt-6 border-t border-rule items-start max-md:grid-cols-1 max-md:gap-6 max-md:pb-6 max-md:border-t-0">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted mb-1">
            Status
          </span>
          <span className="text-[11px] text-ink leading-[1.4] max-w-[200px]">
            {editing ? (
              <>Editing &middot; {lineCount} {lineCount === 1 ? "line" : "lines"} &middot; {wordCount} {wordCount === 1 ? "word" : "words"}</>
            ) : (
              <>Ready for input<br />Markdown supported</>
            )}
          </span>
        </div>

        <div className="flex flex-col gap-2 max-md:hidden">
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted mb-1">
            Shortcuts
          </span>
          <span className="text-[11px] text-ink leading-[1.4] max-w-[200px]">
            CMD+V to paste<br />
            CMD+O to open
          </span>
        </div>

        <div className="flex flex-col gap-2 max-md:hidden">
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted mb-1">
            Info
          </span>
          <span className="text-[11px] text-ink leading-[1.4] max-w-[200px]">
            Markdown to shareable link
          </span>
        </div>
      </footer>
    </div>

      {/* Full-page drag overlay */}
      <div
        className={`absolute inset-0 bg-parchment/90 z-50 flex justify-center items-center transition-opacity duration-300 pointer-events-none ${isDragging ? "opacity-100" : "opacity-0"}`}
      >
        <span className="font-serif italic text-[32px]">release to open</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { sileo } from "sileo";
import type { DocResponse } from "@sendmd/shared";
import { TopBar } from "@/components/TopBar";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { ShareModal } from "@/components/ShareModal";
import { ScrollRail } from "@/components/ScrollRail";
import { fetchDoc } from "@/lib/api";

export default function SharedDoc() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropConfirmOpen, setDropConfirmOpen] = useState(false);
  const pendingContent = useRef<string | null>(null);
  const dragCounter = useRef(0);
  const viewerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetchDoc(id)
      .then(setDoc)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const currentUrl = typeof window !== "undefined" ? `${window.location.origin}/s/${id}` : "";
  const wordCount = doc ? doc.content.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleCopyLink = useCallback(() => {
    setShareModalOpen(true);
  }, []);

  // Share modal just returns the existing URL (no new upload)
  const handleShareConfirm = useCallback(async (): Promise<string> => {
    return currentUrl;
  }, [currentUrl]);

  const handleDownload = useCallback(
    (format: "md" | "txt" | "pdf") => {
      if (!doc) return;
      const date = new Date().toISOString().slice(0, 10);
      const filename = `sendmd-${date}`;

      if (format === "pdf") {
        const preview = document.querySelector("[data-preview]") as HTMLElement;
        if (!preview) return;
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
            .then(() => document.body.removeChild(clone));
        });
        return;
      }

      const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [doc]
  );

  const handleEdit = useCallback(() => {
    if (!doc) return;
    // Store content in sessionStorage so the home page can pick it up
    sessionStorage.setItem("sendmd_edit_content", doc.content);
    sileo.info({
      fill: "#1F1F1F",
      styles: {
        title: "!text-white font-semibold",
        description: "!text-white/90",
        badge: "!bg-white/20 [&_svg]:!text-white [&_svg]:!stroke-white",
      },
      title: "Editing a copy",
      description: "This is a new document. The original shared link is unchanged.",
      duration: 5000,
    });
    router.push("/");
  }, [doc, router]);

  const handleOpenNew = useCallback(() => {
    sessionStorage.removeItem("sendmd_tab_draft");
    sessionStorage.removeItem("sendmd_edit_content");
    localStorage.removeItem("sendmd_draft");
    router.push("/");
  }, [router]);

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
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
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
            pendingContent.current = text;
            setDropConfirmOpen(true);
          }
        };
        reader.readAsText(file);
      } else {
        sileo.error({
          fill: "#DC2626",
          styles: { title: "!text-white font-semibold", description: "!text-white/90", badge: "!bg-white/20 [&_svg]:!text-white [&_svg]:!stroke-white" },
          title: "Unsupported file",
          description: `.${file.name.split(".").pop()} files are not supported. Use .md or .txt`,
          duration: 4000,
        });
      }
      return;
    }

    const text = e.dataTransfer.getData("text/plain");
    if (text) {
      pendingContent.current = text;
      setDropConfirmOpen(true);
    }
  }, []);

  const handleDropConfirm = useCallback(() => {
    if (pendingContent.current) {
      sessionStorage.setItem("sendmd_edit_content", pendingContent.current);
      pendingContent.current = null;
      setDropConfirmOpen(false);
      window.open("/", "_blank");
    }
  }, []);

  const handleDropCancel = useCallback(() => {
    pendingContent.current = null;
    setDropConfirmOpen(false);
  }, []);

  const formatDate = (iso: string, short = false) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(short ? {} : { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const gridClass = "grid grid-rows-[80px_1fr_56px] h-screen max-w-[1600px] mx-auto px-10 relative max-md:px-3 max-md:grid-rows-[60px_1fr_auto] max-md:h-[100dvh]";

  if (loading) {
    return (
      <div className={gridClass}>
        <TopBar />
        <main className="flex justify-center overflow-hidden">
          <div className="w-full max-w-[700px] py-8 px-10 max-md:px-4 animate-pulse">
            {/* Title */}
            <div className="h-[28px] bg-rule/60 rounded w-[45%] mb-8" />
            {/* Paragraphs */}
            <div className="space-y-3 mb-8">
              <div className="h-[14px] bg-rule/40 rounded w-full" />
              <div className="h-[14px] bg-rule/40 rounded w-[92%]" />
              <div className="h-[14px] bg-rule/40 rounded w-[78%]" />
            </div>
            {/* Subheading */}
            <div className="h-[22px] bg-rule/50 rounded w-[30%] mb-6" />
            {/* Paragraphs */}
            <div className="space-y-3 mb-8">
              <div className="h-[14px] bg-rule/40 rounded w-full" />
              <div className="h-[14px] bg-rule/40 rounded w-[85%]" />
              <div className="h-[14px] bg-rule/40 rounded w-[95%]" />
              <div className="h-[14px] bg-rule/40 rounded w-[60%]" />
            </div>
            {/* Subheading */}
            <div className="h-[22px] bg-rule/50 rounded w-[35%] mb-6" />
            {/* Paragraphs */}
            <div className="space-y-3">
              <div className="h-[14px] bg-rule/40 rounded w-[88%]" />
              <div className="h-[14px] bg-rule/40 rounded w-full" />
              <div className="h-[14px] bg-rule/40 rounded w-[72%]" />
            </div>
          </div>
        </main>
        <footer />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className={gridClass}>
        <TopBar onOpen={handleOpenNew} openLabel="New" />
        <main className="flex flex-col items-center justify-center gap-3">
          <span className="font-serif italic text-2xl text-ink">not found</span>
          <span className="text-[12px] text-muted">
            {error || "This document may have expired or been deleted."}
          </span>
        </main>
        <footer />
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={gridClass}>
        <TopBar
          onOpen={handleOpenNew}
          openLabel="New"
          onEdit={handleEdit}
          onDownload={handleDownload}
          onCopyLink={handleCopyLink}
          hasContent
        />

        <main className="relative">
          <div ref={viewerScrollRef} className="absolute inset-0 overflow-y-auto flex justify-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="w-full max-w-[700px] py-8">
              <MarkdownRenderer content={doc.content} />
            </div>
          </div>
          <ScrollRail content={doc.content} scrollRef={viewerScrollRef} />
        </main>

        <footer className="flex items-center gap-6 pt-3 border-t border-rule max-md:pb-4 max-md:border-t-0">
          <span className="text-[11px] text-ink leading-[1.4]">
            {wordCount} {wordCount === 1 ? "word" : "words"} &middot; {Math.max(1, Math.ceil(wordCount / 200))} min read &middot; {doc.views} {doc.views === 1 ? "view" : "views"}
          </span>
          <span className="text-[11px] text-muted leading-[1.4] ml-auto max-md:hidden">
            Expires {formatDate(doc.expires_at, true)}
          </span>
        </footer>

        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onConfirm={handleShareConfirm}
        />
      </div>

      {/* Drag overlay */}
      <div
        className={`absolute inset-0 bg-parchment/90 z-50 flex justify-center items-center transition-opacity duration-300 pointer-events-none ${isDragging ? "opacity-100" : "opacity-0"}`}
      >
        <span className="font-serif italic text-[32px]">release to open</span>
      </div>

      {/* Drop confirm dialog */}
      {dropConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm"
          onClick={handleDropCancel}
        >
          <div
            className="bg-parchment border border-rule px-8 py-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif italic text-2xl mb-4">Open new file</h2>
            <p className="text-[13px] text-ink leading-[1.6] mb-6">
              This will open the dropped file in a new tab as a new document. The current shared document will remain unchanged.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDropCancel}
                className="text-[11px] uppercase tracking-[0.08em] text-muted hover:text-ink transition-colors bg-transparent border-none cursor-pointer px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDropConfirm}
                className="text-[11px] uppercase tracking-[0.08em] text-white bg-ink hover:bg-ink/80 transition-colors border-none cursor-pointer px-4 py-2"
              >
                Open in new tab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

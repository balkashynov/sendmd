"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { DocResponse } from "@sendmd/shared";
import { TopBar } from "@/components/TopBar";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { fetchDoc } from "@/lib/api";

export default function SharedDoc() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchDoc(id)
      .then(setDoc)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="grid grid-rows-[80px_1fr_120px] h-screen max-w-[1600px] mx-auto px-10 relative max-md:px-5 max-md:grid-rows-[60px_1fr_auto] max-md:h-[100dvh]">
        <TopBar />
        <main className="flex items-center justify-center">
          <span className="font-serif italic text-xl text-muted">loading...</span>
        </main>
        <footer />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="grid grid-rows-[80px_1fr_120px] h-screen max-w-[1600px] mx-auto px-10 relative max-md:px-5 max-md:grid-rows-[60px_1fr_auto] max-md:h-[100dvh]">
        <TopBar />
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
    <div className="grid grid-rows-[80px_1fr_120px] h-screen max-w-[1600px] mx-auto px-10 relative max-md:px-5 max-md:grid-rows-[60px_1fr_auto] max-md:h-[100dvh]">
      <TopBar />

      <main className="flex flex-col items-center relative overflow-y-auto">
        <div className="w-full max-w-[700px] py-8">
          <MarkdownRenderer content={doc.content} />
        </div>
      </main>

      <footer className="grid grid-cols-3 pt-6 border-t border-rule items-start max-md:grid-cols-1 max-md:gap-6 max-md:pb-6 max-md:border-t-0">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted mb-1">
            Views
          </span>
          <span className="text-[11px] text-ink leading-[1.4] max-w-[200px]">
            {doc.views}
          </span>
        </div>

        <div className="flex flex-col gap-2 max-md:hidden">
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted mb-1">
            Created
          </span>
          <span className="text-[11px] text-ink leading-[1.4] max-w-[200px]">
            {formatDate(doc.created_at)}
          </span>
        </div>

        <div className="flex flex-col gap-2 max-md:hidden">
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted mb-1">
            Expires
          </span>
          <span className="text-[11px] text-ink leading-[1.4] max-w-[200px]">
            {formatDate(doc.expires_at)}
          </span>
        </div>
      </footer>
    </div>
  );
}

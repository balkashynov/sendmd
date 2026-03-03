"use client";

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ScrollRail } from "./ScrollRail";
import { EditorToolbar } from "./EditorToolbar";
import {
  wrapSelection,
  toggleLinePrefix,
  cycleHeading,
  insertLink,
} from "@/lib/editorActions";

export interface DropZoneHandle {
  handleIncomingText: (text: string) => void;
}

interface DropZoneProps {
  onContentChange?: (content: string) => void;
  readingMode?: boolean;
}

export const DropZone = forwardRef<DropZoneHandle, DropZoneProps>(
  function DropZone({ onContentChange, readingMode }, ref) {
    const [content, setContent] = useState(() => {
      if (typeof window === "undefined") return "";
      // 1. Edit from shared viewer — highest priority, then clear
      const edit = sessionStorage.getItem("sendmd_edit_content");
      if (edit) {
        sessionStorage.removeItem("sendmd_edit_content");
        return edit;
      }
      // 2. Per-tab draft (survives refresh, doesn't bleed across tabs)
      const tabDraft = sessionStorage.getItem("sendmd_tab_draft");
      if (tabDraft) return tabDraft;
      // 3. Fallback for brand new tabs
      return localStorage.getItem("sendmd_draft") || "";
    });
    const [pendingDrop, setPendingDrop] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editorScrollRef = useRef<HTMLDivElement>(null);
    const previewScrollRef = useRef<HTMLDivElement>(null);

    const editing = content.length > 0;
    const [visualLineCount, setVisualLineCount] = useState(1);

    // Notify parent of restored content on mount
    useEffect(() => {
      if (content) onContentChange?.(content);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist draft: sessionStorage for this tab, localStorage for new tabs
    useEffect(() => {
      sessionStorage.setItem("sendmd_tab_draft", content);
      localStorage.setItem("sendmd_draft", content);
    }, [content]);

    // Auto-resize textarea and count visual lines
    useEffect(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      if (editing) {
        ta.style.height = "0";
        ta.style.height = ta.scrollHeight + "px";
        const lineHeight = parseFloat(getComputedStyle(ta).lineHeight);
        setVisualLineCount(Math.round(ta.scrollHeight / lineHeight));
      } else {
        ta.style.height = "";
        setVisualLineCount(1);
      }
    }, [editing, content]);

    const applyContent = useCallback(
      (text: string) => {
        if (textareaRef.current) {
          const ta = textareaRef.current;
          ta.focus();
          ta.select();
          document.execCommand("insertText", false, text);
        }
        setContent(text);
        onContentChange?.(text);
      },
      [onContentChange]
    );

    const handleIncomingText = useCallback(
      (text: string) => {
        if (content.length > 0) {
          setPendingDrop(text);
        } else {
          applyContent(text);
        }
      },
      [content, applyContent]
    );

    useImperativeHandle(ref, () => ({ handleIncomingText }), [handleIncomingText]);

    const handleDropReplace = useCallback(() => {
      if (pendingDrop !== null) {
        applyContent(pendingDrop);
        setPendingDrop(null);
      }
    }, [pendingDrop, applyContent]);

    const handleDropAppend = useCallback(() => {
      if (pendingDrop !== null) {
        const joined = content + "\n\n" + pendingDrop;
        applyContent(joined);
        setPendingDrop(null);
      }
    }, [pendingDrop, content, applyContent]);

    const handleDropCancel = useCallback(() => {
      setPendingDrop(null);
    }, []);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setContent(value);
        onContentChange?.(value);
      },
      [onContentChange]
    );

    const handleCanvasClick = useCallback(() => {
      textareaRef.current?.focus();
    }, []);

    const handleToolbarUpdate = useCallback(
      (newValue: string, selStart: number, selEnd: number) => {
        setContent(newValue);
        onContentChange?.(newValue);
        requestAnimationFrame(() => {
          textareaRef.current?.setSelectionRange(selStart, selEnd);
        });
      },
      [onContentChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const mod = e.metaKey || e.ctrlKey;
        if (!mod) return;

        let result: { newValue: string; selectionStart: number; selectionEnd: number } | null = null;

        if (!e.shiftKey) {
          switch (e.key.toLowerCase()) {
            case "b":
              e.preventDefault();
              result = wrapSelection(ta, "**", "**");
              break;
            case "i":
              e.preventDefault();
              result = wrapSelection(ta, "*", "*");
              break;
            case "e":
              e.preventDefault();
              result = wrapSelection(ta, "`", "`");
              break;
            case "k":
              e.preventDefault();
              result = insertLink(ta);
              break;
          }
        } else {
          switch (e.key.toLowerCase()) {
            case "x":
              e.preventDefault();
              result = wrapSelection(ta, "~~", "~~");
              break;
            case "h":
              e.preventDefault();
              result = cycleHeading(ta);
              break;
            case ".":
            case ">":
              e.preventDefault();
              result = toggleLinePrefix(ta, "> ");
              break;
            case "8":
            case "*":
              e.preventDefault();
              result = toggleLinePrefix(ta, "- ");
              break;
            case "7":
            case "&":
              e.preventDefault();
              result = toggleLinePrefix(ta, "1. ");
              break;
          }
        }

        if (result) {
          handleToolbarUpdate(result.newValue, result.selectionStart, result.selectionEnd);
        }
      },
      [handleToolbarUpdate]
    );

    const dropPopover = pendingDrop !== null && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10">
        <div className="bg-parchment border border-rule shadow-lg px-8 py-6 flex flex-col items-center gap-5 max-w-[340px]">
          <span className="font-serif italic text-[20px] text-ink text-center">
            content already exists
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleDropReplace}
              className="px-4 py-2 text-[12px] uppercase tracking-[0.06em] border border-ink text-ink bg-transparent hover:bg-ink hover:text-parchment transition-colors cursor-pointer"
            >
              Replace
            </button>
            <button
              onClick={handleDropAppend}
              className="px-4 py-2 text-[12px] uppercase tracking-[0.06em] border border-ink text-ink bg-transparent hover:bg-ink hover:text-parchment transition-colors cursor-pointer"
            >
              Append
            </button>
            <button
              onClick={handleDropCancel}
              className="px-4 py-2 text-[12px] uppercase tracking-[0.06em] border border-rule text-muted bg-transparent hover:bg-rule transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <>
        {/* Reading mode — crossfades over splitscreen */}
        {editing && (
          <div
            className="absolute inset-0 w-full h-full border-t border-b border-rule transition-opacity duration-300 ease-in-out"
            style={{
              opacity: readingMode ? 1 : 0,
              pointerEvents: readingMode ? "auto" : "none",
              zIndex: readingMode ? 2 : 0,
            }}
          >
            <div ref={previewScrollRef} className="h-full overflow-y-auto flex justify-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="w-full max-w-[900px] py-8 px-10 max-md:px-0">
                <MarkdownRenderer content={content} />
              </div>
            </div>
            <ScrollRail content={content} scrollRef={previewScrollRef} />
          </div>
        )}

        {/* Splitscreen — editor + preview side by side */}
        <div
          className="w-full h-full grid grid-cols-[1fr] md:grid-cols-[1fr_1px_1fr] border-t border-b border-rule transition-opacity duration-300 ease-in-out"
          style={editing ? {
            opacity: readingMode ? 0 : 1,
            pointerEvents: readingMode ? "none" : "auto",
          } : { position: "absolute", opacity: 0, pointerEvents: "none" }}
        >
          <div className="relative">
            <div
              ref={editorScrollRef}
              className="absolute inset-0 overflow-y-auto px-10 pt-4 pb-10 max-md:px-5 max-md:pt-3 max-md:pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onClick={handleCanvasClick}
            >
              <EditorToolbar textareaRef={textareaRef} onUpdate={handleToolbarUpdate} />
              <div className="flex">
                <div className="select-none pr-4 text-right font-mono text-[14px] leading-[1.7] text-muted opacity-50 flex-shrink-0 max-md:hidden">
                  {Array.from({ length: visualLineCount }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  spellCheck={false}
                  tabIndex={0}
                  className="flex-1 min-w-0 bg-transparent font-mono text-[14px] leading-[1.7] text-ink border-none outline-none resize-none overflow-hidden"
                />
              </div>
            </div>
            <ScrollRail content={content} scrollRef={editorScrollRef} />
          </div>

          <div className="bg-rule max-md:hidden" />

          <div className="relative max-md:hidden">
            <div className="absolute inset-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <MarkdownRenderer content={content} />
            </div>
          </div>
        </div>

        {/* Prompt overlay — shown on top when no content */}
        {!editing && (
          <div
            className="relative z-[1] w-full max-w-[600px] h-[70vh] max-h-[700px] bg-parchment flex flex-col justify-center items-center cursor-text transition-all duration-[400ms] ease-in-out border border-transparent hover:border-black/5 hover:bg-ink/5"
            onClick={handleCanvasClick}
          >
            <div className="text-center pointer-events-none animate-breathe">
              <span className="font-serif text-[38px] leading-[1.2] text-ink font-normal block mb-6 md:text-[38px] max-md:text-[28px]">
                drop{" "}
                <span className="font-serif italic text-muted text-[32px] mx-3 opacity-50 max-md:text-[24px]">
                  /
                </span>{" "}
                paste
              </span>
              <span className="font-serif text-[38px] leading-[1.2] text-ink font-normal block max-md:text-[28px]">
                start typing
                <span className="inline-block w-[2px] h-[36px] bg-ink ml-2 align-text-bottom animate-blink max-md:h-[28px]" />
              </span>
            </div>
          </div>
        )}

        {dropPopover}
      </>
    );
  }
);

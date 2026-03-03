"use client";

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

export interface DropZoneHandle {
  handleIncomingText: (text: string) => void;
}

interface DropZoneProps {
  onContentChange?: (content: string) => void;
}

export const DropZone = forwardRef<DropZoneHandle, DropZoneProps>(
  function DropZone({ onContentChange }, ref) {
    const [content, setContent] = useState("");
    const [pendingDrop, setPendingDrop] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const editing = content.length > 0;
    const lineNumbers = content ? content.split("\n") : [];

    // Auto-resize textarea in editing mode
    useEffect(() => {
      if (textareaRef.current) {
        if (editing) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        } else {
          textareaRef.current.style.height = "";
        }
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
        {/* Always-mounted splitscreen — textarea never remounts, undo history preserved */}
        <div
          className="w-full h-full grid grid-cols-[1fr_1px_1fr] border-t border-b border-rule"
          style={editing ? undefined : { position: "absolute", opacity: 0, pointerEvents: "none" }}
        >
          <div
            className="relative overflow-y-auto p-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onClick={handleCanvasClick}
          >
            <div className="flex">
              <div className="select-none pr-4 text-right font-mono text-[14px] leading-[1.7] text-muted opacity-50 flex-shrink-0">
                {lineNumbers.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
                {lineNumbers.length === 0 && <div>1</div>}
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                autoFocus
                spellCheck={false}
                tabIndex={0}
                className="flex-1 min-w-0 bg-transparent font-mono text-[14px] leading-[1.7] text-ink border-none outline-none resize-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              />
            </div>
          </div>

          <div className="bg-rule" />

          <MarkdownRenderer content={content} />
        </div>

        {/* Prompt overlay — shown on top when no content */}
        {!editing && (
          <div
            className="relative z-[1] w-full max-w-[600px] h-[70vh] max-h-[700px] bg-parchment flex flex-col justify-center items-center cursor-text transition-all duration-[400ms] ease-in-out border border-transparent hover:border-black/5 hover:bg-[#fafbf8]"
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

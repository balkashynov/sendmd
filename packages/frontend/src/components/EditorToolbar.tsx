"use client";

import { RefObject } from "react";
import {
  wrapSelection,
  toggleLinePrefix,
  cycleHeading,
  insertLink,
} from "@/lib/editorActions";

interface EditorToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onUpdate: (newValue: string, selStart: number, selEnd: number) => void;
}

interface ToolbarButton {
  label: string;
  title: string;
  className?: string;
  action: (ta: HTMLTextAreaElement) => {
    newValue: string;
    selectionStart: number;
    selectionEnd: number;
  };
}

const buttons: ToolbarButton[] = [
  {
    label: "B",
    title: "Bold (⌘B)",
    className: "font-bold",
    action: (ta) => wrapSelection(ta, "**", "**"),
  },
  {
    label: "I",
    title: "Italic (⌘I)",
    className: "italic",
    action: (ta) => wrapSelection(ta, "*", "*"),
  },
  {
    label: "S",
    title: "Strikethrough (⌘⇧X)",
    className: "line-through",
    action: (ta) => wrapSelection(ta, "~~", "~~"),
  },
  {
    label: "<>",
    title: "Inline code (⌘E)",
    action: (ta) => wrapSelection(ta, "`", "`"),
  },
  {
    label: "H",
    title: "Heading (⌘⇧H)",
    action: (ta) => cycleHeading(ta),
  },
  {
    label: "⎘",
    title: "Link (⌘K)",
    action: (ta) => insertLink(ta),
  },
  {
    label: "❝",
    title: "Blockquote (⌘⇧.)",
    action: (ta) => toggleLinePrefix(ta, "> "),
  },
  {
    label: "•",
    title: "Unordered list (⌘⇧8)",
    action: (ta) => toggleLinePrefix(ta, "- "),
  },
  {
    label: "1.",
    title: "Ordered list (⌘⇧7)",
    action: (ta) => toggleLinePrefix(ta, "1. "),
  },
];

export function EditorToolbar({ textareaRef, onUpdate }: EditorToolbarProps) {
  const handleClick = (btn: ToolbarButton) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const result = btn.action(ta);
    onUpdate(result.newValue, result.selectionStart, result.selectionEnd);
  };

  return (
    <div className="flex items-center justify-between pb-3 mb-3 border-b border-rule">
      {buttons.map((btn) => (
        <button
          key={btn.title}
          type="button"
          title={btn.title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleClick(btn)}
          className={`w-9 h-9 flex items-center justify-center text-[13px] uppercase tracking-[0.04em] text-muted hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer rounded ${btn.className ?? ""}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

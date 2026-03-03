"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface HeadingMark {
  level: 1 | 2 | 3;
  position: number; // 0–1 relative to total lines
}

interface ScrollRailProps {
  content: string;
  scrollRef: React.RefObject<HTMLElement | null>;
  align?: "right" | "left";
}

function parseHeadings(content: string): HeadingMark[] {
  const lines = content.split("\n");
  const total = lines.length;
  if (total === 0) return [];

  const marks: HeadingMark[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("### ")) marks.push({ level: 3, position: i / total });
    else if (line.startsWith("## ")) marks.push({ level: 2, position: i / total });
    else if (line.startsWith("# ")) marks.push({ level: 1, position: i / total });
  }
  return marks;
}

// Notch sizes by heading level
const NOTCH_REST_W = { 1: 14, 2: 9, 3: 5 } as const;
const NOTCH_ACTIVE_W = { 1: 18, 2: 14, 3: 10 } as const;
const NOTCH_H = { 1: 2.5, 2: 2, 3: 1.5 } as const;

export function ScrollRail({ content, scrollRef, align = "right" }: ScrollRailProps) {
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);

  const headings = useMemo(() => parseHeadings(content), [content]);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setThumbHeight(0);
      return;
    }
    const ratio = clientHeight / scrollHeight;
    const top = scrollTop / scrollHeight;
    setThumbHeight(ratio * 100);
    setThumbTop(top * 100);
  }, [scrollRef]);

  const showTemporarily = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!dragging) setVisible(false);
    }, 1200);
  }, [dragging]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      updateThumb();
      showTemporarily();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    updateThumb();
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, updateThumb, showTemporarily]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => updateThumb());
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRef, updateThumb]);

  const handleRailClick = useCallback(
    (e: React.MouseEvent) => {
      const rail = railRef.current;
      const el = scrollRef.current;
      if (!rail || !el) return;
      const rect = rail.getBoundingClientRect();
      const ratio = (e.clientY - rect.top) / rect.height;
      el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
    },
    [scrollRef]
  );

  const handleThumbDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging(true);
      setVisible(true);
      dragStartY.current = e.clientY;
      dragStartScroll.current = scrollRef.current?.scrollTop || 0;
    },
    [scrollRef]
  );

  useEffect(() => {
    if (!dragging) return;
    const el = scrollRef.current;
    const rail = railRef.current;
    if (!el || !rail) return;

    const railHeight = rail.getBoundingClientRect().height;
    const scrollRange = el.scrollHeight - el.clientHeight;

    const onMove = (e: MouseEvent) => {
      const dy = e.clientY - dragStartY.current;
      const scrollDelta = (dy / railHeight) * scrollRange;
      el.scrollTop = dragStartScroll.current + scrollDelta;
    };
    const onUp = () => {
      setDragging(false);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 1200);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, scrollRef]);

  // Check if a heading position falls within the thumb's range
  const isInThumb = useCallback(
    (pos: number) => {
      const top = thumbTop / 100;
      const bottom = top + thumbHeight / 100;
      return pos >= top && pos <= bottom;
    },
    [thumbTop, thumbHeight]
  );

  const show = visible || dragging;

  if (thumbHeight === 0) return null;

  const side = align === "left" ? "left" : "right";
  const posStyle = { [side]: 3 };

  return (
    <div
      ref={railRef}
      onClick={handleRailClick}
      onMouseEnter={() => {
        setVisible(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
      }}
      onMouseLeave={() => {
        if (!dragging) {
          hideTimer.current = setTimeout(() => setVisible(false), 600);
        }
      }}
      className={`absolute top-0 ${align === "left" ? "left-0" : "right-0"} w-[22px] h-full z-10 cursor-pointer`}
    >
      {/* Heading notches — morph when thumb overlaps */}
      {headings.map((h, i) => {
        const active = isInThumb(h.position);
        const w = active ? NOTCH_ACTIVE_W[h.level] : NOTCH_REST_W[h.level];
        const height = NOTCH_H[h.level];
        const opacity = active ? 0.7 : h.level === 1 ? 0.35 : h.level === 2 ? 0.2 : 0.12;

        return (
          <div
            key={i}
            className="absolute"
            style={{
              ...posStyle,
              top: `${h.position * 100}%`,
              width: w,
              height: active ? height + 1 : height,
              borderRadius: "1px",
              backgroundColor: "var(--ink)",
              opacity: show ? opacity : 0,
              transition: "opacity 0.3s, width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: "translateY(-50%)",
            }}
          />
        );
      })}

      {/* Thumb — thin bar matching the notch color */}
      <div
        onMouseDown={handleThumbDown}
        className="absolute"
        style={{
          ...posStyle,
          top: `${thumbTop}%`,
          height: `${thumbHeight}%`,
          width: 3,
          borderRadius: "1.5px",
          backgroundColor: "var(--ink)",
          opacity: show ? 0.55 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
}

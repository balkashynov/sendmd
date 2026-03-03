"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content?: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div
      data-preview
      className="
        h-full overflow-y-auto p-10
        font-serif text-ink
        [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
      "
    >
      {!content ? (
        <p className="text-muted text-sm font-serif italic">No content to display.</p>
      ) : <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif italic text-[32px] leading-[1.3] mb-6 mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif italic text-[26px] leading-[1.3] mb-4 mt-8">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif italic text-[22px] leading-[1.3] mb-3 mt-6">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="font-serif text-[18px] leading-[1.7] mb-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="font-serif text-[18px] leading-[1.7] mb-4 pl-6 list-disc">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="font-serif text-[18px] leading-[1.7] mb-4 pl-6 list-decimal">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block bg-[#f4f3ef] rounded px-4 py-3 font-mono text-[14px] leading-[1.6] overflow-x-auto mb-4">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-[#f4f3ef] rounded px-1.5 py-0.5 font-mono text-[14px]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-[#f4f3ef] rounded p-4 overflow-x-auto mb-4 font-mono text-[14px] leading-[1.6]">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-rule pl-4 italic text-muted mb-4">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-rule my-8" />,
          a: ({ href, children }) => (
            <a href={href} className="text-ink underline underline-offset-2 hover:text-muted transition-colors">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="font-serif text-[16px] border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-rule px-3 py-2 text-left font-semibold bg-[#f4f3ef]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-rule px-3 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>}
    </div>
  );
}

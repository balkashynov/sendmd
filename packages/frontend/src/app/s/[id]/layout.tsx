import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Someone sent you a doc",
  description:
    "You received a markdown document via sendmd — the fastest way to share formatted text. Open it to read, edit, or reshare.",
  openGraph: {
    title: "Someone sent you a doc via sendmd",
    description:
      "You received a markdown document via sendmd. Open it to read, download, or edit your own copy.",
  },
  twitter: {
    card: "summary",
    title: "Someone sent you a doc via sendmd",
    description:
      "You received a markdown document via sendmd. Open it to read, download, or edit your own copy.",
  },
};

export default function SharedDocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

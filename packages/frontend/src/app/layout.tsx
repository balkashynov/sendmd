import type { Metadata, Viewport } from "next";
import { Toaster } from "sileo";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "sendmd — drop, write, share",
    template: "%s | sendmd",
  },
  description:
    "The fastest way to share markdown. Drop a file, paste, or start typing — get a clean shareable link in seconds.",
  keywords: ["markdown", "share", "editor", "sendmd", "pastebin", "markdown editor", "short link"],
  authors: [{ name: "sendmd" }],
  creator: "sendmd",
  metadataBase: new URL("https://sendmd.co"),
  openGraph: {
    type: "website",
    siteName: "sendmd",
    title: "sendmd — drop, write, share",
    description:
      "The fastest way to share markdown. Drop a file, paste, or start typing — get a clean shareable link in seconds.",
  },
  twitter: {
    card: "summary",
    title: "sendmd — drop, write, share",
    description:
      "The fastest way to share markdown. Drop a file, paste, or start typing — get a clean shareable link in seconds.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("sendmd_theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}else if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.setAttribute("data-theme","dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-parchment text-ink">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

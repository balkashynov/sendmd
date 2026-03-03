import type { Metadata } from "next";
import { Toaster } from "sileo";
import "./globals.css";

export const metadata: Metadata = {
  title: "sendmd",
  description: "Share markdown files via short links",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-parchment text-ink">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

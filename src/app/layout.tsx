import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bookbook — 本棚アプリ",
  description: "個人利用向けのローカル保存型本棚アプリ。著者から作品を時系列で取り込めます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

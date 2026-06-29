import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "দোকান হিসাব | সহজ হিসাব, সঠিক ব্যবসা",
  description: "স্টক থেকে বিক্রি, বিল থেকে পেমেন্ট — সব এক জায়গায়",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B6D11" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}

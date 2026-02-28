import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecurMail Pro | Anti-Phishing Simulation Training",
  description: "Enterprise-grade anti-phishing awareness training. Identify phishing emails, protect your organisation's data security, and sharpen your cyber resilience.",
};

export const viewport: Viewport = {
  themeColor: "#FDF9F1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className={`${inter.className} antialiased selection:bg-[#FFDCA8]`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bubu与Dudu的职场防线 | 防钓鱼模拟",
  description: "沉浸式职场防钓鱼模拟体验，类似Tinder卡片滑动玩法，划掉钓鱼邮件，守护公司的数据安全。",
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
    <html lang="zh-CN">
      <body className={`${inter.className} antialiased selection:bg-[#FFDCA8]`}>
        {children}
      </body>
    </html>
  );
}

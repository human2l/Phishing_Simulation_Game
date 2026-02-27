import { generatePhishingEmail } from "@/lib/ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // 每次请求都重新生成，禁止缓存

export async function GET() {
  try {
    const email = await generatePhishingEmail();
    return NextResponse.json(email);
  } catch (error) {
    console.error("[/api/generate-email] Unexpected error:", error);

    // 最终兜底：即使 ai.ts 内部 fallback 失败，API 层也保持可用
    return NextResponse.json(
      {
        sender: "系统通知",
        senderEmail: "noreply@company.com",
        subject: "加载失败，请稍候重试",
        content: "邮件内容生成失败，请刷新后重试。",
        isPhishing: false,
        time: "刚刚",
        clues: [],
      },
      { status: 200 }
    );
  }
}

import emailPoolEn from "@/data/email-pool-en.json";
import emailPoolZh from "@/data/email-pool.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 已使用邮件的索引追踪（进程级内存，dev server 重启后重置）
const usedIndicesZh = new Set<number>();
const usedIndicesEn = new Set<number>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "zh";

    let pool: Array<Record<string, unknown>> = [];

    if (locale === "en") {
      pool = emailPoolEn as Array<Record<string, unknown>>;
    } else {
      pool = emailPoolZh as Array<Record<string, unknown>>;
    }

    if (!pool || pool.length === 0) {
      if (locale === "en") {
        return NextResponse.json(
          {
            sender: "System",
            senderEmail: "noreply@company.com",
            subject: "Loading Failed",
            content: "Email pool for English is not generated yet.",
            isPhishing: false,
            time: "Just now",
            clues: [],
          },
          { status: 200 }
        );
      }
      throw new Error("Email pool is empty");
    }

    const usedIndices = locale === "en" ? usedIndicesEn : usedIndicesZh;

    // 如果所有邮件都已用过，重置池
    if (usedIndices.size >= pool.length) {
      usedIndices.clear();
    }

    // 从未使用过的邮件中随机抽取
    const availableIndices = pool
      .map((_, i) => i)
      .filter((i) => !usedIndices.has(i));

    const randomIdx =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];

    usedIndices.add(randomIdx);

    const email = { ...pool[randomIdx] };

    // 动态生成时间戳，让每次返回的邮件看起来都是"刚到的"
    const hours = [
      "08:15", "08:47", "09:03", "09:21", "09:45",
      "10:12", "10:38", "11:05", "11:29", "13:10",
      "13:42", "14:08", "14:33", "15:01", "15:28",
      "16:05", "16:42", "17:11",
    ];
    const prefixes = locale === "en"
      ? ["AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM"]
      : ["上午", "上午", "上午", "上午", "上午", "上午", "上午", "上午", "上午", "下午", "下午", "下午", "下午", "下午", "下午", "下午", "下午", "下午"];
    const timeIdx = Math.floor(Math.random() * hours.length);
    email.time = locale === "en" ? `${hours[timeIdx]} ${prefixes[timeIdx]}` : `${prefixes[timeIdx]} ${hours[timeIdx]}`;

    return NextResponse.json(email);
  } catch (error) {
    console.error("[/api/generate-email] Error:", error);

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

import emailPoolEN from "@/data/email-pool-en.json";
import emailPoolZH from "@/data/email-pool.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 已使用邮件的索引追踪（进程级内存，按语言区分）
const usedIndices = {
  zh: new Set<number>(),
  en: new Set<number>(),
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") === "en" ? "en" : "zh";
    const rawPool = locale === "en" ? emailPoolEN : emailPoolZH;
    const pool = rawPool as Array<Record<string, unknown>>;

    if (pool.length === 0) {
      throw new Error(`Email pool for ${locale} is empty`);
    }

    const currentUsedIndices = usedIndices[locale];

    // 如果所有邮件都已用过，重置池
    if (currentUsedIndices.size >= pool.length) {
      currentUsedIndices.clear();
    }

    // 从未使用过的邮件中随机抽取
    const availableIndices = pool
      .map((_, i) => i)
      .filter((i) => !currentUsedIndices.has(i));

    const randomIdx =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];

    currentUsedIndices.add(randomIdx);

    const email = { ...pool[randomIdx] };

    // 动态生成时间戳，让每次返回的邮件看起来都是"刚到的"
    const hours = [
      "08:15", "08:47", "09:03", "09:21", "09:45",
      "10:12", "10:38", "11:05", "11:29", "13:10",
      "13:42", "14:08", "14:33", "15:01", "15:28",
      "16:05", "16:42", "17:11",
    ];
    const timeIdx = Math.floor(Math.random() * hours.length);

    if (locale === "en") {
      const isAm = hours[timeIdx] < "12:00";
      const timePrefix = isAm ? "AM" : "PM";
      const hourSplit = hours[timeIdx].split(":");
      let hourNum = parseInt(hourSplit[0], 10);
      if (hourNum > 12) hourNum -= 12;
      email.time = `${hourNum.toString().padStart(2, '0')}:${hourSplit[1]} ${timePrefix}`;
    } else {
      const prefixes = ["上午", "上午", "上午", "上午", "上午",
                        "上午", "上午", "上午", "上午", "下午",
                        "下午", "下午", "下午", "下午", "下午",
                        "下午", "下午", "下午"];
      email.time = `${prefixes[timeIdx]} ${hours[timeIdx]}`;
    }

    return NextResponse.json(email);
  } catch (error) {
    console.error("[/api/generate-email] Error:", error);

    return NextResponse.json(
      {
        sender: "系统通知",
        senderEmail: "noreply@company.com",
        subject: "加载失败，请稍候重试 (Load Failed)",
        content: "邮件内容生成失败，请刷新后重试。Failed to load email, please try again.",
        isPhishing: false,
        time: "刚刚 (Just now)",
        clues: [],
      },
      { status: 200 }
    );
  }
}

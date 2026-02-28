import emailPool from "@/data/email-pool-en.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = emailPool as Array<Record<string, unknown>>;

    if (!pool || pool.length === 0) {
      return NextResponse.json(
        [{
          sender: "System",
          senderEmail: "noreply@company.com",
          subject: "Loading Failed",
          content: "Email pool is not available. Please try again later.",
          isPhishing: false,
          time: "Just now",
          clues: [],
        }],
        { status: 200 }
      );
    }

    // Fisher-Yates Shuffle
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Extract exactly 10 unique emails (or fewer if pool is smaller)
    const selected = shuffled.slice(0, 10);

    // Generate dynamic timestamps so each email appears "just arrived"
    const hours = [
      "08:15", "08:47", "09:03", "09:21", "09:45",
      "10:12", "10:38", "11:05", "11:29", "13:10",
      "13:42", "14:08", "14:33", "15:01", "15:28",
      "16:05", "16:42", "17:11",
    ];
    const prefixes = [
      "AM", "AM", "AM", "AM", "AM",
      "AM", "AM", "AM", "AM", "PM",
      "PM", "PM", "PM", "PM", "PM",
      "PM", "PM", "PM",
    ];

    const result = selected.map(email => {
      const timeIdx = Math.floor(Math.random() * hours.length);
      return {
        ...email,
        time: `${hours[timeIdx]} ${prefixes[timeIdx]}`
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/generate-email] Error:", error);

    return NextResponse.json(
      [{
        sender: "System Notification",
        senderEmail: "noreply@company.com",
        subject: "Loading failed — please try again",
        content: "Failed to load email content. Please refresh and try again.",
        isPhishing: false,
        time: "Just now",
        clues: [],
      }],
      { status: 200 }
    );
  }
}

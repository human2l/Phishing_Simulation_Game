import emailPool from "@/data/email-pool-en.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Track used email indices (process-level memory, resets on dev server restart)
const usedIndices = new Set<number>();

export async function GET() {
  try {
    const pool = emailPool as Array<Record<string, unknown>>;

    if (!pool || pool.length === 0) {
      return NextResponse.json(
        {
          sender: "System",
          senderEmail: "noreply@company.com",
          subject: "Loading Failed",
          content: "Email pool is not available. Please try again later.",
          isPhishing: false,
          time: "Just now",
          clues: [],
        },
        { status: 200 }
      );
    }

    // If all emails have been used, reset the pool
    if (usedIndices.size >= pool.length) {
      usedIndices.clear();
    }

    // Pick a random email from the unused pool
    const availableIndices = pool
      .map((_, i) => i)
      .filter((i) => !usedIndices.has(i));

    const randomIdx =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];

    usedIndices.add(randomIdx);

    const email = { ...pool[randomIdx] };

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
    const timeIdx = Math.floor(Math.random() * hours.length);
    email.time = `${hours[timeIdx]} ${prefixes[timeIdx]}`;

    return NextResponse.json(email);
  } catch (error) {
    console.error("[/api/generate-email] Error:", error);

    return NextResponse.json(
      {
        sender: "System Notification",
        senderEmail: "noreply@company.com",
        subject: "Loading failed — please try again",
        content: "Failed to load email content. Please refresh and try again.",
        isPhishing: false,
        time: "Just now",
        clues: [],
      },
      { status: 200 }
    );
  }
}

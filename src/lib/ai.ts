import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedEmail {
  sender: string;       // Display name, e.g. "IT Support Department"
  senderEmail: string;  // Email address, e.g. "it-support@company-safety.net"
  subject: string;      // Email subject line
  content: string;      // Email body (150-300 words, with line breaks)
  isPhishing: boolean;  // Whether this is a phishing email
  time: string;         // e.g. "Just now" / "10:32 AM"
  clues: string[];      // 2-4 red-flag clues (only relevant when isPhishing=true)
}

// ─── Fallback data ────────────────────────────────────────────────────────────

const FALLBACK_EMAIL: GeneratedEmail = {
  sender: "HR Benefits Team",
  senderEmail: "hr-benefits@company-portal-welfare.com",
  subject: "URGENT: 2026 Employee Supplementary Health Insurance & Year-End Benefits Confirmation",
  content: "Dear Colleague,\n\nFollowing the Management Committee's resolution and this year's Compensation & Benefits policy, the 2026 Employee Supplementary Health Insurance and Year-End Special Benefits confirmation process has now officially commenced.\n\nTo ensure all benefits are disbursed by month-end and correctly applied to your personal tax deduction base, all employees must complete confirmation via the dedicated Benefits Portal below by 5:00 PM today.\n\nBenefits Confirmation Portal: http://benefits-confirm.company-portal-welfare.com/auth/login\n\nPlease note: Failure to complete confirmation by the deadline will result in automatic forfeiture of this year's supplementary benefits eligibility, and year-end bonus disbursement may be irreversibly delayed.\n\nThank you for your prompt cooperation.\n\nKind regards,\n\nHR Benefits & Compensation Advisory Team\nPhone: +61 (02) 8888-0000 ext. 102\nEmail: hr-benefits@company-portal-welfare.com\n\n------------------------------------------------------------\nCONFIDENTIALITY NOTICE:\nThis email and any attachments are confidential and may also be privileged. If you are not the intended recipient, please delete all copies and notify the sender immediately.",
  isPhishing: true,
  time: "Just now",
  clues: [
    "The sender domain 'company-portal-welfare.com' is not the official company domain",
    "Uses high-value lures like 'year-end benefits' and 'health insurance' with urgent time pressure ('by 5:00 PM today', 'irreversibly delayed')",
    "The so-called Benefits Portal is an external suspicious link, not a standard internal system URL"
  ],
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a highly professional and creative enterprise-grade cybersecurity attack-defence training engine (Agent C).
Your task is to randomly generate either a "hyper-realistic, sophisticated workplace social-engineering (phishing) email" or a "standard professional legitimate business email".

【CRITICAL REQUIREMENT: Absolute Diversity】
Your previous outputs were highly repetitive. You MUST break this pattern!
- **Sender names must be different each time**: e.g. "Group Finance Centre", "APAC HRBP Team", "IT Service Desk", "Vendor Collaboration Platform", "Cloud Asset Management Committee", etc.
- **Email subjects and wording must vary each time**: use different pretexts, different business angles, different industry jargon.

【Scenario Pool — randomly deep-dive into one specific angle each time】
1. Office IT/Security: Employee account high-risk login from foreign IP, device refresh asset audit, cloud collaboration drive permission expiry purge (phishing)
2. Finance/Tax/Legal: Invoice rejection & reissue, suspicious expense claim requiring explanation, annual tax reconciliation confirmation, fake internal investigation compliance request (phishing)
3. Admin/HR/Payroll: Salary structure adjustment confirmation, year-end bonus payout system migration login, abnormal health check-up result follow-up, workplace misconduct disciplinary notice (phishing)
4. Business/External Partners: Urgent customs inspection document supplement, AWS/Azure billing payment failure alert, RFP supplementary material download (phishing)
5. Normal Company Communications: New system go-live announcement, all-staff fire drill notice, routine business update (legitimate, isPhishing=false)

【Generation Rules】
1. Email body MUST be between 150-300 words.
2. Language style: Standard Australian business English, industry jargon, highly professional and extremely realistic.
3. Key elements: Professional salutation, detailed context, phishing URL (when applicable), professional email signature (title/department/phone), and a confidentiality footer.
4. JSON Schema:
   - sender: Display name (must vary each time, reflecting realistic corporate structure)
   - senderEmail: For phishing scenarios use lookalike domains (e.g. security@global-corp-services.com); for legitimate emails use realistic internal-style domains
   - subject: Professional and formal email subject, absolutely must not repeat previous ones
   - content: Email body, with \\n for paragraph breaks.
   - isPhishing: boolean
   - time: e.g. "10:32 AM"
   - clues: Only relevant when isPhishing=true, return 2-4 detailed security analysis clues.

IMPORTANT: Output ONLY a JSON object, no other text.`;

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generatePhishingEmail(): Promise<GeneratedEmail> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error("[ai.ts] DEEPSEEK_API_KEY is not set. Returning fallback.");
    return FALLBACK_EMAIL;
  }

  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey
  });

  try {
    console.log("[ai.ts] Generating email using DeepSeek API (deepseek-chat)...");
    
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: `Generate a brand-new email from a completely fresh perspective. Output strictly in JSON format. Randomisation seed: ${Date.now()}_${Math.random()}` 
        }
      ],
      temperature: 1.2,
      response_format: { type: 'json_object' }
    });

    const rawText = response.choices[0]?.message?.content?.trim() || "{}";

    const parsed = JSON.parse(rawText) as GeneratedEmail;

    // Basic schema validation
    if (
        typeof parsed.sender !== "string" ||
        typeof parsed.senderEmail !== "string" ||
        typeof parsed.subject !== "string" ||
        typeof parsed.content !== "string" ||
        typeof parsed.isPhishing !== "boolean" ||
        typeof parsed.time !== "string" ||
        !Array.isArray(parsed.clues)
    ) {
      throw new Error("LLM response failed schema validation");
    }

    console.log("[ai.ts] Successfully generated email using deepseek-chat");
    return parsed;

  } catch (err: any) {
    console.error("[ai.ts] Failed to generate email with DeepSeek:", err?.message || err);
    return FALLBACK_EMAIL;
  }
}

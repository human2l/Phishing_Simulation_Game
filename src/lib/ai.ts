import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedEmail {
  sender: string;       // 显示名，如 "IT 支持部门"
  senderEmail: string;  // 邮件地址，如 "it-support@company-safety.net"
  subject: string;      // 邮件主题
  content: string;      // 邮件正文（30-80字，含换行）
  isPhishing: boolean;  // 是否为钓鱼邮件
  time: string;         // 如 "刚刚" / "上午 10:32"
  clues: string[];      // 2-4条破绽线索（仅当 isPhishing=true 时有效）
}

// ─── Fallback data ────────────────────────────────────────────────────────────

const FALLBACK_EMAIL: GeneratedEmail = {
  sender: "IT 支持部门",
  senderEmail: "it-support@company-helpdesk-verify.net",
  subject: "【紧急】您的账户存在异常登录，请立即验证",
  content:
    "尊敬的员工，\n\n我们检测到您的公司账户于今日上午在境外 IP 登录。\n为保护您的账户安全，请在 30 分钟内点击下方链接完成身份验证，否则账户将被临时冻结。\n\n[立即验证账户] → http://secure-login.company-helpdesk-verify.net/auth\n\n——IT 安全中心",
  isPhishing: true,
  time: "刚刚",
  clues: [
    "发件域名为 company-helpdesk-verify.net，非公司官方域名",
    "制造「30分钟」紧迫感，诱导用户不假思索点击",
    "链接指向可疑第三方域名，而非公司内网",
  ],
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `你是一个职场网络安全模拟游戏的内容生成引擎。
你的任务是随机生成一封「职场邮件」，可能是钓鱼邮件，也可能是正常邮件。

【场景池 - 随机选择一个】
1. 冒充 IT 部门要求员工重置密码（钓鱼）
2. 伪造 CEO 发送的紧急转账/授权请求（钓鱼）
3. 伪造快递/电商平台（如 JD、淘宝、Amazon）发货异常通知（钓鱼）
4. 假冒 HR 发放年终奖/福利信息，诱导点击领取链接（钓鱼）
5. 正常的公司内部通知邮件，例如会议时间调整或报销提醒（正常，isPhishing=false）

【输出格式要求】
你必须严格输出一个 JSON 对象，不得有任何额外文字、代码块标记或换行符包裹。
JSON schema 如下：
{
  "sender": "string - 显示名，如 'IT 支持部门' 或 'HR 人力资源部'",
  "senderEmail": "string - 邮件地址。钓鱼邮件必须使用伪造域名（如加连字符、误导词）；正常邮件使用 @company.com",
  "subject": "string - 邮件主题，20字以内",
  "content": "string - 邮件正文，30-80字，含适当换行(\\n)。钓鱼邮件须包含伪造链接",
  "isPhishing": "boolean",
  "time": "string - 例如 '刚刚' / '上午 10:32' / '昨天 17:05'",
  "clues": "string[] - 当 isPhishing=true 时，列出 2-4 条具体破绽（域名异常/制造紧迫感/诱导点击等）；isPhishing=false 时返回空数组 []"
}
`;

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
        { role: "user", content: "请随机生成一封符合要求的邮件，并严格按照指定JSON格式输出。" }
      ],
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

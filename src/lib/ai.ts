import { GoogleGenerativeAI } from "@google/generative-ai";

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

重要：只输出 JSON，不要有任何其他内容。`;

// ─── Main generator ───────────────────────────────────────────────────────────

// 按优先级尝试的模型列表，以规避单个模型的 Free Tier Rate Limit
const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
];

// Helper: 简单的休眠函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generatePhishingEmail(): Promise<GeneratedEmail> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[ai.ts] GEMINI_API_KEY is not set. Returning fallback.");
    return FALLBACK_EMAIL;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // 外层：遍历模型列表进行尝试
  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[ai.ts] Trying model: ${modelName} ...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // 尝试调用 API
      const result = await model.generateContent(SYSTEM_PROMPT);
      const rawText = result.response.text().trim();

      // Strip possible markdown code fences if LLM wraps in ```json ... ```
      const jsonText = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const parsed = JSON.parse(jsonText) as GeneratedEmail;

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

      console.log(`[ai.ts] Successfully generated email using ${modelName}`);
      return parsed;

    } catch (err: any) {
      console.warn(`[ai.ts] Failed with model ${modelName}:`, err?.message || err);
      
      // 如果是 429 报错，我们尝试短暂等待后换下一个模型
      // Gemini的429可能是单个模型/项目的配额限制，尝试其他模型可能会成功
      if (err?.message?.includes("429") || err?.status === 429) {
        console.log(`[ai.ts] Rate limit hit for ${modelName}, waiting before trying next model...`);
        await sleep(1000); // 避免并发请求过于猛烈
      }
      // 继续循环尝试下一个模型
    }
  }

  // 如果所有模型都失败了，抛出终极异常或返回 Fallback
  console.error("[ai.ts] All Gemini models exhausted or failed. Using hardcoded fallback.");
  return FALLBACK_EMAIL;
}

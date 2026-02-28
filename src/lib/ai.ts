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
  sender: "HR 人力资源部",
  senderEmail: "hr-benefits@company-portal-welfare.com",
  subject: "【关于2026年度员工补充医疗保险及年终福利核准的最终通知】",
  content: "各位同仁，您好：\n\n根据公司管理层决议及本年度薪酬福利政策，2026年度员工补充医疗保险及年终特别福利的核准工作现已正式启动。\n\n为确保各项福利能于本月末前顺利发放到位并合规计入个人所得税抵扣基数，请全体员工务必于今日下午17:00前，登录下方的人事福利专属核准系统进行确认。\n\n专属核准入口：http://benefits-confirm.company-portal-welfare.com/auth/login\n\n请注意：逾期未完成确认者，系统将自动视为放弃本年度补充福利资格，且年终奖金发放可能受到不可逆的延误。感谢您的积极配合与理解。\n\n顺颂商祺，\n\n【人力资源部 薪酬宣导组】\n联系电话：+86 (010) 8888-0000 分机 102 \n邮箱：hr-benefits@company-portal-welfare.com\n\n------------------------------------------------------------\nCONFIDENTIALITY NOTICE:\nThis email and any attachments are confidential and may also be privileged. If you are not the intended recipient, please delete all copies and notify the sender immediately.",
  isPhishing: true,
  time: "刚刚",
  clues: [
    "发件邮箱后缀 company-portal-welfare.com 并非公司官方域名",
    "利用「年终福利、补充医疗」等切身利益诱导，并施加「不可逆延误」、「今日17:00前」的时间压迫",
    "所谓的核准入口是一个外部可疑链接，而非内部系统标准地址"
  ],
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `你是一个高度专业的企业级网络安全攻防训练引擎 (Agent C)。
你的任务是随机生成一封「极度拟真的高维职场社工（钓鱼）邮件」或「标准专业的正常商务邮件」。

【场景池 - 随机选择一个】
1. 冒充 IT 运维：关于办公网络升级或 SSL 证书过期导致 VPN 账号冻结的紧急通知（钓鱼）
2. 伪造高管/法务：涉及并购保密项目、紧急财务尽调或税务稽查的协助指令（钓鱼）
3. 伪造供应商/跨境物流：Invoice 发票查验、海运提单 (B/L) 清关受阻的紧急催办（钓鱼）
4. 假冒 HR/行政：年度体检、补充商业保险确认、或薪酬结构优化/股权激励确认通知（钓鱼）
5. 正常公司公文：合规的新系统的上线预告、全员消防演习通知或常规流程说明（正常，isPhishing=false）

【生成规范】
1. 邮件字数必须在 150 - 300 字之间。
2. 语言风格：必须使用标准的商业语言、行业“黑话”（Jargon），行文专业，态度严肃或略带紧迫感。
3. 关键要素：必须包含：
   - 专业称呼（例如“各位同仁”、“Dear Team”等）
   - 翔实且看似合理的背景说明与多段落论述
   - 若是钓鱼邮件，必须嵌有带直接行动指示（Call To Action）的可疑 URL
   - 专业的邮件落款，包括职务、部门、联系电话等
   - 经典的英文/双语企业合规免责声明（Confidentiality Footer）
4. JSON Schema 要求：
   - sender: 显示名，必须专业，如 'IT运维及信息安全中心'、'法务合规部'
   - senderEmail: 钓鱼且场景要求伪造时使用相似域名（如 security@global-corp-services.com），正常邮件用内部真实风格域名
   - subject: 邮件主题，专业且正式，如「【重要通知】关于全球 VPN 证书链升级及客户端授权验证的通知」
   - content: 邮件正文，包含 \\n 换行符以控制段落。
   - isPhishing: boolean
   - time: 如 "上午 09:12"
   - clues: 仅当 isPhishing=true 时有效，返回 2-4 条详细的安全分析线索，例如“发件人域名（global-corp-services.com）乃是利用连字符构造的同形或仿冒域名”、“滥发急迫指令违背了公司真实安全管控标准流程”。

重要：你必须严格只输出 JSON 对象，不要含有其他任何文字。
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

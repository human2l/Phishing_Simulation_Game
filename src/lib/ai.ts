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

const SYSTEM_PROMPT = `你是一个高度专业且富有创意的企业级网络安全攻防训练引擎 (Agent C)。
你的任务是随机生成一封「极度拟真的高维职场社工（钓鱼）邮件」或「标准专业的正常商务邮件」。

【重要要求：绝对的多样性】
你之前的生成结果高度重复（例如总是生成“IT运维及信息安全中心”和“SSL证书过期”）。你必须打破这个模式！
- **发件人名称必须每次不同**：例如“集团财务中心”、“亚太区HRBP组”、“IT服务台(ServiceDesk)”、“供应商协同平台”、“云资产管理委员会”等，不要总是用同一个。
- **邮件主题和措辞必须每次不同**：换用不同的借口、不同的业务切入点、不同的“黑话”。

【场景池 - 请每次随机深挖以下某一个具体的微小切入点】
1. 办公 IT/安全：不要总是写 SSL，可以写员工账号异地高危登录拦截、设备换新资产盘点要求、甚至云端协作盘权限到期清退（钓鱼）
2. 财务/税务/法务：发票（Invoice）驳回重开、报销单据涉嫌违规需说明、全员个税汇算清缴确认、或者是虚假的内部调查配合指令（钓鱼）
3. 行政/HR/薪酬：薪酬结构调整确认、年终奖发放系统切换登录、体检报告异常复查、或者职场违规处罚通报（钓鱼）
4. 业务/外部合作：突发海关查验需补文件、AWS/阿里云后台账单扣费失败告警、竞标书 (RFP) 补充材料下载（钓鱼）
5. 正常公司公文：合规的新系统的上线预告、全员消防演习通知或常规业务通报（正常，isPhishing=false）

【生成规范】
1. 邮件字数必须在 150 - 300 字之间。
2. 语言风格：标准的商业语言、行业“黑话”（Jargon），行文须高度专业、极其逼真。
3. 关键要素：要有专业称呼、详实的背景说明、钓鱼指令 URL、专业邮件落款（职务/部门/电话）及英文/双语免责声明（Confidentiality Footer）。
4. JSON Schema 要求：
   - sender: 显示名（必须每次随机变化，符合企业实际架构）
   - senderEmail: 钓鱼且场景要求伪造时使用相似域名（如 security@global-corp-services.com），正常邮件用内部真实风格域名
   - subject: 邮件主题，专业且正式，绝对不要与之前重复
   - content: 邮件正文，包含 \\n 换行符以控制段落。
   - isPhishing: boolean
   - time: 如 "上午 09:12"
   - clues: 仅当 isPhishing=true 时有效，返回 2-4 条详细的安全分析线索。

重要：严格输出 JSON 对象，不含其他文字。`;

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
          content: `请生成一封全新视角的邮件，严格按照 JSON 格式输出。为确保绝对不重复，本轮随机化种子为：${Date.now()}_${Math.random()}` 
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

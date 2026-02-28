#!/usr/bin/env node
/**
 * 离线 AI 题库生成脚本 (Agent C)
 * 使用 DeepSeek API 批量生成高质量企业级钓鱼/正常邮件样本
 * 输出：src/data/email-pool.json
 *
 * 用法：node scripts/generate-emails.js [数量，默认10]
 */

const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

// 匹配不是路径、且不是 -- 打头的参数作为生成数量
const numArg = process.argv.slice(2).find(arg => /^\d+$/.test(arg));
const TOTAL = numArg ? parseInt(numArg, 10) : 10;
const langIndex = process.argv.indexOf("--lang");
const LANG = langIndex !== -1 ? process.argv[langIndex + 1] : "zh";
const OUTPUT_PATH = path.resolve(__dirname, `../src/data/email-pool${LANG === "en" ? "-en" : ""}.json`);

// ─── 场景微切入点列表（强制多样性） ──────────────────────────────────────────

const SCENARIO_SEEDS_ZH = [
  { id: 1, type: "phishing", hint: "冒充IT运维：员工账号在境外异常登录，被安全策略拦截，要求在限期内通过链接重新验证身份" },
  { id: 2, type: "phishing", hint: "冒充IT运维：企业云盘(如OneDrive/飞书云空间)存储配额即将到期，需点击链接扩容或迁移数据" },
  { id: 3, type: "phishing", hint: "伪造CFO办公室：紧急要求完成一笔跨境美元电汇（声称涉及保密并购项目代号'Phoenix'）" },
  { id: 4, type: "phishing", hint: "伪造法务合规部：声称公司正配合监管机构的反洗钱(AML)专项审查，要求员工在限期内登录提交个人交易流水" },
  { id: 5, type: "phishing", hint: "伪造供应链管理部：声称某批海运提单(B/L)因HS编码错误被海关扣押，要求紧急下载并签署更正文件" },
  { id: 6, type: "phishing", hint: "伪造AWS/阿里云：账户因异常API调用产生高额费用告警，要求立即登录控制台核实并冻结资源" },
  { id: 7, type: "phishing", hint: "假冒HR部门：年度体检报告出现异常指标，要求员工登录健康管理平台进行复查预约" },
  { id: 8, type: "phishing", hint: "假冒薪酬委员会：公司推行股权激励计划（ESOP），要求在限期内登录专属平台确认授予份额" },
  { id: 9, type: "phishing", hint: "伪造外部客户：声称竞标书(RFP)有紧急修订附件需下载查看，附件链接指向可疑域名" },
  { id: 10, type: "phishing", hint: "冒充行政部：办公楼门禁系统升级，要求全员重新上传人脸照片至指定平台完成注册" },
  { id: 11, type: "normal", hint: "正常IT通知：本周六凌晨进行ERP系统例行维护，届时系统将短暂不可用" },
  { id: 12, type: "normal", hint: "正常行政通知：下月全员消防演习的时间、集合地点和注意事项" },
  { id: 13, type: "normal", hint: "正常HR通知：公司年会报名截止提醒及节目征集" },
  { id: 14, type: "normal", hint: "正常财务通知：Q1差旅报销截止日期提醒及新版报销流程说明" },
  { id: 15, type: "phishing", hint: "伪造IT安全团队：检测到员工笔记本安装了未授权软件，要求在48小时内登录资产管理平台进行自查申报" },
];

const SCENARIO_SEEDS_EN = [
  { id: 1, type: "phishing", hint: "冒充 ATO (Australian Taxation Office) 要求确认 tax return 信息" },
  { id: 2, type: "phishing", hint: "伪造 Woolworths/Coles 供应商发票异常通知" },
  { id: 3, type: "phishing", hint: "假冒 ANZ/Commonwealth Bank 账户安全告警，要求点击链接验证身份" },
  { id: 4, type: "phishing", hint: "伪造 Australia Post 包裹投递失败通知，要求点击链接支付重新投递费用" },
  { id: 5, type: "phishing", hint: "冒充 IT 运维，要求通过链接验证 Microsoft 365 登录态以防账户锁定" },
  { id: 6, type: "phishing", hint: "伪造 Docusign/Acrobat Sign，提示有一份来自高管的紧急机密文件需要电子签名" },
  { id: 7, type: "phishing", hint: "伪造 HR，通知关于公司新的 Employee Benefits Plan 调整，要求点击链接确认" },
  { id: 8, type: "phishing", hint: "骗取 Office 365 凭证：声称密码即将过期，要求在 24 小时内更新密码" },
  { id: 9, type: "normal", hint: "正常公司内部通知：Office relocation announcement，新办公室的地址和搬迁日程安排" },
  { id: 10, type: "normal", hint: "正常 HR 通知：Upcoming quarterly town hall meeting 的时间、地点和议程" },
  { id: 11, type: "normal", hint: "正常 IT 通知：关于周末网络设备升级导致的短暂断网提前通知" },
  { id: 12, type: "normal", hint: "正常行政通知：Public holiday (例如 Australia Day 或 Easter) 的放假安排" },
];

const SCENARIO_SEEDS = LANG === "en" ? SCENARIO_SEEDS_EN : SCENARIO_SEEDS_ZH;

// ─── System Prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT_ZH = `你是一个高度专业且富有创意的企业级网络安全攻防训练引擎。
你的任务是根据我给出的具体场景，生成一封极度拟真的职场邮件。

【生成规范】
1. 邮件正文字数必须在 150 - 300 字之间。
2. 语言风格：标准的商业语言、行业术语（Jargon），行文高度专业且极其逼真。
3. 关键要素：
   - 专业称呼（"各位同仁"、"Dear Team"、"XX部门全体同事"等，每次要有变化）
   - 详实且看似合理的背景说明与多段落论述
   - 若是钓鱼邮件，必须嵌入带有 Call-To-Action 的可疑 URL（域名须伪造但看似合理）
   - 专业的邮件落款（真实感的姓名、职务、部门、分机号码）
   - 英文企业合规免责声明（Confidentiality Footer）
4. 每封邮件的发件人名称、邮箱域名、主题措辞、落款人姓名和职务必须完全不同。

【JSON Schema】严格输出以下 JSON 对象，不含任何其他文字：
{
  "sender": "显示名",
  "senderEmail": "邮箱地址",
  "subject": "邮件主题",
  "content": "邮件正文(含\\n换行)",
  "isPhishing": true/false,
  "time": "如 上午 09:12",
  "clues": ["线索1", "线索2"] // isPhishing=false时返回空数组
}`;

const SYSTEM_PROMPT_EN = `You are a highly professional and creative enterprise-level cybersecurity attack and defense training engine.
Your task is to generate an extremely realistic workplace email based on the specific scenario I provide.

[Generation Guidelines]
1. The email body must be between 150 - 300 words.
2. Language style: Use pure Australian business English, industry jargon, and an extremely professional and realistic tone.
3. Key elements:
   - Professional greeting (e.g., "Dear Team", "Hi everyone", "To all staff", vary it each time).
   - Detailed and plausible background explanation with multi-paragraph discussion.
   - If it's a phishing email, it MUST embed a suspicious URL with a Call-To-Action (domain must be spoofed but look plausible).
   - Professional email signature (realistic name, title, department, extension number).
   - English corporate compliance disclaimer (Confidentiality Footer).
4. For each email, the sender name, email domain, subject phrasing, sign-off name, and title must be completely different.

[JSON Schema] Strictly output the following JSON object, without any other text. Return ONLY valid JSON:
{
  "sender": "Display Name",
  "senderEmail": "Email Address",
  "subject": "Email Subject",
  "content": "Email Body (with \\n for line breaks)",
  "isPhishing": true/false,
  "time": "e.g. 09:12 AM",
  "clues": ["clue 1", "clue 2"] // return empty array if isPhishing=false
}`;

const SYSTEM_PROMPT = LANG === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH;

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("❌ DEEPSEEK_API_KEY not found in .env.local");
    process.exit(1);
  }

  const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey,
  });

  // 从场景池中选取，循环使用确保覆盖
  const selectedScenarios = [];
  for (let i = 0; i < TOTAL; i++) {
    selectedScenarios.push(SCENARIO_SEEDS[i % SCENARIO_SEEDS.length]);
  }

  const results = [];
  let successCount = 0;

  for (let i = 0; i < TOTAL; i++) {
    const scenario = selectedScenarios[i];
    const label = scenario.type === "phishing" ? "🎣 钓鱼" : "✅ 正常";
    console.log(`\n[${i + 1}/${TOTAL}] ${label} | 场景: ${scenario.hint.substring(0, 40)}...`);

    try {
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: LANG === "en" ? `Please generate an email based on the following scenario, strictly output as JSON formats.
Scenario: ${scenario.hint}
Email Type: ${scenario.type === "phishing" ? "Phishing (isPhishing=true)" : "Normal (isPhishing=false)"}
Random Seed: ${Date.now()}_${Math.random()}` : `请基于以下场景生成一封邮件，严格按 JSON 格式输出。
场景：${scenario.hint}
邮件类型：${scenario.type === "phishing" ? "钓鱼邮件 (isPhishing=true)" : "正常邮件 (isPhishing=false)"}
随机种子：${Date.now()}_${Math.random()}`
          },
        ],
        temperature: 1.0,
        response_format: { type: "json_object" },
      });

      const rawText = response.choices[0]?.message?.content?.trim() || "{}";
      const parsed = JSON.parse(rawText);

      // Schema validation
      if (
        typeof parsed.sender !== "string" ||
        typeof parsed.senderEmail !== "string" ||
        typeof parsed.subject !== "string" ||
        typeof parsed.content !== "string" ||
        typeof parsed.isPhishing !== "boolean" ||
        typeof parsed.time !== "string" ||
        !Array.isArray(parsed.clues)
      ) {
        throw new Error("Schema validation failed");
      }

      // 添加唯一 ID
      parsed.id = `email_${Date.now()}_${i}`;
      results.push(parsed);
      successCount++;
      console.log(`  ✅ 成功 | sender: ${parsed.sender} | subject: ${parsed.subject.substring(0, 30)}...`);

      // 避免打爆 API rate limit
      if (i < TOTAL - 1) {
        console.log("  ⏳ 等待 1.5s...");
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`  ❌ 第 ${i + 1} 封生成失败:`, err.message);
    }
  }

  // 读取已有题库并合并（追加模式，不覆盖）
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  let existing = [];
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
  }

  // 按 id 去重后合并
  const existingIds = new Set(existing.map((e) => e.id));
  const newEmails = results.filter((r) => !existingIds.has(r.id));
  const merged = [...existing, ...newEmails];

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`\n========================================`);
  console.log(`🎯 题库生成完毕！本次新增 ${newEmails.length} 封（成功生成 ${successCount}/${TOTAL}）`);
  console.log(`📦 题库总量：${merged.length} 封`);
  console.log(`📦 输出文件: ${OUTPUT_PATH}`);
  console.log(`========================================\n`);
}

main().catch(console.error);

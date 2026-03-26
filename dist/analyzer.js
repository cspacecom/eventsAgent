"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeHoldings = analyzeHoldings;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
console.log("analyzer.ts KEY:", process.env.ANTHROPIC_API_KEY?.slice(0, 15));
// ─────────────────────────────────────────
// System Prompt：告诉 Claude 它的角色和输出格式
// 这是整个 Agent 最核心的部分，可以持续优化
// ─────────────────────────────────────────
const SYSTEM_PROMPT = `你是一位专业的股票风险分析师，专门识别可能影响股价的黑天鹅事件。


黑天鹅事件分类：
- 管理层：CEO离职/丑闻、内部腐败、高管套现
- 监管：反垄断调查、罚款、牌照吊销、政策打压
- 财务：财务造假信号、现金流危机、债务违约风险
- 地缘：制裁、供应链中断、贸易战影响
- 竞争：颠覆性竞争对手出现、重大技术被替代
- 技术：重大产品缺陷、数据泄露、系统性故障

评分标准：
- 0–3：正常波动，无需关注
- 4–5：值得观察，轻微风险信号
- 6–7：中等风险，建议减仓或密切关注
- 8–10：高度危险，可能出现重大下跌

你必须严格返回以下 JSON 格式，不要包含任何其他文字：
{
  "riskScore": <0到10的整数>,
  "category": "<管理层|监管|财务|地缘|竞争|技术|无风险>",
  "action": "<观察|减仓|紧急警告>",
  "summary": "<一句话总结，不超过50字>",
  "details": "<详细分析，2-3句话>",
  "sourceArticles": ["<相关新闻标题1>", "<相关新闻标题2>"]
}`;
async function analyzeHoldings(stock, news) {
    const client = new sdk_1.default({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    // 把新闻列表格式化成文本喂给 Claude
    const newsText = news
        .map((n, i) => `[${i + 1}] ${n.title}\n来源: ${n.source} | 时间: ${n.publishedAt}\n${n.description}`)
        .join("\n\n");
    const userMessage = `
公司：${stock.name}（${stock.symbol}）
分析日期：${new Date().toLocaleDateString("zh-CN")}

今日相关新闻（共${news.length}条）：
${newsText}

请分析以上新闻，判断该公司是否存在黑天鹅风险，返回 JSON。
  `.trim();
    try {
        const response = await client.messages.create({
            model: "claude-opus-4-5",
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userMessage }],
        });
        // 解析 Claude 返回的 JSON
        const text = response.content[0].type === "text" ? response.content[0].text : "";
        const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
            stock,
            riskScore: parsed.riskScore,
            category: parsed.category,
            action: parsed.action,
            summary: parsed.summary,
            details: parsed.details,
            sourceArticles: parsed.sourceArticles || [],
            analyzedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error(`解析 Claude 响应失败 (${stock.name}):`, error);
        // 解析失败时返回低风险默认值，不让整个程序崩溃
        return {
            stock,
            riskScore: 0,
            category: "无风险",
            action: "观察",
            summary: "分析失败，请手动检查",
            details: "Claude 响应解析错误",
            sourceArticles: [],
            analyzedAt: new Date().toISOString(),
        };
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailAlert = sendEmailAlert;
exports.sendSlackAlert = sendSlackAlert;
const resend_1 = require("resend");
async function sendEmailAlert(reports) {
    const resend = new resend_1.Resend(process.env.RESEND_API_KEY ?? ""); // ← 加在这里
    const subject = `🚨 股票黑天鹅预警：${reports.length} 个高风险事件 - ${new Date().toLocaleDateString("zh-CN")}`;
    const html = buildEmailHtml(reports);
    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: process.env.EMAIL_TO,
        subject,
        html,
    });
    console.log(`✅ 邮件已发送至 ${process.env.EMAIL_TO}`);
}
async function sendSlackAlert(reports) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("未设置 SLACK_WEBHOOK_URL，跳过 Slack 通知");
        return;
    }
    for (const r of reports) {
        const emoji = r.riskScore >= 8 ? "🔴" : "🟠";
        const payload = {
            text: `${emoji} *${r.stock.name}* 风险评分: ${r.riskScore}/10 | ${r.summary}`,
        };
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }
    console.log("✅ Slack 通知已发送");
}
function buildEmailHtml(reports) {
    const rows = reports
        .sort((a, b) => b.riskScore - a.riskScore)
        .map((r) => {
        const color = r.riskScore >= 8 ? "#dc2626" : "#ea580c";
        const sources = r.sourceArticles.map((s) => `<li>${s}</li>`).join("");
        return `
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0; color:#111">${r.stock.name} (${r.stock.symbol})</h3>
            <span style="background:${color}; color:white; padding:4px 12px; border-radius:20px; font-weight:bold;">
              风险 ${r.riskScore}/10
            </span>
          </div>
          <p style="margin:8px 0; color:#6b7280; font-size:14px;">
            类别: ${r.category} &nbsp;|&nbsp; 建议操作: <strong>${r.action}</strong>
          </p>
          <p style="margin:8px 0;"><strong>摘要：</strong>${r.summary}</p>
          <p style="margin:8px 0; color:#374151;">${r.details}</p>
          ${sources ? `<p style="font-size:13px; color:#6b7280;"><strong>相关新闻：</strong><ul>${sources}</ul></p>` : ""}
        </div>
      `;
    })
        .join("");
    return `
    <div style="font-family:sans-serif; max-width:600px; margin:0 auto;">
      <h2 style="color:#111;">📊 每日股票黑天鹅风险报告</h2>
      <p style="color:#6b7280;">${new Date().toLocaleDateString("zh-CN")} 自动生成</p>
      ${rows}
      <p style="color:#9ca3af; font-size:12px; margin-top:24px;">
        此报告由 AI 自动分析生成，仅供参考，不构成投资建议。
      </p>
    </div>
  `;
}

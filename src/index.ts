import * as fs from "fs";
import * as path from "path";
import { analyzeHoldings } from "./analyzer";
import { sendEmailAlert } from "./notifier";
import { fetchNewsForCompany } from "./newsFetcher";
import { RiskReport, Stock } from "./types";

const ALERT_THRESHOLD = 6;
const INTERVAL_HOURS = 5;

function loadTickersFromFile(): Stock[] {
  const filePath = path.join(process.cwd(), "tickers.txt");
  if (!fs.existsSync(filePath)) {
    console.error("❌ 找不到 tickers.txt 文件");
    process.exit(1);
  }
  const lines = fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"));

  const stocks: Stock[] = [];
  for (const line of lines) {
    const parts = line.split(",").map(p => p.trim());
    if (parts.length < 2) continue;
    stocks.push({ symbol: parts[0], name: parts[1] });
  }
  return stocks;
}

async function runScan() {
  const now = new Date().toLocaleString("zh-CN", { timeZone: "America/New_York" });
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🕐 开始扫描 - ${now}`);
  console.log(`${"=".repeat(50)}\n`);

  const holdings = loadTickersFromFile();
  console.log(`📋 持仓：${holdings.map(s => s.symbol).join(", ")}\n`);

  const highRiskReports: RiskReport[] = [];
  let scannedCount = 0;
  let noNewsCount = 0;

  for (const stock of holdings) {
    console.log(`📰 获取 ${stock.name} 新闻...`);
    const news = await fetchNewsForCompany(stock.name, stock.symbol);

    if (!news.length) {
      console.log(`  ⏭️  无新闻，跳过\n`);
      noNewsCount++;
      continue;
    }

    scannedCount++;
    console.log(`🤖 Claude 分析 ${stock.name}（${news.length}条新闻）...`);
    const report = await analyzeHoldings(stock, news);
    console.log(`  评分: ${report.riskScore}/10 | ${report.category}`);
    console.log(`  ${report.summary}\n`);

    if (report.riskScore >= ALERT_THRESHOLD) {
      highRiskReports.push(report);
      console.log(`  🚨 高风险！加入通知列表\n`);
    } else {
      console.log(`  ✅ 风险正常，无需通知\n`);
    }
  }

  // ── 智能发送逻辑 ──────────────────────────
  console.log(`📊 本次扫描结果：`);
  console.log(`   分析了 ${scannedCount} 个有新闻的股票`);
  console.log(`   ${noNewsCount} 个股票无新闻`);
  console.log(`   发现 ${highRiskReports.length} 个高风险事件`);

  if (highRiskReports.length > 0) {
    // 只有真正有高风险才发邮件
    console.log(`\n🚨 发送预警邮件...`);
    await sendEmailAlert(highRiskReports);
  } else if (scannedCount === 0) {
    // 所有股票都没有新闻
    console.log(`\n📭 所有股票今日无新闻，不发送邮件`);
  } else {
    // 有新闻但风险都低
    console.log(`\n😌 所有股票风险正常（低于 ${ALERT_THRESHOLD} 分），不发送邮件`);
  }

  const next = new Date(Date.now() + INTERVAL_HOURS * 60 * 60 * 1000);
  console.log(`\n⏰ 下次扫描：${next.toLocaleString("zh-CN", { timeZone: "America/New_York" })}\n`);
}

async function main() {
  // 调试：确认环境变量是否读取到
  console.log("🔑 ANTHROPIC_API_KEY 前10位:", process.env.ANTHROPIC_API_KEY?.substring(0, 10) ?? "未设置");
  console.log("🔑 RESEND_API_KEY 前10位:", process.env.RESEND_API_KEY?.substring(0, 10) ?? "未设置");

  console.log(`🚀 股票黑天鹅监控 Agent 启动`);

  await runScan();

  setInterval(async () => {
    await runScan();
  }, INTERVAL_HOURS * 60 * 60 * 1000);
}

main().catch(console.error);
export interface Stock {
  symbol: string;
  name: string;
}

export interface NewsItem {
  title: string;
  description: string;
  publishedAt: string;
  source: string;
  url: string;
}

// Claude 返回的结构化风险报告
export interface RiskReport {
  stock: Stock;
  riskScore: number;          // 0–10，越高越危险
  category: string;           // 管理层 / 监管 / 财务 / 地缘 / 竞争 / 技术
  action: "观察" | "减仓" | "紧急警告";
  summary: string;            // 简短说明
  details: string;            // 详细分析
  sourceArticles: string[];   // 相关新闻标题
  analyzedAt: string;         // 分析时间
}

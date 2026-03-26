"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNewsForCompany = fetchNewsForCompany;
const NEWS_API_KEY = process.env.NEWS_API_KEY; // 在 newsapi.org 免费注册获取
// ─────────────────────────────────────────
// 从 NewsAPI 获取公司相关新闻
// 免费版：每天 100 次请求，足够个人使用
// ─────────────────────────────────────────
async function fetchNewsForCompany(companyName, symbol) {
    if (!NEWS_API_KEY) {
        console.warn("⚠️  未设置 NEWS_API_KEY，使用 mock 数据");
        return getMockNews(companyName);
    }
    try {
        // 用公司名 + 股票代码搜索，提高相关性
        const query = encodeURIComponent(`${companyName} OR ${symbol} stock`);
        const from = getYesterday();
        const url = `https://newsapi.org/v2/everything?q=${query}&from=${from}&sortBy=relevancy&language=en&pageSize=10&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status !== "ok") {
            console.error(`NewsAPI 错误: ${data.message}`);
            return [];
        }
        return data.articles.map((a) => ({
            title: a.title || "",
            description: a.description || a.content || "",
            publishedAt: a.publishedAt || "",
            source: a.source?.name || "未知来源",
            url: a.url || "",
        }));
    }
    catch (error) {
        console.error(`获取 ${companyName} 新闻失败:`, error);
        return [];
    }
}
// 获取昨天的日期（YYYY-MM-DD 格式）
function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}
// ─────────────────────────────────────────
// Mock 数据：没有 API Key 时用于测试
// ─────────────────────────────────────────
function getMockNews(companyName) {
    return [
        {
            title: `${companyName} CEO announces surprise resignation amid internal probe`,
            description: `The CEO of ${companyName} has stepped down following an internal investigation into financial irregularities. The board has appointed an interim CEO.`,
            publishedAt: new Date().toISOString(),
            source: "Reuters (Mock)",
            url: "https://example.com",
        },
        {
            title: `${companyName} faces regulatory scrutiny over antitrust concerns`,
            description: `Regulators are investigating ${companyName} for potential antitrust violations in its core business segment.`,
            publishedAt: new Date().toISOString(),
            source: "Bloomberg (Mock)",
            url: "https://example.com",
        },
    ];
}

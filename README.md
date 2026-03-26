# 📊 股票黑天鹅风险监控 Agent

每天自动扫描你持仓股票的新闻，用 Claude AI 识别黑天鹅风险，发送邮件或 Slack 通知。

## 项目结构

```
stock-agent/
├── src/
│   ├── index.ts        # 主入口：编排整个流程
│   ├── analyzer.ts     # Claude AI 风险分析（核心）
│   ├── newsFetcher.ts  # 新闻数据获取
│   ├── notifier.ts     # 邮件 / Slack 通知
│   └── types.ts        # TypeScript 类型定义
├── .github/
│   └── workflows/
│       └── daily-scan.yml  # GitHub Actions 定时任务
├── .env.example        # 环境变量模板
├── package.json
└── tsconfig.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 API Keys
```

需要准备的 Key：
- **ANTHROPIC_API_KEY**：在 [console.anthropic.com](https://console.anthropic.com) 获取
- **NEWS_API_KEY**：在 [newsapi.org](https://newsapi.org) 免费注册（每天100次）
- **EMAIL_FROM / EMAIL_APP_PASS**：Gmail 应用专用密码

### 3. 修改你的持仓

编辑 `src/index.ts`，修改 `HOLDINGS` 数组：

```typescript
const HOLDINGS = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AAPL", name: "Apple" },
  // 添加你自己的持仓...
];
```

### 4. 本地测试运行

```bash
npm run dev
```

没有 NEWS_API_KEY 时会自动使用 mock 数据，可以先测试 Claude 分析和邮件发送是否正常。

### 5. 部署定时自动运行

把代码推送到 GitHub，在 **Settings → Secrets and variables → Actions** 里添加所有环境变量，GitHub Actions 会每天早上 9 点自动运行。

手动触发：在 GitHub → Actions → Daily Stock Black Swan Scan → Run workflow

## 自定义风险阈值

在 `src/index.ts` 修改：
```typescript
const ALERT_THRESHOLD = 6; // 0–10，超过此分数才发通知
```

## 优化 Prompt

`src/analyzer.ts` 里的 `SYSTEM_PROMPT` 是核心，你可以根据自己的投资风格调整：
- 添加你关注的特定风险类型
- 调整各类风险的权重
- 要求 Claude 给出具体的操作建议

## 技术栈

- **Runtime**：Node.js + TypeScript
- **AI**：Anthropic Claude API (`@anthropic-ai/sdk`)
- **新闻**：NewsAPI
- **邮件**：Nodemailer (Gmail)
- **定时**：GitHub Actions (cron)

## 项目简介

金价追踪是一个基于 Next.js 的实物黄金价格监控应用，用于：

- 实时抓取建设银行实物黄金价格
- 按时间范围查看历史价格走势（7 天 / 30 天 / 90 天 / 1 年 / 全部）
- 查看市场概览（最高价、最低价、涨跌幅等）
- 配置爬虫 URL 与定时任务（Cron）
- 支持 PWA，可安装到桌面 / 手机主屏幕

技术栈：

- Next.js 16（App Router，Turbopack）
- React 18
- HeroUI 组件库
- Recharts 图表
- SWR 数据请求
- PostgreSQL 持久化存储
- Playwright 爬虫抓取网页金价

---
## 如图
<img width="863" height="1217" alt="image" src="https://github.com/user-attachments/assets/8e9cec32-3c39-46d4-ac31-f423a937f3f8" />

## 本地开发

1. 安装依赖：

```bash
yarn
```

2. 配置数据库环境变量（PostgreSQL）：

在项目根目录创建 `.env.local`：

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=golden_next
```

3. 启动开发服务器：

```bash
yarn dev
```

打开浏览器访问：http://localhost:3000

主要页面入口为 `app/page.tsx`。

---

## 生产构建与运行

使用 Next.js 官方构建流程（Turbopack）：

```bash
yarn build
yarn start
```

构建结果为独立可运行的 Node.js 服务，默认监听 `3000` 端口。

---

## Docker 运行

项目内已提供 `Dockerfile` 与 `docker-compose.yml`，可用于在服务器上部署。

### 仅启动应用（外部已有数据库）

编辑 `docker-compose.yml` 中的环境变量，将数据库地址改为实际值，例如：

```yaml
services:
  app:
    environment:
      - POSTGRES_HOST=你的数据库地址
      - POSTGRES_PORT=5432
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=golden_next
```

然后在服务器上执行：

```bash
docker compose up -d --build
```

---

## PWA 支持

本项目已配置基础 PWA 能力：

- `app/manifest.ts`：生成 `manifest.webmanifest`
- `app/layout.tsx`：配置 `manifest` 与 `themeColor`

说明：

- 可以在支持的浏览器中“安装应用”（添加到桌面 / 主屏幕）
- 构建引擎使用 Turbopack，目前未启用基于 Webpack 插件的复杂离线缓存策略

如需增强离线缓存，可在 `public` 下自定义 Service Worker 并自行注册。

---

## 定时任务与爬虫

相关核心代码：

- 数据库与金价存储：`lib/db.ts`
- 爬虫逻辑（Playwright）：`lib/scraper.ts`
- 定时任务配置 API：`app/api/cron/config/route.ts`
- 手动触发爬虫 API：`app/api/cron/scrape-gold/route.ts`

在页面中，可以通过“系统设置”弹窗配置：

- 爬虫目标 URL
- 是否启用自动爬取
- Cron 表达式（例如 `0 * * * *` 表示每小时执行一次）

---

## 开发提示

- 前端 UI 主要位于：
  - 实时与走势图页面：`app/page.tsx`
  - 全局样式：`app/globals.css`
- 修改数据库结构时，请同时更新：
  - `lib/db.ts` 中建表与查询逻辑
  - 相关 API Route（如 `/api/gold-price`、`/api/gold-history`）

---

## 许可证

本项目用于个人学习与实验，如需用于生产环境，请根据实际需求进行安全加固与压力测试。

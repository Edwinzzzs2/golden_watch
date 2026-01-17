# 使用 Playwright 官方镜像 (包含 Chromium 等浏览器依赖)
FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS builder

WORKDIR /app

# 设置环境变量，减少日志和交互
ENV CI=1
ENV NEXT_TELEMETRY_DISABLED=1

# 配置 yarn 镜像源 (提高国内构建速度)
RUN npm config set registry https://registry.npmmirror.com
RUN yarn config set registry https://registry.npmmirror.com

# 复制依赖定义文件
COPY package.json yarn.lock* package-lock.json* ./

# 安装依赖 (优先使用 yarn.lock)，忽略 engines 限制避免 Node 版本轻微不匹配导致失败
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile --ignore-engines; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# 复制项目源码
COPY . .

# 构建 Next.js 项目
RUN yarn build

# --- 运行阶段 ---
FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS runner

WORKDIR /app

# 运行时环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户 (安全性)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物 (standalone 模式)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]

# 1️⃣  使用 Node.js 构建阶段
FROM node:18 AS builder

# 设置时区环境变量为 Asia/Shanghai
ENV TZ=Asia/Shanghai

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 配置 pnpm 使用 shamefully-hoist
RUN echo "shamefully-hoist=true" > ./.npmrc

# 安装依赖
RUN pnpm install --registry=https://registry.npmmirror.com

# 复制全部项目文件
COPY . .

FROM nginx:alpine

# 删除默认 Nginx 配置
RUN rm -rf /etc/nginx/conf.d/*

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建的前端文件到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 注入版本信息文件，供前端轮询检测更新
ARG APP_VERSION="dev"
RUN sh -c 'echo "$APP_VERSION" > /usr/share/nginx/html/version.txt'

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

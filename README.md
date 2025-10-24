# 项目说明（中文）

本仓库包含：
- 前端：Vue 3 + Vite（位于项目根目录，包含 Dockerfile）
- 后端：Node.js（Express + Mongoose，位于 `node-service/`，包含 Dockerfile）
- 持久化：MongoDB（通过 Docker Compose 启动并在内部网络中提供服务）
- 编排与部署：`docker-compose.yml` 与 `deploy.ps1`

## 目录结构

- 前端（Vue）：项目根目录（`Dockerfile`、`src/`、`vite.config.js`）
- 后端（Node）：`node-service/`（`Dockerfile`、`server.js`）
- 编排：`docker-compose.yml`
- 部署脚本：`deploy.ps1`

## 环境配置

- `.env.development`：本地环境，`DOCKER_HOST=` 留空表示使用本机 Docker
- `.env.production`：远程环境，示例：`DOCKER_HOST=tcp://47.120.13.248:2374`
- 端口通过环境变量可配置：
  - `FRONTEND_HOST_PORT`（默认 80）
  - `BACKEND_HOST_PORT`（默认 3000）

后端通过内部网络使用服务名连接 MongoDB：
- `MONGO_URI=mongodb://database:27017/mydatabase`

## 一键部署（在项目根目录执行）

```powershell
# 远程（生产，默认）
./deploy.ps1

# 远程：彻底清理后再部署（移除 compose 容器/网络/卷）
./deploy.ps1 -clean

# 远程：彻底清理 + 清理未使用资源（镜像/容器/网络/悬空卷）
./deploy.ps1 -clean -prune

# 远程：强制重建容器（即使配置未变）
./deploy.ps1 -recreate

# 组合示例
./deploy.ps1 -clean -prune -recreate

# 本地（开发环境）
./deploy.ps1 -envName development
./deploy.ps1 -envName development -clean -recreate
```

## 参数说明

- `-envName <production|development>`：选择加载的环境文件（默认 `production` -> `.env.production`）
- `-clean`：在部署前执行 `docker-compose down -v`（删除由 compose 创建的容器、网络、卷）
- `-prune`：在部署前执行 `docker system prune -af` 和 `docker volume prune -f`（清理未使用的镜像/容器/网络与悬空卷）
- `-recreate`：以 `docker-compose up --build -d --force-recreate` 启动（强制重建容器）

## 端口与冲突处理策略

- 脚本默认固定使用：前端 80、后端 3000
- 若检测到端口被 Docker 容器占用，脚本会主动停止并删除占用该端口的容器，再继续部署（避免服务越堆越多）
- 若端口被非 Docker 进程占用，脚本会提示手动释放端口后再部署
- 如需自定义端口，可在对应 `.env.*` 中设置 `FRONTEND_HOST_PORT` 与 `BACKEND_HOST_PORT`

## 部署后前端变更提醒（版本检测与刷新）

为确保用户在页面不刷新的情况下也能及时获取新版本，项目实现了“前端通过后端接口”检测版本的方案：
- 构建/部署阶段：`deploy.ps1` 自动生成 `APP_VERSION`（时间戳）、`BUILD_TIME`、`COMMIT_SHA` 并注入容器
- 运行阶段：后端提供 `GET /api/version`，返回 `{ version, buildTime, commit }`
- 前端（`src/App.vue`）每 10 秒轮询 `/api/version`，若发现 `version` 变化，页面顶部出现“检测到新版本，点击刷新页面获取最新内容”的提示，用户点击按钮即可刷新

优点：
- 通过后端接口统一对外，兼容代理、鉴权等场景
- 不依赖 WebSocket/SSE，部署简单，稳定可靠

## 本地连接远端后端（开发与打包）

- 环境变量配置
  - `.env.development`
    - `VITE_API_BASE=http://47.120.13.248`
    - `VITE_PROXY_TARGET=http://47.120.13.248`
  - `.env.remote`
    - `VITE_API_BASE=http://47.120.13.248`
- 请求封装
  - 使用 `src/utils/api.js` 的 `apiFetch(path, options)` 统一发起请求
  - 自动拼接 `VITE_API_BASE` 并附带 `Authorization: Bearer <token>`（若本地存有 token）
- 开发模式（vite dev）
  - `npm run dev`
  - `vite.config.js` 会将 `/api` 代理到 `VITE_PROXY_TARGET`，避免浏览器跨域
- 打包直连远端
  - `npm run build:remote`（使用 `.env.remote`）
  - 产物中的 API 将直接请求 `VITE_API_BASE`
  - 本地预览：`npx serve dist -p 5173` 或 `vite preview`

## 访问地址

- 前端：`http://<host>:<FRONTEND_HOST_PORT>`（若为 80 可省略端口）
- 后端：`http://<host>:<BACKEND_HOST_PORT>`

说明：
- 远程部署时 `<host>` 来自 `$env:DOCKER_HOST` 的主机地址（如 `47.120.13.248`）
- 本地部署使用 `localhost`

## 注意事项

- Compose 不再使用固定 `container_name`，以避免与宿主机上现有容器重名冲突
- MongoDB 不对外暴露 27017 端口；后端通过内部网络服务名 `database` 访问
- `-prune` 会清理主机上未使用的资源，请谨慎在共享 Docker 主机上使用
- 脚本在部署前会尝试清理历史遗留的命名容器：`vue-project-container`、`node-service-container`、`mongodb`

## 接口验证步骤（排查 404 / 代理问题）

- 确认前端 Nginx 转发配置（位于 `nginx.conf`）
  - 应为：
    - `location /api/ { proxy_pass http://backend:3000; }`（注意 proxy_pass 末尾不要带 `/`，以保留原始 URI）
- 重新部署应用以加载最新配置：
  - `./deploy.ps1 -recreate` 或 `./deploy.ps1 -clean -recreate`
- 验证接口（通过前端 Nginx 对外暴露的地址）：
  - Windows PowerShell：`Invoke-WebRequest http://<host>/api/version | Select-Object -Expand Content`
  - curl：`curl -s http://<host>/api/version`
  - 预期返回：`{"version":"<timestamp>","buildTime":"<timestamp>","commit":"<sha>"}`
- 若仍 404：
  - 检查后端是否挂载了路由前缀：`app.use('/api/version', versionRouter)`
  - 在前端容器内执行：`curl http://backend:3000/api/version` 验证容器间联通
  - 查看后端日志是否有请求记录/报错

## 故障排查

- 端口占用：若为容器占用，脚本会自动清理；若为宿主机进程占用，请先释放端口
- 容器重名：若存在历史手动创建的 `mongodb` 容器，可手动删除：
  - Windows PowerShell：`docker ps -a | findstr mongodb`
  - 停止并删除：`docker stop <name_or_id>; docker rm <name_or_id>`
- 远程连接失败：确认远程 `DOCKER_HOST` 可达、防火墙已放行、Docker 开放远程访问

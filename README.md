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

## 故障排查

- 端口占用：若为容器占用，脚本会自动清理；若为宿主机进程占用，请先释放端口
- 容器重名：若存在历史手动创建的 `mongodb` 容器，可手动删除：
  - Windows PowerShell：`docker ps -a | findstr mongodb`
  - 停止并删除：`docker stop <name_or_id>; docker rm <name_or_id>`
- 远程连接失败：确认远程 `DOCKER_HOST` 可达、防火墙已放行、Docker 开放远程访问

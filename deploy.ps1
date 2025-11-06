# 部署脚本（PowerShell）                  # 顶部中文注释，说明这是部署脚本
# 作用：                                   # 概述脚本做什么
# - 读取环境（.env.*）和固定端口             # 加载 .env 文件与端口设置
# - 可选清理/重建容器                       # 支持清理、重建 Docker 容器
# - 注入版本信息（APP_VERSION/BUILD_TIME/COMMIT_SHA）   # 写入构建版本信息
# - docker-compose 启动前后端与 MongoDB      # 通过 docker-compose 启动服务
# - 部署成功后，自动调用 /api/version/broadcast 触发 WebSocket 刷新提示  # 自动广播版本
# 使用：                                   # 使用示例
# - 远程：./deploy.ps1 [-clean] [-prune] [-recreate]    # 远程部署
# - 本地：./deploy.ps1 -envName development [-clean] [-recreate] # 本地部署
param(                                         # 定义脚本参数
    [string]$envName = "production",           # 环境名，默认 production
    [switch]$clean,                             # 是否清理 docker-compose 创建的资源
    [switch]$prune,                             # 是否清理未使用的镜像/网络/容器/卷
    [switch]$recreate,                           # 是否强制重建容器
    [string]$deployTarget = "all"               # 部署目标：all, frontend, backend
)

# NOTE: ASCII-only output to avoid encoding issues on Windows PowerShell  # 提示：输出仅 ASCII，避免编码问题

# 1) Load environment file                     # 第一步：加载环境文件
$envFile = ".\.env.$envName"                  # 构造环境文件路径，如 .env.production
Write-Host "Environment: $envName (loading $envFile)"  # 打印当前环境与文件路径

if (-not (Test-Path $envFile)) {               # 若环境文件不存在
    Write-Host "Error: Environment file '$envFile' not found."  # 打印错误
    exit 1                                     # 终止脚本
}

# Defaults                                     # 默认端口设置
$desiredFrontendPort = 80                      # 前端期望使用的宿主机端口（默认 80）
$desiredBackendPort = 3000                     # 后端期望使用的宿主机端口（默认 3000）

# Load variables from .env (simple KEY=VALUE lines) # 从 .env 文件读取变量（简单 KEY=VALUE）
Get-Content -LiteralPath $envFile | ForEach-Object { # 逐行读取环境文件
    if (-not $_) { return }                    # 空行跳过
    if ($_.TrimStart().StartsWith('#')) { return }   # 注释行跳过
    $parts = $_.Split('=', 2)                  # 仅按第一个 = 拆分
    if ($parts.Count -ne 2) { return }         # 非法行跳过
    $k = $parts[0].Trim()                      # 键名去空格
    $v = $parts[1].Trim()                      # 键值去空格
    switch ($k) {                              # 根据键名处理
        'DOCKER_HOST' { if ($v) { $env:DOCKER_HOST = $v } }         # 设置远程 Docker 主机
        'FRONTEND_HOST_PORT' { if ($v) { $desiredFrontendPort = [int]$v } } # 覆盖前端端口
        'BACKEND_HOST_PORT' { if ($v) { $desiredBackendPort = [int]$v } }   # 覆盖后端端口
    }
}

if ($envName -ne "development" -and -not $env:DOCKER_HOST) {  # 非开发环境必须提供 DOCKER_HOST
    Write-Host "Error: DOCKER_HOST is required in $envFile for production."  # 打印错误
    exit 1                               # 终止脚本
}

if ($env:DOCKER_HOST) { Write-Host "DOCKER_HOST = $env:DOCKER_HOST" } else { Write-Host "Using local Docker host" } # 显示 Docker 主机

# 2) Optional cleanup                         # 第二步：可选清理
if ($clean) {                                 # 若指定 -clean
    Write-Host "Running 'docker-compose down -v' for thorough cleanup..."  # 提示正在清理
    docker-compose down -v | Out-Null         # 彻底移除 compose 创建的资源（含卷）
}
if ($prune) {                                 # 若指定 -prune
    Write-Host "Pruning unused Docker resources (images/containers/networks)..." # 提示清理未使用资源
    docker system prune -af | Out-Null        # 清理未使用镜像/容器/网络
    Write-Host "Pruning unused Docker volumes..."  # 提示清理卷
    docker volume prune -f | Out-Null         # 清理未使用卷
}

# 3) Pre-clean known legacy containers to avoid conflicts # 第三步：预清理可能冲突的旧命名容器
$oldContainers = @("vue-project-container", "node-service-container", "mongodb") # 历史容器名清单
foreach ($name in $oldContainers) {           # 遍历清单
    $id = docker ps -a --filter "name=^/$name$" --format "{{.ID}}"   # 查找同名容器
    if ($id) {                                # 找到则处理
        Write-Host "Stopping and removing legacy container: $name ($id)" # 打印提示
        docker stop $name | Out-Null          # 停止容器
        docker rm $name | Out-Null            # 删除容器
    }
}

# 4) Functions to detect and evict containers that bind specific host ports # 第四步：端口检测与逐出函数
function Test-PortUsedByDocker([int]$port) {  # 检查端口是否被 Docker 容器占用
    $list = docker ps --format "{{.Ports}}"   # 获取端口映射列表
    if (-not $list) { return $false }         # 若无返回，视为未占用
    foreach ($line in $list) {                # 遍历每一行端口映射
        if ($line -match ":$port->") { return $true }  # 匹配宿主端口
    }
    return $false                             # 未匹配则未占用
}

function Stop-ContainersUsingPort([int]$port) { # 停止并移除占用指定端口的容器
    $ids = docker ps --filter "publish=$port" -q # 获取占用该端口的容器 ID 列表
    if ($ids) {                                 # 若有容器
        foreach ($cid in $ids) {                 # 遍历容器 ID
            Write-Host ("Stopping container using port {0}: {1}" -f $port, $cid) # 打印提示
            docker stop $cid | Out-Null          # 停止容器
            docker rm $cid | Out-Null            # 删除容器
        }
    }
}

$frontendPort = $desiredFrontendPort          # 实际前端端口初始化为期望值
$backendPort = $desiredBackendPort            # 实际后端端口初始化为期望值

# Enforce fixed ports by evicting conflicting containers instead of changing ports # 强制使用固定端口，若冲突则逐出现有容器
if (Test-PortUsedByDocker -port $frontendPort) {   # 检测前端端口是否被容器占用
    Write-Host "Host port $frontendPort is in use. Stopping conflicting docker containers..." # 打印提示
    Stop-ContainersUsingPort -port $frontendPort    # 停止并删除占用该端口的容器
    Start-Sleep -Seconds 1                          # 等待 1 秒
    if (Test-PortUsedByDocker -port $frontendPort) {# 再次检测
        Write-Host "Error: Host port $frontendPort is still in use. It may be occupied by a non-docker service." # 仍占用则报错
        Write-Host "Please free the port manually, then re-run with -clean/-recreate if needed." # 提示人工释放端口
        exit 1                                       # 终止脚本
    }
}

if (Test-PortUsedByDocker -port $backendPort) {     # 检测后端端口是否被容器占用
    Write-Host "Host port $backendPort is in use. Stopping conflicting docker containers..."  # 打印提示
    Stop-ContainersUsingPort -port $backendPort      # 停止并删除占用该端口的容器
    Start-Sleep -Seconds 1                           # 等待 1 秒
    if (Test-PortUsedByDocker -port $backendPort) {  # 再次检测
        Write-Host "Error: Host port $backendPort is still in use. It may be occupied by a non-docker service." # 仍占用则报错
        Write-Host "Please free the port manually, then re-run with -clean/-recreate if needed." # 提示人工释放端口
        exit 1                                       # 终止脚本
    }
}

# Pass final ports to compose via env           # 将最终端口写入环境变量供 compose 使用
$env:FRONTEND_HOST_PORT = "$frontendPort"      # 导出前端宿主端口
$env:BACKEND_HOST_PORT = "$backendPort"        # 导出后端宿主端口
Write-Host "Using ports -> frontend: ${frontendPort}, backend: ${backendPort}"  # 打印端口信息

# 5) Compose up                                # 第五步：启动 compose
# Provide build-time version for frontend image # 提供构建版本信息
$timestamp = Get-Date -Format "yyyyMMddHHmmss"  # 生成时间戳（版本）
$env:APP_VERSION = $timestamp                    # 设置 APP_VERSION 环境变量
$env:BUILD_TIME = $timestamp                     # 设置 BUILD_TIME 环境变量
# Try get short commit sha; fallback to 'unknown' # 尝试获取 Git 短提交哈希
$commit = "unknown"                              # 默认 unknown
try { $commit = (& git rev-parse --short HEAD) } catch {}  # 获取 git 提交哈希，失败忽略
if (-not $commit) { $commit = "unknown" }        # 兜底 unknown
$env:COMMIT_SHA = $commit.Trim()                  # 设置 COMMIT_SHA 环境变量
Write-Host "Using APP_VERSION = $env:APP_VERSION, BUILD_TIME = $env:BUILD_TIME, COMMIT_SHA = $env:COMMIT_SHA"  # 打印版本信息

Write-Host "Starting docker-compose deployment..."  # 提示开始部署
$composeArgs = @("up", "--build", "-d")         # 组合 compose 参数（构建并后台启动）
if ($recreate) { $composeArgs += "--force-recreate" } # 若指定重建，则追加参数

# Add conditional service deployment
if ($deployTarget -eq "frontend") {
    $composeArgs += "--no-deps"
    $composeArgs += "frontend"
    Write-Host "Deploying only frontend service. Other services will not be affected."
} elseif ($deployTarget -eq "backend") {
    $composeArgs += "--no-deps"
    $composeArgs += "backend"
    Write-Host "Deploying only backend service. Other services will not be affected."
} elseif ($deployTarget -eq "all") {
    Write-Host "Deploying all services (frontend and backend)."
} else {
    Write-Host "Error: Invalid deployTarget specified. Must be 'all', 'frontend', or 'backend'."
    exit 1
}

& docker-compose @composeArgs                      # 执行 docker-compose 命令

if ($LASTEXITCODE -ne 0) {                         # 若返回码非 0，视为失败
    Write-Host "docker-compose deployment failed." # 打印失败信息
    if ($env:DOCKER_HOST) { Remove-Item Env:DOCKER_HOST }   # 清理导出的环境变量
    if ($env:FRONTEND_HOST_PORT) { Remove-Item Env:FRONTEND_HOST_PORT }
    if ($env:BACKEND_HOST_PORT) { Remove-Item Env:BACKEND_HOST_PORT }
    exit 1                                         # 退出
}

Write-Host "Deployment successful!"               # 打印成功信息

# 6) Access URLs                              # 第六步：显示访问地址
$accessHost = "localhost"                      # 默认访问主机为本地
if ($env:DOCKER_HOST) {                        # 若使用远程 Docker 主机
    try { $accessHost = ([System.Uri]$env:DOCKER_HOST).Host } catch { }  # 解析主机名
}
Write-Host ("- Frontend:  http://{0}:{1}" -f $accessHost, $frontendPort) # 打印前端地址
Write-Host ("- Backend:   http://{0}:{1}" -f $accessHost, $backendPort)  # 打印后端地址

# 7) Broadcast new version via HTTP to notify WS clients (optional but recommended) # 第七步：通过 HTTP 触发 WS 广播（可选，推荐）
# Requires backend to be ready. We'll retry a few times.         # 需要后端就绪，内置重试机制
$broadcastToken = $env:VERSION_BROADCAST_TOKEN                   # 读取广播鉴权令牌
if (-not $broadcastToken) { $broadcastToken = "please_change" } # 若未设置则使用占位值
$broadcastUrl = ("http://{0}:{1}/api/version/broadcast" -f $accessHost, $frontendPort) # 目标广播地址（经前端 Nginx）

$maxRetry = 6                                    # 最大重试次数
for ($i=1; $i -le $maxRetry; $i++) {             # 循环重试
    Write-Host ("Attempt {0}/{1}: broadcasting version to {2}" -f $i, $maxRetry, $broadcastUrl) # 打印当前重试次数
    try {
        $body = @{ version=$env:APP_VERSION; buildTime=$env:BUILD_TIME; commit=$env:COMMIT_SHA } | ConvertTo-Json -Compress # 组装请求体 JSON
        $resp = Invoke-WebRequest -Uri $broadcastUrl -Method POST -Headers @{ 'x-admin-token'=$broadcastToken; 'Content-Type'='application/json' } -Body $body -TimeoutSec 5 -UseBasicParsing # 发送请求
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {  # 返回 2xx 视为成功
            Write-Host "Broadcast succeeded."; break  # 成功后跳出重试
        }
    } catch {                                        # 捕获异常（后端未就绪等）
        Start-Sleep -Seconds 2                        # 等待 2 秒后重试
    }
}

# 8) Friendly notice about README            # 第八步：友好提示 README 位置
Write-Host ""                                 # 输出空行
Write-Host "README (Chinese) available at .\\README.md"  # 打印 README 路径

# 9) Clean up env vars                       # 第九步：清理导出的环境变量
if ($env:DOCKER_HOST) { Remove-Item Env:DOCKER_HOST }           # 清理 DOCKER_HOST
if ($env:FRONTEND_HOST_PORT) { Remove-Item Env:FRONTEND_HOST_PORT } # 清理前端端口变量
if ($env:BACKEND_HOST_PORT) { Remove-Item Env:BACKEND_HOST_PORT }   # 清理后端端口变量
if ($env:APP_VERSION) { Remove-Item Env:APP_VERSION }               # 清理 APP_VERSION
if ($env:BUILD_TIME) { Remove-Item Env:BUILD_TIME }                 # 清理 BUILD_TIME
if ($env:COMMIT_SHA) { Remove-Item Env:COMMIT_SHA }                 # 清理 COMMIT_SHA

param(
    [string]$envName = "production",
    [switch]$clean,
    [switch]$prune,
    [switch]$recreate
)

# NOTE: ASCII-only output to avoid encoding issues on Windows PowerShell

# 1) Load environment file
$envFile = ".\.env.$envName"
Write-Host "Environment: $envName (loading $envFile)"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: Environment file '$envFile' not found."
    exit 1
}

# Defaults
$desiredFrontendPort = 80
$desiredBackendPort = 3000

# Load variables from .env (simple KEY=VALUE lines)
Get-Content -LiteralPath $envFile | ForEach-Object {
    if (-not $_) { return }
    if ($_.TrimStart().StartsWith('#')) { return }
    $parts = $_.Split('=', 2)
    if ($parts.Count -ne 2) { return }
    $k = $parts[0].Trim()
    $v = $parts[1].Trim()
    switch ($k) {
        'DOCKER_HOST' { if ($v) { $env:DOCKER_HOST = $v } }
        'FRONTEND_HOST_PORT' { if ($v) { $desiredFrontendPort = [int]$v } }
        'BACKEND_HOST_PORT' { if ($v) { $desiredBackendPort = [int]$v } }
    }
}

if ($envName -ne "development" -and -not $env:DOCKER_HOST) {
    Write-Host "Error: DOCKER_HOST is required in $envFile for production."
    exit 1
}

if ($env:DOCKER_HOST) { Write-Host "DOCKER_HOST = $env:DOCKER_HOST" } else { Write-Host "Using local Docker host" }

# 2) Optional cleanup
if ($clean) {
    Write-Host "Running 'docker-compose down -v' for thorough cleanup..."
    docker-compose down -v | Out-Null
}
if ($prune) {
    Write-Host "Pruning unused Docker resources (images/containers/networks)..."
    docker system prune -af | Out-Null
    Write-Host "Pruning unused Docker volumes..."
    docker volume prune -f | Out-Null
}

# 3) Pre-clean known legacy containers to avoid conflicts
$oldContainers = @("vue-project-container", "node-service-container", "mongodb")
foreach ($name in $oldContainers) {
    $id = docker ps -a --filter "name=^/$name$" --format "{{.ID}}"
    if ($id) {
        Write-Host "Stopping and removing legacy container: $name ($id)"
        docker stop $name | Out-Null
        docker rm $name | Out-Null
    }
}

# 4) Functions to detect and evict containers that bind specific host ports
function Test-PortUsedByDocker([int]$port) {
    $list = docker ps --format "{{.Ports}}"
    if (-not $list) { return $false }
    foreach ($line in $list) {
        if ($line -match ":$port->") { return $true }
    }
    return $false
}

function Stop-ContainersUsingPort([int]$port) {
    $ids = docker ps --filter "publish=$port" -q
    if ($ids) {
        foreach ($cid in $ids) {
            Write-Host ("Stopping container using port {0}: {1}" -f $port, $cid)
            docker stop $cid | Out-Null
            docker rm $cid | Out-Null
        }
    }
}

$frontendPort = $desiredFrontendPort
$backendPort = $desiredBackendPort

# Enforce fixed ports by evicting conflicting containers instead of changing ports
if (Test-PortUsedByDocker -port $frontendPort) {
    Write-Host "Host port $frontendPort is in use. Stopping conflicting docker containers..."
    Stop-ContainersUsingPort -port $frontendPort
    Start-Sleep -Seconds 1
    if (Test-PortUsedByDocker -port $frontendPort) {
        Write-Host "Error: Host port $frontendPort is still in use. It may be occupied by a non-docker service."
        Write-Host "Please free the port manually, then re-run with -clean/-recreate if needed."
        exit 1
    }
}

if (Test-PortUsedByDocker -port $backendPort) {
    Write-Host "Host port $backendPort is in use. Stopping conflicting docker containers..."
    Stop-ContainersUsingPort -port $backendPort
    Start-Sleep -Seconds 1
    if (Test-PortUsedByDocker -port $backendPort) {
        Write-Host "Error: Host port $backendPort is still in use. It may be occupied by a non-docker service."
        Write-Host "Please free the port manually, then re-run with -clean/-recreate if needed."
        exit 1
    }
}

# Pass final ports to compose via env
$env:FRONTEND_HOST_PORT = "$frontendPort"
$env:BACKEND_HOST_PORT = "$backendPort"
Write-Host "Using ports -> frontend: ${frontendPort}, backend: ${backendPort}"

# 5) Compose up
# Provide build-time version for frontend image
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$env:APP_VERSION = $timestamp
$env:BUILD_TIME = $timestamp
# Try get short commit sha; fallback to 'unknown'
$commit = "unknown"
try { $commit = (& git rev-parse --short HEAD) } catch {}
if (-not $commit) { $commit = "unknown" }
$env:COMMIT_SHA = $commit.Trim()
Write-Host "Using APP_VERSION = $env:APP_VERSION, BUILD_TIME = $env:BUILD_TIME, COMMIT_SHA = $env:COMMIT_SHA"

Write-Host "Starting docker-compose deployment..."
$composeArgs = @("up", "--build", "-d")
if ($recreate) { $composeArgs += "--force-recreate" }

& docker-compose @composeArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "docker-compose deployment failed."
    if ($env:DOCKER_HOST) { Remove-Item Env:DOCKER_HOST }
    if ($env:FRONTEND_HOST_PORT) { Remove-Item Env:FRONTEND_HOST_PORT }
    if ($env:BACKEND_HOST_PORT) { Remove-Item Env:BACKEND_HOST_PORT }
    exit 1
}

Write-Host "Deployment successful!"

# 6) Access URLs
$accessHost = "localhost"
if ($env:DOCKER_HOST) {
    try { $accessHost = ([System.Uri]$env:DOCKER_HOST).Host } catch { }
}
Write-Host ("- Frontend:  http://{0}:{1}" -f $accessHost, $frontendPort)
Write-Host ("- Backend:   http://{0}:{1}" -f $accessHost, $backendPort)

# 7) Broadcast new version via HTTP to notify WS clients (optional but recommended)
# Requires backend to be ready. We'll retry a few times.
$broadcastToken = $env:VERSION_BROADCAST_TOKEN
if (-not $broadcastToken) { $broadcastToken = "please_change" }
$broadcastUrl = ("http://{0}:{1}/api/version/broadcast" -f $accessHost, $frontendPort)

$maxRetry = 6
for ($i=1; $i -le $maxRetry; $i++) {
    Write-Host ("Attempt {0}/{1}: broadcasting version to {2}" -f $i, $maxRetry, $broadcastUrl)
    try {
        $body = @{ version=$env:APP_VERSION; buildTime=$env:BUILD_TIME; commit=$env:COMMIT_SHA } | ConvertTo-Json -Compress
        $resp = Invoke-WebRequest -Uri $broadcastUrl -Method POST -Headers @{ 'x-admin-token'=$broadcastToken; 'Content-Type'='application/json' } -Body $body -TimeoutSec 5 -UseBasicParsing
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
            Write-Host "Broadcast succeeded."; break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

# 8) Friendly notice about README
Write-Host ""
Write-Host "README (Chinese) available at .\\README.md"

# 9) Clean up env vars
if ($env:DOCKER_HOST) { Remove-Item Env:DOCKER_HOST }
if ($env:FRONTEND_HOST_PORT) { Remove-Item Env:FRONTEND_HOST_PORT }
if ($env:BACKEND_HOST_PORT) { Remove-Item Env:BACKEND_HOST_PORT }
if ($env:APP_VERSION) { Remove-Item Env:APP_VERSION }
if ($env:BUILD_TIME) { Remove-Item Env:BUILD_TIME }
if ($env:COMMIT_SHA) { Remove-Item Env:COMMIT_SHA }

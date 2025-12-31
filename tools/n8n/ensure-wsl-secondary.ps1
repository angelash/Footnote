# 确保 WSL 从实例（n8n-secondary）处于运行状态。
# 可用于：
# - Windows 计划任务（开机/定时）
# - 手动运维
# - 未来接入 PM2 / 其他守护方式
#
# 依赖：
# - Windows 可执行 wsl
# - WSL 中已安装 pm2，且 n8n-secondary 已配置为 pm2 app

$ErrorActionPreference = "Stop"

param(
    [int]$Port = 5680,
    [string]$ProjectRoot = "/home/shash/work/Footnote",
    [string]$ProcessName = "n8n-secondary",
    [string]$StartCommand = "pm2 start tools/n8n/start-n8n-secondary.sh --name n8n-secondary"
)

function Write-Info([string]$msg) { Write-Host "[ensure-wsl-secondary] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[ensure-wsl-secondary] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[ensure-wsl-secondary] $msg" -ForegroundColor Yellow }

Write-Info "Checking WSL PM2 status..."

$status = wsl bash -lc "cd $ProjectRoot && pm2 status $ProcessName --no-color" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warn "pm2 status failed, trying to start: $ProcessName"
    wsl bash -lc "cd $ProjectRoot && $StartCommand" | Out-Null
} elseif ($status -match "online") {
    Write-Ok "$ProcessName is online"
} else {
    Write-Warn "$ProcessName not online, restarting..."
    wsl bash -lc "cd $ProjectRoot && pm2 restart $ProcessName" | Out-Null
}

Write-Info "Checking port $Port..."
$port = netstat -ano | findstr ":$Port" 2>$null
if ($port) {
    Write-Ok "Port $Port is listening"
} else {
    Write-Warn "Port $Port not listening, starting process..."
    wsl bash -lc "cd $ProjectRoot && $StartCommand" | Out-Null
}

Write-Info "Done."



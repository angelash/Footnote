# WSL PM2 桥接脚本
# 通过 Windows PowerShell 管理 WSL 中的 PM2 服务

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs', 'monit')]
    [string]$Action,
    
    [string]$Service = 'n8n-secondary'
)

$projectRoot = '/mnt/f/workspace/github/Footnote'

$wslCommand = switch ($Action) {
    'start'   { "pm2 start $Service" }
    'stop'    { "pm2 stop $Service" }
    'restart' { "pm2 restart $Service" }
    'status'  { "pm2 status" }
    'logs'    { "pm2 logs $Service --lines 50" }
    'monit'   { "pm2 monit" }
}

Write-Host "执行 WSL 命令: $wslCommand" -ForegroundColor Cyan
wsl bash -c "cd $projectRoot && $wslCommand"


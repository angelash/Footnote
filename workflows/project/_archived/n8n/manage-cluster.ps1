# n8n 集群管理脚本

function Show-Status {
    Write-Host "`n=== n8n 集群状态 ===" -ForegroundColor Cyan
    
    Write-Host "`n[Windows] 主实例 (端口 5678):" -ForegroundColor Yellow
    pm2 status n8n-primary 2>&1
    
    Write-Host "`n[WSL] 从实例 (端口 5680):" -ForegroundColor Yellow
    wsl bash -c "cd /mnt/f/workspace/github/Footnote && pm2 status n8n-secondary" 2>&1
    
    Write-Host "`n访问地址:" -ForegroundColor Green
    Write-Host "  主实例: http://localhost:5678" -ForegroundColor White
    Write-Host "  从实例: http://localhost:5680" -ForegroundColor White
}

function Start-All {
    Write-Host "启动所有实例..." -ForegroundColor Cyan
    # Windows 主实例：n8n v2 不支持 --port 参数，端口/host 用环境变量配置
    $env:N8N_PORT = "5678"
    $env:N8N_HOST = "0.0.0.0"
    $env:N8N_PROTOCOL = "http"
    pm2 delete n8n-primary 2>$null
    pm2 start n8n --name n8n-primary -- start

    # WSL 从实例：使用仓库内启动脚本（包含端口 5680 配置）
    wsl bash -c "cd /mnt/f/workspace/github/Footnote && pm2 delete n8n-secondary 2>/dev/null"
    wsl bash -c "cd /mnt/f/workspace/github/Footnote && pm2 start workflows/project/n8n/start-n8n-secondary.sh --name n8n-secondary"
    Write-Host "完成！" -ForegroundColor Green
}

function Stop-All {
    Write-Host "停止所有实例..." -ForegroundColor Cyan
    pm2 stop n8n-primary
    wsl bash -c "cd /mnt/f/workspace/github/Footnote && pm2 stop n8n-secondary"
    Write-Host "完成！" -ForegroundColor Green
}

function Restart-All {
    Write-Host "重启所有实例..." -ForegroundColor Cyan
    pm2 restart n8n-primary
    wsl bash -c "cd /mnt/f/workspace/github/Footnote && pm2 restart n8n-secondary"
    Write-Host "完成！" -ForegroundColor Green
}

function Show-Logs {
    param([string]$Instance = 'all')
    
    if ($Instance -eq 'primary' -or $Instance -eq 'all') {
        Write-Host "`n[Windows] 主实例日志:" -ForegroundColor Yellow
        pm2 logs n8n-primary --lines 20 --nostream
    }
    
    if ($Instance -eq 'secondary' -or $Instance -eq 'all') {
        Write-Host "`n[WSL] 从实例日志:" -ForegroundColor Yellow
        wsl bash -c "cd /mnt/f/workspace/github/Footnote && pm2 logs n8n-secondary --lines 20 --nostream"
    }
}

# 主菜单
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('status', 'start', 'stop', 'restart', 'logs')]
    [string]$Action = 'status'
)

switch ($Action) {
    'status'  { Show-Status }
    'start'   { Start-All }
    'stop'    { Stop-All }
    'restart' { Restart-All }
    'logs'    { Show-Logs }
}


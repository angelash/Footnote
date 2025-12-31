# n8n 集群环境部署脚本

Write-Host "`n=== n8n 主从集群环境部署 ===" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 检查步骤
function Check-Prerequisites {
    Write-Host "[1/6] 检查前置条件..." -ForegroundColor Yellow
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version
        Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Node.js 未安装" -ForegroundColor Red
        exit 1
    }
    
    # 检查 npm
    try {
        $npmVersion = npm --version
        Write-Host "  ✓ npm: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ npm 未安装" -ForegroundColor Red
        exit 1
    }
    
    # 检查 WSL
    try {
        $wslVersion = wsl --version 2>&1
        Write-Host "  ✓ WSL 可用" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ WSL 不可用" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

# 安装 Windows 依赖
function Install-WindowsDependencies {
    Write-Host "[2/6] 安装 Windows 依赖..." -ForegroundColor Yellow
    
    # 检查 PM2
    $pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
    if (-not $pm2Installed) {
        Write-Host "  安装 PM2..." -ForegroundColor Cyan
        npm install -g pm2
        Write-Host "  ✓ PM2 已安装" -ForegroundColor Green
    } else {
        Write-Host "  ✓ PM2 已安装" -ForegroundColor Green
    }
    
    # 检查 n8n
    $n8nInstalled = Get-Command n8n -ErrorAction SilentlyContinue
    if (-not $n8nInstalled) {
        Write-Host "  安装 n8n..." -ForegroundColor Cyan
        npm install -g n8n
        Write-Host "  ✓ n8n 已安装" -ForegroundColor Green
    } else {
        Write-Host "  ✓ n8n 已安装" -ForegroundColor Green
    }
    
    Write-Host ""
}

# 安装 WSL 依赖
function Install-WSLDependencies {
    Write-Host "[3/6] 安装 WSL 依赖..." -ForegroundColor Yellow
    
    Write-Host "  在 WSL 中安装 PM2 和 n8n..." -ForegroundColor Cyan
    
    # 检查并安装 PM2
    $pm2Script = "cd /home/shash/work/Footnote; which pm2"
    $pm2Check = wsl bash -c $pm2Script 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  安装 PM2..." -ForegroundColor Cyan
        $installPm2 = "cd /home/shash/work/Footnote; npm install -g pm2"
        wsl bash -c $installPm2 2>&1 | Out-Null
    } else {
        Write-Host "  ✓ PM2 已安装" -ForegroundColor Green
    }
    
    # 检查并安装 n8n
    $n8nScript = "cd /home/shash/work/Footnote; which n8n"
    $n8nCheck = wsl bash -c $n8nScript 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  安装 n8n..." -ForegroundColor Cyan
        $installN8n = "cd /home/shash/work/Footnote; npm install -g n8n"
        wsl bash -c $installN8n 2>&1 | Out-Null
    } else {
        Write-Host "  ✓ n8n 已安装" -ForegroundColor Green
    }
    
    # 验证安装
    $pm2VersionScript = "cd /home/shash/work/Footnote; pm2 --version"
    $pm2Version = wsl bash -c $pm2VersionScript 2>&1
    if ($pm2Version) {
        Write-Host "  ✓ PM2 版本: $pm2Version" -ForegroundColor Green
    }
    
    $n8nVersionScript = "cd /home/shash/work/Footnote; n8n --version"
    $n8nVersion = wsl bash -c $n8nVersionScript 2>&1
    if ($n8nVersion) {
        Write-Host "  ✓ n8n 版本: $n8nVersion" -ForegroundColor Green
    }
    
    Write-Host "  ✓ WSL 依赖检查完成" -ForegroundColor Green
    Write-Host ""
}

# 创建日志目录
function Create-LogDirectories {
    Write-Host "[4/6] 创建日志目录..." -ForegroundColor Yellow
    
    $logDirs = @(
        "logs",
        "tools\n8n\logs"
    )
    
    foreach ($dir in $logDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  ✓ 创建目录: $dir" -ForegroundColor Green
        } else {
            Write-Host "  ✓ 目录已存在: $dir" -ForegroundColor Green
        }
    }
    
    Write-Host ""
}

# 配置 PM2
function Configure-PM2 {
    Write-Host "[5/6] 配置 PM2..." -ForegroundColor Yellow
    
    # Windows 主实例
    Write-Host "  配置 Windows 主实例..." -ForegroundColor Cyan
    # 注意：n8n v2 不支持 --port 参数，端口/host 需用环境变量配置
    $env:N8N_PORT = "5678"
    $env:N8N_HOST = "0.0.0.0"
    $env:N8N_PROTOCOL = "http"
    pm2 delete n8n-primary 2>&1 | Out-Null
    pm2 start n8n --name n8n-primary -- start
    Write-Host "  ✓ Windows 主实例已启动（PM2: n8n-primary）" -ForegroundColor Green
    
    # WSL 从实例
    Write-Host "  配置 WSL 从实例..." -ForegroundColor Cyan
    $wslDelete = "cd /home/shash/work/Footnote; pm2 delete n8n-secondary 2>&1"
    wsl bash -c $wslDelete | Out-Null
    $wslStart = "cd /home/shash/work/Footnote; pm2 start tools/n8n/start-n8n-secondary.sh --name n8n-secondary"
    wsl bash -c $wslStart
    Write-Host "  ✓ WSL 从实例已启动" -ForegroundColor Green
    
    # 保存配置
    pm2 save
    $wslSave = "cd /home/shash/work/Footnote; pm2 save"
    wsl bash -c $wslSave
    
    Write-Host ""
}

# 验证部署
function Verify-Deployment {
    Write-Host "[6/6] 验证部署..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 3
    
    # 检查 Windows 主实例
    $primaryStatus = pm2 status n8n-primary 2>&1
    if ($primaryStatus -match "online") {
        Write-Host "  ✓ Windows 主实例运行中 (端口 5678)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Windows 主实例未运行" -ForegroundColor Red
    }
    
    # 检查 WSL 从实例
    $secondaryStatusScript = "cd /home/shash/work/Footnote; pm2 status n8n-secondary"
    $secondaryStatus = wsl bash -c $secondaryStatusScript 2>&1
    if ($secondaryStatus -match "online") {
        Write-Host "  ✓ WSL 从实例运行中 (端口 5680)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ WSL 从实例未运行" -ForegroundColor Red
    }
    
    # 检查端口
    $port5678 = netstat -ano | findstr :5678
    $port5680 = netstat -ano | findstr :5680
    
    if ($port5678) {
        Write-Host "  ✓ 端口 5678 已监听" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 端口 5678 未监听" -ForegroundColor Red
    }
    
    if ($port5680) {
        Write-Host "  ✓ 端口 5680 已监听" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 端口 5680 未监听" -ForegroundColor Red
    }
    
    Write-Host ""
}

# 主流程
try {
    Check-Prerequisites
    Install-WindowsDependencies
    Install-WSLDependencies
    Create-LogDirectories
    Configure-PM2
    Verify-Deployment
    
    Write-Host "=== 部署完成 ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "访问地址:" -ForegroundColor Cyan
    Write-Host "  主实例: http://localhost:5678" -ForegroundColor White
    Write-Host "  从实例: http://localhost:5680" -ForegroundColor White
    Write-Host ""
    Write-Host "管理命令:" -ForegroundColor Cyan
    Write-Host "  查看状态: .\tools\n8n\manage-cluster.ps1 -Action status" -ForegroundColor White
    Write-Host "  查看日志: .\tools\n8n\manage-cluster.ps1 -Action logs" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "`n部署失败: $_" -ForegroundColor Red
    Write-Host "错误详情: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}


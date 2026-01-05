# 确保 WSL 从实例（n8n-secondary）处于可用状态（不仅“进程在线”，还要“HTTP 可访问”）。
#
# 适用场景：
# - Windows 计划任务（开机/定时）兜底自愈
# - 手动运维快速恢复
#
# 为什么需要：
# - pm2 的进程状态可能是 stopped/errored，但端口未监听 → Windows 访问 http://localhost:5680 失败
# - WSL/网络转发正常与否不等同于 n8n 服务可用；必须做 HTTP 探活
#
# 依赖：
# - Windows 可执行 wsl
# - WSL 中已安装 pm2 与 n8n
# - 仓库路径在 WSL 内存在（默认 /home/shash/work/Footnote）

param(
    [int]$Port = 5680,
    [string]$ProjectRoot = "/home/shash/work/Footnote",
    [string]$ProcessName = "n8n-secondary",
    [string]$StartCommand = "pm2 start workflows/project/n8n/start-n8n-secondary.sh --name n8n-secondary",
    [string]$Distro = "",
    [string]$WslUser = ""
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[ensure-wsl-secondary] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[ensure-wsl-secondary] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[ensure-wsl-secondary] $msg" -ForegroundColor Yellow }
function Write-Err([string]$msg) { Write-Host "[ensure-wsl-secondary] $msg" -ForegroundColor Red }

function Get-WslArgs {
    $parts = @()
    if ($Distro) { $parts += @("-d", $Distro) }
    if ($WslUser) { $parts += @("-u", $WslUser) }
    return ,$parts
}

function Invoke-WslBash([string]$bashCommand) {
    $wslArgs = Get-WslArgs
    $wslArgs += @("bash", "-lc", $bashCommand)
    $out = & wsl @wslArgs 2>&1
    return @{
        ExitCode = $LASTEXITCODE
        Output = $out
    }
}

function Get-Pm2ProcessStatus {
    $res = Invoke-WslBash "cd $ProjectRoot && pm2 jlist"
    if ($res.ExitCode -ne 0) {
        return @{
            Ok = $false
            Reason = "pm2_jlist_failed"
            Detail = $res.Output
        }
    }

    # pm2 jlist should be pure JSON, but in some shells output can be polluted.
    # Try best-effort extraction of the JSON array.
    $raw = [string]$res.Output
    $jsonText = $raw
    $firstBracket = $raw.IndexOf("[")
    $lastBracket = $raw.LastIndexOf("]")
    if ($firstBracket -ge 0 -and $lastBracket -gt $firstBracket) {
        $jsonText = $raw.Substring($firstBracket, $lastBracket - $firstBracket + 1)
    }
    try {
        $apps = $jsonText | ConvertFrom-Json
    } catch {
        return @{
            Ok = $false
            Reason = "pm2_jlist_invalid_json"
            Detail = $raw
        }
    }

    $app = $apps | Where-Object { $_.name -eq $ProcessName } | Select-Object -First 1
    if (-not $app) {
        return @{
            Ok = $true
            Found = $false
            Status = "missing"
        }
    }

    $status = $app.pm2_env.status
    return @{
        Ok = $true
        Found = $true
        Status = $status
        Pid = $app.pid
        Restarts = $app.pm2_env.restart_time
    }
}

function Get-Pm2ProcessStatusFallback {
    $res = Invoke-WslBash "cd $ProjectRoot && pm2 status $ProcessName --no-color"
    if ($res.ExitCode -ne 0) {
        return @{
            Ok = $false
            Reason = "pm2_status_failed"
            Detail = $res.Output
        }
    }
    $out = [string]$res.Output
    if ($out -match "\bonline\b") {
        return @{ Ok = $true; Found = $true; Status = "online" }
    }
    if ($out -match "\bstopped\b") {
        return @{ Ok = $true; Found = $true; Status = "stopped" }
    }
    return @{ Ok = $true; Found = $true; Status = "unknown" }
}

function Test-HttpOk([string]$url, [int]$timeoutSeconds = 3) {
    try {
        $res = Invoke-WebRequest -Method Head -Uri $url -TimeoutSec $timeoutSeconds -Proxy $null -UseBasicParsing
        return ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400)
    } catch {
        return $false
    }
}

Write-Info "Checking WSL PM2 process status via pm2 jlist..."
$pm2 = Get-Pm2ProcessStatus
if (-not $pm2.Ok) {
    Write-Warn "pm2 jlist failed ($($pm2.Reason)), falling back to pm2 status..."
    $pm2 = Get-Pm2ProcessStatusFallback
    if (-not $pm2.Ok) {
        Write-Warn "pm2 status also failed ($($pm2.Reason)), trying to (re)start: $ProcessName"
        $startRes = Invoke-WslBash "cd $ProjectRoot && $StartCommand"
        if ($startRes.ExitCode -ne 0) {
            if ($startRes.Output -match "Script already launched") {
                Write-Warn "Already launched; restarting instead..."
                $null = Invoke-WslBash "cd $ProjectRoot && pm2 restart $ProcessName --update-env"
            } else {
                Write-Err "Start command failed: $($startRes.Output)"
                exit 2
            }
        }
    }
} elseif ($pm2.Found -and $pm2.Status -eq "online") {
    Write-Ok "$ProcessName is online (pid=$($pm2.Pid), restarts=$($pm2.Restarts))"
} elseif (-not $pm2.Found) {
    Write-Warn "$ProcessName not found in PM2, starting..."
    $startRes = Invoke-WslBash "cd $ProjectRoot && $StartCommand"
    if ($startRes.ExitCode -ne 0) {
        if ($startRes.Output -match "Script already launched") {
            Write-Warn "Already launched; restarting instead..."
            $null = Invoke-WslBash "cd $ProjectRoot && pm2 restart $ProcessName --update-env"
        } else {
            Write-Err "Start command failed: $($startRes.Output)"
            exit 2
        }
    }
} else {
    Write-Warn "$ProcessName status=$($pm2.Status), restarting..."
    $restartRes = Invoke-WslBash "cd $ProjectRoot && pm2 restart $ProcessName --update-env"
    if ($restartRes.ExitCode -ne 0) {
        Write-Warn "pm2 restart failed, trying start..."
        $startRes = Invoke-WslBash "cd $ProjectRoot && $StartCommand"
        if ($startRes.ExitCode -ne 0) {
            if ($startRes.Output -match "Script already launched") {
                Write-Warn "Already launched; restarting instead..."
                $null = Invoke-WslBash "cd $ProjectRoot && pm2 restart $ProcessName --update-env"
            } else {
                Write-Err "Start command failed: $($startRes.Output)"
                exit 2
            }
        }
    }
}

Write-Info "Checking port $Port..."
$portLine = netstat -ano | findstr ":$Port" 2>$null
if ($portLine) {
    Write-Ok "Port $Port is listening"
} else {
    Write-Warn "Port $Port not listening, starting process..."
    $startRes = Invoke-WslBash "cd $ProjectRoot && $StartCommand"
    if ($startRes.ExitCode -ne 0) {
        if ($startRes.Output -match "Script already launched") {
            Write-Warn "Already launched; restarting instead..."
            $null = Invoke-WslBash "cd $ProjectRoot && pm2 restart $ProcessName --update-env"
        } else {
            Write-Err "Start command failed: $($startRes.Output)"
            exit 3
        }
    }
}

Write-Info "HTTP healthcheck..."
$baseUrl = "http://localhost:$Port"
if (Test-HttpOk -url "$baseUrl/" -timeoutSeconds 3) {
    Write-Ok "HTTP OK: $baseUrl"
    Write-Info "Done."
    exit 0
}

Write-Warn "HTTP not reachable: $baseUrl . Attempting one self-heal restart..."
$restartRes = Invoke-WslBash "cd $ProjectRoot && pm2 restart $ProcessName --update-env"
Start-Sleep -Seconds 2
if (Test-HttpOk -url "$baseUrl/" -timeoutSeconds 3) {
    Write-Ok "Recovered: HTTP OK after restart: $baseUrl"
    Write-Info "Done."
    exit 0
}

Write-Err ("Still not reachable after restart. Check WSL logs: wsl bash -lc `"cd {0} && pm2 logs {1} --lines 200`"" -f $ProjectRoot, $ProcessName)
exit 4



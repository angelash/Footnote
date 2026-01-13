$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[diagnose-primary] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[diagnose-primary] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[diagnose-primary] $msg" -ForegroundColor Yellow }

function Get-RepoRoot {
    # Script location: <repo>\tools\n8n\diagnose-primary.ps1
    # repo root is two levels up from $PSScriptRoot
    return (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
}

function Get-ListeningPidsByPort([int]$port) {
    $lines = netstat -ano | Select-String -Pattern "LISTENING" | Select-String -Pattern ":$port\s"
    $pids = @()
    foreach ($m in $lines) {
        $parts = ($m.Line -split "\s+")
        if ($parts.Length -ge 5) {
            # NOTE: PowerShell 内置只读变量为 $PID（大小写不敏感），不要用 $pid 作为局部变量名。
            $processId = 0
            if ([int]::TryParse($parts[-1], [ref]$processId)) {
                $pids += $processId
            }
        }
    }
    $pids | Sort-Object -Unique
}

function Get-ProcessOwner([int]$ProcessId) {
    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId"
        if (-not $proc) { return $null }
        $owner = Invoke-CimMethod -InputObject $proc -MethodName GetOwner
        if ($owner.ReturnValue -ne 0) { return $null }
        return "$($owner.Domain)\$($owner.User)"
    } catch {
        return $null
    }
}

function Try-GetPm2AppEnv([string]$AppName) {
    try {
        $json = pm2 jlist 2>$null
        if (-not $json) { return $null }
        $apps = $json | ConvertFrom-Json
        foreach ($app in $apps) {
            if ($app.name -eq $AppName) {
                # Prefer env from pm2_env
                return $app.pm2_env.env
            }
        }
        return $null
    } catch {
        return $null
    }
}

function Find-N8nSqliteCandidates {
    param(
        [string]$ExtraUserFolder = ""
    )

    $candidates = @()
    $repoRoot = Get-RepoRoot

    $commonPaths = @(
        (Join-Path $env:USERPROFILE ".n8n\database.sqlite"),
        (Join-Path $repoRoot "local\n8n-primary\database.sqlite"),
        "C:\Users\Administrator\.n8n\database.sqlite",
        "C:\Windows\System32\config\systemprofile\.n8n\database.sqlite"
    )

    if ($ExtraUserFolder) {
        try {
            $p = Join-Path $ExtraUserFolder "database.sqlite"
            $commonPaths += $p
        } catch {
            # ignore
        }
    }

    foreach ($p in $commonPaths) {
        if (Test-Path $p) {
            $fi = Get-Item $p
            $candidates += [pscustomobject]@{
                Path = $fi.FullName
                LastWriteTime = $fi.LastWriteTime
                SizeMB = [math]::Round($fi.Length / 1MB, 2)
                Source = "common"
            }
        }
    }

    # Scan all user profiles for .n8n\database.sqlite (fast enough on most dev machines)
    try {
        $userDirs = Get-ChildItem "C:\Users" -Directory -ErrorAction SilentlyContinue
        foreach ($ud in $userDirs) {
            $p = Join-Path $ud.FullName ".n8n\database.sqlite"
            if (Test-Path $p) {
                $fi = Get-Item $p
                $candidates += [pscustomobject]@{
                    Path = $fi.FullName
                    LastWriteTime = $fi.LastWriteTime
                    SizeMB = [math]::Round($fi.Length / 1MB, 2)
                    Source = "C:\\Users scan"
                }
            }
        }
    } catch {
        # ignore
    }

    $candidates | Sort-Object LastWriteTime -Descending
}

Write-Info "Diagnosing Windows n8n-primary (expected port: 5678)..."

$repoRoot = Get-RepoRoot
Write-Info "Repo root: $repoRoot"

$pm2Env = Try-GetPm2AppEnv -AppName "n8n-primary"
if ($pm2Env) {
    $userFolder = $pm2Env.N8N_USER_FOLDER
    $port = $pm2Env.N8N_PORT
    if ($userFolder) {
        Write-Ok "PM2 env N8N_USER_FOLDER: $userFolder"
    } else {
        Write-Warn "PM2 env N8N_USER_FOLDER: (not set)"
    }
    if ($port) {
        Write-Info "PM2 env N8N_PORT: $port"
    }
} else {
    Write-Warn "PM2 env for n8n-primary not found (pm2 not installed / not in PATH / app name mismatch)."
    $userFolder = ""
}

$pids = Get-ListeningPidsByPort -port 5678
if (-not $pids -or $pids.Count -eq 0) {
    Write-Warn "Port 5678 is not LISTENING. n8n-primary may not be running."
} else {
    Write-Ok "Port 5678 LISTENING PIDs: $($pids -join ', ')"
    foreach ($listenPid in $pids) {
        $owner = Get-ProcessOwner -ProcessId $listenPid
        if ($owner) {
            Write-Ok "PID $listenPid owner: $owner"
        } else {
            Write-Warn "PID $listenPid owner: (unknown - insufficient permission?)"
        }
        try {
            $p = Get-Process -Id $listenPid -ErrorAction Stop
            Write-Info "PID $listenPid process: $($p.ProcessName)"
        } catch {
            Write-Warn "PID $listenPid process: (not found)"
        }
    }
}

Write-Info "Searching for .n8n\\database.sqlite candidates..."
$dbs = Find-N8nSqliteCandidates -ExtraUserFolder $userFolder
if (-not $dbs -or $dbs.Count -eq 0) {
    Write-Warn "No database.sqlite found in common locations. You may be using a custom N8N_USER_FOLDER."
    Write-Info "Try checking PM2 env: pm2 show n8n-primary (look for N8N_USER_FOLDER)."
} else {
    Write-Ok "Found candidates (newest first):"
    $dbs | Format-Table -AutoSize
    Write-Info "Tip: the correct one is usually the oldest/large one that matches when you last used n8n."
    Write-Info "If you want to migrate to the repo-stable folder, copy the whole .n8n folder into: $repoRoot\\local\\n8n-primary"
}

Write-Info "Done."



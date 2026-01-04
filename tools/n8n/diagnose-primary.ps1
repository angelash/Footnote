$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[diagnose-primary] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[diagnose-primary] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[diagnose-primary] $msg" -ForegroundColor Yellow }

function Get-ListeningPidsByPort([int]$port) {
    $lines = netstat -ano | Select-String -Pattern "LISTENING" | Select-String -Pattern ":$port\s"
    $pids = @()
    foreach ($m in $lines) {
        $parts = ($m.Line -split "\s+")
        if ($parts.Length -ge 5) {
            $pid = 0
            if ([int]::TryParse($parts[-1], [ref]$pid)) {
                $pids += $pid
            }
        }
    }
    $pids | Sort-Object -Unique
}

function Get-ProcessOwner([int]$pid) {
    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$pid"
        if (-not $proc) { return $null }
        $owner = Invoke-CimMethod -InputObject $proc -MethodName GetOwner
        if ($owner.ReturnValue -ne 0) { return $null }
        return "$($owner.Domain)\$($owner.User)"
    } catch {
        return $null
    }
}

function Find-N8nSqliteCandidates {
    $candidates = @()

    $commonPaths = @(
        (Join-Path $env:USERPROFILE ".n8n\database.sqlite"),
        "C:\Users\Administrator\.n8n\database.sqlite",
        "C:\Windows\System32\config\systemprofile\.n8n\database.sqlite"
    )

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

$pids = Get-ListeningPidsByPort -port 5678
if (-not $pids -or $pids.Count -eq 0) {
    Write-Warn "Port 5678 is not LISTENING. n8n-primary may not be running."
} else {
    Write-Ok "Port 5678 LISTENING PIDs: $($pids -join ', ')"
    foreach ($pid in $pids) {
        $owner = Get-ProcessOwner -pid $pid
        if ($owner) {
            Write-Ok "PID $pid owner: $owner"
        } else {
            Write-Warn "PID $pid owner: (unknown - insufficient permission?)"
        }
        try {
            $p = Get-Process -Id $pid -ErrorAction Stop
            Write-Info "PID $pid process: $($p.ProcessName)"
        } catch {
            Write-Warn "PID $pid process: (not found)"
        }
    }
}

Write-Info "Searching for .n8n\\database.sqlite candidates..."
$dbs = Find-N8nSqliteCandidates
if (-not $dbs -or $dbs.Count -eq 0) {
    Write-Warn "No database.sqlite found in common locations. You may be using a custom N8N_USER_FOLDER."
    Write-Info "Try checking PM2 env: pm2 show n8n-primary (look for N8N_USER_FOLDER)."
} else {
    Write-Ok "Found candidates (newest first):"
    $dbs | Format-Table -AutoSize
    Write-Info "Tip: the correct one is usually the oldest/large one that matches when you last used n8n."
}

Write-Info "Done."



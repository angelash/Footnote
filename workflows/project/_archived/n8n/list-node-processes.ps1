param(
  [string]$NameFilter = ""
)

$ErrorActionPreference = "Stop"

$procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'"

$rows = foreach ($p in $procs) {
  [PSCustomObject]@{
    ProcessId  = $p.ProcessId
    CommandLine = $p.CommandLine
  }
}

if ($NameFilter -and $NameFilter.Trim().Length -gt 0) {
  $rows = $rows | Where-Object { $_.CommandLine -match $NameFilter }
}

$rows | Sort-Object ProcessId | Format-Table -AutoSize



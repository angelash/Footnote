# Pipeline-Sys 测试数据准备脚本
# 将测试数据复制到 automation_runs 目录

$ErrorActionPreference = "Stop"

$projectRoot = "F:\workspace\github\Footnote"
$automationRunsDir = "$projectRoot\workflows\project\logs\automation_runs"
$fixturesDir = "$projectRoot\workflows\reusable\pipeline-sys\tests\fixtures"

Write-Host "Setting up Pipeline-Sys test data..." -ForegroundColor Cyan

# 创建 automation_runs 目录（如果不存在）
if (-not (Test-Path $automationRunsDir)) {
    New-Item -ItemType Directory -Path $automationRunsDir -Force | Out-Null
    Write-Host "Created directory: $automationRunsDir" -ForegroundColor Green
}

# 复制 sample-run
$sampleRunDest = "$automationRunsDir\RUN-20260105-120000-test"
if (Test-Path $sampleRunDest) {
    Remove-Item -Path $sampleRunDest -Recurse -Force
}
Copy-Item -Path "$fixturesDir\sample-run" -Destination $sampleRunDest -Recurse
Write-Host "Copied sample-run to: $sampleRunDest" -ForegroundColor Green

# 复制 completed-run
$completedRunDest = "$automationRunsDir\RUN-20260105-100000-done"
if (Test-Path $completedRunDest) {
    Remove-Item -Path $completedRunDest -Recurse -Force
}
Copy-Item -Path "$fixturesDir\completed-run" -Destination $completedRunDest -Recurse
Write-Host "Copied completed-run to: $completedRunDest" -ForegroundColor Green

Write-Host ""
Write-Host "Test data setup complete!" -ForegroundColor Cyan
Write-Host "Available runs:"
Get-ChildItem $automationRunsDir -Directory | ForEach-Object { Write-Host "  - $($_.Name)" }


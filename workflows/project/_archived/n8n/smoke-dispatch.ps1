param(
    # NOTE: 用 127.0.0.1 避免部分环境 localhost/IPv6/代理解析导致的连接失败
    [string]$PrimaryWebhookUrl = "http://127.0.0.1:5678/webhook/dispatch-task",
    [string]$TaskPackPath = "design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md",
    [string]$Role = "L3_writer",
    [string]$TaskType = "doc",
    [string]$Complexity = "normal",
    [string]$ModelOverride = "auto"
)

$ErrorActionPreference = "Stop"

$body = @{
    task_pack_path = $TaskPackPath
    role = $Role
    task_type = $TaskType
    complexity = $Complexity
    model_override = $ModelOverride
} | ConvertTo-Json

Write-Host "[smoke-dispatch] POST $PrimaryWebhookUrl" -ForegroundColor Cyan
Write-Host "[smoke-dispatch] payload: $body" -ForegroundColor DarkGray

$res = Invoke-RestMethod `
    -Method Post `
    -Uri $PrimaryWebhookUrl `
    -Body $body `
    -ContentType "application/json" `
    -TimeoutSec 30 `
    -Proxy $null
Write-Host "[smoke-dispatch] response:" -ForegroundColor Green
$res | ConvertTo-Json -Depth 20



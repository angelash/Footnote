$ErrorActionPreference = "Stop"

param(
    [string]$PrimaryWebhookUrl = "http://localhost:5678/webhook/dispatch-task",
    [string]$TaskPackPath = "docs/03_taskpacks/T-0001_c0_z1_dialogue.md",
    [string]$Role = "L3_writer",
    [string]$TaskType = "doc",
    [string]$Complexity = "normal",
    [string]$ModelOverride = "auto"
)

$body = @{
    task_pack_path = $TaskPackPath
    role = $Role
    task_type = $TaskType
    complexity = $Complexity
    model_override = $ModelOverride
} | ConvertTo-Json

Write-Host "[smoke-dispatch] POST $PrimaryWebhookUrl" -ForegroundColor Cyan
Write-Host "[smoke-dispatch] payload: $body" -ForegroundColor DarkGray

$res = Invoke-RestMethod -Method Post -Uri $PrimaryWebhookUrl -Body $body -ContentType "application/json"
Write-Host "[smoke-dispatch] response:" -ForegroundColor Green
$res | ConvertTo-Json -Depth 20



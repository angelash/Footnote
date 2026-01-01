param(
    # MCP endpoint, e.g. http://localhost:3000/mcp
    [Parameter(Mandatory = $true)]
    [string]$McpUrl,

    # Prompt in UTF-8 base64 (recommended to avoid quoting issues)
    [string]$PromptB64 = "",

    # Fallback prompt (only used if PromptB64 is empty)
    [string]$Prompt = "",

    [string]$TaskType = "browser-test",
    [string]$Complexity = "normal",
    [string]$Model = ""
)

$ErrorActionPreference = "Stop"

function Decode-Base64Utf8([string]$b64) {
    if ([string]::IsNullOrWhiteSpace($b64)) { return "" }
    $bytes = [Convert]::FromBase64String($b64)
    return [Text.Encoding]::UTF8.GetString($bytes)
}

$finalPrompt = ""
if (-not [string]::IsNullOrWhiteSpace($PromptB64)) {
    $finalPrompt = Decode-Base64Utf8 $PromptB64
} else {
    $finalPrompt = $Prompt
}

if ([string]::IsNullOrWhiteSpace($finalPrompt)) {
    throw "Prompt is required. Provide -PromptB64 or -Prompt."
}

$args = @(
    "tools/mcp-runner/mcp-runner.mjs",
    "agent",
    "--mcp-url", $McpUrl,
    "--prompt", $finalPrompt,
    "--task-type", $TaskType,
    "--complexity", $Complexity
)

if (-not [string]::IsNullOrWhiteSpace($Model) -and $Model -ne "auto" -and $Model -ne "none") {
    $args += @("--model", $Model)
}

& node @args
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}



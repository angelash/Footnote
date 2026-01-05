# n8n 主从集群架构配置

## 架构设计

```
Windows 环境（主）
├── PM2 (进程管理器)
│   ├── n8n-primary (主实例，端口 5678)
│   │   ├── 工作流管理
│   │   ├── 任务调度
│   │   └── 主要执行环境
│   └── n8n-wsl-bridge (WSL 桥接服务)
│
└── 项目: F:\workspace\github\Footnote

WSL 环境（从）
├── PM2 (进程管理器)
│   └── n8n-secondary (从实例，端口 5680)
│       ├── 辅助执行
│       ├── WSL 专用任务
│       └── cursor-agent 集成
│
└── 项目: /home/shash/work/Footnote
```

---

## 核心特性

### 1. 主从分工

**主实例 (Windows, 5678)**：
- ✅ 主要工作流管理
- ✅ 任务调度和分发
- ✅ 用户界面访问
- ✅ 工作流同步到从实例

**从实例 (WSL, 5680)**：
- ✅ 执行需要 WSL 环境的任务
- ✅ cursor-agent 集成
- ✅ Git 操作（SSH）
- ✅ Linux 工具链任务

### 2. 数据同步

**方案 A: 共享数据库（推荐）**

两个实例使用同一个数据库：

```bash
# 使用 PostgreSQL 或 MySQL
N8N_DB_TYPE=postgresdb
N8N_DB_POSTGRESDB_HOST=localhost
N8N_DB_POSTGRESDB_DATABASE=n8n
N8N_DB_POSTGRESDB_USER=n8n
N8N_DB_POSTGRESDB_PASSWORD=your_password
```

**方案 B: 文件系统同步**

通过 Git 或文件同步工具同步工作流文件。

---

## 安装配置

### 1. Windows 主实例配置

#### 创建环境变量文件

```powershell
# .env.n8n.primary
N8N_PORT=5678
N8N_HOST=0.0.0.0
N8N_PROTOCOL=http
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin@footnote.local
N8N_BASIC_AUTH_PASSWORD=Footnote2025!
N8N_METRICS=true
NODE_ENV=production
```

#### PM2 配置

```json
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'n8n-primary',
      script: 'n8n',
      args: 'start',
      cwd: 'F:\\workspace\\github\\Footnote',
      env: {
        N8N_PORT: 5678,
        N8N_HOST: '0.0.0.0',
        N8N_BASIC_AUTH_ACTIVE: 'true',
        N8N_BASIC_AUTH_USER: 'admin@footnote.local',
        N8N_BASIC_AUTH_PASSWORD: 'Footnote2025!',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/n8n-primary-error.log',
      out_file: './logs/n8n-primary-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}
```

#### 启动命令

```bash
# 安装 PM2
npm install -g pm2

# 启动主实例
pm2 start ecosystem.config.cjs --only n8n-primary

# 保存配置
pm2 save

# 配置开机自启
pm2 startup
```

> 📖 **详细配置指南**：请参考 [PM2 开机自启动配置指南](./PM2-AUTO-START-GUIDE.md)，包含完整的配置步骤和常见问题解决方案。

---

### 2. WSL 从实例配置

#### 在 WSL 中安装 n8n 和 PM2

```bash
# 在 WSL 中
npm install -g n8n pm2
```

#### 创建环境变量文件

```bash
# .env.n8n.secondary
N8N_PORT=5680
N8N_HOST=0.0.0.0
N8N_PROTOCOL=http
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin@footnote.local
N8N_BASIC_AUTH_PASSWORD=Footnote2025!
N8N_METRICS=true
NODE_ENV=production
```

#### PM2 配置

```json
// ecosystem.config.wsl.cjs (WSL)
module.exports = {
  apps: [
    {
      name: 'n8n-secondary',
      script: 'n8n',
      args: 'start',
      cwd: '/home/shash/work/Footnote',
      env: {
        N8N_PORT: 5680,
        N8N_HOST: '0.0.0.0',
        N8N_BASIC_AUTH_ACTIVE: 'true',
        N8N_BASIC_AUTH_USER: 'admin@footnote.local',
        N8N_BASIC_AUTH_PASSWORD: 'Footnote2025!',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/n8n-secondary-error.log',
      out_file: './logs/n8n-secondary-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}
```

#### 启动命令

```bash
# 在 WSL 中
cd /home/shash/work/Footnote
pm2 start ecosystem.config.wsl.cjs --only n8n-secondary
pm2 save
pm2 startup
```

> ⚠️ **重要**：执行 `pm2 startup` 时，如果遇到 PATH 环境变量问题（如 `env: 'Files/NVIDIA': No such file or directory`），请参考 [PM2 开机自启动配置指南](./PM2-AUTO-START-GUIDE.md) 中的解决方案。

---

### 3. Windows PM2 管理 WSL 服务

#### 创建 WSL 桥接脚本

```powershell
# workflows/project/n8n/wsl-pm2-bridge.ps1
# 通过 WSL 管理 WSL 中的 PM2

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs')]
    [string]$Action,
    
    [string]$Service = 'n8n-secondary'
)

$wslCommand = switch ($Action) {
    'start'   { "pm2 start $Service" }
    'stop'    { "pm2 stop $Service" }
    'restart' { "pm2 restart $Service" }
    'status'  { "pm2 status" }
    'logs'    { "pm2 logs $Service" }
}

wsl bash -c "cd /home/shash/work/Footnote && $wslCommand"
```

#### 使用方式

```powershell
# 启动 WSL 中的 n8n
.\tools\n8n\wsl-pm2-bridge.ps1 -Action start

# 查看状态
.\tools\n8n\wsl-pm2-bridge.ps1 -Action status

# 查看日志
.\tools\n8n\wsl-pm2-bridge.ps1 -Action logs
```

---

## 工作流同步

### 方案 1: 手动同步（简单）

1. 在主实例中创建/编辑工作流
2. 导出工作流 JSON
3. 在从实例中导入

### 方案 2: 自动同步脚本

```powershell
# workflows/project/n8n/sync-workflows.ps1
# 从主实例同步工作流到从实例

$primaryUrl = "http://localhost:5678/api/v1"
$secondaryUrl = "http://localhost:5680/api/v1"

# ⚠️ Public API 需要 API Key（不是 Basic Auth）
# 在两个实例：Settings → n8n API 创建 API Key
# 然后用环境变量注入（不要提交到仓库）
$primaryApiKey = $env:N8N_PRIMARY_API_KEY
$secondaryApiKey = $env:N8N_SECONDARY_API_KEY

if (-not $primaryApiKey -or -not $secondaryApiKey) {
    throw "Missing API keys. Set N8N_PRIMARY_API_KEY and N8N_SECONDARY_API_KEY."
}

$headersPrimary = @{ 'X-N8N-API-KEY' = $primaryApiKey }
$headersSecondary = @{ 'X-N8N-API-KEY' = $secondaryApiKey }

# 获取主实例的所有工作流
$workflows = Invoke-RestMethod -Uri "$primaryUrl/workflows" -Headers $headersPrimary

foreach ($workflow in $workflows.data) {
    # 导出工作流
    $workflowJson = Invoke-RestMethod -Uri "$primaryUrl/workflows/$($workflow.id)" -Headers $headersPrimary
    
    # ⚠️ 注意：Public API 对 Create/Update 的 schema 很严格
    # 导出的 workflow 对象包含大量额外字段，需要 sanitize（只保留 name/nodes/connections/settings/active 等）
    $payload = @{
        name        = $workflowJson.name
        nodes       = $workflowJson.nodes
        connections = $workflowJson.connections
        settings    = $workflowJson.settings
        active      = $workflowJson.active
    } | ConvertTo-Json -Depth 100

    # 导入到从实例（示例：创建；如需“更新同名”，建议先查重再 PUT）
    Invoke-RestMethod -Uri "$secondaryUrl/workflows" `
        -Method Post `
        -Headers $headersSecondary `
        -Body $payload `
        -ContentType "application/json"
}
```

### 方案 3: Git 同步（推荐）

1. 工作流文件存储在 Git 仓库
2. 两个实例都从 Git 拉取
3. 主实例修改后推送到 Git
4. 从实例定期拉取更新

---

## 任务分配策略

### 主实例工作流

**适用于 Windows 环境的任务**：
- 文件操作（Windows 路径）
- Windows 工具调用
- 主要业务逻辑

### 从实例工作流

**适用于 WSL 环境的任务**：
- cursor-agent 执行
- Git 操作（SSH）
- Linux 工具链
- 需要 WSL 环境的任务

### 跨实例调用

**主实例调用从实例**：

```javascript
// 在主实例工作流中使用 HTTP Request 节点
// 调用从实例的 Webhook
POST http://localhost:5680/webhook/execute-task
{
  "task_pack_path": "design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md",
  "role": "L3_writer"
}
```

---

## 监控和管理

### PM2 监控

```bash
# Windows
pm2 monit

# WSL
wsl bash -c "cd /home/shash/work/Footnote && pm2 monit"
```

### 统一管理脚本

```powershell
# workflows/project/n8n/manage-cluster.ps1
function Show-Status {
    Write-Host "=== n8n 集群状态 ===" -ForegroundColor Cyan
    
    Write-Host "`nWindows 主实例:" -ForegroundColor Yellow
    pm2 status n8n-primary
    
    Write-Host "`nWSL 从实例:" -ForegroundColor Yellow
    wsl bash -c "cd /home/shash/work/Footnote && pm2 status n8n-secondary"
}

function Restart-All {
    Write-Host "重启所有实例..." -ForegroundColor Cyan
    pm2 restart n8n-primary
    wsl bash -c "cd /home/shash/work/Footnote && pm2 restart n8n-secondary"
}

# 使用
Show-Status
# Restart-All
```

---

## 访问地址

- **主实例**: http://localhost:5678
- **从实例**: http://localhost:5680

---

## 注意事项

1. **端口冲突**: 确保两个实例使用不同端口
2. **数据一致性**: 使用共享数据库或定期同步
3. **认证统一**: 两个实例使用相同的认证配置
4. **日志管理**: 分别管理两个实例的日志
5. **资源监控**: 监控两个实例的资源使用情况

---

*最后更新: 2025-12-31*


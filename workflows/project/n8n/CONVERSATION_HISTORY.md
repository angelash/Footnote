# Cursor Agent 对话记录功能

## 功能说明

现在 `run-cursor-task.sh` 脚本支持同时保存：
1. **项目日志**：保存在 `workflows/project/logs/automation_runs/<run_id>/` 目录
2. **Cursor Agent 对话记录**：通过 `--resume <chatId>` 参数保存到 cursor-agent 的对话历史中

## 工作原理

1. **自动创建对话**：如果未提供 chatId，脚本会自动调用 `cursor-agent create-chat` 创建新对话
2. **保存 chatId**：chatId 会被保存到 `_chat_id.txt` 文件中（位于日志目录）
3. **恢复对话**：使用 `--resume <chatId>` 参数，cursor-agent 会保存对话历史
4. **后续查看**：可以通过 `cursor-agent resume <chatId>` 或 `cursor-agent resume` 查看对话

## 使用方法

### 自动模式（推荐）

在 `fixed-flow` 流程中，系统会自动：
- 为每个 `run_id` 创建独立的对话
- 将 chatId 保存到 `workflows/project/logs/automation_runs/<run_id>/_chat_id.txt`
- 在 `04_execute.json` 中记录 chatId

### 手动调用

```bash
# 创建新对话并执行
workflows/project/n8n/run-cursor-task.sh \
  --task-pack <task_pack_path> \
  --prompt-file <prompt_file> \
  --task-type code \
  --complexity normal \
  --chat-id-file /path/to/chat_id.txt

# 恢复已有对话
workflows/project/n8n/run-cursor-task.sh \
  --task-pack <task_pack_path> \
  --prompt-file <prompt_file> \
  --task-type code \
  --complexity normal \
  --chat-id <existing_chat_id>
```

## 查看对话记录

### 方法 1：使用 cursor-agent 命令

```bash
# 查看最新对话
cursor-agent resume

# 恢复指定对话（从日志目录读取 chatId）
CHAT_ID=$(cat workflows/project/logs/automation_runs/<run_id>/_chat_id.txt)
cursor-agent resume "$CHAT_ID"
```

### 方法 2：查看项目日志

```bash
# 查看 chatId
cat workflows/project/logs/automation_runs/<run_id>/_chat_id.txt

# 查看执行记录（包含 chatId）
cat workflows/project/logs/automation_runs/<run_id>/04_execute.json | jq '.chat_id'
```

## 日志文件结构

```
workflows/project/logs/automation_runs/<run_id>/
├── _prompt.md          # 执行的提示内容
├── _chat_id.txt        # Cursor Agent 对话 ID（新增）
├── 04_execute.json     # 执行结果（包含 chat_id 字段）
├── status.json         # 执行状态
└── ...                 # 其他阶段的日志
```

## 注意事项

1. **对话历史位置**：cursor-agent 的对话历史保存在 cursor-agent 的本地数据库中，不在项目目录中
2. **chatId 格式**：chatId 是 UUID 格式（如 `9ce644bd-ed4c-4375-b13b-c6e822262a21`）
3. **非交互式模式**：即使使用 `--print` 模式，只要提供了 `--resume`，对话仍会被保存
4. **对话隔离**：每个 `run_id` 有独立的对话，不会互相干扰

## 故障排查

### 问题：chatId 文件不存在

**原因**：可能是 cursor-agent 创建对话失败
**解决**：检查 cursor-agent 是否正常安装和配置

```bash
# 检查 cursor-agent
~/.local/bin/cursor-agent --version

# 手动测试创建对话
~/.local/bin/cursor-agent create-chat
```

### 问题：无法恢复对话

**原因**：chatId 可能无效或对话已被删除
**解决**：查看 `04_execute.json` 中的 `chat_id` 字段，确认 chatId 是否正确

```bash
# 查看 chatId
cat workflows/project/logs/automation_runs/<run_id>/04_execute.json | jq '.chat_id'
```


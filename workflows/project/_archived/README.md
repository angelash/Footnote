# 归档文件说明

此目录包含已废弃的配置和文档。

## n8n/ (2026-01-13 归档)

n8n 工作流相关文件。已移除 n8n 依赖，所有工作流触发现在直接调用 WSL Runner (port 3210)。

**替代方案**：
- 统一入口：`http://localhost:3210`
- 文档参考：`workflows/reusable/pipeline-sys/WORKFLOW-OVERVIEW.md`

## pipelines/ (2026-01-13 归档)

n8n 相关的 pipeline 文档（n8n_cursor_cli_overview.md、n8n_cursor_cli_pipeline_spec.md 等）。

**替代方案**：
- 工作流总览：`workflows/reusable/pipeline-sys/WORKFLOW-OVERVIEW.md`
- 审查指南：`workflows/project/pipelines/pipelines/review_system_guide.md`

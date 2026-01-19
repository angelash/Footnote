# 角色定义已迁移

> **重要提示**：此目录中的 YAML 角色定义已废弃。

## 新位置

所有角色定义已迁移至 Cursor 原生格式：

```
.cursor/agents/*.md
```

## 迁移原因

1. **Cursor 原生支持**：`.cursor/agents/` 是 Cursor IDE 的原生子代理系统
2. **格式统一**：使用 Markdown 格式，与项目其他文档一致
3. **功能更丰富**：支持 model 配置、更详细的权限和产出模板

## 角色清单对照

| 层级 | YAML（废弃） | MD（当前） |
|------|-------------|-----------|
| L0 | 1 | 1 |
| L1 | 6 | 6 |
| L2 | 17 | 16 + 更多专业角色 |
| L3 | 6 | 6 |
| Util | 0 | 8（新增工具角色） |

## 新增 Util 工具角色

`.cursor/agents/` 新增了 8 个工具角色：
- `util-code-reviewer.md` - 代码审查
- `util-coordinator.md` - 任务协调
- `util-data-validator.md` - 数据验证
- `util-debugger.md` - 调试排错
- `util-planner.md` - 任务规划
- `util-researcher.md` - 调研分析
- `util-ui-reviewer.md` - UI 审查
- `util-verifier.md` - 验收验证

## 参考文档

- AI-Native 工作流规范：`.cursor/rules/09-ai-native-workflow.mdc`
- 团队架构分析：`design/ai-native/02_specs/team-architecture-analysis.md`

---

*此文件创建于 2026-01-19*
*原 YAML 文件保留供历史参考，但不再维护*

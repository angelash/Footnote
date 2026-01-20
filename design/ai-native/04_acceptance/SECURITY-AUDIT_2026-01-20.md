# SECURITY-AUDIT（安全审计）- 2026-01-20

审计角色：L2_qa_lead  
审计范围：依赖漏洞检测、存档数据安全、代码安全实践  
审计对象：`game/`（H5 游戏客户端）

---

## 执行摘要（评分）

**综合评分：B（80/100）**

- **依赖安全**：`npm audit` 结果为 **0 vulnerabilities**（通过）
- **存档安全**：本地存档/云存档具备基础版本字段与错误兜底，但 **缺少“可信完整性校验/加密/结构校验”**；云存档 checksum 为非加密哈希，**不能防篡改**
- **代码安全实践**：未发现 `eval/new Function` 等高危动态执行；发现少量 `innerHTML`（当前为固定/数值模板），建议替换为安全 DOM API；**未见 CSP 配置**

结论：当前更像“单机/本地可信”模型；若云存档要成为可信来源或后续接入账号体系/付费能力，需补齐存档完整性与 CSP 等基础安全基建。

---

## 1. 依赖漏洞报告（npm audit）

### 1.1 审计命令与结果

- 执行目录：`game/`
- 命令：`npm audit`
- 结果：**found 0 vulnerabilities**

### 1.2 依赖概览（直接依赖）

来自 `game/package.json`：
- 运行时依赖：`phaser`、`idb`、`yaml`
- 开发依赖：`vite`、`typescript`、`vitest`、`@playwright/test`、`eslint` 等

### 1.3 锁文件与供应链要点

- `game/package-lock.json` 为 **lockfileVersion 3**，包含 npm registry `resolved` 与 `integrity`（sha512）字段，有助于防止依赖被“静默替换”
- 仍建议：
  - 在 CI 中固定 Node/npm 版本，避免 lockfile 自动升级造成审计漂移
  - 定期（例如每 2~4 周）跑一次 `npm audit` + 依赖升级回归

---

## 2. 存档数据安全分析

### 2.1 本地存档（SaveManager）

文件：`game/src/systems/save/SaveManager.ts`

**现状与优点**
- 存储介质：优先 IndexedDB，失败回退 LocalStorage（可用性好）
- 存档包含版本字段 `version`，并提供迁移入口 `_migrateSaveData`（可演进）
- 读取 LocalStorage 使用 `try/catch`，解析失败会返回 `null`（稳健）

**主要风险**
- **缺少结构/边界校验**：读取后直接 `worldState.restore(...)` 与 `narrativeEngine.restore(...)`  
  - 风险：本地篡改/损坏/云端下发异常数据可能导致崩溃（可用性 DoS）、状态机进入非法状态
- **缺少完整性校验/签名**：本地数据可被用户任意修改  
  - 若存档只用于单机体验，此风险可接受；但若后续引入“成就/排行/跨端一致性”等，需要明确“是否信任客户端存档”
- **未加密**：存档明文存于浏览器（IndexedDB/LocalStorage）  
  - 对纯游戏状态通常可接受；若未来存入任何个人信息（账号标识、订单信息等），则不合规

### 2.2 云存档（CloudSaveManager）

文件：`game/src/systems/cloud/CloudSaveManager.ts`

**现状与优点**
- 具备：同步定时器、离线待上传队列、冲突策略（local/cloud/latest/manual）
- 上传/下载均携带 Bearer Token（有基本鉴权接口形态）

**主要风险（重点）**
- **Checksum 非加密**：`_calculateChecksum` 为简单字符串 hash（类似 32-bit rolling hash），不具备抗碰撞/抗伪造能力  
  - 影响：无法防止客户端伪造/篡改 saveData；服务端若用 checksum 判断“可信/未被篡改”会被绕过
- **传输安全未被强制**：`endpoint` 为配置项，代码未强制 `https://`  
  - 影响：若配置错误为 HTTP 或被降级，access token 可能被窃取（高风险）
- **服务端信任边界不清**：上传 payload 里携带 `userId/slot/saveData/timestamp/version/checksum`  
  - 建议服务端必须以 token 的 subject 为准，不应信任客户端传入 `userId`
- **待上传队列落 LocalStorage**：`cloud_pending_uploads` 保存了完整 `saveData`（包含可选 screenshot base64）  
  - 风险：同源脚本可读（若发生 XSS，则可读取存档与离线队列）；同时有容量与性能风险（P2 质量风险）

---

## 3. 代码安全检查

### 3.1 危险 API 使用（XSS/代码执行）

**未发现**
- `eval(...)` / `new Function(...)` / `Function(...)`：未命中

**发现（需关注）**
- `innerHTML`：
  - `game/src/systems/debug/PerformanceMonitor.ts`：用于渲染性能浮层（模板中是数值指标）
  - `game/src/systems/accessibility/A11yManager.ts`：用于插入固定 SVG filter 定义

当前用法主要是固定/数值模板，短期风险较低，但属于“容易被误用”的 API，建议逐步替换为 `textContent` + DOM createElement，或对插值进行严格转义。

### 3.2 敏感信息硬编码

在 `game/` 范围内按常见密钥特征（AWS/GCP/Slack/private key/token 等）扫描：**未发现明显硬编码密钥**。

### 3.3 CSP（Content Security Policy）

`game/index.html` 未配置 CSP meta；仓库内也未发现相关 header 配置。

影响：若未来引入任何 DOM 注入点（或第三方脚本/SDK），缺少 CSP 会放大 XSS 影响面。  
建议：由客户端/部署侧补齐 CSP（优先响应头），并逐步消除页面内联脚本/样式以避免 `unsafe-inline`。

### 3.4 PWA / Service Worker

文件：`game/public/sw.js`
- 只拦截同源请求，且排除 `/api/`（较合理）
- 会缓存 `application/javascript` 等资源类型：在 HTTPS 前提下正常；若在非预期环境下被劫持响应，可能“把异常 JS 缓存进来”（属于通用 SW 风险）

---

## 4. 问题清单（分级）

> 分级采用项目缺陷级别：P0 阻断 / P1 严重 / P2 一般 / P3 轻微

| ID | 级别 | 模块 | 问题 | 影响 | 证据（文件） | 建议 |
|---|---|---|---|---|---|---|
| SA-001 | P1 | 云存档 | checksum 非加密哈希，不具备防篡改能力 | 若服务端信任 checksum，会导致伪造/篡改存档绕过校验 | `game/src/systems/cloud/CloudSaveManager.ts`（`_calculateChecksum`） | 改为 **HMAC-SHA256**（服务端下发密钥/每用户密钥）或服务端签名；服务端永远不要信任客户端自报 |
| SA-002 | P1 | 云存档 | 未强制 HTTPS endpoint | token 可能在 HTTP/降级链路泄露 | `game/src/systems/cloud/CloudSaveManager.ts`（`endpoint` 任意） | 客户端 init 时校验 `endpoint.startsWith('https://')`（非 localhost 环境强制），并在文档/配置层禁止 HTTP |
| SA-003 | P2 | 本地/云存档 | 读取存档后缺少结构/范围校验，直接 restore | 异常/恶意存档导致崩溃或非法状态（DoS/数据污染） | `game/src/systems/save/SaveManager.ts`（load->restore） | 为 `ISaveData` 增加 schema 校验（字段存在性、类型、长度、枚举）；restore 前先验证与裁剪 |
| SA-004 | P2 | Web 安全基建 | 缺少 CSP | 放大潜在 XSS 影响面 | `game/index.html`（未见 CSP） | 部署侧加 CSP Header；逐步移除内联样式/脚本，使用 nonce/hash |
| SA-005 | P3 | 前端 DOM | 使用 `innerHTML` 拼接 UI（debug/a11y） | 若未来引入可控字符串插值，可能产生 XSS | `game/src/systems/debug/PerformanceMonitor.ts`、`game/src/systems/accessibility/A11yManager.ts` | 用 DOM API 替代或对插值做转义；至少加注释“禁止注入用户输入” |
| SA-006 | P3 | 供应链/隐私 | 运行时依赖 Google Fonts 外链 | 外部资源可用性/隐私与供应链风险 | `game/index.html`（fonts.googleapis.com） | 生产环境考虑字体自托管或通过可信 CDN；配合 CSP 限制外联域名 |

---

## 5. 建议行动（Action Items）

### 立即（本周/本迭代）
- **云存档强制 HTTPS（SA-002）**：客户端 init 校验 + 配置门禁
- **明确云存档信任模型（SA-001/SA-003）**：服务端不得信任客户端 `userId/checksum/saveData`；至少做服务端 schema 校验与大小限制

### 近期（1~2 个迭代）
- **存档 schema 校验（SA-003）**：引入轻量校验（自定义校验或 zod 等），并对 restore 做容错/回滚
- **CSP 方案落地（SA-004）**：先以 Report-Only 模式上线观测，再转 enforce；同步清理内联内容

### 例行（持续）
- 每次发布前：跑 `npm audit`（以及可选 `npm audit --omit=dev`），并记录结果到验收层
- 定期依赖升级与回归：优先处理安全相关更新


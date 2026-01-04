# 智绘AI生图自动化操作指南 v2.0

## 📌 目标
通过浏览器自动化工具操作公司内部的文生图网站（智绘），自动生成、下载并审核游戏全类型美术资产。

## 🔗 目标网站
- URL: `https://artflow.gz4399.com/image/nextImage/chat`
- 页面名称: 对话生图
- 默认模型: Nano Banana Pro(预览版)
- 输出分辨率: 2K (2048×2048)

## 📊 资产类型覆盖

| 资产类型 | 数量 | 优先级 | 规格 |
|----------|------|--------|------|
| **角色立绘** | 8×3状态 = 24 | P0 | 400×800 |
| **角色头像** | 8×5表情 = 40 | P0 | 200×200 |
| **像素精灵** | 8×4动作 = 32 | P1 | 32×32 / 64×64 |
| **场景背景** | 57个Zone | P0 | 750×1334+ |
| **物品图标** | 80+ | P1 | 48×48 / 64×64 |
| **卡片模板** | 4种 + 110内容 | P1 | 400×560 |
| **UI组件** | 50+ | P1 | 多种尺寸 |
| **特效资产** | 25+ | P2 | 序列帧 |

详细提示词模板见 `.cursor/rules/06-ai-art-generation.mdc`

---

## 🛠️ 可用的浏览器工具

### 方案一：Cursor Browser Extension（推荐）

**核心工具：**
- `browser_navigate` - 导航到URL
- `browser_snapshot` - 获取页面快照（含元素ref）
- `browser_click` - 点击元素
- `browser_type` - 输入文字
- `browser_wait_for` - 等待
- `browser_take_screenshot` - 截图
- `browser_evaluate` - 执行JavaScript

**优势：**
- ✅ 使用已登录的浏览器会话（自动继承Cookie）
- ✅ 页面快照包含元素ref，便于精准定位
- ✅ 支持JavaScript执行，可提取图片URL

### 方案二：chrome-devtools MCP

**工具列表（26个）：**
- `navigate_page` - 导航到URL
- `click` - 点击元素
- `fill` - 填写输入框
- `take_snapshot` - 获取快照
- `wait_for` - 等待
- `take_screenshot` - 截图
- `evaluate_script` - 执行JS脚本
- 更多工具见 MCP 文档

---

## 📝 完整操作流程

### 阶段一：生成图片

#### 步骤1：导航到网站
```javascript
browser_navigate({ url: "https://artflow.gz4399.com/image/nextImage/chat" })
```

#### 步骤2：等待页面加载 + 处理登录
```javascript
browser_wait_for({ time: 3 })
```
> ⚠️ 首次访问可能跳转登录页，浏览器会自动填充已保存的凭据

#### 步骤3：关闭欢迎弹窗（如有）
```javascript
// 获取快照找到"已知悉"按钮
browser_snapshot()
// 点击关闭
browser_click({ element: "已知悉按钮", ref: "eXXX" })
```

#### 步骤4：输入提示词
```javascript
// 点击输入框
browser_click({ element: "提示词输入框", ref: "eXXX" })
// 输入内容
browser_type({
  element: "提示词输入框",
  ref: "eXXX",
  text: "像素风格游戏角色，一个年轻的中国女性，黑色短发，穿着深色连帽卫衣，表情冷静，正面站姿，透明背景，32x32像素，游戏sprite风格"
})
```

#### 步骤5：提交生成
```javascript
// 获取快照确认发送按钮可用
browser_snapshot()
// 点击发送
browser_click({ element: "发送按钮", ref: "eXXX" })
```

#### 步骤6：等待生成完成（约60秒）
```javascript
browser_wait_for({ time: 60 })
// 截图查看结果
browser_take_screenshot({ filename: "generated_result.png" })
```

---

### 阶段二：下载图片

#### 步骤7：点击图片打开预览
```javascript
// 获取快照找到生成的图片
browser_snapshot()
// 点击第一张图片
browser_click({ element: "第一张生成的图片", ref: "eXXX" })
```

#### 步骤8：提取图片URL
```javascript
browser_evaluate({
  function: `() => {
    const images = document.querySelectorAll('img');
    const urls = [];
    images.forEach(img => {
      if (img.src.includes('storage_out') && img.src.includes('_small.webp')) {
        urls.push(img.src);
      }
    });
    // 去重
    return [...new Set(urls)];
  }`
})
```

#### 步骤9：使用Python下载图片
```python
import requests
import os

save_dir = 'assets/images/characters/generated'
os.makedirs(save_dir, exist_ok=True)

# 从步骤8获取的URL列表
urls = [
    'https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_XXX/xxx_small.webp',
    # ... 更多URL
]

for i, url in enumerate(urls, 1):
    response = requests.get(url, timeout=30)
    if response.status_code == 200:
        filename = f'{save_dir}/character_{i}.webp'
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f'Downloaded: {filename} ({len(response.content)} bytes)')
```

#### 图片URL规则
- 缩略图: `xxx_small.webp` (实际是2048×2048高清图)
- 原图: `xxx.webp` (可能需要登录认证)
- 推荐直接下载 `_small.webp` 版本

---

## 🎮 游戏美术资产提示词模板

### 像素风格角色（Footnote项目）

**通用模板：**
```
像素风格游戏角色，[角色描述]，[服装描述]，[表情/姿态]，正面站姿，透明背景，32x32像素，游戏sprite风格
```

**角色示例：**

| 角色 | 提示词 |
|------|--------|
| 岑回（主角） | 像素风格游戏角色，一个年轻的中国女性，黑色短发，穿着深色连帽卫衣，表情冷静，正面站姿，透明背景，32x32像素，游戏sprite风格 |
| 顾临 | 像素风格游戏角色，中年中国男性，短发整洁，穿着正式的深色西装，严肃表情，正面站姿，透明背景，32x32像素，游戏sprite风格 |
| 宋岚 | 像素风格游戏角色，年轻中国女性，长发扎马尾，穿着工装外套，温和表情，正面站姿，透明背景，32x32像素，游戏sprite风格 |
| 许澄 | 像素风格游戏角色，中年中国男性，戴眼镜，穿着白大褂，平静表情，正面站姿，透明背景，32x32像素，游戏sprite风格 |
| 阿棠 | 像素风格游戏角色，年轻人，凌乱短发，穿着破旧的灰色外套，迷茫表情，正面站姿，透明背景，32x32像素，游戏sprite风格 |

### 场景背景

```
像素风格游戏场景背景，[场景描述]，[氛围描述]，[色调]，竖版构图，750x1334像素
```

---

## 🖼️ 参考图上传（风格锁定）

### 核心发现

智绘页面有一个隐藏的文件上传组件，可以通过 JavaScript 的 `DataTransfer` API 直接设置文件，**完全绕过文件选择对话框**！

### 隐藏元素信息

| 项目 | 详情 |
|------|------|
| **选择器** | `input[type="file"][name="file"]` |
| **支持格式** | `jpeg, jpg, png, webp` |
| **最大数量** | 10 张参考图 |
| **父元素类名** | `nextImage-upload` |

### 自动上传代码模板

```javascript
// 在 browser_evaluate 中执行
async () => {
  // 1. 创建图片（可以是 canvas 生成、base64 解码、或 fetch 加载）
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // 绘制参考图内容（示例：赛博朋克风格渐变）
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, 512, 512);
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, 'rgba(255, 0, 128, 0.3)');
  gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(128, 0, 255, 0.3)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // 2. 转换为 Blob
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  
  // 3. 创建 File 对象
  const file = new File([blob], 'style_reference.png', { type: 'image/png' });
  
  // 4. 获取隐藏的 file input
  const fileInput = document.querySelector('input[type="file"][name="file"]');
  
  // 5. 使用 DataTransfer 设置文件
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  
  // 6. 触发 change 事件（关键！）
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  return { success: true, fileName: file.name, fileSize: file.size };
}
```

### 从 base64 上传真实图片

```javascript
async () => {
  // base64 字符串（从 PowerShell 或其他方式获取）
  const base64 = "iVBORw0KGgo..."; // 完整的 base64 数据
  
  // 解码为二进制
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // 创建 Blob 和 File
  const blob = new Blob([bytes], { type: 'image/png' });
  const file = new File([blob], 'reference.png', { type: 'image/png' });
  
  // 设置到 file input
  const fileInput = document.querySelector('input[type="file"][name="file"]');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  return { success: true };
}
```

### 完整工作流程

1. **导航到智绘**: `browser_navigate`
2. **点击"参考图"按钮**: 激活参考图模式
3. **执行上传脚本**: `browser_evaluate` 设置文件并触发 change 事件
4. **等待上传完成**: 约 2-3 秒
5. **输入提示词**: 描述想要生成的内容
6. **点击发送**: 开始生成

### 使用场景

- **风格锁定**: 上传一张目标风格的参考图，生成同风格的多张图片
- **批量生成**: 循环上传参考图 + 提示词，自动化生产资产
- **一致性保证**: 同一批资产使用相同参考图，保持风格统一

### ✅ 完整端到端流程示例（已验证可用）

以下是使用真实角色图片生成动画序列帧的完整流程：

#### 第1步：准备参考图（缩小为可传输的大小）

```powershell
# PowerShell - 使用 PIL 缩小图片到可传输大小
python -c "
import base64
from PIL import Image
import io

# 读取原图
img = Image.open(r'F:\workspace\github\Footnote\text2pic\generated\characters\char_wanderer.png')
print(f'Original: {img.size}')

# 缩小到256x256保持纵横比
img.thumbnail((256, 256), Image.LANCZOS)

# 保存为高质量JPEG（比PNG小很多）
buf = io.BytesIO()
img.save(buf, format='JPEG', quality=90, optimize=True)
buf.seek(0)
b64 = base64.b64encode(buf.read()).decode('ascii')
print(f'Base64 length: {len(b64)} chars')

# 保存base64到文件
with open('small_ref.txt', 'w') as f:
    f.write(b64)
"
```

#### 第2步：导航到智绘并激活参考图模式

```javascript
// 1. 导航到智绘
browser_navigate({ url: "https://artflow.gz4399.com/image/nextImage/chat" })

// 2. 等待页面加载
browser_wait_for({ time: 3 })

// 3. 获取快照找到参考图按钮
browser_snapshot()

// 4. 点击参考图按钮激活
browser_click({ element: "参考图按钮", ref: "eXXX" })
```

#### 第3步：上传参考图（核心代码）

```javascript
// 在 browser_evaluate 中执行
async () => {
  // base64 数据（从文件读取或直接嵌入）
  const base64Data = '/9j/4AAQSkZJRgAB...'; // 完整的base64字符串
  
  // 解码 base64 为二进制
  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  // 创建 Blob 和 File
  const blob = new Blob([uint8Array], { type: 'image/jpeg' });
  const file = new File([blob], 'reference.jpg', { type: 'image/jpeg' });
  
  // 找到隐藏的 file input
  const fileInput = document.querySelector('input[type="file"][name="file"]');
  if (!fileInput) return { error: 'File input not found' };
  
  // 使用 DataTransfer 设置文件
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  
  // 触发 change 事件
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  return { success: true, fileSize: blob.size };
}
```

#### 第4步：等待上传完成并输入提示词

```javascript
// 等待上传完成
browser_wait_for({ time: 3 })

// 获取快照确认上传成功（应该能看到参考图预览）
browser_snapshot()

// 点击输入框
browser_click({ element: "输入框", ref: "eXXX" })

// 输入提示词
browser_type({
  element: "提示词输入框",
  ref: "eXXX",
  text: "根据参考图的角色风格，生成4帧像素风格走路动画序列帧，保持角色外观一致，sprite sheet格式，每帧展示不同的行走姿势"
})
```

#### 第5步：提交并等待生成

```javascript
// 获取快照确认发送按钮可用
browser_snapshot()

// 点击发送
browser_click({ element: "发送按钮", ref: "eXXX" })

// 等待生成（通常需要30-60秒）
browser_wait_for({ time: 60 })

// 截图查看结果
browser_take_screenshot({ filename: "animation_frames.png" })
```

### 📌 关键技术点总结

| 问题 | 解决方案 |
|------|----------|
| 图片太大无法传输 | 使用 PIL 缩小到 256x256，转 JPEG 格式 |
| HTTPS 页面无法 fetch HTTP | 使用 base64 直接嵌入，避免跨域问题 |
| 文件选择对话框无法自动化 | 使用 DataTransfer API 直接设置 files |
| change 事件未触发 | 手动 dispatch Event 并设置 bubbles: true |

---

## ⚠️ 已知问题与解决方案

### 1. 需要先登录
- **原因**：网站需要员工账号登录
- **解决**：使用已登录的浏览器会话（Cursor Browser Extension自动继承）

### 2. 下载原图需要认证
- **原因**：去掉`_small`后缀的URL需要登录Cookie
- **解决**：直接下载`_small.webp`版本（实际也是2048×2048高清）

### 3. 生成时间较长
- **原因**：2K分辨率+4张图片并行生成
- **解决**：等待60-90秒，通过快照检查"想象进度"状态

---

## 🔧 配置要求

### Cursor Browser Extension
- 确保浏览器已登录智绘网站
- 使用 `browser_*` 系列工具

### Python 环境（下载图片）
```bash
pip install requests
```

### 项目目录结构
```
assets/images/characters/
├── generated/          # AI生成的原始图片
│   ├── cenhui_pixel_1.webp
│   └── ...
├── portraits/          # 处理后的头像
└── sprites/            # 处理后的sprite
```

---

## 📊 输出规格

| 属性 | 规格 |
|------|------|
| 格式 | WebP (透明背景) |
| 分辨率 | 2048×2048 |
| 文件大小 | 50-150KB |
| 数量 | 每次生成4张 |

---

## 📁 资产目录结构

```
assets/images/
├── characters/
│   ├── approved/        # ✅ 通过审核的角色图
│   ├── rejected/        # ❌ 未通过审核的角色图
│   └── generated/       # 🔄 生成中/待审核
├── backgrounds/
│   ├── approved/        # ✅ 通过审核的背景图
│   └── rejected/        # ❌ 未通过审核的背景图
├── icons/
│   ├── approved/        # ✅ 通过审核的图标
│   └── rejected/        # ❌ 未通过审核的图标
├── cards/
│   ├── approved/        # ✅ 通过审核的卡片
│   └── rejected/        # ❌ 未通过审核的卡片
├── effects/
│   ├── approved/        # ✅ 通过审核的特效
│   └── rejected/        # ❌ 未通过审核的特效
└── ui/
    ├── approved/        # ✅ 通过审核的UI资产
    └── rejected/        # ❌ 未通过审核的UI资产
```

---

## 🎨 资产类型详细说明

### 1. 角色资产

#### 立绘（全身）
- **目标尺寸**: 400×800
- **用途**: 对话界面、角色展示
- **要求**: 纯正面、透明背景、完整全身
- **状态变体**: 常态/压力态/终局态

#### 头像（对话用）
- **目标尺寸**: 200×200
- **用途**: 对话框内角色显示
- **表情变体**: 常态/惊讶/思考/悲伤/压力

#### 像素精灵（场景用）
- **目标尺寸**: 32×32 或 64×64
- **用途**: 场景内角色移动
- **动作变体**: idle/walk/interact/talk/special

### 2. 场景背景

#### 六大区域风格
| 区域 | 色调 | 氛围 |
|------|------|------|
| 居住环 | 暖灰+暖光 | 温暖、空旷 |
| 市政环 | 冷蓝灰+金属 | 秩序、压迫 |
| 档案巷 | 褐+暗黄 | 怀旧、神秘 |
| 诊疗台 | 白+蓝 | 洁净、不安 |
| 礼堂街 | 深紫红+金 | 神秘、仪式 |
| 边缘断口 | 深黑+荧光 | 危险、异常 |

### 3. 物品图标

| 类型 | 尺寸 | 数量 |
|------|------|------|
| 能力图标 | 48×48 | 3 |
| 计数器图标 | 32×32 | 3 |
| 关键物品 | 64×64 | 28 |
| 状态图标 | 32×32 | 6 |
| 功能图标 | 24×24 | 7 |

### 4. 卡片资产

| 类型 | 配色 | 特征 |
|------|------|------|
| 档案卡 | 灰+白 | 涂改痕迹 |
| 日记卡 | 褐+米白 | 手写风格 |
| 祈愿卡 | 紫+金 | 发光边缘 |
| 判词卡 | 黑+红 | 警告条 |

### 5. UI组件

- 按钮: 主按钮/次按钮/关闭/返回/菜单
- 面板: 对话/系统/菜单/存档槽/卡片详情
- 指示器: 深度/稳定性/时间/进度条

### 6. 特效资产

| 类型 | 帧数 | 用途 |
|------|------|------|
| 能力特效 | 8-24帧 | 深度感知/介入/时间 |
| 系统特效 | 6-16帧 | 系统更正/字段闪现 |
| 环境特效 | 8-16帧 | 漂移/回声/尘埃 |
| UI特效 | 6-12帧 | 对话框/卡片/物品 |

---

## ✅ 质量审核标准

### 必须通过项（不通过直接拒绝）
- [x] 朝向一致性（正面必须完全对称）
- [x] 背景透明（检查棋盘格显示）
- [x] 角色/主体完整（无截断）
- [x] 风格匹配（像素/数字艺术）
- [x] 构图居中

### 重要检查项（允许轻微偏差）
- [ ] 配色准确（色调正确即可）
- [ ] 表情正确（整体情绪对即可）
- [ ] 细节完整（80%特征存在）
- [ ] 尺寸比例（±10%偏差）

### 质量评分
- **A (9.0+)**: 完美符合所有要求
- **B (8.0-8.9)**: 符合必须项，重要项轻微偏差
- **C (7.0-7.9)**: 符合必须项，重要项明显偏差
- **D (<7.0)**: 必须项不通过，拒绝

---

## 📅 更新日志

- 2025-12-24: v2.0 - 全面覆盖所有资产类型、质量审核标准、目录结构
- 2024-12-24: v1.1 - 新增完整下载流程、Python脚本、角色提示词表
- 2024-12-24: v1.0 - 初始版本，记录基础操作流程

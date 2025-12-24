# 智绘AI生图自动化操作指南

## 📌 目标
通过浏览器自动化工具操作公司内部的文生图网站（智绘），自动生成并下载美术资产。

## 🔗 目标网站
- URL: `https://artflow.gz4399.com/image/nextImage/chat`
- 页面名称: 对话生图
- 默认模型: Nano Banana Pro(预览版)
- 输出分辨率: 2K (2048×2048)

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

## 📅 更新日志

- 2024-12-24: v2.0 - 新增完整下载流程、Python脚本、角色提示词表
- 2024-12-24: v1.0 - 初始版本，记录基础操作流程

# 《备注 / Footnote》性能基准与异常处理规范 v1.0

> **文档性质**：技术规格文档  
> **版本**: v1.0  
> **创建日期**: 2026-01-19  
> **来源文档**: `design/ai-native/01_bibles/tech_bible.md`, `design/game/05-tech/技术设计文档TDD_v1.md`  
> **状态**: 草案

---

## 1. 性能基准概览

### 1.1 设备分级定义

| 等级 | 设备特征 | 代表机型 | 用户占比（预估） |
|------|---------|---------|----------------|
| **低端** | RAM ≤3GB, 2017年前芯片 | Redmi 7, iPhone 6s | ~20% |
| **中端** | RAM 4-6GB, 2019-2021芯片 | Redmi Note 9, iPhone 11 | ~50% |
| **高端** | RAM ≥8GB, 2022+芯片 | iPhone 14+, 小米13+ | ~30% |

### 1.2 核心指标汇总

| 指标 | 低端目标 | 中端目标 | 高端目标 | 红线 |
|------|---------|---------|---------|------|
| 运行帧率 | ≥30fps | ≥45fps | ≥60fps | <24fps |
| 首屏渲染 | ≤5s | ≤3s | ≤2s | >8s |
| 场景切换 | ≤3s | ≤2s | ≤1s | >5s |
| 内存峰值 | ≤150MB | ≤100MB | ≤80MB | >200MB |
| 交互响应 | ≤200ms | ≤100ms | ≤50ms | >300ms |
| 包体大小 | - | - | - | >15MB |

---

## 2. 帧率基准 (Frame Rate)

### 2.1 定义

**帧率 (FPS)**: 游戏每秒渲染的画面帧数，直接影响动画流畅度和用户体验。

### 2.2 阈值定义

| 设备等级 | 目标帧率 | 可接受范围 | 降级触发 | 严重告警 |
|---------|---------|-----------|---------|---------|
| 低端 | 30fps | 24-30fps | <24fps | <15fps |
| 中端 | 45fps | 30-60fps | <30fps | <20fps |
| 高端 | 60fps | 45-60fps | <45fps | <30fps |

### 2.3 降级策略

```typescript
enum PerformanceTier {
  HIGH = 'high',      // 全特效
  MEDIUM = 'medium',  // 减少特效
  LOW = 'low',        // 最小特效
  MINIMAL = 'minimal' // 仅核心渲染
}

interface IFrameRateDegradation {
  tier: PerformanceTier;
  actions: string[];
}

const FRAME_RATE_DEGRADATION: Record<string, IFrameRateDegradation> = {
  // 帧率 < 45fps，降级到 MEDIUM
  medium: {
    tier: PerformanceTier.MEDIUM,
    actions: [
      '禁用粒子特效',
      '降低动画帧数（60fps→30fps插值）',
      '禁用背景视差滚动',
    ]
  },
  // 帧率 < 30fps，降级到 LOW
  low: {
    tier: PerformanceTier.LOW,
    actions: [
      '禁用所有非必要动画',
      '使用静态背景替换动态背景',
      '减少同屏对象数量上限（20→10）',
      '禁用阴影效果',
    ]
  },
  // 帧率 < 20fps，降级到 MINIMAL
  minimal: {
    tier: PerformanceTier.MINIMAL,
    actions: [
      '仅渲染核心UI和关键对象',
      '禁用所有过渡动画',
      '使用纯色背景',
      '显示性能警告提示',
    ]
  }
};
```

### 2.4 监控方式

```typescript
// 帧率监控实现
class FrameRateMonitor {
  private _samples: number[] = [];
  private _sampleSize = 60; // 采样窗口
  private _lastTime = 0;
  
  update(time: number): void {
    if (this._lastTime > 0) {
      const delta = time - this._lastTime;
      const fps = 1000 / delta;
      this._samples.push(fps);
      
      if (this._samples.length > this._sampleSize) {
        this._samples.shift();
      }
    }
    this._lastTime = time;
  }
  
  getAverageFPS(): number {
    if (this._samples.length === 0) return 60;
    return this._samples.reduce((a, b) => a + b) / this._samples.length;
  }
  
  getPercentile(p: number): number {
    const sorted = [...this._samples].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * (p / 100));
    return sorted[index] || 60;
  }
}

// 监控指标上报
interface IPerformanceMetrics {
  avgFps: number;      // 平均帧率
  minFps: number;      // 最低帧率（1%分位）
  p5Fps: number;       // 5%分位帧率
  frameDrops: number;  // 掉帧次数（连续3帧<30fps）
}
```

---

## 3. 场景加载时间 (Scene Load Time)

### 3.1 定义

**场景加载时间**: 从触发场景切换到新场景完全可交互的总时间。

包含阶段：
1. **资源加载**: 纹理、音频、数据文件
2. **场景构建**: 对象实例化、布局计算
3. **首帧渲染**: 第一帧画面绘制完成

### 3.2 阈值定义

| 加载类型 | 目标时间 | 可接受范围 | 超时阈值 | 网络条件 |
|---------|---------|-----------|---------|---------|
| 首次加载（冷启动） | ≤3s | 3-5s | 8s | 4G (10Mbps) |
| 章节切换 | ≤2s | 2-4s | 6s | 4G |
| Zone切换（同章节） | ≤1s | 1-2s | 4s | 本地缓存 |
| 快速切换（已缓存） | ≤0.5s | 0.5-1s | 2s | 本地缓存 |

### 3.3 降级策略

```typescript
interface ILoadingDegradation {
  stage: string;
  timeout: number;     // ms
  degradeAction: string;
  fallbackAction: string;
}

const LOADING_DEGRADATION: ILoadingDegradation[] = [
  {
    stage: 'texture_load',
    timeout: 5000,
    degradeAction: '使用低分辨率纹理占位',
    fallbackAction: '使用白盒占位符',
  },
  {
    stage: 'audio_load',
    timeout: 3000,
    degradeAction: '跳过背景音乐加载',
    fallbackAction: '静音模式继续',
  },
  {
    stage: 'data_parse',
    timeout: 2000,
    degradeAction: '使用缓存数据',
    fallbackAction: '显示错误并提供重试',
  },
  {
    stage: 'scene_build',
    timeout: 3000,
    degradeAction: '简化场景对象',
    fallbackAction: '仅加载核心对象',
  },
];

// 超时处理
class LoadingManager {
  private _timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  startStageTimer(stage: string, timeout: number, onTimeout: () => void): void {
    const timer = setTimeout(() => {
      console.warn(`[Loading] Stage "${stage}" timeout after ${timeout}ms`);
      onTimeout();
    }, timeout);
    this._timeouts.set(stage, timer);
  }
  
  completeStage(stage: string): void {
    const timer = this._timeouts.get(stage);
    if (timer) {
      clearTimeout(timer);
      this._timeouts.delete(stage);
    }
  }
}
```

### 3.4 监控方式

```typescript
interface ILoadingMetrics {
  sceneId: string;
  totalTime: number;
  stages: {
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: 'success' | 'timeout' | 'error';
  }[];
  resourceStats: {
    texturesLoaded: number;
    texturesFailed: number;
    audioLoaded: number;
    audioFailed: number;
    totalBytes: number;
  };
}

// 加载性能追踪
class LoadingProfiler {
  private _metrics: ILoadingMetrics;
  
  startTracking(sceneId: string): void {
    this._metrics = {
      sceneId,
      totalTime: 0,
      stages: [],
      resourceStats: {
        texturesLoaded: 0,
        texturesFailed: 0,
        audioLoaded: 0,
        audioFailed: 0,
        totalBytes: 0,
      }
    };
  }
  
  recordStage(name: string, duration: number, status: string): void {
    this._metrics.stages.push({
      name,
      startTime: performance.now() - duration,
      endTime: performance.now(),
      duration,
      status: status as 'success' | 'timeout' | 'error',
    });
  }
  
  finalize(): ILoadingMetrics {
    this._metrics.totalTime = this._metrics.stages.reduce(
      (sum, s) => sum + s.duration, 0
    );
    return this._metrics;
  }
}
```

---

## 4. 内存占用 (Memory Usage)

### 4.1 定义

**内存占用**: JavaScript 堆内存 + GPU 纹理内存的总和。

### 4.2 阈值定义

| 内存类型 | 目标值 | 警告阈值 | 危险阈值 | 强制GC阈值 |
|---------|-------|---------|---------|-----------|
| JS堆内存 | ≤50MB | 70MB | 100MB | 120MB |
| 纹理内存 | ≤50MB | 70MB | 100MB | 120MB |
| 总内存 | ≤100MB | 140MB | 180MB | 200MB |

### 4.3 降级策略

```typescript
interface IMemoryDegradation {
  level: 'warning' | 'danger' | 'critical';
  threshold: number;  // MB
  actions: string[];
}

const MEMORY_DEGRADATION: IMemoryDegradation[] = [
  {
    level: 'warning',
    threshold: 140,
    actions: [
      '清理非当前场景的纹理缓存',
      '释放已播放完毕的音频',
      '触发软GC建议',
    ]
  },
  {
    level: 'danger',
    threshold: 180,
    actions: [
      '强制卸载非必要资源',
      '降低纹理分辨率',
      '禁用预加载',
      '显示内存警告提示',
    ]
  },
  {
    level: 'critical',
    threshold: 200,
    actions: [
      '触发紧急存档',
      '卸载所有非当前场景资源',
      '建议用户重启应用',
      '上报崩溃风险日志',
    ]
  }
];

// 内存管理器
class MemoryManager {
  private _warningShown = false;
  
  checkMemory(): void {
    const usage = this.getMemoryUsage();
    
    for (const degradation of MEMORY_DEGRADATION) {
      if (usage.total >= degradation.threshold) {
        this.executeDegradation(degradation);
        break;
      }
    }
  }
  
  getMemoryUsage(): { js: number; texture: number; total: number } {
    // 使用 performance.memory (Chrome) 或估算
    const jsHeap = (performance as any).memory?.usedJSHeapSize || 0;
    const jsMB = jsHeap / (1024 * 1024);
    
    // 纹理内存估算
    const textureMB = this.estimateTextureMemory();
    
    return {
      js: jsMB,
      texture: textureMB,
      total: jsMB + textureMB,
    };
  }
  
  private estimateTextureMemory(): number {
    // 基于已加载纹理尺寸估算
    // 每像素约 4 bytes (RGBA)
    let totalPixels = 0;
    // ... 遍历纹理计算
    return (totalPixels * 4) / (1024 * 1024);
  }
  
  private executeDegradation(degradation: IMemoryDegradation): void {
    console.warn(`[Memory] ${degradation.level} level reached`);
    // 执行降级动作
  }
}
```

### 4.4 监控方式

```typescript
interface IMemoryMetrics {
  timestamp: number;
  jsHeapUsed: number;
  jsHeapTotal: number;
  textureMemory: number;
  activeTextures: number;
  cachedTextures: number;
  audioBuffers: number;
}

// 定期采样
class MemoryProfiler {
  private _samples: IMemoryMetrics[] = [];
  private _maxSamples = 100;
  
  sample(): void {
    const metrics = this.collectMetrics();
    this._samples.push(metrics);
    
    if (this._samples.length > this._maxSamples) {
      this._samples.shift();
    }
  }
  
  getMemoryTrend(): 'stable' | 'growing' | 'critical' {
    if (this._samples.length < 10) return 'stable';
    
    const recent = this._samples.slice(-10);
    const growth = recent[9].jsHeapUsed - recent[0].jsHeapUsed;
    const growthRate = growth / recent[0].jsHeapUsed;
    
    if (growthRate > 0.2) return 'critical';  // 20%增长
    if (growthRate > 0.1) return 'growing';   // 10%增长
    return 'stable';
  }
}
```

---

## 5. 首屏渲染时间 (First Contentful Paint)

### 5.1 定义

**首屏渲染时间 (FCP)**: 从页面开始加载到首个有意义内容（Logo、加载进度条）显示的时间。

**可交互时间 (TTI)**: 从页面开始加载到用户可以进行有效交互的时间。

### 5.2 阈值定义

| 指标 | 优秀 | 良好 | 需改进 | 差 |
|-----|-----|-----|-------|---|
| FCP (4G) | <1s | 1-2s | 2-3s | >3s |
| FCP (3G) | <2s | 2-4s | 4-6s | >6s |
| TTI (4G) | <3s | 3-5s | 5-8s | >8s |
| TTI (3G) | <5s | 5-8s | 8-12s | >12s |

### 5.3 降级策略

```typescript
// 渐进式加载策略
interface IProgressiveLoadingConfig {
  phase: 'critical' | 'essential' | 'enhancement';
  resources: string[];
  timeout: number;
  onTimeout: () => void;
}

const PROGRESSIVE_LOADING: IProgressiveLoadingConfig[] = [
  {
    phase: 'critical',
    resources: [
      'ui_loading_bg',      // 加载背景
      'ui_loading_bar',     // 进度条
      'font_main',          // 主字体
    ],
    timeout: 2000,
    onTimeout: () => {
      // 使用系统字体和CSS背景色
    }
  },
  {
    phase: 'essential',
    resources: [
      'ui_panel_main',      // 主UI面板
      'btn_primary',        // 按钮
      'bg_menu',            // 菜单背景
    ],
    timeout: 5000,
    onTimeout: () => {
      // 使用简化UI继续
    }
  },
  {
    phase: 'enhancement',
    resources: [
      'particles/*',        // 粒子效果
      'animations/*',       // 动画
    ],
    timeout: 10000,
    onTimeout: () => {
      // 后台继续加载，不阻塞
    }
  }
];

// 首屏优化器
class FirstPaintOptimizer {
  private _loadingScreen: Phaser.GameObjects.Container;
  
  // 尽早显示加载画面
  showLoadingScreen(scene: Phaser.Scene): void {
    // 使用内联CSS渐变，无需等待资源
    const bg = scene.add.rectangle(
      0, 0, 
      scene.cameras.main.width, 
      scene.cameras.main.height,
      0x1a1a2e
    ).setOrigin(0);
    
    // 使用Canvas API绘制简单进度条
    const progressBar = scene.add.graphics();
    this.drawProgressBar(progressBar, 0);
    
    this._loadingScreen = scene.add.container(0, 0, [bg, progressBar]);
  }
  
  updateProgress(progress: number): void {
    // 更新进度条
  }
}
```

### 5.4 监控方式

```typescript
interface IFirstPaintMetrics {
  navigationStart: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  loadingScreenShown: number;
  gameReady: number;
  timeToInteractive: number;
}

// 性能标记
class FirstPaintProfiler {
  private _marks: Map<string, number> = new Map();
  
  mark(name: string): void {
    this._marks.set(name, performance.now());
    performance.mark(`footnote_${name}`);
  }
  
  measure(name: string, startMark: string, endMark: string): number {
    const start = this._marks.get(startMark) || 0;
    const end = this._marks.get(endMark) || performance.now();
    return end - start;
  }
  
  getMetrics(): IFirstPaintMetrics {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      navigationStart: nav?.startTime || 0,
      domContentLoaded: nav?.domContentLoadedEventEnd || 0,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      loadingScreenShown: this._marks.get('loading_screen_shown') || 0,
      gameReady: this._marks.get('game_ready') || 0,
      timeToInteractive: this._marks.get('interactive') || 0,
    };
  }
}
```

---

## 6. 交互响应延迟 (Interaction Latency)

### 6.1 定义

**交互响应延迟**: 从用户触发交互（点击、滑动）到界面产生视觉反馈的时间。

### 6.2 阈值定义

| 交互类型 | 目标延迟 | 可接受范围 | 用户感知 |
|---------|---------|-----------|---------|
| 按钮点击反馈 | ≤50ms | 50-100ms | 即时感 |
| 对话推进 | ≤100ms | 100-200ms | 流畅感 |
| 菜单展开 | ≤150ms | 150-300ms | 轻微延迟 |
| 场景交互 | ≤200ms | 200-400ms | 明显延迟 |
| 存档操作 | ≤500ms | 500-1000ms | 需要反馈 |

### 6.3 降级策略

```typescript
// 交互响应优化
interface IInteractionConfig {
  type: string;
  targetLatency: number;
  visualFeedback: 'immediate' | 'deferred' | 'async';
  fallbackBehavior: string;
}

const INTERACTION_CONFIG: IInteractionConfig[] = [
  {
    type: 'button_click',
    targetLatency: 50,
    visualFeedback: 'immediate',
    fallbackBehavior: '立即显示按压状态，异步处理逻辑',
  },
  {
    type: 'dialogue_advance',
    targetLatency: 100,
    visualFeedback: 'immediate',
    fallbackBehavior: '立即显示打字机效果起始',
  },
  {
    type: 'menu_open',
    targetLatency: 150,
    visualFeedback: 'deferred',
    fallbackBehavior: '先显示半透明遮罩，再加载内容',
  },
  {
    type: 'save_game',
    targetLatency: 500,
    visualFeedback: 'async',
    fallbackBehavior: '显示保存中动画，后台完成',
  },
];

// 乐观更新模式
class OptimisticUIManager {
  // 按钮点击：立即视觉反馈
  handleButtonClick(button: Phaser.GameObjects.Image, callback: () => Promise<void>): void {
    // 立即反馈
    button.setTint(0xcccccc);
    button.setScale(0.95);
    
    // 异步处理
    callback().then(() => {
      button.clearTint();
      button.setScale(1);
    }).catch(() => {
      // 恢复并显示错误
      button.clearTint();
      button.setScale(1);
      this.showError();
    });
  }
}
```

### 6.4 监控方式

```typescript
interface IInteractionMetrics {
  type: string;
  timestamp: number;
  inputTime: number;      // 用户输入时间
  feedbackTime: number;   // 视觉反馈时间
  completeTime: number;   // 操作完成时间
  latency: number;        // 总延迟
  exceeded: boolean;      // 是否超出阈值
}

// 交互延迟追踪
class InteractionProfiler {
  private _pending: Map<string, number> = new Map();
  private _metrics: IInteractionMetrics[] = [];
  
  startInteraction(id: string, type: string): void {
    this._pending.set(id, performance.now());
  }
  
  recordFeedback(id: string): void {
    const start = this._pending.get(id);
    if (start) {
      const latency = performance.now() - start;
      // 记录
    }
  }
  
  completeInteraction(id: string): void {
    // 完成记录
    this._pending.delete(id);
  }
  
  getP95Latency(type: string): number {
    const filtered = this._metrics.filter(m => m.type === type);
    const sorted = filtered.map(m => m.latency).sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 0;
  }
}
```

---

## 7. 异常处理规范

### 7.1 网络异常处理

#### 7.1.1 定义

**网络异常**: 包括请求超时、DNS解析失败、连接断开、HTTP错误等网络相关故障。

#### 7.1.2 阈值定义

| 异常类型 | 检测阈值 | 重试次数 | 重试间隔 | 最终处理 |
|---------|---------|---------|---------|---------|
| 请求超时 | 10s | 3次 | 2s, 4s, 8s | 降级/离线模式 |
| DNS失败 | 5s | 2次 | 3s | 提示检查网络 |
| 连接断开 | 实时 | 自动 | 指数退避 | 离线模式 |
| HTTP 4xx | 即时 | 0次 | - | 显示错误详情 |
| HTTP 5xx | 即时 | 3次 | 5s | 降级/缓存数据 |

#### 7.1.3 降级策略

```typescript
enum NetworkState {
  ONLINE = 'online',
  DEGRADED = 'degraded',   // 部分功能
  OFFLINE = 'offline',     // 离线模式
}

interface INetworkErrorHandler {
  errorType: string;
  retryConfig: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  degradeActions: string[];
  userNotification: string;
}

const NETWORK_ERROR_HANDLERS: Record<string, INetworkErrorHandler> = {
  timeout: {
    errorType: 'timeout',
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 8000,
      backoffMultiplier: 2,
    },
    degradeActions: [
      '切换到缓存数据',
      '禁用在线功能',
      '启用离线模式',
    ],
    userNotification: '网络连接超时，已切换到离线模式',
  },
  
  connectionLost: {
    errorType: 'connection_lost',
    retryConfig: {
      maxAttempts: -1,  // 持续重试
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
    },
    degradeActions: [
      '暂停需要网络的操作',
      '缓存待同步数据',
      '显示离线状态指示器',
    ],
    userNotification: '网络已断开，游戏数据将在重新连接后同步',
  },
};

// 网络管理器
class NetworkManager {
  private _state: NetworkState = NetworkState.ONLINE;
  private _retryQueues: Map<string, RetryQueue> = new Map();
  
  async fetchWithRetry<T>(
    url: string, 
    options?: RequestInit,
    errorType: string = 'timeout'
  ): Promise<T> {
    const handler = NETWORK_ERROR_HANDLERS[errorType];
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < handler.retryConfig.maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        const delay = Math.min(
          handler.retryConfig.baseDelay * Math.pow(handler.retryConfig.backoffMultiplier, attempt),
          handler.retryConfig.maxDelay
        );
        await this.sleep(delay);
      }
    }
    
    // 所有重试失败，执行降级
    this.executeDegradation(handler);
    throw lastError;
  }
  
  private executeDegradation(handler: INetworkErrorHandler): void {
    this._state = NetworkState.DEGRADED;
    this.showNotification(handler.userNotification);
    // 执行降级动作
  }
}
```

#### 7.1.4 监控方式

```typescript
interface INetworkMetrics {
  requestCount: number;
  successCount: number;
  failureCount: number;
  avgLatency: number;
  timeoutCount: number;
  retryCount: number;
  offlineDuration: number;
}

class NetworkProfiler {
  private _metrics: INetworkMetrics = {
    requestCount: 0,
    successCount: 0,
    failureCount: 0,
    avgLatency: 0,
    timeoutCount: 0,
    retryCount: 0,
    offlineDuration: 0,
  };
  
  recordRequest(success: boolean, latency: number, retried: boolean): void {
    this._metrics.requestCount++;
    if (success) {
      this._metrics.successCount++;
    } else {
      this._metrics.failureCount++;
    }
    if (retried) {
      this._metrics.retryCount++;
    }
    // 更新平均延迟
  }
  
  getSuccessRate(): number {
    if (this._metrics.requestCount === 0) return 1;
    return this._metrics.successCount / this._metrics.requestCount;
  }
}
```

---

### 7.2 资源加载失败处理

#### 7.2.1 定义

**资源加载失败**: 纹理、音频、数据文件等游戏资源无法正常加载的情况。

#### 7.2.2 阈值定义

| 资源类型 | 重试次数 | 超时时间 | 严重级别 | 降级方案 |
|---------|---------|---------|---------|---------|
| 核心UI纹理 | 3次 | 10s | CRITICAL | 使用Canvas绘制 |
| 背景图 | 2次 | 15s | HIGH | 使用纯色背景 |
| 角色图 | 2次 | 10s | HIGH | 使用占位符 |
| 音效 | 1次 | 5s | LOW | 静默跳过 |
| BGM | 2次 | 20s | MEDIUM | 静默继续 |
| 数据文件 | 3次 | 10s | CRITICAL | 使用缓存/默认值 |

#### 7.2.3 降级策略

```typescript
enum AssetSeverity {
  CRITICAL = 'critical',  // 必须成功，否则无法继续
  HIGH = 'high',          // 重要，需要降级方案
  MEDIUM = 'medium',      // 中等，可接受降级
  LOW = 'low',            // 低，可跳过
}

interface IAssetFallback {
  assetType: string;
  severity: AssetSeverity;
  fallbackStrategy: 'placeholder' | 'canvas' | 'skip' | 'retry_later';
  fallbackAsset?: string;
  maxRetries: number;
}

const ASSET_FALLBACKS: Record<string, IAssetFallback> = {
  'ui_texture': {
    assetType: 'texture',
    severity: AssetSeverity.CRITICAL,
    fallbackStrategy: 'canvas',
    maxRetries: 3,
  },
  'background': {
    assetType: 'texture',
    severity: AssetSeverity.HIGH,
    fallbackStrategy: 'placeholder',
    fallbackAsset: 'placeholder_bg',
    maxRetries: 2,
  },
  'character': {
    assetType: 'texture',
    severity: AssetSeverity.HIGH,
    fallbackStrategy: 'placeholder',
    fallbackAsset: 'placeholder_char',
    maxRetries: 2,
  },
  'sfx': {
    assetType: 'audio',
    severity: AssetSeverity.LOW,
    fallbackStrategy: 'skip',
    maxRetries: 1,
  },
  'bgm': {
    assetType: 'audio',
    severity: AssetSeverity.MEDIUM,
    fallbackStrategy: 'skip',
    maxRetries: 2,
  },
  'data': {
    assetType: 'json',
    severity: AssetSeverity.CRITICAL,
    fallbackStrategy: 'retry_later',
    maxRetries: 3,
  },
};

// 资源加载管理器
class AssetLoadManager {
  private _failedAssets: Set<string> = new Set();
  private _placeholderCache: Map<string, Phaser.GameObjects.Graphics> = new Map();
  
  handleLoadError(key: string, type: string): void {
    this._failedAssets.add(key);
    
    const fallback = ASSET_FALLBACKS[type];
    if (!fallback) {
      console.error(`[Asset] No fallback for type: ${type}`);
      return;
    }
    
    switch (fallback.fallbackStrategy) {
      case 'placeholder':
        this.createPlaceholder(key, fallback.fallbackAsset);
        break;
      case 'canvas':
        this.createCanvasFallback(key);
        break;
      case 'skip':
        console.warn(`[Asset] Skipping failed asset: ${key}`);
        break;
      case 'retry_later':
        this.scheduleRetry(key, type);
        break;
    }
  }
  
  private createPlaceholder(key: string, fallbackKey?: string): void {
    // 使用白盒工厂创建占位符
    const placeholder = WhiteboxFactory.createPlaceholder(key);
    // 注册到纹理管理器
  }
  
  private createCanvasFallback(key: string): void {
    // 使用Canvas绘制基础UI元素
  }
}
```

#### 7.2.4 监控方式

```typescript
interface IAssetLoadMetrics {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  retryCount: number;
  fallbackUsed: number;
  failedAssets: string[];
  avgLoadTime: number;
}

class AssetLoadProfiler {
  private _metrics: IAssetLoadMetrics;
  private _loadTimes: Map<string, number> = new Map();
  
  trackLoadStart(key: string): void {
    this._loadTimes.set(key, performance.now());
  }
  
  trackLoadComplete(key: string, success: boolean): void {
    const startTime = this._loadTimes.get(key);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric(key, success, duration);
    }
  }
  
  getLoadSuccessRate(): number {
    return this._metrics.successCount / this._metrics.totalAttempts;
  }
}
```

---

### 7.3 存档损坏处理

#### 7.3.1 定义

**存档损坏**: 存档数据无法正常读取、解析或验证失败的情况。

包括：
- JSON 解析错误
- Schema 验证失败
- 版本不兼容
- 数据完整性校验失败
- IndexedDB 访问错误

#### 7.3.2 阈值定义

| 损坏类型 | 检测方式 | 恢复优先级 | 可恢复性 |
|---------|---------|-----------|---------|
| JSON解析错误 | try-catch | HIGH | 尝试修复JSON |
| Schema不匹配 | 校验器 | MEDIUM | 版本迁移 |
| 版本过低 | version字段 | MEDIUM | 自动迁移 |
| 校验和错误 | checksum | HIGH | 回滚到备份 |
| DB访问错误 | try-catch | CRITICAL | 重建DB |

#### 7.3.3 降级策略

```typescript
enum SaveRecoveryAction {
  MIGRATE = 'migrate',        // 版本迁移
  REPAIR = 'repair',          // 尝试修复
  ROLLBACK = 'rollback',      // 回滚到备份
  RESET = 'reset',            // 重置为新存档
  MANUAL = 'manual',          // 需要用户决定
}

interface ISaveRecoveryStrategy {
  errorType: string;
  recoveryAction: SaveRecoveryAction;
  backupRequired: boolean;
  userConfirmation: boolean;
  notification: string;
}

const SAVE_RECOVERY_STRATEGIES: ISaveRecoveryStrategy[] = [
  {
    errorType: 'parse_error',
    recoveryAction: SaveRecoveryAction.REPAIR,
    backupRequired: true,
    userConfirmation: false,
    notification: '存档数据已自动修复',
  },
  {
    errorType: 'version_mismatch',
    recoveryAction: SaveRecoveryAction.MIGRATE,
    backupRequired: true,
    userConfirmation: false,
    notification: '存档已升级到新版本',
  },
  {
    errorType: 'checksum_failed',
    recoveryAction: SaveRecoveryAction.ROLLBACK,
    backupRequired: false,
    userConfirmation: true,
    notification: '存档数据异常，是否恢复到上次备份？',
  },
  {
    errorType: 'db_error',
    recoveryAction: SaveRecoveryAction.RESET,
    backupRequired: false,
    userConfirmation: true,
    notification: '存档系统错误，需要重置。这将丢失所有进度。',
  },
];

// 存档恢复管理器
class SaveRecoveryManager {
  private _backupSlots: string[] = ['backup_1', 'backup_2', 'backup_3'];
  
  async attemptRecovery(slotId: string, error: Error): Promise<ISaveData | null> {
    const errorType = this.classifyError(error);
    const strategy = SAVE_RECOVERY_STRATEGIES.find(s => s.errorType === errorType);
    
    if (!strategy) {
      console.error('[Save] Unknown error type:', errorType);
      return null;
    }
    
    // 创建备份（如果需要）
    if (strategy.backupRequired) {
      await this.createBackup(slotId);
    }
    
    // 用户确认（如果需要）
    if (strategy.userConfirmation) {
      const confirmed = await this.showConfirmDialog(strategy.notification);
      if (!confirmed) return null;
    }
    
    // 执行恢复
    switch (strategy.recoveryAction) {
      case SaveRecoveryAction.MIGRATE:
        return this.migrateData(slotId);
      case SaveRecoveryAction.REPAIR:
        return this.repairData(slotId);
      case SaveRecoveryAction.ROLLBACK:
        return this.rollbackToBackup(slotId);
      case SaveRecoveryAction.RESET:
        return this.createFreshSave();
      default:
        return null;
    }
  }
  
  private async migrateData(slotId: string): Promise<ISaveData | null> {
    // 版本迁移逻辑
    const rawData = await this.getRawData(slotId);
    const version = rawData?.version || 0;
    
    // 逐版本迁移
    let migrated = rawData;
    for (let v = version; v < CURRENT_SAVE_VERSION; v++) {
      const migrator = SAVE_MIGRATORS[v];
      if (migrator) {
        migrated = migrator(migrated);
      }
    }
    
    return migrated;
  }
  
  private async createBackup(slotId: string): Promise<void> {
    // 轮转备份
    for (let i = this._backupSlots.length - 1; i > 0; i--) {
      const from = this._backupSlots[i - 1];
      const to = this._backupSlots[i];
      await this.copySlot(from, to);
    }
    await this.copySlot(slotId, this._backupSlots[0]);
  }
}

// 存档校验器
class SaveValidator {
  validate(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 结构校验
    if (!this.isObject(data)) {
      errors.push('数据不是有效对象');
      return { valid: false, errors };
    }
    
    const save = data as Record<string, unknown>;
    
    // 必需字段校验
    const requiredFields = ['version', 'timestamp', 'progress', 'world'];
    for (const field of requiredFields) {
      if (!(field in save)) {
        errors.push(`缺少必需字段: ${field}`);
      }
    }
    
    // 版本校验
    if (typeof save.version !== 'number' || save.version > CURRENT_SAVE_VERSION) {
      errors.push(`无效的存档版本: ${save.version}`);
    }
    
    // 数据完整性校验
    if (save.checksum && !this.verifyChecksum(save)) {
      errors.push('数据完整性校验失败');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  private verifyChecksum(save: Record<string, unknown>): boolean {
    const stored = save.checksum as string;
    const computed = this.computeChecksum(save);
    return stored === computed;
  }
}
```

#### 7.3.4 监控方式

```typescript
interface ISaveMetrics {
  saveAttempts: number;
  saveSuccess: number;
  saveFailed: number;
  loadAttempts: number;
  loadSuccess: number;
  loadFailed: number;
  recoveryAttempts: number;
  recoverySuccess: number;
  corruptionDetected: number;
  migrationsPerformed: number;
}

class SaveProfiler {
  private _metrics: ISaveMetrics;
  
  recordSaveAttempt(success: boolean): void {
    this._metrics.saveAttempts++;
    if (success) {
      this._metrics.saveSuccess++;
    } else {
      this._metrics.saveFailed++;
    }
  }
  
  recordCorruption(errorType: string): void {
    this._metrics.corruptionDetected++;
    // 上报分析
  }
  
  getReliabilityScore(): number {
    const totalOps = this._metrics.saveAttempts + this._metrics.loadAttempts;
    const successOps = this._metrics.saveSuccess + this._metrics.loadSuccess;
    return totalOps > 0 ? successOps / totalOps : 1;
  }
}
```

---

### 7.4 内存不足处理

#### 7.4.1 定义

**内存不足**: 系统可用内存低于安全阈值，可能导致性能下降或应用崩溃。

#### 7.4.2 阈值定义

| 内存状态 | JS堆占用 | 总内存占用 | 紧急程度 |
|---------|---------|-----------|---------|
| 正常 | <50MB | <100MB | - |
| 警告 | 50-70MB | 100-140MB | LOW |
| 紧张 | 70-100MB | 140-180MB | MEDIUM |
| 危险 | 100-120MB | 180-200MB | HIGH |
| 临界 | >120MB | >200MB | CRITICAL |

#### 7.4.3 降级策略

```typescript
enum MemoryPressureLevel {
  NORMAL = 0,
  WARNING = 1,
  TENSE = 2,
  DANGER = 3,
  CRITICAL = 4,
}

interface IMemoryPressureResponse {
  level: MemoryPressureLevel;
  actions: Array<{
    action: string;
    priority: number;
    memoryGain: number;  // 预估释放量(MB)
  }>;
  userNotification?: string;
  autoSave: boolean;
}

const MEMORY_PRESSURE_RESPONSES: IMemoryPressureResponse[] = [
  {
    level: MemoryPressureLevel.WARNING,
    actions: [
      { action: '清理纹理缓存（非当前场景）', priority: 1, memoryGain: 10 },
      { action: '释放已完成的音频缓冲', priority: 2, memoryGain: 5 },
      { action: '压缩事件日志', priority: 3, memoryGain: 2 },
    ],
    autoSave: false,
  },
  {
    level: MemoryPressureLevel.TENSE,
    actions: [
      { action: '强制释放所有非必要纹理', priority: 1, memoryGain: 20 },
      { action: '禁用纹理预加载', priority: 2, memoryGain: 15 },
      { action: '降低纹理质量', priority: 3, memoryGain: 10 },
      { action: '清理对象池', priority: 4, memoryGain: 5 },
    ],
    userNotification: '内存使用较高，已优化资源占用',
    autoSave: true,
  },
  {
    level: MemoryPressureLevel.DANGER,
    actions: [
      { action: '紧急释放所有可释放资源', priority: 1, memoryGain: 30 },
      { action: '切换到最低画质', priority: 2, memoryGain: 15 },
      { action: '禁用所有特效', priority: 3, memoryGain: 10 },
      { action: '强制垃圾回收建议', priority: 4, memoryGain: 20 },
    ],
    userNotification: '内存不足，游戏已切换到低内存模式',
    autoSave: true,
  },
  {
    level: MemoryPressureLevel.CRITICAL,
    actions: [
      { action: '紧急保存游戏进度', priority: 0, memoryGain: 0 },
      { action: '卸载当前场景外所有资源', priority: 1, memoryGain: 50 },
      { action: '显示重启建议', priority: 2, memoryGain: 0 },
    ],
    userNotification: '内存严重不足，建议保存后重启应用',
    autoSave: true,
  },
];

// 内存压力管理器
class MemoryPressureManager {
  private _currentLevel: MemoryPressureLevel = MemoryPressureLevel.NORMAL;
  private _checkInterval = 5000;  // 5秒检查一次
  
  startMonitoring(): void {
    setInterval(() => this.checkMemoryPressure(), this._checkInterval);
    
    // 监听浏览器内存警告（如果支持）
    if ('memory' in navigator) {
      (navigator as any).memory.addEventListener?.('memorywarning', () => {
        this.handleBrowserMemoryWarning();
      });
    }
  }
  
  private checkMemoryPressure(): void {
    const usage = this.getMemoryUsage();
    const newLevel = this.calculatePressureLevel(usage.total);
    
    if (newLevel > this._currentLevel) {
      this.escalatePressure(newLevel);
    } else if (newLevel < this._currentLevel) {
      this.deescalatePressure(newLevel);
    }
  }
  
  private escalatePressure(level: MemoryPressureLevel): void {
    this._currentLevel = level;
    const response = MEMORY_PRESSURE_RESPONSES.find(r => r.level === level);
    
    if (response) {
      // 按优先级执行动作
      const sortedActions = [...response.actions].sort((a, b) => a.priority - b.priority);
      
      for (const action of sortedActions) {
        this.executeAction(action);
      }
      
      if (response.autoSave) {
        this.triggerAutoSave();
      }
      
      if (response.userNotification) {
        this.showNotification(response.userNotification);
      }
    }
  }
  
  private executeAction(action: { action: string; priority: number; memoryGain: number }): void {
    console.log(`[Memory] Executing: ${action.action} (expected gain: ${action.memoryGain}MB)`);
    // 执行具体动作
  }
}
```

#### 7.4.4 监控方式

```typescript
interface IMemoryPressureMetrics {
  peakMemory: number;
  avgMemory: number;
  pressureEvents: Array<{
    level: MemoryPressureLevel;
    timestamp: number;
    duration: number;
  }>;
  gcSuggestions: number;
  emergencySaves: number;
}

class MemoryPressureProfiler {
  private _metrics: IMemoryPressureMetrics;
  private _pressureStart: number = 0;
  
  recordPressureEvent(level: MemoryPressureLevel): void {
    if (level > MemoryPressureLevel.NORMAL && this._pressureStart === 0) {
      this._pressureStart = Date.now();
    }
    
    if (level === MemoryPressureLevel.NORMAL && this._pressureStart > 0) {
      const duration = Date.now() - this._pressureStart;
      this._metrics.pressureEvents.push({
        level,
        timestamp: this._pressureStart,
        duration,
      });
      this._pressureStart = 0;
    }
  }
  
  getMemoryHealth(): 'good' | 'fair' | 'poor' {
    const recentEvents = this._metrics.pressureEvents.filter(
      e => e.timestamp > Date.now() - 60000  // 最近1分钟
    );
    
    if (recentEvents.length === 0) return 'good';
    if (recentEvents.some(e => e.level >= MemoryPressureLevel.DANGER)) return 'poor';
    return 'fair';
  }
}
```

---

### 7.5 未预期状态恢复

#### 7.5.1 定义

**未预期状态**: 游戏进入非预期的状态，如：
- 状态机进入无效状态
- 计数器超出预期范围
- 场景对象异常
- 事件系统死锁
- 无限循环检测

#### 7.5.2 阈值定义

| 异常类型 | 检测条件 | 严重性 | 恢复方式 |
|---------|---------|-------|---------|
| 无效状态 | 状态不在枚举内 | HIGH | 回退到默认状态 |
| 计数器越界 | R>15 或 P>20 或 W<0 | MEDIUM | 钳制到有效范围 |
| 对象异常 | null/undefined 访问 | HIGH | 重建对象 |
| 事件死锁 | 事件处理超时(>5s) | CRITICAL | 强制中断+重置 |
| 无限循环 | 同一事件触发>100次/秒 | CRITICAL | 禁用事件源 |

#### 7.5.3 降级策略

```typescript
interface IStateRecoveryRule {
  errorPattern: string;
  detection: () => boolean;
  recovery: () => void;
  fallbackState: string;
  logLevel: 'warn' | 'error' | 'critical';
}

const STATE_RECOVERY_RULES: IStateRecoveryRule[] = [
  {
    errorPattern: 'invalid_game_state',
    detection: () => !VALID_GAME_STATES.includes(currentState),
    recovery: () => { currentState = GameState.IDLE; },
    fallbackState: 'IDLE',
    logLevel: 'error',
  },
  {
    errorPattern: 'counter_overflow',
    detection: () => worldState.counters.R > 15 || worldState.counters.P > 20,
    recovery: () => {
      worldState.counters.R = Math.min(15, worldState.counters.R);
      worldState.counters.P = Math.min(20, worldState.counters.P);
    },
    fallbackState: 'clamped',
    logLevel: 'warn',
  },
  {
    errorPattern: 'event_deadlock',
    detection: () => eventBus.processingTime > 5000,
    recovery: () => {
      eventBus.forceReset();
      eventBus.emit('system:recovered');
    },
    fallbackState: 'event_reset',
    logLevel: 'critical',
  },
];

// 状态守护者
class StateGuardian {
  private _checkInterval = 1000;
  private _eventCounters: Map<string, number> = new Map();
  private _lastCheck = Date.now();
  
  startGuarding(): void {
    setInterval(() => this.performHealthCheck(), this._checkInterval);
  }
  
  private performHealthCheck(): void {
    for (const rule of STATE_RECOVERY_RULES) {
      if (rule.detection()) {
        this.handleAnomalyDetected(rule);
      }
    }
    
    // 检查事件频率
    this.checkEventFrequency();
    
    this._lastCheck = Date.now();
  }
  
  private handleAnomalyDetected(rule: IStateRecoveryRule): void {
    console[rule.logLevel](`[StateGuard] Anomaly detected: ${rule.errorPattern}`);
    
    // 记录异常
    this.logAnomaly(rule.errorPattern);
    
    // 尝试恢复
    try {
      rule.recovery();
      console.log(`[StateGuard] Recovered to: ${rule.fallbackState}`);
    } catch (e) {
      console.error('[StateGuard] Recovery failed:', e);
      this.escalateToUser(rule.errorPattern);
    }
  }
  
  private checkEventFrequency(): void {
    const now = Date.now();
    const elapsed = (now - this._lastCheck) / 1000;  // 秒
    
    for (const [event, count] of this._eventCounters) {
      const rate = count / elapsed;
      if (rate > 100) {  // 超过100次/秒
        console.critical(`[StateGuard] Event flood detected: ${event} (${rate}/s)`);
        eventBus.disableEvent(event);
        this.showNotification(`检测到异常事件，已自动修复`);
      }
    }
    
    this._eventCounters.clear();
  }
  
  // 事件计数器
  recordEvent(eventName: string): void {
    const count = this._eventCounters.get(eventName) || 0;
    this._eventCounters.set(eventName, count + 1);
  }
  
  private escalateToUser(errorPattern: string): void {
    // 显示用户友好的错误信息和建议
    this.showNotification(
      '游戏遇到了一些问题，建议保存后重新启动。',
      'warning'
    );
  }
}

// 断言和边界检查
class SafetyChecks {
  static assertValidState<T>(value: T, validValues: T[], fallback: T): T {
    if (validValues.includes(value)) {
      return value;
    }
    console.warn(`[Safety] Invalid state: ${value}, falling back to: ${fallback}`);
    return fallback;
  }
  
  static clamp(value: number, min: number, max: number): number {
    if (value < min) {
      console.warn(`[Safety] Value ${value} below min ${min}, clamping`);
      return min;
    }
    if (value > max) {
      console.warn(`[Safety] Value ${value} above max ${max}, clamping`);
      return max;
    }
    return value;
  }
  
  static safeAccess<T, K extends keyof T>(obj: T | null | undefined, key: K, fallback: T[K]): T[K] {
    try {
      if (obj != null && key in obj) {
        return obj[key];
      }
    } catch {
      // 访问异常
    }
    console.warn(`[Safety] Safe access fallback for key: ${String(key)}`);
    return fallback;
  }
}
```

#### 7.5.4 监控方式

```typescript
interface IStateHealthMetrics {
  anomaliesDetected: number;
  recoveryAttempts: number;
  recoverySuccess: number;
  escalations: number;
  eventFloodDetected: number;
  invalidStatesEncountered: string[];
}

class StateHealthProfiler {
  private _metrics: IStateHealthMetrics = {
    anomaliesDetected: 0,
    recoveryAttempts: 0,
    recoverySuccess: 0,
    escalations: 0,
    eventFloodDetected: 0,
    invalidStatesEncountered: [],
  };
  
  recordAnomaly(pattern: string, recovered: boolean): void {
    this._metrics.anomaliesDetected++;
    this._metrics.recoveryAttempts++;
    
    if (recovered) {
      this._metrics.recoverySuccess++;
    } else {
      this._metrics.escalations++;
    }
    
    if (!this._metrics.invalidStatesEncountered.includes(pattern)) {
      this._metrics.invalidStatesEncountered.push(pattern);
    }
  }
  
  getSystemStability(): number {
    if (this._metrics.anomaliesDetected === 0) return 1;
    return this._metrics.recoverySuccess / this._metrics.anomaliesDetected;
  }
  
  generateHealthReport(): string {
    return `
# 系统健康报告
- 检测到的异常: ${this._metrics.anomaliesDetected}
- 恢复成功率: ${(this.getSystemStability() * 100).toFixed(1)}%
- 用户升级次数: ${this._metrics.escalations}
- 事件洪泛检测: ${this._metrics.eventFloodDetected}
- 遇到的无效状态: ${this._metrics.invalidStatesEncountered.join(', ')}
    `;
  }
}
```

---

## 8. 性能监控仪表盘

### 8.1 实时指标面板

```typescript
interface IPerformanceDashboard {
  fps: {
    current: number;
    avg: number;
    min: number;
    tier: PerformanceTier;
  };
  memory: {
    jsHeap: number;
    texture: number;
    total: number;
    trend: 'stable' | 'growing' | 'critical';
  };
  loading: {
    lastSceneTime: number;
    avgSceneTime: number;
    failedResources: number;
  };
  network: {
    state: NetworkState;
    latency: number;
    successRate: number;
  };
  state: {
    anomalies: number;
    stability: number;
  };
}

// 开发环境性能面板
class PerformanceOverlay {
  private _container: Phaser.GameObjects.Container;
  private _texts: Map<string, Phaser.GameObjects.Text> = new Map();
  private _visible = false;
  
  create(scene: Phaser.Scene): void {
    this._container = scene.add.container(10, 10);
    this._container.setDepth(9999);
    this._container.setScrollFactor(0);
    
    const metrics = [
      'FPS', 'Memory', 'Loading', 'Network', 'State'
    ];
    
    metrics.forEach((metric, i) => {
      const text = scene.add.text(0, i * 20, `${metric}: --`, {
        fontSize: '14px',
        backgroundColor: '#00000080',
        padding: { x: 4, y: 2 },
      });
      this._texts.set(metric, text);
      this._container.add(text);
    });
    
    this._container.setVisible(this._visible);
  }
  
  update(dashboard: IPerformanceDashboard): void {
    this._texts.get('FPS')?.setText(
      `FPS: ${dashboard.fps.current.toFixed(0)} (avg: ${dashboard.fps.avg.toFixed(0)}) [${dashboard.fps.tier}]`
    );
    this._texts.get('Memory')?.setText(
      `Mem: ${dashboard.memory.total.toFixed(0)}MB (${dashboard.memory.trend})`
    );
    this._texts.get('Loading')?.setText(
      `Load: ${dashboard.loading.avgSceneTime.toFixed(0)}ms, Failed: ${dashboard.loading.failedResources}`
    );
    this._texts.get('Network')?.setText(
      `Net: ${dashboard.network.state} (${dashboard.network.latency.toFixed(0)}ms)`
    );
    this._texts.get('State')?.setText(
      `State: ${(dashboard.state.stability * 100).toFixed(0)}% stable, ${dashboard.state.anomalies} anomalies`
    );
  }
  
  toggle(): void {
    this._visible = !this._visible;
    this._container.setVisible(this._visible);
  }
}
```

### 8.2 性能日志上报

```typescript
interface IPerformanceReport {
  sessionId: string;
  timestamp: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    memory?: number;
    cores?: number;
  };
  metrics: {
    fps: IPerformanceMetrics;
    memory: IMemoryMetrics;
    loading: ILoadingMetrics;
    network: INetworkMetrics;
    state: IStateHealthMetrics;
  };
  events: Array<{
    type: string;
    timestamp: number;
    data: Record<string, unknown>;
  }>;
}

// 性能上报（本地存储 + 可选远程）
class PerformanceReporter {
  private _buffer: IPerformanceReport[] = [];
  private _maxBufferSize = 10;
  
  queueReport(report: IPerformanceReport): void {
    this._buffer.push(report);
    
    if (this._buffer.length >= this._maxBufferSize) {
      this.flush();
    }
  }
  
  private async flush(): Promise<void> {
    const reports = [...this._buffer];
    this._buffer = [];
    
    // 存储到 IndexedDB
    await this.storeLocally(reports);
    
    // 可选：上报到服务器
    // await this.uploadToServer(reports);
  }
  
  private async storeLocally(reports: IPerformanceReport[]): Promise<void> {
    // 使用 IndexedDB 存储
  }
}
```

---

## 9. 附录

### 9.1 性能检查清单

#### 发布前检查

- [ ] 所有设备等级目标帧率达标
- [ ] 首屏加载时间 ≤3s (4G)
- [ ] 内存峰值 ≤100MB
- [ ] 无资源加载失败（或已有降级方案）
- [ ] 存档系统通过损坏恢复测试
- [ ] 网络断开后可离线运行

#### 每次提交检查

- [ ] 无新增内存泄漏
- [ ] 无新增帧率下降
- [ ] 异常处理覆盖所有新增代码路径

### 9.2 性能测试脚本

```typescript
// 性能测试入口
async function runPerformanceTests(): Promise<void> {
  console.log('=== Performance Test Suite ===');
  
  // 1. 帧率测试
  await testFrameRate();
  
  // 2. 加载时间测试
  await testLoadingTimes();
  
  // 3. 内存压力测试
  await testMemoryPressure();
  
  // 4. 异常恢复测试
  await testExceptionRecovery();
  
  console.log('=== Tests Complete ===');
}

async function testFrameRate(): Promise<void> {
  console.log('Testing frame rate...');
  // 运行60秒，记录帧率
}

async function testLoadingTimes(): Promise<void> {
  console.log('Testing loading times...');
  // 遍历所有场景，测量加载时间
}

async function testMemoryPressure(): Promise<void> {
  console.log('Testing memory pressure...');
  // 模拟内存压力，验证降级
}

async function testExceptionRecovery(): Promise<void> {
  console.log('Testing exception recovery...');
  // 模拟各种异常，验证恢复
}
```

### 9.3 相关文档

| 文档 | 路径 |
|------|------|
| 技术总纲 | `design/ai-native/01_bibles/tech_bible.md` |
| 完整TDD | `design/game/05-tech/技术设计文档TDD_v1.md` |
| UI规范 | `.cursor/rules/08-ui-qa-rules.mdc` |
| 测试规范 | `.cursor/rules/04-testing.mdc` |

---

*文档版本: v1.0*  
*创建日期: 2026-01-19*  
*状态: 草案*

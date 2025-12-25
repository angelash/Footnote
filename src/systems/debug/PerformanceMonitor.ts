/**
 * 性能监控系统
 * 追踪帧率、内存、加载时间等关键指标
 * @module systems/debug/PerformanceMonitor
 */

import Phaser from 'phaser';

export interface IPerformanceMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  frameTime: number;
  heapUsed: number;
  heapTotal: number;
  drawCalls: number;
  gameObjects: number;
  textures: number;
  sounds: number;
}

export interface ILoadMetrics {
  totalLoadTime: number;
  assetsLoaded: number;
  assetsFailed: number;
  breakdown: {
    images: number;
    audio: number;
    data: number;
  };
}

interface IFpsHistory {
  values: number[];
  index: number;
  sum: number;
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private _scene: Phaser.Scene | null = null;
  private _isEnabled: boolean = false;
  private _overlay: HTMLDivElement | null = null;
  
  // FPS追踪
  private _fpsHistory: IFpsHistory = {
    values: new Array(60).fill(60),
    index: 0,
    sum: 3600,
  };
  private _minFps: number = 60;
  private _maxFps: number = 60;
  
  // 加载追踪
  private _loadStartTime: number = 0;
  private _loadMetrics: ILoadMetrics = {
    totalLoadTime: 0,
    assetsLoaded: 0,
    assetsFailed: 0,
    breakdown: { images: 0, audio: 0, data: 0 },
  };
  
  // 更新间隔
  private _updateInterval: number = 500; // ms
  private _lastUpdate: number = 0;

  /**
   * 启用监控
   */
  public enable(scene: Phaser.Scene): void {
    this._scene = scene;
    this._isEnabled = true;
    this._createOverlay();
    console.log('[PerformanceMonitor] 已启用');
  }

  /**
   * 禁用监控
   */
  public disable(): void {
    this._isEnabled = false;
    this._removeOverlay();
    console.log('[PerformanceMonitor] 已禁用');
  }

  /**
   * 切换显示
   */
  public toggle(scene?: Phaser.Scene): void {
    if (this._isEnabled) {
      this.disable();
    } else if (scene) {
      this.enable(scene);
    }
  }

  /**
   * 更新（每帧调用）
   */
  public update(time: number, delta: number): void {
    if (!this._isEnabled || !this._scene) return;

    // 更新FPS历史
    const fps = Math.round(1000 / delta);
    this._updateFpsHistory(fps);

    // 定期更新显示
    if (time - this._lastUpdate >= this._updateInterval) {
      this._lastUpdate = time;
      this._updateDisplay();
    }
  }

  /**
   * 更新FPS历史
   */
  private _updateFpsHistory(fps: number): void {
    const old = this._fpsHistory.values[this._fpsHistory.index];
    this._fpsHistory.sum -= old;
    this._fpsHistory.sum += fps;
    this._fpsHistory.values[this._fpsHistory.index] = fps;
    this._fpsHistory.index = (this._fpsHistory.index + 1) % 60;

    // 更新极值
    if (fps < this._minFps) this._minFps = fps;
    if (fps > this._maxFps) this._maxFps = fps;
  }

  /**
   * 获取当前指标
   */
  public getMetrics(): IPerformanceMetrics {
    if (!this._scene) {
      return this._getEmptyMetrics();
    }

    const game = this._scene.game;
    const fps = Math.round(game.loop.actualFps);
    const avgFps = Math.round(this._fpsHistory.sum / 60);

    // 内存信息（如果可用）
    const memory = (performance as any).memory;
    const heapUsed = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
    const heapTotal = memory ? Math.round(memory.totalJSHeapSize / 1024 / 1024) : 0;

    return {
      fps,
      avgFps,
      minFps: this._minFps,
      maxFps: this._maxFps,
      frameTime: Math.round(game.loop.delta * 100) / 100,
      heapUsed,
      heapTotal,
      drawCalls: this._getDrawCalls(),
      gameObjects: this._scene.children.length,
      textures: game.textures.list ? Object.keys(game.textures.list).length : 0,
      sounds: (game.sound as any).sounds?.length ?? 0,
    };
  }

  /**
   * 获取空指标
   */
  private _getEmptyMetrics(): IPerformanceMetrics {
    return {
      fps: 0,
      avgFps: 0,
      minFps: 0,
      maxFps: 0,
      frameTime: 0,
      heapUsed: 0,
      heapTotal: 0,
      drawCalls: 0,
      gameObjects: 0,
      textures: 0,
      sounds: 0,
    };
  }

  /**
   * 获取绘制调用数（近似）
   */
  private _getDrawCalls(): number {
    if (!this._scene) return 0;
    // Phaser没有直接暴露drawCalls，这里返回可见对象数作为近似
    let count = 0;
    this._scene.children.each((child) => {
      if ((child as any).visible) count++;
    });
    return count;
  }

  /**
   * 开始追踪加载
   */
  public startLoadTracking(): void {
    this._loadStartTime = performance.now();
    this._loadMetrics = {
      totalLoadTime: 0,
      assetsLoaded: 0,
      assetsFailed: 0,
      breakdown: { images: 0, audio: 0, data: 0 },
    };
  }

  /**
   * 记录资源加载
   */
  public recordAssetLoad(type: 'images' | 'audio' | 'data', success: boolean): void {
    if (success) {
      this._loadMetrics.assetsLoaded++;
      this._loadMetrics.breakdown[type]++;
    } else {
      this._loadMetrics.assetsFailed++;
    }
  }

  /**
   * 结束加载追踪
   */
  public endLoadTracking(): ILoadMetrics {
    this._loadMetrics.totalLoadTime = Math.round(performance.now() - this._loadStartTime);
    console.log('[PerformanceMonitor] 加载完成:', this._loadMetrics);
    return this._loadMetrics;
  }

  /**
   * 获取加载指标
   */
  public getLoadMetrics(): ILoadMetrics {
    return { ...this._loadMetrics };
  }

  /**
   * 创建覆盖层
   */
  private _createOverlay(): void {
    if (this._overlay) return;

    this._overlay = document.createElement('div');
    this._overlay.id = 'perf-monitor';
    this._overlay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(10, 10, 15, 0.9);
      color: #e8e6e3;
      font-family: monospace;
      font-size: 11px;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #4a9eff;
      z-index: 9999;
      pointer-events: none;
      min-width: 150px;
    `;

    document.body.appendChild(this._overlay);
  }

  /**
   * 移除覆盖层
   */
  private _removeOverlay(): void {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }

  /**
   * 更新显示
   */
  private _updateDisplay(): void {
    if (!this._overlay) return;

    const m = this.getMetrics();
    
    // FPS颜色
    let fpsColor = '#00ffaa';
    if (m.fps < 30) fpsColor = '#ff4444';
    else if (m.fps < 50) fpsColor = '#ffaa00';

    this._overlay.innerHTML = `
      <div style="color: ${fpsColor}; font-weight: bold;">
        FPS: ${m.fps} (avg: ${m.avgFps})
      </div>
      <div style="color: #888; font-size: 10px;">
        min: ${m.minFps} / max: ${m.maxFps}
      </div>
      <div style="margin-top: 4px; border-top: 1px solid #333; padding-top: 4px;">
        <div>Frame: ${m.frameTime}ms</div>
        <div>Objects: ${m.gameObjects}</div>
        <div>Textures: ${m.textures}</div>
        <div>Sounds: ${m.sounds}</div>
        ${m.heapUsed > 0 ? `<div>Memory: ${m.heapUsed}/${m.heapTotal}MB</div>` : ''}
      </div>
    `;
  }

  /**
   * 重置极值
   */
  public resetExtremes(): void {
    this._minFps = 60;
    this._maxFps = 60;
  }

  /**
   * 导出报告
   */
  public exportReport(): string {
    const metrics = this.getMetrics();
    const loadMetrics = this.getLoadMetrics();
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      performance: metrics,
      loading: loadMetrics,
      userAgent: navigator.userAgent,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }, null, 2);
  }
}

// 单例导出
export const performanceMonitor = new PerformanceMonitor();


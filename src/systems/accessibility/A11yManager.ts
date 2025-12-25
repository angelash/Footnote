/**
 * 可访问性管理器
 * 支持屏幕阅读器、高对比度、字体大小调整等
 * @module systems/accessibility/A11yManager
 */

import { eventBus, GameEvent } from '@/systems/EventBus';

export interface IA11ySettings {
  /** 高对比度模式 */
  highContrast: boolean;
  /** 大字体模式 */
  largeText: boolean;
  /** 减少动画 */
  reduceMotion: boolean;
  /** 屏幕阅读器支持 */
  screenReaderSupport: boolean;
  /** 字幕显示 */
  showCaptions: boolean;
  /** 按键重映射 */
  keyRemapping: Record<string, string>;
  /** 色盲模式 */
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

const DEFAULT_SETTINGS: IA11ySettings = {
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  screenReaderSupport: false,
  showCaptions: true,
  keyRemapping: {},
  colorBlindMode: 'none',
};

/**
 * 可访问性管理器
 */
class A11yManager {
  private _settings: IA11ySettings;
  private _liveRegion: HTMLDivElement | null = null;
  private _focusTrapElement: HTMLElement | null = null;

  constructor() {
    this._settings = this._loadSettings();
    this._detectSystemPreferences();
    this._createLiveRegion();
    this._applySettings();
  }

  /**
   * 加载设置
   */
  private _loadSettings(): IA11ySettings {
    try {
      const stored = localStorage.getItem('footnote_a11y');
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('[A11y] 加载设置失败:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * 保存设置
   */
  private _saveSettings(): void {
    try {
      localStorage.setItem('footnote_a11y', JSON.stringify(this._settings));
    } catch (error) {
      console.error('[A11y] 保存设置失败:', error);
    }
  }

  /**
   * 检测系统偏好
   */
  private _detectSystemPreferences(): void {
    // 检测减少动画偏好
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._settings.reduceMotion = true;
    }

    // 检测高对比度偏好
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      this._settings.highContrast = true;
    }

    // 监听系统偏好变化
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.setSetting('reduceMotion', e.matches);
    });

    window.matchMedia('(prefers-contrast: more)').addEventListener('change', (e) => {
      this.setSetting('highContrast', e.matches);
    });
  }

  /**
   * 创建屏幕阅读器实时区域
   */
  private _createLiveRegion(): void {
    this._liveRegion = document.createElement('div');
    this._liveRegion.id = 'a11y-live-region';
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.setAttribute('aria-atomic', 'true');
    this._liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this._liveRegion);
  }

  /**
   * 应用设置
   */
  private _applySettings(): void {
    const root = document.documentElement;

    // 高对比度
    if (this._settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 大字体
    if (this._settings.largeText) {
      root.classList.add('large-text');
      root.style.setProperty('--font-scale', '1.25');
    } else {
      root.classList.remove('large-text');
      root.style.setProperty('--font-scale', '1');
    }

    // 减少动画
    if (this._settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // 色盲模式
    root.setAttribute('data-color-blind-mode', this._settings.colorBlindMode);

    // 注入CSS
    this._injectA11yStyles();
  }

  /**
   * 注入可访问性样式
   */
  private _injectA11yStyles(): void {
    const styleId = 'a11y-styles';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      /* 高对比度模式 */
      .high-contrast {
        --bg-primary: #000000;
        --bg-secondary: #1a1a1a;
        --text-primary: #ffffff;
        --text-secondary: #e0e0e0;
        --accent-color: #ffff00;
        --border-color: #ffffff;
      }
      
      .high-contrast #game-container canvas {
        filter: contrast(1.2);
      }

      /* 大字体模式 */
      .large-text {
        font-size: calc(16px * var(--font-scale, 1));
      }

      /* 减少动画 */
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      /* 焦点指示器 */
      *:focus-visible {
        outline: 3px solid var(--accent-color, #4a9eff);
        outline-offset: 2px;
      }

      /* 色盲模式滤镜 */
      [data-color-blind-mode="protanopia"] #game-container canvas {
        filter: url('#protanopia-filter');
      }
      
      [data-color-blind-mode="deuteranopia"] #game-container canvas {
        filter: url('#deuteranopia-filter');
      }
      
      [data-color-blind-mode="tritanopia"] #game-container canvas {
        filter: url('#tritanopia-filter');
      }

      /* 跳过链接 */
      .skip-link {
        position: absolute;
        top: -100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        background: #4a9eff;
        color: white;
        text-decoration: none;
        z-index: 10000;
        border-radius: 4px;
      }
      
      .skip-link:focus {
        top: 10px;
      }
    `;

    // 创建色盲模式SVG滤镜
    this._createColorBlindFilters();
  }

  /**
   * 创建色盲模式滤镜
   */
  private _createColorBlindFilters(): void {
    const svgNS = 'http://www.w3.org/2000/svg';
    const filterId = 'a11y-filters';
    
    if (document.getElementById(filterId)) return;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.id = filterId;
    svg.style.cssText = 'position: absolute; width: 0; height: 0;';
    
    // 红色盲（Protanopia）
    svg.innerHTML = `
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0,     0, 0
            0.558, 0.442, 0,     0, 0
            0,     0.242, 0.758, 0, 0
            0,     0,     0,     1, 0
          "/>
        </filter>
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0,   0, 0
            0.7,   0.3,   0,   0, 0
            0,     0.3,   0.7, 0, 0
            0,     0,     0,   1, 0
          "/>
        </filter>
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.95, 0.05,  0,     0, 0
            0,    0.433, 0.567, 0, 0
            0,    0.475, 0.525, 0, 0
            0,    0,     0,     1, 0
          "/>
        </filter>
      </defs>
    `;
    
    document.body.appendChild(svg);
  }

  /**
   * 获取设置
   */
  public getSettings(): IA11ySettings {
    return { ...this._settings };
  }

  /**
   * 设置单个选项
   */
  public setSetting<K extends keyof IA11ySettings>(key: K, value: IA11ySettings[K]): void {
    this._settings[key] = value;
    this._saveSettings();
    this._applySettings();
    
    eventBus.emit(GameEvent.SETTINGS_UPDATE, { settings: { a11y: { [key]: value } } });
    console.log(`[A11y] 设置更新: ${key} = ${value}`);
  }

  /**
   * 重置设置
   */
  public resetSettings(): void {
    this._settings = { ...DEFAULT_SETTINGS };
    this._saveSettings();
    this._applySettings();
  }

  /**
   * 向屏幕阅读器播报
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this._liveRegion) return;

    this._liveRegion.setAttribute('aria-live', priority);
    this._liveRegion.textContent = '';
    
    // 短暂延迟确保屏幕阅读器能捕获变化
    requestAnimationFrame(() => {
      if (this._liveRegion) {
        this._liveRegion.textContent = message;
      }
    });
  }

  /**
   * 播报对话
   */
  public announceDialogue(speaker: string, text: string): void {
    if (this._settings.screenReaderSupport) {
      this.announce(`${speaker}说：${text}`);
    }
  }

  /**
   * 播报选项
   */
  public announceChoice(choices: string[]): void {
    if (this._settings.screenReaderSupport) {
      const message = `请选择：${choices.map((c, i) => `${i + 1}. ${c}`).join('；')}`;
      this.announce(message);
    }
  }

  /**
   * 播报系统消息
   */
  public announceSystem(message: string): void {
    if (this._settings.screenReaderSupport) {
      this.announce(message, 'assertive');
    }
  }

  /**
   * 设置焦点陷阱
   */
  public setFocusTrap(element: HTMLElement): void {
    this._focusTrapElement = element;
    
    // 找到所有可聚焦元素
    const focusables = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    element.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // 自动聚焦第一个元素
    first.focus();
  }

  /**
   * 释放焦点陷阱
   */
  public releaseFocusTrap(): void {
    this._focusTrapElement = null;
  }

  /**
   * 获取焦点陷阱元素
   */
  public getFocusTrap(): HTMLElement | null {
    return this._focusTrapElement;
  }

  /**
   * 获取重映射后的按键
   */
  public getMappedKey(originalKey: string): string {
    return this._settings.keyRemapping[originalKey] || originalKey;
  }

  /**
   * 设置按键重映射
   */
  public setKeyMapping(original: string, mapped: string): void {
    this._settings.keyRemapping[original] = mapped;
    this._saveSettings();
  }

  /**
   * 检查是否应该减少动画
   */
  public shouldReduceMotion(): boolean {
    return this._settings.reduceMotion;
  }

  /**
   * 检查是否高对比度模式
   */
  public isHighContrast(): boolean {
    return this._settings.highContrast;
  }

  /**
   * 获取动画持续时间（考虑减少动画设置）
   */
  public getAnimationDuration(normalDuration: number): number {
    return this._settings.reduceMotion ? 0 : normalDuration;
  }
}

// 单例导出
export const a11yManager = new A11yManager();


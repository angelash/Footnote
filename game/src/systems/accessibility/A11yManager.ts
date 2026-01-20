/**
 * 可访问性管理器
 * 支持屏幕阅读器、高对比度、字体大小调整、键盘导航等
 * @module systems/accessibility/A11yManager
 */

import { createLogger } from '@/utils/Logger';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { safeStorage } from '@/systems/storage';

const logger = createLogger('A11y');

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

/**
 * 可聚焦元素接口
 * 用于 Canvas UI 组件的键盘导航
 */
export interface IFocusableElement {
  /** 唯一标识符 */
  id: string;
  /** ARIA 标签（用于屏幕阅读器） */
  label: string;
  /** 聚焦时的回调 */
  onFocus: () => void;
  /** 失焦时的回调 */
  onBlur: () => void;
  /** 激活时的回调（Enter/Space） */
  onActivate: () => void;
  /** 是否可用 */
  enabled: boolean;
  /** 元素类型（用于播报） */
  role?: 'button' | 'menuitem' | 'option' | 'tab' | 'listitem';
}

/**
 * 焦点管理器配置
 */
export interface IFocusManagerConfig {
  /** 是否循环导航 */
  wrapAround?: boolean;
  /** 是否自动聚焦第一个元素 */
  autoFocus?: boolean;
  /** 组名称（用于播报） */
  groupName?: string;
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
 * 焦点组 - 管理一组可聚焦元素
 */
class FocusGroup {
  private _elements: IFocusableElement[] = [];
  private _currentIndex: number = -1;
  private _config: Required<IFocusManagerConfig>;
  private _manager: A11yManager;

  constructor(manager: A11yManager, config: IFocusManagerConfig = {}) {
    this._manager = manager;
    this._config = {
      wrapAround: config.wrapAround ?? true,
      autoFocus: config.autoFocus ?? true,
      groupName: config.groupName ?? '导航区域',
    };
  }

  /**
   * 添加可聚焦元素
   */
  add(element: IFocusableElement): void {
    this._elements.push(element);
    // 如果是第一个元素且配置了自动聚焦
    if (this._elements.length === 1 && this._config.autoFocus) {
      this.focusFirst();
    }
  }

  /**
   * 移除可聚焦元素
   */
  remove(id: string): void {
    const index = this._elements.findIndex((e) => e.id === id);
    if (index > -1) {
      this._elements.splice(index, 1);
      if (this._currentIndex >= this._elements.length) {
        this._currentIndex = this._elements.length - 1;
      }
    }
  }

  /**
   * 清空所有元素
   */
  clear(): void {
    if (this._currentIndex >= 0 && this._currentIndex < this._elements.length) {
      this._elements[this._currentIndex].onBlur();
    }
    this._elements = [];
    this._currentIndex = -1;
  }

  /**
   * 聚焦下一个元素
   */
  focusNext(): boolean {
    if (this._elements.length === 0) return false;

    // 找到下一个可用元素
    let nextIndex = this._currentIndex + 1;
    let attempts = 0;

    while (attempts < this._elements.length) {
      if (nextIndex >= this._elements.length) {
        if (this._config.wrapAround) {
          nextIndex = 0;
        } else {
          return false;
        }
      }

      if (this._elements[nextIndex].enabled) {
        this._focusElement(nextIndex);
        return true;
      }

      nextIndex++;
      attempts++;
    }

    return false;
  }

  /**
   * 聚焦上一个元素
   */
  focusPrevious(): boolean {
    if (this._elements.length === 0) return false;

    let prevIndex = this._currentIndex - 1;
    let attempts = 0;

    while (attempts < this._elements.length) {
      if (prevIndex < 0) {
        if (this._config.wrapAround) {
          prevIndex = this._elements.length - 1;
        } else {
          return false;
        }
      }

      if (this._elements[prevIndex].enabled) {
        this._focusElement(prevIndex);
        return true;
      }

      prevIndex--;
      attempts++;
    }

    return false;
  }

  /**
   * 聚焦第一个元素
   */
  focusFirst(): boolean {
    for (let i = 0; i < this._elements.length; i++) {
      if (this._elements[i].enabled) {
        this._focusElement(i);
        return true;
      }
    }
    return false;
  }

  /**
   * 聚焦最后一个元素
   */
  focusLast(): boolean {
    for (let i = this._elements.length - 1; i >= 0; i--) {
      if (this._elements[i].enabled) {
        this._focusElement(i);
        return true;
      }
    }
    return false;
  }

  /**
   * 通过索引聚焦元素（用于数字键直选）
   */
  focusByIndex(index: number): boolean {
    if (index >= 0 && index < this._elements.length && this._elements[index].enabled) {
      this._focusElement(index);
      return true;
    }
    return false;
  }

  /**
   * 通过 ID 聚焦元素
   */
  focusById(id: string): boolean {
    const index = this._elements.findIndex((e) => e.id === id);
    if (index >= 0 && this._elements[index].enabled) {
      this._focusElement(index);
      return true;
    }
    return false;
  }

  /**
   * 激活当前聚焦的元素
   */
  activateCurrent(): boolean {
    if (this._currentIndex >= 0 && this._currentIndex < this._elements.length) {
      const element = this._elements[this._currentIndex];
      if (element.enabled) {
        element.onActivate();
        return true;
      }
    }
    return false;
  }

  /**
   * 获取当前聚焦的元素
   */
  getCurrentElement(): IFocusableElement | null {
    if (this._currentIndex >= 0 && this._currentIndex < this._elements.length) {
      return this._elements[this._currentIndex];
    }
    return null;
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this._currentIndex;
  }

  /**
   * 获取元素数量
   */
  getCount(): number {
    return this._elements.length;
  }

  /**
   * 内部聚焦方法
   */
  private _focusElement(index: number): void {
    // 先失焦当前元素
    if (this._currentIndex >= 0 && this._currentIndex < this._elements.length) {
      this._elements[this._currentIndex].onBlur();
    }

    this._currentIndex = index;
    const element = this._elements[index];
    element.onFocus();

    // 播报元素信息
    this._manager.announceFocus(element, index + 1, this._elements.length);
  }
}

/**
 * 可访问性管理器
 */
class A11yManager {
  private _settings: IA11ySettings;
  private _liveRegion: HTMLDivElement | null = null;
  private _focusTrapElement: HTMLElement | null = null;
  private _activeFocusGroup: FocusGroup | null = null;
  private _focusGroups: Map<string, FocusGroup> = new Map();

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
    const stored = safeStorage.get<IA11ySettings>('a11y');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...stored };
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * 保存设置
   */
  private _saveSettings(): void {
    if (!safeStorage.set('a11y', this._settings)) {
      logger.error('保存设置失败');
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
   * SA-005: 使用 DOM API 替代 innerHTML
   * 注意：此处滤镜数据为静态常量，不包含用户输入
   */
  private _createColorBlindFilters(): void {
    const svgNS = 'http://www.w3.org/2000/svg';
    const filterId = 'a11y-filters';

    if (document.getElementById(filterId)) return;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.id = filterId;
    svg.style.cssText = 'position: absolute; width: 0; height: 0;';

    const defs = document.createElementNS(svgNS, 'defs');

    // 滤镜配置数据（静态常量，安全）
    const filterConfigs = [
      {
        id: 'protanopia-filter',
        values: '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
      },
      {
        id: 'deuteranopia-filter',
        values: '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',
      },
      {
        id: 'tritanopia-filter',
        values: '0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
      },
    ];

    for (const config of filterConfigs) {
      const filter = document.createElementNS(svgNS, 'filter');
      filter.id = config.id;

      const feColorMatrix = document.createElementNS(svgNS, 'feColorMatrix');
      feColorMatrix.setAttribute('type', 'matrix');
      feColorMatrix.setAttribute('values', config.values);

      filter.appendChild(feColorMatrix);
      defs.appendChild(filter);
    }

    svg.appendChild(defs);
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
    logger.debug(`设置更新: ${key} = ${value}`);
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
   * 播报焦点变化
   */
  public announceFocus(element: IFocusableElement, index: number, total: number): void {
    if (this._settings.screenReaderSupport) {
      const roleText = this._getRoleText(element.role);
      const position = total > 1 ? `，第 ${index} 项，共 ${total} 项` : '';
      this.announce(`${element.label}${roleText}${position}`);
    }
  }

  /**
   * 播报 Toast 消息
   */
  public announceToast(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    const typeText = {
      info: '提示',
      success: '成功',
      warning: '警告',
      error: '错误',
    };
    this.announce(`${typeText[type]}：${message}`, type === 'error' ? 'assertive' : 'polite');
  }

  /**
   * 播报成就解锁
   */
  public announceAchievement(title: string, description: string): void {
    this.announce(`成就解锁：${title}。${description}`, 'assertive');
  }

  /**
   * 播报 UI 状态变化
   */
  public announceUIState(componentName: string, state: 'opened' | 'closed'): void {
    if (this._settings.screenReaderSupport) {
      const stateText = state === 'opened' ? '已打开' : '已关闭';
      this.announce(`${componentName}${stateText}`);
    }
  }

  /**
   * 获取角色文本
   */
  private _getRoleText(role?: IFocusableElement['role']): string {
    if (!role) return '';
    const roleTexts: Record<string, string> = {
      button: '，按钮',
      menuitem: '，菜单项',
      option: '，选项',
      tab: '，标签',
      listitem: '，列表项',
    };
    return roleTexts[role] || '';
  }

  // ==================== 焦点组管理 ====================

  /**
   * 创建焦点组
   */
  public createFocusGroup(groupId: string, config?: IFocusManagerConfig): FocusGroup {
    const group = new FocusGroup(this, config);
    this._focusGroups.set(groupId, group);
    return group;
  }

  /**
   * 获取焦点组
   */
  public getFocusGroup(groupId: string): FocusGroup | undefined {
    return this._focusGroups.get(groupId);
  }

  /**
   * 设置活动焦点组
   */
  public setActiveFocusGroup(groupId: string): void {
    const group = this._focusGroups.get(groupId);
    if (group) {
      this._activeFocusGroup = group;
      logger.debug(`激活焦点组: ${groupId}`);
    }
  }

  /**
   * 清除活动焦点组
   */
  public clearActiveFocusGroup(): void {
    this._activeFocusGroup = null;
  }

  /**
   * 获取活动焦点组
   */
  public getActiveFocusGroup(): FocusGroup | null {
    return this._activeFocusGroup;
  }

  /**
   * 销毁焦点组
   */
  public destroyFocusGroup(groupId: string): void {
    const group = this._focusGroups.get(groupId);
    if (group) {
      group.clear();
      this._focusGroups.delete(groupId);
      if (this._activeFocusGroup === group) {
        this._activeFocusGroup = null;
      }
    }
  }

  /**
   * 处理键盘导航
   * 返回 true 表示事件已处理
   */
  public handleKeyboardNavigation(keyCode: string): boolean {
    if (!this._activeFocusGroup) return false;

    switch (keyCode) {
      case 'Tab':
        return this._activeFocusGroup.focusNext();
      case 'ShiftTab':
        return this._activeFocusGroup.focusPrevious();
      case 'ArrowDown':
      case 'ArrowRight':
        return this._activeFocusGroup.focusNext();
      case 'ArrowUp':
      case 'ArrowLeft':
        return this._activeFocusGroup.focusPrevious();
      case 'Enter':
      case 'Space':
        return this._activeFocusGroup.activateCurrent();
      case 'Home':
        return this._activeFocusGroup.focusFirst();
      case 'End':
        return this._activeFocusGroup.focusLast();
      default:
        // 数字键 1-9 直选
        if (/^Digit[1-9]$/.test(keyCode)) {
          const index = parseInt(keyCode.replace('Digit', ''), 10) - 1;
          if (this._activeFocusGroup.focusByIndex(index)) {
            return this._activeFocusGroup.activateCurrent();
          }
        }
        return false;
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

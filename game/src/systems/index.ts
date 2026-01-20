/**
 * 系统模块统一导出
 */

// 事件总线
export { eventBus, GameEvent } from './EventBus';
export type { IEventPayloads } from './EventBus';

// 世界状态
export { worldState } from './world';
export type {
  ICounters,
  IZoneState,
  IScar,
  IContamination,
  IActionRecord,
  IConditionConfig,
  IWorldStateData,
} from './world';

// 叙事引擎
export { narrativeEngine, CardCategory } from './narrative';
export type {
  IDialogueLine,
  IDialogueAction,
  IDialogueChoice,
  IDialogueData,
  ICard,
  ICardEffect,
  IForeshadow,
  IForeshadowState,
  ForeshadowStage,
  INarrativeState,
} from './narrative';

// 音频管理器
export { AudioManager } from './audio/AudioManager';

// 场景组装器
export { SceneAssembler } from './scene/SceneAssembler';

// UI系统
export { DialogueUI, CardUI, ToastManager, PauseMenu, InventoryUI } from './ui';
export type { ToastType } from './ui';

// 新增UI组件
export { RedundantFieldBar, FieldState } from './ui/RedundantFieldBar';
export { DepthEffects } from './ui/DepthEffects';
export { ForeshadowManager, ForeshadowStage as ForeshadowStageUI } from './ui/ForeshadowManager';
export { EndingEffects, EndingType } from './ui/EndingEffects';
export { AuditOverlay, AuditIntensity } from './ui/AuditOverlay';
export { VersionSwitchEffect } from './ui/VersionSwitchEffect';
export type { IVersionInfo } from './ui/VersionSwitchEffect';

// New Game+ 系统
export { newGamePlusManager } from './game/NewGamePlus';
export type { INewGamePlusState, INewGamePlusRewards } from './game/NewGamePlus';

// 成就系统
export {
  AchievementManager,
  AchievementCategory,
  AchievementRarity,
} from './game/AchievementSystem';
export type { IAchievement, IAchievementState } from './game/AchievementSystem';

// 教程管理器
export { TutorialManager, TutorialStep } from './game/TutorialManager';

// 触控输入
export { TouchControls } from './input/TouchControls';
export type { ITouchControlsConfig } from './input/TouchControls';

// 操作指引
export { ControlHints } from './ui/ControlHints';
export type { IControlHintsConfig } from './ui/ControlHints';

// 交互提示
export { InteractionPrompt } from './ui/InteractionPrompt';
export type { IInteractionPromptConfig } from './ui/InteractionPrompt';

// 国际化
export { i18n, t, LOCALE_NAMES } from './i18n/I18nManager';
export type { SupportedLocale } from './i18n/I18nManager';

// 性能监控
export { performanceMonitor, PerformanceMonitor } from './debug/PerformanceMonitor';
export type { IPerformanceMetrics, ILoadMetrics } from './debug/PerformanceMonitor';

// 调试命令系统
export { debugCommands } from './debug/DebugCommands';
export type {
  ICommandResult,
  ITestStep,
  IExpectation,
  ITestScript,
  ITestResult,
} from './debug/DebugCommands';

// 可访问性
export { a11yManager } from './accessibility/A11yManager';
export type { IA11ySettings } from './accessibility/A11yManager';

// 数据统计
export { analyticsManager } from './analytics/AnalyticsManager';
export type { IAnalyticsEvent, ISessionData, IAnalyticsConfig } from './analytics/AnalyticsManager';

// 云存档
export { cloudSaveManager } from './cloud/CloudSaveManager';
export type { ICloudSaveConfig, ICloudSaveMetadata, ISyncResult } from './cloud/CloudSaveManager';

// 能力系统
export { AbilitySystem } from './ability';

// 存档系统
export { saveManager } from './save';
export type { IGameSettings, ISaveData, ISaveMetadata } from './save';

// 安全存储
export { safeStorage, safeGet, safeSet, safeRemove } from './storage';
export type { IStorageCapabilities, ISafeStorageConfig, StorageBackend } from './storage';

// 资源管理器
export { assetManager, AssetGroup } from './assets';

// 白盒开发系统
export { BillboardFactory, assetResolver } from './whitebox';
export type {
  IBillboardConfig,
  ICharacterBillboardConfig,
  IZoneBillboardConfig,
  IResolvedAsset,
} from './whitebox';

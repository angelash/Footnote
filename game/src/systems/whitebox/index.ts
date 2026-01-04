/**
 * 白盒开发系统
 * 提供占位资源生成和资源模式切换功能
 * @module systems/whitebox
 */

export { BillboardFactory } from './BillboardFactory';
export type {
  IBillboardConfig,
  ICharacterBillboardConfig,
  IZoneBillboardConfig,
} from './BillboardFactory';

export { assetResolver } from './AssetResolver';
export type { IResolvedAsset } from './AssetResolver';

import { parse as parseYaml } from 'yaml';
import type { ISceneConfig } from '@/types/scene';

// 序章 Zone
import c0z1Yaml from './c0_z1.yaml?raw';
import c0z2Yaml from './c0_z2.yaml?raw';
import c0z3Yaml from './c0_z3.yaml?raw';
import c0z4Yaml from './c0_z4.yaml?raw';

// 第1章 Zone
import c1z1Yaml from './c1_z1.yaml?raw';
import c1z2Yaml from './c1_z2.yaml?raw';
import c1z3Yaml from './c1_z3.yaml?raw';
import c1z4Yaml from './c1_z4.yaml?raw';
import c1z5Yaml from './c1_z5.yaml?raw';
import c1z6Yaml from './c1_z6.yaml?raw';

// 第2章 Zone
import c2z1Yaml from './c2_z1.yaml?raw';
import c2z2Yaml from './c2_z2.yaml?raw';
import c2z3Yaml from './c2_z3.yaml?raw';
import c2z4Yaml from './c2_z4.yaml?raw';
import c2z5Yaml from './c2_z5.yaml?raw';
import c2z6Yaml from './c2_z6.yaml?raw';
import c2z7Yaml from './c2_z7.yaml?raw';

// 第3章 Zone
import c3z1Yaml from './c3_z1.yaml?raw';
import c3z2Yaml from './c3_z2.yaml?raw';
import c3z3Yaml from './c3_z3.yaml?raw';
import c3z4Yaml from './c3_z4.yaml?raw';
import c3z5Yaml from './c3_z5.yaml?raw';
import c3z6Yaml from './c3_z6.yaml?raw';
import c3z7Yaml from './c3_z7.yaml?raw';

// 第4章 Zone
import c4z1Yaml from './c4_z1.yaml?raw';
import c4z2Yaml from './c4_z2.yaml?raw';
import c4z3Yaml from './c4_z3.yaml?raw';
import c4z4Yaml from './c4_z4.yaml?raw';
import c4z5Yaml from './c4_z5.yaml?raw';
import c4z6Yaml from './c4_z6.yaml?raw';
import c4z7Yaml from './c4_z7.yaml?raw';
import c4z8Yaml from './c4_z8.yaml?raw';

// 第5章 Zone
import c5z1Yaml from './c5_z1.yaml?raw';
import c5z2Yaml from './c5_z2.yaml?raw';
import c5z3Yaml from './c5_z3.yaml?raw';
import c5z4Yaml from './c5_z4.yaml?raw';
import c5z5Yaml from './c5_z5.yaml?raw';
import c5z6Yaml from './c5_z6.yaml?raw';
import c5z7Yaml from './c5_z7.yaml?raw';

// 终章 Zone
import cfz1Yaml from './cf_z1.yaml?raw';
import cfz2Yaml from './cf_z2.yaml?raw';
import cfz3Yaml from './cf_z3.yaml?raw';
import cfz4Yaml from './cf_z4.yaml?raw';
import cfz5Yaml from './cf_z5.yaml?raw';
import cfz6Yaml from './cf_z6.yaml?raw';

// 重返变体 Zone
import rv01Yaml from './rv_01.yaml?raw';
import rv02Yaml from './rv_02.yaml?raw';
import rv03Yaml from './rv_03.yaml?raw';
import rv04Yaml from './rv_04.yaml?raw';
import rv05Yaml from './rv_05.yaml?raw';
import rv06Yaml from './rv_06.yaml?raw';
import rv07Yaml from './rv_07.yaml?raw';
import rv08Yaml from './rv_08.yaml?raw';
import rv09Yaml from './rv_09.yaml?raw';
import rv10Yaml from './rv_10.yaml?raw';
import rv11Yaml from './rv_11.yaml?raw';
import rv12Yaml from './rv_12.yaml?raw';

const SCENE_YAML_BY_ZONE_ID: Record<string, string> = {
  // 序章
  'C0-Z1': c0z1Yaml,
  'C0-Z2': c0z2Yaml,
  'C0-Z3': c0z3Yaml,
  'C0-Z4': c0z4Yaml,
  // 第1章
  'C1-Z1': c1z1Yaml,
  'C1-Z2': c1z2Yaml,
  'C1-Z3': c1z3Yaml,
  'C1-Z4': c1z4Yaml,
  'C1-Z5': c1z5Yaml,
  'C1-Z6': c1z6Yaml,
  // 第2章
  'C2-Z1': c2z1Yaml,
  'C2-Z2': c2z2Yaml,
  'C2-Z3': c2z3Yaml,
  'C2-Z4': c2z4Yaml,
  'C2-Z5': c2z5Yaml,
  'C2-Z6': c2z6Yaml,
  'C2-Z7': c2z7Yaml,
  // 第3章
  'C3-Z1': c3z1Yaml,
  'C3-Z2': c3z2Yaml,
  'C3-Z3': c3z3Yaml,
  'C3-Z4': c3z4Yaml,
  'C3-Z5': c3z5Yaml,
  'C3-Z6': c3z6Yaml,
  'C3-Z7': c3z7Yaml,
  // 第4章
  'C4-Z1': c4z1Yaml,
  'C4-Z2': c4z2Yaml,
  'C4-Z3': c4z3Yaml,
  'C4-Z4': c4z4Yaml,
  'C4-Z5': c4z5Yaml,
  'C4-Z6': c4z6Yaml,
  'C4-Z7': c4z7Yaml,
  'C4-Z8': c4z8Yaml,
  // 第5章
  'C5-Z1': c5z1Yaml,
  'C5-Z2': c5z2Yaml,
  'C5-Z3': c5z3Yaml,
  'C5-Z4': c5z4Yaml,
  'C5-Z5': c5z5Yaml,
  'C5-Z6': c5z6Yaml,
  'C5-Z7': c5z7Yaml,
  // 终章
  'CF-Z1': cfz1Yaml,
  'CF-Z2': cfz2Yaml,
  'CF-Z3': cfz3Yaml,
  'CF-Z4': cfz4Yaml,
  'CF-Z5': cfz5Yaml,
  'CF-Z6': cfz6Yaml,
  // 重返变体
  'RV-01': rv01Yaml,
  'RV-02': rv02Yaml,
  'RV-03': rv03Yaml,
  'RV-04': rv04Yaml,
  'RV-05': rv05Yaml,
  'RV-06': rv06Yaml,
  'RV-07': rv07Yaml,
  'RV-08': rv08Yaml,
  'RV-09': rv09Yaml,
  'RV-10': rv10Yaml,
  'RV-11': rv11Yaml,
  'RV-12': rv12Yaml,
};

export function getSceneConfig(zoneId: string): ISceneConfig | null {
  const raw = SCENE_YAML_BY_ZONE_ID[zoneId];
  if (!raw) return null;
  const parsed = parseYaml(raw) as unknown;
  // 最小校验（避免 any）
  if (typeof parsed !== 'object' || parsed == null) return null;
  return parsed as ISceneConfig;
}

/**
 * 获取所有可用的Zone ID列表
 */
export function getAllZoneIds(): string[] {
  return Object.keys(SCENE_YAML_BY_ZONE_ID);
}

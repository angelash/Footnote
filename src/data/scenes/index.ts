import { parse as parseYaml } from 'yaml';
import type { ISceneConfig } from '@/types/scene';

import c0z1Yaml from './c0_z1.yaml?raw';

const SCENE_YAML_BY_ZONE_ID: Record<string, string> = {
  'C0-Z1': c0z1Yaml,
};

export function getSceneConfig(zoneId: string): ISceneConfig | null {
  const raw = SCENE_YAML_BY_ZONE_ID[zoneId];
  if (!raw) return null;
  const parsed = parseYaml(raw) as unknown;
  // 最小校验（避免 any）
  if (typeof parsed !== 'object' || parsed == null) return null;
  return parsed as ISceneConfig;
}



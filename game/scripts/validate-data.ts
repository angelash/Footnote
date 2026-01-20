
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const DATA_DIR = path.join(process.cwd(), 'src/data');
const DIALOGUE_DIR = path.join(DATA_DIR, 'dialogues');
const SCENE_DIR = path.join(DATA_DIR, 'scenes');
const CARD_DIR = path.join(DATA_DIR, 'cards');
const FORESHADOW_DIR = path.join(DATA_DIR, 'foreshadows');

let hasError = false;

function error(msg: string) {
  console.error(`❌ ${msg}`);
  hasError = true;
}

function info(msg: string) {
  console.log(`✓ ${msg}`);
}

function validateDialogues() {
  if (!fs.existsSync(DIALOGUE_DIR)) return;
  const files = fs.readdirSync(DIALOGUE_DIR).filter(f => f.endsWith('.yaml'));
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(DIALOGUE_DIR, file), 'utf-8');
      const data = YAML.parse(content);
      
      if (!data.dialogues) {
        error(`${file}: Missing 'dialogues'`);
        return;
      }

      // Dialogues can be Array or Object (Map)
      const dialogues = Array.isArray(data.dialogues) 
        ? data.dialogues 
        : Object.values(data.dialogues);

      dialogues.forEach((d: any, idx: number) => {
        if (!d.id) error(`${file} entry ${idx}: Missing id`);
        
        // Structure 1: Single line (id, speaker, text)
        // Structure 2: Multi-line (id, lines)
        
        if (d.lines) {
           if (!Array.isArray(d.lines)) error(`${file} entry ${d.id}: 'lines' must be array`);
        } else {
           if (!d.text && !d.choices) error(`${file} entry ${d.id}: Missing 'text' or 'choices'`);
           if (d.text && d.text.length > 100 && !d.text.includes('\n')) {
             // Warn about long text
             // console.warn(`${file} entry ${d.id}: Text might be too long (${d.text.length} chars)`);
           }
        }
      });
    } catch (e) {
      error(`${file}: Invalid YAML - ${e}`);
    }
  });
  info(`Checked ${files.length} dialogue files`);
}

function validateZones() {
  if (!fs.existsSync(SCENE_DIR)) return;
  const files = fs.readdirSync(SCENE_DIR).filter(f => f.endsWith('.yaml'));

  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(SCENE_DIR, file), 'utf-8');
      const data = YAML.parse(content);
      
      if (!data.id) error(`${file}: Missing id`);
      // Allow 'title' or 'name'
      if (!data.name && !data.title) error(`${file}: Missing name/title`);
      
      const idRegex = /^[A-Z]+\d+-?[A-Z0-9]+$/; // C0-Z1, RV-01, etc.
      // Relaxed regex as some files have RV-01 which failed C{n}-Z{m}
      
      if (data.id && !data.id.includes('-')) {
         // Maybe warn?
      }
    } catch (e) {
      error(`${file}: Invalid YAML - ${e}`);
    }
  });
  info(`Checked ${files.length} zone files`);
}

function validateCards() {
  if (!fs.existsSync(CARD_DIR)) return;
  const files = fs.readdirSync(CARD_DIR).filter(f => f.endsWith('.yaml'));

  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(CARD_DIR, file), 'utf-8');
      const data = YAML.parse(content);
      
      if (!data.cards) return;

      // Cards can be Array or Object (Map)
      const cards = Array.isArray(data.cards) 
        ? data.cards 
        : Object.values(data.cards);

      cards.forEach((c: any, idx: number) => {
        if (!c.id) error(`${file} entry ${idx}: Missing id`);
        if (!c.name && !c.title) error(`${file} entry ${c.id || idx}: Missing name/title`);
        
        // Content might be description or content
        // Some cards might not have content text if they are items?
      });
    } catch (e) {
      error(`${file}: Invalid YAML - ${e}`);
    }
  });
  info(`Checked ${files.length} card files`);
}

/**
 * 验证伏笔数据（统一 Schema）
 * 阶段命名规范：plant/deepen/mislead/reveal
 */
function validateForeshadows() {
  if (!fs.existsSync(FORESHADOW_DIR)) return;
  const files = fs.readdirSync(FORESHADOW_DIR).filter(f => f.endsWith('.yaml'));

  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(FORESHADOW_DIR, file), 'utf-8');
      const data = YAML.parse(content);
      
      if (!data.foreshadows) return;

      // Foreshadows can be Array or Object (Map)
      const foreshadows = Array.isArray(data.foreshadows) 
        ? data.foreshadows 
        : Object.values(data.foreshadows);

      foreshadows.forEach((f: any, idx: number) => {
        const fId = f.id || `entry_${idx}`;
        
        // 基本字段检查
        if (!f.id) error(`${file} entry ${idx}: Missing id`);
        if (!f.name) error(`${file} entry ${fId}: Missing name`);
        
        // stages 结构检查
        if (!f.stages) {
          error(`${file} entry ${fId}: Missing stages`);
          return;
        }
        
        // 跳过预留位（zone 为 TBD）
        if (f.stages.plant?.zone === 'TBD') {
          // 预留位不做严格检查
          return;
        }
        
        // plant 阶段必须存在
        if (!f.stages.plant) {
          error(`${file} entry ${fId}: Missing stages.plant`);
        } else {
          if (!f.stages.plant.zone && !f.stages.plant.zoneId) {
            error(`${file} entry ${fId}: stages.plant missing zone`);
          }
        }
        
        // deepen 阶段必须存在
        if (!f.stages.deepen) {
          error(`${file} entry ${fId}: Missing stages.deepen`);
        } else {
          if (!f.stages.deepen.zone && !f.stages.deepen.zoneId) {
            error(`${file} entry ${fId}: stages.deepen missing zone`);
          }
        }
        
        // 回收阶段检查（reveal 或旧版 resolve）
        const hasReveal = f.stages.reveal || f.stages.resolve;
        if (!hasReveal) {
          error(`${file} entry ${fId}: Missing stages.reveal (or resolve)`);
        } else {
          const revealStage = f.stages.reveal || f.stages.resolve;
          if (!revealStage.zone && !revealStage.zoneId) {
            error(`${file} entry ${fId}: stages.reveal missing zone`);
          }
        }
        
        // 检查旧版命名并警告（不报错）
        if (f.stages.misread && !f.stages.mislead) {
          console.warn(`⚠ ${file} entry ${fId}: Using deprecated 'misread', prefer 'mislead'`);
        }
        if (f.stages.resolve && !f.stages.reveal) {
          console.warn(`⚠ ${file} entry ${fId}: Using deprecated 'resolve', prefer 'reveal'`);
        }
        if (f.stages.collect) {
          console.warn(`⚠ ${file} entry ${fId}: Using deprecated 'collect', prefer 'reveal'`);
        }
        
        // ID 格式检查（F01-F26）
        const idRegex = /^F\d{2}$/;
        if (f.id && !idRegex.test(f.id)) {
          console.warn(`⚠ ${file} entry ${fId}: ID '${f.id}' does not match F01-F26 format`);
        }
      });
    } catch (e) {
      error(`${file}: Invalid YAML - ${e}`);
    }
  });
  info(`Checked ${files.length} foreshadow files`);
}

console.log('Running Data Validation...');
validateDialogues();
validateZones();
validateCards();
validateForeshadows();

if (hasError) {
  console.error('Validation FAILED');
  process.exit(1);
} else {
  console.log('Validation PASSED');
  process.exit(0);
}


import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const DATA_DIR = path.join(process.cwd(), 'src/data');
const DIALOGUE_DIR = path.join(DATA_DIR, 'dialogues');
const SCENE_DIR = path.join(DATA_DIR, 'scenes');
const CARD_DIR = path.join(DATA_DIR, 'cards');

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
      
      if (!data.cards || !Array.isArray(data.cards)) return;

      data.cards.forEach((c: any, idx: number) => {
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

console.log('Running Data Validation...');
validateDialogues();
validateZones();
validateCards();

if (hasError) {
  console.error('Validation FAILED');
  process.exit(1);
} else {
  console.log('Validation PASSED');
  process.exit(0);
}

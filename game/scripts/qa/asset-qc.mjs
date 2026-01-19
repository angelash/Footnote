#!/usr/bin/env node
/**
 * 美术资产 QC 自动化检查脚本
 * 
 * 功能：
 * - 图片尺寸检查（按 Art Bible 规格）
 * - 文件命名规范检查
 * - 色值检查（主色 #00F5D4）
 * - 文件大小限制检查
 * 
 * 使用方式：
 *   node game/scripts/qa/asset-qc.mjs [options]
 * 
 * 选项：
 *   --path <dir>       检查指定目录（默认: game/assets）
 *   --type <type>      只检查指定类型: image, audio, all（默认: all）
 *   --fix              自动修复可修复的问题（暂未实现）
 *   --json             输出 JSON 格式报告
 *   --verbose          显示详细信息
 *   --help             显示帮助信息
 * 
 * @version 1.0.0
 * @author Footnote QA Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Art Bible 规格定义
// ============================================================================

/**
 * 图像尺寸规格表（来自 Art Bible 3.1）
 */
const IMAGE_SIZE_SPECS = {
  // 背景 - 750×1334
  bg: { width: 750, height: 1334, tolerance: 0.1, formats: ['png', 'svg', 'webp'] },
  
  // 角色立绘 - 512×512
  char: { width: 512, height: 512, tolerance: 0.2, formats: ['png', 'webp'] },
  
  // 角色精灵 - 128×192
  sprite: { width: 128, height: 192, tolerance: 0.2, formats: ['png', 'webp'] },
  
  // 头像 - 128×128
  portrait: { width: 128, height: 128, tolerance: 0.2, formats: ['png', 'webp'] },
  
  // 物件 - 64×64 ~ 256×256（变动范围大）
  obj: { width: 128, height: 128, minWidth: 64, maxWidth: 256, minHeight: 64, maxHeight: 256, formats: ['png', 'webp'] },
  
  // UI图标 - 32×32 / 64×64
  icon: { width: 48, height: 48, minWidth: 32, maxWidth: 64, minHeight: 32, maxHeight: 64, formats: ['png', 'svg', 'webp'] },
  
  // 卡片图 - 200×280
  card: { width: 200, height: 280, tolerance: 0.15, formats: ['png', 'webp'] },
  
  // 特效帧 - 128×128 ~ 256×256
  fx: { width: 192, height: 192, minWidth: 128, maxWidth: 256, minHeight: 128, maxHeight: 256, formats: ['png', 'webp'] },
};

/**
 * 命名规则前缀（来自 Art Bible 3.2）
 */
const NAMING_PREFIXES = {
  bg: { prefix: 'bg_', description: '背景', categories: ['residential', 'municipal', 'archive', 'clinic', 'chapel', 'core'] },
  char: { prefix: 'char_', description: '角色', categories: ['player', 'cenhui', 'gulin', 'songlan', 'xuchen', 'atang', 'muping', 'qilan', 'chenjiang'] },
  sprite: { prefix: 'sprite_', description: '精灵图', categories: [] },
  portrait: { prefix: 'portrait_', description: '头像', categories: [] },
  obj: { prefix: 'obj_', description: '物件', categories: ['furniture', 'prop', 'interact'] },
  icon: { prefix: 'icon_', description: '图标', categories: [] },
  card: { prefix: 'card_', description: '卡片', categories: ['archive', 'item', 'prayer', 'verdict'] },
  fx: { prefix: 'fx_', description: '特效', categories: ['depth', 'time', 'scar'] },
  
  // 音频前缀
  bgm: { prefix: 'bgm_', description: '背景音乐', categories: [] },
  sfx: { prefix: 'sfx_', description: '音效', categories: ['ui', 'char', 'env', 'ability', 'sys'] },
  amb: { prefix: 'amb_', description: '环境音', categories: [] },
};

/**
 * 配色体系（来自 Art Bible 1.2）
 */
const COLOR_SCHEME = {
  // 主要强调色
  primary: '#00F5D4',
  
  // 背景基色
  background: ['#1a1a2e', '#16213e'],
  
  // 前景主色
  foreground: ['#e94560', '#0f3460'],
  
  // 强调色
  accent: ['#00F5D4', '#ff00ff'],
  
  // 文字色
  text: ['#ffffff', '#a0a0a0'],
  
  // 警示色
  warning: ['#ff4444', '#ffaa00'],
  
  // 能力效果色
  abilities: {
    depthPerception: { primary: '#00F5D4', secondary: '#0077ff' },
    depthIntervention: { primary: '#ff00ff', secondary: '#8800ff' },
    timeIntervention: { primary: '#ffaa00', secondary: '#ff4444' },
  },
};

/**
 * 文件大小限制（单位：字节）
 */
const FILE_SIZE_LIMITS = {
  // 图像文件
  image: {
    background: 500 * 1024,      // 500KB
    character: 200 * 1024,       // 200KB
    sprite: 50 * 1024,           // 50KB
    portrait: 50 * 1024,         // 50KB
    object: 100 * 1024,          // 100KB
    icon: 20 * 1024,             // 20KB
    card: 100 * 1024,            // 100KB
    effect: 100 * 1024,          // 100KB
    default: 200 * 1024,         // 200KB 默认
  },
  // 音频文件
  audio: {
    bgm: 5 * 1024 * 1024,        // 5MB
    sfx: 500 * 1024,             // 500KB
    ambience: 2 * 1024 * 1024,   // 2MB
    default: 1 * 1024 * 1024,    // 1MB 默认
  },
};

// ============================================================================
// QC 检查器类
// ============================================================================

class AssetQC {
  constructor(options = {}) {
    // 智能检测 assets 目录位置
    let defaultBasePath = path.join(process.cwd(), 'assets');
    if (!fs.existsSync(defaultBasePath)) {
      defaultBasePath = path.join(process.cwd(), 'game', 'assets');
    }
    
    this.options = {
      basePath: options.basePath || defaultBasePath,
      type: options.type || 'all',
      verbose: options.verbose || false,
      json: options.json || false,
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      basePath: this.options.basePath,
      summary: {
        total: 0,
        passed: 0,
        warnings: 0,
        errors: 0,
      },
      checks: {
        size: { passed: 0, failed: 0, skipped: 0, details: [] },
        naming: { passed: 0, failed: 0, skipped: 0, details: [] },
        fileSize: { passed: 0, failed: 0, skipped: 0, details: [] },
        color: { passed: 0, failed: 0, skipped: 0, details: [] },
      },
      files: [],
    };
  }

  /**
   * 运行所有检查
   */
  async run() {
    this.log('🔍 开始美术资产 QC 检查...\n');
    this.log(`📁 检查路径: ${this.options.basePath}`);
    this.log(`📋 检查类型: ${this.options.type}\n`);

    if (!fs.existsSync(this.options.basePath)) {
      this.error(`路径不存在: ${this.options.basePath}`);
      return this.results;
    }

    // 收集所有文件
    const files = this.collectFiles(this.options.basePath);
    this.results.summary.total = files.length;
    this.log(`📊 找到 ${files.length} 个文件\n`);

    // 执行检查
    for (const file of files) {
      await this.checkFile(file);
    }

    // 生成报告
    this.generateReport();
    
    return this.results;
  }

  /**
   * 递归收集所有文件
   */
  collectFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // 跳过备份目录
        if (entry.name === 'bak' || entry.name === 'backup') {
          continue;
        }
        this.collectFiles(fullPath, files);
      } else {
        // 跳过隐藏文件
        if (entry.name.startsWith('.')) {
          continue;
        }
        
        const ext = path.extname(entry.name).toLowerCase().slice(1);
        const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext);
        const isAudio = ['mp3', 'ogg', 'wav'].includes(ext);
        
        if (this.options.type === 'all' || 
            (this.options.type === 'image' && isImage) ||
            (this.options.type === 'audio' && isAudio)) {
          files.push({
            path: fullPath,
            name: entry.name,
            relativePath: path.relative(this.options.basePath, fullPath),
            ext,
            isImage,
            isAudio,
          });
        }
      }
    }
    
    return files;
  }

  /**
   * 检查单个文件
   */
  async checkFile(file) {
    const fileResult = {
      path: file.relativePath,
      checks: [],
      status: 'passed',
    };

    // 1. 命名规范检查
    const namingResult = this.checkNamingConvention(file);
    fileResult.checks.push(namingResult);

    // 2. 文件大小检查
    const fileSizeResult = this.checkFileSize(file);
    fileResult.checks.push(fileSizeResult);

    // 3. 图片尺寸检查（仅图片）
    if (file.isImage && file.ext !== 'svg') {
      const imageSizeResult = await this.checkImageSize(file);
      fileResult.checks.push(imageSizeResult);
    }

    // 4. 色值检查（仅 PNG 格式，检查强调色使用）
    // 使用纯 Node.js 实现，无需 sharp 库
    if (file.isImage && file.ext === 'png') {
      const colorResult = await this.checkColors(file);
      fileResult.checks.push(colorResult);
    }

    // 更新状态
    const hasError = fileResult.checks.some(c => c.status === 'error');
    const hasWarning = fileResult.checks.some(c => c.status === 'warning');
    
    if (hasError) {
      fileResult.status = 'error';
      this.results.summary.errors++;
    } else if (hasWarning) {
      fileResult.status = 'warning';
      this.results.summary.warnings++;
    } else {
      this.results.summary.passed++;
    }

    this.results.files.push(fileResult);
  }

  /**
   * 检查命名规范
   */
  checkNamingConvention(file) {
    const result = {
      type: 'naming',
      status: 'passed',
      message: '',
      details: {},
    };

    const basename = path.basename(file.name, path.extname(file.name));
    
    // 检查是否全小写 + 下划线
    if (!/^[a-z0-9_]+$/.test(basename)) {
      result.status = 'error';
      result.message = `文件名必须为小写字母、数字和下划线: ${file.name}`;
      this.results.checks.naming.failed++;
      this.results.checks.naming.details.push({ file: file.relativePath, ...result });
      return result;
    }

    // 检查前缀
    let matchedPrefix = null;
    for (const [key, spec] of Object.entries(NAMING_PREFIXES)) {
      if (basename.startsWith(spec.prefix)) {
        matchedPrefix = { key, spec };
        break;
      }
    }

    if (!matchedPrefix) {
      // 检查是否在特定目录下可以接受无前缀
      const parentDir = path.basename(path.dirname(file.path));
      if (['buttons', 'frames', 'panels', 'icons'].includes(parentDir)) {
        result.status = 'warning';
        result.message = `文件缺少标准前缀，但在允许的目录中: ${file.name}`;
        this.results.checks.naming.passed++;
      } else {
        result.status = 'warning';
        result.message = `文件缺少标准前缀 (bg_, char_, sprite_, portrait_, obj_, icon_, card_, fx_, bgm_, sfx_, amb_): ${file.name}`;
        this.results.checks.naming.failed++;
      }
      this.results.checks.naming.details.push({ file: file.relativePath, ...result });
      return result;
    }

    // 检查格式是否匹配（如果有规格定义）
    const sizeSpec = IMAGE_SIZE_SPECS[matchedPrefix.key];
    if (sizeSpec && file.isImage) {
      if (!sizeSpec.formats.includes(file.ext)) {
        result.status = 'warning';
        result.message = `${matchedPrefix.spec.description}建议使用格式: ${sizeSpec.formats.join(', ')}，当前: ${file.ext}`;
        this.results.checks.naming.details.push({ file: file.relativePath, ...result });
      }
    }

    result.details.prefix = matchedPrefix.key;
    result.details.category = matchedPrefix.spec.description;
    this.results.checks.naming.passed++;
    
    return result;
  }

  /**
   * 检查文件大小
   */
  checkFileSize(file) {
    const result = {
      type: 'fileSize',
      status: 'passed',
      message: '',
      details: {},
    };

    const stats = fs.statSync(file.path);
    const fileSize = stats.size;
    result.details.size = fileSize;
    result.details.sizeFormatted = this.formatFileSize(fileSize);

    // 确定文件类型对应的大小限制
    let limit;
    if (file.isImage) {
      const basename = path.basename(file.name, path.extname(file.name));
      if (basename.startsWith('bg_')) {
        limit = FILE_SIZE_LIMITS.image.background;
      } else if (basename.startsWith('char_')) {
        limit = FILE_SIZE_LIMITS.image.character;
      } else if (basename.startsWith('sprite_')) {
        limit = FILE_SIZE_LIMITS.image.sprite;
      } else if (basename.startsWith('portrait_')) {
        limit = FILE_SIZE_LIMITS.image.portrait;
      } else if (basename.startsWith('obj_')) {
        limit = FILE_SIZE_LIMITS.image.object;
      } else if (basename.startsWith('icon_')) {
        limit = FILE_SIZE_LIMITS.image.icon;
      } else if (basename.startsWith('card_')) {
        limit = FILE_SIZE_LIMITS.image.card;
      } else if (basename.startsWith('fx_')) {
        limit = FILE_SIZE_LIMITS.image.effect;
      } else {
        limit = FILE_SIZE_LIMITS.image.default;
      }
    } else if (file.isAudio) {
      const basename = path.basename(file.name, path.extname(file.name));
      if (basename.startsWith('bgm_')) {
        limit = FILE_SIZE_LIMITS.audio.bgm;
      } else if (basename.startsWith('sfx_')) {
        limit = FILE_SIZE_LIMITS.audio.sfx;
      } else if (basename.startsWith('amb_')) {
        limit = FILE_SIZE_LIMITS.audio.ambience;
      } else {
        limit = FILE_SIZE_LIMITS.audio.default;
      }
    } else {
      limit = FILE_SIZE_LIMITS.image.default;
    }

    result.details.limit = limit;
    result.details.limitFormatted = this.formatFileSize(limit);

    if (fileSize > limit) {
      result.status = 'warning';
      result.message = `文件大小 (${this.formatFileSize(fileSize)}) 超过建议限制 (${this.formatFileSize(limit)})`;
      this.results.checks.fileSize.failed++;
      this.results.checks.fileSize.details.push({ file: file.relativePath, ...result });
    } else {
      this.results.checks.fileSize.passed++;
    }

    return result;
  }

  /**
   * 检查图片尺寸
   */
  async checkImageSize(file) {
    const result = {
      type: 'size',
      status: 'passed',
      message: '',
      details: {},
    };

    try {
      // 使用简单方式读取 PNG/WebP 尺寸
      const dimensions = await this.getImageDimensions(file.path, file.ext);
      
      if (!dimensions) {
        result.status = 'skipped';
        result.message = '无法读取图片尺寸';
        this.results.checks.size.skipped++;
        return result;
      }

      result.details.width = dimensions.width;
      result.details.height = dimensions.height;

      // 确定适用的规格
      const basename = path.basename(file.name, path.extname(file.name));
      let spec = null;
      let specKey = null;

      for (const [key, s] of Object.entries(IMAGE_SIZE_SPECS)) {
        if (basename.startsWith(NAMING_PREFIXES[key]?.prefix || `${key}_`)) {
          spec = s;
          specKey = key;
          break;
        }
      }

      if (!spec) {
        result.status = 'skipped';
        result.message = '无匹配的尺寸规格';
        this.results.checks.size.skipped++;
        return result;
      }

      result.details.expectedWidth = spec.width;
      result.details.expectedHeight = spec.height;
      result.details.specKey = specKey;

      // 检查尺寸是否符合规格
      let widthOk, heightOk;

      if (spec.minWidth !== undefined && spec.maxWidth !== undefined) {
        // 范围检查
        widthOk = dimensions.width >= spec.minWidth && dimensions.width <= spec.maxWidth;
        heightOk = dimensions.height >= spec.minHeight && dimensions.height <= spec.maxHeight;
      } else if (spec.tolerance !== undefined) {
        // 容差检查
        const widthDiff = Math.abs(dimensions.width - spec.width) / spec.width;
        const heightDiff = Math.abs(dimensions.height - spec.height) / spec.height;
        widthOk = widthDiff <= spec.tolerance;
        heightOk = heightDiff <= spec.tolerance;
      } else {
        // 精确匹配
        widthOk = dimensions.width === spec.width;
        heightOk = dimensions.height === spec.height;
      }

      if (!widthOk || !heightOk) {
        result.status = 'warning';
        if (spec.minWidth !== undefined) {
          result.message = `尺寸 ${dimensions.width}×${dimensions.height} 不在建议范围 ${spec.minWidth}-${spec.maxWidth}×${spec.minHeight}-${spec.maxHeight}`;
        } else {
          result.message = `尺寸 ${dimensions.width}×${dimensions.height} 与建议尺寸 ${spec.width}×${spec.height} 差异较大`;
        }
        this.results.checks.size.failed++;
        this.results.checks.size.details.push({ file: file.relativePath, ...result });
      } else {
        this.results.checks.size.passed++;
      }

    } catch (err) {
      result.status = 'error';
      result.message = `读取图片失败: ${err.message}`;
      this.results.checks.size.failed++;
      this.results.checks.size.details.push({ file: file.relativePath, ...result });
    }

    return result;
  }

  /**
   * 获取图片尺寸（简单实现，不依赖外部库）
   */
  async getImageDimensions(filePath, ext) {
    const buffer = fs.readFileSync(filePath);
    
    if (ext === 'png') {
      // PNG: IHDR chunk at offset 16, width/height are 4-byte big-endian
      if (buffer.length < 24) return null;
      if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
      
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    
    if (ext === 'jpg' || ext === 'jpeg') {
      // JPEG: 查找 SOF0/SOF2 marker
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        
        // SOF0 (0xC0) or SOF2 (0xC2)
        if (marker === 0xc0 || marker === 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        
        // 跳过其他 marker
        if (marker >= 0xd0 && marker <= 0xd9) {
          offset += 2;
        } else {
          const len = buffer.readUInt16BE(offset + 2);
          offset += 2 + len;
        }
      }
      return null;
    }
    
    if (ext === 'webp') {
      // WebP: RIFF header + VP8/VP8L/VP8X
      if (buffer.length < 30) return null;
      if (buffer.toString('utf8', 0, 4) !== 'RIFF') return null;
      if (buffer.toString('utf8', 8, 12) !== 'WEBP') return null;
      
      const chunkType = buffer.toString('utf8', 12, 16);
      
      if (chunkType === 'VP8 ') {
        // Lossy WebP
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
      
      if (chunkType === 'VP8L') {
        // Lossless WebP
        const b = buffer.readUInt32LE(21);
        const width = (b & 0x3fff) + 1;
        const height = ((b >> 14) & 0x3fff) + 1;
        return { width, height };
      }
      
      if (chunkType === 'VP8X') {
        // Extended WebP
        const width = (buffer.readUIntLE(24, 3) & 0xffffff) + 1;
        const height = (buffer.readUIntLE(27, 3) & 0xffffff) + 1;
        return { width, height };
      }
      
      return null;
    }
    
    return null;
  }

  /**
   * 检查色值（纯 Node.js 实现，支持 PNG 格式）
   * 检查图片中是否正确使用了项目主色 #00F5D4
   */
  async checkColors(file) {
    const result = {
      type: 'color',
      status: 'passed',
      message: '',
      details: {},
    };

    // 只检查 PNG 文件中特定类型的资源
    if (file.ext !== 'png') {
      result.status = 'skipped';
      result.message = '仅支持 PNG 格式';
      this.results.checks.color.skipped++;
      return result;
    }

    const basename = path.basename(file.name, path.extname(file.name));
    
    // 只检查特效和能力相关的资源（这些应该使用主色）
    const shouldCheckColor = basename.startsWith('fx_') || 
                             basename.includes('ability') ||
                             basename.includes('depth') ||
                             basename.includes('highlight');
    
    if (!shouldCheckColor) {
      result.status = 'skipped';
      result.message = '非强调色检查目标';
      this.results.checks.color.skipped++;
      return result;
    }

    try {
      const colors = await this.extractPngColors(file.path);
      
      if (!colors || colors.length === 0) {
        result.status = 'skipped';
        result.message = '无法提取颜色信息';
        this.results.checks.color.skipped++;
        return result;
      }

      result.details.dominantColors = colors.slice(0, 5);
      
      // 检查是否包含主色 #00F5D4 或相近色
      const primaryColor = { r: 0, g: 245, b: 212 }; // #00F5D4
      const hasAccentColor = colors.some(c => this.isColorSimilar(c, primaryColor, 30));
      
      // 检查能力特效是否使用了正确的强调色
      if (basename.includes('depth')) {
        // 深度感知应该使用青色
        if (!hasAccentColor) {
          result.status = 'warning';
          result.message = `深度感知特效应包含主色 #00F5D4，当前主要颜色: ${colors.slice(0, 3).map(c => this.rgbToHex(c)).join(', ')}`;
          this.results.checks.color.failed++;
          this.results.checks.color.details.push({ file: file.relativePath, ...result });
          return result;
        }
      }

      result.details.hasAccentColor = hasAccentColor;
      result.message = hasAccentColor ? '包含项目强调色' : '未检测到项目强调色';
      this.results.checks.color.passed++;
      
    } catch (err) {
      result.status = 'skipped';
      result.message = `颜色分析失败: ${err.message}`;
      this.results.checks.color.skipped++;
    }

    return result;
  }

  /**
   * 从 PNG 文件提取主要颜色（简单实现）
   */
  async extractPngColors(filePath) {
    const buffer = fs.readFileSync(filePath);
    
    // 验证 PNG 签名
    if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
      return null;
    }

    // 查找 IDAT chunk 并解析像素数据
    // 这是简化实现，只采样部分像素
    const colorCounts = new Map();
    
    try {
      // 使用 zlib 解压 PNG 数据
      const zlib = await import('zlib');
      
      // 收集所有 IDAT chunks
      let offset = 8;
      const idatChunks = [];
      let width = 0;
      let height = 0;
      let bitDepth = 8;
      let colorType = 2; // RGB
      
      while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('utf8', offset + 4, offset + 8);
        
        if (type === 'IHDR') {
          width = buffer.readUInt32BE(offset + 8);
          height = buffer.readUInt32BE(offset + 12);
          bitDepth = buffer[offset + 16];
          colorType = buffer[offset + 17];
        } else if (type === 'IDAT') {
          idatChunks.push(buffer.slice(offset + 8, offset + 8 + length));
        } else if (type === 'IEND') {
          break;
        }
        
        offset += 12 + length; // length(4) + type(4) + data + crc(4)
      }
      
      if (idatChunks.length === 0 || width === 0) {
        return null;
      }

      // 合并并解压 IDAT 数据
      const compressedData = Buffer.concat(idatChunks);
      const decompressed = zlib.inflateSync(compressedData);
      
      // 确定每像素字节数
      let bytesPerPixel;
      if (colorType === 2) bytesPerPixel = 3; // RGB
      else if (colorType === 6) bytesPerPixel = 4; // RGBA
      else if (colorType === 0) bytesPerPixel = 1; // Grayscale
      else if (colorType === 4) bytesPerPixel = 2; // Grayscale + Alpha
      else return null; // 不支持的格式
      
      const rowBytes = 1 + width * bytesPerPixel; // +1 for filter byte
      
      // 采样像素（每隔几个像素采样一次以提高性能）
      const sampleStep = Math.max(1, Math.floor(Math.sqrt(width * height / 1000)));
      
      for (let y = 0; y < height; y += sampleStep) {
        const rowStart = y * rowBytes + 1; // Skip filter byte
        
        for (let x = 0; x < width; x += sampleStep) {
          const pixelStart = rowStart + x * bytesPerPixel;
          
          if (pixelStart + bytesPerPixel <= decompressed.length) {
            let r, g, b, a = 255;
            
            if (colorType === 2) { // RGB
              r = decompressed[pixelStart];
              g = decompressed[pixelStart + 1];
              b = decompressed[pixelStart + 2];
            } else if (colorType === 6) { // RGBA
              r = decompressed[pixelStart];
              g = decompressed[pixelStart + 1];
              b = decompressed[pixelStart + 2];
              a = decompressed[pixelStart + 3];
            } else if (colorType === 0) { // Grayscale
              r = g = b = decompressed[pixelStart];
            } else if (colorType === 4) { // Grayscale + Alpha
              r = g = b = decompressed[pixelStart];
              a = decompressed[pixelStart + 1];
            }
            
            // 忽略透明像素
            if (a < 128) continue;
            
            // 量化颜色以减少唯一颜色数量
            const qr = Math.round(r / 16) * 16;
            const qg = Math.round(g / 16) * 16;
            const qb = Math.round(b / 16) * 16;
            const key = `${qr},${qg},${qb}`;
            
            colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
          }
        }
      }
      
      // 排序并返回主要颜色
      const sortedColors = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => {
          const [r, g, b] = key.split(',').map(Number);
          return { r, g, b, count };
        });
      
      return sortedColors;
      
    } catch (err) {
      // PNG 解析失败，返回空
      return null;
    }
  }

  /**
   * 判断两个颜色是否相似
   */
  isColorSimilar(color1, color2, threshold = 30) {
    const dr = Math.abs(color1.r - color2.r);
    const dg = Math.abs(color1.g - color2.g);
    const db = Math.abs(color1.b - color2.b);
    return (dr + dg + db) / 3 <= threshold;
  }

  /**
   * RGB 转 Hex
   */
  rgbToHex(color) {
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
  }

  /**
   * 生成检查报告
   */
  generateReport() {
    if (this.options.json) {
      console.log(JSON.stringify(this.results, null, 2));
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 美术资产 QC 检查报告');
    console.log('='.repeat(60));
    console.log(`⏰ 时间: ${this.results.timestamp}`);
    console.log(`📁 路径: ${this.results.basePath}`);
    console.log();
    
    // 总体统计
    console.log('📈 总体统计:');
    console.log(`   总文件数: ${this.results.summary.total}`);
    console.log(`   ✅ 通过: ${this.results.summary.passed}`);
    console.log(`   ⚠️  警告: ${this.results.summary.warnings}`);
    console.log(`   ❌ 错误: ${this.results.summary.errors}`);
    console.log();

    // 各项检查统计
    console.log('📋 检查项统计:');
    for (const [key, check] of Object.entries(this.results.checks)) {
      const total = check.passed + check.failed + check.skipped;
      if (total === 0) continue;
      
      const checkNames = {
        size: '图片尺寸',
        naming: '命名规范',
        fileSize: '文件大小',
        color: '色值检查',
      };
      
      console.log(`   ${checkNames[key] || key}:`);
      console.log(`      通过: ${check.passed}, 失败: ${check.failed}, 跳过: ${check.skipped}`);
    }
    console.log();

    // 详细问题列表
    let hasIssues = false;
    
    for (const [key, check] of Object.entries(this.results.checks)) {
      if (check.details.length === 0) continue;
      
      if (!hasIssues) {
        console.log('⚠️  问题详情:');
        hasIssues = true;
      }
      
      const checkNames = {
        size: '图片尺寸',
        naming: '命名规范',
        fileSize: '文件大小',
        color: '色值检查',
      };
      
      console.log(`\n   【${checkNames[key] || key}】`);
      for (const detail of check.details.slice(0, 20)) { // 最多显示20条
        const icon = detail.status === 'error' ? '❌' : '⚠️';
        console.log(`   ${icon} ${detail.file}`);
        console.log(`      ${detail.message}`);
      }
      
      if (check.details.length > 20) {
        console.log(`   ... 还有 ${check.details.length - 20} 条问题`);
      }
    }

    if (!hasIssues) {
      console.log('✅ 没有发现问题！');
    }

    console.log();
    console.log('='.repeat(60));
    
    // 退出码
    const exitCode = this.results.summary.errors > 0 ? 1 : 0;
    console.log(`\n退出码: ${exitCode} (${exitCode === 0 ? '通过' : '有错误'})`);
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }

  /**
   * 日志输出
   */
  log(msg) {
    if (!this.options.json) {
      console.log(msg);
    }
  }

  /**
   * 错误输出
   */
  error(msg) {
    console.error(`❌ ${msg}`);
  }
}

// ============================================================================
// 导出的检查函数（供外部调用）
// ============================================================================

/**
 * 检查图片尺寸
 * @param {string} file - 文件路径
 * @param {object} expectedSize - 期望尺寸 { width, height }
 * @returns {Promise<object>} 检查结果
 */
export async function checkImageSize(file, expectedSize) {
  const qc = new AssetQC({ verbose: false });
  const ext = path.extname(file).toLowerCase().slice(1);
  const dimensions = await qc.getImageDimensions(file, ext);
  
  if (!dimensions) {
    return { passed: false, error: '无法读取图片尺寸' };
  }
  
  const widthOk = dimensions.width === expectedSize.width;
  const heightOk = dimensions.height === expectedSize.height;
  
  return {
    passed: widthOk && heightOk,
    actual: dimensions,
    expected: expectedSize,
    message: widthOk && heightOk 
      ? '尺寸符合要求' 
      : `尺寸不符: 实际 ${dimensions.width}×${dimensions.height}, 期望 ${expectedSize.width}×${expectedSize.height}`,
  };
}

/**
 * 检查文件命名规范
 * @param {string} file - 文件路径
 * @returns {object} 检查结果
 */
export function checkNamingConvention(file) {
  const basename = path.basename(file, path.extname(file));
  
  // 检查是否全小写 + 下划线
  if (!/^[a-z0-9_]+$/.test(basename)) {
    return {
      passed: false,
      message: `文件名必须为小写字母、数字和下划线: ${basename}`,
    };
  }
  
  // 检查前缀
  let matchedPrefix = null;
  for (const [key, spec] of Object.entries(NAMING_PREFIXES)) {
    if (basename.startsWith(spec.prefix)) {
      matchedPrefix = { key, spec };
      break;
    }
  }
  
  if (!matchedPrefix) {
    return {
      passed: false,
      message: `文件缺少标准前缀: ${basename}`,
      validPrefixes: Object.values(NAMING_PREFIXES).map(s => s.prefix),
    };
  }
  
  return {
    passed: true,
    prefix: matchedPrefix.key,
    category: matchedPrefix.spec.description,
    message: '命名规范符合要求',
  };
}

/**
 * 检查文件大小
 * @param {string} file - 文件路径
 * @param {number} maxSize - 最大大小（字节）
 * @returns {object} 检查结果
 */
export function checkFileSize(file, maxSize) {
  const stats = fs.statSync(file);
  const fileSize = stats.size;
  
  return {
    passed: fileSize <= maxSize,
    actual: fileSize,
    limit: maxSize,
    message: fileSize <= maxSize 
      ? '文件大小符合要求' 
      : `文件过大: ${formatFileSizeUtil(fileSize)} > ${formatFileSizeUtil(maxSize)}`,
  };
}

/**
 * 生成检查报告
 * @param {Array} results - 检查结果数组
 * @returns {object} 报告对象
 */
export function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    details: results,
  };
  
  return report;
}

// 辅助函数
function formatFileSizeUtil(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  // 帮助信息
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
美术资产 QC 自动化检查脚本

使用方式:
  node game/scripts/qa/asset-qc.mjs [options]

选项:
  --path <dir>       检查指定目录（默认: game/assets）
  --type <type>      只检查指定类型: image, audio, all（默认: all）
  --json             输出 JSON 格式报告
  --verbose          显示详细信息
  --help, -h         显示帮助信息

示例:
  node game/scripts/qa/asset-qc.mjs
  node game/scripts/qa/asset-qc.mjs --type image
  node game/scripts/qa/asset-qc.mjs --path ./game/assets/images --json
  node game/scripts/qa/asset-qc.mjs --verbose

检查内容:
  1. 图片尺寸检查 - 按 Art Bible 规格
  2. 文件命名规范检查 - 前缀和格式
  3. 文件大小限制检查 - 防止资源过大
  4. 色值检查 - 主色 #00F5D4（纯 Node.js 实现）

规格参考:
  - 背景: 750×1334, max 500KB
  - 角色立绘: 512×512, max 200KB
  - 角色精灵: 128×192, max 50KB
  - 头像: 128×128, max 50KB
  - 物件: 64-256×64-256, max 100KB
  - UI图标: 32-64×32-64, max 20KB
  - 卡片: 200×280, max 100KB
  - 特效: 128-256×128-256, max 100KB
`);
    process.exit(0);
  }

  // 解析参数
  const options = {
    basePath: undefined,
    type: 'all',
    json: args.includes('--json'),
    verbose: args.includes('--verbose'),
  };

  const pathIndex = args.indexOf('--path');
  if (pathIndex !== -1 && args[pathIndex + 1]) {
    options.basePath = path.resolve(args[pathIndex + 1]);
  }

  const typeIndex = args.indexOf('--type');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    options.type = args[typeIndex + 1];
  }

  // 运行检查
  const qc = new AssetQC(options);
  const results = await qc.run();

  // 设置退出码
  process.exit(results.summary.errors > 0 ? 1 : 0);
}

// 运行 CLI
main().catch(err => {
  console.error('QC 检查失败:', err);
  process.exit(1);
});

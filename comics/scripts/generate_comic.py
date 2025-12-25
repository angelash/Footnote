#!/usr/bin/env python3
"""
小说转漫画自动化生成脚本

使用方法：
1. 准备好分镜脚本 YAML 文件
2. 运行脚本生成提示词列表
3. 使用智绘平台批量生成图片
4. 下载并审核图片

依赖：
- pyyaml
- requests (下载图片用)
"""

import os
import yaml
import json
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Panel:
    """分镜面板"""
    panel_id: int
    size: str
    position: str
    shot_type: str
    angle: str
    description: str
    prompt: str = ""
    scene_ref: str = ""
    characters: List[Dict] = field(default_factory=list)
    dialogue: List[Dict] = field(default_factory=list)
    background: str = ""
    key_objects: List[str] = field(default_factory=list)


@dataclass
class Page:
    """漫画页面"""
    page_id: str
    layout_type: str
    purpose: str
    panels: List[Panel]
    summary: str = ""


class ComicPromptGenerator:
    """漫画提示词生成器"""
    
    # 基础风格标签
    BASE_STYLE = """comic panel, manga style, cyberpunk aesthetic, 
dark sci-fi atmosphere, high contrast lighting, 
dark color palette, neon accent colors,
clean lines, detailed background, dramatic shadows,
professional comic art quality"""
    
    # 镜头类型映射
    SHOT_TYPE_KEYWORDS = {
        "wide": "wide establishing shot, full environment visible",
        "medium": "medium shot, waist-up framing",
        "close-up": "close-up shot, face or detail focus",
        "extreme_close-up": "extreme close-up, single detail fills frame",
        "bird-eye": "bird's eye view, looking down from above",
        "worm-eye": "worm's eye view, looking up from below",
        "over_shoulder": "over the shoulder shot"
    }
    
    # 角度映射
    ANGLE_KEYWORDS = {
        "straight": "eye level angle",
        "dutch": "dutch angle, tilted frame",
        "low": "low angle shot",
        "high": "high angle shot",
        "slightly_low": "slightly low angle"
    }
    
    # 人物提示词模板
    CHARACTER_TEMPLATES = {
        "岑回": """young asian man, 25-30 years old, short black messy hair,
tired but sharp eyes, gray maintenance uniform,
employee badge on chest""",
        
        "顾临": """middle-aged asian man, 40-45, gray-white short hair,
deep-set tired eyes, dark gray supervisor uniform,
authoritative but weary posture""",
        
        "宋岚": """asian woman, 30-35, black hair in low ponytail,
calm cold eyes, archive worker uniform,
often wearing gloves""",
        
        "栖蓝": """middle-aged woman, 35-40, short gray messy hair,
calm almost empty eyes, worn work clothes,
tape and paper scraps in pockets""",
        
        "许澄": """asian woman, 35, shoulder-length black hair,
gentle but distant eyes, white medical coat""",
        
        "阿棠": """young woman, appears 25, short messy hair,
eyes seeming to look at another time,
thin build, old casual clothes"""
    }
    
    # 场景提示词模板
    SCENE_TEMPLATES = {
        "维修局大厅": """futuristic maintenance bureau lobby,
gray industrial interior, cold fluorescent lighting,
digital screens on walls, queue barriers, turnstile gates""",
        
        "居住区楼道": """apartment building stairwell,
old but clean interior, fluorescent tube lights,
gray walls, institutional atmosphere""",
        
        "居住区东侧小院": """residential courtyard,
open space between buildings, sparse vegetation,
gray concrete, everyday atmosphere""",
        
        "地下室档案区": """underground archive room,
old filing cabinets, dust particles in dim light,
paper documents, cramped space""",
        
        "断口区域": """urban fracture zone,
cracked pavement, broken street lamp,
boundary edge, transition area""",
        
        "医疗站": """medical station interior,
white sterile environment, medical equipment,
waiting area, clinical atmosphere"""
    }
    
    # 情绪映射
    MOOD_KEYWORDS = {
        "压抑": "oppressive, heavy, suffocating atmosphere",
        "紧张": "tense, suspenseful, anxious mood",
        "神秘": "mysterious, enigmatic, eerie atmosphere",
        "希望": "hopeful, warm, gentle light",
        "绝望": "desperate, hopeless, dark shadows",
        "平静": "calm, peaceful, serene atmosphere",
        "震惊": "shocked, dramatic, high contrast",
        "日常": "routine, mundane, everyday atmosphere"
    }
    
    def __init__(self, storyboard_path: str):
        """初始化生成器"""
        self.storyboard_path = Path(storyboard_path)
        self.storyboard = self._load_storyboard()
        self.output_dir = self.storyboard_path.parent
        
    def _load_storyboard(self) -> Dict:
        """加载分镜脚本"""
        with open(self.storyboard_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
            
    def _get_character_prompt(self, characters: List[Dict]) -> str:
        """生成人物提示词"""
        if not characters:
            return ""
            
        prompts = []
        for char in characters:
            name = char.get("name", "")
            if name in self.CHARACTER_TEMPLATES:
                base = self.CHARACTER_TEMPLATES[name]
                action = char.get("action", "")
                expression = char.get("expression", "")
                position = char.get("position", "")
                
                char_prompt = base
                if action:
                    char_prompt += f", {action}"
                if expression:
                    char_prompt += f", {expression} expression"
                if position:
                    char_prompt += f", positioned {position}"
                    
                prompts.append(char_prompt)
                
        return ", ".join(prompts)
        
    def _get_scene_prompt(self, background: str) -> str:
        """生成场景提示词"""
        for scene_name, scene_prompt in self.SCENE_TEMPLATES.items():
            if scene_name in background:
                return scene_prompt
        return background
        
    def _build_panel_prompt(self, panel: Dict, page_context: Dict) -> str:
        """为单个分镜构建完整提示词"""
        
        # 如果面板已有完整提示词，直接使用
        if panel.get("prompt"):
            return panel["prompt"].strip()
            
        parts = []
        
        # 1. 基础风格
        parts.append(self.BASE_STYLE)
        
        # 2. 镜头类型
        shot_type = panel.get("shot_type", "medium")
        if shot_type in self.SHOT_TYPE_KEYWORDS:
            parts.append(self.SHOT_TYPE_KEYWORDS[shot_type])
            
        # 3. 角度
        angle = panel.get("angle", "straight")
        if angle in self.ANGLE_KEYWORDS:
            parts.append(self.ANGLE_KEYWORDS[angle])
            
        # 4. 场景描述
        description = panel.get("description", "")
        if description:
            parts.append(description.strip())
            
        # 5. 人物
        characters = panel.get("characters", [])
        char_prompt = self._get_character_prompt(characters)
        if char_prompt:
            parts.append(char_prompt)
            
        # 6. 背景
        background = panel.get("background", "")
        if background:
            scene_prompt = self._get_scene_prompt(background)
            parts.append(scene_prompt)
            
        # 7. 关键物品
        key_objects = panel.get("key_objects", [])
        if key_objects:
            parts.append(f"key elements: {', '.join(key_objects)}")
            
        # 8. 提示词提示
        prompt_hints = panel.get("prompt_hints", {})
        if prompt_hints:
            if "style" in prompt_hints:
                parts.append(prompt_hints["style"])
            if "emphasis" in prompt_hints:
                parts.append(prompt_hints["emphasis"])
            if "details" in prompt_hints:
                parts.append(prompt_hints["details"])
                
        return ",\n".join(parts)
        
    def generate_all_prompts(self) -> List[Dict]:
        """生成所有分镜的提示词"""
        all_prompts = []
        
        for page in self.storyboard.get("pages", []):
            page_id = page.get("page_id", "unknown")
            page_context = {
                "layout_type": page.get("layout_type", ""),
                "purpose": page.get("purpose", "")
            }
            
            panels = page.get("panels", [])
            
            # 如果只有summary，跳过（需要手动展开）
            if not panels and page.get("summary"):
                all_prompts.append({
                    "page_id": page_id,
                    "type": "summary",
                    "summary": page.get("summary"),
                    "needs_expansion": True
                })
                continue
                
            for panel in panels:
                panel_id = panel.get("panel_id", 0)
                prompt = self._build_panel_prompt(panel, page_context)
                
                all_prompts.append({
                    "page_id": page_id,
                    "panel_id": panel_id,
                    "full_id": f"{page_id}-P{panel_id}",
                    "size": panel.get("size", "medium"),
                    "shot_type": panel.get("shot_type", "medium"),
                    "description": panel.get("description", ""),
                    "prompt": prompt,
                    "dialogue": panel.get("dialogue", [])
                })
                
        return all_prompts
        
    def export_prompts(self, output_format: str = "yaml") -> str:
        """导出提示词到文件"""
        prompts = self.generate_all_prompts()
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        episode_id = self.storyboard.get("episode_id", "unknown")
        
        if output_format == "yaml":
            output_path = self.output_dir / f"{episode_id}-prompts.yaml"
            with open(output_path, 'w', encoding='utf-8') as f:
                yaml.dump(prompts, f, allow_unicode=True, default_flow_style=False)
                
        elif output_format == "json":
            output_path = self.output_dir / f"{episode_id}-prompts.json"
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(prompts, f, ensure_ascii=False, indent=2)
                
        elif output_format == "txt":
            # 纯文本格式，方便复制粘贴
            output_path = self.output_dir / f"{episode_id}-prompts.txt"
            with open(output_path, 'w', encoding='utf-8') as f:
                for item in prompts:
                    if item.get("needs_expansion"):
                        f.write(f"\n{'='*60}\n")
                        f.write(f"[需要展开] {item['page_id']}\n")
                        f.write(f"摘要: {item.get('summary', '')}\n")
                    else:
                        f.write(f"\n{'='*60}\n")
                        f.write(f"[{item['full_id']}] {item.get('description', '')[:50]}...\n")
                        f.write(f"尺寸: {item['size']} | 镜头: {item['shot_type']}\n")
                        f.write(f"\n提示词:\n{item['prompt']}\n")
                        
        print(f"✅ 提示词已导出到: {output_path}")
        return str(output_path)
        
    def generate_batch_script(self) -> str:
        """生成批量生成脚本（用于Cursor中调用）"""
        prompts = self.generate_all_prompts()
        
        script_lines = [
            "# 批量生成脚本",
            "# 在Cursor中使用智绘平台执行",
            "",
            "# 生成步骤：",
            "# 1. 打开智绘平台",
            "# 2. 依次输入以下提示词",
            "# 3. 等待生成完成",
            "# 4. 下载保存到对应目录",
            ""
        ]
        
        for i, item in enumerate(prompts):
            if item.get("needs_expansion"):
                continue
                
            script_lines.append(f"\n## 任务 {i+1}: {item['full_id']}")
            script_lines.append(f"# 描述: {item.get('description', '')[:60]}")
            script_lines.append(f"# 保存为: {item['full_id']}.webp")
            script_lines.append("")
            script_lines.append("提示词:")
            script_lines.append("```")
            script_lines.append(item['prompt'])
            script_lines.append("```")
            script_lines.append("")
            
        output_path = self.output_dir / "batch_generation_guide.md"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(script_lines))
            
        print(f"✅ 批量生成指南已导出到: {output_path}")
        return str(output_path)


class ImageDownloader:
    """图片下载器"""
    
    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def download_images(self, urls: List[str], prefix: str) -> List[str]:
        """下载图片列表"""
        import requests
        
        downloaded = []
        for i, url in enumerate(urls, 1):
            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                
                filename = f"{prefix}_{i}.webp"
                filepath = self.output_dir / filename
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                    
                downloaded.append(str(filepath))
                print(f"✅ 下载成功: {filename}")
                
            except Exception as e:
                print(f"❌ 下载失败: {url} - {e}")
                
        return downloaded


class QualityChecker:
    """质量检查器（基础版）"""
    
    CHECKLIST = [
        "构图清晰，主体突出",
        "人物识别度高",
        "表情传达正确",
        "背景与场景匹配",
        "线条清晰",
        "色彩符合风格",
        "无明显AI瑕疵",
        "适合添加对话气泡"
    ]
    
    def check_image(self, image_path: str, panel_info: Dict) -> Dict:
        """检查单张图片（需要人工确认）"""
        result = {
            "path": image_path,
            "panel_id": panel_info.get("full_id", "unknown"),
            "checks": {},
            "approved": None,
            "notes": ""
        }
        
        print(f"\n检查图片: {image_path}")
        print(f"分镜描述: {panel_info.get('description', '')}")
        print("\n检查项目:")
        
        for item in self.CHECKLIST:
            print(f"  - [ ] {item}")
            
        return result


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='漫画提示词生成工具')
    parser.add_argument('storyboard', help='分镜脚本YAML文件路径')
    parser.add_argument('--format', choices=['yaml', 'json', 'txt'], 
                        default='txt', help='输出格式')
    parser.add_argument('--batch', action='store_true', 
                        help='生成批量生成指南')
    
    args = parser.parse_args()
    
    generator = ComicPromptGenerator(args.storyboard)
    generator.export_prompts(args.format)
    
    if args.batch:
        generator.generate_batch_script()


if __name__ == "__main__":
    main()


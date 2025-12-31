"""
Gemini 2.5 Flash Image 生成器
基于 aihub.gz4399.com 外网接口
"""

import requests
import base64
import json
import os
from datetime import datetime


class ImageGenerator:
    """图片生成器"""
    
    BASE_URL = "https://aihub.gz4399.com/v1/chat/completions"
    MODEL = "gemini-2.5-flash-image"
    
    # 支持的宽高比
    ASPECT_RATIOS = [
        "1:1", "2:3", "3:2", "3:4", "4:3", 
        "4:5", "5:4", "9:16", "16:9", "21:9"
    ]
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    def generate(
        self,
        prompt: str,
        output_path: str = None,
        aspect_ratio: str = None,
        temperature: float = None,
        top_p: float = None,
        stream: bool = False
    ) -> str:
        """
        生成图片
        
        Args:
            prompt: 图片描述
            output_path: 输出文件路径，默认为 output_<timestamp>.png
            aspect_ratio: 宽高比，如 "16:9"
            temperature: 温度参数 0~1
            top_p: top_p 参数 0~1
            stream: 是否流式输出
            
        Returns:
            保存的文件路径
        """
        # 构建请求体
        payload = {
            "model": self.MODEL,
            "messages": [
                {"type": "text", "role": "user", "content": f"生成图片: {prompt}"}
            ],
            "stream": stream
        }
        
        # 添加可选参数
        if aspect_ratio:
            if aspect_ratio not in self.ASPECT_RATIOS:
                print(f"警告: 不支持的宽高比 {aspect_ratio}，使用默认值")
            else:
                payload["aspectRatio"] = aspect_ratio
        if temperature is not None:
            payload["temperature"] = max(0, min(1, temperature))
        if top_p is not None:
            payload["top_p"] = max(0, min(1, top_p))
        
        print(f"正在生成图片: {prompt}")
        
        if stream:
            return self._generate_stream(payload, output_path)
        else:
            return self._generate_normal(payload, output_path)
    
    def _generate_normal(self, payload: dict, output_path: str = None) -> str:
        """非流式生成"""
        response = requests.post(
            self.BASE_URL,
            headers=self.headers,
            json=payload,
            timeout=120
        )
        response.raise_for_status()
        
        data = response.json()
        
        # 提取 base64 图片数据
        content = data["choices"][0]["message"]["content"]
        if isinstance(content, list):
            image_data = content[0]["image_url"]["url"]
        else:
            # 兼容可能的其他格式
            image_data = content
        
        return self._save_image(image_data, output_path)
    
    def _generate_stream(self, payload: dict, output_path: str = None) -> str:
        """流式生成"""
        response = requests.post(
            self.BASE_URL,
            headers={**self.headers, "Accept": "application/json, text/event-stream"},
            json=payload,
            stream=True,
            timeout=120
        )
        response.raise_for_status()
        
        image_data = None
        
        for line in response.iter_lines():
            if not line:
                continue
            
            line_str = line.decode("utf-8")
            if line_str.startswith("data: "):
                data_str = line_str[6:]
                if data_str == "[DONE]":
                    break
                
                try:
                    data = json.loads(data_str)
                    delta = data["choices"][0]["delta"]
                    if "content" in delta:
                        content = delta["content"]
                        if isinstance(content, dict) and content.get("type") == "image_url":
                            image_data = content["image_url"]["url"]
                except json.JSONDecodeError:
                    continue
        
        if not image_data:
            raise ValueError("未能从流式响应中获取图片数据")
        
        return self._save_image(image_data, output_path)
    
    def _save_image(self, base64_data: str, output_path: str = None) -> str:
        """保存 base64 图片到文件"""
        if not output_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"output_{timestamp}.png"
        
        # 解码并保存
        image_bytes = base64.b64decode(base64_data)
        with open(output_path, "wb") as f:
            f.write(image_bytes)
        
        print(f"图片已保存: {output_path}")
        return output_path
    
    def _image_to_base64(self, image_path: str) -> str:
        """
        将图片文件转换为 base64 编码
        
        Args:
            image_path: 图片文件路径
            
        Returns:
            base64 编码的图片数据（含 data URI 前缀）
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片文件不存在: {image_path}")
        
        # 根据文件扩展名确定 MIME 类型
        ext = os.path.splitext(image_path)[1].lower()
        mime_types = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".bmp": "image/bmp"
        }
        mime_type = mime_types.get(ext, "image/png")
        
        # 读取并编码
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        base64_data = base64.b64encode(image_data).decode("utf-8")
        return f"data:{mime_type};base64,{base64_data}"
    
    def edit_image(
        self,
        input_image: str,
        prompt: str,
        output_path: str = None,
        temperature: float = 1.0,
        top_p: float = 0.95,
        max_tokens: int = 4000,
        stream: bool = False
    ) -> str:
        """
        图生图（图片修改/编辑）
        
        根据输入图片和修改指令生成新图片。
        
        Args:
            input_image: 输入图片路径（支持 png/jpg/jpeg/gif/webp/bmp）
            prompt: 修改指令，描述如何修改图片（如 "加一只兔子"）
            output_path: 输出文件路径，默认为 edited_<timestamp>.png
            temperature: 温度参数 0~1，默认 1.0
            top_p: top_p 参数 0~1，默认 0.95
            max_tokens: 最大令牌数，默认 4000
            stream: 是否流式输出，默认 False
            
        Returns:
            保存的文件路径
            
        Example:
            >>> generator = ImageGenerator(api_key)
            >>> result = generator.edit_image(
            ...     input_image="original.png",
            ...     prompt="把背景改成夜晚星空",
            ...     output_path="night_version.png"
            ... )
        """
        # 将输入图片转换为 base64
        print(f"正在读取图片: {input_image}")
        image_base64_url = self._image_to_base64(input_image)
        
        # 构建请求体 - 图生图使用多内容消息格式
        payload = {
            "model": self.MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_base64_url
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "stream": stream,
            "temperature": max(0, min(1, temperature)),
            "top_p": max(0, min(1, top_p)),
            "max_tokens": max_tokens
        }
        
        print(f"正在根据指令修改图片: {prompt}")
        
        # 默认输出路径
        if not output_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"edited_{timestamp}.png"
        
        if stream:
            return self._generate_stream(payload, output_path)
        else:
            return self._generate_normal(payload, output_path)
    
    def edit_image_from_base64(
        self,
        input_base64: str,
        prompt: str,
        output_path: str = None,
        temperature: float = 1.0,
        top_p: float = 0.95,
        max_tokens: int = 4000,
        stream: bool = False
    ) -> str:
        """
        图生图（从 base64 数据）
        
        直接使用 base64 编码的图片数据进行修改。
        
        Args:
            input_base64: base64 编码的图片数据（可带或不带 data URI 前缀）
            prompt: 修改指令
            output_path: 输出文件路径
            temperature: 温度参数 0~1
            top_p: top_p 参数 0~1
            max_tokens: 最大令牌数
            stream: 是否流式输出
            
        Returns:
            保存的文件路径
        """
        # 确保有 data URI 前缀
        if not input_base64.startswith("data:"):
            input_base64 = f"data:image/png;base64,{input_base64}"
        
        # 构建请求体
        payload = {
            "model": self.MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": input_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "stream": stream,
            "temperature": max(0, min(1, temperature)),
            "top_p": max(0, min(1, top_p)),
            "max_tokens": max_tokens
        }
        
        print(f"正在根据指令修改图片: {prompt}")
        
        # 默认输出路径
        if not output_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"edited_{timestamp}.png"
        
        if stream:
            return self._generate_stream(payload, output_path)
        else:
            return self._generate_normal(payload, output_path)


def main():
    """交互式图片生成/编辑"""
    # 从环境变量获取 API Key
    api_key = os.environ.get("API_KEY")
    if not api_key:
        api_key = input("请输入 API Key: ").strip()
    
    if not api_key:
        print("错误: 需要提供 API Key")
        return
    
    # 创建生成器
    generator = ImageGenerator(api_key)
    
    # 选择模式
    print("\n=== Gemini 2.5 Flash Image 生成器 ===")
    print("1. 文生图 - 根据描述生成图片")
    print("2. 图生图 - 根据指令修改图片")
    
    mode = input("\n请选择模式 (1/2，默认1): ").strip()
    
    if mode == "2":
        # 图生图模式
        _run_image_to_image(generator)
    else:
        # 文生图模式（默认）
        _run_text_to_image(generator)


def _run_text_to_image(generator: ImageGenerator):
    """文生图交互"""
    print("\n--- 文生图模式 ---")
    
    # 获取用户输入
    prompt = input("请输入图片描述 (默认: 一只可爱的猫咪): ").strip()
    if not prompt:
        prompt = "一只可爱的猫咪"
    
    aspect = input("请输入宽高比 (如 16:9，回车使用默认): ").strip()
    
    output = input("请输入输出路径 (回车使用默认): ").strip()
    
    # 生成图片
    try:
        output_file = generator.generate(
            prompt=prompt,
            aspect_ratio=aspect if aspect else None,
            output_path=output if output else None,
            stream=False
        )
        print(f"\n✅ 生成成功: {output_file}")
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 请求失败: {e}")
    except Exception as e:
        print(f"\n❌ 生成失败: {e}")


def _run_image_to_image(generator: ImageGenerator):
    """图生图交互"""
    print("\n--- 图生图模式 ---")
    
    # 获取输入图片
    input_path = input("请输入原图路径: ").strip()
    if not input_path:
        print("错误: 必须提供原图路径")
        return
    
    if not os.path.exists(input_path):
        print(f"错误: 文件不存在 - {input_path}")
        return
    
    # 获取修改指令
    prompt = input("请输入修改指令 (如: 把背景改成夜晚): ").strip()
    if not prompt:
        print("错误: 必须提供修改指令")
        return
    
    output = input("请输入输出路径 (回车使用默认): ").strip()
    
    # 高级参数
    print("\n高级参数（回车使用默认值）:")
    temp_str = input("temperature (0~1, 默认1.0): ").strip()
    top_p_str = input("top_p (0~1, 默认0.95): ").strip()
    
    temperature = float(temp_str) if temp_str else 1.0
    top_p = float(top_p_str) if top_p_str else 0.95
    
    # 执行图生图
    try:
        output_file = generator.edit_image(
            input_image=input_path,
            prompt=prompt,
            output_path=output if output else None,
            temperature=temperature,
            top_p=top_p,
            stream=False
        )
        print(f"\n✅ 编辑成功: {output_file}")
    except FileNotFoundError as e:
        print(f"\n❌ 文件错误: {e}")
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 请求失败: {e}")
    except Exception as e:
        print(f"\n❌ 编辑失败: {e}")


if __name__ == "__main__":
    main()


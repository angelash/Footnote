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


def main():
    """示例用法"""
    # 从环境变量获取 API Key
    api_key = os.environ.get("API_KEY")
    if not api_key:
        api_key = input("请输入 API Key: ").strip()
    
    if not api_key:
        print("错误: 需要提供 API Key")
        return
    
    # 创建生成器
    generator = ImageGenerator(api_key)
    
    # 获取用户输入
    prompt = input("请输入图片描述 (默认: 一只可爱的猫咪): ").strip()
    if not prompt:
        prompt = "一只可爱的猫咪"
    
    aspect = input("请输入宽高比 (如 16:9，回车使用默认): ").strip()
    
    # 生成图片
    try:
        output_file = generator.generate(
            prompt=prompt,
            aspect_ratio=aspect if aspect else None,
            stream=False  # 非流式更简单
        )
        print(f"\n✅ 生成成功: {output_file}")
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 请求失败: {e}")
    except Exception as e:
        print(f"\n❌ 生成失败: {e}")


if __name__ == "__main__":
    main()


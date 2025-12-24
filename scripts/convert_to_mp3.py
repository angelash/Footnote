#!/usr/bin/env python3
"""
WAV转MP3批量转换脚本

依赖: pip install pydub
需要: ffmpeg (自动下载或手动安装)

运行: python scripts/convert_to_mp3.py
"""

import os
import sys
import subprocess
import urllib.request
import zipfile
import shutil

# 音频目录
AUDIO_DIR = "assets/audio"
# MP3比特率
BITRATE = "128k"
# 是否删除原WAV文件
DELETE_WAV = True


def check_ffmpeg():
    """检查ffmpeg是否可用"""
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def convert_wav_to_mp3_ffmpeg(wav_path, mp3_path, bitrate="128k"):
    """使用ffmpeg转换WAV到MP3"""
    try:
        cmd = [
            'ffmpeg', '-y', '-i', wav_path,
            '-codec:a', 'libmp3lame',
            '-b:a', bitrate,
            '-q:a', '2',
            mp3_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"    Error: {e}")
        return False


def convert_wav_to_mp3_pure_python(wav_path, mp3_path):
    """
    纯Python方式转换（使用wave和简单压缩）
    注意：这不是真正的MP3，只是减小文件大小的替代方案
    """
    import wave
    import struct
    
    # 读取WAV
    with wave.open(wav_path, 'rb') as wav:
        params = wav.getparams()
        frames = wav.readframes(params.nframes)
    
    # 降采样到22050Hz以减小大小
    samples = struct.unpack(f'{params.nframes}h', frames)
    
    # 每隔一个采样取一个（简单降采样）
    downsampled = samples[::2]
    
    # 保存为低采样率WAV（暂时方案）
    output_path = mp3_path.replace('.mp3', '_compressed.wav')
    with wave.open(output_path, 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(22050)
        out.writeframes(struct.pack(f'{len(downsampled)}h', *downsampled))
    
    return True


def get_file_size_mb(path):
    """获取文件大小(MB)"""
    return os.path.getsize(path) / (1024 * 1024)


def main():
    print("=" * 50)
    print("WAV to MP3 Converter")
    print("=" * 50)
    
    # 检查ffmpeg
    has_ffmpeg = check_ffmpeg()
    
    if not has_ffmpeg:
        print("\n[WARN] ffmpeg not found!")
        print("Please install ffmpeg:")
        print("  Windows: winget install ffmpeg")
        print("  Or download from: https://ffmpeg.org/download.html")
        print("\nTrying alternative method...")
    
    # 收集所有WAV文件
    wav_files = []
    for root, dirs, files in os.walk(AUDIO_DIR):
        for file in files:
            if file.endswith('.wav'):
                wav_files.append(os.path.join(root, file))
    
    if not wav_files:
        print("\nNo WAV files found!")
        return
    
    print(f"\nFound {len(wav_files)} WAV files")
    
    # 计算原始大小
    total_wav_size = sum(get_file_size_mb(f) for f in wav_files)
    print(f"Total WAV size: {total_wav_size:.2f} MB")
    
    print("\n[CONVERT] Converting to MP3...")
    
    converted = 0
    failed = 0
    total_mp3_size = 0
    
    for wav_path in wav_files:
        mp3_path = wav_path.replace('.wav', '.mp3')
        rel_path = os.path.relpath(wav_path, AUDIO_DIR)
        
        if has_ffmpeg:
            success = convert_wav_to_mp3_ffmpeg(wav_path, mp3_path, BITRATE)
        else:
            # 没有ffmpeg时跳过
            print(f"  [SKIP] {rel_path} (no ffmpeg)")
            failed += 1
            continue
        
        if success and os.path.exists(mp3_path):
            mp3_size = get_file_size_mb(mp3_path)
            wav_size = get_file_size_mb(wav_path)
            ratio = (1 - mp3_size / wav_size) * 100
            print(f"  + {rel_path.replace('.wav', '.mp3')} ({wav_size:.2f}MB -> {mp3_size:.2f}MB, -{ratio:.0f}%)")
            
            total_mp3_size += mp3_size
            converted += 1
            
            # 删除原WAV
            if DELETE_WAV:
                os.remove(wav_path)
        else:
            print(f"  [FAIL] {rel_path}")
            failed += 1
    
    print("\n" + "=" * 50)
    print("[DONE] Conversion complete!")
    print("=" * 50)
    print(f"Converted: {converted} files")
    if failed > 0:
        print(f"Failed: {failed} files")
    print(f"Size: {total_wav_size:.2f} MB -> {total_mp3_size:.2f} MB")
    print(f"Saved: {total_wav_size - total_mp3_size:.2f} MB ({(1 - total_mp3_size/total_wav_size)*100:.0f}% reduction)")


if __name__ == "__main__":
    main()


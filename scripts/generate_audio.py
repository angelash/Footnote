#!/usr/bin/env python3
"""
《备注 / Footnote》音频生成脚本

使用程序化方式生成游戏音效和环境音
依赖: pip install numpy scipy soundfile

运行: python scripts/generate_audio.py
"""

import os
import numpy as np
from scipy.io import wavfile
from scipy import signal
import struct
import wave

# 采样率
SAMPLE_RATE = 44100

# 输出目录
OUTPUT_DIR = "assets/audio"


def ensure_dir(path):
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)


def normalize(audio, target_db=-3):
    """归一化音频到目标dB"""
    rms = np.sqrt(np.mean(audio ** 2))
    if rms > 0:
        target_rms = 10 ** (target_db / 20)
        audio = audio * (target_rms / rms)
    return np.clip(audio, -1, 1)


def fade_in_out(audio, fade_in_samples, fade_out_samples):
    """添加淡入淡出"""
    if fade_in_samples > 0:
        fade_in = np.linspace(0, 1, fade_in_samples)
        audio[:fade_in_samples] *= fade_in
    if fade_out_samples > 0:
        fade_out = np.linspace(1, 0, fade_out_samples)
        audio[-fade_out_samples:] *= fade_out
    return audio


def save_wav(filename, audio, sample_rate=SAMPLE_RATE):
    """保存为WAV文件"""
    # 确保在-1到1范围内
    audio = np.clip(audio, -1, 1)
    # 转换为16位整数
    audio_int = (audio * 32767).astype(np.int16)
    wavfile.write(filename, sample_rate, audio_int)
    print(f"  + {filename}")


# ============================================
# 基础波形生成器
# ============================================

def sine_wave(freq, duration, amplitude=1.0):
    """正弦波"""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    return amplitude * np.sin(2 * np.pi * freq * t)


def square_wave(freq, duration, amplitude=1.0):
    """方波"""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    return amplitude * signal.square(2 * np.pi * freq * t)


def sawtooth_wave(freq, duration, amplitude=1.0):
    """锯齿波"""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    return amplitude * signal.sawtooth(2 * np.pi * freq * t)


def noise(duration, amplitude=1.0, color='white'):
    """噪声生成器"""
    samples = int(SAMPLE_RATE * duration)
    white = np.random.randn(samples) * amplitude
    
    if color == 'white':
        return white
    elif color == 'pink':
        # 粉红噪声 (1/f)
        freqs = np.fft.rfftfreq(samples, 1/SAMPLE_RATE)
        freqs[0] = 1  # 避免除零
        fft = np.fft.rfft(white)
        fft = fft / np.sqrt(freqs)
        return np.fft.irfft(fft, samples) * amplitude
    elif color == 'brown':
        # 布朗噪声 (1/f²)
        return np.cumsum(white) / 50 * amplitude
    return white


def envelope_adsr(duration, attack=0.01, decay=0.1, sustain=0.7, release=0.2):
    """ADSR包络"""
    samples = int(SAMPLE_RATE * duration)
    envelope = np.zeros(samples)
    
    attack_samples = int(attack * SAMPLE_RATE)
    decay_samples = int(decay * SAMPLE_RATE)
    release_samples = int(release * SAMPLE_RATE)
    sustain_samples = samples - attack_samples - decay_samples - release_samples
    
    if sustain_samples < 0:
        sustain_samples = 0
    
    idx = 0
    # Attack
    if attack_samples > 0:
        envelope[idx:idx+attack_samples] = np.linspace(0, 1, attack_samples)
        idx += attack_samples
    # Decay
    if decay_samples > 0:
        envelope[idx:idx+decay_samples] = np.linspace(1, sustain, decay_samples)
        idx += decay_samples
    # Sustain
    if sustain_samples > 0:
        envelope[idx:idx+sustain_samples] = sustain
        idx += sustain_samples
    # Release
    if release_samples > 0 and idx < samples:
        release_len = min(release_samples, samples - idx)
        envelope[idx:idx+release_len] = np.linspace(sustain, 0, release_len)
    
    return envelope


# ============================================
# UI音效生成
# ============================================

def generate_ui_sfx():
    """生成UI音效"""
    print("\n[SFX] 生成UI音效...")
    output_dir = f"{OUTPUT_DIR}/sfx/ui"
    ensure_dir(output_dir)
    
    # 1. 按钮悬停 - 轻柔高频
    def button_hover():
        duration = 0.08
        freq = 2000
        audio = sine_wave(freq, duration, 0.3)
        audio *= envelope_adsr(duration, 0.01, 0.02, 0.3, 0.03)
        return normalize(audio, -12)
    
    save_wav(f"{output_dir}/sfx_button_hover.wav", button_hover())
    
    # 2. 按钮点击 - 清脆点击声
    def button_click():
        duration = 0.12
        # 混合多个频率
        audio = sine_wave(800, duration, 0.5) + sine_wave(1200, duration, 0.3)
        audio *= envelope_adsr(duration, 0.005, 0.03, 0.2, 0.05)
        # 添加轻微噪声
        audio += noise(duration, 0.05) * envelope_adsr(duration, 0.001, 0.01, 0, 0.01)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_button_click.wav", button_click())
    
    # 3. 返回/取消 - 下降音调
    def button_back():
        duration = 0.15
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        freq = 600 - 200 * t / duration  # 频率下降
        audio = np.sin(2 * np.pi * freq * t) * 0.4
        audio *= envelope_adsr(duration, 0.01, 0.05, 0.3, 0.05)
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_button_back.wav", button_back())
    
    # 4. 菜单打开 - 上升音效
    def menu_open():
        duration = 0.25
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        freq = 400 + 400 * t / duration
        audio = sine_wave(400, duration, 0.3) + np.sin(2 * np.pi * freq * t) * 0.2
        audio *= envelope_adsr(duration, 0.02, 0.1, 0.5, 0.1)
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_menu_open.wav", menu_open())
    
    # 5. 菜单关闭 - 下降音效
    def menu_close():
        duration = 0.2
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        freq = 800 - 400 * t / duration
        audio = np.sin(2 * np.pi * freq * t) * 0.3
        audio *= envelope_adsr(duration, 0.01, 0.05, 0.3, 0.1)
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_menu_close.wav", menu_close())
    
    # 6. 对话框出现
    def dialogue_appear():
        duration = 0.18
        audio = sine_wave(500, duration, 0.3) + sine_wave(750, duration, 0.2)
        audio *= envelope_adsr(duration, 0.02, 0.05, 0.4, 0.08)
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_dialogue_appear.wav", dialogue_appear())
    
    # 7. 文字打字音 (单个字符)
    def dialogue_text():
        duration = 0.03
        audio = sine_wave(1000, duration, 0.2) + noise(duration, 0.05)
        audio *= envelope_adsr(duration, 0.002, 0.01, 0.1, 0.01)
        return normalize(audio, -15)
    
    save_wav(f"{output_dir}/sfx_dialogue_text.wav", dialogue_text())
    
    # 8. 对话完成
    def dialogue_complete():
        duration = 0.1
        audio = sine_wave(1200, duration, 0.3)
        audio *= envelope_adsr(duration, 0.01, 0.03, 0.2, 0.03)
        return normalize(audio, -10)
    
    save_wav(f"{output_dir}/sfx_dialogue_complete.wav", dialogue_complete())
    
    # 9. 选项出现
    def choice_appear():
        duration = 0.2
        # 多个音调依次出现
        audio = np.zeros(int(SAMPLE_RATE * duration))
        for i, freq in enumerate([600, 750, 900]):
            start = int(i * 0.04 * SAMPLE_RATE)
            tone = sine_wave(freq, 0.1, 0.25) * envelope_adsr(0.1, 0.01, 0.03, 0.3, 0.04)
            end = min(start + len(tone), len(audio))
            audio[start:end] += tone[:end-start]
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_choice_appear.wav", choice_appear())
    
    # 10. 选项选择
    def choice_select():
        duration = 0.15
        audio = sine_wave(800, duration, 0.4) + sine_wave(1200, duration, 0.2)
        audio *= envelope_adsr(duration, 0.01, 0.04, 0.3, 0.06)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_choice_select.wav", choice_select())
    
    # 11. 卡片获取 - 奖励音效
    def card_get():
        duration = 0.4
        # 上升琶音
        audio = np.zeros(int(SAMPLE_RATE * duration))
        freqs = [523, 659, 784, 1047]  # C5, E5, G5, C6
        for i, freq in enumerate(freqs):
            start = int(i * 0.08 * SAMPLE_RATE)
            tone = sine_wave(freq, 0.25, 0.3) * envelope_adsr(0.25, 0.01, 0.05, 0.5, 0.15)
            end = min(start + len(tone), len(audio))
            audio[start:end] += tone[:end-start]
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_card_get.wav", card_get())
    
    # 12. 卡片翻转
    def card_flip():
        duration = 0.2
        audio = noise(duration, 0.15, 'pink')
        audio += sine_wave(300, duration, 0.2)
        audio *= envelope_adsr(duration, 0.02, 0.08, 0.3, 0.08)
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_card_flip.wav", card_flip())
    
    # 13. 存档音效
    def save_game():
        duration = 0.35
        audio = sine_wave(600, duration, 0.3) + sine_wave(900, duration, 0.2)
        audio *= envelope_adsr(duration, 0.02, 0.1, 0.5, 0.15)
        # 添加轻微"写入"声
        audio += noise(duration, 0.05) * envelope_adsr(duration, 0.1, 0.1, 0.1, 0.1)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_save.wav", save_game())
    
    # 14. 读档音效
    def load_game():
        duration = 0.4
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        freq = 400 + 300 * t / duration
        audio = np.sin(2 * np.pi * freq * t) * 0.3
        audio += sine_wave(800, duration, 0.15)
        audio *= envelope_adsr(duration, 0.05, 0.1, 0.5, 0.2)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_load.wav", load_game())
    
    # 15. 通知提示
    def notification():
        duration = 0.25
        audio = sine_wave(880, duration, 0.35) + sine_wave(1100, duration, 0.15)
        audio *= envelope_adsr(duration, 0.01, 0.05, 0.4, 0.15)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_notification.wav", notification())
    
    # 16. 警告提示
    def warning():
        duration = 0.3
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 脉冲效果
        pulse = np.sin(2 * np.pi * 8 * t) * 0.3 + 0.7
        audio = sine_wave(440, duration, 0.4) * pulse
        audio *= envelope_adsr(duration, 0.01, 0.05, 0.6, 0.1)
        return normalize(audio, -5)
    
    save_wav(f"{output_dir}/sfx_warning.wav", warning())
    
    # 17. 错误提示
    def error():
        duration = 0.2
        audio = sine_wave(200, duration, 0.4) + sine_wave(250, duration, 0.3)
        audio *= envelope_adsr(duration, 0.01, 0.05, 0.3, 0.1)
        return normalize(audio, -5)
    
    save_wav(f"{output_dir}/sfx_error.wav", error())


# ============================================
# 游戏音效生成
# ============================================

def generate_game_sfx():
    """生成游戏音效"""
    print("\n[GAME] 生成游戏音效...")
    output_dir = f"{OUTPUT_DIR}/sfx/game"
    ensure_dir(output_dir)
    
    # 1. 深度感知激活 - 空灵展开
    def depth_perception_activate():
        duration = 0.8
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 多层叠加
        base = sine_wave(200, duration, 0.2)
        sweep = np.sin(2 * np.pi * (400 + 600 * t / duration) * t) * 0.3
        shimmer = sine_wave(2000, duration, 0.1) * np.sin(2 * np.pi * 6 * t)
        audio = base + sweep + shimmer
        audio *= envelope_adsr(duration, 0.1, 0.2, 0.6, 0.3)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_depth_perception_activate.wav", depth_perception_activate())
    
    # 2. 深度感知关闭
    def depth_perception_deactivate():
        duration = 0.5
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        freq = 1000 - 600 * t / duration
        audio = np.sin(2 * np.pi * freq * t) * 0.3
        audio += sine_wave(200, duration, 0.15)
        audio *= envelope_adsr(duration, 0.02, 0.1, 0.3, 0.3)
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_depth_perception_deactivate.wav", depth_perception_deactivate())
    
    # 3. 深度介入 - 结构撕裂
    def depth_intervention():
        duration = 1.0
        # 低频撕裂
        base = sine_wave(80, duration, 0.4) + sine_wave(120, duration, 0.3)
        # 噪声层
        crackle = noise(duration, 0.2, 'brown')
        # 高频尖锐
        sharp = sine_wave(1500, duration, 0.15) * envelope_adsr(duration, 0.01, 0.3, 0.1, 0.5)
        audio = base + crackle + sharp
        audio *= envelope_adsr(duration, 0.05, 0.2, 0.5, 0.4)
        return normalize(audio, -4)
    
    save_wav(f"{output_dir}/sfx_depth_intervention.wav", depth_intervention())
    
    # 4. 伤痕产生
    def scar_create():
        duration = 0.5
        audio = noise(duration, 0.3, 'pink')
        audio += sine_wave(150, duration, 0.25)
        # 裂痕声
        crack = noise(0.1, 0.4) * envelope_adsr(0.1, 0.001, 0.02, 0, 0.05)
        audio[:len(crack)] += crack
        audio *= envelope_adsr(duration, 0.01, 0.15, 0.3, 0.25)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_scar_create.wav", scar_create())
    
    # 5. 时间干预 - 倒转扭曲
    def time_intervention():
        duration = 1.2
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 时钟滴答（加速倒转）
        ticks = np.zeros_like(t)
        for i in range(15):
            tick_pos = int((1 - i/15) * 0.8 * len(t))
            if tick_pos < len(ticks) - 1000:
                tick = sine_wave(800, 0.02, 0.3) * envelope_adsr(0.02, 0.001, 0.005, 0.1, 0.01)
                ticks[tick_pos:tick_pos+len(tick)] += tick
        # 扭曲音
        warp = np.sin(2 * np.pi * (300 + 200 * np.sin(2 * np.pi * 2 * t)) * t) * 0.3
        # 低频嗡鸣
        hum = sine_wave(100, duration, 0.2)
        audio = ticks + warp + hum
        audio *= envelope_adsr(duration, 0.1, 0.2, 0.6, 0.4)
        return normalize(audio, -5)
    
    save_wav(f"{output_dir}/sfx_time_intervention.wav", time_intervention())
    
    # 6. 时间污染
    def time_contamination():
        duration = 0.7
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 失真低频
        distort = np.clip(sine_wave(80, duration, 0.5), -0.3, 0.3)
        # 颤抖高频
        tremolo = sine_wave(600, duration, 0.2) * (0.5 + 0.5 * np.sin(2 * np.pi * 12 * t))
        audio = distort + tremolo + noise(duration, 0.1, 'brown')
        audio *= envelope_adsr(duration, 0.05, 0.15, 0.5, 0.3)
        return normalize(audio, -5)
    
    save_wav(f"{output_dir}/sfx_time_contamination.wav", time_contamination())
    
    # 7. 系统更正
    def system_correct():
        duration = 0.35
        # 数据处理声
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        beeps = np.sin(2 * np.pi * (1000 + 500 * np.sin(2 * np.pi * 20 * t)) * t) * 0.2
        click = noise(duration, 0.1) * envelope_adsr(duration, 0.01, 0.05, 0.1, 0.2)
        audio = beeps + click + sine_wave(800, duration, 0.15)
        audio *= envelope_adsr(duration, 0.02, 0.08, 0.4, 0.15)
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_system_correct.wav", system_correct())
    
    # 8. 新字段出现 - 突破感
    def field_new():
        duration = 0.9
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 上升和声
        chord = (sine_wave(440, duration, 0.2) + 
                sine_wave(554, duration, 0.15) + 
                sine_wave(659, duration, 0.15))
        # 展开效果
        sweep = np.sin(2 * np.pi * (200 + 800 * t / duration) * t) * 0.2
        # 闪光
        sparkle = noise(duration, 0.1) * np.sin(2 * np.pi * 8 * t) ** 2
        audio = chord + sweep + sparkle
        audio *= envelope_adsr(duration, 0.1, 0.2, 0.5, 0.4)
        return normalize(audio, -5)
    
    save_wav(f"{output_dir}/sfx_field_new.wav", field_new())
    
    # 9. 交互
    def interact():
        duration = 0.15
        audio = sine_wave(600, duration, 0.3) + sine_wave(900, duration, 0.15)
        audio *= envelope_adsr(duration, 0.01, 0.04, 0.3, 0.06)
        return normalize(audio, -8)
    
    save_wav(f"{output_dir}/sfx_interact.wav", interact())
    
    # 10. 门打开
    def door_open():
        duration = 0.4
        # 吱嘎声
        creak = noise(duration, 0.25, 'pink')
        creak *= envelope_adsr(duration, 0.05, 0.1, 0.5, 0.2)
        # 低频
        thud = sine_wave(100, duration, 0.2) * envelope_adsr(duration, 0.01, 0.1, 0.2, 0.2)
        audio = creak + thud
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_door_open.wav", door_open())
    
    # 11. 进入区域
    def zone_enter():
        duration = 0.5
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 过渡音
        sweep = np.sin(2 * np.pi * (300 + 400 * t / duration) * t) * 0.25
        pad = sine_wave(200, duration, 0.15)
        audio = sweep + pad + noise(duration, 0.05, 'pink')
        audio *= envelope_adsr(duration, 0.05, 0.15, 0.4, 0.25)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_zone_enter.wav", zone_enter())
    
    # 12. 拾取物品
    def item_pickup():
        duration = 0.2
        audio = sine_wave(800, duration, 0.3) + sine_wave(1200, duration, 0.2)
        audio *= envelope_adsr(duration, 0.01, 0.05, 0.3, 0.1)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_item_pickup.wav", item_pickup())
    
    # 13. 漂移发生
    def drift():
        duration = 0.6
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 失真碎片
        glitch = noise(duration, 0.3) * (0.3 + 0.7 * np.random.rand(len(t)))
        # 频率漂移
        drift_tone = np.sin(2 * np.pi * (400 + 200 * np.sin(2 * np.pi * 3 * t)) * t) * 0.25
        audio = glitch + drift_tone
        audio *= envelope_adsr(duration, 0.05, 0.15, 0.5, 0.2)
        return normalize(audio, -6)
    
    save_wav(f"{output_dir}/sfx_drift.wav", drift())
    
    # 14. 裂缝
    def crack():
        duration = 0.3
        audio = noise(0.05, 0.5) * envelope_adsr(0.05, 0.001, 0.01, 0.1, 0.02)
        # 扩展到完整长度
        full = np.zeros(int(SAMPLE_RATE * duration))
        full[:len(audio)] = audio
        full += sine_wave(150, duration, 0.2) * envelope_adsr(duration, 0.01, 0.1, 0.2, 0.15)
        return normalize(full, -6)
    
    save_wav(f"{output_dir}/sfx_crack.wav", crack())
    
    # 15. 坍塌
    def collapse():
        duration = 0.9
        # 多层低频碰撞
        rumble = noise(duration, 0.4, 'brown')
        impacts = np.zeros(int(SAMPLE_RATE * duration))
        for i in range(5):
            pos = int(i * 0.15 * SAMPLE_RATE)
            impact = sine_wave(60 + i * 10, 0.2, 0.3) * envelope_adsr(0.2, 0.01, 0.05, 0.2, 0.1)
            end = min(pos + len(impact), len(impacts))
            impacts[pos:end] += impact[:end-pos]
        audio = rumble + impacts
        audio *= envelope_adsr(duration, 0.05, 0.2, 0.5, 0.4)
        return normalize(audio, -4)
    
    save_wav(f"{output_dir}/sfx_collapse.wav", collapse())
    
    # 16. 伏笔触发
    def foreshadow_trigger():
        duration = 0.4
        # 微妙认知提示
        audio = sine_wave(600, duration, 0.2)
        audio += sine_wave(900, duration, 0.1) * envelope_adsr(duration, 0.1, 0.1, 0.3, 0.2)
        audio *= envelope_adsr(duration, 0.05, 0.1, 0.4, 0.2)
        return normalize(audio, -10)
    
    save_wav(f"{output_dir}/sfx_foreshadow_trigger.wav", foreshadow_trigger())
    
    # 17. R值增加
    def r_increment():
        duration = 0.25
        # 微弱但坚定
        audio = sine_wave(500, duration, 0.2)
        audio *= envelope_adsr(duration, 0.02, 0.08, 0.3, 0.1)
        return normalize(audio, -12)
    
    save_wav(f"{output_dir}/sfx_r_increment.wav", r_increment())


# ============================================
# 环境音生成
# ============================================

def generate_ambience():
    """生成环境音效"""
    print("\n[AMB] 生成环境音效...")
    output_dir = f"{OUTPUT_DIR}/ambience"
    ensure_dir(output_dir)
    
    # 1. 室内办公环境 (30秒循环)
    def indoor_office():
        duration = 30
        samples = int(SAMPLE_RATE * duration)
        # 空调低频嗡鸣
        hum = sine_wave(60, duration, 0.15) + sine_wave(120, duration, 0.08)
        # 轻微噪声
        room_tone = noise(duration, 0.05, 'pink')
        audio = hum + room_tone
        audio = fade_in_out(audio, int(SAMPLE_RATE * 2), int(SAMPLE_RATE * 2))
        return normalize(audio, -18)
    
    save_wav(f"{output_dir}/amb_indoor_office.wav", indoor_office())
    
    # 2. 档案室 (30秒循环)
    def archive():
        duration = 30
        # 安静的嗡鸣
        hum = sine_wave(50, duration, 0.1)
        room = noise(duration, 0.03, 'brown')
        # 偶尔的纸张声（随机位置）
        paper_sounds = np.zeros(int(SAMPLE_RATE * duration))
        for _ in range(3):
            pos = np.random.randint(0, len(paper_sounds) - SAMPLE_RATE)
            paper = noise(0.3, 0.1, 'white') * envelope_adsr(0.3, 0.05, 0.1, 0.3, 0.1)
            paper_sounds[pos:pos+len(paper)] += paper
        audio = hum + room + paper_sounds
        audio = fade_in_out(audio, int(SAMPLE_RATE * 2), int(SAMPLE_RATE * 2))
        return normalize(audio, -20)
    
    save_wav(f"{output_dir}/amb_indoor_archive.wav", archive())
    
    # 3. 异常区域 (30秒循环)
    def anomaly_zone():
        duration = 30
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 低频脉动
        pulse = sine_wave(40, duration, 0.2) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.2 * t))
        # 不安的噪声
        unease = noise(duration, 0.1, 'brown')
        # 偶尔的裂响
        cracks = np.zeros(int(SAMPLE_RATE * duration))
        for _ in range(5):
            pos = np.random.randint(0, len(cracks) - SAMPLE_RATE)
            crack = noise(0.1, 0.15) * envelope_adsr(0.1, 0.001, 0.02, 0.1, 0.05)
            cracks[pos:pos+len(crack)] += crack
        audio = pulse + unease + cracks
        audio = fade_in_out(audio, int(SAMPLE_RATE * 2), int(SAMPLE_RATE * 2))
        return normalize(audio, -15)
    
    save_wav(f"{output_dir}/amb_anomaly_zone.wav", anomaly_zone())
    
    # 4. 深度感知叠加层 (20秒循环)
    def depth_active():
        duration = 20
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 晶体共鸣
        crystal = sine_wave(800, duration, 0.1) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.5 * t))
        crystal += sine_wave(1200, duration, 0.05) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.7 * t))
        # 空间层叠感
        layers = sine_wave(200, duration, 0.1) + sine_wave(300, duration, 0.08)
        audio = crystal + layers
        audio = fade_in_out(audio, int(SAMPLE_RATE * 1), int(SAMPLE_RATE * 1))
        return normalize(audio, -18)
    
    save_wav(f"{output_dir}/amb_depth_active.wav", depth_active())
    
    # 5. 时间扭曲叠加层 (20秒循环)
    def time_distortion():
        duration = 20
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 不规则滴答
        ticks = np.zeros(int(SAMPLE_RATE * duration))
        tick_times = np.cumsum(np.random.uniform(0.3, 1.5, 30))
        for tick_time in tick_times[tick_times < duration]:
            pos = int(tick_time * SAMPLE_RATE)
            if pos < len(ticks) - 2000:
                tick = sine_wave(1000, 0.03, 0.2) * envelope_adsr(0.03, 0.001, 0.005, 0.1, 0.015)
                ticks[pos:pos+len(tick)] += tick
        # 回响扭曲
        warp = sine_wave(150, duration, 0.1) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * t))
        audio = ticks + warp
        audio = fade_in_out(audio, int(SAMPLE_RATE * 1), int(SAMPLE_RATE * 1))
        return normalize(audio, -15)
    
    save_wav(f"{output_dir}/amb_time_distortion.wav", time_distortion())
    
    # 6. 漂移者区域 (30秒循环)
    def drifter_area():
        duration = 30
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 模糊人声（模拟）
        murmur = noise(duration, 0.08, 'pink') * (0.3 + 0.7 * np.sin(2 * np.pi * 0.1 * t))
        # 迷失感
        lost = sine_wave(100, duration, 0.1) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t))
        audio = murmur + lost
        audio = fade_in_out(audio, int(SAMPLE_RATE * 3), int(SAMPLE_RATE * 3))
        return normalize(audio, -18)
    
    save_wav(f"{output_dir}/amb_drifter_area.wav", drifter_area())
    
    # 7. 终局空间 (30秒循环)
    def finale():
        duration = 30
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        # 深空嗡鸣
        deep = sine_wave(30, duration, 0.2) + sine_wave(60, duration, 0.1)
        # 格式化声音
        format_sound = sine_wave(400, duration, 0.05) * (0.2 + 0.8 * np.sin(2 * np.pi * 0.1 * t))
        # 超越感
        transcend = sine_wave(800, duration, 0.03) + sine_wave(1200, duration, 0.02)
        audio = deep + format_sound + transcend
        audio = fade_in_out(audio, int(SAMPLE_RATE * 4), int(SAMPLE_RATE * 4))
        return normalize(audio, -15)
    
    save_wav(f"{output_dir}/amb_finale.wav", finale())


# ============================================
# 主函数
# ============================================

def main():
    print("=" * 50)
    print("《备注 / Footnote》音频生成器")
    print("=" * 50)
    
    # 确保输出目录存在
    ensure_dir(OUTPUT_DIR)
    
    # 生成所有音效
    generate_ui_sfx()
    generate_game_sfx()
    generate_ambience()
    
    print("\n" + "=" * 50)
    print("[DONE] Audio generation complete!")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 50)
    
    # 统计生成的文件
    total = 0
    for root, dirs, files in os.walk(OUTPUT_DIR):
        wav_files = [f for f in files if f.endswith('.wav')]
        if wav_files:
            total += len(wav_files)
    print(f"总计生成: {total} 个音频文件")


if __name__ == "__main__":
    main()


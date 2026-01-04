#!/usr/bin/env python3
"""
《备注 / Footnote》BGM生成脚本

使用程序化方式生成简单的氛围音乐
依赖: pip install numpy scipy

运行: python scripts/generate_bgm.py
"""

import os
import numpy as np
from scipy.io import wavfile
from scipy import signal

# 采样率
SAMPLE_RATE = 44100

# 输出目录
OUTPUT_DIR = "assets/audio/bgm"


def ensure_dir(path):
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)


def normalize(audio, target_db=-6):
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
    audio = np.clip(audio, -1, 1)
    audio_int = (audio * 32767).astype(np.int16)
    wavfile.write(filename, sample_rate, audio_int)
    print(f"  + {filename}")


# ============================================
# 音乐基础元素
# ============================================

def sine_wave(freq, duration, amplitude=1.0):
    """正弦波"""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    return amplitude * np.sin(2 * np.pi * freq * t)


def noise(duration, amplitude=1.0, color='white'):
    """噪声"""
    samples = int(SAMPLE_RATE * duration)
    white = np.random.randn(samples) * amplitude
    if color == 'pink':
        freqs = np.fft.rfftfreq(samples, 1/SAMPLE_RATE)
        freqs[0] = 1
        fft = np.fft.rfft(white)
        fft = fft / np.sqrt(freqs)
        return np.fft.irfft(fft, samples) * amplitude
    elif color == 'brown':
        return np.cumsum(white) / 50 * amplitude
    return white


def low_pass_filter(audio, cutoff_freq):
    """低通滤波器"""
    nyquist = SAMPLE_RATE / 2
    normalized_cutoff = cutoff_freq / nyquist
    b, a = signal.butter(4, normalized_cutoff, btype='low')
    return signal.filtfilt(b, a, audio)


def reverb_simple(audio, decay=0.3, delay_ms=50):
    """简单混响"""
    delay_samples = int(delay_ms * SAMPLE_RATE / 1000)
    output = np.copy(audio)
    for i in range(1, 5):
        delayed = np.zeros_like(audio)
        offset = i * delay_samples
        if offset < len(audio):
            delayed[offset:] = audio[:-offset] * (decay ** i)
            output += delayed
    return output / 2


def note_to_freq(note):
    """音符转频率 (A4 = 440Hz)"""
    notes = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    name = note[0].upper()
    octave = int(note[-1]) if note[-1].isdigit() else 4
    sharp = '#' in note
    semitone = notes[name] + (1 if sharp else 0) + (octave - 4) * 12
    return 440 * (2 ** (semitone / 12))


def pad_sound(freq, duration, amplitude=1.0):
    """合成器Pad音色"""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    # 多谐波叠加
    sound = (np.sin(2 * np.pi * freq * t) * 0.5 +
             np.sin(2 * np.pi * freq * 2 * t) * 0.2 +
             np.sin(2 * np.pi * freq * 0.5 * t) * 0.3)
    # 轻微颤音
    vibrato = 1 + 0.01 * np.sin(2 * np.pi * 4 * t)
    sound = sound * vibrato * amplitude
    # 柔和包络
    env = np.ones_like(t)
    attack = int(0.3 * SAMPLE_RATE)
    release = int(0.5 * SAMPLE_RATE)
    env[:attack] = np.linspace(0, 1, attack)
    env[-release:] = np.linspace(1, 0, release)
    return sound * env


def bass_sound(freq, duration, amplitude=1.0):
    """低音音色"""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    sound = (np.sin(2 * np.pi * freq * t) * 0.7 +
             np.sin(2 * np.pi * freq * 2 * t) * 0.3)
    # 简单包络
    env = np.ones_like(t)
    attack = int(0.05 * SAMPLE_RATE)
    release = int(0.3 * SAMPLE_RATE)
    env[:attack] = np.linspace(0, 1, attack)
    env[-release:] = np.linspace(1, 0, release)
    return low_pass_filter(sound * env * amplitude, 300)


# ============================================
# BGM生成函数
# ============================================

def generate_title_bgm():
    """主菜单BGM - 表层涟漪"""
    print("\n  Generating: bgm_title.wav (2:30)")
    duration = 150  # 2:30
    samples = int(SAMPLE_RATE * duration)
    audio = np.zeros(samples)
    t = np.linspace(0, duration, samples, False)
    
    # 低频底层
    bass_drone = sine_wave(55, duration, 0.15)  # A1
    bass_drone += sine_wave(110, duration, 0.08)  # A2
    bass_drone = low_pass_filter(bass_drone, 200)
    audio += bass_drone
    
    # 环境层
    ambient = noise(duration, 0.03, 'brown')
    ambient = low_pass_filter(ambient, 400)
    audio += ambient
    
    # 缓慢的和弦进行
    chord_notes = [
        ['A3', 'C4', 'E4'],  # Am
        ['G3', 'B3', 'D4'],  # G
        ['F3', 'A3', 'C4'],  # F
        ['E3', 'G3', 'B3'],  # Em
    ]
    chord_duration = 15  # 每个和弦15秒
    for i in range(int(duration / (chord_duration * len(chord_notes))) + 1):
        for j, chord in enumerate(chord_notes):
            start_time = (i * len(chord_notes) + j) * chord_duration
            if start_time >= duration:
                break
            for note in chord:
                freq = note_to_freq(note)
                pad = pad_sound(freq, chord_duration, 0.08)
                pad = reverb_simple(pad, 0.4, 80)
                start_sample = int(start_time * SAMPLE_RATE)
                end_sample = min(start_sample + len(pad), samples)
                audio[start_sample:end_sample] += pad[:end_sample - start_sample]
    
    # 高频闪烁
    shimmer_freq = 2000
    shimmer = sine_wave(shimmer_freq, duration, 0.02)
    shimmer *= (0.3 + 0.7 * np.sin(2 * np.pi * 0.1 * t))
    audio += shimmer
    
    audio = normalize(audio, -12)
    audio = fade_in_out(audio, int(3 * SAMPLE_RATE), int(4 * SAMPLE_RATE))
    return audio


def generate_prologue_bgm():
    """序章BGM - 例行偏差"""
    print("\n  Generating: bgm_prologue.wav (3:00)")
    duration = 180  # 3:00
    samples = int(SAMPLE_RATE * duration)
    audio = np.zeros(samples)
    t = np.linspace(0, duration, samples, False)
    
    # 机械节奏底层
    beat_interval = 60 / 85  # 85 BPM
    kick_times = np.arange(0, duration, beat_interval)
    for kick_time in kick_times:
        pos = int(kick_time * SAMPLE_RATE)
        if pos < samples - SAMPLE_RATE:
            kick = sine_wave(50, 0.15, 0.2) * np.exp(-np.linspace(0, 5, int(0.15 * SAMPLE_RATE)))
            end = min(pos + len(kick), samples)
            audio[pos:end] += kick[:end - pos]
    
    # Lo-fi 低频
    bass_line = sine_wave(73.4, duration, 0.12)  # D2
    bass_line += sine_wave(55, duration, 0.08)  # A1
    bass_line = low_pass_filter(bass_line, 150)
    audio += bass_line * (0.7 + 0.3 * np.sin(2 * np.pi * 0.05 * t))
    
    # 简单旋律 (Dm调)
    melody_notes = ['D4', 'F4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4']
    note_duration = 4
    for i in range(int(duration / (note_duration * len(melody_notes))) + 1):
        for j, note in enumerate(melody_notes):
            start_time = (i * len(melody_notes) + j) * note_duration
            if start_time >= duration - note_duration:
                break
            freq = note_to_freq(note)
            tone = pad_sound(freq, note_duration, 0.06)
            start_sample = int(start_time * SAMPLE_RATE)
            end_sample = min(start_sample + len(tone), samples)
            audio[start_sample:end_sample] += tone[:end_sample - start_sample]
    
    # 噪声层
    vinyl = noise(duration, 0.02, 'pink')
    audio += vinyl
    
    audio = normalize(audio, -10)
    audio = fade_in_out(audio, int(2 * SAMPLE_RATE), int(2 * SAMPLE_RATE))
    return audio


def generate_archive_bgm():
    """档案室BGM - 纸页深处"""
    print("\n  Generating: bgm_archive.wav (3:30)")
    duration = 210  # 3:30
    samples = int(SAMPLE_RATE * duration)
    audio = np.zeros(samples)
    t = np.linspace(0, duration, samples, False)
    
    # 深沉底层
    drone = sine_wave(82.4, duration, 0.1)  # E2
    drone += sine_wave(123.5, duration, 0.06)  # B2
    drone = low_pass_filter(drone, 200)
    audio += drone
    
    # Em和弦Pad
    em_chord = ['E3', 'G3', 'B3']
    for note in em_chord:
        freq = note_to_freq(note)
        pad = pad_sound(freq, duration, 0.05)
        pad = reverb_simple(pad, 0.5, 100)
        audio += pad
    
    # 纸张沙沙声模拟
    paper = noise(duration, 0.015, 'pink')
    paper *= (0.3 + 0.7 * np.random.rand(samples))
    audio += paper
    
    # 神秘高频
    mystery = sine_wave(1200, duration, 0.01)
    mystery *= (0.2 + 0.8 * np.sin(2 * np.pi * 0.05 * t))
    audio += mystery
    
    audio = normalize(audio, -14)
    audio = fade_in_out(audio, int(3 * SAMPLE_RATE), int(3 * SAMPLE_RATE))
    return audio


def generate_anomaly_bgm():
    """异常区域BGM - 结构裂隙"""
    print("\n  Generating: bgm_anomaly.wav (2:45)")
    duration = 165  # 2:45
    samples = int(SAMPLE_RATE * duration)
    audio = np.zeros(samples)
    t = np.linspace(0, duration, samples, False)
    
    # 紧张低频脉冲
    pulse_freq = 95 / 60  # ~95 BPM
    pulse = sine_wave(40, duration, 0.2)
    pulse *= (0.5 + 0.5 * np.sin(2 * np.pi * pulse_freq * t))
    audio += pulse
    
    # 失真层
    distort = np.clip(sine_wave(60, duration, 0.3), -0.15, 0.15)
    audio += distort
    
    # 不安和弦 (Cm)
    cm_notes = ['C3', 'Eb3', 'G3']
    for note in cm_notes:
        # 处理升降号
        if 'b' in note:
            base = note.replace('b', '')
            freq = note_to_freq(base) / (2 ** (1/12))
        else:
            freq = note_to_freq(note)
        pad = pad_sound(freq, duration, 0.04)
        audio += pad
    
    # 随机裂响
    for _ in range(int(duration / 3)):
        pos = np.random.randint(0, samples - SAMPLE_RATE)
        crack = noise(0.05, 0.08) * np.exp(-np.linspace(0, 10, int(0.05 * SAMPLE_RATE)))
        end = min(pos + len(crack), samples)
        audio[pos:end] += crack[:end - pos]
    
    # 高频警告
    warning = sine_wave(800, duration, 0.03)
    warning *= np.sin(2 * np.pi * 2 * t) ** 2
    audio += warning
    
    audio = normalize(audio, -10)
    audio = fade_in_out(audio, int(2 * SAMPLE_RATE), int(2 * SAMPLE_RATE))
    return audio


def generate_depth_perception_bgm():
    """深度感知BGM - 透视之眼"""
    print("\n  Generating: bgm_depth_perception.wav (2:00)")
    duration = 120  # 2:00
    samples = int(SAMPLE_RATE * duration)
    audio = np.zeros(samples)
    t = np.linspace(0, duration, samples, False)
    
    # 空灵底层
    ethereal = sine_wave(196, duration, 0.08)  # G3
    ethereal += sine_wave(294, duration, 0.05)  # D4
    ethereal = reverb_simple(ethereal, 0.6, 120)
    audio += ethereal
    
    # 晶体音色
    crystal_freqs = [1200, 1800, 2400]
    for freq in crystal_freqs:
        crystal = sine_wave(freq, duration, 0.02)
        crystal *= (0.3 + 0.7 * np.sin(2 * np.pi * 0.2 * t + freq/1000))
        audio += crystal
    
    # Gm Pad
    gm_notes = ['G3', 'Bb3', 'D4']
    for note in gm_notes:
        if 'b' in note:
            base = note.replace('b', '')
            freq = note_to_freq(base) / (2 ** (1/12))
        else:
            freq = note_to_freq(note)
        pad = pad_sound(freq, duration, 0.04)
        pad = reverb_simple(pad, 0.5, 100)
        audio += pad
    
    audio = normalize(audio, -12)
    audio = fade_in_out(audio, int(1 * SAMPLE_RATE), int(1 * SAMPLE_RATE))
    return audio


def generate_drifter_bgm():
    """漂移者BGM - 错位记忆"""
    print("\n  Generating: bgm_drifter.wav (3:15)")
    duration = 195  # 3:15
    samples = int(SAMPLE_RATE * duration)
    audio = np.zeros(samples)
    t = np.linspace(0, duration, samples, False)
    
    # 破碎底层
    broken = noise(duration, 0.06, 'brown')
    broken *= (0.4 + 0.6 * np.sin(2 * np.pi * 0.08 * t))
    audio += broken
    
    # 悲伤Fm和弦
    fm_notes = ['F3', 'Ab3', 'C4']
    for note in fm_notes:
        if 'b' in note:
            base = note.replace('b', '')
            freq = note_to_freq(base) / (2 ** (1/12))
        else:
            freq = note_to_freq(note)
        pad = pad_sound(freq, duration, 0.05)
        pad = reverb_simple(pad, 0.5, 100)
        audio += pad
    
    # 碎片化旋律
    fragment_notes = ['C5', 'Ab4', 'F4', 'C4']
    for i, note in enumerate(fragment_notes * 10):
        start_time = i * 4 + np.random.uniform(-0.5, 0.5)
        if start_time < 0 or start_time >= duration - 2:
            continue
        if 'b' in note:
            base = note.replace('b', '')
            freq = note_to_freq(base) / (2 ** (1/12))
        else:
            freq = note_to_freq(note)
        tone = sine_wave(freq, 1.5, 0.04)
        tone *= np.exp(-np.linspace(0, 3, len(tone)))
        tone = reverb_simple(tone, 0.4, 80)
        start_sample = int(start_time * SAMPLE_RATE)
        end_sample = min(start_sample + len(tone), samples)
        audio[start_sample:end_sample] += tone[:end_sample - start_sample]
    
    # 迷失感调制
    audio *= (0.6 + 0.4 * np.sin(2 * np.pi * 0.03 * t))
    
    audio = normalize(audio, -12)
    audio = fade_in_out(audio, int(4 * SAMPLE_RATE), int(4 * SAMPLE_RATE))
    return audio


def generate_finale_bgm():
    """终局BGM - 收敛边界"""
    print("\n  Generating: bgm_finale.wav (4:00)")
    duration = 240  # 4:00
    samples = int(SAMPLE_RATE * duration)
    audio = np.zeros(samples)
    t = np.linspace(0, duration, samples, False)
    
    # 庄严低频
    bass = sine_wave(55, duration, 0.15)  # A1
    bass += sine_wave(82.4, duration, 0.1)  # E2
    bass = low_pass_filter(bass, 150)
    audio += bass
    
    # 史诗Pad进行 (Bm)
    bm_notes = ['B2', 'D3', 'F#3']
    for note in bm_notes:
        if '#' in note:
            base = note.replace('#', '')
            freq = note_to_freq(base) * (2 ** (1/12))
        else:
            freq = note_to_freq(note)
        pad = pad_sound(freq, duration, 0.06)
        pad = reverb_simple(pad, 0.6, 150)
        audio += pad
    
    # 命运感上升
    rise = np.zeros(samples)
    for i in range(8):
        start = int(i * duration / 8 * SAMPLE_RATE)
        freq = 200 + i * 50
        rise_tone = sine_wave(freq, duration / 8, 0.03 + i * 0.005)
        end = min(start + len(rise_tone), samples)
        rise[start:end] = rise_tone[:end - start]
    audio += rise
    
    # 超越感高频
    transcend = sine_wave(1000, duration, 0.02)
    transcend += sine_wave(1500, duration, 0.01)
    transcend *= (0.2 + 0.8 * np.sin(2 * np.pi * 0.02 * t))
    audio += transcend
    
    audio = normalize(audio, -10)
    audio = fade_in_out(audio, int(5 * SAMPLE_RATE), int(5 * SAMPLE_RATE))
    return audio


def generate_ending_bgm():
    """结局BGM - 余波"""
    print("\n  Generating: bgm_ending.wav (4:30)")
    duration = 270  # 4:30
    samples = int(SAMPLE_RATE * duration)
    audio = np.zeros(samples)
    t = np.linspace(0, duration, samples, False)
    
    # 钢琴式Pad (Am进行)
    chord_progression = [
        ['A3', 'C4', 'E4'],   # Am
        ['F3', 'A3', 'C4'],   # F
        ['C3', 'E3', 'G3'],   # C
        ['G3', 'B3', 'D4'],   # G
    ]
    chord_duration = 8
    
    for i in range(int(duration / (chord_duration * len(chord_progression))) + 1):
        for j, chord in enumerate(chord_progression):
            start_time = (i * len(chord_progression) + j) * chord_duration
            if start_time >= duration - chord_duration:
                break
            for note in chord:
                freq = note_to_freq(note)
                # 钢琴式衰减
                piano = sine_wave(freq, chord_duration, 0.08)
                piano *= np.exp(-np.linspace(0, 2, len(piano)))
                piano = reverb_simple(piano, 0.5, 100)
                start_sample = int(start_time * SAMPLE_RATE)
                end_sample = min(start_sample + len(piano), samples)
                audio[start_sample:end_sample] += piano[:end_sample - start_sample]
    
    # 弦乐Pad
    strings = sine_wave(220, duration, 0.04)  # A3
    strings += sine_wave(330, duration, 0.03)  # E4
    strings = low_pass_filter(strings, 800)
    strings = reverb_simple(strings, 0.6, 150)
    audio += strings * (0.5 + 0.5 * np.sin(2 * np.pi * 0.02 * t))
    
    # 回顾感
    audio *= np.linspace(1, 0.3, samples)  # 整体渐弱
    
    audio = normalize(audio, -10)
    audio = fade_in_out(audio, int(3 * SAMPLE_RATE), int(8 * SAMPLE_RATE))
    return audio


# ============================================
# 主函数
# ============================================

def main():
    print("=" * 50)
    print("Footnote BGM Generator")
    print("=" * 50)
    
    ensure_dir(OUTPUT_DIR)
    
    print("\n[BGM] Generating background music...")
    
    # 生成所有BGM
    bgms = [
        ('bgm_title.wav', generate_title_bgm),
        ('bgm_prologue.wav', generate_prologue_bgm),
        ('bgm_archive.wav', generate_archive_bgm),
        ('bgm_anomaly.wav', generate_anomaly_bgm),
        ('bgm_depth_perception.wav', generate_depth_perception_bgm),
        ('bgm_drifter.wav', generate_drifter_bgm),
        ('bgm_finale.wav', generate_finale_bgm),
        ('bgm_ending.wav', generate_ending_bgm),
    ]
    
    for filename, generator in bgms:
        audio = generator()
        save_wav(f"{OUTPUT_DIR}/{filename}", audio)
    
    print("\n" + "=" * 50)
    print("[DONE] BGM generation complete!")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 50)
    print(f"Total: {len(bgms)} BGM tracks")


if __name__ == "__main__":
    main()


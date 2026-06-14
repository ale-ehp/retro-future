#!/usr/bin/env python3
"""Generate lightweight cinematic electro-orchestral audio mockups.

The output is intentionally original: no melodies, stems, or sampled material
from existing scores. It renders short loopable cues for the retro-future demo.
"""

from __future__ import annotations

import math
import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt


SR = 48_000
BPM = 96
BEAT = 60.0 / BPM
LOOP_SECONDS = BEAT * 32
CYCLES = 3
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "tecnologie" / "retro-future" / "audio" / "music-mockups"


def midi_to_hz(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def env_ar(length: int, attack: float, release: float) -> np.ndarray:
    env = np.ones(max(1, length), dtype=np.float32)
    a = min(length, max(1, int(attack * SR)))
    r = min(length, max(1, int(release * SR)))
    env[:a] *= np.linspace(0.0, 1.0, a, dtype=np.float32)
    env[-r:] *= np.linspace(1.0, 0.0, r, dtype=np.float32)
    return env


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    cutoff = float(np.clip(cutoff, 40.0, SR * 0.45))
    sos = butter(order, cutoff, btype="lowpass", fs=SR, output="sos")
    return sosfilt(sos, x).astype(np.float32)


def bandpass(x: np.ndarray, low: float, high: float, order: int = 2) -> np.ndarray:
    low = float(np.clip(low, 20.0, SR * 0.4))
    high = float(np.clip(high, low + 20.0, SR * 0.45))
    sos = butter(order, [low, high], btype="bandpass", fs=SR, output="sos")
    return sosfilt(sos, x).astype(np.float32)


def saw(phase: np.ndarray) -> np.ndarray:
    return (2.0 * (phase / (2.0 * np.pi) % 1.0) - 1.0).astype(np.float32)


def triangle(phase: np.ndarray) -> np.ndarray:
    return (2.0 * np.abs(2.0 * (phase / (2.0 * np.pi) % 1.0) - 1.0) - 1.0).astype(np.float32)


def add_stereo(buf: np.ndarray, mono: np.ndarray, start: int, gain: float, pan: float) -> None:
    if start >= len(buf) or start + len(mono) <= 0:
        return
    left = max(0, -start)
    right = min(len(mono), len(buf) - start)
    if right <= left:
        return
    segment = mono[left:right] * gain
    p = float(np.clip(pan, -1.0, 1.0))
    lg = math.cos((p + 1.0) * math.pi * 0.25)
    rg = math.sin((p + 1.0) * math.pi * 0.25)
    dst = slice(start + left, start + right)
    buf[dst, 0] += segment * lg
    buf[dst, 1] += segment * rg


def synth_note(
    freq: float,
    dur: float,
    *,
    shape: str,
    attack: float,
    release: float,
    detune_cents: float = 0.0,
    cutoff: float | None = None,
    vibrato: float = 0.0,
) -> np.ndarray:
    length = max(1, int(dur * SR))
    t = np.arange(length, dtype=np.float32) / SR
    f = freq * (2.0 ** (detune_cents / 1200.0))
    if vibrato:
      f = f * (1.0 + np.sin(2.0 * np.pi * 4.7 * t) * vibrato)
    phase = 2.0 * np.pi * np.cumsum(np.full(length, f, dtype=np.float32)) / SR
    if shape == "saw":
        wave = saw(phase)
    elif shape == "tri":
        wave = triangle(phase)
    else:
        wave = np.sin(phase).astype(np.float32)
    wave *= env_ar(length, attack, release)
    if cutoff:
        wave = lowpass(wave, cutoff)
    return wave.astype(np.float32)


def add_ensemble(
    buf: np.ndarray,
    start_s: float,
    midi: float,
    dur: float,
    gain: float,
    *,
    shape: str = "saw",
    attack: float = 0.08,
    release: float = 0.4,
    cutoff: float = 1400,
    pan: float = 0.0,
    spread: float = 0.35,
    voices: int = 5,
) -> None:
    detunes = np.linspace(-9.0, 9.0, voices)
    for i, detune in enumerate(detunes):
        local_pan = pan + np.linspace(-spread, spread, voices)[i]
        note = synth_note(
            midi_to_hz(midi),
            dur,
            shape=shape,
            attack=attack,
            release=release,
            detune_cents=float(detune),
            cutoff=cutoff,
            vibrato=0.0015,
        )
        add_stereo(buf, note, int(start_s * SR), gain / voices, local_pan)


def add_brass_stab(buf: np.ndarray, start_s: float, midis: list[float], dur: float, gain: float) -> None:
    for idx, midi in enumerate(midis):
        add_ensemble(
            buf,
            start_s + idx * 0.012,
            midi,
            dur,
            gain,
            shape="saw",
            attack=0.035,
            release=0.55,
            cutoff=900 + idx * 180,
            pan=-0.25 + idx * 0.15,
            spread=0.18,
            voices=4,
        )
        add_ensemble(
            buf,
            start_s + 0.02 + idx * 0.010,
            midi - 12,
            dur * 0.85,
            gain * 0.42,
            shape="tri",
            attack=0.04,
            release=0.65,
            cutoff=520,
            pan=0.22 - idx * 0.12,
            spread=0.12,
            voices=3,
        )


def add_sub_hit(buf: np.ndarray, start_s: float, midi: float, gain: float, dur: float = 1.15) -> None:
    length = max(1, int(dur * SR))
    t = np.arange(length, dtype=np.float32) / SR
    f0 = midi_to_hz(midi)
    freq = f0 * (0.55 + 0.45 * np.exp(-t * 3.5))
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    wave = np.sin(phase) * np.exp(-t * 2.25)
    add_stereo(buf, wave.astype(np.float32), int(start_s * SR), gain, 0.0)


def add_cinematic_noise(buf: np.ndarray, start_s: float, dur: float, gain: float, low: float, high: float, pan: float) -> None:
    length = max(1, int(dur * SR))
    rng = np.random.default_rng(int((start_s * 1000) % 1_000_000) + 1234)
    noise = rng.normal(0.0, 0.35, length).astype(np.float32)
    noise = bandpass(noise, low, high)
    noise *= env_ar(length, 0.02, min(0.8, dur * 0.4))
    add_stereo(buf, noise, int(start_s * SR), gain, pan)


def add_orchestral_pulse(buf: np.ndarray, start_s: float, midi: float, gain: float, pan: float = 0.0) -> None:
    add_ensemble(
        buf,
        start_s,
        midi,
        BEAT * 0.72,
        gain,
        shape="saw",
        attack=0.018,
        release=0.18,
        cutoff=1300,
        pan=pan,
        spread=0.18,
        voices=4,
    )
    add_ensemble(
        buf,
        start_s + 0.012,
        midi - 12,
        BEAT * 0.65,
        gain * 0.36,
        shape="tri",
        attack=0.02,
        release=0.20,
        cutoff=600,
        pan=-pan,
        spread=0.10,
        voices=3,
    )


def add_reverb(buf: np.ndarray, amount: float = 0.23) -> np.ndarray:
    out = buf.copy()
    delays = [0.071, 0.113, 0.179, 0.241, 0.317, 0.401]
    gains = [0.42, 0.34, 0.27, 0.22, 0.18, 0.13]
    for i, (delay, gain) in enumerate(zip(delays, gains)):
        offset = int(delay * SR)
        wet = np.zeros_like(buf)
        wet[offset:] = buf[:-offset] * gain
        if i % 2:
            wet = wet[:, ::-1]
        out += wet * amount
    return out


def master(buf: np.ndarray) -> np.ndarray:
    buf = add_reverb(buf, 0.28)
    buf = lowpass(buf.T, 10_500).T
    buf = np.tanh(buf * 1.35)
    peak = float(np.max(np.abs(buf))) or 1.0
    return (buf / peak * 0.92).astype(np.float32)


@dataclass(frozen=True)
class Cue:
    slug: str
    title: str
    roots: tuple[int, int, int, int]
    ostinato: tuple[int, ...]
    density: float
    brass: float
    air: float


CUES = [
    Cue(
        "01-grid-overture",
        "Grid Overture",
        (28, 26, 31, 24),
        (0, 0, 7, 0, 3, 0, 7, 3, 0, 7, 12, 7, 3, 0, 7, 12),
        0.78,
        0.70,
        0.52,
    ),
    Cue(
        "02-city-ascent",
        "City Ascent",
        (31, 33, 28, 36),
        (0, 7, 12, 7, 3, 7, 12, 15, 0, 7, 10, 7, 3, 7, 12, 17),
        0.94,
        0.54,
        0.44,
    ),
    Cue(
        "03-portal-brass",
        "Portal Brass",
        (24, 31, 29, 26),
        (0, 0, 0, 7, 0, 3, 0, 7, 0, 10, 7, 3, 0, 7, 12, 10),
        0.62,
        0.98,
        0.35,
    ),
    Cue(
        "04-recognizer-pulse",
        "Recognizer Pulse",
        (26, 28, 33, 31),
        (0, 12, 7, 12, 3, 12, 7, 12, 0, 12, 10, 12, 3, 12, 7, 15),
        1.12,
        0.64,
        0.40,
    ),
]


def render_cycle(cue: Cue, cycle: int, buf: np.ndarray, offset_s: float) -> None:
    for bar in range(8):
        root = cue.roots[(bar // 2) % len(cue.roots)]
        bar_start = offset_s + bar * BEAT * 4
        chord = [root, root + 7, root + 12, root + 15, root + 19]
        if bar % 2 == 0:
            add_sub_hit(buf, bar_start, root - 12, 0.45 + 0.10 * cue.brass)
            add_brass_stab(buf, bar_start, chord, BEAT * (2.8 if bar == 0 else 2.1), 0.055 * cue.brass)
        if bar % 4 == 0:
            add_cinematic_noise(buf, bar_start + BEAT * 0.5, BEAT * 5.5, 0.040 * cue.air, 500, 2300, 0.0)
        for step in range(16):
            t = bar_start + step * BEAT / 4
            degree = cue.ostinato[step % len(cue.ostinato)]
            accent = 1.35 if step in (0, 6, 10, 14) else 1.0
            if step % 2 == 0 or cue.density > 1.0:
                add_orchestral_pulse(
                    buf,
                    t,
                    root + 24 + degree,
                    0.030 * cue.density * accent,
                    pan=-0.18 if step % 4 == 0 else 0.18,
                )
            if step in (6, 14):
                add_cinematic_noise(buf, t + 0.05, 0.09, 0.028 * cue.density, 1800, 6500, 0.25)
        if bar in (3, 7):
            add_ensemble(
                buf,
                bar_start + BEAT * 2.0,
                root + 36,
                BEAT * 3.0,
                0.045,
                shape="tri",
                attack=0.45,
                release=0.85,
                cutoff=1800,
                pan=0.0,
                spread=0.55,
                voices=7,
            )


def render_cue(cue: Cue) -> np.ndarray:
    total_seconds = LOOP_SECONDS * CYCLES
    buf = np.zeros((int(total_seconds * SR), 2), dtype=np.float32)
    for cycle in range(CYCLES):
        render_cycle(cue, cycle, buf, cycle * LOOP_SECONDS)
    start = int(LOOP_SECONDS * SR)
    end = int(LOOP_SECONDS * 2 * SR)
    return master(buf[start:end])


def write_opus(cue: Cue, audio: np.ndarray) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wav_path = OUT_DIR / f"{cue.slug}.wav"
    opus_path = OUT_DIR / f"{cue.slug}.opus"
    wavfile.write(wav_path, SR, np.int16(np.clip(audio, -1.0, 1.0) * 32767))
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(wav_path),
            "-c:a",
            "libopus",
            "-b:a",
            "112k",
            "-vbr",
            "on",
            str(opus_path),
        ],
        check=True,
    )
    wav_path.unlink(missing_ok=True)
    return opus_path


def main() -> None:
    for cue in CUES:
        audio = render_cue(cue)
        path = write_opus(cue, audio)
        print(f"{cue.title}: {path.relative_to(ROOT)} ({path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()

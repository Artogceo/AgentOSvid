# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Audio Transcription (Whisper)

**Tool:** OpenAI Whisper (local, no API key)
**Binary:** `/opt/homebrew/bin/whisper`
**Models:** `~/.cache/whisper/` (base, small, large-v3-turbo, tiny)

### Usage

```bash
# Basic transcription
whisper /path/to/audio.ogg --model small --language ru --output_format txt --output_dir /tmp

# Available models (speed vs accuracy)
# tiny   - fastest, lowest accuracy
# base   - fast, good accuracy
# small  - balanced (recommended)
# medium - slower, better accuracy
# large-v3-turbo - best accuracy, slowest

# Output formats: txt, vtt, srt, tsv, json
```

### Quick Transcribe Function

```bash
# Add to .zshrc or use directly
transcribe() {
    whisper "$1" --model small --language ru --output_format txt --output_dir /tmp
    cat "/tmp/$(basename "$1" .ogg).txt"
}
```

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

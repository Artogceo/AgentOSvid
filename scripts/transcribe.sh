#!/usr/bin/env bash
#
# Transcribe audio using local Whisper
# Usage: ./transcribe.sh /path/to/audio.ogg [language]
#

AUDIO_FILE="$1"
LANGUAGE="${2:-ru}"
MODEL="${3:-small}"

if [ -z "$AUDIO_FILE" ]; then
    echo "Usage: $0 /path/to/audio.ogg [language] [model]"
    echo "Languages: ru, en, etc. (default: ru)"
    echo "Models: tiny, base, small, medium, large-v3-turbo (default: small)"
    exit 1
fi

if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: File not found: $AUDIO_FILE"
    exit 1
fi

echo "Transcribing $(basename "$AUDIO_FILE")..."
echo "Language: $LANGUAGE, Model: $MODEL"
echo ""

whisper "$AUDIO_FILE" \
    --model "$MODEL" \
    --language "$LANGUAGE" \
    --output_format txt \
    --output_dir /tmp \
    --verbose False

OUTPUT_FILE="/tmp/$(basename "$AUDIO_FILE" | sed 's/\.[^.]*$//').txt"

if [ -f "$OUTPUT_FILE" ]; then
    echo ""
    echo "=== TRANSCRIPTION ==="
    cat "$OUTPUT_FILE"
    echo ""
    echo "====================="
    rm "$OUTPUT_FILE"
else
    echo "Error: Transcription failed"
    exit 1
fi

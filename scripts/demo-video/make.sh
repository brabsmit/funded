#!/bin/zsh
# Part 5 demo video, end to end: pinned build → voiceover → frames → 1080p mp4.
# Usage: scripts/demo-video/make.sh <workDir> [asOf=2026-10-03]
# Voice: ElevenLabs when ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are set; otherwise a macOS `say` scratch track for timing.
set -euo pipefail
cd "${0:A:h}/../.."
WORK=${1:?work dir}; ASOF=${2:-2026-10-03}; PORT=4399; PAD=0.8
mkdir -p "$WORK/www"

FUNDED_AS_OF=$ASOF npx astro build --outDir "$WORK/www/funded" >/dev/null

rm -f "$WORK/vo.alignment.json"
if [[ -n "${ELEVENLABS_API_KEY:-}" && -n "${ELEVENLABS_VOICE_ID:-}" ]]; then
  node scripts/demo-video/tts.mjs "$WORK"; VO="$WORK/vo.mp3"; OUT="$WORK/part 5 - the tool.mp4"
else
  sed -E 's/<break[^>]*>//g' scripts/demo-video/vo.txt | say -r 165 -o "$WORK/vo.aiff"; VO="$WORK/vo.aiff"; OUT="$WORK/part 5 - SCRATCH VOICE.mp4"
fi
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VO")

python3 -m http.server $PORT -d "$WORK/www" >/dev/null 2>&1 &
SRV=$!; trap "kill $SRV" EXIT; sleep 1
node scripts/demo-video/render.mjs "$WORK" "http://localhost:$PORT/funded/" "$DUR"

ffmpeg -v error -y -framerate 30 -i "$WORK/frames/f%05d.png" -i "$VO" \
  -af "adelay=${PAD}s:all=1,apad,loudnorm=I=-16:TP=-1.5" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest -movflags +faststart "$OUT"
echo "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact "$OUT"

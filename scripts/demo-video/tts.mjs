// ElevenLabs voiceover for the part 5 demo. Writes vo.mp3 and vo.alignment.json (character timings) to OUT.
// Usage: ELEVENLABS_API_KEY=... [ELEVENLABS_VOICE_ID=...] node scripts/demo-video/tts.mjs <outDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? here;
const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error('Set ELEVENLABS_API_KEY');
const api = (path, init = {}) => fetch(`https://api.elevenlabs.io${path}`, { ...init, headers: { 'xi-api-key': key, 'content-type': 'application/json', ...init.headers } });

if (process.argv.includes('--voices')) {
  const r = await api('/v2/voices?page_size=100');
  if (!r.ok) throw new Error(`voices: ${r.status} ${await r.text()}`);
  for (const v of (await r.json()).voices) console.log(`${v.voice_id}  ${v.category.padEnd(12)} ${v.name}`);
  process.exit(0);
}

const voice = process.env.ELEVENLABS_VOICE_ID;
if (!voice) throw new Error('Set ELEVENLABS_VOICE_ID (list with --voices)');
const text = readFileSync(join(here, 'vo.txt'), 'utf8').trim();
const r = await api(`/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_192`, {
  method: 'POST',
  body: JSON.stringify({
    text,
    model_id: process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: Number(process.env.ELEVENLABS_SPEED ?? 0.88) },
  }),
});
if (!r.ok) throw new Error(`tts: ${r.status} ${await r.text()}`);
const { audio_base64, alignment } = await r.json();
writeFileSync(join(out, 'vo.mp3'), Buffer.from(audio_base64, 'base64'));
writeFileSync(join(out, 'vo.alignment.json'), JSON.stringify({ text: alignment.characters.join(''), starts: alignment.character_start_times_seconds }));
console.log(`wrote vo.mp3 (${alignment.character_end_times_seconds.at(-1).toFixed(1)}s) and vo.alignment.json to ${out}`);

// يولّد موسيقى خلفية هادئة بطابع شرقي (حجاز على الريه) من الصفر: لا حقوق نشر
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const SR = 44100, DUR = 240, BPM = 76, beat = 60 / BPM;
const N = SR * DUR, L = new Float32Array(N), R = new Float32Array(N);
const hz = m => 440 * 2 ** ((m - 69) / 12);
// D=62. أوتار: Dm, Eb, Dm, A
const chords = [[50, 62, 65, 69], [51, 63, 67, 70], [50, 62, 65, 69], [45, 61, 64, 69]];
const scale = [62, 63, 66, 67, 69, 70, 72, 74]; // D Eb F# G A Bb C D (حجاز)
const barLen = beat * 4;
function add(t0, dur, f, amp, atk, rel, harm, pan) {
  const i0 = Math.floor(t0 * SR), n = Math.floor((dur + rel) * SR);
  for (let i = 0; i < n && i0 + i < N; i++) {
    const t = i / SR; let env = t < atk ? t / atk : 1;
    if (t > dur) env *= Math.max(0, 1 - (t - dur) / rel);
    let s = 0; for (let h = 0; h < harm.length; h++) s += harm[h] * Math.sin(2 * Math.PI * f * (h + 1) * t);
    const v = s * env * amp;
    L[i0 + i] += v * (1 - pan); R[i0 + i] += v * (1 + pan);
  }
}
function pluck(t0, m, amp, pan) {
  const f = hz(m), i0 = Math.floor(t0 * SR), n = Math.floor(2.2 * SR);
  for (let i = 0; i < n && i0 + i < N; i++) {
    const t = i / SR, env = Math.exp(-t * 3.2) * Math.min(1, t / 0.004);
    const s = Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 6) + 0.2 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 9);
    const v = s * env * amp; L[i0 + i] += v * (1 - pan); R[i0 + i] += v * (1 + pan);
  }
}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let bar = 0; bar * barLen < DUR; bar++) {
  const t = bar * barLen, ch = chords[bar % 4];
  // وسادة صوتية هادئة
  ch.forEach((m, k) => { add(t, barLen, hz(m), 0.05, 0.9, 1.6, [1, 0.3, 0.1], (k - 1.5) * 0.12); add(t, barLen, hz(m) * 1.003, 0.04, 0.9, 1.6, [1, 0.2], (1.5 - k) * 0.12); });
  // جهير بسيط
  add(t, beat * 3.5, hz(ch[0] - 12), 0.09, 0.4, 1.2, [1, 0.2], 0);
  // نقرات شبه عود: أرجيو على سلم الحجاز
  let idx = [0, 2, 4, 3, 5, 4, 2, 1][bar % 8];
  for (let q = 0; q < 8; q++) {
    if (bar < 2 && q % 2) continue; // مقدمة أخف
    if (rnd() < 0.22) continue;
    const m = scale[(idx + [0, 2, 1, 3, 2, 4, 3, 1][q]) % scale.length] + (q % 4 === 3 ? 12 : 0);
    pluck(t + q * beat / 2, m, 0.09 + 0.03 * (q % 2 === 0), (q % 2 ? 0.25 : -0.25));
  }
}
// صدى بسيط
const dly = Math.floor(0.37 * SR);
for (let i = dly; i < N; i++) { L[i] += R[i - dly] * 0.28; R[i] += L[i - dly] * 0.28; }
// تطبيع
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.8 / pk, buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
writeFileSync("work/music.wav", buf);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", "work/music.wav", "-af", "lowpass=f=5000,loudnorm=I=-20:TP=-2", "-b:a", "192k", "assets/music/nawa-ambient.mp3"]);
console.log("ok");

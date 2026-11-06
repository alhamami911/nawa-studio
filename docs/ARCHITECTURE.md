# Architecture

```
data/series.json        Series and episode plan (source of truth for the dashboard)
src/episodes/*.mjs      One script per episode: meta + steps (speech / text / pre / post)
src/produce.mjs         The engine: voice → recording → camera → captions → mix
src/overlay.js          In-page layer: cursor, glowing frame, transition curtain, cards
src/dashboard.mjs       Production dashboard (dependency-free server) + dashboard-page.mjs
src/share.mjs           Dashboard + Cloudflare tunnel
src/screenshots.mjs     Page screenshots
src/fetch-brand.mjs     Fetch site branding        src/make-music.mjs   Background music
assets/                 brand (committed); music, screens (generated locally, git-ignored)
out/  work/             Output and scratch space (git-ignored)
```

## Production pipeline

1. **Voice.** ElevenLabs is the default when a key is present, otherwise Edge TTS. Clips are cached by an md5 key in `work/<ep>/voice`. There is deliberately no silent fallback between providers: ElevenLabs is retried four times and then the run fails.
2. **Recording.** Playwright at 2560×1440 with page zoom 1.3333 (a 1920×1080 layout). Login happens before recording (`storageState`) so account data never appears on screen. Camera keyframes `{t, z, cx, cy}` are logged during the recording.
3. **Camera.** ffmpeg: static segments (crop + scale) and move segments (`zoompan` with a smootherstep curve, 1.0 s per move, 30 fps), then concatenated.
4. **Captions.** One transparent PNG per sentence, overlaid on the video independently of camera motion. Text is HTML-escaped before rendering.
5. **Final audio.** A per-clip enhancement chain that does not change timing, music with sidechain ducking while speech plays, then `loudnorm`.

Outputs: `out/nawa-<episode>[-suffix].mp4` and a matching `.srt`. Timing metadata is stored in `work/<episode>/meta.json`.

## Dashboard and security

- Local by default (`127.0.0.1`). A request counts as remote if it carries `cf-connecting-ip` / `x-forwarded-for` / `cf-ray` headers or a non-local `Host`, because a tunnel reaches the server from `127.0.0.1`.
- Remote requests need a password unless `DASHBOARD_PUBLIC=1` (read-only). Remote control (starting production) is only enabled with a password of 10+ characters or `DASHBOARD_ALLOW_WEAK=1`.
- Sessions use an `nsess` cookie; failed logins are rate-limited and locked out; session and failure tables are pruned periodically.
- Admin screenshots and job logs are never served to remote clients.
- Responses carry basic security headers.

## Known limitations

- `produce.mjs` is a single file (about 230 lines) with module-level state. Splitting it into voice, recording and mixing modules is worthwhile as episodes grow.
- The target site URL and login fields are hard-coded for Nawa. Supporting several platforms would need a per-platform config file.
- No automated tests. Verification is manual, by reviewing frames from the video. Pure helpers (timeline, caption escaping, SRT writing) are good candidates for the first tests.
- Any change to the live site can break an episode's selectors.
- One `meta.json` per episode: re-mixing after producing a variant with a different voice reuses the timing of the latest run.
- Cloudflare quick tunnels give a temporary URL that only works while `npm run share` is running.

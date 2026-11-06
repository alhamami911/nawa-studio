# Nawa Studio

[![CI](https://github.com/alhamami911/nawa-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/alhamami911/nawa-studio/actions/workflows/ci.yml)

An automated pipeline that produces professional Arabic tutorial videos for the [Nawa](https://nawamusic.com) music-learning platform.

One episode script goes in; a finished video comes out, with a recorded browser session (2560×1440 source), cinematic camera moves, an Arabic voice-over, background music, on-screen captions, branding and an `.srt` subtitle file.

## How it works

```text
episode script ──► voice-over (ElevenLabs / Edge TTS)
               ──► Playwright recording (2560×1440, logged in off-camera)
               ──► camera pass (ffmpeg: holds + smooth zoom/pan moves)
               ──► caption overlays + voice enhancement + music ducking
               ──► out/nawa-<episode>.mp4 + .srt
```

Episodes are plain ES modules that describe *what to click and what to say*; the engine does everything else. A built-in production dashboard shows the status of every planned episode and can trigger production.

## Requirements

- Node.js 20 or newer
- [ffmpeg](https://ffmpeg.org/) on your `PATH`
- Python 3 with `edge-tts` (free fallback voice)
- A Nawa account to record with (use a dedicated, low-privilege account)
- Optional: an [ElevenLabs](https://elevenlabs.io) API key and voice id for the production voice
- Optional: [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to share the dashboard

## Quick start

```bash
git clone https://github.com/alhamami911/nawa-studio.git
cd nawa-studio
npm install
npx playwright install chromium
pip install edge-tts
cp .env.example .env      # then fill in the values (see Configuration)
npm run brand             # fetch logo and colors from the site into assets/brand
npm run music             # generate the background music into assets/music
npm run check             # syntax check of all sources
```

Produce an episode:

```bash
npm run produce -- 01-platform-tour                 # record + voice + mix + export
npm run produce -- 01-platform-tour --remix         # re-edit from the last recording only
npm run produce -- 01-platform-tour --voice=ar-SA-HamedNeural   # free voice instead of ElevenLabs
npm run produce -- 01-platform-tour --suffix=v2     # write out/nawa-01-platform-tour-v2.mp4
```

Output goes to `out/` (git-ignored).

## Configuration

Copy `.env.example` to `.env`. **Never commit `.env`.**

| Variable | Purpose |
|---|---|
| `NAWA_BASE_URL`, `NAWA_USER`, `NAWA_PASSWORD` | Account used for recording |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Production voice. Without them, pass `--voice=ar-SA-HamedNeural` |
| `DASHBOARD_PASSWORD` | Password for remote access to the dashboard (10+ characters to allow remote control) |
| `DASHBOARD_ADMIN_USER` | Admin user name (default `admin`) |
| `DASHBOARD_PUBLIC=1` | Allow anyone with the link to view the dashboard, read-only |
| `DASHBOARD_ALLOW_WEAK=1` | Allow remote control with a short password (not recommended) |

## Production dashboard

```bash
npm run dashboard     # http://127.0.0.1:4174
```

Shows every series and episode (planned / scripted / completed), previews and downloads finished videos, and runs production or remix with a live log. Local by default; full control on localhost only.

To open it from anywhere through a Cloudflare quick tunnel:

```bash
npm run share         # prints a temporary https://*.trycloudflare.com URL
```

Remote visitors are read-only unless a strong password is set. Admin screenshots and job logs are never served remotely. The URL changes on every run; for a permanent URL use a named Cloudflare tunnel. Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#dashboard-and-security).

## Project layout

| Path | Role |
|---|---|
| `src/episodes/*.mjs` | Episode scripts: steps, spoken text, on-screen text |
| `src/produce.mjs` | The engine: voice → recording → camera → captions → mix |
| `src/overlay.js` | In-page layer: cursor, glowing frame, transition curtain, cards |
| `src/dashboard.mjs`, `src/dashboard-page.mjs` | Production dashboard (dependency-free server + page) |
| `src/share.mjs` | Dashboard + Cloudflare tunnel |
| `src/screenshots.mjs`, `src/fetch-brand.mjs`, `src/make-music.mjs`, `src/make-pdf.mjs` | Asset tooling |
| `data/series.json` | The series and episode plan (drives the dashboard) |
| `assets/` | Brand files (committed); music and screenshots are generated locally and git-ignored |
| `docs/` | Architecture notes and the series plan (`series-plan.html`; `npm run pdf` renders the PDF) |
| `scripts/check.mjs` | Syntax check used by `npm run check` and CI |

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), then read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Good first contributions: new episodes from the plan in `data/series.json`, tests for the pure helpers, or splitting `produce.mjs` into modules. Security issues: see [SECURITY.md](SECURITY.md).

## Language note

The product, its audience and the video content are Arabic, so episode scripts and `data/series.json` are written in Arabic. Code, comments, documentation and commit messages are in English.

## License

The source code is released under the [MIT License](LICENSE).

The Nawa name, logo, icons and other brand assets in `assets/brand/` belong to Nawa and are **not** covered by the MIT license; they may only be used to produce Nawa content.

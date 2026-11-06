# Contributing to Nawa Studio

Thanks for helping. This guide covers setup, workflow and how to add an episode.

## Setup

Requirements: Node 20+, ffmpeg on `PATH`, Python 3 (for the free fallback voice).

```bash
git clone https://github.com/alhamami911/nawa-studio.git
cd nawa-studio
npm install
npx playwright install chromium
pip install edge-tts
cp .env.example .env
npm run brand      # fetch logo and colors
npm run music      # generate background music (needed by the engine)
```

Fill in `.env` on your own machine only (see the table in [README.md](README.md#configuration)). Use a dedicated recording account with limited permissions, never an admin account that holds real data.

**Never commit secrets.** `.env`, `out/`, `work/` and `assets/screens/admin/` are git-ignored, and CI rejects any push that contains them or that matches common key patterns. If you leak a key by accident, revoke it immediately; deleting the commit is not enough.

## Workflow

1. Fork the repo or branch from `main`: `git switch -c feature/<short-name>`.
2. Make focused changes. One topic per pull request.
3. Run `npm run check` before pushing.
4. Open a pull request using the template. CI must pass.
5. A maintainer reviews and merges. Prefer squash merges.

### Commit messages

Imperative mood, short subject (about 72 characters), body explains *why*:

```
Retry ElevenLabs requests before failing

Silent fallback to a free voice produced the wrong voice on one episode.
```

### Code style

- ES modules, no build step, no new runtime dependencies without discussion (the dashboard is intentionally dependency-free).
- Comments and identifiers in English.
- Keep functions small and side effects at the edges; prefer pure helpers that can be tested.

## Adding an episode

1. Create `src/episodes/NN-name.mjs` exporting `meta` and `steps` (copy a nearby episode as a template).
   - `speech` is what is spoken; `text` is what is shown on screen when they differ (for example Latin brand names).
   - Show only what is really on screen. Do not invent features.
   - Never click anything that changes account data (completing a lesson, submitting a form, purchasing) and never request the microphone.
2. Register it in `data/series.json` with the `ep` field.
3. Produce it: `npm run produce -- NN-name`. The result is in `out/`.
4. Review frames from the video; a successful run alone does not prove the result looks right.
5. Do not commit videos. Share them through the dashboard or a release.

## License

By contributing you agree that your contribution is released under the [MIT License](LICENSE).

## Reporting bugs and ideas

Open a GitHub issue using the templates. For security problems, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

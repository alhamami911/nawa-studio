# Assets

| Folder | Contents | Source |
|---|---|---|
| `brand/` | Logo, site icons, share image and the raw color file | `node src/fetch-brand.mjs` (from nawamusic.com) |
| `music/` | Original background music (240 s, royalty-free) | `node src/make-music.mjs` |
| `screens/public/` | Screenshots of public pages and sign-in | `node src/screenshots.mjs` |
| `screens/app/` | Tools (tuner, metronome, simulator) and a lesson page | `node src/screenshots.mjs` |
| `screens/admin/` | Admin panel. **Local only, never committed** (taken from the live site) | `node src/screenshots.mjs` |

Screenshot index: [screens/INDEX.md](screens/INDEX.md).

## Brand

Orange `#c34d04` · glow `#ff8a1f` · text `#342616` · background `#f9f8fc` · font IBM Plex Sans Arabic.

## Notes

- The logo and icons belong to Nawa and are used only to produce Nawa content.
- Never record pages that show personal data (students, teachers, payments, email).
- Voice clips are generated at production time in `work/` and are not stored here.

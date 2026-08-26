# pass-the-initiative

TypeScript starter for a Foundry VTT v13 module, built with Vite and typed against
`fvtt-types`.

## First-time setup

```bash
npm install
npm run link
```

`npm run link` creates a Windows junction from this project folder into:

```
C:\Users\seewa\AppData\Local\FoundryVTT\Data\modules\pass-the-initiative
```

so Foundry can see the module without you copying files manually. You only need
to run this once (re-run if you delete the link).

## Development

```bash
npm run dev
```

This runs Vite in watch mode, rebuilding `dist/module.js` on every save. Reload
your Foundry world (F5 in the browser, or the in-app "Reload" button) to pick up
changes — Vite watch does not hot-reload into Foundry itself.

`npm run typecheck` runs the TypeScript compiler without emitting, useful as a
quick sanity check or in CI.

## Production build

```bash
npm run build
```

Outputs a minified-free (source-mapped) bundle to `dist/`. Flip `minify: false`
in `vite.config.ts` to `true` (or remove the line) when you're ready to ship.

## Debugging in VS Code

1. Start Foundry and open your world in Chrome.
2. In VS Code, go to Run & Debug and launch **"Launch Foundry (Chrome)"**
   (defined in `.vscode/launch.json`). This attaches the debugger with
   source maps, so you can set breakpoints directly in your `.ts` files.

## Renaming the module

The placeholder ID is `pass-the-initiative`. To rename, update it in:

- `module.json` (`id` field)
- `package.json` (`name` field)
- `scripts/link-module.mjs` (`MODULE_ID` constant)
- `src/module.ts` (`MODULE_ID` constant)

and rename the project folder itself if you'd like the folder name to match.

## Notes on fvtt-types

`fvtt-types` is community-maintained and v13 support is still filling in gaps.
If something is untyped or behaves oddly, check the
[League of Foundry Developers repo](https://github.com/League-of-Foundry-Developers/foundry-vtt-types)
issues or their Discord before assuming it's a bug in your code.

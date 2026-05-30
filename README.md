# Smoke Effect Add-on

Animated smoke overlay for MyWallpaper.

## Design

- Pure visual widget: no network, no file access, no storage, no runtime permissions.
- Uses the shared MyWallpaper scene clock with `useSceneTimeTick`, so animation stays synced with the canvas runtime without React re-rendering every frame.
- Keeps settings product-level instead of shader-level.

## Settings

| Setting | Purpose |
| --- | --- |
| Smoke color | Main smoke tint. |
| Randomize color | Picks a vivid smoke color. |
| Smoke style | Soft mist, classic smoke, dense cloud, or storm flow. |
| Intensity | Overall visibility. |
| Motion | Animation speed and flow energy. |
| Smoke size | Small wisps to large clouds. |
| Direction | Up, right, down, or left. |
| Quality | Performance, balanced, or high render scale. |

## Development

```bash
npm install
npm run build
```

Publishing uses SemVer tags/releases. Version `9.0.0` is a breaking settings simplification from the old shader-level controls.

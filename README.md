# Smoke Effect Add-on for MyWallpaper

Animated smoke effect with customizable color, motion, density, and performance controls. Pure WebGL2 shader with Fractal Brownian Motion.

![MyWallpaper Add-on](https://img.shields.io/badge/MyWallpaper-Add--on-purple?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Settings

### Colors
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Smoke Color | color | `#FFFFFF` | Main smoke color |
| Randomize Color | button | - | Generate a new smoke color |

### Motion
| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Speed | 0 - 1 | 0.28 | How fast the smoke moves |
| Origin | 0 - 360 | 0 | Where smoke comes from (0=bottom, 90=left, 180=top, 270=right) |
| Direction | 0 - 360 | 0 | Where smoke travels toward (0=up, 90=right, 180=down, 270=left) |

### Performance
| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Quality | 0.25 - 1 | 1.0 | Rendering resolution scale (lower = faster) |

### Appearance
| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Scale | 0.2 - 50 | 6.0 | Pattern size (bigger = larger patterns) |
| Brightness | 0.1 - 3 | 1.0 | Color brightness (1.0 = neutral, 2+ = glowing) |
| Opacity | 0 - 1 | 1.0 | Overall transparency |
| Detail | 0 - 3 | 1.25 | Noise complexity (higher = finer details) |
| Turbulence | 0 - 2 | 2.0 | Chaos and distortion |
| Density | 0.1 - 3 | 0.5 | Smoke thickness |
| Height | 0 - 3 | 0.7 | How far the smoke extends |

## Installation

The repository is published through the canonical MyWallpaper add-on
admission workflow. For a local development install, build the repository and
install the resulting `dist/` directory from MyWallpaper's developer tools.

## Development

```bash
pnpm install
pnpm dev
# Use the developer tools in MyWallpaper to load the local Vite origin.
```

The release bundle is produced with `pnpm build`; `dist/index.html` and
`dist/assets/addon.js` are the only runtime entry files.

## Technical Details

- **WebGL2 only** (`#version 300 es`) - no WebGL1 fallback
- **Fractal Brownian Motion** with variable octaves (2-14 based on detail)
- **Domain warping** for organic smoke movement
- `performance.now()` for sub-millisecond timing precision
- Shader cleanup (`detachShader` + `deleteShader`) after linkage
- Proper lifecycle management (pause/resume/dispose)

## License

MIT License

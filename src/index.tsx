import { useSceneTimeTick, useSettings, useSettingsActions, useViewport } from '@mywallpaper/sdk-react'
import { useEffect, useRef, useState } from 'react'

type SmokeStyle = 'soft' | 'classic' | 'dense' | 'storm'
type SmokeDirection = 'up' | 'right' | 'down' | 'left'
type RenderQuality = 'performance' | 'balanced' | 'high'

interface Settings {
  color: string
  style: SmokeStyle
  intensity: number
  motion: number
  size: number
  direction: SmokeDirection
  quality: RenderQuality
}

interface StylePreset {
  alpha: number
  contrast: number
  density: number
  octaves: number
  turbulence: number
}

const DEFAULT_SETTINGS: Settings = {
  color: '#FFFFFF',
  style: 'classic',
  intensity: 0.7,
  motion: 0.35,
  size: 0.55,
  direction: 'up',
  quality: 'balanced',
}

const STYLE_PRESETS: Record<SmokeStyle, StylePreset> = {
  soft: { alpha: 0.55, contrast: 0.72, density: 0.72, octaves: 4, turbulence: 0.55 },
  classic: { alpha: 0.82, contrast: 0.92, density: 0.9, octaves: 5, turbulence: 0.82 },
  dense: { alpha: 1.08, contrast: 1.08, density: 1.2, octaves: 5, turbulence: 0.95 },
  storm: { alpha: 0.96, contrast: 1.22, density: 1.05, octaves: 6, turbulence: 1.35 },
}

const DIRECTION_VECTORS: Record<SmokeDirection, [number, number]> = {
  up: [0, 1],
  right: [1, 0],
  down: [0, -1],
  left: [-1, 0],
}

const QUALITY_SCALE: Record<RenderQuality, number> = {
  performance: 0.55,
  balanced: 0.75,
  high: 1,
}

const ROOT_STYLE = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  pointerEvents: 'none',
} as const

const CANVAS_STYLE = {
  ...ROOT_STYLE,
  display: 'block',
} as const

const FALLBACK_STYLE = {
  ...ROOT_STYLE,
  background:
    'radial-gradient(circle at 50% 70%, rgba(255,255,255,0.38), transparent 42%), radial-gradient(circle at 40% 35%, rgba(255,255,255,0.22), transparent 38%)',
  filter: 'blur(28px)',
  opacity: 0.72,
} as const

const VERTEX_SHADER = `#version 300 es
precision mediump float;

const vec2 POSITIONS[6] = vec2[6](
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
);

out vec2 v_uv;

void main() {
  v_uv = POSITIONS[gl_VertexID];
  gl_Position = vec4(POSITIONS[gl_VertexID], 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform vec2 u_direction;
uniform float u_intensity;
uniform float u_motion;
uniform float u_size;
uniform float u_alpha;
uniform float u_contrast;
uniform float u_density;
uniform float u_octaves;
uniform float u_turbulence;
uniform sampler2D u_noise;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  return texture(u_noise, p / 24.0).r;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 rotate = mat2(0.8, 0.6, -0.6, 0.8);

  for (int i = 0; i < 6; i++) {
    if (float(i) >= u_octaves) break;
    value += amplitude * noise(p);
    p = rotate * p * 2.03 + vec2(7.1, 3.7);
    amplitude *= 0.52;
  }

  return value;
}

void main() {
  vec2 pos = v_uv;
  pos.x *= max(u_resolution.x / max(u_resolution.y, 1.0), 0.01);

  vec2 direction = normalize(u_direction);
  float time = u_time * mix(0.04, 0.72, u_motion);
  float scale = mix(13.0, 2.4, u_size);

  vec2 base = pos * scale - direction * time;
  float slowWarp = fbm(base * 0.45 + direction.yx * time * 0.18);
  vec2 warp = vec2(
    fbm(base * 0.8 + vec2(slowWarp, time * 0.21)),
    fbm(base * 0.8 + vec2(-time * 0.18, slowWarp))
  ) - 0.5;

  float smoke = fbm(base + warp * (2.2 * u_turbulence));
  float wisps = fbm(base * 1.85 - warp * 1.4 + time * 0.08);
  float body = mix(smoke, smoke * wisps * 1.65, 0.45);

  float alpha = smoothstep(0.24, 0.78, body * u_contrast);
  alpha = pow(alpha, 1.0 / max(u_density, 0.05));
  alpha *= mix(0.08, 0.92, u_intensity) * u_alpha;

  float vignette = smoothstep(1.55, 0.35, length(pos));
  alpha *= mix(0.74, 1.0, vignette);

  float dither = (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;
  fragColor = vec4(max(u_color + dither, vec3(0.0)), clamp(alpha + dither, 0.0, 1.0));
}
`

type Uniforms = Record<string, WebGLUniformLocation | null>

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

function pickOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : fallback
}

function normalizeSettings(settings: Partial<Settings>): Settings {
  return {
    color: typeof settings.color === 'string' ? settings.color : DEFAULT_SETTINGS.color,
    style: pickOption(settings.style, ['soft', 'classic', 'dense', 'storm'] as const, DEFAULT_SETTINGS.style),
    intensity: clampNumber(settings.intensity, DEFAULT_SETTINGS.intensity, 0, 1),
    motion: clampNumber(settings.motion, DEFAULT_SETTINGS.motion, 0, 1),
    size: clampNumber(settings.size, DEFAULT_SETTINGS.size, 0, 1),
    direction: pickOption(settings.direction, ['up', 'right', 'down', 'left'] as const, DEFAULT_SETTINGS.direction),
    quality: pickOption(settings.quality, ['performance', 'balanced', 'high'] as const, DEFAULT_SETTINGS.quality),
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex)
  if (!match) return [1, 1, 1]

  return [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255]
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100
  const l = lightness / 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + hue / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }

  return `#${f(0)}${f(8)}${f(4)}`
}

function randomSmokeColor(): string {
  return hslToHex(Math.random() * 360, 70 + Math.random() * 24, 48 + Math.random() * 18)
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function generateNoiseData(): Uint8Array {
  const size = 256
  const cells = 16
  const random = seededRandom(0x5e0c0de)
  const data = new Uint8Array(size * size)
  const gradients = new Float32Array(cells * cells * 2)

  for (let i = 0; i < cells * cells; i += 1) {
    const angle = random() * Math.PI * 2
    gradients[i * 2] = Math.cos(angle)
    gradients[i * 2 + 1] = Math.sin(angle)
  }

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const dotGrad = (gx: number, gy: number, dx: number, dy: number) => {
    const index = (((gy % cells + cells) % cells) * cells + ((gx % cells + cells) % cells)) * 2
    return gradients[index] * dx + gradients[index + 1] * dy
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = (x / size) * cells
      const sy = (y / size) * cells
      const x0 = Math.floor(sx)
      const y0 = Math.floor(sy)
      const dx = sx - x0
      const dy = sy - y0
      const u = fade(dx)
      const v = fade(dy)
      const n00 = dotGrad(x0, y0, dx, dy)
      const n10 = dotGrad(x0 + 1, y0, dx - 1, dy)
      const n01 = dotGrad(x0, y0 + 1, dx, dy - 1)
      const n11 = dotGrad(x0 + 1, y0 + 1, dx - 1, dy - 1)
      const nx0 = n00 + u * (n10 - n00)
      const nx1 = n01 + u * (n11 - n01)
      const value = nx0 + v * (nx1 - nx0)

      data[y * size + x] = Math.max(0, Math.min(255, ((value / 1.414 + 0.5) * 255) | 0))
    }
  }

  return data
}

function compileShader(gl: WebGL2RenderingContext, source: string, type: number): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader

  console.error('[SmokeEffect] Shader compile error:', gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
  return null
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vertexShader = compileShader(gl, VERTEX_SHADER, gl.VERTEX_SHADER)
  const fragmentShader = compileShader(gl, FRAGMENT_SHADER, gl.FRAGMENT_SHADER)
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader)
    if (fragmentShader) gl.deleteShader(fragmentShader)
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  gl.detachShader(program, vertexShader)
  gl.deleteShader(vertexShader)
  gl.detachShader(program, fragmentShader)
  gl.deleteShader(fragmentShader)

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program

  console.error('[SmokeEffect] Program link failed:', gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
  return null
}

function getUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Uniforms {
  return {
    u_alpha: gl.getUniformLocation(program, 'u_alpha'),
    u_color: gl.getUniformLocation(program, 'u_color'),
    u_contrast: gl.getUniformLocation(program, 'u_contrast'),
    u_density: gl.getUniformLocation(program, 'u_density'),
    u_direction: gl.getUniformLocation(program, 'u_direction'),
    u_intensity: gl.getUniformLocation(program, 'u_intensity'),
    u_motion: gl.getUniformLocation(program, 'u_motion'),
    u_noise: gl.getUniformLocation(program, 'u_noise'),
    u_octaves: gl.getUniformLocation(program, 'u_octaves'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_size: gl.getUniformLocation(program, 'u_size'),
    u_time: gl.getUniformLocation(program, 'u_time'),
    u_turbulence: gl.getUniformLocation(program, 'u_turbulence'),
  }
}

export default function SmokeEffect() {
  const settings = normalizeSettings(useSettings<Partial<Settings>>())
  const viewport = useViewport()
  const { onButtonClick, setValue } = useSettingsActions()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGL2RenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const noiseTextureRef = useRef<WebGLTexture | null>(null)
  const uniformsRef = useRef<Uniforms>({})
  const settingsRef = useRef(settings)
  const viewportRef = useRef(viewport)
  const [webglSupported, setWebglSupported] = useState(true)

  settingsRef.current = settings
  viewportRef.current = viewport

  useEffect(() => onButtonClick('randomizeColor', () => setValue('color', randomSmokeColor())), [onButtonClick, setValue])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    })

    if (!gl) {
      setWebglSupported(false)
      return
    }

    const program = createProgram(gl)
    if (!program) {
      setWebglSupported(false)
      return
    }

    const noiseTexture = gl.createTexture()
    if (!noiseTexture) {
      setWebglSupported(false)
      gl.deleteProgram(program)
      return
    }

    glRef.current = gl
    programRef.current = program
    noiseTextureRef.current = noiseTexture
    uniformsRef.current = getUniforms(gl, program)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)
    gl.useProgram(program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 256, 256, 0, gl.RED, gl.UNSIGNED_BYTE, generateNoiseData())
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.uniform1i(uniformsRef.current.u_noise, 0)
    setWebglSupported(true)

    return () => {
      if (noiseTextureRef.current) gl.deleteTexture(noiseTextureRef.current)
      if (programRef.current) gl.deleteProgram(programRef.current)
      noiseTextureRef.current = null
      programRef.current = null
      glRef.current = null
      uniformsRef.current = {}
    }
  }, [])

  useSceneTimeTick(({ time }) => {
    const canvas = canvasRef.current
    const gl = glRef.current
    const program = programRef.current
    if (!canvas || !gl || !program) return

    const currentSettings = settingsRef.current
    const currentViewport = viewportRef.current
    const qualityScale = QUALITY_SCALE[currentSettings.quality]
    const dpr = Math.max(currentViewport.dpr || 1, 1)
    const width = Math.max(1, Math.round((currentViewport.width || canvas.clientWidth || 1) * dpr * qualityScale))
    const height = Math.max(1, Math.round((currentViewport.height || canvas.clientHeight || 1) * dpr * qualityScale))

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }

    const preset = STYLE_PRESETS[currentSettings.style]
    const [red, green, blue] = hexToRgb(currentSettings.color)
    const [directionX, directionY] = DIRECTION_VECTORS[currentSettings.direction]
    const uniforms = uniformsRef.current

    gl.useProgram(program)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(uniforms.u_time, time)
    gl.uniform2f(uniforms.u_resolution, width, height)
    gl.uniform3f(uniforms.u_color, red, green, blue)
    gl.uniform2f(uniforms.u_direction, directionX, directionY)
    gl.uniform1f(uniforms.u_intensity, currentSettings.intensity)
    gl.uniform1f(uniforms.u_motion, currentSettings.motion)
    gl.uniform1f(uniforms.u_size, currentSettings.size)
    gl.uniform1f(uniforms.u_alpha, preset.alpha)
    gl.uniform1f(uniforms.u_contrast, preset.contrast)
    gl.uniform1f(uniforms.u_density, preset.density)
    gl.uniform1f(uniforms.u_octaves, preset.octaves)
    gl.uniform1f(uniforms.u_turbulence, preset.turbulence)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  })

  if (!webglSupported) return <div aria-hidden style={FALLBACK_STYLE} />

  return <canvas ref={canvasRef} style={CANVAS_STYLE} />
}

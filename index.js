const __MYWALLPAPER_WIDGET_RUNTIME_CONTRACT__ = "1";
if (!__canvasRuntime) {
      throw new Error('Canvas runtime globals are unavailable');
    }
if (!__canvasRuntime.react || !__canvasRuntime.reactJsxRuntime || !__canvasRuntime.sdkReact || !__canvasRuntime.sdkContracts || !__canvasRuntime.sdkPermissions) {
      throw new Error('Canvas runtime globals are unavailable');
    }
const __canvasRuntimeReact = __canvasRuntime.react;
const __canvasRuntimeJsxRuntime = __canvasRuntime.reactJsxRuntime;
const __canvasRuntimeSdk = __canvasRuntime.sdkReact;
const __canvasRuntimeSdkContracts = __canvasRuntime.sdkContracts;
const __canvasRuntimeSdkPermissions = __canvasRuntime.sdkPermissions;
const I = __canvasRuntimeJsxRuntime.jsx;
const k = __canvasRuntimeSdk.useSettings;
const O = __canvasRuntimeSdk.useViewport;
const X = __canvasRuntimeSdk.useSettingsActions;
const V = __canvasRuntimeSdk.useSceneTimeTick;
const x = __canvasRuntimeReact.useRef;
const H = __canvasRuntimeReact.useState;
const g = __canvasRuntimeReact.useEffect;
const y = {
  color: "#FFFFFF",
  style: "classic",
  intensity: 0.7,
  motion: 0.35,
  size: 0.55,
  direction: "up",
  quality: "balanced"
}, G = {
  soft: { alpha: 0.55, contrast: 0.72, density: 0.72, octaves: 4, turbulence: 0.55 },
  classic: { alpha: 0.82, contrast: 0.92, density: 0.9, octaves: 5, turbulence: 0.82 },
  dense: { alpha: 1.08, contrast: 1.08, density: 1.2, octaves: 5, turbulence: 0.95 },
  storm: { alpha: 0.96, contrast: 1.22, density: 1.05, octaves: 6, turbulence: 1.35 }
}, W = {
  up: [0, 1],
  right: [1, 0],
  down: [0, -1],
  left: [-1, 0]
}, Y = {
  performance: 0.55,
  balanced: 0.75,
  high: 1
}, M = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100vh",
  pointerEvents: "none"
}, q = {
  ...M,
  display: "block"
}, B = {
  ...M,
  background: "radial-gradient(circle at 50% 70%, rgba(255,255,255,0.38), transparent 42%), radial-gradient(circle at 40% 35%, rgba(255,255,255,0.22), transparent 38%)",
  filter: "blur(28px)",
  opacity: 0.72
}, $ = `#version 300 es
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
`, K = `#version 300 es
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
`;
function A(e, o, a, n) {
  return typeof e == "number" && Number.isFinite(e) ? Math.min(n, Math.max(a, e)) : o;
}
function P(e, o, a) {
  return typeof e == "string" && o.includes(e) ? e : a;
}
function j(e) {
  return {
    color: typeof e.color == "string" ? e.color : y.color,
    style: P(e.style, ["soft", "classic", "dense", "storm"], y.style),
    intensity: A(e.intensity, y.intensity, 0, 1),
    motion: A(e.motion, y.motion, 0, 1),
    size: A(e.size, y.size, 0, 1),
    direction: P(e.direction, ["up", "right", "down", "left"], y.direction),
    quality: P(e.quality, ["performance", "balanced", "high"], y.quality)
  };
}
function Q(e) {
  const o = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(e);
  return o ? [parseInt(o[1], 16) / 255, parseInt(o[2], 16) / 255, parseInt(o[3], 16) / 255] : [1, 1, 1];
}
function J(e, o, a) {
  const n = o / 100, u = a / 100, p = n * Math.min(u, 1 - u), s = (i) => {
    const c = (i + e / 30) % 12, h = u - p * Math.max(Math.min(c - 3, 9 - c, 1), -1);
    return Math.round(255 * h).toString(16).padStart(2, "0");
  };
  return `#${s(0)}${s(8)}${s(4)}`;
}
function Z() {
  return J(Math.random() * 360, 70 + Math.random() * 24, 48 + Math.random() * 18);
}
function ee(e) {
  let o = e >>> 0;
  return () => (o = o * 1664525 + 1013904223 >>> 0, o / 4294967296);
}
function te() {
  const a = ee(98615518), n = new Uint8Array(256 * 256), u = new Float32Array(256 * 2);
  for (let i = 0; i < 256; i += 1) {
    const c = a() * Math.PI * 2;
    u[i * 2] = Math.cos(c), u[i * 2 + 1] = Math.sin(c);
  }
  const p = (i) => i * i * i * (i * (i * 6 - 15) + 10), s = (i, c, h, S) => {
    const f = ((c % 16 + 16) % 16 * 16 + (i % 16 + 16) % 16) * 2;
    return u[f] * h + u[f + 1] * S;
  };
  for (let i = 0; i < 256; i += 1)
    for (let c = 0; c < 256; c += 1) {
      const h = c / 256 * 16, S = i / 256 * 16, f = Math.floor(h), m = Math.floor(S), d = h - f, t = S - m, r = p(d), v = p(t), _ = s(f, m, d, t), b = s(f + 1, m, d - 1, t), L = s(f, m + 1, d, t - 1), U = s(f + 1, m + 1, d - 1, t - 1), E = _ + r * (b - _), R = L + r * (U - L), T = E + v * (R - E);
      n[i * 256 + c] = Math.max(0, Math.min(255, (T / 1.414 + 0.5) * 255 | 0));
    }
  return n;
}
function w(e, o, a) {
  const n = e.createShader(a);
  return n ? (e.shaderSource(n, o), e.compileShader(n), e.getShaderParameter(n, e.COMPILE_STATUS) ? n : (console.error("[SmokeEffect] Shader compile error:", e.getShaderInfoLog(n)), e.deleteShader(n), null)) : null;
}
function oe(e) {
  const o = w(e, $, e.VERTEX_SHADER), a = w(e, K, e.FRAGMENT_SHADER);
  if (!o || !a)
    return o && e.deleteShader(o), a && e.deleteShader(a), null;
  const n = e.createProgram();
  return n ? (e.attachShader(n, o), e.attachShader(n, a), e.linkProgram(n), e.detachShader(n, o), e.deleteShader(o), e.detachShader(n, a), e.deleteShader(a), e.getProgramParameter(n, e.LINK_STATUS) ? n : (console.error("[SmokeEffect] Program link failed:", e.getProgramInfoLog(n)), e.deleteProgram(n), null)) : (e.deleteShader(o), e.deleteShader(a), null);
}
function ne(e, o) {
  return {
    u_alpha: e.getUniformLocation(o, "u_alpha"),
    u_color: e.getUniformLocation(o, "u_color"),
    u_contrast: e.getUniformLocation(o, "u_contrast"),
    u_density: e.getUniformLocation(o, "u_density"),
    u_direction: e.getUniformLocation(o, "u_direction"),
    u_intensity: e.getUniformLocation(o, "u_intensity"),
    u_motion: e.getUniformLocation(o, "u_motion"),
    u_noise: e.getUniformLocation(o, "u_noise"),
    u_octaves: e.getUniformLocation(o, "u_octaves"),
    u_resolution: e.getUniformLocation(o, "u_resolution"),
    u_size: e.getUniformLocation(o, "u_size"),
    u_time: e.getUniformLocation(o, "u_time"),
    u_turbulence: e.getUniformLocation(o, "u_turbulence")
  };
}
function ce() {
  const e = j(k()), o = O(), { onButtonClick: a, setValue: n } = X(), u = x(null), p = x(null), s = x(null), i = x(null), c = x({}), h = x(e), S = x(o), [f, m] = H(!0);
  return h.current = e, S.current = o, g(() => a("randomizeColor", () => n("color", Z())), [a, n]), g(() => {
    const d = u.current;
    if (!d) return;
    const t = d.getContext("webgl2", {
      alpha: !0,
      antialias: !1,
      premultipliedAlpha: !1,
      powerPreference: "high-performance"
    });
    if (!t) {
      m(!1);
      return;
    }
    const r = oe(t);
    if (!r) {
      m(!1);
      return;
    }
    const v = t.createTexture();
    if (!v) {
      m(!1), t.deleteProgram(r);
      return;
    }
    return p.current = t, s.current = r, i.current = v, c.current = ne(t, r), t.enable(t.BLEND), t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA), t.clearColor(0, 0, 0, 0), t.useProgram(r), t.activeTexture(t.TEXTURE0), t.bindTexture(t.TEXTURE_2D, v), t.texImage2D(t.TEXTURE_2D, 0, t.R8, 256, 256, 0, t.RED, t.UNSIGNED_BYTE, te()), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.REPEAT), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.REPEAT), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR), t.uniform1i(c.current.u_noise, 0), m(!0), () => {
      i.current && t.deleteTexture(i.current), s.current && t.deleteProgram(s.current), i.current = null, s.current = null, p.current = null, c.current = {};
    };
  }, []), V(({ time: d }) => {
    const t = u.current, r = p.current, v = s.current;
    if (!t || !r || !v) return;
    const _ = h.current, b = S.current, L = Y[_.quality], U = Math.max(b.dpr || 1, 1), E = Math.max(1, Math.round((b.width || t.clientWidth || 1) * U * L)), R = Math.max(1, Math.round((b.height || t.clientHeight || 1) * U * L));
    (t.width !== E || t.height !== R) && (t.width = E, t.height = R, r.viewport(0, 0, E, R));
    const T = G[_.style], [z, N, D] = Q(_.color), [F, C] = W[_.direction], l = c.current;
    r.useProgram(v), r.clear(r.COLOR_BUFFER_BIT), r.uniform1f(l.u_time, d), r.uniform2f(l.u_resolution, E, R), r.uniform3f(l.u_color, z, N, D), r.uniform2f(l.u_direction, F, C), r.uniform1f(l.u_intensity, _.intensity), r.uniform1f(l.u_motion, _.motion), r.uniform1f(l.u_size, _.size), r.uniform1f(l.u_alpha, T.alpha), r.uniform1f(l.u_contrast, T.contrast), r.uniform1f(l.u_density, T.density), r.uniform1f(l.u_octaves, T.octaves), r.uniform1f(l.u_turbulence, T.turbulence), r.drawArrays(r.TRIANGLES, 0, 6);
  }), f ? /* @__PURE__ */ I("canvas", { ref: u, style: q }) : /* @__PURE__ */ I("div", { "aria-hidden": !0, style: B });
}
export {
  ce as default
};

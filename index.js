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
const z = __canvasRuntimeJsxRuntime.jsx;
const B = __canvasRuntimeSdk.useSettings;
const G = __canvasRuntimeSdk.useViewport;
const H = __canvasRuntimeSdk.useSettingsActions;
const h = __canvasRuntimeReact.useRef;
const V = __canvasRuntimeReact.useMemo;
const O = __canvasRuntimeReact.useCallback;
const C = __canvasRuntimeReact.useEffect;
const W = {
  color: "#FFFFFF",
  speed: 0.28,
  origin: 0,
  direction: 0,
  scale: 6,
  brightness: 1,
  opacity: 1,
  detail: 1.25,
  turbulence: 2,
  density: 0.5,
  height: 0.7,
  quality: 1
}, Y = {
  position: "absolute",
  inset: 0,
  display: "block",
  width: "100%",
  height: "100%",
  margin: 0,
  padding: 0,
  pointerEvents: "none"
}, $ = `#version 300 es
precision mediump float;
const vec2 positions[6] = vec2[6](
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
);
out vec2 uv;
void main() {
  uv = positions[gl_VertexID];
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
}
`, j = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform float u_speed;
uniform float u_origin;
uniform float u_direction;
uniform float u_scale;
uniform float u_brightness;
uniform float u_opacity;
uniform float u_detail;
uniform float u_turbulence;
uniform float u_density;
uniform float u_height;
uniform float u_quality;
uniform sampler2D u_noiseTexture;

in vec2 uv;
out vec4 fragColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  return texture(u_noiseTexture, p / 16.0).r;
}

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.4;
  vec2 freq = p;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * noise(freq);
    freq = rot * freq * 2.0;
    amplitude *= 0.4;
  }
  return value;
}

void main() {
  vec2 pos = uv;

  float aspectRatio = u_resolution.x / u_resolution.y;
  pos.x *= aspectRatio;

  float originRad = radians(u_origin);
  vec2 originDir = vec2(sin(originRad), cos(originRad));
  float gradientBasis = dot(pos, originDir);

  if (gradientBasis > 3.0) {
    fragColor = vec4(0.0);
    return;
  }

  float dirRad = radians(u_direction);
  vec2 moveDir = vec2(sin(dirRad), cos(dirRad));

  float t = u_time * u_speed;

  vec2 smokeCoords = (pos - moveDir * t) * (7.0 / u_scale);

  int octaves = 2 + int(u_detail * 2.0);

  float baseNoise = fbm(smokeCoords, octaves);

  float gradient = mix(gradientBasis * 0.3, gradientBasis * 0.7, baseNoise);

  if (gradient > 1.0) {
    fragColor = vec4(0.0);
    return;
  }

  float warpY = noise(smokeCoords * 1.7 + vec2(5.2, 1.3));

  float noise2 = u_turbulence * fbm(smokeCoords + vec2(baseNoise, warpY) + t * 0.7, min(octaves, 5)) - 0.5;

  float smokeIntensity = fbm(vec2(noise2, baseNoise), max(octaves / 2, 2));

  vec3 smokeColor = u_color * u_brightness;

  float smokeAlpha = smoothstep(0.0, 0.8, (smokeIntensity - gradient + 0.3) * u_height);

  smokeAlpha = pow(smokeAlpha, 1.0 / max(u_density, 0.01));

  float dither = (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;
  smokeColor += dither;
  smokeAlpha += dither;

  fragColor = vec4(smokeColor, smokeAlpha * u_opacity);
}
`;
function K(i) {
  const n = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(i);
  return n ? [
    parseInt(n[1], 16) / 255,
    parseInt(n[2], 16) / 255,
    parseInt(n[3], 16) / 255
  ] : [1, 1, 1];
}
function J(i, n, u) {
  n /= 100, u /= 100;
  const a = n * Math.min(u, 1 - u), f = (g) => {
    const m = (g + i / 30) % 12, o = u - a * Math.max(Math.min(m - 3, 9 - m, 1), -1);
    return Math.round(255 * o).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function Q(i) {
  let n = i >>> 0;
  return () => (n = n * 1664525 + 1013904223 >>> 0, n / 4294967296);
}
function Z() {
  const u = new Uint8Array(65536), a = Q(98615518), f = new Float32Array(256 * 2);
  for (let o = 0; o < 256; o++) {
    const s = a() * Math.PI * 2;
    f[o * 2] = Math.cos(s), f[o * 2 + 1] = Math.sin(s);
  }
  const g = (o) => o * o * o * (o * (o * 6 - 15) + 10), m = (o, s, p, E) => {
    const d = ((s % 16 + 16) % 16 * 16 + (o % 16 + 16) % 16) * 2;
    return f[d] * p + f[d + 1] * E;
  };
  for (let o = 0; o < 256; o++)
    for (let s = 0; s < 256; s++) {
      const p = s / 256 * 16, E = o / 256 * 16, d = Math.floor(p), v = Math.floor(E), T = p - d, R = E - v, A = g(T), S = g(R), e = m(d, v, T, R), b = m(d + 1, v, T - 1, R), x = m(d, v + 1, T, R - 1), y = m(d + 1, v + 1, T - 1, R - 1), t = e + A * (b - e), U = x + A * (y - x), r = t + S * (U - t);
      u[o * 256 + s] = Math.max(0, Math.min(255, (r / 1.414 + 0.5) * 255 | 0));
    }
  return u;
}
function I(i, n, u) {
  const a = i.createShader(u);
  return a ? (i.shaderSource(a, n), i.compileShader(a), i.getShaderParameter(a, i.COMPILE_STATUS) ? a : (console.error("Shader compile error:", i.getShaderInfoLog(a)), i.deleteShader(a), null)) : null;
}
function re() {
  const i = B(), n = { ...W, ...i }, u = G(), { setValue: a, onButtonClick: f } = H(), g = h(null), m = h(null), o = h(null), s = h(null), p = h({}), E = h(0), d = h(performance.now()), v = h(n), T = h(u);
  v.current = n, T.current = u;
  const R = V(() => Z(), []), A = O(() => {
    const S = Math.random() * 360;
    a("color", J(S, 70 + Math.random() * 30, 40 + Math.random() * 30));
  }, [a]);
  return C(() => {
    f("randomizeColorBtn", A);
  }, [f, A]), C(() => {
    const S = g.current;
    if (!S) return;
    const e = S.getContext("webgl2", {
      alpha: !0,
      premultipliedAlpha: !1,
      antialias: !1
    });
    if (!e) {
      console.error("WebGL2 not supported");
      return;
    }
    m.current = e, e.enable(e.BLEND), e.blendFunc(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA), e.clearColor(0, 0, 0, 0);
    const b = e.createTexture();
    s.current = b, e.bindTexture(e.TEXTURE_2D, b), e.texImage2D(e.TEXTURE_2D, 0, e.R8, 256, 256, 0, e.RED, e.UNSIGNED_BYTE, R), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.REPEAT), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.REPEAT), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR);
    const x = I(e, $, e.VERTEX_SHADER), y = I(e, j, e.FRAGMENT_SHADER);
    if (!x || !y) return;
    const t = e.createProgram();
    if (e.attachShader(t, x), e.attachShader(t, y), e.linkProgram(t), !e.getProgramParameter(t, e.LINK_STATUS)) {
      console.error("Program link failed:", e.getProgramInfoLog(t));
      return;
    }
    e.detachShader(t, x), e.deleteShader(x), e.detachShader(t, y), e.deleteShader(y), o.current = t, e.useProgram(t), p.current = {
      u_time: e.getUniformLocation(t, "u_time"),
      u_resolution: e.getUniformLocation(t, "u_resolution"),
      u_color: e.getUniformLocation(t, "u_color"),
      u_speed: e.getUniformLocation(t, "u_speed"),
      u_origin: e.getUniformLocation(t, "u_origin"),
      u_direction: e.getUniformLocation(t, "u_direction"),
      u_scale: e.getUniformLocation(t, "u_scale"),
      u_brightness: e.getUniformLocation(t, "u_brightness"),
      u_opacity: e.getUniformLocation(t, "u_opacity"),
      u_detail: e.getUniformLocation(t, "u_detail"),
      u_turbulence: e.getUniformLocation(t, "u_turbulence"),
      u_density: e.getUniformLocation(t, "u_density"),
      u_height: e.getUniformLocation(t, "u_height"),
      u_quality: e.getUniformLocation(t, "u_quality"),
      u_noiseTexture: e.getUniformLocation(t, "u_noiseTexture")
    }, e.uniform1i(p.current.u_noiseTexture, 0), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, b), d.current = performance.now();
    const U = () => {
      const r = m.current, k = o.current;
      if (!r || !k) return;
      const l = v.current, _ = g.current;
      if (!_) return;
      const w = Math.min(1, Math.max(0.25, l.quality ?? 1)), L = T.current, P = Math.max(L.dpr || window.devicePixelRatio || 1, 1) * w, M = Math.max(1, Math.round((_.clientWidth || L.width || 1) * P)), D = Math.max(1, Math.round((_.clientHeight || L.height || 1) * P));
      (_.width !== M || _.height !== D) && (_.width = M, _.height = D, r.viewport(0, 0, M, D)), r.clear(r.COLOR_BUFFER_BIT);
      const c = p.current, F = (performance.now() - d.current) / 1e3;
      r.uniform1f(c.u_time, F), r.uniform2f(c.u_resolution, _.width, _.height);
      const [N, X, q] = K(l.color);
      r.uniform3f(c.u_color, N, X, q), r.uniform1f(c.u_speed, l.speed), r.uniform1f(c.u_origin, l.origin), r.uniform1f(c.u_direction, l.direction), r.uniform1f(c.u_scale, l.scale), r.uniform1f(c.u_brightness, l.brightness), r.uniform1f(c.u_opacity, l.opacity), r.uniform1f(c.u_detail, l.detail), r.uniform1f(c.u_turbulence, l.turbulence), r.uniform1f(c.u_density, l.density), r.uniform1f(c.u_height, l.height), r.uniform1f(c.u_quality, w), r.drawArrays(r.TRIANGLES, 0, 6), E.current = requestAnimationFrame(U);
    };
    return U(), () => {
      cancelAnimationFrame(E.current), o.current && (e.deleteProgram(o.current), o.current = null), s.current && (e.deleteTexture(s.current), s.current = null), m.current = null;
    };
  }, [R]), /* @__PURE__ */ z("canvas", { ref: g, style: Y });
}
export {
  re as default
};

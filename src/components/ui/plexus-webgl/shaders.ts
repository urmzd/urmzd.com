// =============================================================================
// GLSL shaders for WebGL plexus particle system
// Template strings to avoid Vite raw import configuration
// =============================================================================

// Shared wave energy function injected into both particle and line shaders
const waveEnergyGLSL = /* glsl */ `
// Travelling energy: overlapping radial pulses + directional sweep
float waveEnergy(vec3 pos, float time) {
  float d = length(pos.xy);
  // Fast radial pulse expanding outward
  float w1 = sin(d * 0.5 - time * 1.8) * 0.5 + 0.5;
  // Slower, wider radial pulse (offset phase)
  float w2 = sin(d * 0.3 - time * 1.2 + 1.5) * 0.5 + 0.5;
  // Diagonal sweep for asymmetry
  float w3 = sin(pos.x * 0.4 + pos.y * 0.2 - time * 1.0) * 0.5 + 0.5;
  float e = max(w1, max(w2, w3));
  return smoothstep(0.55, 1.0, e);
}
`;

export const particleVertexShader = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aColorT;

uniform float uTime;
uniform float uPixelRatio;

varying float vAlpha;
varying float vColorT;
varying float vEnergy;

${waveEnergyGLSL}

void main() {
  vec3 pos = position;

  // Subtle breathing micro-jitter (matches original Canvas 2D behavior)
  float phase = aPhase + uTime * 0.8;
  pos.x += sin(phase) * 0.05;
  pos.y += cos(phase * 1.37) * 0.05;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Travelling energy wave
  float energy = waveEnergy(pos, uTime);
  vEnergy = energy;

  // Depth-based size falloff, boosted by energy
  float depthScale = 300.0 / (-mvPosition.z + 300.0);
  gl_PointSize = aSize * (1.0 + energy * 0.8) * depthScale * uPixelRatio;

  // Depth-based alpha: closer = more opaque
  vAlpha = 0.2 + depthScale * 0.6;
  vColorT = aColorT;

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const particleFragmentShader = /* glsl */ `
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform float uHdrIntensity;

varying float vAlpha;
varying float vColorT;
varying float vEnergy;

void main() {
  // Soft radial circle
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.05, dist);

  // Simple 2-color lerp (matches original Canvas 2D palette)
  vec3 color = mix(uColor0, uColor1, vColorT);

  // Energy shifts color toward white
  color = mix(color, vec3(1.0), vEnergy * 0.15);

  // HDR boost: base center glow + energy wave glow
  float hdr = 1.0 + pow(alpha, 4.0) * uHdrIntensity * 0.5 + vEnergy * 0.6;
  gl_FragColor = vec4(color * hdr, alpha * vAlpha);
}
`;

export const lineVertexShader = /* glsl */ `
attribute float aAlpha;
uniform float uTime;
varying float vAlpha;
varying float vEnergy;

${waveEnergyGLSL}

void main() {
  vAlpha = aAlpha;

  // Wave energy at this line vertex
  vEnergy = waveEnergy(position, uTime);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const lineFragmentShader = /* glsl */ `
uniform vec3 uLineColor;
uniform float uOpacity;
varying float vAlpha;
varying float vEnergy;

void main() {
  // Energy brightens lines and shifts toward white
  vec3 color = mix(uLineColor, vec3(1.0), vEnergy * 0.2);
  float alpha = vAlpha * uOpacity * (1.0 + vEnergy * 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

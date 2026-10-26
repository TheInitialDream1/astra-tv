/**
 * Adapted from dgreenheck/webgpu-galaxy (MIT, Copyright (c) 2025 dgreenheck).
 * See webgpu-galaxy.LICENSE. TSL hash / differential rotation / mouse force
 * ported to GLSL so the desktop also runs on browsers without WebGPU.
 * Continuous filament deformation and shape evolution are ASTRA additions.
 */
export const galaxyFlowGLSL = /* glsl */ `
  float galaxyHash(float seed) {
    float p = fract(seed * 0.1031);
    float h = p + 19.19;
    return fract(h * (h + 47.43) * p);
  }
  mat2 rotate2(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
  vec3 differentialRotation(vec3 p, float speed, float time) {
    float factor = 1.0 / (length(p.xz) * 0.1 + 1.0);
    p.xz = rotate2(-speed * factor * time) * p.xz;
    return p;
  }
  vec3 mouseForce(vec3 p, vec3 mouse, float enabled, float strength, float radius) {
    vec3 delta = mouse - p;
    float d = length(delta);
    float influence = enabled * max(0.0, 1.0 - d / radius);
    return -delta / max(d, 0.001) * strength * influence;
  }
  vec3 livingFlow(vec3 seed, float t) {
    float r = 1.1 + pow(seed.x, 0.62) * 11.8;
    float arm = floor(seed.y * 5.0);
    float strand = fract(seed.y * 5.0);
    float armAngle = arm * 6.2831853 / 5.0;
    float tightness = 4.8 + sin(t * 0.17) * 1.6;
    float a = armAngle + seed.x * tightness;
    a += (seed.z - 0.5) * (0.05 + seed.x * 0.32) + (strand - 0.5) * 0.36;
    float ripple = sin(seed.x * 17.0 - t * 0.72 + arm) * 0.32;
    r += ripple + sin(t * 0.28 + arm * 1.8) * seed.x * 0.85;
    vec3 spiral = vec3(cos(a) * r, (seed.z - 0.5) * (0.25 + seed.x * 1.6), sin(a) * r);
    spiral = differentialRotation(spiral, 0.58, t);
    spiral.y += sin(a * 1.7 + t * 0.32) * (0.45 + seed.x * 1.8) + (strand - 0.5) * 0.45;
    spiral.yz = rotate2(0.68 + sin(t * 0.11) * 0.24) * spiral.yz;

    // A braided knot continuously unfurls into the differential spiral.
    float u = seed.x * 6.2831853 + armAngle + t * 0.14 + (strand - 0.5) * 0.18;
    float tube = (seed.z - 0.5) * 0.8;
    float ring = 6.3 + 2.0 * sin(u * 3.0 + t * 0.23) + tube;
    vec3 braid = vec3(cos(u) * ring, sin(u * 2.0 + t * 0.19) * 3.5 + tube, sin(u) * ring);
    braid.xy = rotate2(sin(t * 0.13) * 0.38) * braid.xy;
    braid.yz = rotate2(0.32) * braid.yz;
    float evolution = 0.38 + 0.36 * sin(t * 0.12 - 0.7);
    vec3 p = mix(spiral, braid, evolution);
    p += vec3(sin(p.y * 0.7 + t * 0.4), sin(p.z * 0.65 - t * 0.34), cos(p.x * 0.6 + t * 0.3)) * 0.3;
    p.xy = rotate2(sin(t * 0.09) * 0.28) * p.xy;
    return p;
  }
`;

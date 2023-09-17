/*
 * Original shader from: https://www.shadertoy.com/view/NdKyzD
 */

#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Author: Thomas Stehle
// Title: Hommage à Jochen Lempert
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
//
// Inspired by the photographs of Jochen Lempert:
// https://en.wikipedia.org/wiki/Jochen_Lempert

#ifndef NUM_OCTAVES
#define NUM_OCTAVES 5
#endif

float sdf_circle(in vec2 p, in vec2 c, in float r) {
    return length(p - c) - r;
}

float sdf_oriented_box(in vec2 p, in vec2 a, in vec2 b, float th) {
    float l = length(b-a);
    vec2  d = (b-a)/l;
    vec2  q = p-(a+b)*0.5;
          q = mat2(d.x,-d.y,d.y,d.x)*q;
          q = abs(q)-vec2(l,th)*0.5;
    return length(max(q,0.0)) + min(max(q.x,q.y),0.0);
}

float hash(in vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.13);
    p3 += dot(p3, p3.yzx + 3.333);
    return fract((p3.x + p3.y) * p3.z);
}

float hash(in vec3 p) {
    vec3 q = fract(p * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
}

vec2 hash2(in vec2 p) {
    const vec2 k = vec2(0.3183099, 0.3678794);
    p = p*k + k.yx;
    return fract(16.0 * k*fract(p.x * p.y * (p.x + p.y)));
}

vec3 hash3(in vec3 p) {
    const vec3 MOD3 = vec3(0.1031, 0.11369, 0.13787);
    p = fract(p * MOD3);
    p += dot(p, p.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3((p.x + p.y)*p.z, (p.x + p.z)*p.y, (p.y + p.z)*p.x));
}

float gnoise(in vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f*f*(3.0-2.0*f);
    return mix( mix( mix( dot( hash3(i + vec3(0, 0, 0)), f - vec3(0, 0, 0) ),
                          dot( hash3(i + vec3(1, 0, 0)), f - vec3(1, 0, 0) ), u.x),
                     mix( dot( hash3(i + vec3(0, 1, 0)), f - vec3(0, 1, 0) ),
                          dot( hash3(i + vec3(1, 1, 0)), f - vec3(1, 1, 0) ), u.x), u.y),
                mix( mix( dot( hash3(i + vec3(0, 0, 1)), f - vec3(0, 0, 1) ),
                          dot( hash3(i + vec3(1, 0, 1)), f - vec3(1, 0, 1) ), u.x),
                     mix( dot( hash3(i + vec3(0, 1, 1)), f - vec3(0, 1, 1) ),
                          dot( hash3(i + vec3(1, 1, 1)), f - vec3(1, 1, 1) ), u.x), u.y), u.z );
}

float snoise(in vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2
    const float K2 = 0.211324865; // (3-sqrt(3))/6
    vec2  i = floor(p + (p.x + p.y)*K1);
    vec2  a = p - i + (i.x + i.y)*K2;
    float m = step(a.y, a.x);
    vec2  o = vec2(m, 1.0 - m);
    vec2  b = a - o + K2;
    vec2  c = a - 1.0 + 2.0*K2;
    vec3  h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3  n = h*h*h*h * vec3(
        dot(a, -1.0 + 2.0 * hash2(i + 0.0)),
        dot(b, -1.0 + 2.0 * hash2(i + o)),
        dot(c, -1.0 + 2.0 * hash2(i + 1.0)) );
    return 0.5 + 0.5 * dot(n, vec3(70.0));
}

float snoise(in vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix( hash(i + vec3(0, 0, 0)),
                        hash(i + vec3(1, 0, 0)), f.x),
                   mix( hash(i + vec3(0, 1, 0)),
                        hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix( hash(i + vec3(0, 0, 1)),
                        hash(i + vec3(1, 0, 1)), f.x),
                   mix( hash(i + vec3(0, 1, 1)),
                        hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

float vnoise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Four corners in 2D of a tile
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    // Smooth interpolation (smoothstep without clamping)
    vec2 u = f*f * (3.0 - 2.0*f);

    // Mix 4 corners
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float sfbm(in vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * snoise(p);
        a *= 0.5;
    }
    return v;
}

float vfbm(in vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * vnoise(p);
        p = p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Coordinate normalization
    vec2 uv = fragCoord.xy / iResolution.xy;
    float ar = iResolution.x / iResolution.y;
    uv.x *= ar;

    // Time
    float time = 0.2 * iTime;

    // Background
    vec3 col = vec3(0.5 + 0.5 * gnoise(vec3(uv, time)));

    // Clouds
    mat2 rot = mat2(1.6, -1.0, 1.0, 1.6);
    vec2 q = rot * uv;
    q.x *= 0.5;
    q.y *= 5.0;
    float clouds = 0.5 * sfbm(vec3(q, time));
    col += vec3(clouds);

    // Flying thing
    vec2 c = vec2(ar * 0.6, 0.5) + vec2(0.1 * sin(time), 0.01 * cos(time));

    float body = sdf_circle(vec2(uv.x, 0.5 * uv.y), vec2(c.x, 0.5 * c.y), 0.001);
    body = smoothstep(0.002, 0.0001, body);
    col = mix(col, vec3(0.2), body);

    c.y += 0.025 + 0.01 * sin(time);
    float head = sdf_circle(vec2(0.35 * uv.x, uv.y), vec2(0.35 * c.x, c.y), 0.002);
    head = smoothstep(0.004, 0.0001, head);
    col = mix(col, vec3(0.2), head);

    // Foreground
    float width = 0.25 + 0.05 * sin(time);
    float fgd = sdf_oriented_box(vec2(uv.x, uv.y + 0.2 * vfbm(10.0 * uv)), vec2(-1.0, 0.0), vec2(2.0, 0.0), width);
    fgd = smoothstep(0.15, 0.1, fgd);
    col = mix(col, vec3(0.05), fgd);

    // Lens flare/overexposure in bottom right
    float flare = sdf_circle(uv, vec2(1.5 * ar, 0.2), 1.0);
    flare = sfbm(vec3(7.5 * uv, time)) * smoothstep(0.3, 0.0, flare);
    col = mix(col, vec3(1.75), flare);

    // Film grain
    float r = hash(vec3(gl_FragCoord.xy, fract(0.0005 * iTime)));
    col += 0.15 * vec3(r - 0.5);

    // Vignetting
    vec2 st = uv * (vec2(1.0, ar) - uv.yx);
    float vig = st.x * st.y * 10.0;
    col *= pow(vig, 0.2);

    // Final color
    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

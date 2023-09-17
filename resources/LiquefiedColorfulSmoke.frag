/*
 * Original shader from: https://www.shadertoy.com/view/ctd3z4
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
vec2 hash2( float n ){return fract(sin(vec2(n,n+1.0))*vec2(432.14159,528.14159));}

const vec2 randConst = vec2(432., 528.);
const float randMultiplier = 3.14159;
float rand(const vec2 co) {
    return fract(sin(co.x * randConst.x + co.y * randConst.y) * randMultiplier);}

float custom_smoothstep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.1, 1.0);
    return t * t * (3.0 - 2.0 * t);}

float noise(in vec2 x){
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec2 n = p + vec2(2.5, -2.5);
    float a = mix(rand(n), rand(n + vec2(1.0, 0.0)), f.x);
    float b = mix(rand(n + vec2(0.0, 1.0)), rand(n + vec2(1.0, 1.0)), f.x);
    return mix(a, b, f.y);}

vec2 turbulence(vec2 p, float t, float scale){
    float sum = 0.1;
    float freq = scale;
    float smoothness;
    vec2 noise_coord;
    for (int i = 0; i < 5; i++){
        smoothness = custom_smoothstep(0.0, 10.0, float(i));
        noise_coord = vec2(p + t * 0.25) + vec2(cos(float(i) * 0.6), sin(float(i) * 0.6)) * smoothness;
        sum += abs(noise(noise_coord)) / freq;
        freq *= 0.25;}
    return vec2(sum, sum) * 0.1;}

mat2 mtx = mat2( 0.87,  0.50, -0.50,  0.87 );

float fbm( vec2 p ){
    float f = 0.03;
    f += 0.980000*noise( p ); p = mtx*p*3.0;
    f += 0.210000*noise( p ); p = mtx*p*2.0;
    f += 0.070000*noise( p ); p = mtx*p*2.0;
    f += 0.060000*noise( p ); p = mtx*p*2.0;
    f += 0.030000*noise( p ); p = mtx*p*1.0;
    f += 0.010000*noise( p );
    p = mtx*p*2.0;
    f += 0.004000*noise( p );
    p = mtx*p*2.0;
    f += 0.002000*noise( p );
    return f/0.90000;}

float pattern(in vec2 p, in float t, in vec2 uv, out vec2 q, out vec2 r, out vec2 g) {
    float s = dot(uv + 0.5, uv + 0.5);
    float iMelty = 50.0, iFlowing = 10.0;
    float l = custom_smoothstep(0., iMelty, sin(t * iFlowing));
    q = mix(vec2(fbm(p + vec2(t * 1. + sin(t), t * 0.2 + cos(t))),
                 fbm(p + vec2(t * 0.5 + sin(t + 0.7), t * 0.3 + cos(t + 1.3)))),
            vec2(fbm(p), fbm(p + vec2(10.49, 1.37))),
            l);
    r = mix(vec2(fbm(p + 3.14159 * q + vec2(t * 0.2 + sin(t * 0.5), t * 0.2 + cos(t * 0.7)) + vec2(1.73, 9.6)),
                 fbm(p + 2. * q + vec2(t * 0.5 + sin(t * 0.3), t * 0.4 + cos(t * 0.9)) + vec2(8.5, 4.8))),
            vec2(fbm(p + 5. * q + vec2(t) + vec2(33.33, 66.66)), fbm(p + 4. * q + vec2(t) + vec2(8.3, 2.8))),
            l);
    g = mix(vec2(fbm(p + 2. * r + vec2(t * 0.5 + sin(t * 0.2), t * 0.3 + cos(t * 0.8)) + vec2(2, 6)),
                 fbm(p + 1.5 * r + vec2(t * 0.76 + sin(t * 0.4), t * 0.6 + cos(t * 0.6)) + vec2(5, 3))),
            vec2(fbm(p + 2.5 * r + vec2(t * 5.0) + vec2(2, 6)), fbm(p + 2. * r + vec2(t * 11.0) + vec2(5, 3))),
            l);
    vec2 v = turbulence(p * 0.1, t * 0.1, 20.);
    vec2 m = vec2(fbm(p * 0.5 + vec2(t * 0.9, t * 0.9) + v * 0.5),
                  fbm(p * 0.5 + vec2(t * 0.9, t * 0.9) + v * 0.5));
    return mix(fbm(p + 3. * g + vec2(-t * 0.7 + sin(t * 0.5), -t * 0.5 + cos(t * 0.3)) + v * 2. + m * 0.3),
               fbm(p + 5. * g + vec2(-t * 7.) + v * 3.),
               l);}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    float iSmoke = 0.01;
    float iSpeed = 0.25;
    vec2 uv = fragCoord / iResolution.xy;
    vec2 q, r, g;
    float noise = pattern(fragCoord * vec2(iSmoke), iTime * iSpeed, uv, q, r, g);
    vec3 col = mix(vec3(0.2, 0.4, 0.2), vec3(0.0, 0.25, 0.5), custom_smoothstep(0.1, 1.0, noise));
    col = mix(col, vec3(0.4, 0.2, 0.2), dot(q, q) * 1.5);
    col = mix(col, vec3(0.2, 0.4, 0.0), 0.25 * g.y * g.y);
    col = mix(col, vec3(0.4, 0.2, 0.2), custom_smoothstep(0.2, 0.5, 1.0 * r.g * r.g));
    col = mix(col, vec3(0.2, 0.4, 0.6), 0.5 * g.x);
    float timeScale = .25;
    float xDrift = sin(uv.x * 3.14159 + iTime * timeScale);
    float yDrift = cos(uv.y * 3.14159 + iTime * timeScale);
    vec3 drift = vec3(xDrift, yDrift, -xDrift - yDrift) * .1;
    col += drift;
    col = mix(col, vec3(1), custom_smoothstep(0., 1000., noise) * custom_smoothstep(0., 1000., noise));
    col *= noise * 2.;
    fragColor = vec4(col, 1.);}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

/*
 * Original shader from: https://www.shadertoy.com/view/sdtBRH
 */

#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy emulation
#define iTime time
#define iResolution resolution
vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
#define BACKGROUND_COLOR vec3(0.1, 0.2, 0.6)
#define SECONDARY_COLOR vec3(0.49, 0.45, 0.655)
#define BIG_STAR_SIZE 16.
#define MEDIUM_STAR_RATIO 0.3
#define BIG_STAR_CHANCE 0.1
#define STAR_COLOR vec3(0.9, 0.7, 1.0)
#define SPACE_DUST_COLOR vec3(0.432941, 0.38627, 0.69020)

float rand(vec2 n) {
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);

	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

vec3 hash(vec3 p3)
{
	p3 = fract(p3 * vec3(.1031,.11369,.13787));
    p3 += dot(p3, p3.yxx+19.19);
    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}


float voronoi(vec2 n, float t) {

    vec3 p = vec3(n.x, n.y, t);
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;

    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);

    vec3 e = step(vec3(0.0), d0 - d0.yzx);
	vec3 i1 = e * (1.0 - e.zxy);
	vec3 i2 = 1.0 - e.zxy * (1.0 - e);

    vec3 d1 = d0 - (i1 - 1.0 * K2);
    vec3 d2 = d0 - (i2 - 2.0 * K2);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);

    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 q = h * h * h * h * vec4(dot(d0, hash(i)), dot(d1, hash(i + i1)), dot(d2, hash(i + i2)), dot(d3, hash(i + 1.0)));

    return dot(vec4(50.), q);

}


float voronoiFbm(vec2 p, int iter)
{
    float f = 0.0;
    float a = 1.0;
    float norm = 0.0;

    for (int i = 0; i < 10; i++) {
        if (i >= iter) break;
        f += a * abs(voronoi(p, 0.0));
        norm += a;
        p *= 2.0;
        a *= 0.65;
    }

    return 1.0 - f / norm;
}

float fbm(vec2 p, int iter, float freq, float amp)
{
    float n = 0.0;
    float a = 1.0;
    float norm = 0.0;
    for(int i = 0; i < 20; ++i)
    {
        if (i >= iter) break;
        n += noise(p) * a;
        norm += a;
        p *= freq;
        a *= amp;
    }
    return n / norm;
}


float fbm(vec2 p, int iter)
{
    return fbm(p, iter, 2.0, 0.5);
}

vec3 starColor(vec2 p)
{
    return sin(vec3(.2, .3, .9)*fract(rand(p + vec2(7.91, 246.792))*2345.2)*123.2)*vec3(0.15, 0.1, 0.15) + 0.75;
}

void stars(inout vec3 col, vec2 fragCoord, float density)
{
    vec2 p = fragCoord;
    if(rand(vec2(ivec2(fragCoord / 2.0)) * 2.0) < MEDIUM_STAR_RATIO)
        fragCoord = vec2(ivec2(fragCoord / 2.0)) * 2.0;
    vec3 star = col * 0.5 + 0.5 * starColor(p);

    if(rand(fragCoord + vec2(1071.52, -662.1)) > 0.0) return;
    col = star;
}

void bigStars(inout vec3 col, vec2 fragCoord, float density)
{
    vec2 p = vec2(ivec2(fragCoord / BIG_STAR_SIZE)) * BIG_STAR_SIZE;
    float star_size = BIG_STAR_SIZE * pow(rand(p), 2.0);
    vec3 star = col * 0.5 + 0.5 * starColor(p);
    float d = max(1.0 - distance(p + star_size * 0.5, fragCoord) / star_size * 2.0, 0.0);
    star += d * d * d * d;

    if(rand(p + vec2(6181.616, 9028.1)) > BIG_STAR_CHANCE) return;
    col = mix(col, star, d * d * d);
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;

    vec3 col = BACKGROUND_COLOR; // Background
    float primary = sqrt(fbm(uv * 3.0 + vec2(6.175, -23.612), 8, 1.5, 0.5)); // Space lighness
    float secondary = fbm(uv * 4.0, 8);
    float nebula = 4.0 * pow(fbm(uv * 4.0 + vec2(-12.1, 2.62), 18, 2.0, 0.5), 5.0);
    float space = primary * secondary * nebula;
    vec3 variation = normalize(vec3(fbm((uv + vec2(11.61)) * 2.0, 8), fbm((uv - vec2(2.11)) * 2.0, 8), fbm((uv + vec2(66.61)) * 2.0, 8)));

    col *= space;
    col = mix(col, secondary * SECONDARY_COLOR, 0.5); // Nebula
    col = mix(variation, col, 0.93);
    col += SPACE_DUST_COLOR * vec3(pow(fbm(uv * 12.0, 18, 2.0, 0.5), 3.0) * 0.5);
    col += vec3(0.7, 0.6, 0.5) * nebula;
    stars(col, fragCoord, space);
    bigStars(col, fragCoord, space);
    col /= 1.0 + vec3(1.0, 1.3, 1.5) * (4.0 * vec3(pow(max(voronoiFbm(uv * 2.0, 8), 0.0), 6.0))); // Voronoi (stripes of emptiness)
    col = rgb2hsv(col);
    col *= vec3(1.0, 1.0 + iMouse.x / 500.0, 1.0 + iMouse.y / 500.0);
    col = hsv2rgb(col);

    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec4(mouse * resolution, 0., 0.);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

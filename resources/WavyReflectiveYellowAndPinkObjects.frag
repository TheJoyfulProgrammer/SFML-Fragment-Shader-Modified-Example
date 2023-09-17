/*
 * Original shader from: https://www.shadertoy.com/view/NdVyDw
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
const vec4 iMouse = vec4(0.);

// Emulate a black texture
#define sampler2D float
#define iChannel1 0.
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// PLENTO

#define FAR 80.0
#define DISTANCE_BIAS 0.26
#define HASHSCALE1 .1031
#define EPSILON 0.001

mat2 rot(float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a));
}

float box(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return max(q.x, max(q.y, q.z));
}

float box(vec2 p, vec2 b) {
    vec2 q = abs(p) - b;
    return max(q.x, q.y);
}

vec2 shape(vec3 p) {
    float a = box(p, vec3(0.1, 0.1, 2.0)); // plastic box.

    p = -abs(p) + vec3(.1); // mirror space to save on distance evaluations
    float ce = 0.02;
	// edges.
    float b = box(p - vec3(.1, 0, 0), vec3(.1 + ce, ce, ce));
    float c = box(p - vec3(0, 0, .1), vec3(ce, ce, .1 + ce));
    float d = box(p - vec3(0, .1, 0), vec3(ce, .1 + ce, ce));

    vec2 s = vec2(a, 2.0); // 2.0 == material id for white plastic.
    vec2 t = vec2(min(min(b, c), d), 1.0); // 1.0 == material id for metal.

    return s.x < t.x ? s : t;
}


vec2 map(vec3 rp){
    float t = iTime * .3;

    vec3 pos = rp; - vec3(1.0, -.5, 2.0);

    pos = abs(pos.xyz + 1.0) - 1.0;
    pos=pos*2./clamp(dot(pos.xyz,pos.xyz),.3,1.)-vec3(0.5,1.5,0.5);
    vec3 b = vec3(1., 1.0, .1);

    //pos.xy *= rot(pos.z*0.2);

    pos.y += sin(pos.z + iTime + pos.x*1.0)*0.6;
    pos.x += cos(pos.y - pos.z * 1.0 + iTime)*0.3;
    pos = mod(pos, b)-0.5*b;


    vec2 res = shape(pos);// sdBox(pos, vec3(0.1, 0.1, 2.0));


    return res;
}


vec3 getNormal(vec3 p)
{
    vec2 e = vec2(0.0035, -0.0035);
    return normalize(
        e.xyy * map(p + e.xyy).x +
        e.yyx * map(p + e.yyx).x +
        e.yxy * map(p + e.yxy).x +
        e.xxx * map(p + e.xxx).x);
}

// swirly color thing
vec3 oc(vec3 p, float id)
{
    p.xy *= rot(p.z*0.64);
    vec3 c = (id > 1.) ? vec3(1.,.7,0.) : vec3(1.3,.1,.1);

    vec3 col = c;// mix(vec3(1.0, 0.7, 0.) *c, vec3(1., .2, 0.0) *c,  smoothstep(1.0, 0., abs(p.z)-.3));
    return col;
}

vec3 color(vec3 ro, vec3 rd, vec3 norm, vec3 lp, vec2 t)
{

    // Lighting
    vec3 ld = lp-ro;
    float lDist = max(length(ld), 0.001); // Light to surface distance.
    float atten = 1.0 / (1.0 + lDist*0.2 + lDist*lDist*0.1); // light attenuation

    ld /= lDist;

    // Diffuse
    float diff = max(dot(norm, ld), 0.0);

    // specular
    float spec = pow(max( dot( reflect(-ld, norm), -rd ), 0.0 ), 12.0);

    //Colors
    vec3 objCol = oc(ro, t.y);


   // objCol = oc(ro);

    vec3 sceneCol = (objCol*(diff + 0.15) + vec3(1.0, 1.0, 1.0)*spec*1.2) * atten;

    // Get final color
    return sceneCol;

}

vec2 trace(vec3 ro, vec3 rd)
{
    vec2 t = vec2(0.0,1.0);
    vec2 d = vec2(0.0,1.0);

    for (int i = 0; i < 100; i++)
    {
        d = map(ro + rd*t.x);

        if(abs(d.x)<EPSILON || t.x > FAR) break;


        t.x += d.x * DISTANCE_BIAS;
        t.y = d.y;
    }
    return t;
}

vec2 traceRef(vec3 ro, vec3 rd){

    vec2 t = vec2(0.0,1.0);
    vec2 d = vec2(0.0,1.0);

    for (int i = 0; i < 200; i++)
    {
        d = map(ro + rd*t.x);

        if(abs(d.x)<.0025 || t.x>FAR) break;

        t.x += d.x;

        t.y = d.y;
    }

    return t;
}


// Triplaniar blending of 2d materials to 3d surfaces.
// Got this from Shane (THE GOAT).
vec3 tex3D(vec3 p, vec3 n, sampler2D s) {
    vec3 m = pow(abs(n), vec3(10.0));
    m /= dot(m, vec3(1));

    vec3 x = texture(s, p.yz).rgb;
    vec3 y = texture(s, p.xz).rgb;
    vec3 z = texture(s, p.xy).rgb;

    return m.x*x*x + m.y*y*y + m.z*z*z;
}

// Normal bumping based on material. Also got this from Shane.
vec3 bump(vec3 p, vec3 n, float bf, float f) {
    p *= f;
    vec2 h = vec2(0.001, 0.0);
    vec3 g = mat3(
        tex3D(p + h.xyy, n, iChannel1) - tex3D(p - h.xyy, n, iChannel1),
        tex3D(p + h.yxy, n, iChannel1) - tex3D(p - h.yxy, n, iChannel1),
        tex3D(p + h.yyx, n, iChannel1) - tex3D(p - h.yyx, n, iChannel1))
        *vec3(0.299, 0.584, 0.114); // grey scale.

    g -= n*dot(n, g);

    return normalize(n + bf*g);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = 2.0 * vec2(fragCoord.xy - 0.5*iResolution.xy)/iResolution.y;
    vec2 mo = (3.0*iMouse.xy - 1.5*iResolution.xy)/iResolution.y;
    if(iMouse.z <= 0.0) mo = vec2(0);


    vec3 ro = vec3(0.0, 0.0, 10.0);
    ro.y += sin(ro.z + iTime + ro.x*1.0)*0.6;
    ro.xy += mo;
    vec3 rd = normalize(vec3(uv,2.0));
    //ro.z -= iTime * 0.7;

    // fish eye
     rd = normalize(vec3(uv, 1.0 - dot(uv, uv) * 0.75));

    // light position
    vec3 lp = ro + vec3(0.0, 1.0, -0.5);


    // Scene
    vec2 t = trace(ro, rd);

    ro += rd * t.x;
    vec3 rr = ro;
    vec3 norm = getNormal(ro);

    vec3 col = color(ro, rd, norm, lp, t);

    float fog = t.x;


    // Reflection
    rd = reflect(rd, norm);

    t = traceRef(ro +  rd*.01, rd);

    ro += rd*t.x;

    norm = getNormal(ro);

    col += color(ro, rd, norm, lp, t) * 0.25;

    vec3 p = ro +  rd * t.x;

    fog = smoothstep(0.0, 0.15, fog / 30.);
    col = mix(col, vec3(0), fog);

   // col *= smoothstep(2.0, 0.29, length(uv));

    fragColor = vec4(sqrt(clamp(col, 0.0, 1.0)), 1.0);

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

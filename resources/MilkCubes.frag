/*
 * Original shader from: https://www.shadertoy.com/view/NsXfRS
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

// Emulate some GLSL ES 3.x
float tanh(float x) {
    float ex = exp(2.0 * x);
    return ((ex - 1.) / (ex + 1.));
}

vec3 tanh(vec3 x) {
    vec3 ex = exp(2.0 * x);
    return ((ex - 1.) / (ex + 1.));
}

// --------[ Original ShaderToy begins here ]---------- //
#define pi 3.14159

#define thc(a,b) tanh(a*cos(b))/tanh(a)
#define ths(a,b) tanh(a*sin(b))/tanh(a)
#define sabs(x) sqrt(x*x+1e-2)

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

float h21 (vec2 a) {
    return fract(sin(dot(a.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float mlength(vec2 uv) {
    return max(abs(uv.x), abs(uv.y));
}

float mlength(vec3 uv) {
    return max(max(abs(uv.x), abs(uv.y)), abs(uv.z));
}

// (SdSmoothMin) stolen from here: https://www.shadertoy.com/view/MsfBzB
float smin(float a, float b)
{
    float k = 0.12;
    float h = clamp(0.5 + 0.5 * (b-a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

#define MAX_STEPS 400
#define MAX_DIST 50.
#define SURF_DIST .001

//nabbed from blacklemori
vec3 erot(vec3 p, vec3 ax, float rot) {
  return mix(dot(ax, p)*ax, p, cos(rot)) + cross(ax,p)*sin(rot);
}

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

float sdBox(vec3 p, vec3 s) {
    p = abs(p)-s;
	return length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);
}

vec3 distort(vec3 p) {
    float time = 0.5 * length(p) + 1. * iTime;

    vec3 q = p;
    float m = 5.;// - 0.2 * length(p);
    float tp = 2.*pi/3.;
    for (float i = 0.; i < 7.; i++) {
        //th += -0.1 * iTime;
        //q.xy *= Rot(th);
        //q.zy *= Rot(th);
        q = sabs(q) - m; //sabs cool too
        m *= 0.39 + 0.05 * i;

        time += 1.5 * length(q) + .4 * iTime;
        q = erot(q, normalize(cos(time + vec3(0,tp,-tp))), 0.1);
    }

    // artifacts might appear if p,q are colinear? idk
    return cross(p, q);
}

float GetDist(vec3 p) {

    vec3 ro = vec3(0, 3., -3.5);
    ro.xz *= Rot(0.2 * iTime);
    float sd = length(p - ro) - 2.2;

    //p = mix(sabs(p) - 0., sabs(p) - 1., 0.5 + 0.5 * thc(4., iTime));
    //p.xz *= Rot(0.04 * p.y + 0.* iTime);
    float sc = 20.;
    p = distort(p);
    //p.xz *= Rot(4. * p.y + iTime);
   // p = sabs(p) - 0.25;
    float d = length(p) - 0.4; // was 0.8
    //d = length(p.xz) - 1.;
    //float tp = 2.*pi/3.;
    //d = dot(p, cos(0.3 * iTime + vec3(0,tp,-tp)));
    d *= 0.2; //smaller than I'd ike it to be
    d = -smin(-d, sd);

    return d;
}

float RayMarch(vec3 ro, vec3 rd, float z) {
	float dO=0.;

    for(int i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        float dS = z * GetDist(p);
        dO += dS;
        if(dO>MAX_DIST || abs(dS)<SURF_DIST) break;
    }

    return dO;
}

vec3 GetNormal(vec3 p) {
	float d = GetDist(p);
    vec2 e = vec2(.001, 0);

    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));

    return normalize(n);
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = f*z,
        i = c + uv.x*r + uv.y*u,
        d = normalize(i);
    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
	vec2 m = iMouse.xy/iResolution.xy;

    vec3 ro = vec3(0, 3, -3.5); //0,3,-18. looks cool but BUGGY
    ro.xz *= Rot(0.2 * iTime);
   // ro.yz *= Rot(-m.y*3.14+1.);
    //ro.xz *= Rot(-m.x*6.2831);

    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), 0.8);
    vec3 col = vec3(0);

    float d = RayMarch(ro, rd, 1.);

    float IOR = 1.5;
    if(d<MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = GetNormal(p);
        //vec3 r = reflect(rd, n);
        /*
        vec3 rdIn = refract(rd, n, 1./IOR);
        vec3 pIn = p - 30. * SURF_DIST * n;
        float dIn = RayMarch(pIn, rdIn, -1.);

        vec3 pExit = pIn + dIn * rdIn;
        vec3 nExit = GetNormal(pExit);
        */
        float dif = dot(n, normalize(vec3(1,2,3)))*.5+.5;
       // col = vec3(dif);

        float fresnel = pow(1.+dot(rd, n), 1.);
       // col = 1. * vec3(fresnel);

        //col = mix(vec3(dif), 0.5 + 0.5 * n, exp(-0.2 * length(p)));
        //p = distort(p);
        col = vec3(fresnel);
        //col *= 1. + 0.6 * thc(3., 4. * n.y - 0. * iTime);
        //col = clamp(col, 0., 1.);
        col *= 1.-exp(-3.5 - 0.5 * p.y);
        //col *= cross(p, col);
        vec3 e = vec3(1.);
        float tp = 2. * pi / 3.;
        vec3 c = thc(8., 0.5 * iTime + vec3(0,tp,-tp));
        c = normalize(c);

        col *= pal(dot(n,c)*0.28 + -0.05 + 0.1* h21(p.xz), e, e, e, 0.42 * vec3(0,1,2)/3.);


       // col = clamp(col, 0., 1.);
        col *= 3. * exp(-0.5 * length(p));
        //col *= 0.5 + 0.5 * n;
        //dif = 1.-smoothstep(0., 1., dif);
        //col = max(col, 0. * dif);
    }

    col = pow(col, vec3(.4545));	// gamma correction

    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

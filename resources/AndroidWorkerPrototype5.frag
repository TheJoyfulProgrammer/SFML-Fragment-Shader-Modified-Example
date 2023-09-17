/*
 * Original shader from: https://www.shadertoy.com/view/ftGcW1
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

// Emulate a black texture
#define sampler2D float
#define iChannel0 0.
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.141592
#define TAU 6.283185
#define MAX_DIST 100.
#define DESAT .5+.5* // remap from -1 to 1 to 0 to 1
#define SUN_POS vec3(-4,8,12)
#define AA 2 // antialiasing / set it to 1 if you have a slow computer

// ray setup function
vec3 getRayDir(vec2 uv, vec3 c, vec3 t, float z) {
    vec3 f = normalize(t - c);
    vec3 s = normalize(cross(vec3(0,1,0), f));
    vec3 u = cross(f, s);
    return  normalize(f*z + uv.x*s + uv.y*u);
}

// rotation function
mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

// chebyshev distance: https://www.desmos.com/calculator/d5tuwnadvh

float chebyshev(vec3 p, float k) {
    p = abs(p);
    return pow(pow(p.x, k)+pow(p.y, k)+pow(p.z, k), 1./k);
}

float chebyshev(vec2 p, float k) {
    p = abs(p);
    return pow(pow(p.x, k)+pow(p.y, k), 1./k);
}

// signed distance functions
// https://iquilezles.org/articles/distfunctions/

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdCapsule(vec3 p, float h, float r) {
    p.y -= clamp(p.y, 0., h);
    return length(p) - r;
}

float sdRoundedCylinder(vec3 p, float ra, float rb, float h) {
    vec2 d = vec2(length(p.xz) - 2.*ra+rb, abs(p.y) - h);
    return min(max(d.x,d.y),0.) + length(max(d,0.)) - rb;
}

float sdRoundedCylinder(vec3 p, float ra, float rb, float h, float k) {
    vec2 d = vec2(chebyshev(p.xz, k) - 2.*ra+rb, abs(p.y) - h);
    return min(max(d.x,d.y),0.) + length(max(d,0.)) - rb;
}

float sdCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(h,r);
    return min(max(d.x,d.y),0.) + length(max(d,0.));
}

float sdRoundBox(vec3 p, vec3 s, float r) {
    p = abs(p) - s;
    return length(max(p,0.0)) + min(max(p.x,max(p.y,p.z)),0.0) - r;
}

// hollow cylinder function by me
float sdHollowCylinder(vec3 p, vec3 s) {
    return length(vec2(length(p.yz) - s.x, max(0., abs(p.x) - s.y))) - s.z;
}

float sdSegment(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0., 1.);
    return length(pa - ba*h) - r;
}

float sdCappedCone(vec3 p, vec3 a, vec3 b, float ra, float rb, float r) {
    float rba  = rb-ra;
    float baba = dot(b-a,b-a);
    float papa = dot(p-a,p-a);
    float paba = dot(p-a,b-a)/baba;
    float x = sqrt( papa - paba*paba*baba );
    float cax = max(0.,x-((paba<.5)?ra:rb));
    float cay = abs(paba-.5)-.5;
    float k = rba*rba + baba;
    float f = clamp((rba*(x-ra)+paba*baba)/k, 0., 1.);
    float cbx = x-ra - f*rba;
    float cby = paba - f;
    float s = (cbx<0. && cay<0.) ? -1. : 1.;
    return s*sqrt( min(cax*cax + cay*cay*baba,
                       cbx*cbx + cby*cby*baba)) - r;
}

float sdHorseshoe(vec3 p, float a, float r, float le, vec2 w, float r1) {
    float c = cos(a), s = sin(a);
    p.x = abs(p.x);
    float l = length(p.xy);
    p.xy = mat2(-c, s,
              s, c)*p.xy;
    p.xy = vec2((p.y>0. || p.x>0.)?p.x:l*sign(-s),
                (p.x>0.)?p.y:l );
    p.xy = vec2(p.x,abs(p.y-r))-vec2(le,0.);

    vec2 q = vec2(length(max(p.xy,0.0)) + min(0.,max(p.x,p.y)),p.z);
    vec2 d = abs(q) - w;
    return min(max(d.x,d.y),0.) + length(max(d,0.)) - r1;
}

float sdScene(vec3 p) {
    float d = 1e10;

    // head

    d = min(d, chebyshev(p, 2.3) - .48);
    d = max(d, -p.y);
    d = min(d, sdRoundedCylinder(p - vec3(0,-.1,0), .25,.025,.1, 2.3));

    // eyes

    vec3 q = p.zyx;
    d = max(d, -sdSphere(q - vec3(.425,.025,.175), .09));
    d = max(d, -sdSphere(q - vec3(.425,.05,-.175), .12));

    d = min(d, sdHollowCylinder(q - vec3(.25,.025,.175), vec3(.08,.25,.0125)));
    d = min(d, sdHollowCylinder(q - vec3(.25,.05,-.175), vec3(.11,.25,.0125)));
    d = min(d, sdSphere(q - vec3(.35,.025,.175), .075));
    d = min(d, sdSphere(q - vec3(.35,.05,-.175), .105));

    // bolts

    q = p;
    for (int i = 0; i < 4; i++) {
        q.xz *= rot(float(i)*PI*.5);
        d = min(d, sdSphere(q - vec3(.5,-.1,0), .025));
    }

    // neck

    d = min(d, sdCylinder(p - vec3(0,-.325,0), .1,.1));
    d = min(d, sdRoundedCylinder(p.yxz - vec3(-.225,0,0), .02, .025, .125));

    // body

    d = min(d, sdRoundedCylinder(p - vec3(0,-.525,0), .15, .025, .15+.025, 3.));
    d = min(d, sdRoundBox(p - vec3(0,-.55,.225), vec3(.1,.06,.1), .015));
    d = min(d, sdRoundedCylinder(p.yxz - vec3(-.79-.025,0,0), .045, .01, .125));

    // bolts

    q = p;
    q -= vec3(0,-.55,.35);
    q.x = abs(q.x);
    q.y = abs(q.y);
    d = min(d, sdSphere(q - vec3(.085,.045,-.01), .015));

    // legs

    q = p;
    q.x = abs(q.x);
    d = min(d, sdSphere(q - vec3(.19-.025-.005,-.79-.025,0), .065));
    q -= vec3(.19-.025-.005,-.785-.025,0);
    q.yz *= rot(.2);
    d = min(d, max(sdRoundBox(q, vec3(.0025,.25,.025), .01), p.y + .785));
    d = min(d, sdSphere(q - vec3(0,-.25,0), .05));
    d = min(d, sdCappedCone(q, vec3(0,-.25,0), vec3(0,-.45,-.1), .06, .095, .01));
    d = min(d, .5*sdCappedCone(q * vec3(1.7,1,1), vec3(0,-.45,-.1), vec3(0,-.55,-.15), .05, .17, .01));

    // arms

    q = p;
    q.x = abs(q.x);
    d = min(d, sdSphere(q - vec3(.175*2.-.025,-.45,0), .075));
    d = min(d, sdSegment(q, vec3(.175*2.-.025,-.45,0), vec3(.4,-.7,-.025), .025));
    d = min(d, sdSphere(q - vec3(.4,-.7,-.025), .05));
    d = min(d, sdCappedCone(q, vec3(.4,-.7,-.025), vec3(.375,-.9,.05), .06, .095, .01));
    q = q.zyx * vec3(1,-1,1) - vec3(.05,.925,.375);
    q.zx *= rot(.2);
    d = min(d, sdHorseshoe(q, 1.3, .075, .075, vec2(.01,.01), .01));

    // support

    d = min(d, sdRoundedCylinder(p - vec3(0,-1.6,0), .25, .01, .05, 3.));

    // output
    return d;
}

// main raymarching loop

float rayMarch(vec3 ro, vec3 rd) {
    float d = 0.;

    for (int i = 0; i < 512; i++) {
        vec3 p = ro + rd * d;
        float s = sdScene(p);
        d += s;
        if (s < .001 || d > MAX_DIST) break;
    }

    return d;
}

vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(.0001,0);
    float d = sdScene(p);

    return normalize(d - vec3(sdScene(p - e.xyy),
                              sdScene(p - e.yxy),
                              sdScene(p - e.yyx)));
}

// soft shadow function by iq: https://iquilezles.org/articles/rmshadows/

float calcSoftshadow( in vec3 ro, in vec3 rd, float k)
{
	float res = 1.;
    float t = .01;
    float ph = 1e10;

    for(int i = 0; i < 64; i++) {
		float h = sdScene(ro + rd * t);
        float y = h * h/ (2.*ph);
        float d = sqrt(h*h - y*y);
        res = min(res, k*d / max(0., t - y));
        ph = h;

        t += h;
        if( res < .001 || t > 16.) {
            break;
        }

    }
    res = clamp( res, 0.0, 1.0 );
    return res*res*(3.0-2.0*res);
}

// ambient occlusion by iq: https://www.shadertoy.com/view/Xds3zN

float calcAO( in vec3 pos, in vec3 nor ) {
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<4; i++ )
    {
        float h = 0.01 + 0.12*float(i)/4.0;
        float d = sdScene( pos + h*nor );
        occ += (h-d)*sca;
        sca *= 0.95;
        if( occ>0.35 ) break;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );
}

// biplanar mapping function

vec3 applyTexture(sampler2D tex, vec3 p, vec3 n, float k) {
     p = DESAT p;

     vec3 xy = texture(tex, p.xy).rgb;
     vec3 xz = texture(tex, p.xz).rgb;
     vec3 yz = texture(tex, p.yz).rgb;

     n = abs(n);
     n = pow(n, vec3(k));
     n /= dot(n, vec3(1));

     return xy*n.z + xz * n.y + yz*n.x;
}

// background color

vec3 background(vec3 rd) {
    vec3 sky = mix(vec3(1), vec3(.5,.7,1), DESAT rd.y);

    vec3 sunpos = vec3(-1,2,3)*4.;
    vec3 p = rd * max(0., dot(SUN_POS, rd));
    float sun = .1/length(SUN_POS - p);

    return sky + sun * vec3(1,.6,.3);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 mouse = iMouse.xy / iResolution.xy;

    // antialiasing by iq

    vec3 tot = vec3(0);
    for (int i = 0; i < AA; i++) {
    for (int j = 0; j < AA; j++) {
        vec2 o = vec2(i, j) / float(AA) - .5;
        vec2 uv = (fragCoord + o - .5 * iResolution.xy) / iResolution.y;

        // setup camera

        vec3 ro = vec3(0,(mouse.y-.5) * 4.,-3);
        ro.xz *= rot(iTime-mouse.x*TAU);

        vec3 rd = getRayDir(uv, ro, vec3(0,-.5,0), 1.);

        float d = rayMarch(ro, rd);

        vec3 col = background(rd);
        if (d < MAX_DIST) {

            // coloring and lighting

            vec3 p = ro + rd * d;
            vec3 n = calcNormal(p);
            vec3 r = reflect(rd, n);

            vec3 mat = .7+.3*applyTexture(iChannel0, p, n, 32.);
            col = vec3(0);

            vec3 lig = normalize(SUN_POS);
            float dif = clamp(dot(n, lig), 0., 1.); // diffuse lighting
            float sha = calcSoftshadow(p, lig, 16.); // soft shadow
            float occ = calcAO(p, n); // ambient occlusion
            float glo = DESAT -n.y;
            float sky = 1. - dif*sha;

            col += mat * sqrt(dif * sha); // base ligthing
            col += mat * .4*vec3(1,.5,.3) * glo * occ; // global illumination (fake)
            col += occ*mat * .2*sky; // indirect sky illumination (fake)
        }
        col = pow(col, vec3(.4545)); // gamma correction
        tot += col;
    }
    }
    tot /= float(AA*AA);
    tot = clamp(tot, 0., 1.);

    fragColor = vec4(tot,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec4(mouse * resolution, 1., 0.);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

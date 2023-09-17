/*
 * Original shader from: https://www.shadertoy.com/view/7t2cRd
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
#define round(x) (floor((x) + 0.5))

// --------[ Original ShaderToy begins here ]---------- //
const float PI    = 3.14159265359;
const float TWOPI = 6.28318530717;

const float C = cos(PI/5.), S=sqrt(0.75-C*C);
const vec3 P35 = vec3(-0.5, -C, S); // normalized plan normal
// boundaries of coordinate domains
const vec3 ICOMIDEDGE = vec3(0,0,1);
const vec3 ICOVERTEX = normalize(vec3(S,0.0,.5));
const vec3 ICOMIDFACE = normalize(vec3(0.0,S,C));
// base change matrices to align with the corners of coordinate domains
// takes domain corner as y axis
const mat2 baseDode = mat2(ICOVERTEX.z,-ICOVERTEX.x,ICOVERTEX.xz);
const mat2 baseIco = mat2(ICOMIDFACE.z,-ICOMIDFACE.y,ICOMIDFACE.yz);
#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001
// #define AA

vec3 opIcosahedron( vec3 p, out float parity )
{
	vec3 par = sign(p);
    p = abs(p);
    float mirr = dot(p, P35);
    p -= 2.*min(0., mirr)*P35;
	par *= sign(vec3(p.xy,mirr));
    p.xy = abs(p.xy);
    mirr = dot(p, P35);
    p -= 2.*min(0., mirr)*P35;
	par *= sign(vec3(p.xy,mirr));
    p.xy = abs(p.xy);
    mirr = dot(p, P35);
    p -= 2.*min(0., mirr)*P35;
    parity = par.x*par.y*par.z*sign(mirr);
    return p;
}

// From IQ
// List of some other 2D distances: https://www.shadertoy.com/playlist/MXdSRf
float smin( float a, float b, float k ) {
    float h = clamp( 0.5+0.5*(b-a)/k, 0., 1. );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float smax(float a, float b, float k) {
	return smin(a, b, -k);
}

float cro(in vec2 a, in vec2 b ) { return a.x*b.y - a.y*b.x; }

// uneven capsule
float sdUnevenCapsuleY( in vec2 p, in float ra, in float rb, in float h )
{
	p.x = abs(p.x);

    float b = (ra-rb)/h;
    vec2  c = vec2(sqrt(1.0-b*b),b);
    float k = cro(c,p);
    float m = dot(c,p);
    float n = dot(p,p);

         if( k < 0.0   ) return sqrt(n)               - ra;
    else if( k > c.x*h ) return sqrt(n+h*h-2.0*h*p.y) - rb;
                         return m                     - ra;
}

float opExtrussion( in vec3 p, in float sdf, in float h )
{
    vec2 w = vec2( sdf, abs(p.z) - h );
  	return min(max(w.x,w.y),0.0) + length(max(w,0.0));
}

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

vec2 opPolar(vec2 p,int n) {
    float angle = TWOPI/float(n);
    float at=atan(p.y,p.x);
    // IQ video about polar symetry https://youtu.be/sl9x19EnKng?t=1745
    float sector = round(at/angle);
    p = Rot(angle*sector) * p;
    return p;
}

vec4 flower(vec3 q, int n, float t) {
    // stem
    float cycle = sin(t*.25);
    float h = 1.05+.25*smoothstep(-0.5,-0.25,cycle);
    float d = length(q-vec3(0.,0.,min(q.z,h)));
    vec4 hit = vec4(d,2.0,q.z-h,d);
    hit.x -= .05;
    if (q.z < h) hit.x -= .002*min(1.0,cos((q.z-h)*150.)+.9);
    // petals
    q.z -= h;
    q.xy *= Rot(t*.5);
    q.yx = opPolar(q.yx,n);
    q.xy-=vec2(0.0,.07);
    q.zy *= Rot(.9-.3*smoothstep(-0.3,0.2,cycle));
    float fan = sdUnevenCapsuleY(q.xy-vec2(0.0,.015),.015,.08,.30);
    float fan3d = opExtrussion(q,fan,.0)-.02;
    fan3d -= .001*min(1.0,cos((fan)*220.)+.9);

    if ( fan3d < hit.x ) hit = vec4(fan3d,1.0,-fan,q.z);
    return hit;
}

vec4 opU(vec4 a, vec4 b)
{
    return a.x < b.x ? a : b;
}

vec4 map4(vec3 p) {
    p.yz *= Rot(.5*cos(TWOPI*fract(iTime*.053)));
    p.xz *= Rot(TWOPI*fract(iTime*.0234));
    float center = length(p);
    if ( center > 2. ) return vec4(center-1.9,vec3(0)); // bound volume
    float parity;
    vec3 q = opIcosahedron(p,parity);
    float base = min(center-.8,min(min(q.x,q.y),dot(q,P35))-.01);
    float rTube = .08;
    float h0 = length(q.xy)-rTube;
    float h1 = length(q-ICOVERTEX*dot(q,ICOVERTEX))-rTube; // tube 1
    float h2 = length(q-ICOMIDFACE*dot(q,ICOMIDFACE))-rTube; // tube 2
    base = min(max(base,-h1),abs(h1)-.01);
    base = min(max(base,-h2),abs(h2)-.01);
    base = min(max(base,-h0),abs(h0)-.01);
    base = smax(base,center-1.0,.02);
    base -= .002*min(1.0,cos((center)*100.)+.8); // some carving
    vec4 hit = vec4(base,4.0,center,0.0);
    // Flowers
    // Each time I get coordinates starting from 2 edges of the domain (like dode and ico vertexes)
    // Flower 1 at DODE face center, symetry is 5
    // Flower 2 at ICO face center, symetry is 3
    // hit = opU(hit,flower(vec3(q.x,q.y*parity,q.z),8,iTime));
    hit = opU(hit,flower(vec3((q.xz*baseDode).x,q.y*parity,(q.xz*baseDode).y),10,iTime));
    hit = opU(hit,flower(vec3(q.x*parity,q.yz*baseIco),9,iTime*1.3));
    return hit;
}

float map(vec3 p) {
    return map4(p).x;
}

float RayMarch(vec3 ro, vec3 rd) {
	float dO=0.;

    for(int i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        float dS = map(p);
        dO += dS;
        if(dO>MAX_DIST || abs(dS)<SURF_DIST) break;
    }

    return dO;
}

vec3 GetNormal(vec3 p) {
	float d = map(p);
    vec2 e = vec2(.001, 0);

    vec3 n = d - vec3(
        map(p-e.xyy),
        map(p-e.yxy),
        map(p-e.yyx));

    return normalize(n);
}

float calcOcclusion( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float h = 0.01 + 0.11*float(i)/4.0;
        vec3 opos = pos + h*nor;
        float d = map( opos );
        occ += (h-d)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 2.0*occ, 0.0, 1.0 );
}

// IQ
float calcSoftshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
    float res = 1.0;
    float t = mint;
    for( int i=0; i<24; i++ )
    {
		float h = map( ro + rd*t );
        float s = clamp(8.0*h/t,0.0,1.0);
        res = min( res, s*s*(3.0-2.0*s) );
        t += clamp( h, 0.02, 0.2 );
        if( res<0.004 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
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
	vec2 m = (iMouse.xy-.5*iResolution.xy)/iResolution.y;

    vec3 ro = vec3(0.5, 0, -3.6);

    if ( iMouse.x > 0.0 ) {
        ro.yz *= Rot(-.5*m.y*3.14);
        ro.xz *= Rot(-.5*m.x*6.2831);
    }
    vec3 tcol = vec3(0);
#ifdef AA
	for (float dx = 0.; dx <= 1.; dx++)
		for (float dy = 0.; dy <= 1.; dy++) {
			vec2 uv = (fragCoord + vec2(dx, dy) * .5 - .5 * iResolution.xy) / iResolution.y;
#else
			vec2 uv = (fragCoord - .5 * iResolution.xy) / iResolution.y;
#endif
    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), 1.);
    vec3 bg =  vec3(0.5, 0.8, 0.9) - max(rd.y,0.0)*0.5; // IQ https://youtu.be/Cfe5UQ-1L9Q?t=13898
    vec2 suv = 20.0*rd.xy;
    float cl = 1.0*(sin(suv.x*1.0+iTime)+sin(suv.y*1.0))+
               0.5*(sin(suv.x*2.0+iTime)+sin(suv.y*2.0));
    vec3 sky_color = vec3(.9,.9,1.0);
    bg = mix(bg,sky_color,0.5*smoothstep(-0.4,0.4,-0.6+cl));

    vec3 col = bg;
    float d = RayMarch(ro, rd);

    if(d<MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = GetNormal(p);
        vec3 r = reflect(rd, n);
        vec4 hit = map4(p);
        vec3 objCol = vec3(0);
        if ( hit.y < 1.5 ) {
            // petals
            objCol = mix(vec3(1.000,0.141,0.141),vec3(1.000,0.078,0.525),smoothstep(0.0,0.015,hit.z));
            objCol = mix(objCol,vec3(1.000,0.784,0.000)+.2,smoothstep(.056,.060,hit.z));
            objCol = mix(objCol,vec3(1),smoothstep(.005,-.02,hit.w));
        } else if ( hit.y <= 2.5 ) {
            // stem
            objCol = mix(vec3(0.000,1.000,0.251),vec3(0.349,1.000,0.000),smoothstep(-0.25,0.0,hit.z));
        } else if ( hit.y <= 4.5 ) {
            // base
            objCol = mix(.5+.5*vec3(0.933,1.000,0.000),vec3(1),1.0-smoothstep(0.95,0.93,hit.z));
        }
        vec3 sun_lig = normalize(vec3(1,1,-3));
        float dif = max(0.0,dot(n, sun_lig));
        float spe = pow(clamp(dot(n,normalize( sun_lig-rd )),0.0,1.0),8.0) * dif; // Blinn
        float occ = 0.5+0.5*calcOcclusion(p,n);
        float sha = .2+.8*calcSoftshadow( p+0.01*n, sun_lig, 0.01, 1.0 );
        float fre = clamp(1.0+dot(rd,n),0.0,1.0); // Fresnel https://youtu.be/beNDx5Cvt7M?t=1510
        // IQ https://www.shadertoy.com/view/3lsSzf
        float bou_dif = sqrt(clamp( 0.1-0.9*n.y, 0.0, 1.0 ))*clamp(1.0-0.1*p.y,0.0,1.0);
        vec3 sun_col = vec3(1.64,1.27,0.99);
        vec3 lin = vec3(0);
        lin += dif * sun_col * .9 * occ * sha;
        lin += bou_dif*vec3(0.239,0.545,0.176) * occ;
        lin += fre * sky_color * occ * sha;
        col = objCol * lin * occ *.6;
        col += spe * occ * .4 * sun_col * sha;
    }
    col = mix(col,bg,smoothstep(3.0,5.0,d)); // fog
    col = mix(col, smoothstep(0.0,1.0,col),.4); // pop filter - YX - Is This Your Card?  - https://www.shadertoy.com/view/sl2yWK
    tcol+=col;
#ifdef AA
		}
	tcol /= 4.;
#endif
    tcol = pow(tcol, vec3(.4545));	// gamma
    fragColor = vec4(tcol,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

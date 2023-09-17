/*
 * Original shader from: https://www.shadertoy.com/view/Nscfzl
 */

#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
float iTime = 0.;
#define iResolution resolution
const vec4 iMouse = vec4(0.);

// Protect glslsandbox uniform names
#define time        stemu_time

// --------[ Original ShaderToy begins here ]---------- //
/**
    License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

    Raceway City | Music Glow Worm | Matrix & Futurebound
    07/06/22 | byt3_m3chanic


*/

#define M           iMouse
#define R           iResolution
#define T           iTime

#define PI          3.14159265359
#define PI2         6.28318530718

#define S smoothstep
#define L length

#define Q(a) mat2(cos(a + vec4(3,14,36,3)))
#define H21(a) fract(sin(dot(a,vec2(21.23,41.32)))*43758.5453)

#define N(p,e) vec3(map(p-e.xyy).x,map(p-e.yxy).x,map(p-e.yyx).x)
#define H(hs) .5+.4*cos(PI2*hs+2.*vec3(.95,.97,.90)*vec3(.95,.55,.15))

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 uv) {
    vec2 i = floor(uv),
         f = fract(uv);
    // Four corners in 2D of a tile
    float a = H21(i),
          b = H21(i + vec2(1.0, 0.0)),
          c = H21(i + vec2(0.0, 1.0)),
          d = H21(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3. - 2.0 * f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b)* u.x * u.y;
}

float fbm ( in vec2 uv, float oct) {
    float v = .0,a = .5;
    vec2 shift = vec2(100.0);
    for (float i = 0.; i < 8.; ++i) {
        if (i >= oct) break;
        v += a * noise(uv);
        uv = Q(.15) * uv * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

//scale
const float sz=3.,hf=sz/2.,hz=hf*.25;
const vec2 vc = vec2(0,.5);

vec3 hp,hitp;
vec2 sid,idi;
float time=0.,slow=.0,glow=.0,shs,ghs,ffs=0.;

//@Shane / Path demos
vec2 path(in float z){
    vec2 p1 =vec2(2.3*sin(z * .065), 2.4*sin(z * .045));
    vec2 p2 =vec2(1.2*cos(z * .050), 2.1*cos(z * .125));
    return p1 - p2;
}

vec2 map(in vec3 p) {
    p.xy-=vec2(1.5,(ffs-.5));
    vec2 r = vec2(1e5,0);

 	vec2 track = p.xy - path(p.z);
    vec3 q = vec3(track,p.z);
    vec3 qq=q;
    vec2 id=floor((q.xz+hf)/sz);
    q.xz=mod(q.xz+hf,sz)-hf;

    float f = L(q.y-1.)-.1;

    float hs=H21(id);
    shs=hs;
    idi=id;

    if(hs>.65) {
         vec3 pp = q;
         pp.xz=abs(pp.xz)-(hf*.5);pp.y-=.75;

         f = min(L(max(abs(pp)-vec3(.01,.5,.01),0.)),f);
         float lm =L(pp+vec3(0,.5,0))-.095;
         f = min(lm,f);
         slow += .00003/(.00005+lm*lm);
    }

    p.xz=abs(q.xz)-hf;q.y-=.5;
    float g = L(max(abs(q)-vec3(hz,hf+hs,hz),0.))-.015;

    if(f<r.x) {r=vec2(f,2);hp=q;}
    if(g<r.x) {r=vec2(g,4);hp=qq;}

    return r;
}

void mainImage(out vec4 O, vec2 F)
{
    time =  T;

    ffs=clamp((3.5-T*.08),0.,3.75);
    float mt = mod(floor(T*.5),14.);

    float sp = clamp((3.+T)*.09,0.,11.);
    float travelSpeed = sp*time;

    float alpha = 1.;

    vec2 uv = (2.*F.xy-R.xy)/max(R.x,R.y),
         id= vec2(0);


    vec3 C = vec3(0),
         p = vec3(0),
         lp = vec3(0,0,-travelSpeed),
         ro = vec3(0,0,.25);

    float crop = clamp((-.02)+(T*.04),0.,.6);
    if(uv.y<crop&&uv.y>-crop){

    float x = M.xy==vec2(0) || M.z<0. ? 0.: (M.y/R.y*0.5-.25)*PI;
    float y = M.xy==vec2(0) || M.z<0. ? mt>8.?PI:0.: (M.x/R.x*2.0-1.0)*PI;
    ro.zy*=Q(x);

    ro +=lp;
 	lp.xy += path(lp.z);
    ro.xy += path(ro.z);

    vec3 f=normalize(lp-ro),
         r=normalize(cross(vec3(0,1,0),f)),
         u=normalize(cross(f,r)),
         c=ro+f*.65,
         i=c+uv.x*r+uv.y*u,
         rd = i-ro;

    rd.xy = Q(-path(lp.z+2.).x/ 24. )*rd.xy;
    rd.xz = Q( y)*rd.xz;

    float clouds = max(rd.y,0.0)*1.5;
    vec2 sv = .75*rd.xz/rd.y;

    clouds += 1.45*(-3.0+4.*S(-0.2,0.85,fbm(sv+vec2(0,T*.2),6.)));
    clouds = mix(clouds,1.,clamp(abs(sv.y)*.075,0.,1.));
    vec3 fde = vec3(0.212,0.212,0.212);

    vec3 sky = mix(vec3(.3),fde,clamp(clouds,0.,1.));

    float d=0.,m=0.;
    for(int i=0; i<164;i++){
        if (d>=85.) break;
        p = ro + rd * d;
        vec2 t = map(p);
        d+=i<32?t.x*.65:t.x;
        m=t.y;
    }

    sid=idi;
    hitp=hp;
    glow=slow;
    ghs=shs;

    float t = map(p).x,
         sd = 1.,
         z=.01,
         hs = H21(sid);

    vec2 e = vec2(d*.001,0);
    vec3 l = normalize(vec3(-5,-15,5)),
         n = t - N(p,e);
         n = normalize(n);

    float zz=.01;
    for(int i=0; i<100; i++) {
        if (zz>=16.) break;
        float h = map(p+l*zz).x;
        if(h<.001) {sd=0.;break;}
        sd = min(sd, 18.*h/zz);
        zz+=h;
        if(sd<.001) break;
    }

    float ch = mod(sid.x+sid.y,2.)*2.-1.,
          diff = clamp(dot(n,l),.1,.9);
          diff = mix(diff,diff*sd,.75);

    vec3 h = ch>.5?vec3(.2,0,0):vec3(.7);

    if(m==2.) {
        h=vec3(.15);
        float sc = 1./sz,
              px=4./R.x;

        p.xz-=hf;
        vec2 f = fract(hitp.xz*sc)-.5;
        float e = min(L(f.x)-.2,L(f.y)-.2),
              d=S(px,-px,abs(abs(e)-.01)-.005);

        e=S(px,-px,e);
        h=mix(h,vec3(.01),e);
        h=mix(h,vec3(.7),d);

        float fy=mod(f.y+.05,.1)-.05;
        e = max(L(abs(f.x)-.01)-.001,L(fy)-.03);

        e=S(px,-px,e);
        h=mix(h,vec3(.4,.2,.0),e);
    }

    if(m==3.) h=vec3(.5);
    if(m==4.) {
        vec3 f = floor(hitp*16.);
        float hs = min(H21(f.xy),H21(f.zy));
        float lvl = .925+ghs;
        h=hitp.y>-lvl?vec3(.05):vec3(.2);
        if(hs>.5 &&hitp.y>-lvl) h=hs>.75?vec3(.9,.9,.2):vec3(.4);
        if(hs<.15&&hitp.y>-lvl) h=vec3(.025);
    }

    C = diff*h;

    glow=clamp(glow,0.,.95);
    C = mix(C,vec3(.9,.9,.6),glow);
    C = mix(C,fde,1.-exp(-.00004*d*d*d));
    C = d<85. ? C : sky;
    }
    O = vec4(pow(C,vec3(.4545)),1);
}
// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

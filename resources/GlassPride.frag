/*
 * Original shader from: https://www.shadertoy.com/view/Nsdczf
 */

#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy emulation
float iTime = 0.;
#define iResolution resolution
vec4 iMouse = vec4(0.);

// Protect glslsandbox uniform names
#define time        stemu_time

// --------[ Original ShaderToy begins here ]---------- //
/**
    License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

    🌈 PRIDE 2022 | 6/01/22  @byt3_m3chainc

    Some simple SDF extrusions to make some custom letters.

    made with a big thank you and a little bit of
    help from: @blackle, @tdhooper, @iq, @Drakyen
*/


#define R 		iResolution
#define T 		iTime
#define M 		iMouse

#define PI          	3.14159265358
#define PI2         	6.28318530718

#define MAX_DIST    40.

// AA Setting - comment/uncomment to disable/endable AA from render
#define AA 2

float mtime=0.,time=0.;
float hash21(vec2 a) { return fract(sin(dot(a,vec2(21.23,41.232)))*43758.5453); }
mat2 rot(float a){ return mat2(cos(a),sin(a),-sin(a),cos(a));}

float vmax(vec3 p){ return max(max(p.x,p.y),p.z); }
float box(vec3 p, vec3 b){
	vec3 d = abs(p) - b;
	return length(max(d,vec3(0))) + vmax(min(d,vec3(0)));
}
float box(vec3 p, vec3 b, in vec4 r ){   r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
	vec3 d = abs(p) - b+vec3(r.x,0,0);
	return length(max(d,vec3(0))) + vmax(min(d,vec3(0)));
}
float box( in vec2 p, in vec2 b ){
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}
float box( in vec2 p, in vec2 b, in vec4 r ){
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}
// letter shapes
float getP(vec2 uv){
    float letp = box(uv-vec2(-.04,.1),vec2(.15),vec4(.15,.15,.00,0));
    letp=abs(letp)-.05;
    letp=min(box(uv+vec2(.19, .0),vec2(.05,.3)),letp);
    return letp;
}
mat2 rtR=mat2(0.),ry=mat2(0.),rx=mat2(0.);
float getR(vec2 uv){
    float letr = box(uv-vec2(0,.1),vec2(.15),vec4(.15,.15,.00,0));
    letr=abs(letr)-.05;
    letr=min(box(uv+vec2(.15,.0),vec2(.05,.3)),letr);
    vec2 uu = uv+vec2(-.1, .175);
    uu.xy*=rtR;
    letr=min(box(uu,vec2(.05,.175)),letr);
    letr=max(letr, -box(uv+vec2(-.1, .35),vec2(.4,.05)) );
    return letr;
}
float getI(vec2 uv){
    float leti = box(uv,vec2(.05,.3));
    return leti;
}
float getD(vec2 uv){
    float letd = box(uv,vec2(.125,.25),vec4(.125,.125,.00,0));
    letd=abs(letd)-.05;
    letd=min(box(uv+vec2(.125, .0),vec2(.05,.3)),letd);
    return letd;
}
float getE(vec2 uv){
    uv.y=abs(uv.y);
    float lete = box(uv-vec2(.0, .0),vec2(.05,.3));
    lete = min(box(uv-vec2(.1, .0),vec2(.10,.05)),lete);
    lete = min(box(uv-vec2(.1, .25),vec2(.15,.05)),lete);
    return lete;
}
//@iq sdf extrude
float opx(in float sdf, in float pz, in float h){
    vec2 w = vec2( sdf, abs(pz) - h );
  	return min(max(w.x, w.y), 0.) + length(max(w, 0.));
}

//global vars
vec3 hit=vec3(0), hitPoint=vec3(0);

vec2 map(vec3 p) {
	vec2 res = vec2(100.,-1.);
    p.x+=.02;
    vec3 q = p;

    p.zy*=rx;
    p.xz*=ry;

    float tn = 0.;
    float lp = getP(p.xy+vec2(.75,0));
    tn = lp;
    float tp = opx(lp,p.z,.1);

    float lr = getR(p.xy+vec2(.30,0));
    tn=min(lr,tn);
    float tr = opx(lr,p.z,.1);

    float li = getI(p.xy-vec2(.05,0));
    tn=min(li,tn);
    float ti = opx(li,p.z,.1);

    float ld = getD(p.xy-vec2(.40,0));
    tn=min(ld,tn);
    float td = opx(ld,p.z,.1);

    float le = getE(p.xy-vec2(.72,0));
    tn=min(le,tn);
    float te = opx(le,p.z,.1);

    tn = abs(tn)-.02;
    float tx = opx(tn,p.z,.075);

    float pr = min(tp,tr);
    float id = min(ti,td);
    float pride = min(te,id);
    pride=min(pr,pride);

    if(pride<res.x){
        res = vec2(pride,1.);
        hit=p;
    }
    if(tx<res.x){
        res = vec2(tx,3.);
        hit=p;
    }
    float flr =q.z+2.5;
    if(flr<res.x) {
        res = vec2(flr,2.);
    	hit=q;
    }

    return res;
}

vec3 normal(vec3 p, float t, float mindist){
    t*=mindist;
    float d = map(p).x;
    vec2 e = vec2(t,0);

    vec3 n = d-vec3(
        map(p-e.xyy).x,
        map(p-e.yxy).x,
        map(p-e.yyx).x
    );
    return normalize(n);
}

//@iq of hsv2rgb
vec3 hsv2rgb( in vec3 c ) {
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
	return c.z * mix( vec3(1.0), rgb, c.y);
}

float scale = 3.5;
vec3 shade(vec3 p, vec3 rd, float d, float m, inout vec3 n){
    n = normal(p,d,1.);

    vec3 lpos = vec3(2,9,7);
    vec3 l = normalize(lpos-p);
    float diff = clamp(dot(n,l),0.,1.);
    vec3 h=vec3(0.05);

    if(m==2.) {
        vec2 uv =hitPoint.xy;
        uv-=T*vec2(.05,.2);

        vec2 id = floor(uv*scale);
        uv = fract(uv*scale)-.5;

        float hs = hash21(id+floor(T*8.));
        vec3 hue = 0.5 + 0.5*cos(hs+vec3(0,1,2)-id.xyx*.2);
        float px = 1.5*scale/R.x;

        float d = box(uv,vec2(.3))-.125;
        d = smoothstep(px,-px,d);

        h = mix (vec3(.01),hue,d);
    }

    if(m==3.) h = hsv2rgb(vec3(p.x*.5,1.,.5));

    return diff*h;
}

vec3 renderFull(vec2 uv)
{
    //precal
    rtR=rot(0.38397243543);

    vec3 C=vec3(.0);
    vec3 ro = vec3(0,0,1.45),
         rd = normalize(vec3(uv,-1));

    // mouse //
    float x = M.xy==vec2(0) ? .18 : -(M.y/R.y*1.-.5)*PI;
    float y = M.xy==vec2(0) ? 0. : -(M.x/R.x*1.-.5)*PI;

    rx =rot(x); ry =rot(y);
    mat2 mx =rot(.1*sin(T*.2)); mat2 my =rot(.075*cos(-T*.15));

    ro.zy*=mx;rd.zy*=mx;
    ro.xz*=my;rd.xz*=my;

    vec3  p = ro + rd * .1;
    float atten = 1.;
    float k = 1.;
    float iv= 1.;

    // loop inspired/adapted from @blackle's
    // marcher https://www.shadertoy.com/view/flsGDH
    // a lot of these settings are tweaked for this scene
    for(int i=0;i<120;i++)
    {
        vec2 ray = map(p);
        vec3 n = vec3(0);
        float d = i<32? ray.x*.7:ray.x*.9;
        float m = ray.y;
        p += rd*d*k;

        //set current hit point
        hitPoint=hit;

        if (d*d < 1e-8) {
            C+=shade(p,rd,d,ray.y,n)*atten;
            if(m==2.) break;

            atten *= .65;
            p += rd*.01;
            k = sign(map(p).x);

            //@Drakyen - refraction math
            vec3 rf=refract(rd,n,iv > 0. ? 1./1.1 : 1.1);
            iv *= -1.;
            if(length(rf) == 0.) rf = reflect(rd,n);
            rd=rf;
            p+=-n*.01;

        }

        if(distance(p,rd)>50.) { break; }
    }

    return clamp(C,vec3(0),vec3(1));
}

// Thank you @tdhooper for AA/Motion Blur help
float vmul(vec2 v) {return v.x * v.y;}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {

    vec3 col = vec3(.00);
    float mTime = iTime;
    time = mTime;

    vec2 o = vec2(0);

    // AA and motion blur from @iq https://www.shadertoy.com/view/3lsSzf
    #ifdef AA
    for( int m=0; m<AA; m++ )
    for( int n=0; n<AA; n++ )
    {
    	// pixel coordinates
    	o = vec2(float(m),float(n)) / float(AA) - 0.5;
    	// time coordinate (motion blurred, shutter=0.5)
    	float d = 0.5*vmul(sin(mod(fragCoord.xy * vec2(147,131), vec2(PI * 2.))));
    	time = mTime - 0.1*(1.0/24.0)*(float(m*AA+n)+d)/float(AA*AA-1);
    #endif

        //time = mod(time, 1.);
    	vec2 p = (-iResolution.xy + 2. * (fragCoord + o)) / iResolution.x;
    	col += renderFull(p);

    #ifdef AA
    }
    col /= float(AA*AA);
    #endif

    col = pow( col, vec3(0.4545) );
    fragColor = vec4(col, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    iMouse = vec4(mouse * resolution, 0., 0.);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

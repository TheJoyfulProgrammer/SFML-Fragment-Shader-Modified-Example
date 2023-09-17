/*
 * Original shader from: https://www.shadertoy.com/view/slffDl
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
//////////////////////////////////////////////////
#define time iTime*0.1
#define pi 3.1415926535
#define deg pi/180.

mat2 r2d(float a) {
    return mat2(cos(a),sin(a),-sin(a),cos(a));
}

float sdBox(vec3 p, vec3 s) {
    return max(abs(p.z)-s.z,max(abs(p.x)-s.x,abs(p.y)-s.y));
}

float f1(vec2 uv) {
    float c = sdBox(vec3(uv,0.),vec3(0.));
    float us = 0.25;
    for (int i=0;i<10;i++) {
        uv = abs(uv)-us;
        c += min(c,sdBox(vec3(uv,0.),vec3(0.)));
        us /= 2.;
    }
    return c;
}

vec4 map(vec3 p) {
    p.z -= 4.;
    p.xy *= r2d(45.*deg);
    p.xz *= r2d(time*0.7);
    p.yz *= r2d(time*0.3);
    float d = sdBox(p,vec3(1.));
    float dc = d;
    p.zy *= r2d(45.*deg);
    p.zy = abs(p.zy);
    p.zy *= r2d(45.*deg);
    p.xz *= r2d(45.*deg);
    p.xz = abs(p.xz);
    p.xz *= r2d(-45.*deg);
    p.xy *= 0.5;
    //float a = f1(p.xy);
    //d += (sin(a*22.+time)*0.5+0.5)*0.04;
    d = min(d,-sdBox(p,vec3(10.)));
    p.xy = step(dc,2.)*p.xy+step(-dc,-2.)*p.xy*0.1;
    float a = f1(p.xy);
    d += (sin(a*22.-time*9.+sdBox(vec3(p.xy,0.),vec3(0.))*10.)*0.5+0.5)*0.1;
    d += (sin(a*22.+time*9.)*0.5+0.5)*0.1*dc;
    return vec4(p.xy,p.z,d);
}

vec2 RM(vec3 ro, vec3 rd) {
    float dO = 0.;
    float ii = 0.;
    for (int i=0;i<120;i++) {
        vec3 p = ro + rd*dO;
        float dS = map(p).w;
        dO += dS*0.1;
        ii += 0.01;
        if (dO > 100. || dS < 0.01) {break;}
    }
    return vec2(dO,ii);
}

vec3 calcNorm(vec3 p) {
    vec2 h = vec2(0.001,0.);
    float m = map(p+h.x).w;
    return normalize(vec3(
        m - map(p-h.xyy).w,
        m - map(p-h.yxy).w,
        m - map(p-h.yyx).w
    ));
}

vec3 colo(vec3 p, vec3 n, vec2 d) {
    vec3 mp = map(p).xyz;
    float co = f1(mp.xy);
    //co += time*0.2;
    co = co;
    co += n.x*0.2;
    float sm = 10.;
    vec3 col = vec3(sin(co*1.*sm),sin(co*sm*1.2),sin(co*sm*1.3))*0.5+0.5;
    if (d.x > 99.) {
        col = vec3(d.y);
    }
    return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 R = iResolution.xy;
    float ar = R.x/R.y;
    uv -= 0.5;
    uv.x *= ar;
    vec3 col = vec3(0.);
    col += sdBox(vec3(uv,0.),vec3(0.));
    float us = 0.25;
    float co = f1(uv);
    vec3 ro = vec3(0.);
    vec3 rd = normalize(vec3(uv,1.));
    vec2 d = RM(ro,rd);
    vec3 p = ro+rd*d.x;
    vec3 n = calcNorm(p);
    vec3 mp = map(p).xyz;
    col = colo(p,n,d);
    for (int i=0;i<2;i++) {
        ro = p+n*0.003;
        rd = reflect(rd,n);
        d = RM(ro,rd);
        p = ro+rd*d.x;
        n = calcNorm(p);
        col += colo(p,n,d)*0.5;
    }
    col *= 0.5;
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

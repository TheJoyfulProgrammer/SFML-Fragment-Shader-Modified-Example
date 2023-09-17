/*
 * Original shader from: https://www.shadertoy.com/view/NddcRM
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
#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define PI 3.14159265

struct DBuffer{
  float d1;
  float d2;
  float d3;
  float mainD;
};

vec2 fmod(vec2 p,float r){
  float a=atan(p.x,p.y)+PI/r;
  float n=(2.*PI)/r;
  a=floor(a/n)*n;
  return rot(a)*p;
}

float sm(float d1,float d2,float k){
  float h=exp(-k*d1)+exp(-k*d2);
  return -log(h)/k;
}

float Cube(vec3 p,vec3 s){
  return length(max(abs(p)-s,0.0));
}

vec2 random2(vec2 seeds)
{
 seeds = vec2(dot(seeds, vec2(127.1, 311.7)),
 dot(seeds, vec2(269.5, 183.3)));
 return fract(sin(seeds) * 43758.5453123);
}

float perlinNoise(vec2 seeds)
{
vec2 i = floor(seeds);
vec2 f = fract(seeds);
vec2 i00 = i + vec2(0, 0);
vec2 i10 = i + vec2(1, 0);
vec2 i01 = i + vec2(0, 1);
vec2 i11 = i + vec2(1, 1);
vec2 f00 = f - vec2(0, 0);
vec2 f10 = f - vec2(1, 0);
vec2 f01 = f - vec2(0, 1);
vec2 f11 = f - vec2(1, 1);
vec2 g00 = normalize(-1.0 + 2.0 * random2(i00));
vec2 g10 = normalize(-1.0 + 2.0 * random2(i10));
vec2 g01 = normalize(-1.0 + 2.0* random2(i01));
vec2 g11 = normalize(-1.0 + 2.0* random2(i11));
float v00 = dot(g00, f00);
float v10 = dot(g10, f10);
float v01 = dot(g01, f01);
float v11 = dot(g11, f11);
vec2 p = smoothstep(0.0, 1.0, f);
float v00v10 = mix(v00, v10, p.x);
float v01v11 = mix(v01, v11, p.x);
return mix(v00v10, v01v11, p.y) * 0.5 + 0.5;
}

float Plane(vec3 p){
//p.z-=time;
p.y+=perlinNoise(p.xz)*1.5+perlinNoise(p.zx*3.)*.5+perlinNoise(p.zx*12.)*.2;
  return p.y;
}

#define foldingLimit 1.0
vec3 boxFold(vec3 z, float dz) {
    return clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

void sphereFold(inout vec3 z, inout float dz, float minRadius, float fixedRadius) {
    float m2 = minRadius * minRadius;
    float f2 = fixedRadius * fixedRadius;
    float r2 = dot(z, z);
    if (r2 < m2) {
        float temp = (f2 / m2);
        z *= temp;
        dz *= temp;
    } else if (r2 < f2) {
        float temp = (f2 / r2);
        z *= temp;
        dz *= temp;
    }
}

// ref: http://blog.hvidtfeldts.net/index.php/2011/11/distance-estimated-3d-fractals-vi-the-mandelbox/
#define ITERATIONS 12
float deMandelbox(vec3 p, float scale, float minRadius, float fixedRadius) {
    vec3 z = p;
    float dr = 1.;
    for (int i = 0; i < ITERATIONS; i++) {
        z = boxFold(z, dr);
        sphereFold(z, dr, minRadius, fixedRadius);
        z = scale * z + p;
        dr = dr * abs(scale) + 1.;
    }
    float r = length(z);
    return r / abs(dr);
}


float d1(vec3 p){
  float d=Plane(p);
  return d;
}

float d2(vec3 p){
  float tspeed=0.5;
  float dt=floor(time*tspeed)+pow(fract(time*tspeed),0.75);
  float val=sin(.15);
  float d=deMandelbox(p+vec3(0.,-2.5,0.), 2.0, .05+val, 1.+val*0.05);
  return d;
}

float d1_1(vec3 p){
  p.xz*=rot(PI/.15);
  p.yz*=rot(PI/4.0);

  p.z+=0.75;


  float scale=.85;

//  p=abs(p)-.1;
  for(int i=0;i<3;i++){
    if(p.x<p.y)p.xy=p.yx;
    if(p.y<p.z)p.yz=p.yz;
    if(p.x<p.z)p.xz=p.zx;
    p.yz*=rot(0.75);
    p.x=abs(p.x)-.12;
    p.z=abs(p.z)-.12;
    //p.xy*=rot(0.15);
  }
p.z=abs(p.z);



float d=Cube(p,vec3(.35,.2,.1));
  for(int i=0;i<3;i++){
    p.xy*=rot(0.15);
    p.xz*=rot(0.01);
    p.yz*=rot(0.5);
    p.xy-=0.25;
    p.xz-=0.25;
    scale*=.9;
    d=sm(d,Cube(p,vec3(.35,.2,.1)*scale),6.0);
  }

  return d;
}

float d3(vec3 p){
  float scale=0.5;

  float d=length(p)-1.*scale;

//p.x+=1.5;
  p.xy*=rot(time);
  p.xz*=rot(time);
  p.yz*=rot(time);
  for(int i=0;i<3;i++){
    p=abs(p)-.3;
    if(p.x<p.y)p.xy=p.yx;
    if(p.x<p.z)p.xz=p.zx;
    if(p.y<p.z)p.yz=p.zy;

    p.xy*=rot(0.5);
    p.xz*=rot(0.15);
    p.yz*=rot(0.25);
}

d=min(d,Cube(p,vec3(.15*scale,.2*scale,.15*scale)));

  return d;
}

DBuffer map(vec3 p,vec3 ro){
  DBuffer d;
  d.d1=d1(p);
  d.d2=d2(p);
  //d.d1=2000.0;
  //d.d2=2000.0;
float radius=-12.;
float speed=-.25;
  float tval=-0.;

  d.d3=d3(p+vec3(cos(time*speed)*radius,-1.0,sin(time*speed)*radius));

  d.mainD=min(min(d.d1,d.d2),d.d3);
  return d;
}

vec3 gn(vec3 p,vec3 ro){
  vec2 e=vec2(0.001,0.);
  return normalize(
    vec3(
      map(p+e.xyy,ro).mainD-map(p-e.xyy,ro).mainD,
      map(p+e.yxy,ro).mainD-map(p-e.yxy,ro).mainD,
      map(p+e.yyx,ro).mainD-map(p-e.yyx,ro).mainD
      )
    );
}

vec3 hsv2rgb2(vec3 c, float k) {
    return smoothstep(0. + k, 1. - k,
        .5 + .5 * cos((vec3(c.x, c.x, c.x) + vec3(3., 2., 1.) / 3.) * radians(360.)));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
  vec2 st = (fragCoord.xy*2.0-resolution.xy) / min(resolution.x,resolution.y);

  vec3 col=vec3((st.y+1.0)*0.5*0.25);
  float radius=15.;
float speed=-.25;
 vec3 ta=vec3(0.);

 vec3 ro=vec3(cos(time*speed)*radius,0.0,sin(time*speed)*radius);
 vec3 cDir=normalize(ta-ro);
 vec3 cSide=cross(cDir,vec3(0.,-1.,0.));
 vec3 cUp=cross(cDir,cSide);
 float depth=1.;
 vec3 rd=normalize(vec3(st.x*cSide+st.y*cUp+cDir*depth));
int ai=0;
  DBuffer d;
  float t=0.,acc=0.0;
  for(int i=0;i<128;i++){
    d=map(ro+rd*t,ro);
    ai=i;
    if(d.d1<0.001||d.d2<0.001||d.d3<0.001||t>1000.0)break;
    t+=d.mainD;
    acc+=exp(-1.0*d.mainD);
  }

  vec3 n=gn(ro+rd*t,ro);

  if(d.d1<0.001){
    col+=vec3(0.45,0.25,0.16)*acc*0.05;
  }

  if(d.d2<0.01){

    col+=vec3(0.5,0.25,0.25)*acc*0.025;
  }

  if(d.d3<0.001){
    vec3 refro=ro+rd*t;
    vec3 n=gn(refro,refro);
    rd=refract(rd,n,1.);
    ro=refro;
    t=0.1;
    float acc2;

    for(int i=0;i<33;i++){
      d=map(ro+rd*t,refro);
      if(d.d1<0.001||d.d2<0.001)break;
      t+=d.mainD;
      float H = mod(time*0.5, 1.0);
      acc2+=exp(-3.*d.mainD);
    }

    vec3 pos=ro+rd*t;
    float flash=1.0-abs(sin(pos.z*.5+time*4.0));
    flash+=.1;
    float H = mod(0.25, 1.5);

    col+=acc*.5*flash*hsv2rgb2(vec3(H,1.0,1.0),2.2);
  }

  col*=(1.0-length(st)+0.5);

  fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

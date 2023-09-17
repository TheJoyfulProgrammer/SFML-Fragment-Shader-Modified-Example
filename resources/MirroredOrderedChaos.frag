/*
 * Original shader from: https://www.shadertoy.com/view/7sdyWX
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
//const vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
//Inspired by https://www.shadertoy.com/view/MtX3Ws

#define aa
#define iTimer 0.
void mainImage(out vec4 fragColor, in vec2 fragCoord){
  vec2 r=iResolution.xy;
  float mr=1./min(r.x,r.y),c,f,t=iTime*1.;
  vec3 z,n,k,p,l=vec3(sin(t*.035),sin(t*.089)*cos(t*.073),cos(t*.1))*.3+vec3(.3);
  #ifdef aa
  for(float x=0.;x<2.;x++){for(float y=0.;y<2.;y++){
  #endif
    n=vec3((fragCoord*2.-r+vec2((x+1.),(y+1.)))*mr*4.,1.);
    vec3 g=vec3(0.);float u=.2,d,e=1.;
    for(float i=0.;i<3.;i++){
      d+=u;p=n*d-l;c=0.;
      for(float j=0.;j<7.;j++){
        p=(sin(t*.05)*.1+.9)*abs(p)/dot(p,p)-(cos(t*.09)*.02+.8);
        p.xy=vec2(p.x*p.x-p.y*p.y,(smoothstep(0., 4., iTime)*3.+.8*cos(t*.07))*p.x*p.y);
        p=p.yxz;
        c+=exp(-9.*abs(dot(p,p.zxy)));
      }
      u*=exp(-c*.6);
      f=c*c*.09;
      g=g*1.5+.5*vec3(c*f*.3,f,f)*1.;
    }
    g*=g;
    k+=g*
    #ifdef aa
    .4;}}
    #else
    1.6;
    #endif
  fragColor=vec4(k/(1.+k),1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

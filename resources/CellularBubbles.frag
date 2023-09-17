/*
 * Original shader from: https://www.shadertoy.com/view/NlXyRB
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
int int_mod(int a, int b)
{
    return (a - (b * (a/b)));
}

int int_max(int a, int b)
{
    return (a > b) ? a : b;
}

// --------[ Original ShaderToy begins here ]---------- //
#define DTR 0.01745329
#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))

vec2 uv;
vec3 cp=vec3(0.),cn,cr=vec3(0.),ro=vec3(0.),rd=vec3(0.),ss,oc,cc,gl,vb;
vec4 fc=vec4(0.);
float tt=0.,cd=0.,sd=0.,io=0.,oa=0.,td=0.;
int es=0,ec;


vec3 lattice(vec3 p, int iter)
{
		for(int i = 0; i < 3; i++)
		{
			p.xz *= rot(45.*DTR);
			p=abs(p)-1.;
			p.xy *= rot(-45.*DTR);
		}
		return p;
}


float mp(vec3 p)
{
//now with mouse control
if(iMouse.z>0.){
    p.yz*=rot(2.0*(iMouse.y/iResolution.y-0.5));
    p.zx*=rot(-7.0*(iMouse.x/iResolution.x-0.5));
}
		vec3 pp=p;

		p.xz*=rot(tt*0.1);
		p.xy*=rot(tt*0.1);

		p = lattice(p, 3);

		sd=length(p)-1.3;
		sd=mix(sd,-length(pp),0.01);

		if(sd>0.01) gl += exp(-sd) * vec3(0,0.005,0.005);

		sd=abs(sd)-0.001;

		float wave = sin(pp.x+tt)*0.5;

		vec3 col;

		float m = smoothstep(-2. + wave, 1. + wave, pp.y);

		col = mix(vec3(0.3,0.3,1.), vec3(0.2,0.65,1.) ,m);

		if(sd<0.001)
		{
			oc=col;
			io=cos(tt*0.1+p.x+p.y+p.z)*0.5+0.5;
			oa=-0.1 + pow(-(pp.y-8.)*0.05,1.5);
			ss=vec3(0);
		  vb=vec3(1.,8,2.5);
			ec=2;
		}
		return sd;
}

void tr(){vb.x=0.;cd=0.;for(float i=0.;i<512.;i++){mp(ro+rd*cd);cd+=sd;td+=sd;if(sd<0.0001||cd>128.)break;}}
void nm(){mat3 k=mat3(cp,cp,cp)-mat3(.001);cn=normalize(mp(cp)-vec3(mp(k[0]),mp(k[1]),mp(k[2])));}

void px()
{
  cc=vec3(0.5,0.5,0.8)+length(pow(abs(rd+vec3(0,0.5,0)),vec3(3)))*0.3+gl;


  vec3 l=vec3(0.9,0.7,0.5);
  if(cd>128.){oa=1.;return;}
  float df=clamp(length(cn*l),0.,1.);
  vec3 fr=pow(1.-df,3.)*mix(cc,vec3(0.4),0.5);
	float sp=(1.-length(cross(cr,cn*l)))*0.2;
	float ao=min(mp(cp+cn*0.3)-0.3,0.3)*0.5;
  cc=mix((oc*(df+fr+ss)+fr+sp+ao+gl),oc,vb.x);
}

void render(vec2 frag, vec2 res, float time, out vec4 col)
{
	tt=mod(time, 260.);
  uv=vec2(frag.x/res.x,frag.y/res.y);
  uv-=0.5;uv/=vec2(res.y/res.x,1);
  ro=vec3(0,0,-12);rd=normalize(vec3(uv,1));

	for(int i=0;i<20;i++)
  {
		tr();cp=ro+rd*cd;
    nm();ro=cp-cn*0.01;
    cr=refract(rd,cn,int_mod(i,2)==0?1./io:io);
    if(length(cr)==0.&&es<=0){cr=reflect(rd,cn);es=ec;}
    if(int_mod(int_max(es,0),3)==0&&cd<128.)rd=cr;es--;
		if(vb.x>0.&&int_mod(i,2)==1)oa=pow(clamp(cd/vb.y,0.,1.),vb.z);
		px();fc=fc+vec4(cc*oa,oa)*(1.-fc.a);
		if((fc.a>=1.||cd>128.))break;
  }
  col = fc/fc.a;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    render(fragCoord.xy,iResolution.xy,iTime,fragColor);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

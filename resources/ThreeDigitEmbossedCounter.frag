/*
 * Original shader from: https://www.shadertoy.com/view/fdccR4
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

const float PI = 3.14159265359;
float seg2(vec2 p, float w2)
{
	float w = 0.25;
	return 0.5+(atan(p.y,p.x-w)-atan(p.y,p.x+w))*0.55;
}
vec3 digit(vec2 p, int n)
{
	vec3 col = vec3(0);
	float w = 0.25;
	float mx = 0.0;
	float my = 0.0;
	vec3 segcol = vec3(1.0);
	// middle seg
	if (n==2 ||n==3||n==4||n==5||n==6||n==8||n==9) col += segcol*seg2(p, w);
	// upper seg
	if (n==0||n==2 ||n==3||n==5||n==6||n==7||n==8||n==9) col += segcol*seg2(p-vec2(0,0.5), w);
	// lower seg
	if (n==0||n==2 ||n==3||n==5||n==6||n==8||n==9) col += segcol*seg2(p-vec2(0,-0.5), w);

	// left seg up
	if (n==0||n==4||n==5||n==6||n==8||n==9) col += segcol*seg2(p.yx-vec2(0.25,-0.25), w*1.0);
	// left seg down
	if (n==0||n==2||n==6||n==8) col += segcol*seg2(p.yx-vec2(-0.25,-0.25), w*1.0);


	// right seg up
	if (n==0||n==1||n==2||n==3||n==4||n==7||n==8||n==9) col += segcol*seg2(p.yx-vec2(0.25,0.25), w*1.0);
	// right seg down
	if (n==0||n==1||n==3||n==4||n==5||n==6||n==7||n==8||n==9) col += segcol*seg2(p.yx-vec2(-0.25,0.25), w*1.0);

	return col*0.3;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = 2.0*( fragCoord.xy / iResolution.xy )-1.0;

	p.x *= iResolution.x/iResolution.y;
	vec3 col = vec3(0);

	vec3 segcol = vec3(0.5,0.8,1.0);
	int n = int(mod(iTime*10.0, 1000.0));

	col += segcol*digit(p-vec2(-0.75,0.0), n/100);
	col += segcol*digit(p-vec2(+0.0,0.0),  int(mod(float(n/10), 10.0)));
	col += segcol*digit(p-vec2(+0.75,0.0), int(mod(float(n), 10.0)));
	col *= 0.3;
	col += vec3(0.3);
	col *= clamp(vec3(1)-vec3(1)*length(0.125*p.xy), 0.0, 1.0);
	fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
float ratio = resolution.x/resolution.y;

float pi = 3.14159265;
float deg = 160.0;
float thetaa = pi*deg/180.0;
float theta = thetaa+time/25.;
float theta2 = theta+pi*.3333-time/12.+.4;
float theta3 = theta+pi*.6666-time/16.;
float cut = 0.8135;
int num = 50;

float t=time/8.0;

void main( void ) {

	vec2 p = ( gl_FragCoord.xy / resolution.xy )*vec2(2.0,2.0/ratio) - vec2(1.0,1.0/ratio);
	theta += t;

	vec2 pr = vec2(p.x*cos(theta) - p.y*sin(theta), p.y*cos(theta) + p.x*sin(theta));
	vec2 pr2 = vec2(p.x*cos(theta2) - p.y*sin(theta2), p.y*cos(theta2) + p.x*sin(theta2));
	vec2 pr3 = vec2(p.x*cos(theta3) - p.y*sin(theta3), p.y*cos(theta3) + p.x*sin(theta3));
	vec2 rnd = vec2(0.,0.);
	vec3 c1 = vec3(0.0);
	vec3 c2 = vec3(0.0);

	for(int i = 1; i < 160; i++){
		rnd = vec2(sin(float(i)/.126273),sin(float(i)*.8141+time/3.));
		c1.r += smoothstep(cut, .995,(1.0-length(pr-rnd)));
		rnd = vec2(sin(float(i)/.193159),sin(float(i)*.7141+time/10.));
		c1.g += smoothstep(cut, .995,(1.0-length(pr2-rnd)));
		rnd = vec2(sin(float(i)/.231586),sin(float(i)*.4341+time/19.));
		c1.b += smoothstep(cut, .995,(1.0-length(pr3-rnd)));

		//for(int i = 0; i < 12; i++){
		//c1.r = sin(float(i)*30.);
		}

	//c1.r = smoothstep(.7, .95, 1.0-sin(pr.x*30.0)*sin(pr.y*50.0))*1.0;
	//c1.g = smoothstep(.7, .95, 1.0-sin(pr2.x*70.0)*sin(pr2.y*70.0))*0.9;
	//c1.b = smoothstep(.7, .95, 1.0-sin(pr3.x*20.0)*sin(pr3.y*20.0))*1.0;


	gl_FragColor = vec4( 1.*c1.r, 1.*c1.g, 1.*c1.b, 1.0 );

}

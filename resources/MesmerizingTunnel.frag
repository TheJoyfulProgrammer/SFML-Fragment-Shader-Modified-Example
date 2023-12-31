#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {
	vec2 pos1 = gl_FragCoord.xy / resolution.x - vec2(0.5, resolution.y / resolution.x / 2.0);
	float l1 = length(pos1);
	float l2 = step(0.5, fract(1.0 / l1 + time / 0.8));
	float a = step(0.5, fract(0.1 * sin(20. * l1 + time * 4.) / l1 + atan(pos1.x, pos1.y) * 3.));
	
	if(a != l2 && l1 > 0.05){
		gl_FragColor=vec4(1.0, 1.0, 1.0, 1.0);
	}
}
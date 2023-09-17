#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float tau = atan(1.0) * 8.0;
vec3 hue(float x)
{
	return clamp(2.0 * cos(vec3(tau * x) + (tau * vec3(0,2,1) / 3.0)),-1.0, 1.0) * 0.5 + 0.5;
}

void main( void ) {

	//vec2 position = ( gl_FragCoord.xy / resolution.xy ) + mouse / 4.0;

	float color = 0.0;
	color += length((gl_FragCoord.xy - resolution.xy * 0.5) * 0.003);

	gl_FragColor = vec4( hue(mod( color - time * 0.5 , 1.)), 1.0 );
}

#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec3 hue2rgb(float hue) {
    return clamp(abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

void main( void ) {

	vec2 position = (gl_FragCoord.xy / resolution.xy);

	float color = 0.0;

	color += fract(cos(position.x * 12.5)+time);
	color += fract(sin(position.y * 12.5)+time);


	gl_FragColor = vec4(hue2rgb(color), 1.0);

}

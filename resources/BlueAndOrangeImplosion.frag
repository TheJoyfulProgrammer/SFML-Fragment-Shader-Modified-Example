#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main( void ) {

/// vec2(2.0, 2.0)

	//vec2 p = (((gl_FragCoord.xy / (resolution.xy / 2))) + vec2(0.,-.0)) * (cos(time) + 2.) * 1.4;
	//vec2 p = (vec2(gl_FragCoord.x - resolution.x / 2, gl_FragCoord.y - resolution.y / 2) + vec2(400.,-300.0)) * (cos(time) + 2.) * 1.4;
	vec2 p = (vec2(gl_FragCoord.x, gl_FragCoord.y) - vec2(resolution.x / 2, resolution.y / 2)) * (cos(time) + 2.) * 1.4;
	//vec2 p = vec2(gl_FragCoord.x, gl_FragCoord.y) * (cos(time) + 2.) * 1.4;
	//p.y = -p.y;
	float a = atan(p.x, p.y);
	float r = log(length(vec2(p.x + p.y, p.x - p.y)));
	float c = (sin(time * 0.8 + a - cos(a * 15.0 + sin(r * 3. -a * 4. + time * 7.)) / r));
	c *= cos(r * sin(time / 10.) * 3.2);
	gl_FragColor = vec4(c * 0.95,c * c * 0.75, - c * .6, 1.0) * 1.3;

}
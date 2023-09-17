precision highp float;

uniform float time;
uniform vec2 resolution;

void main() {
  vec2 p = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
  p.x *= resolution.x / resolution.y;
  float a = atan(p.y, p.x);
  float r = length(p);
  vec3 color = vec3(0.5 + 0.5 * cos(10.0 * r - time), 0.5 + 0.5 * sin(a + time), 0.5 + 0.5 * sin(3.0 * r + 3.0 * time));
  gl_FragColor = vec4(color, 1.0);
}

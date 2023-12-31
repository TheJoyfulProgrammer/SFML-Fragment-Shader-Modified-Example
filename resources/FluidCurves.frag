#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;

const float Pi = 3.1;
uniform vec2 mouse;

const int   complexity      = 32;    // More points of color.
const float mouse_factor    = 56.0;  // Makes it more/less jumpy.
const float mouse_offset    = 0.0;   // Drives complexity in the amount of curls/cuves.  Zero is a single whirlpool.
const float fluid_speed     = 108.0;  // Drives speed, higher number will make it slower.
const float color_intensity = 0.8;

void main()
{
  vec2 p=(2.0*gl_FragCoord.xy-resolution)/max(resolution.x,resolution.y);
  p *= 4.; p /= dot( p, p );  // �ndrom3da tweak
  #define time time*16.
  for(int i=1;i<complexity;i++)
  {
    vec2 newp=p + time*0.001;
    newp.x+=0.6/float(i)*sin(float(i)*p.y+time/fluid_speed+0.3*float(i)) + 0.5; // + mouse.y/mouse_factor+mouse_offset;
    newp.y+=0.6/float(i)*sin(float(i)*p.x+time/fluid_speed+0.3*float(i+10)) - 0.5; // - mouse.x/mouse_factor+mouse_offset;
    p=newp;
  }

  // Change the mix ratio to increase the marble feel and change the white color to a light blue color
  float mix_ratio = 0.4 * sin(3.0 * p.x) + 0.6;
  vec3 col = mix(vec3(0.0, 0.0, 1.0), vec3(0.6, 0.9, 1.0), mix_ratio);
  gl_FragColor = vec4(col, 1.0);
}

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

float iGlobalTime = -time * 1.0;
vec2 iResolution = resolution;

// LICENSE: CC0
// *-SA-NC considered to be cancerous and non-free

const float PI = 3.14159;

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main()
{
    vec2 uv = gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0;
    uv.x *= iResolution.x/iResolution.y;

    float r = length(uv)*mouse.y;
    float a = atan(uv.y, uv.x)*1.0;
    a += iGlobalTime;
    a += log(r)*(10.0*mouse.x);

    vec4 color = vec4(hsv2rgb(vec3(cos(a), 1., 1.)), 1.0);

    gl_FragColor = color;
}

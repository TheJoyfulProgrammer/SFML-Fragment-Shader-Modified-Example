// * gigatron hsvtst;
#ifdef GL_ES
precision mediump float;
#endif
#extension GL_OES_standard_derivatives : enable
#extension GL_OES_standard_derivatives : enable

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
float t= time;

vec3 hsv2rgb(vec3 c) {

    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
void main()
{
    vec2 p = gl_FragCoord.xy / resolution.xy ;
    p = p-vec2(1.0,-0.15);


    p =  0.1-floor(p*32.0)/32.0;
    float st= sin(t)*0.8;
	  st =time*0.4; // override;st


    gl_FragColor = vec4(  /* horizotal */
                        hsv2rgb(vec3(  p.x*sin(64.*fract( p.y) )+st ,1.0, 1.0)), 1.0);
}

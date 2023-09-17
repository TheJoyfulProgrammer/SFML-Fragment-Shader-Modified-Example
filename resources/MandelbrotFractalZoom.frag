/*
 * Original shader from: https://www.shadertoy.com/view/7sGcz1
 */

#extension GL_OES_standard_derivatives : enable

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
// color palettes from 'Palettes' by iq

//filtered cosine also courtesy of iq ('Bandlimited Synthesis 2')

#define FLTR
vec3 fcos( vec3 x )

{
    #ifdef FLTR
    vec3 w = fwidth(x);
    return cos(x) * sin(0.5*w)/(0.5*w);
    #else
    return cos(x);
    #endif
}


vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*fcos( 6.28318*(c*t+d) );
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = vec2(-.745,.186) + 3.*(fragCoord/iResolution.y-.5)*pow(.01,1.+cos(.2*(iTime+22.)));
    vec2 z = vec2(0.0);
    float dmin_dt = 1e5;
    float dmin_ln = 1e5;
    for (int i = 0; i < 256; i++) {
        z = uv + mat2(z,-z.y,z.x) * z;
        dmin_dt = min(dmin_dt, length(z));
        dmin_ln = min(dmin_ln,
            min(abs(z.x + 4.0 * sin(0.5 * z.x)), abs(z.y + 4.0 * cos(0.5 * z.x))));
    }
    vec3 col_ln = pal( dmin_dt * 4.0 ,
        vec3(0.5),
        vec3(0.5),
        vec3(1.0),
        vec3(0.0,0.10,0.20) );
    vec3 col_dt = pal( dmin_ln * 8.0,
        vec3(0.5),
        vec3(0.5),
        vec3(1.0,1.0,0.5),
        vec3(0.8,0.90,0.30) );
    fragColor = vec4((col_ln + col_dt) * 0.50, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

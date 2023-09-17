/*
 * Original shader from: https://www.shadertoy.com/view/fdccR8
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
// Grids all the way down by Kristian Sivonen (ruojake)
// CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)

float hash12(vec2 p)
{
    vec3 q = fract(p.xyy * vec3(5717./2048., 6451./4096., 1249./512.) + vec3(.5, .125, .25));
    q += dot(q.xz, p.yx) * .0156253;
    return fract(dot(q + p.y * .38325, p.xyx / 127.) + dot(q, vec3(2., .25, .125-p.x)) + .4);
}

mat2 rot(float a)
{
    float s = sin(a),
          c = cos(a);

    return mat2(c,-s,s,c);
}

vec3 color(float v)
{
    v = fract(v * 13.1257) * 7.;
    vec3 c = normalize(vec3(1, 1, 1));
    c.xy *= rot(v);
    c.yz *= rot(v * 2.);
    return mix(vec3(c.g), c, 1. + fract(v * 11.) * 2.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord - iResolution.xy * .5) / iResolution.y;

    float res = 0.;
    float o = 1.;
    float s = 1.;
    mat2 r = rot(2.);

    for(int i = 0; i < 5; ++i)
    {
        o *= s;
        uv *= r;
        uv += iTime * .25;
        vec2 _uv = uv * rot(res * 8.);
        float fw = fwidth(length(_uv));
        s = min(s, .75 + min(fract(_uv.x), fract(_uv.y)) / fw * .05);
        vec2 fuv = 1. - abs(fract(_uv) * 2. - 1.);
        o = min(o, min(fuv.x, fuv.y) / fw * .75);
        res = hash12(floor(_uv));
        uv = uv * 2. + 5.;
    }

    vec3 col = clamp(mix(color(res) * res * 2., vec3(res), res), vec3(0), vec3(1)) * o;

    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

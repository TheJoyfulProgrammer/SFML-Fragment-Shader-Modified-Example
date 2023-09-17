/*
 * Original shader from: https://www.shadertoy.com/view/7djBDm
 */

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
//change these constants to get different patterns!
#define c1 vec3(1.,0.5,1.5)

float triangle_wave(float a){
    return abs(fract(a)-.5);
    //return abs(fract((a+c1.xy)*scale+iTime/500.)-.5); //morphing
}

vec2 triangle_wave(vec2 a,float scale){
    return abs(fract((a+c1.xy)*scale)-.5);
    //return abs(fract((a+c1.xy)*scale+iTime/500.)-.5); //morphing
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    fragColor = vec4(0.0);
    vec3 col = vec3(0.);
    float t1 = 8.;
    vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
    uv += vec2(iTime/2.0,iTime/3.0)/t1/8.0;
    float scale = c1.z;
    float offset = 0.;
    //float offset1 = iTime/1000.;
    vec2 t2 = vec2(0.);
        vec2 t3 = vec2(0.);
        for(int k = 0; k < 60; k++){
        //float scale = scale + col.x/8.;
        //float scale = scale-col.x/16.;
            //float scale = scale + col.x/16.;

            //uv /= -scale-col.x;

            //uv -= offset + (t2.yx)/(1.+(col.x+col.y+col.z)/3.);
            uv -= offset - (t2.yx);

            //uv += iTime/1000.-(t2.yx)/(scale);


            //uv -= (t2.yx)/(scale+t3);
            //uv -= (t2.yx)/(scale+col.x);
            t2 = triangle_wave(uv.yx+.5,scale);
            //t2 = triangle_wave(uv.yx+.5+float(i),scale);

            t3 = triangle_wave(uv,scale);

            uv.yx = (t3-t2);
            //offset += offset1;
            //offset += iTime/400.+ col.x/(scale-col.x);
        col.x = 1.-abs(uv.y+uv.x+col.x);
        col = col.yzx;


        uv /= 4.5-(triangle_wave(uv.x+uv.y+iTime/4.));
        //uv /= (t2.y-t2.x+1.);
      }
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

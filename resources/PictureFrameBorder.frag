/*
 * Original shader from: https://www.shadertoy.com/view/flcBz7
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
const vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
#define fmod(x,y) mod(floor(x),y)
vec2 triangle_wave(vec2 a){
    vec2 a2 =  //change this constant to get other interesting patterns
        vec2(1.,.5)
        //vec2(1.5,0.)
        //vec2(0.,2.)
    ,

    a1 = a+a2;
    //a1 *= (1. + fmod(abs(a1/2.),2.));
    //a1 += (distance(floor(a1),round(a1)))/1.5;

    return abs(fract((a1)*(a2.x+a2.y))-.5);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    fragColor = vec4(0.0);
    vec3 col = vec3(0.);
    float t1 = 16.;
    vec2 uv = (fragCoord)/iResolution.y/t1/2.0;
    uv.x += iTime/t1/12.0;
    if(iMouse.z>.5)
    uv = uv.xy + iMouse.xy / iResolution.xy/t1;
    float scale = 1.5;
    vec2 t2 = vec2(0.);
    for(int k = 0; k < 12; k++){
        //uv += pow(floor(uv.x*2.),3.)/2.;

        //uv.x -= floor(uv.y*1.5)/1.5;
        //uv += floor(uv+vec2(1.,.5))/1.5;
        vec2 uv1 = uv;
        uv = (uv+t2)/scale;
        //uv += (distance(floor(uv),round(uv+.5)));

        //uv *= sign(uv1-uv1.yx);
        //uv *= sign(uv-uv.yx);

        //if(uv.y>uv.x) uv = uv.yx;
        t2 = triangle_wave(uv+.5);

        //uv += floor(uv.y-uv.x);
        uv = t2-triangle_wave(uv.yx);


        //uv.x += sign(uv.y-uv.x-.5)+.5;

        //another really interesting pattern
        //uv.x +=
            //floor(uv1.x)/1.5
            //.5
        //;

        //uv += dot(uv,uv); //makes another interesting pattern
        col.x =
            max(max(abs(t2.y-t2.x),abs(uv.y-uv.x))/3.,col.x)
            //max(max(fract(t2.y-t2.x+.5),fract(uv.y-uv.x+.5))/3.,col.x)
            //max(max(abs(t2.y-t2.x),abs(uv.y*sign(uv.x)-uv.x))/3.,col.x)
        ;
        col =
            abs(col-(1.-col.x));
            max(abs(col-(1.-col.x)),col/4.);

            //abs(col*col.yzx-(1.-col.x));
        //{uv=uv.yx;t2=t2.yx;}
    }
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

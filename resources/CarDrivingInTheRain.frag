/*
 * Original shader from: https://www.shadertoy.com/view/7llfRf
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
//Heading Home: https://www.shadertoy.com/view/tsdczN
//Render road, grass, cars and lightning

float hash(vec2 p)
{
 	return fract(cos(mod(p.x*314.+p.y*159.,899.))*2653.);
}
float value(vec2 p)
{
    vec2 f = floor(p);
    vec2 s = p-f;
    s *= s*(3.-s-s);
    const vec2 o = vec2(0,1);

 	return mix(mix(hash(f+o.xx),hash(f+o.yx),s.x),
               mix(hash(f+o.xy),hash(f+o.yy),s.x),s.y);
}
void mainImage(out vec4 color, in vec2 coord)
{
    vec2 u = (coord-.5*iResolution.xy)/iResolution.y;
    //Perspective skew
    u /= (1.-.4*u.y);
    //Rotate view
    float a = .01+.01*cos(iTime*.1);
    vec2 r = sqrt(vec2(1.-a,a));
    u *= mat2(r.x,-r.y,r.y,r);

    //Scroll speed
    vec2 S = vec2(iTime,0)*r*.2,
    //Curved coordinates
    c = u+S;
    c.y += (value(c/2.)-.5)*.2;

    //Hash for texturing
    float h1 = (value(c*16.)*.3+value(c*32.)+value(c*64.)+
                value(c*128.)+value(c*256.)+value(c*512.)*.7)/5.;

    //Offset for lighting
    vec2 o = vec2(value(c),value(-c));

    //Offset hash for bump lighting
    float h2 = (value(c*16.+o)*.3+value(c*32.+o)+value(c*64.+o)+
                value(c*128.+o)+value(c*256.+o)+value(c*512.+o)*.7)/5.;
    //Grass/road texture
	vec3 g = vec3(h1*h1);
    g *= 1.+.6*abs(value(c*4.)+value(c*8.)-1.);
    //Road lines
    float s = smoothstep(.008,.004,abs(abs(c.y)-.17))+
    smoothstep(.01,.006,abs(c.y))*smoothstep(.04,.038,abs(mod(c.x,.3)-.15));
    //Road
    float e = smoothstep(.215,.21,abs(c.y)+h1/5e1);
    //Blend road and grass
    g = mix(pow(g,vec3(1.2,1,1.5)),g*.4+.4*s,e);

    //Add car
    float p = mod(iTime*.8+cos(iTime*.7)*.4,5.)-3.;
    g *= .1+.9*step(.010,length(max(abs(c+.1-S-vec2(p+.02,0)*r)-vec2(.07,.04),0.)));
    g *= .2+.8*step(.001,length(max(abs(c+.1-S-vec2(p+.04,0)*r)-vec2(.01,.06),0.)));

    //Add car headlights
    vec3 l = max(u.x-p-pow(c.y+(u.x-p)*-.2+.07,2.)*20.,0.)*vec3(.8,.78,.66)/(20.*(p-u.x)*(p-u.x));
        l += max(u.x-p-pow(c.y+(u.x-p)*+.2+.13,2.)*20.,0.)*vec3(.8,.78,.66)/(20.*(p-u.x)*(p-u.x));

    //Tail light
    l += max(p-.16-u.x-pow(c.y+.1,2.)*8.,0.)*vec3(1,.2,.08)/(.05+50.*(p-.16-u.x)*(p-.16-u.x));

    //Hill shading
    l += .1*value(c*mat2(.3,2.7,-6,1))+.1*smoothstep(.4,.0,abs(c.y));

    //Add lightning
    float b = pow(value(c*.4+iTime)*value(c*.6-iTime)*cos(iTime*4.)*cos(iTime*5.),4.);
    l += clamp(mix(h1,h2,9.-4.*e)*b,0.,1.)*vec3(6,9,15);

    //Add rain
    vec3 col = mix(g*l,vec3(.2,.2,.3),.1*pow(value(((c-S)/(c.y+1.5)/.8+S)*mat2(1,8,-190,9)+iTime*8.),3.));

    color = vec4(max(col*sqrt(col)*2e1,0.),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

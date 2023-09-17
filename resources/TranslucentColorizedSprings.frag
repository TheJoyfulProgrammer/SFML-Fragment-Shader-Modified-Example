/*
 * Original shader from: https://www.shadertoy.com/view/7scBD7
 */

#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution vec3(resolution,1.)

// --------[ Original ShaderToy begins here ]---------- //
#define R(p,a,r) mix(a*dot(p,a),p,cos(r))+sin(r)*cross(p,a)
#define H(h) cos((h)*6.3+vec3(0,23,21))*.5+.5

void mainImage(out vec4 O, vec2 C)
{
    O=vec4(0);
    vec3 p,u,r=iResolution,d=normalize(vec3(C-.5*r.xy,r.y));
    float e,g=0.,t=iTime,z,f;
    for(float i=0.;i<80.;i++){
        p=d*g,
        p.z-=1.5,
        p=R(p,normalize(H(t*.02)-.5),t*.1);
        z=p.z+t;
        u=floor((p-2.)/4.);
        u=sin(9.*(2.6*u+3.*u.yzx+1e-3));
        f=dot(u,u.yxz);
        p=(mod(p-2.,4.)-2.);
        p.z=mod(p.z+atan(p.y,p.x)/acos(-1.)*.2,.4)-.2;
        g+=e=abs(length(vec2(length(p.xy)-.4,p.z))-.04)+.01*(sin(z+f+t)*.5+.5);
        O.xyz+=mix(vec3(1),H(z),.6)*.05/exp(.3*i*i*e);
    }
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.;
}

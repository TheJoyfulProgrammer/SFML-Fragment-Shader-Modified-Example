/*
 * Original shader from: https://www.shadertoy.com/view/NdKBRt
 */

#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
float iTime = 0.;
#define iResolution resolution

// Protect glslsandbox uniform names
#define time        stemu_time

// --------[ Original ShaderToy begins here ]---------- //
// by @etiennejcb

#define PI 3.141592
#define duration 2.3

float time = 0.;
float boxSize = 0.;
float spacing = 2.25;
float numberOfFlips = 4.;

// box sdf with bevel
float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0)-0.007;
}

// 2D Rotation matrix
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c,-s,s,c); }

// easing function, may come from @patakk
float ease(float p, float g) {
  if (p < 0.5)
    return 0.5 * pow(2.*p, g);
  else
    return 1. - 0.5 * pow(2.*(1. - p), g);
}

vec3 flipPosition(vec3 q,float floatState,vec2 qIndices)
{
    float param = floatState/numberOfFlips;
    param = mod(param+12345.,1.);

    vec2 qIndices2 = boxSize*qIndices;

    float delay = 0.015*max(0.,length(qIndices2)-0.15) + 0.2*pow(length(qIndices2),0.3+0.3*pow(param,0.3))*pow(param,1.3);
    delay *= 1.2;

    float delayedP = max(0.,param-delay);
    floatState = min(1.7*numberOfFlips*delayedP,numberOfFlips);

    float ii = mod(qIndices.x,2.0);
    float jj = mod(qIndices.y,2.0);

    float easing = 2.5;

    if(floatState<=1.)
    {
        float flip1 = ease(clamp(floatState-0.,0.,1.),easing);
        if(ii==0.)
            q.xy *= rot(PI*flip1);

        if(ii==1.)
            q.xy *= rot(-PI*flip1);

    }

    else if(floatState<=2.)
    {
        float flip2 = ease(clamp(floatState-1.,0.,1.),easing);
        q.xy *= rot(-PI*flip2);
    }
    else if(floatState<=3.)
    {
        float flip3 = ease(clamp(floatState-2.,0.,1.),easing);
        if(ii==0. && jj==0.)
            q.xy *= rot(PI*flip3);

        if(ii==1. && jj==0.)
            q.xy *= rot(-PI*flip3);

        if(ii==0. && jj==1.)
            q.zy *= rot(PI*flip3);

        if(ii==1. && jj==1.)
            q.zy *= rot(-PI*flip3);
    }
    else if(floatState<=4.)
    {
        float flip4 = ease(clamp(floatState-3.,0.,1.),easing);
        if(ii==0.)
            q.zy *= rot(PI*flip4);

        if(ii==1.)
            q.zy *= rot(-PI*flip4);

    }

    return q;
}

struct MapData
{
    float typeId;
    float dist;
    vec2 uv;
    vec2 cubePos;
};


MapData map(vec3 p) {
    MapData res;

    res.dist = 1000.;

    p.yz *= rot(atan(1./sqrt(2.)));
    p.xz *= rot(0.25*PI);

    vec3 q = p;

    float repetitionDistance = spacing*boxSize;
    // very minor optim, this is constant later on
    vec2 pxz0 = mod(p.xz + repetitionDistance*.5, repetitionDistance) - repetitionDistance*.5;

    // min distance with neighbours
    for(float i=-1.;i<=1.;i+=1.)
    {
        for(float j=-1.;j<=1.;j+=1.)
        {
            // possible optimization
            //if(abs(i)+abs(j)>=2.) continue;

            // offset for neighbour location
            vec3 correctionOffset = vec3(spacing*boxSize*i,0.,spacing*boxSize*j);

            p = vec3(pxz0.x,q.y,pxz0.y);

            // block indices
            vec2 qi = floor((q.xz + correctionOffset.xz +0.5*vec2(repetitionDistance))/repetitionDistance);

            p = flipPosition(p - correctionOffset, time, qi);

            float boxDistance = sdBox(p,vec3(boxSize,boxSize*0.5,boxSize));

            res.dist = min(res.dist,boxDistance);

            if(i==0.&&j==0.)
            {
                res.typeId = 1.;
                res.uv = p.xz;
                res.cubePos = qi;
            }
        }
    }

    return res;
}

// NuSan
// https://www.shadertoy.com/view/3sBGzV
vec3 getNormal(vec3 p) {
	vec2 off=vec2(0.001,0);
	return normalize(map(p).dist-vec3(map(p-off.xyy).dist, map(p-off.yxy).dist, map(p-off.yyx).dist));
}


// found in tdhooper shader : https://www.shadertoy.com/view/fdSGRy
vec3 aces(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	vec2 q = fragCoord.xy / iResolution.xy;
	vec2 uv = (q - .5) * iResolution.xx / iResolution.yx;

    time = mod(iTime/duration,numberOfFlips);
    boxSize = 0.27;

	vec3 ro=vec3(uv*4.,-10.), rd=vec3(0.,0.0,1.);

	vec3 p;
	MapData res;
	float ri, t = 0.;
    bool hit = false;
    vec3 nrml;

    // raymarching
	for (float i = 0.; i < 1.; i += 1.0/44.0) {
		ri = i;
		p = ro + rd*t;
		res = map(p);
		if (res.dist<.001)
        {
            hit = true;
            nrml = getNormal(p);
            break;
        }
        t += res.dist*0.98;
	}

    vec2 uuvv = res.uv;

    // cube edges factor
    float squareDistance = max(abs(uuvv.x),abs(uuvv.y));
    float f_edges = 0.1+1.4*smoothstep(0.96*boxSize,0.99*boxSize,squareDistance);

    // factor for stripes on cube faces
    float a = 1.0;
    float b = 0.6;
    float v = clamp((mod(4.0*max(abs(uuvv.x),abs(uuvv.y))/boxSize,a)-b)/(a-b),0.,1.);
    float f_stripes = 1.5*sin(PI*v);

    // color info with number of raymarching iterations, distance and previous factors
    float mixer = pow(ri,1.7)/(t*t)*1600.0*max(f_edges,f_stripes);

    // background color (effects will be applied on it later in the code)
    vec3 col = vec3(0.6,0.9,0.9) - vec3(length(uv)*0.6);

    // color experiments ...

    if(hit)
    {
        vec3 col1 = vec3(0.5)+0.5*nrml;
        vec3 col2 = col1.zxy;
        col = mix(col1,col2,mixer);
    }

    vec3 col0 = col;

    col = col.yxz;

    // (https://www.shadertoy.com/view/fdSGRy)
    vec3 uGain = vec3(1.8);
    vec3 uLift = vec3(.002,-.003,.007)/3.;
    vec3 uOffset = vec3(.00,.00,.00);
    vec3 uGamma = vec3(-.25);
    col = pow(max(vec3(0.0), col * (1.0 + uGain - uLift) + uLift + uOffset), max(vec3(0.0), 1.0 - uGamma));
    col = pow( col, vec3(1./2.2) );
    col = aces(col);

    col = mix(col,col0,0.15);

	fragColor = vec4(col.zyx, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

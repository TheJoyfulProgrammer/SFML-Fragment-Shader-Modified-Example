/*
 * Original shader from: https://www.shadertoy.com/view/7sKfDW
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
struct Surface {
  float sd;
  vec3 color;
};
const float ShootTimeLoop = 3.*3.1416;
const float ShootTimeTrigger = 2.*3.1416;
const float ShootDuration = 2.55;
float shootiTime = 0.;
float startShootTime = 0.;

Surface minWithColor(Surface obj1, Surface obj2) {
  if (obj2.sd < obj1.sd) return obj2; // The sd component of the struct holds the "signed distance" value
  return obj1;
}

Surface maxWithColor(Surface obj1, Surface obj2) {
  if (obj2.sd > obj1.sd) return obj2; // The sd component of the struct holds the "signed distance" value
  return obj1;
}

Surface sminWithColor(Surface obj1, Surface obj2, float k, float k2) {
  float h = clamp(0.5 + 0.5*(obj1.sd-obj2.sd)/k, 0.0, 1.0);
  return Surface(mix(obj1.sd, obj2.sd, h) - k*h*(1.0-h),mix(obj1.color, obj2.color, h) - vec3(k2*h*(1.0-h)));
  //vec3 mincolor = obj2.sd < obj1.sd ? obj2.color : obj1.color;
  //return Surface(mix(obj1.sd, obj2.sd, h) - k*h*(1.0-h),mincolor);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5*(a-b)/k, 0.0, 1.0);
    return mix(a, b, h) - k*h*(1.0-h);
}


vec3 rotate(vec3 r, vec3 p)
{
    mat3 roll = mat3(vec3(1.0, 0.0, 0.0),
                   vec3(0.0,cos(r.z),sin(r.z)),
                   vec3(0.0,-sin(r.z),cos(r.z))
    );
    mat3 pitch = mat3(vec3(cos(r.y), 0.0, -sin(r.y)),
                   vec3(0.0,1.0,0.0),
                   vec3(sin(r.y),0.0,cos(r.y))
    );
    mat3 yaw = mat3(vec3(cos(r.x),sin(r.x), 0.0),
                   vec3(-sin(r.x),cos(r.x),0.0),
                   vec3(0.0,0.0,1.0)
    );

    return yaw*pitch*roll*p;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float sdPlane( vec3 p, vec3 n, float h )
{
  // n must be normalized
  return dot(p,n) + h;
}

float sdCappedCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(h,r);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

vec3 parabolicMovement(vec3 origin, vec3 v0)
{
    float t = shootiTime-startShootTime;
    return vec3(
    origin.x+(v0.x*t),
    origin.y+(v0.y*t)+(0.5*9.8*t*t),
    origin.z+(v0.z*t)
    );
}

Surface map(vec3 pos) {
    //Ball
    vec3 ballmovement =  rotate(vec3(0.,0.,2.*iTime),pos + vec3(sin(iTime),-abs(sin(3.*iTime)),0.));
    if(shootiTime>ShootTimeTrigger && shootiTime<ShootTimeTrigger+ShootDuration)
    {
        ballmovement =  rotate(vec3(0.,0.,-5.*iTime),pos+parabolicMovement(vec3(0.,0.,0.),vec3(0.,-13.,3.8)));
    }
    //vec3 ballmovement = pos+vec3(0.,0.,0.);
    Surface s1 = Surface(sdSphere(ballmovement, .4),vec3(0.98, 0.51, 0.1));
    Surface toruscut = Surface(sdTorus(ballmovement,vec2(0.4,0.02)),vec3(0., 0., 0.));
    toruscut = minWithColor(toruscut,Surface(sdTorus(rotate(vec3(90.,0.,0.),ballmovement),vec2(0.4,0.02)),vec3(0., 0., 0.)));
    toruscut = minWithColor(toruscut,Surface(sdTorus(rotate(vec3(-90.,0.,0.),ballmovement),vec2(0.4,0.02)),vec3(0., 0., 0.)));
    s1 = maxWithColor(s1,Surface(-toruscut.sd,toruscut.color));
    //floor
    vec3 outsidefield = vec3(step(abs(pos).x,5.)*step(abs(pos).z,10.));
    vec3 insidefield = vec3(step(abs(pos).x,4.5)*step(abs(pos).z,9.5));
    vec3 line = outsidefield - insidefield;
    line += vec3(step(abs(pos).x,5.)*step(abs(pos).z,.1));
    line += 1.-vec3(step(.1,abs(length(pos)-2.)));
    line += vec3(step(length(pos),.3));
    line = clamp(line,0.,1.);
    vec3 floorcolor = (line*vec3(2.,2.,2.)) +
                      (insidefield*vec3(0.,0.5,.5*(sin(3.*iTime)+1.5))) +
                      ((1.-outsidefield)*mix(vec3(.7, 0.1,0.1),vec3(.5, 0.1,0.1),clamp(-pos.z*.05,0.,1.)));
    Surface p = Surface(sdPlane(pos, normalize(vec3(0.,1.,0
    )),0.2),floorcolor);
    //basket
    vec3 tableropos = (pos+vec3(0.,-4.,9.8))/vec3(1.5,1.,1.);//normalizing x
    vec3 tablerored = 1.-vec3(step(abs(tableropos).x,.9)*step(abs(tableropos).y,.9));
    vec3 tablerolineoffset = vec3(0.,0.1,0.);
    vec3 tablerooutside = vec3(step(abs(tableropos+tablerolineoffset).x,.4)*step(abs(tableropos+tablerolineoffset).y,.4));
    vec3 tableroinside = vec3(step(abs(tableropos+tablerolineoffset).x,.3)*step(abs(tableropos+tablerolineoffset).y,.3));
    vec3 tableroline = tablerooutside - tableroinside;
    tablerored += tableroline;
    vec3 tablerowhite = 1.-tablerored;

    vec3 tablerocolor = tablerored * vec3(1.,0.,0.) + tablerowhite* vec3(2.,2.,2.);
    Surface c1 = Surface(sdCappedCylinder(pos+vec3(0.,0.,10.),.2,4.),vec3(2.,2.,0.));
    c1 = minWithColor(c1,Surface(sdBox(pos+vec3(0.,-4.,9.8
    ),vec3(1.6,1.1,0.1)),/*vec3(3.,3.,3.)*/tablerocolor));
    c1 = minWithColor(c1,Surface(sdTorus(pos+vec3(0.,-3.5,9
    ),vec2(.7,0.06)),vec3(1.,0.,0.)));


    return minWithColor(c1,minWithColor(s1,p));
    //return sminWithColor(p,s1,.1, 1.);
}

vec3 calcNormal(vec3 pos) {
    vec2 eps = vec2(0.0001, 0.0);
    Surface s = map(pos);
    float h = s.sd;
    return normalize(vec3(
        map(pos + eps.xyy).sd - h,
        map(pos + eps.yxy).sd - h,
        map(pos + eps.yyx).sd - h
    ));
}

vec3 getSky(vec2 uv)
{
    float atmosphere = sqrt(1.0-uv.y);
    vec3 skyColor = vec3(0.2,0.4,0.8);
    return mix(skyColor,vec3(1.0),atmosphere / 1.3);
}

Surface rayMarch(vec3 co, vec3 rd)
{
    float tot_dist = 0.;
    Surface s;
    for (int t = 0; t < 512; ++t) {
        vec3 pos = co + tot_dist * rd;
        s = map(pos);
        float h = s.sd;
        tot_dist += h;
        if (h < 0.0001) {
            break;
        }
    }
    s.sd = tot_dist;
    return s;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0.);

    vec3 co = vec3(sin(iTime+0.5), .5,1.5);
    vec3 ct = vec3(0., 1., 0.);
    vec3 cam_ww = normalize(ct - co);

    shootiTime = mod(iTime,ShootTimeLoop);
    vec3 debug = vec3(clamp(5.*((shootiTime/ShootTimeTrigger)-1.),0.,1.));
    if(shootiTime>ShootTimeTrigger && shootiTime<ShootTimeTrigger+ShootDuration)
    {
        startShootTime = ShootTimeTrigger;
        co = mix(co,-parabolicMovement(vec3(0,-2.,-1.5),vec3(0.,-13.,3.8)),clamp(2.5*((shootiTime/ShootTimeTrigger)-1.),0.,1.));
        cam_ww =  mix(cam_ww,normalize(vec3(0.,-.5,-1.)),clamp(2.5*((shootiTime/ShootTimeTrigger)-1.),0.,1.));
    }


    vec3 cam_uu = normalize(cross(cam_ww, vec3(0., 1., 0.)));
    vec3 cam_vv = normalize(cross(cam_uu, cam_ww));

    vec3 rd = normalize(
        uv.x * cam_uu +
        uv.y * cam_vv +
        1.   * cam_ww
    );

    float maxRenderDistance = 1000.;

    Surface hitSurface = rayMarch(co,rd);
    vec3 skyColor = getSky(uv);
    if(hitSurface.sd<maxRenderDistance)//max render distance
    {
       vec3 color = hitSurface.color;
       vec3 pos = co + hitSurface.sd * rd;
       vec3 N = calcNormal(pos);
       vec3 R = reflect(rd, N);

        vec3 L = normalize(vec3( 0.5, -1,-0.5));

        float kA = 1.;
        vec3 iA = vec3(.01);
        vec3 cA = kA * iA;

        float kD = 1.;
        vec3 iD = vec3(0.7, 0.5, 0);
        vec3 cD = color*kD*vec3(clamp(dot(N, -L), 0.2, 1.));

        //disclaimer hard shadows no tengo muy claro lo que hago pero mola
        vec3 shadowOrigin = pos + N * 0.001 * 2.;
        Surface shadowHit = rayMarch(shadowOrigin, -L);
        if (shadowHit.sd<maxRenderDistance){
            cD = cD*vec3(0.5);
        }

        vec3 RL = reflect(L, N);
        vec3 V = -rd;
        float kS = .2;
        vec3 cS = kS*vec3(pow(clamp(dot(RL, V), 0., 1.), 300.0));

        float j = 0.01;
        float ao = clamp(map(pos + N*j).sd/j,0.,1.);

        col = vec3(ao) * (cA+cD+cS);

    }
    else
    {
        //col = texture(iChannel0, rd).rgb;
        col = skyColor;
    }


    float d = 0.3;
    vec3 fogcolor = vec3(.7,.7,.9);
    col = mix( col, skyColor, 1.0-exp( -0.0001*hitSurface.sd*hitSurface.sd*hitSurface.sd ) );
    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

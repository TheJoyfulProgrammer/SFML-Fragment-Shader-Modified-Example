/*
 * Original shader from: https://www.shadertoy.com/view/ss2Xz3
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

// Emulate a black texture
#define texture(s, uv) vec4(0.)

// --------[ Original ShaderToy begins here ]---------- //
/***************************************************************************************/
// Title: Bonneval-sur-Arc
// author: ocb
//
// No copyright
//
// The purpose of this shader is to create structures using grid with overlapping cells.
// Interconnections of randomly positionned objects create meta-structures, less
// geometrical and then, more natural or unexpected.
//
// I also tried myself with fake 3D. (windows, doors, inside lights).
//
// Mouse is usable to explore village.
// Push the mouse forward to go inside, explore narrow passages, hidden squares, secret corners.
// The aiming point is always the village center.
// No anti-collision functions. If you go thru the chalets, artifacts will appear.
// It's a limited tool, as the objective is not a game.
// Put back the mouse on left edge of the shader image to go back to auto-flight cam.
//
//
// Change the SEED at the first line of the code (line 37) to create new village.
//
//
// Thanks to:
// iq for the Sphere4 raycasting primitive used for the snowy roof.
// See iq's article and demo shader:
// https://www.shadertoy.com/view/3tj3DW
//
// Dave_Hoskins for the very good hash functions:
// https://www.shadertoy.com/view/4djSRW
//
/***************************************************************************************/



/* set any SEED (float) to create new village */
#define SEED 0.1

/* smaller chalets or bigger chalets */
//#define DEN >.8
#define DEN <1.2

// Max camera distance from center
#define CamDist 12.

// Max size of the grid - village
#define MaxRad 11.


#define PI 3.141592653589793
#define PIdiv2 1.57079632679489
#define TwoPI 6.283185307179586
#define INFINI 1000000.
//#define ti iTime
//#define ti iMouse.x/iResolution.x*200.

#define SKY 0
#define GND 1
#define BODY 2
#define ROOF 3
#define CEIL 4
#define BALCON 5
#define CHEM 6
#define TORCH 7
#define TOWER 8
#define STEEP 9
#define CHURCH 10
#define NEF 11

#define TOPSFC 2.5
#define maxCell 30

#define RVAL 1000.
#define TOP 1000.

#define ZERO 0

/*******************************************************/
/*                       Globals                       */
/*******************************************************/
int hitObj = SKY;

vec3 boxCtr = vec3(INFINI);
vec3 boxSze = vec3(0.);
float boxH = 0.;
mat2 boxRot = mat2(1,0,0,1);
vec2 boxCell = vec2(0);
float t = INFINI;
vec3 n = vec3(0,1,0);
/*******************************************************/
/*                         Basic                       */
/*******************************************************/
//Dave_Hoskins's hash functions

float H12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 H22(vec2 p)
{
    p += vec2(15.456,21.0985);
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx+33.33);
    return fract((p3.xx+p3.yz)*p3.zy);

}

vec3 H33(vec3 p3)
{
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);

}


vec3 dither(in vec3 p){
    return vec3(H33(floor(5000.*p))-.5);
}


/*******************************************************/
/*                 Raycast primitives                  */
/*******************************************************/

float gnd(float py, float ry, float h){
    float t = (h-py)/ry;
    if(t<0.) t = INFINI;
    return t;
}

// IQ's box function modified
vec4 iBox( in vec3 p, in vec3 ray, in vec3 box)
{
    // ray-box intersection in box space
    vec3 sg = sign(ray);
    vec3 t1 = -(p+sg*box)/ray;
    vec3 t2 = -(p-sg*box)/ray;

	float tN = max( max( t1.x, t1.y ), t1.z );
	float tF = min( min( t2.x, t2.y ), t2.z );

	if( tN > tF || tF <= 0. || tN <= 0.) return vec4(INFINI);

    vec3 nor = -sign(ray)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz);

    return vec4(nor,tN);
}

// IQ's iSphere4D function !!
// modified to get the second solution and cut off the roof
vec4 iSphere4( in vec3 ro, in vec3 rd, in float ra)
{
    // -----------------------------
    // solve quartic equation
    // -----------------------------
    float r2 = ra*ra;

    vec3 d2 = rd*rd; vec3 d3 = d2*rd;
    vec3 o2 = ro*ro; vec3 o3 = o2*ro;

    float ka = 1.0/dot(d2,d2);

    float k3 = ka* dot(ro,d3);
    float k2 = ka* dot(o2,d2);
    float k1 = ka* dot(o3,rd);
    float k0 = ka*(dot(o2,o2) - r2*r2);

    // -----------------------------
    // solve cubic
    // -----------------------------

    float c2 = k2 - k3*k3;
    float c1 = k1 + 2.0*k3*k3*k3 - 3.0*k3*k2;
    float c0 = k0 - 3.0*k3*k3*k3*k3 + 6.0*k3*k3*k2 - 4.0*k3*k1;

    float p = c2*c2 + c0/3.0;
    float q = c2*c2*c2 - c2*c0 + c1*c1;

    float h = q*q - p*p*p;

    // -----------------------------
    // skip the case of three real solutions for the cubic, which involves four
    // complex solutions for the quartic, since we know this objcet is convex
    // -----------------------------
    if( h<0.0 ) return vec4(INFINI);

    // one real solution, two complex (conjugated)
    float sh = sqrt(h);

    float s = sign(q+sh)*pow(abs(q+sh),1.0/3.0); // cuberoot
    float t = sign(q-sh)*pow(abs(q-sh),1.0/3.0); // cuberoot
    vec2  w = vec2( s+t,s-t );

    // -----------------------------
    // the quartic will have two real solutions and two complex solutions.
    // we only want the real ones
    // -----------------------------

    vec2  v = vec2( w.x+c2*4.0, w.y*1.73205081 )*0.5;   // sqrt(3.0)
    float r = length(v);
    float a = abs(v.y)/sqrt(r+v.x);
    float b = c1/r + k3;
    float t1 = -a-b;
    if(t1 <= 0.) return vec4(INFINI);

    // ocb modified part to shape the roof
    float t2 = a-b;

    vec3 pos = ro + t1*rd;
    vec3 norm = normalize(pos*pos*pos);

    float sn = .6*ra; // snow thickness
    if(pos.y<sn && pos.z<sn){
        pos = ro + t2*rd;
        if(pos.y<sn && pos.z<sn) return vec4(INFINI);

        vec2 tt = vec2((sn-ro.y)/rd.y, (sn-ro.z)/rd.z);
        if(pos.y<sn) t1 =  tt.y;
        else if(pos.z<sn) t1 = tt.x;
        else t1=min(tt.x, tt.y);

        if(t1 == tt.y) norm = vec3(0,0,-1);
        else norm = vec3(0,-1,0);
    }
    return vec4(norm,t1);
}

vec2 cylinder(in vec2 pos, in vec2 ray, in vec2 O, in float R){
    float t1 = INFINI, t2 = INFINI;
    vec2 op = pos - O;

    float a = dot(ray,ray);
    float b = dot(op, ray);
    float c = dot(op,op) - R*R;
    float d = b*b - a*c;

    if (d >= 0.){
        float Vd = sqrt(d);
        t1 = (-b - Vd)/a;
        t2 = (-b + Vd)/a;
    }

	return vec2(t1,t2);
}

vec2 sphere(in vec3 p, in vec3 ray, in vec3 O, in float r){
    vec2 t = vec2(INFINI);
    vec3 d = O - p;
    float b = dot(d, ray);

    float c = dot(d,d) - r*r;
    float D = b*b - c;
    if (D >= 0.){
        float VD = sqrt(D);
        t = vec2(b-VD, b+VD);
        if(t.x<=0.) t.x = INFINI;
        if(t.y<=0.) t.y = INFINI;
    }
    return t;
}


vec4 curvgnd(in vec3 pos, in vec3 ray, in float f){

    float t = sphere(pos, ray, vec3(0.,RVAL,0.), RVAL).y;
    vec3 p = pos + t*ray;
    vec3 n = normalize(vec3(-p.x,RVAL-p.y,-p.z));
    vec2 a = vec2(abs(atan(p.x,p.z)));
    float h = .1
                +.1*texture(iChannel0,.04*a).x
                +.3*texture(iChannel0,.02*a).x
                +.6*texture(iChannel0,.005*a).x;
    if(p.y > TOP*h) t = INFINI;
    return vec4(n,t);
}


vec4 bellTower(in vec3 p, in vec3 ray,  in vec3 box)
{
    vec3 sg = sign(ray);
    vec3 t1 = -(p+sg*box)/ray;
    vec3 t2 = -(p-sg*box)/ray;

	float tN = max( max( t1.x, t1.y ), t1.z );
	float tF = min( min( t2.x, t2.y ), t2.z );

	if( tN > tF || tF <= 0. || tN <= 0.) return vec4(INFINI);

    vec3 nor;
    p += tN*ray;
    if(p.y+min(1.2,3.*(abs(fract(p.z)-.5)+abs(fract(p.x)-.5))) <= box.y){
        nor = -sign(ray)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz);
        return vec4(nor,tN);
    }

    p += (tF-tN)*ray;
    if(p.y+min(1.2,3.*(abs(fract(p.z)-.5)+abs(fract(p.x)-.5))) <= box.y){
        nor = -sign(ray)*step(t2.xyz,t2.yzx)*step(t2.xyz,t2.zxy);
        return vec4(nor,tF);
    }
    return vec4(INFINI);
}


vec4 steeple(in vec3 p, in vec3 ray, in vec3 size)
{
    vec3 np = vec3(.986393923832144,.164398987305357,.0);        // normalize(vec3(6,1.,0));
    vec3 n = np;
    float t = INFINI, t2 = INFINI;
    vec2 pp;

    float f = dot(ray,np);
    if(f<=0.){
        t = -(dot(p,np)-.6575)/f;    // 4./3. x 0.4931 = cos(atan(n.y,n.x))
        pp = p.zy+t*ray.zy;
        if(pp.y+6.*abs(pp.x)>= 4. || pp.y <2.) t = INFINI;
    }

    np.x = -np.x;
    f = dot(ray,np);
    if(f<=0.){
        t2 =-(dot(p,np)-.6575)/f;
        pp = p.zy+t2*ray.zy;
        if(pp.y+6.*abs(pp.x)>= 4. || pp.y <2.) t2 = INFINI;
    }
    if(t2<t){
        t=t2;
        n = np;
    }

    np = np.zyx;
    f = dot(ray,np);
    if(f<=0.){
        t2 = -(dot(p,np)-.6575)/f;
        pp = p.xy+t2*ray.xy;
        if(pp.y+6.*abs(pp.x)>= 4. || pp.y <2.) t2 = INFINI;
    }
    if(t2<t){
        t=t2;
        n = np;
    }

    np.z = -np.z;
    f = dot(ray,np);
    if(f<=0.){
        t2 = -(dot(p,np)-.6575)/f;
        pp = p.xy+t2*ray.xy;
        if(pp.y+6.*abs(pp.x)>= 4. || pp.y <2.) t2 = INFINI;
    }
    if(t2<t){
        t=t2;
        n = np;
    }

    if(t<=0.) t = INFINI;
    return vec4(n,t);
}

/*******************************************************/
/*                     Grid process                    */
/*******************************************************/

// finding next cell on the grid
vec2 getNextCell(in vec2 p, in vec2 v, in vec2 cell){
    vec2 d = sign(v);
	vec2 dt = (cell+d*.5-p)/v;
    d *= vec2( step(dt.x-0.02,dt.y) , step(dt.y-0.02,dt.x) );		// -0.02 to avoid cell change for epsilon inside
    return cell+d;
}

// cell information (center and size of the chalet, if there is.)
vec2 getBox(in vec2 cell, inout vec3 ctr, inout vec3 sze)
{
    if(abs(cell.x) <= 1. && abs(cell.y)<=1.) return vec2(0);   // Empty spaces for the church
    if(length(cell)>= MaxRad-1.5) return vec2(0);
    vec2 h = H22(cell+SEED);
    if(h.x+h.y DEN) return vec2(0);
    h-=.5;
    ctr = vec3(cell.x+h.x,RVAL-sqrt(RVAL*RVAL-cell.x*cell.x-cell.y*cell.y),cell.y+h.y);
    h = abs(h);
    float r = (1.5-max(h.x,h.y))*.61;
    sze = vec3(r, 1.8*(h.x+h.y)+.4, r );
    return h;
}

// raycasting one cell
void checkCell(in vec3 pos, in vec3 ray, in vec2 cell)
{
    vec3 ctr = vec3(0.), sze = vec3(0.);
    vec2 h = getBox(cell, ctr, sze);
    if(h == vec2(0.)) return;

    float ang =  h.x*PI;

    // convert from ray to box space
    float c = cos(ang), s = sin(ang);
    mat2 rotY = mat2(c,-s,s,c);
    mat2 derotY = mat2(c,s,-s,c);

    // roof 45 deg
    // 0.7071 = sin or cos PI/4
    mat3 rot45 = mat3(1,0,0,  0,.7071,-.7071,  0,.7071,.7071);
    mat3 derot45 = mat3(1,0,0,  0,.7071,.7071,  0,-.7071,.7071);


	ray.xz *= rotY;
    pos -= ctr;
	pos.xz *= rotY;

    // Main body
    vec4 res = iBox( pos, ray, sze);
    vec3 p = pos + res.w*ray;
    if(res.w<t && p.y+abs(p.z) <= sze.y){
        t = res.w;
        n = res.xyz;
        n.xz*=derotY;
        hitObj = BODY;
        boxCtr = ctr;
        boxSze = sze;
        boxH = h.x;
        boxRot = rotY;
    }

    // Chimney
    pos.z -= .4;
    res = iBox( pos, ray, vec3(.1,sze.y+.2,.1) );
    if(res.w<t){
        t = res.w;
        n = res.xyz;
        n.xz*=derotY;
        hitObj = CHEM;
        boxCtr = ctr;
        boxSze = sze;
        boxH = h.x;
        boxRot = rotY;
    }
    pos.z += .4;

    // Torch
    float sx = sze.x+.01;
    sx *= sign(mod(cell.x,2.)-.5)*sign(mod(cell.y,2.)-.5);
    pos -= vec3(sx, .35, sx);
    res = iBox( pos, ray, vec3(.01,.03,.01) );
    if(res.w<t){
        t = res.w;
        n = res.xyz;
        n.xz*=derotY;
        hitObj = TORCH;
        boxCtr = ctr;
        boxSze = sze;
        boxH = h.x;
        boxRot = rotY;
        boxCell = cell;
    }
    pos += vec3(sx, .35, sx);

    // Balcony
    if(sze.y>1.6){
        pos.y -= .7;
        res = iBox( pos, ray, vec3(1.2*sze.x, .1,.7*sze.x) );
        vec3 pb = pos + res.w*ray;
        if(res.w<t && res.y!=1. && ( abs(fract(15./sze.x*(pb.z+pb.x))-.5)>.25 || abs(pb.y)>.07) && pb.y<.09+.01*cos(20.*(pb.z+3.*pb.x))){
            t = res.w;
        n = res.xyz;
        n.xz*=derotY;
            hitObj = BALCON;
            boxCtr = ctr;
            boxSze = sze;
            boxH = h.x;
            boxRot = rotY;
        }
        pos.y += .7;
    }

    // Chimney snow cap
    vec3 O = vec3(0.,sze.y+.2,.4);
    float u = sphere(pos, ray, O, .13).x;
    if(u<t){
        t = u;
        n = normalize(pos+u*ray - O);
        n.xz*=derotY;
        hitObj = ROOF;
        boxCtr = ctr;
        boxSze = sze;
        boxH = h.x;
        boxRot = rotY;
    }


    pos.y -= sze.y-1.1*sze.x;

    ray *= rot45;
    pos *= rot45;

    // Snowy roof
    res = iSphere4(pos, ray, 1.3*sze.x);
    if(res.w<t){
        t = res.w;
        n = res.xyz*derot45;
        n.xz*=derotY;
        if(res.y+res.z == -1.) hitObj = CEIL;
        else hitObj = ROOF;
        boxCtr = ctr;
        boxSze = sze;
        boxH = h.x;
        boxRot = rotY;
    }

    return;
}

/*******************************************************/
/*                Main process thru grid               */
/*******************************************************/

void runGrid(in vec3 pos, in vec3 ray){

    vec2 cell, outCell;

    // first step getting boundary of interesting areas
    // Entry and exit point of the voxel run(te and tx)
    vec3 pe = pos;
    float te = INFINI, tx = 0.;

    vec2 tc = cylinder(pos.xz, ray.xz, vec2(0.), MaxRad);
    float th = gnd(pos.y,ray.y,TOPSFC);
    vec4 res = curvgnd(pos, ray, 1.);
    float tg = res.w;
    n = res.xyz;

    if(pos.y>=TOPSFC){
        te = min(max(tc.x,th),tc.y);
        tx = min(tg,tc.y);
    }
    else{
        te = tc.x*step(0.,tc.x)+INFINI*step(th,tc.x);
        tx = min(min(tg,tc.y),th);
    }


    // MAIN PROCESS
    // going thru the grid checking for existing object in each cell

    t = tg;
    if(t<INFINI) hitObj = GND;

    cell = floor(pos.xz+te*ray.xz + .5);
    outCell = getNextCell(pos.xz, ray.xz, floor(pos.xz+tx*ray.xz + .5));

    int endCheck = 0;
    const vec3 e = vec3(1,0,-1);

    for(int i=ZERO; i<maxCell;i++){

        if(cell == outCell) break;

        checkCell(pos, ray, cell);
        checkCell(pos, ray, cell+e.xy);    // 3x3 overlaping
        checkCell(pos, ray, cell+e.zy);
        checkCell(pos, ray, cell+e.yx);
        checkCell(pos, ray, cell+e.yz);

        checkCell(pos, ray, cell+e.xx);
        checkCell(pos, ray, cell+e.zz);
        checkCell(pos, ray, cell+e.xz);
        checkCell(pos, ray, cell+e.zx);


        if(endCheck==2) break;

        if(hitObj >= 2) endCheck += 1;

        cell = getNextCell(pos.xz,ray.xz,cell);
    }


    return;
}

/*******************************************************/
/*                  raycasting Church                  */
/*******************************************************/

// checking if ray goes in center cell (dim = 1.36 x 1.36)
bool inChurchBound(in vec2 p, in vec2 r)
{
    vec2 s = sign(r);
    vec2 t1 = -(p+s*1.36)/r;
    vec2 t2 = -(p-s*1.36)/r;

	float tN = max( t1.x, t1.y );
	float tF = min( t2.x, t2.y );

	if( tN > tF || tF <= 0.) return false;
    else return true;
}

// raycasting whole church
void checkChurch(in vec3 pos, in vec3 ray)
{
    vec3 sze = vec3(.9,1.8,.9);
    vec4 res = iBox( pos, ray, sze);
    vec3 p = pos + res.w*ray;
    if(res.w<t && p.y+abs(p.z) <= sze.y){
        t = res.w;
        n = res.xyz;
        hitObj = CHURCH;
    }

    res.w = cylinder(pos.xz, ray.xz, vec2(.5,0.), .8).x;
    p = pos + res.w*ray;
    if(res.w<t && p.y+abs(.3*p.x) <= .8){
        t = res.w;
        n = vec3(p.x-.6,0,p.z);
        hitObj = NEF;
    }

    res.w = sphere(pos, ray, vec3(.5,.25,0), .85).x;
    p = pos + res.w*ray;
    if(res.w<t && p.y+abs(.3*p.x) > .75){
        t = res.w;
        n = normalize(p - vec3(.5,.3,0));
        hitObj = ROOF;
    }

    pos.xz -= vec2(.4,1.);
    res = bellTower(pos,ray,vec3(.35,3.5,.35));
    if(res.w<t){
        t = res.w;
        n = res.xyz;
        hitObj = TOWER;
    }

    res = steeple( pos, ray, vec3(.5,3.,.5));
    if(res.w<t){
        t = res.w;
        n = res.xyz;
        hitObj = STEEP;
    }
    pos.xz += vec2(.4,1.);

    // roof
    pos.y -= sze.y-1.1*sze.x;
    ray *= mat3(1,0,0,  0,.7071,-.7071,  0,.7071,.7071);
    pos *= mat3(1,0,0,  0,.7071,-.7071,  0,.7071,.7071);

    res = iSphere4(pos, ray, 1.15*sze.x);
    if(res.w<t){
        t = res.w;
        n = res.xyz*mat3(1,0,0,  0,.7071,.7071,  0,-.7071,.7071);
        if(res.y+res.z == -1.) hitObj = CEIL;
        else hitObj = ROOF;
    }

    return;
}

/*******************************************************/
/*                 Textures and colors                 */
/*******************************************************/
vec3 sky(in float x, in float y)
{
    x = .5*x+.5;
    return vec3(2.-3.*y, 1.2-1.4*y, .8-.6*y)*x*x+vec3(.0,.05,.1);
}

float snowGlitt(in vec3 p,in vec3 ray)
{
    return .6*min(1., step(.9995, H33(floor(2000.*p)+floor(5.*ray)).x ));
}


vec3 stonewall(in vec2 uv)
{
    uv *= vec2(20.,20.);

    vec2 i = floor(uv);
    uv += vec2(.5,.3)*H22(i);
    vec2 f = abs(fract(uv)-.5);

    float h = H12(floor(uv));
    float tex = texture(iChannel0,.3*(uv+h)).x;
    vec3 col = .1+ .3*vec3(h);
    col += .6*tex;
    col -= .3*(smoothstep(.45+.1*tex,.5,f.x)+smoothstep(.35+.1*tex,.45,f.y));

    return max(vec3(0.),col);
}

vec3 woodwall(in vec2 p)
{
    vec3 col = vec3(.3,.225,.15);
    col *= 1.-texture(iChannel0,.05*p.yx).x;
    p*=15.;
    col -= .4*smoothstep(.34+.2*texture(iChannel0,.01*p.xy).x,.5,abs(fract(p.x)-.5)) ;
    col *= 1.-.5*H12(floor(p.xx));

    return col;
}

/************************************************/
/*               Doors and windows              */
/************************************************/

/******************** door *******************/
float doorMask(in vec3 p, in vec3 ray, in float pzctr)
{
    float apz = abs(pzctr);
    float m = 1.
              - smoothstep(.143,.135,apz)*step(p.y,.44)
              - smoothstep(.205,.20,apz)*smoothstep(.027,.020,abs(p.y-.425));
    m = max(m,0.);
    return m;
}

vec3 door2D(in vec3 p, in vec3 ray, in float pzctr)
{
    vec3 tex = vec3(.3,.225,.15)*(.1+texture(iChannel0,3.*p.yz).x);
    float apz = abs(pzctr);

    // wood framing
    vec3 col = tex*smoothstep(.023,.015,abs(p.y-.425))*smoothstep(.2,.19,apz);
    col += tex*smoothstep(.02,.01,abs(apz-.12))*smoothstep(.40,.398,p.y);

    // door with fake 3D shadows
    float cy = sign(n.x)*(ray.x*n.z-ray.z*n.x); // cross(ray,n)
    float top = step(p.y,.37*(1.-clamp(ray.y,-.08,0.)));
    if(pzctr < min(.1+.05*cy,.1) && pzctr > max(-.1+.05*cy,-.1)) col += top*woodwall(3.*p.zy);

    return col;
}

/******************** window *******************/

float winMask(in vec3 apw, in vec3 ray)
{
    return 1.-smoothstep(.25,.23,apw.z)*smoothstep(.08,.07,apw.y);
}

float lightWinMask(in vec3 apw)
{
    return smoothstep(.18,.16,apw.z)*smoothstep(.055,.05,apw.y);
}

vec3 window2D(in vec3 pw, in vec3 ray, in float lm, in float h)
{
    vec3 tex = vec3(.3,.225,.15)*(.1+texture(iChannel0,pw.zy).x);
    vec3 col = tex*smoothstep(.24,.22,abs(pw.z))*smoothstep(.075,.07,abs(pw.y));
;

    // background light with fake3D light source
    vec3 litcol = vec3(.05+.02*h,.03-.01*h,.0)*(2.+.5/(length(vec2(pw.z+.2*(ray.x+ray.z),pw.y+.04+.1*ray.y))+.01));
    col += 1.5*lm*litcol;

    // framing with fake 3D shade
    float cy = sign(n.x)*(ray.x*n.z-ray.z*n.x); // cross(ray,n)
    vec2 ctr = vec2(.1*sign(pw.z)*cy ,-.05*sign(pw.y)*ray.y );
    float mask = lm*smoothstep(.18,.16,abs(pw.z)-ctr.x)*smoothstep(.055,.05,abs(pw.y)-ctr.y);
    col *= 1.-mask;
    col += mask*litcol;

    return col;
}

/**************** balcony window door ***************/
vec3 windoorFrame(in vec3 p)
{
    vec3 tex = vec3(.3,.225,.15)*(.1+texture(iChannel0,3.*p.yz).x);
    return tex*smoothstep(.095,.085,abs(p.z))*smoothstep(.19,.17,abs(p.y));
}


float wdMask(in vec3 apw)
{
    return 1.-smoothstep(.1,.09,apw.z)*smoothstep(.2,.18,apw.y);
}

float lightWDMask(in vec3 apw)
{
    return smoothstep(.038,.033,abs(apw.z-.045))*smoothstep(.16,.15,apw.y);
}

vec3 windoor2D(in vec3 p, in vec3 ray, in float lm, in float h)
{
    vec3 col = windoorFrame(p)*(1.-lm);
    col += lm*vec3(.04,.025-.01*h,.01)*(2.+1./(length(vec2(p.z+.2*(ray.x+ray.z),p.y+.05+.1*ray.y))+.02));

    return col;
}

/******************** Church windows ********************/

// fake 3D //
vec2 fake3D(in vec3 ray, in vec2 po)
{
    vec3 cr = cross(ray,n);
    vec2 c = vec2(n.x*cr.z-n.z*cr.x, cr.y);   // face selection
    return vec2(.1*c.y*sign(po.x)*sign(-n.x+n.z),.1*c.x*sign(po.y));
}

float bellWindow(in vec2 ap, in vec2 poa)
{
    float wm = smoothstep(.12,.1,ap.x)*smoothstep(.16,.14,ap.y);
    wm += smoothstep(.12,.1,length(poa));
    return min(1.,wm);
}

float churchWindow(in vec2 ap, in vec2 poa)
{
    float wm = smoothstep(.07,.06,ap.x)*smoothstep(.05,.04,ap.y);
    wm += smoothstep(.07,.06,length(poa));
    return min(1.,wm);
}



/*******************************************************/
/*                       Shadows                       */
/*******************************************************/

/********************* Fake 3D shadow ******************/
float calcShad(in vec2 cell, in vec2 p, in vec2 lit)
{
    vec3 ctr = vec3(.1,0,.1), sze = vec3(.8,1.8,.9);    // init with church values
    vec2 h;

    h= getBox(cell, ctr, sze);
    if(h == vec2(0) && cell != vec2(0)) return 0.;

    float ang =  h.x*PI;
    float co = cos(ang), si = sin(ang);
    p -= ctr.xz;

    float da = abs(ang-atan(lit.x,lit.y));
    float sd = sign(dot(lit,vec2(co,-si)));
    float sina = sin(da);

    vec2 ps = p * mat2(lit.x,lit.y,-lit.y,lit.x);
    p *= mat2(co,-si,si,co);

    float sh = .5*step(sd*p.x,sze.x)*step(p.y,sze.x)*(1.-step(-sze.x+.01,sd*p.x)*step(-sze.x+.01,p.y))*smoothstep(3.,0.,abs(ps.x))*smoothstep(0.15, -.02*abs(ps.x-sze.x), abs(ps.y)-(1.+.414*sina)*sze.x);

    lit *= mat2(co,-si,si,co);
    vec2 s =sign(lit);

    float occ = .5*smoothstep(sze.x+.3,sze.x-.1,abs(p.x)) * smoothstep(sze.x+.3,sze.x-.1,abs(p.y));

    return sh+occ;
}


float fakeShade(in vec2 p, in vec2 lit)
{
    vec2 cell = floor(p+.5);
    float shad = 0.;

    for(float e=-1.; e<=3.; e++){
        for(float f=-1.; f<=2.; f++){
            shad = max(shad,calcShad(cell+vec2(e,f), p, lit));
        }
    }

    return 1.-shad;
}
/********************* End of fake 3D shadow ******************/



/************************* 3D shadow **************************/

/*********** simplified checkCell raycast ************/
float shadCheckCell(in vec3 pos, in vec3 ray, in vec2 cell)
{
    float t = INFINI;
    vec3 ctr = vec3(0.), sze = vec3(0.);
    vec2 h = getBox(cell, ctr, sze);
    if(h == vec2(0.)) return INFINI;

    float ang =  h.x*PI;

    // convert from ray to box space
    float c = cos(ang), s = sin(ang);
    mat2 rotY = mat2(c,-s,s,c);

    // roof 45 deg
    mat3 rot45 = mat3(1,0,0,  0,.7071,-.7071,  0,.7071,.7071);

	ray.xz *= rotY;
    pos -= ctr;
	pos.xz *= rotY;

    // Main body
    vec4 res = iBox( pos, ray, sze);
    vec3 p = pos + res.w*ray;
    if(p.y+abs(p.z) <= sze.y) t = min(t,res.w);

    // Chimney
    pos.z -= .4;
    res = iBox( pos, ray, vec3(.1,sze.y+.2,.1) );
    t = min(t,res.w);
    pos.z += .4;

    // Chimney snow cap
    vec3 O = vec3(0.,sze.y+.2,.4);
    t = min(t, sphere(pos, ray, O, .13).x);


    pos.y -= sze.y-1.1*sze.x;

    ray *= rot45;
    pos *= rot45;

    // Snowy roof
    res = iSphere4(pos, ray, 1.3*sze.x);
    t = min(t, res.w);

    return t;
}


/****************** shadows on ground ******************/
float gndShad(in vec3 p, in vec3 lit){
    vec2 cell = floor(p.xz+.5);
    p.y+=.001;             // be sure p is above ground surface to avoid ground interception
    p.xz -= .015*lit.xz;   // to remove some artifacts due to rotation accuracy issue with building
    float tsh = INFINI;
    lit -= .1*dither(p);//+.05*n+.1*lit;
    for(float e=-0.; e<=4.; e++){            // due to fix ambiant light direction
        for(float f=-1.; f<=2.; f++){        // only checking limited grid area
            tsh = min(tsh, shadCheckCell(p, lit, cell+vec2(e,f)));
        }
    }
    return min(.3*tsh+.4,1.);
}

/********* local shade, for ambiant occlusion *******/
float locShad(in vec3 p, in vec3 lit){
    vec2 cell = floor(p.xz+.5);
    float tsh = INFINI;
    for(float e=-1.; e<=2.; e++){
        for(float f=-1.; f<=2.; f++){
            tsh = min(tsh, shadCheckCell(p, lit, cell+vec2(e,f)));
        }
    }

return min(2.*tsh,1.);
}

/*********************************************************/
/*                       Lighting                        */
/*********************************************************/

float torch( in vec2 cell, in vec3 p)
{
    vec3 ctr = vec3(0.), sze = vec3(0.);
    vec2 h;
    h= getBox(cell, ctr, sze);
    if(h == vec2(0)) return INFINI;

    float sx = sze.x+.01;
    sx *= sign(mod(cell.x,2.)-.5)*sign(mod(cell.y,2.)-.5);  // to change corner side every other one

    vec3 torPos = vec3(sx, .35, sx);

    float ang =  h.x*PI;
    float c = cos(ang), s = sin(ang);
    torPos.xz *= mat2(c,s,-s,c);
    torPos.xz += ctr.xz;

    vec3 u = torPos-p;

    float l = INFINI;

    float dt = dot(normalize(u),n);
    l = length(u)/smoothstep(-.2,0.2,dt);

    return l;
}

vec3 torchLight(in vec3 p)
{
    vec2 cell = floor(p.xz+.5);
    float d = INFINI;
    //p -= .1*dither(p)+.05*n;
    for(float e=-3.; e<=3.; e++){
        for(float f=-3.; f<=3.; f++){
            d = min(d,torch(cell+vec2(e,f), p));
        }
    }
    return vec3(.5,.3,.1)*max(0.,(1./(d*d+.1)-.1));
}

/******************************************************************/
/*                        CAM functions                          */
/******************************************************************/

vec3 getCamPos(inout vec3 camTarget)
{
    vec3 p;
    if(iTime < 22.){
        camTarget.y = 1.;
        p.y = .25;
        float tiA = .7*iTime;
        float tiB = .4*iTime;
        float tr = smoothstep(15.,20.,iTime);
        tiA = -.1*tiA+2.8;
        tiB -= 17.;
        p.xz = mix(11.*vec2(cos(tiA), sin(tiA)), vec2(.15*tiB+1.4, -tiB), tr);
        camTarget.xz = mix(vec2(.35,7.), vec2(0), tr);
    }
    else if(iTime<64.){
        p.y = .25;
        float tiA = .4*iTime;
        float tiB = .05*iTime+6.3;
        tiA -= 17.+smoothstep(28.,34.,iTime);
        float tr = smoothstep(29.,33.,iTime);
        float s = smoothstep(35.,42.,iTime);
        float sf = smoothstep(52.,60.,iTime);
        float r = 5.-1.8*s-1.*sf;
        p.xz = mix(vec2(.15*tiA+1.4, -tiA), r*vec2(cos(tiB),sin(tiB)), tr);
        camTarget = vec3(-3.*s+4.*sf, 1.+.6*sf, -3.*s+4.*sf);
    }
    else if(iTime<90.){
        float ti = iTime-64.;
        float s = smoothstep(12.,27.,ti);
        float rot = smoothstep(16.,27.,ti);
        float ey = smoothstep(13.,18.,ti);
        ti= .3*ti-8.;
        camTarget = (1.-s)*vec3(-ti,.25+ey*.7,-1.73*ti-6.1+.13*sin(ti+1.))+vec3(0,s*1.5,0);
        ti -= .1;
        p = mix(vec3(-ti,.23+s*2.3,-1.73*ti-6.1), vec3(4.*cos(-.5*ti-2.5),2.3,4.*sin(-.5*ti-2.5)), rot);
    }
    else{
        float ti = iTime-64.;
        ti= -.15*ti+1.55;
        float tr = smoothstep(92.,110.,iTime);
        float r = 10.+5.*sin(.6*ti);
        p = vec3(r*cos(.5*ti),2.5,r*sin(.5*ti));
        p = mix(vec3(4.*cos(ti),2.3,4.*sin(ti)), p, tr);
        p.y -= 2.1*smoothstep(9.,13.,length(p.xz));
        camTarget = mix(vec3(0,1.5,0), .5*p, tr);
    }

    return p;
}

// used for cam path equation setting
vec3 laserBeam(in vec3 p)
{
    vec3 c = vec3(0);
    c.r += smoothstep(.02,0.,abs(1.73*p.x-p.z-6.1));
    c.r += smoothstep(.02,.0,abs(length(p.xz)-11.)) + smoothstep(.02,0.,abs(p.x+.15*p.z-1.4)) + smoothstep(.02,.0,abs(length(p.xz)-5.1));
    return c;
}

vec3 mouseCam(in vec3 camTarget)
{
    float 	rau = 12.,
            alpha = iMouse.x/iResolution.x*4.*PI,
            theta = (iMouse.y+.001)/iResolution.y*PI+ (PI/2.0001);	// +0.001 to avoid black horizontal line

    return rau*vec3(-cos(theta)*sin(alpha),sin(theta),cos(theta)*cos(alpha))+camTarget;
}


/******************************************************************/
/*                        MAIN functions                          */
/******************************************************************/

vec3 getRay(in vec2 st, in vec3 pos, in vec3 camTarget){
    float 	focal = 1.5;
    vec3 ww = normalize( camTarget - pos);
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0)) ) ;
    vec3 vv = cross(uu,ww);
	return normalize( st.x*uu + st.y*vv + focal*ww );
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 st = (2.*fragCoord-iResolution.xy)/iResolution.y;

    vec3 col = vec3(0.);
    vec3 lit = vec3(.9759,.09759,.19518);   // light dir = (1.,.1,.2)
    vec3 camTarget, pos;

    if(iMouse.x > 2.){
        camTarget = vec3(0.,1.,0.);
        pos = mouseCam(camTarget);
        pos.y = max(.1+RVAL-sqrt(RVAL*RVAL-pos.x*pos.x-pos.z*pos.z),pos.y);
    }
    else{
        pos = getCamPos(camTarget);
    }

    vec3 ray = getRay(st, pos,camTarget);


    runGrid(pos,ray);

    if(inChurchBound(pos.xz,ray.xz)) checkChurch(pos,ray);

    vec3 p = pos;
    if(t<INFINI) p += t*ray;

    vec3 outp = p+.0001*n;
    float lm = 0., lm2 = 0., dm = 0.;               // light mask

    // GROUND with shadows
    if(hitObj == GND){
        ray.y = abs(ray.y);
        float df = texture(iChannel0,.5*p.xz).x-texture(iChannel0,.5*p.xz+vec2(.001)).x;
        vec2 e = vec2(.001*length(p.xz),.3*atan(p.z,abs(p.x)));
        col += .6+1.3*snowGlitt(p,ray)+.1*df+.4*(texture(iChannel0,.0005*p.xz).x-texture(iChannel0,.0005*p.xz+vec2(.00001*t)).x);   // gnd snow
        col *= smoothstep(600.,0.,t);                           // fading to the mountains
        col += min(.3,.0042*p.y*texture(iChannel0,e).x);        // snow and rocks over mountains
        col += p.y*vec3(0.,.00015,.0002)*ray.x;   // color correction, magenta over exposed top
        col *= .4+.6*dot(n,lit);
        col *= fakeShade(p.xz, lit.xz);    // fake shadows (smooth and fast)
        col *= 1.-.5*smoothstep(2.2,0.,abs(p.x+.4))*smoothstep(1.,0.,abs(p.z-.9))*step(.9,p.z)*smoothstep(.85,.75,p.x);    // towerbell correction
        //col *= gndShad(p,lit);               // more real (3D sahdows) slower and need dithering
    }
    // BODY bulding with windows and doors
    else if(hitObj == BODY){
        p -= boxCtr;
        p.xz *= boxRot;

        col += .3*stonewall(p.zy+p.xy);

        // windows
        float dctr = 1.6*boxH-.4;    // door center
        vec3 pw = vec3(p.x, p.y-.3,fract(3.*p.z)-.5);
        vec3 apw = abs(pw);
        float fpz = floor(3.*p.z);
        if(fpz+1.<dctr-.15 || fpz>dctr+.15){
            lm = lightWinMask(apw);
            col *= winMask(apw, ray);
            col += window2D(pw, ray, lm, boxH); // fake 3D window
        }
        // window for level2 no balcony
        if( boxSze.y<1.6 ){
            pw = vec3(p.x, p.y-.8,fract(4.*p.z+.5)*mod(floor(4.*p.z+.5),2.)-.5);
            apw = abs(pw);
            lm2 = lightWinMask(apw);
            col *= winMask(apw, ray);
            col += window2D(pw, ray,lm2, boxH);
        }
        // balcony door
        else{
            pw = vec3(p.x, p.y-.85, p.z);
            apw = abs(pw);
            lm2 = lightWDMask(apw);
            col *= wdMask(apw);
            col += windoor2D(pw, ray, lm2, boxH);
        }

        // door
        float pzCtr = p.z-dctr;   // pos from door center
        dm = doorMask(p, ray, pzCtr);
        col *= dm;
        col += door2D(p, ray, pzCtr);      // fake 3D door

        // shading and lights
        float rf = .65*(p.y+abs(p.z))/boxSze.y;    // roof occlusion
        rf *= rf*rf*rf;
        col -= rf*(1.-lm2);

        float gi = .6+.4*dot(n,lit);    // gen. illuminitaion

        float ls = 1.;
        if(dot(n,lit)>0.) ls = locShad(outp,lit);
        lm += lm2;
        lm *= dm;
        col *= lm+(1.-lm)*ls*gi;     // removing window mask to avoid erroneous shade on windows light
    }
    // CHIMNEY
    else if(hitObj == CHEM){
        p -= boxCtr;
        p.xz *= boxRot;
        col += .3*stonewall(p.zy+p.xy);
        col *= .6+.4*dot(n,lit);
    }
    // BALCONY
    else if(hitObj == BALCON){
        p -= boxCtr;
        p.xz *= boxRot;
        if(p.y > .77) col += .3;
        else col += woodwall(20.*n.x*p.zy + 2.*n.y*p.xz);
        col *= .6+.4*dot(n,lit);
    }
    // snowy ROOF
    else if(hitObj == ROOF){
        p -= boxCtr;
        p.xz *= boxRot;
        col += .4;
        col += snowGlitt(p,ray);
        col *= .6+.4*dot(n,lit);
        if(dot(n,lit)>0.) col *= .6+.4*locShad(outp,lit);
    }
    // wooden CEILING below roof
    else if(hitObj == CEIL){
        p -= boxCtr;
        p.xz *= boxRot;
        col += .3*woodwall(2.5*p.xy);
        p.z*=8.;
        col -= .1*(smoothstep(.2+.3*texture(iChannel0,.1*p.xz).x,.4,abs(fract(p.z)-.5)));
        col *= .5+.5*dot(-ray,lit);
    }
    // TORCH street light
    else if(hitObj == TORCH){
        p -= boxCtr;
        p.xz *= boxRot;
        float sx = boxSze.x+.01;
        sx *= sign(mod(boxCell.x,2.)-.5)*sign(mod(boxCell.y,2.)-.5);
        p -= vec3(sx, .35, sx);
        float l = length(p);
        col += vec3(.00024,.00012,.00004)/(l*l);
        col *= step(abs(p.x),.007)+step(abs(p.y),.027)+step(abs(p.z),.007);
    }
    // CHURCH
    else if(hitObj == CHURCH){
        col += .4*stonewall(p.zy+p.xy);
        col  *= .6+.4*dot(n,lit);
        p += .001*n;                   // proximity occlusion
        if(dot(n,lit)>0.) col *= locShad(p,lit);


        /** lateral windows **/
        vec2 po = vec2(fract(1.7*p.x-.3)-.5, p.y-.35);
        vec2 ap = abs(po);           // center of the window
        vec2 poa = po-vec2(0.,.05);  // center of the arche

        // window mask
        float wm = churchWindow(ap,poa);

        // moving center for the black mask (fake 3D)
        vec2 ctr = .7*fake3D(ray,po);

        // black mask. same as window mask but with shifted center
        ap = abs(ap-ctr);
        poa -= sign(po)*ctr;
        float bm = churchWindow(ap,poa);

        ap*=vec2(20.,5.);
        ap.x = fract(ap.x)-.5;
        vec3 litcol = vec3(.05,.04,.02)*(1.+2./length(ap));

        // adding texture with brighter color on window mask (sides)
        col += wm*vec3(.3,.24,.12);
        // removing shifted hole part (black), in respect of window limits.
        col *= 1.-wm*bm;

        po -= sign(po)*ctr;
        po *= 30.;
        col += bm*wm*litcol*(.3+.7*H12(floor(vec2(po.x+po.y,po.x-po.y))+floor(1.7*p.x-.3)+12.34));   // inside lights
        col *= 1.-wm*bm*(smoothstep(.9,1.,fract(po.x+po.y))+smoothstep(.9,1.,fract(po.x-po.y)));  // window grid


        /** top round windows **/
        poa = vec2(p.z, p.y-1.1);
        wm = smoothstep(.1,.09,length(poa));
        ctr = .7*fake3D(ray,poa);
        poa -= sign(poa)*ctr;
        float lpoa = length(poa);
        bm =smoothstep(.1,.09,lpoa);
        float ang = 2.*atan(poa.y,poa.x);
        litcol = vec3(.04,.032,.016)/(lpoa+.02)*(.5+.5*H12(vec2(floor(ang))))*(1.-smoothstep(.8,1.,fract(ang)));
        col += wm*vec3(.3,.24,.12);
        col *= 1.-wm*bm;
        col += bm*wm*litcol;

    }
    else if(hitObj == NEF){
        vec2 a = vec2(atan(p.z,p.x),2.*p.y);
        col += .4*stonewall(a);
        col  *= .6+.4*dot(n,lit);
        p += .001*n;                   // proximity occlusion
        if(dot(n,lit)>0.) col *= locShad(p,lit);


        /** slot windows **/
        vec2 po = vec2(fract(2.5*a.x-.5)-.5, a.y-.55);
        vec2 ap = abs(po);           // center of the window

        float wm = smoothstep(.03,.02,ap.x)*smoothstep(.07,.06,ap.y);
        vec2 ctr = .7*fake3D(ray,po);
        ap = abs(ap-ctr);
        float bm = smoothstep(.03,.02,ap.x)*smoothstep(.07,.06,ap.y);

        ap.y-=.1;
        vec3 litcol = vec3(.05,.04,.02)*(.4/length(ap));
        col += wm*vec3(.4,.32,.16);
        col *= 1.-wm*bm;
        col += bm*wm*litcol;

    }
    else if(hitObj == TOWER){
        //vec3 o = vec3(.4,1.8,1.);  // center of bell tower for memory
        vec3 an = abs(n);
        vec2 po = an.x*(p.zy-vec2(1.,1.8))+an.z*(p.xy-vec2(.4,1.8));   // face selection
        vec2 ap = abs(po);           // center of the window
        vec2 poa = po-vec2(0.,.16);  // center of the arche

        // window mask
        float wm = bellWindow(ap,poa);

        // moving center for the black mask (fake 3D)
        vec2 ctr = fake3D(ray,po);

        // black mask. same as window mask but with shifted center
        ap = abs(ap-ctr);
        poa -= sign(po)*ctr;
        float bm = bellWindow(ap,poa);

        // adding texture with darker color on window mask (sides)
        col += (.4-.2*wm)*stonewall(2.*po);
        // removing shifted hole part (black), in respect of window limits.
        col *= 1.-bm*wm;

        col  *= .6+.4*dot(n,lit);
        p += .001*n;                   // proximity occlusion
        if(dot(n,lit)>0.) col *= locShad(p,lit);
    }
    else if(hitObj == STEEP){
        float f = smoothstep(.0,.15,(3.5-p.y)*texture(iChannel0,n.z*p.yx+n.x*p.yz).x);
        col += (1.-f)*vec3(.43,.4,.37)*stonewall(vec2(.5*(p.z+p.x),.3*p.y));
        col += .4*f;
        col  *= .6+.4*dot(n,lit);
    }
    // SKY
    else col += sky(ray.x, ray.y);

    // Overall illumination by torch
    if(hitObj != SKY) col *= 1.+(1.-step(0.05,lm))*torchLight(outp)/(.6+.4*dot(n,lit));

    //if(hitObj == GND) col += laserBeam(p);

    fragColor = vec4(col,1.0);
}



// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

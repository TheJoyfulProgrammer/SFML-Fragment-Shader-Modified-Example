// https://www.shadertoy.com/view/MddcDB

#ifdef GL_ES
precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;


// Sometimes It Snows In April - Del 04/03/2018
//------------------------------------------------------------------------
// Camera
//------------------------------------------------------------------------
void doCamera( out vec3 camPos, out vec3 camTar)
{
    vec2 mouse = vec2(0.0);
    float an = 10.0*mouse.x;
	camPos = vec3(1.2*sin(an),0.3+mouse.y*2.0,1.2*cos(an));
    camTar = vec3(0.0,0.0,0.0);
}

//------------------------------------------------------------------------
// Modelling
//------------------------------------------------------------------------

float sdPlane( vec3 p )
{
	return p.y;
}
#define PI 3.141592
#define	TAU 6.28318

mat2 rotate(float a)
{
	float c = cos(a);
	float s = sin(a);
	return mat2(c, s, -s, c);
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

// simple bend(Y) mod
vec2 opBendTest( vec2 p, float angle, float xmod )
{
    p.x += xmod;
    p = rotate( angle * p.x ) * p.xy;
    p.x -= xmod;
    return p;
}
// simple spriral(x) mod
float spiral(vec2 p, float sa, float b)
{
  float a = atan(p.y, p.x);
  float l = length(p);
  float n = (log(l/sa)/b - a) / (2.*PI);
  float upper_ray = sa * exp(b *(a + 2.*PI*ceil(n)));
  float lower_ray = sa * exp(b *(a + 2.*PI*floor(n)));
  return min(abs(upper_ray - l), abs(l-lower_ray));
}

// 2D-shapes (Trapezoid, Ring, Box, Triangle)
float dot2(in vec2 v ) { return dot(v,v); }
float sdTrapezoid( in vec2 p, in float r1, float r2, float he )
{
    vec2 k1 = vec2(r2,he);
    vec2 k2 = vec2(r2-r1,2.0*he);

	p.x = abs(p.x);
    vec2 ca = vec2(p.x-min(p.x,(p.y < 0.0)?r1:r2), abs(p.y)-he);
    vec2 cb = p - k1 + k2*clamp( dot(k1-p,k2)/dot2(k2), 0.0, 1.0 );

    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;

    return s*sqrt( min(dot2(ca),dot2(cb)) );
}

float ring(vec2 uv, float rad, float thickness)
{
    return abs(rad - length(uv)) - thickness;
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 q = abs(p) - b;
	return min(max(q.x,q.y),0.0) + length(max(q,0.0));
}

// signed distance to a 2D triangle
float sdTriangle( in vec2 p0, in vec2 p1, in vec2 p2, in vec2 p )
{
	vec2 e0 = p1 - p0;
	vec2 e1 = p2 - p1;
	vec2 e2 = p0 - p2;

	vec2 v0 = p - p0;
	vec2 v1 = p - p1;
	vec2 v2 = p - p2;

	vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
	vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
	vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );

    float s = sign( e0.x*e2.y - e0.y*e2.x );
    vec2 d = min( min( vec2( dot( pq0, pq0 ), s*(v0.x*e0.y-v0.y*e0.x) ),
                       vec2( dot( pq1, pq1 ), s*(v1.x*e1.y-v1.y*e1.x) )),
                       vec2( dot( pq2, pq2 ), s*(v2.x*e2.y-v2.y*e2.x) ));

	return -sqrt(d.x)*sign(d.y);
}

float NewSymbol(vec2 uv)
{
    vec2 p = uv+vec2(0.27,0.09);
	float s1 = length(p)-0.2;						// circle1
  	float s2 = length(p+vec2(-0.22,-0.01))-0.18;	// circle2
	p.x = spiral(p.xy, PI*0.5, -0.33);				// Spiral distort
    float d = sdTrapezoid(p,0.015,0.015,0.08);		// could just be a box...
	d = max(d, s1);									// subtract circle
	d = max(d,-s2);									// subtract circle

    p = vec2(abs(uv.x),uv.y);
    //d = min(d,sdTriangle(vec2(-0.155,0.1),vec2(-0.055,0.1),vec2(-0.105,0.05),p.yx)); // mid-cross tri
    d = min(d, sdTrapezoid(p.yx+vec2(0.105,-0.075),0.0,0.05,0.025));   			// mid-cross trapeziod!
    d = min(d,sdBox(p+vec2(-0.05,0.105),vec2(0.025,0.025)));						// mid-cross bar
    d = min(d,sdTriangle(vec2(0.0, -0.425),vec2(0.1, -0.25),vec2(-0.025, -0.35),p.xy)); // bottom triangle

	p = opBendTest(uv+vec2(0.16, -0.088),radians(77.0),-0.103);
    d = smin(d, sdTrapezoid(p.yx,0.018,0.025,0.19), 0.012); // bent arm (attempted to smooth the join, needs work)

    d = min(d,sdBox(uv+vec2(0.0,0.13),vec2(0.032,0.2)));	// main body
    d = min(d,sdBox(uv+vec2(-0.08,-0.085),vec2(0.09,0.025))); // horn1 (bar)

    float cuts = length( uv+vec2(-0.17,-0.32))-0.21;
    cuts = min(cuts,length( uv+vec2(-0.17,0.15))-0.21);
    cuts = min(cuts,length( uv+vec2(-0.73,-0.085))-0.4);
    p = uv+vec2(-0.26,-0.085);
    d = min(max(sdTrapezoid(p.yx,0.025,0.13,0.09),-cuts),d); // horn2 (cutout)

    d = smin(d,ring(uv+vec2(0.0,-0.26),0.13,0.028),0.01);			// top-ring


    return d;
}


// signed box distance field
//float sdBox(vec3 p, vec3 radius)
//{
//  vec3 dist = abs(p) - radius;
//  return min(max(dist.x, max(dist.y, dist.z)), 0.0) + length(max(dist, 0.0));
//}

vec2 opU( vec2 d1, vec2 d2 )
{
	return (d1.x<d2.x) ? d1 : d2;
}

vec3 opTwist( vec3 p )
{
    p.y += 0.5;
    float scale = sin(time*1.25)*0.15;

    float  c = cos(scale*p.y+scale);
    float  s = sin(scale*p.y+scale);
    mat2   m = mat2(c,-s,s,c);
    p = vec3(m*p.zy,p.x);
    p.y -= 0.5;
    return p;
}


vec3 rotateX(vec3 p, float a)
{
  float sa = sin(a);
  float ca = cos(a);
  return vec3(p.x, ca * p.y - sa * p.z, sa * p.y + ca * p.z);
}
vec3 rotateY(vec3 p, float a)
{
  float sa = sin(a);
  float ca = cos(a);
  return vec3(ca * p.x + sa * p.z, p.y, -sa * p.x + ca * p.z);
}
vec3 rotateZ(vec3 p, float a)
{
  float sa = sin(a);
  float ca = cos(a);
  return vec3(ca * p.x - sa * p.y, sa * p.x + ca * p.y, p.z);
}



vec2 doModel( vec3 p )
{
    vec2 res = vec2( sdPlane(p+vec3(0.0,0.45,0.0)), 1.0);	// floor...

    float t1 = fract(time*0.15)*TAU;
    float t2 = fract(time*0.31)*TAU;

    vec3 r1 = rotateY(p,t1)	;//iTime*0.8);
    //if (iMouse.w>0.5)
    {
		r1 = rotateY(r1, sin(t2+p.y*1.25));
    	r1 = opTwist(r1);
    }

	float symbolDist = NewSymbol(r1.xy);
    float dep = 0.02;
    vec2 e = vec2( symbolDist, abs(r1.z) - dep );
    symbolDist = min(max(e.x,e.y),0.0) + length(max(e,0.0));
    symbolDist -= 0.015;

    res = opU(res,vec2(symbolDist,2.0));
    return res;
}

//------------------------------------------------------------------------
// Material
//------------------------------------------------------------------------
// c = colour index (added by del for some materials)
vec3 doMaterial( in vec3 pos, in vec3 nor,float c )
{
    if (c<=1.0)
    {
        // checker floor
	    float ff = fract(time)*2.0;
        float f = mod( floor(1.5*pos.z+ff) + floor(1.5*pos.x), 2.0);
        vec3 col = 0.0 + 0.2*f+0.2*vec3(0.55,0.05,0.9)*0.7;
	    return col;
    }
    return vec3(0.15,0.03,0.22);
}

//------------------------------------------------------------------------
// Lighting
//------------------------------------------------------------------------
float calcSoftshadow( in vec3 ro, in vec3 rd );

vec3 doLighting( in vec3 pos, in vec3 nor, in vec3 rd, in float dis, in vec3 mal )
{
    vec3 lin = vec3(0.0);

    // key light
    //-----------------------------
    vec3  lig = normalize(vec3(0.4,0.35,0.7));		// dir
    float dif = max(dot(nor,lig),0.0);
    float sha = 0.0;
    if( dif>0.01 )
        sha=calcSoftshadow( pos+0.01*nor, lig );
    lin += dif*vec3(4.00,4.00,4.00)*sha;

    // ambient light
    //-----------------------------
    lin += vec3(0.50,0.50,0.50);

    float _s = 1.5;
	float spec = pow(dif, 160.0) *_s;

    // surface-light interacion
    //-----------------------------
    vec3 col = mal*lin;
        col+=spec;

    // fog
    //-----------------------------
	col *= exp(-0.01*dis*dis);

    return col;
}

vec2 calcIntersection( in vec3 ro, in vec3 rd )
{
	const float maxd = 30.0;           // max trace distance
	const float precis = 0.0001;        // precission of the intersection
    float h = precis*2.0;
    float t = 0.0;
	//float res = -1.0;
    vec2 res = vec2(-1.0,0.0);
    float c = 0.0;

    for( int i=0; i<120; i++ )          // max number of raymarching iterations is 90
    {
        if( h<precis||t>maxd ) break;
        vec2 res2 = doModel( ro+rd*t );
	    h = res2.x;
        c = res2.y;

        t += h*0.75;
    }

    if( t<maxd )
    {
        res.x = t;
        res.y = c;
    }
    return res;
}

vec3 calcNormal( in vec3 pos )
{
    const float eps = 0.001;             // precision of the normal computation

    const vec3 v1 = vec3( 1.0,-1.0,-1.0);
    const vec3 v2 = vec3(-1.0,-1.0, 1.0);
    const vec3 v3 = vec3(-1.0, 1.0,-1.0);
    const vec3 v4 = vec3( 1.0, 1.0, 1.0);

	return normalize( v1*doModel( pos + v1*eps ).x +
					  v2*doModel( pos + v2*eps ).x +
					  v3*doModel( pos + v3*eps ).x +
					  v4*doModel( pos + v4*eps ).x );
}

float calcSoftshadow( in vec3 ro, in vec3 rd )
{
    float res = 1.0;
    float t = 0.0005;                 // selfintersection avoidance distance
	float h = 1.0;
    for( int i=0; i<40; i++ )         // 40 is the max numnber of raymarching steps
    {
        h = doModel(ro + rd*t).x;
        res = min( res, 50.0*h/t );   // 64 is the hardness of the shadows
		t += clamp( h, 0.02, 2.0 );   // limit the max and min stepping distances
    }
    return clamp(res,0.0,1.0);
}

mat3 calcLookAtMatrix( in vec3 ro, in vec3 ta, in float roll )
{
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(sin(roll),cos(roll),0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    return mat3( uu, vv, ww );
}

//snow original -> http://glslsandbox.com/e#36547.1
float snow(vec2 uv,float scale)
{
    float _time = time*0.75;
	uv+=_time/scale;
    uv.y+=_time*2./scale;
    uv.x+=sin(uv.y+_time*.5)/scale;
	uv*=scale;
    vec2 s=floor(uv);
    vec2 f=fract(uv);
    float k=3.0;
	vec2 p =.5+.35*sin(11.*fract(sin((s+scale)*mat2(7.0,3.0,6.0,5.0))*5.))-f;
    float d=length(p);
    k=min(d,k);
	k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
   	return k;
}


vec3 _Snow(vec2 uv,vec3 background)
{
	float c = snow(uv,30.)*.3;
	c+=snow(uv,20.)*.5;
	c+=snow(uv,15.)*.8;
	c+=snow(uv,10.);
	c+=snow(uv,8.);
	c+=snow(uv,6.);
	c+=snow(uv,5.);
    c = clamp(c,0.0,1.0);
    vec3 scol = vec3(1.0,1.0,1.0);
    scol = mix(background,scol,c);
	return scol;
}


void main(void)
{

    vec2 p = (-resolution.xy + 2.0*gl_FragCoord.xy)/resolution.y;
    vec2 m = vec2(0.0);	//iMouse.xy/iResolution.xy;

    //-----------------------------------------------------
    // camera
    //-----------------------------------------------------

    // camera movement
    vec3 ro, ta;
    doCamera( ro, ta);

    // camera matrix
    mat3 camMat = calcLookAtMatrix( ro, ta, 0.0 );  // 0.0 is the camera roll

	// create view ray
	vec3 rd = normalize( camMat * vec3(p.xy,2.0) ); // 2.0 is the lens length

    //-----------------------------------------------------
	// render
    //-----------------------------------------------------

	//vec3 col = doBackground();
  	vec3 col = vec3(0.05);

	// raymarch
    vec2 res = calcIntersection( ro, rd );
    float t = res.x;
    if( t>-0.5 )
    {
        // geometry
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal(pos);

        // materials
        vec3 mal = doMaterial( pos, nor, res.y );

        col = doLighting( pos, nor, rd, t, mal );
	}

	//-----------------------------------------------------
	// postprocessing
    //-----------------------------------------------------
    // gamma
	col = pow( clamp(col,0.0,1.0), vec3(0.4545) );

	col = _Snow(p*0.5,col);

    gl_FragColor = vec4( col, 1.0 );
}


//void main( void ) {
//
//	vec2 position = ( gl_FragCoord.xy / resolution.xy ) + mouse / 4.0;
//
//	float color = 0.0;
//	color += sin( position.x * cos( time / 15.0 ) * 80.0 ) + cos( position.y * cos( time / 15.0 ) * 10.0 );
//	color += sin( position.y * sin( time / 10.0 ) * 40.0 ) + cos( position.x * sin( time / 25.0 ) * 40.0 );
//	color += sin( position.x * sin( time / 5.0 ) * 10.0 ) + sin( position.y * sin( time / 35.0 ) * 80.0 );
//	color *= sin( time / 10.0 ) * 0.5;
//
//	gl_FragColor = vec4( vec3( color, color * 0.5, sin( color + time / 3.0 ) * 0.75 ), 1.0 );
//}

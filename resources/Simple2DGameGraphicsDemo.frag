/*
 * Original shader from: https://www.shadertoy.com/view/sdtyzl
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
//por jorge2017a2

//referencia
//https://iquilezles.org/articles/distfunctions2d
///
#define antialiasing(n) n/min(iResolution.y,iResolution.x)
#define S(d,b) smoothstep(antialiasing(0.8),b,d)
#define S2(d,b) smoothstep(6.0*antialiasing(0.5),b,d)
#define PI     3.14159265
#define TWO_PI 6.28318530

float opRep1D( float p, float c )
	{ float q = mod(p+0.5*c,c)-0.5*c; return  q ;}

float intersectSDF(float distA, float distB)
	{ return max(distA, distB);}
float unionSDF(float distA, float distB)
	{ return min(distA, distB);}
float differenceSDF(float distA, float distB)
	{ return max(distA, -distB);}



vec3 DrawFigBorde(vec3 pColObj, vec3 colOut, float distObj )
{ colOut = mix(colOut,pColObj ,S2( distObj,0.0));
  colOut = mix(colOut,vec3(0.0) ,S2(abs( distObj)-0.005,0.0));
  return colOut;
}

vec3 DrawFigSolo(vec3 pColObj, vec3 colOut, float distObj )
{  colOut = mix(colOut,pColObj ,S( distObj,0.0)); return colOut; }


float sdBox( in vec2 p, in vec2 b )
{ vec2 d = abs(p)-b;  return length(max(d,0.0)) + min(max(d.x,d.y),0.0);  }

float sdCircle( vec2 p, float r )
{ return length(p) - r;}

float dot2( in vec2 v ) { return dot(v,v); }
float dot2( in vec3 v ) { return dot(v,v); }
float ndot( in vec2 a, in vec2 b ) { return a.x*b.x - a.y*b.y; }


float sdTunnel( in vec2 p, in vec2 wh )
{
    p.x = abs(p.x); p.y = -p.y;
    vec2 q = p - wh;

    float d1 = dot2(vec2(max(q.x,0.0),q.y));
    q.x = (p.y>0.0) ? q.x : length(p)-wh.x;
    float d2 = dot2(vec2(q.x,max(q.y,0.0)));
    float d = sqrt( min(d1,d2) );

    return (max(q.x,q.y)<0.0) ? -d : d;
}

vec3 CirculoBorde1(vec2 p, vec2 pos,  vec3 colOut, vec3 colIn)
{
    float d3= sdCircle(p-pos, 0.5 );
    float d4= sdCircle(p-pos, 0.3 );
    vec3 col= DrawFigBorde(vec3(0.0), colOut, d3 );
    col= DrawFigBorde(vec3(1.0), col, d4 );
    return col;
}


vec3 bloque1(vec2 p, vec3 colOut, vec3 colIn )
{   float r=0.5;
    float anchb=0.2,altob=0.2;
    float ancha=3.0,altoa=3.0;
    float d1= sdBox(p, vec2(ancha+anchb,altoa+altob) )-r;
    float d2= sdBox(p, vec2(ancha,altoa) )-r;
    vec3 col= DrawFigBorde(vec3(0.0), colOut, d1 );
    col *= 1.0 - 0.5*exp(-5.0*abs(d1)); //iq
    col= DrawFigBorde(colIn, col, d2 );
    col *= 1.0 - 0.5*exp(-5.0*abs(d2)); //iq

    p.x=abs(p.x)-2.3;
    p.y=abs(p.y)-2.3;
    col= CirculoBorde1(p, vec2(0.0,0.0), col,vec3(1.0));
    return col;
 }


vec3 bloque2(vec2 p, vec3 colOut, vec3 colIn )
{   float r=0.5;
    float anchb=0.2,altob=0.2;
    float ancha=3.0,altoa=5.0;
    float d1= sdBox(p, vec2(ancha+anchb,altoa+altob) )-r;
    float d2= sdBox(p, vec2(ancha,altoa) )-r;
    vec3 col= DrawFigBorde(vec3(0.0), colOut, d1 );
    col *= 1.0 - 0.5*exp(-5.0*abs(d1));
    col= DrawFigBorde(colIn, col, d2 );
    col *= 1.0 - 0.5*exp(-5.0*abs(d2));

    p.x=abs(p.x)-2.3;
    p.y=abs(p.y)-2.3;
    col= CirculoBorde1(p, vec2(0.0,1.8), col,colIn);
    return col;
 }


vec3 bloquePiso(vec2 p, vec3 colOut)
{   vec3 col1= vec3(173,104,47)/255.;
    float alto=1.3;
    float d1= sdBox(p, vec2(25.0,alto));
    float d2= sdBox(p, vec2(25.0-0.5,alto-0.3));

    vec3 col= DrawFigBorde(vec3(0.0), colOut,d1 );
    col= DrawFigBorde(col1, col,d2 );
    col *= 1.0 - 0.5*exp(-8.0*abs(d2));
    return col;
}

float bloqueZigzagDist(vec2 p)
{   p.x=p.y*0.5+0.5*sin(p.y)+mod(p.x,1.0)*6.0;
    float d1=p.x;
    float d2=p.x-2.;
    d1= differenceSDF(d2, d1);
    return d1;
}


vec3 bloquePisoLineas(vec2 p, vec3 colOut)
{   vec3 col1= vec3(173,104,47)/255.;
    float d1= sdBox(p, vec2(25.0,5.0));
    float d2= sdBox(p, vec2(25.0-0.5,5.0-0.2));
    float d3= bloqueZigzagDist(p-vec2(0.0,4.0));
    d3=  intersectSDF(d1, d3);
    vec3 col= DrawFigBorde(vec3(0.0), colOut,d1 );
    col= DrawFigBorde(col1, col,d2 );
    col *= 1.0 - 0.5*exp(-8.0*abs(d2));
    col= DrawFigBorde(vec3(0.0), col,d3 );
    return col;
}


vec3 bloqueZigzag(vec2 p, vec3 colOut)
{  vec3 col1= vec3(173,104,47)/255.;
    p.x=p.y*0.5+mod(p.x,1.0)*5.0;
    float d1=p.x;
    float d2=p.x-0.9;
    d1= differenceSDF(d2, d1);
    vec3 col= DrawFigBorde(vec3(0.0), colOut,d1 );
    return col;
}

vec3 distTunelcol(vec2 p, vec2 med, vec3 colOut)
{
    vec2 meddif=vec2(0.2,0.2);
    float d1a= sdTunnel(p, med );
    float d1b= sdTunnel(p, med-meddif );
    vec3 col= DrawFigBorde(vec3(0.0), colOut,d1a );
    col= DrawFigBorde(vec3(0.0,0.8,0.0), col,d1b );
    return col;
}

vec3 OjosDist(vec2 p,vec3 colOut)
{
    p.x=abs(p.x)-0.8;
    float d1= sdCircle( p, 0.25 );
    vec3 col= DrawFigBorde(vec3(0.0), colOut,d1 );
    return col;
}

vec3 planta(vec2 p, vec3 colOut)
{
    colOut= distTunelcol(p-vec2(3.0,3.0), vec2(2.0,6.0),colOut );
    colOut= OjosDist(p-vec2(3.0,3.2),colOut);
    colOut= distTunelcol(p, vec2(2.0,3.0), colOut );
    colOut= OjosDist(p-vec2(0.0,0.2),colOut);
    colOut= distTunelcol(p-vec2(3.0,-1.0), vec2(2.0,2.0),colOut );
    colOut= distTunelcol(p-vec2(6.0,1.0), vec2(2.0,4.0), colOut );
    colOut= distTunelcol(p-vec2(8.0,0.0), vec2(2.0,3.0), colOut );
    colOut= OjosDist(p-vec2(8.0,0.0),colOut);
    colOut= distTunelcol(p-vec2(5.0,-2.0), vec2(2.0,1.0),colOut );
    colOut= OjosDist(p-vec2(5.0,-2.0),colOut);
    vec3 col=colOut;
    return col;
}


vec3 Nube(vec2 p, vec3 colOut)
{
    vec2 p0=p;
    p.x=abs(p.x)-1.8;
    float d1= sdCircle( p, 1.25 );
    float d2= sdCircle( p0-vec2(0.0,1.0), 1.5 );
    float d3= sdBox(p0, vec2(0.5,0.1));

    vec3 col= DrawFigSolo(vec3(1.0), colOut,d1 );


    col *= 1.0 - 0.5*exp(-5.0*abs(d1));


    col= DrawFigSolo(vec3(1.0), col,d2 );
    col *= 1.0 - 0.5*exp(-5.0*abs(d2));
    col=OjosDist(p0-vec2(-0.2,1.2),col);

    col= DrawFigSolo(vec3(0.0), col,d3);

    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = -1.0 + 2.0 * fragCoord.xy/iResolution.xy;
	uv.x *= iResolution.x/iResolution.y;
    uv-=vec2(0.0,-0.1);
    float esc=14.0;
    vec2 uv0=uv;
    uv*=esc;
    vec3 col =vec3(105,156,248)/255.0-uv0.y*0.25;

    vec3 col1;
    col=bloquePisoLineas(uv-vec2(0.0,-11.0),col);
    col1=vec3(88.,200.,246.)/255.0;
    col= bloque2(uv-vec2(4.5,2.0), col,col1 );
    col1=vec3(245.0,144.,72.0)/255.;
    col= bloque1(uv, col,col1 );
    col=bloquePiso(uv-vec2(0.0,-5.0), col);
    col= planta(uv-vec2(-15.0,-0.7), col);
    float posx=5.0*sin(iTime);
    col= Nube(uv-vec2(-9.0+posx,7.0), col);
    col= Nube(uv-vec2(5.0-posx,9.0), col);

    col=pow(col,  vec3(0.554545));
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

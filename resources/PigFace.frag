/*
 * Original shader from: https://www.shadertoy.com/view/NsXfzH
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
#define PI                 3.14159

#define BREATHE_SPEED      1.0
#define SACCADE_FREQUENCY  1.2
#define SACCADE_SPEED      7.0
#define BLINK_PERIOD       5.0
#define BLINK_SPEED        3.0

#define SCALE_FACTOR       1.0
#define STROKE_WEIGHT      0.01
#define EYE_SPACE          0.5


float distancetocoverage( float d ) {
    return clamp(d/SCALE_FACTOR*iResolution.y+0.5, 0.0, 1.0);
}


float circle( vec2 uv, vec2 p, float r ) {
    float d = r - distance(uv,p);
    return distancetocoverage(d);
}


float circlestroke( vec2 uv, vec2 p, float r, float t ) {
    float d = r - distance(uv,p);
    d = t - abs(d);
    return distancetocoverage(d);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord.xy/iResolution.xy*2.0 - 1.0;	// camera-space position (-1 => 1)
    uv.y *= iResolution.y/iResolution.x;

    //breathing
    float breathe = sin(iTime*BREATHE_SPEED);

    //saccades
    float sn = floor(iTime*SACCADE_FREQUENCY);
    vec2 saccade = (1.0-abs(cos(sn*67.0))) * vec2(cos(sn*PI*1.618),sin(sn*PI*1.618));
    sn++;
    vec2 nextsaccade = (1.0-abs(cos(sn*67.0))) * vec2(cos(sn*PI*1.618),sin(sn*PI*1.618));
    float st = max( (fract(iTime*SACCADE_FREQUENCY)-1.0)*SACCADE_SPEED+1.0, 0.0);
    saccade = mix( saccade, nextsaccade, st*st*(3.0-(2.0*st)) );
    saccade.x *= sign(uv.x);   //flip one eye so that it moves in the same direction after mirroring

    //blinking
    float bt = max( mod(iTime,BLINK_PERIOD)-BLINK_PERIOD+1.0, 0.0 );
    float b = max( (fract(bt)-1.0)*BLINK_SPEED+1.0, 0.0 ) ;
    float blink = 9.5212*b*(b-0.8)*(b-1.0); // animating with a cubic function for a nice little 'bounce' at the end

    uv.y += 0.05-0.005*breathe;
    uv *= SCALE_FACTOR;
    uv.x = -abs(uv.x) + EYE_SPACE;                                       // mirror
    float r = (0.15+blink*0.02)*PI;
    vec2 ruv = vec2( uv.x*cos(r)-uv.y*sin(r), uv.x*sin(r)+uv.y*cos(r) ); // rotated space for outer eye
    vec2 buv = vec2( ruv.x, ruv.y/(1.0-blink) );                         // squashed space for blinking eyes

    float aperture = circle( buv, vec2(0.0), 0.25-STROKE_WEIGHT );       // eyelid coverage

    float eyelids = 0.0;
    eyelids += circle( buv,vec2(-0.04,0.0),0.3 ) * distancetocoverage(ruv.y);                       // upper lashes
    eyelids += circle( buv,vec2(-0.04,0.0),0.25 ) * distancetocoverage(-max(ruv.x,ruv.y));          // lower lashes
    eyelids += circle( buv, vec2(0.25,0.0), 0.04 );                                                 // lacrimal caruncle
    eyelids += circlestroke( ruv,vec2(0.0),0.325,STROKE_WEIGHT) * circle(ruv,vec2(0.0,0.4),0.375 ); // eye socket upper arch
    eyelids *= 1.0-aperture;

    float eyeball = 0.0;
    vec2 ip = vec2(0.03-blink*0.01, -blink*0.05) + saccade*0.01;
    eyeball += circlestroke( uv, ip, 0.18, STROKE_WEIGHT );                         // limbal ring
    eyeball += circle( uv, ip, 0.18 ) * (1.0-circle( uv, ip-vec2(0.0,0.5), 0.5 ));  // shadow on upper iris
    eyeball += circle( uv, ip, 0.13+blink*0.02 );                                   // pupil
    float glint = circle( uv, ip, 0.025+blink*0.005 );                              // highlight
    eyeball *= 1.0-glint;
    float iriscoverage = circle( uv, ip, 0.18+STROKE_WEIGHT ) * (1.0-glint);
    eyeball *= aperture;

    float eyebrows = circle(uv,vec2(0.125,-0.05-blink*0.005),0.6) * (1.0-circle(uv,vec2(0.0),0.4)) * circle(uv,vec2(-0.3+blink*0.01,1.2),1.0);

    float nose = 0.0;
    float nh = -0.2+blink*0.002;
    nose += circlestroke( uv, vec2(EYE_SPACE,nh), 0.125, STROKE_WEIGHT ) * circle(uv,vec2(EYE_SPACE,nh+0.4),0.4); //nose
    nose += circle( uv, vec2(EYE_SPACE-0.05,nh+0.02), STROKE_WEIGHT*2.0+0.001*breathe );                          //nostril

    float mouth = 0.0;
    float mh = -0.2;
    mouth += circlestroke( uv, vec2(EYE_SPACE,mh+0.05), 0.25, STROKE_WEIGHT ) * distancetocoverage(mh-uv.y);                             //smile curve
    mouth += circle( uv, vec2(EYE_SPACE-0.245,mh), STROKE_WEIGHT*(2.0+blink*0.1) );                                                      //mouth corners
    //mouth += circlestroke( uv, vec2(EYE_SPACE,-0.9+blink*0.002), 0.625, STROKE_WEIGHT*1.0 ) * circle( uv, vec2(EYE_SPACE,-0.15), 0.25 ); //upper lip
    //aperture += circle( uv, vec2(EYE_SPACE,-0.9+blink*0.002), 0.625 ) * circle( uv, vec2(EYE_SPACE,-0.15), 0.25 );

    float face = 0.0;
    face += eyelids;
    face += eyeball;
    face += eyebrows;
    face += nose;
    face += mouth;
    face = clamp( face, 0.0, 1.0 );

    vec3 col = vec3(1.0,0.6,0.4);
    col -= vec3(0.0,0.35,0.3) * clamp(1.0-distance(uv*vec2(1.0,2.5),vec2(EYE_SPACE,-0.3)),0.0,1.0);  //blush
    col = mix(col, mix(vec3(1.0), vec3(0.1,0.7,1.0), iriscoverage), aperture);  //eye colours
    //col *= circle( uv*vec2(1.0,1.5+blink*0.02), vec2(EYE_SPACE,0.15), 1.0 );
    col *= 1.0-face;
    col = pow( col, vec3(0.45) );				//gamma adjustment
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

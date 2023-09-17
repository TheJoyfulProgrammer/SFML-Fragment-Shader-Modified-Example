/*
 * Original shader from: https://www.shadertoy.com/view/ss3fRf
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
// Constants

// Distance stuff
const int   MAX_STEPS = 100;
const float MAX_DIST  = 100.0;
const float MIN_DIST  = 0.001;

// Math constants
const float TAU = 6.28318530718;

// Colors
const vec3 COLOR_TABLE_1    = vec3(1.0, 0.375, 0.5625);
const vec3 COLOR_TABLE_2    = vec3(1.0, 0.7, 0.9);
const vec3 COLOR_CAKE       = vec3(1.0, 0.75, 0.3);
const vec3 COLOR_ICING      = vec3(1.0, 1.0, 0.98);
const vec3 COLOR_STRAWBERRY = vec3(1.0, 0.0, 0.1);
const vec3 COLOR_STAR       = vec3(1.0, 0.9, 0.0);
const vec3 COLOR_PLATE      = vec3(0.98);
const vec3 COLOR_CHERRY_1   = vec3(0.8, 0.3, 0.05);
const vec3 COLOR_CHERRY_2   = vec3(0.95, 0.65, 0.0);

// Materials
const float MTRL_TABLE      = 0.0;
const float MTRL_CAKE       = 1.0;
const float MTRL_ICING      = 2.0;
const float MTRL_STRAWBERRY = 3.0;
const float MTRL_STAR       = 4.0;
const float MTRL_PLATE      = 5.0;
const float MTRL_EYES       = 6.0;
const float MTRL_CHERRY     = 7.0;

// Lighting
const vec3  LIGHT_DIR = normalize(vec3(0.1, 1.0, -0.1));
const float FOG_START = 3.0;
const float FOG_END   = 5.0;

float remap(float x, float from1, float to1, float from2, float to2) {
    return (x - from1) / (to1 - from1) * (to2 - from2) + from2;
}

float linearstep(float a, float b, float t) {
    return clamp((t - a) / (b - a), 0.0, 1.0);
}


mat2 rotate(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5*(a-b)/k, 0.0, 1.0);
    return mix(a, b, h) - k*h*(1.0-h);
}


float sdStar(vec3 p, vec3 star, vec3 size, float k) {
    p = p - star;
    p.x = abs(p.x);

    float a = TAU/5.0;
    float d1 = dot(p, vec3(sin(a), cos(a), 0.0));
    a = 3.0*TAU/5.0;
    float d2 = dot(p, vec3(sin(a), cos(a), 0.0));
    a = 2.0*TAU/5.0;
    float d4 = dot(p, vec3(sin(a), cos(a), 0.0));

    float d = min(max(d1, d2), max(p.y, d4));
    return max(d-size.y, abs(p.z) - size.z);
}

float sdBox(vec3 p, vec3 s) {
    p = abs(p)-s;
	return length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);
}

float sdSprinkles(vec3 p) {
    float a = atan(p.x, p.z);

    float i = (a / TAU) * 10.0;



    return a;
}


float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
	vec3 ab = b-a;
    vec3 ap = p-a;

    float t = dot(ab, ap) / dot(ab, ab);
    t = clamp(t, 0., 1.);

    vec3 c = a + t*ab;

    return length(p-c)-r;
}

float sdNumber(int n, vec3 p, vec3 pos, vec3 size) {
    p = p - pos;


    bool s1, s2, s3, s4, s5, s6, s7, s8, s9;

    float d = MAX_DIST;

    if (n == 0) { s1 = true; s2 = true; s3 = true; s4 = true; s5 = true; s6 = true; }
    if (n == 1) { s2 = true; s3 = true; }
    if (n == 2) { s1 = true; s2 = true; s4 = true; s5 = true; s7 = true; }
    if (n == 3) { s1 = true; s2 = true; s3 = true; s4 = true; s7 = true; }
    if (n == 4) { s2 = true; s3 = true; s7 = true; s8 = true; }
    if (n == 5) { s1 = true; s3 = true; s4 = true; s6 = true; s7 = true; }
    if (n == 6) { s3 = true; s4 = true; s5 = true; s7 = true; s8 = true; }
    if (n == 7) { s1 = true; s2 = true; s3 = true; }
    if (n == 8) { s1 = true; s2 = true; s3 = true; s4 = true; s5 = true; s6 = true; s7 = true; }
    if (n == 9) { s1 = true; s2 = true; s6 = true; s7 = true; s9 = true; }

    vec4 s = vec4(vec3(0.5, 1.0, 2.0) * size.xyy, size.z);

    if (s1) d = min(d, sdCapsule(p, vec3(-s.x+s.w, s.z, 0.0), vec3(s.x-s.w, s.z, 0.0), s.w));
    if (s2) d = min(d, sdCapsule(p, vec3(s.x, s.y+s.w, 0.0), vec3(s.x, s.z-s.w, 0.0), s.w));
    if (s3) d = min(d, sdCapsule(p, vec3(s.x, 0.0+s.w, 0.0), vec3(s.x, s.y-s.w, 0.0), s.w));
    if (s4) d = min(d, sdCapsule(p, vec3(-s.x+s.w, 0.0, 0.0), vec3(s.x-s.w, 0.0, 0.0), s.w));
    if (s5) d = min(d, sdCapsule(p, vec3(-s.x, 0.0+s.w, 0.0), vec3(-s.x, s.y-s.w, 0.0), s.w));
    if (s6) d = min(d, sdCapsule(p, vec3(-s.x, s.y+s.w, 0.0), vec3(-s.x, s.z-s.w, 0.0), s.w));
    if (s7) d = min(d, sdCapsule(p, vec3(-s.x+s.w, s.y, 0.0), vec3(s.x-s.w, s.y, 0.0), s.w));
    if (s8) d = min(d, sdCapsule(p, vec3(-s.x+s.w, s.y+s.w, 0.0), vec3(s.x-s.w, s.z-s.w, 0.0), s.w));
    if (s9) d = min(d, sdCapsule(p, vec3(-s.x+s.w, 0.0+s.w, 0.0), vec3(s.x-s.w, s.y-s.w, 0.0), s.w));


    return d;
}


float sdCylinder(vec3 p, vec3 a, vec3 b, float r, float k) {
	vec3 ab = b-a;
    vec3 ap = p-a;
    float t = dot(ab, ap) / dot(ab, ab);
    vec3 c = a + t*ab;
    float x = length(p-c)-r;
    float y = (abs(t-.5)-.5)*length(ab);
    float e = length(max(vec2(x, y), 0.));
    float i = smin(max(x, y), 0., k);

    return e + i;
}

float sdPlane(vec3 p, vec4 plane) {
	return dot(p, plane.xyz) - plane.w;
}

vec3 camDirection(vec3 forward, vec2 uv) {
    vec3 right = cross(vec3(0.0, 1.0, 0.0), forward),
         up = cross(forward, right);
    return normalize(forward + right*uv.x + up*uv.y);
}

vec2 getDist(vec3 p) {
	vec2 d;

    d.x = MAX_DIST;

    float distStar = min(sdStar(p, vec3(0.0, 2.5, 0.0), vec3(0.2, 0.1, 0.05), 0.1),
                         sdStar(abs(p), vec3(0.6, 2.3, 0.0), vec3(0.1, 0.05, 0.05), 0.1));
    //distStar = min(distStar, sdNumber(2, p, vec3(-0.3, 1.12, -0.9), vec3(0.25, 0.25, 0.05)));
    //distStar = min(distStar, sdNumber(2, p, vec3(0.3, 1.12, -0.9), vec3(0.25, 0.25, 0.05)));

    vec3 pEyes = p;
    pEyes.x = abs(pEyes.x);

    float distEyes = sdCapsule(pEyes, vec3(0.05, 2.5, -0.05), vec3(0.05, 2.55, -0.05), 0.02);
    pEyes = pEyes - vec3(0.6, 0.0, 0.0);
    pEyes.x = abs(pEyes.x);
    distEyes = min(distEyes, sdCapsule(pEyes, vec3(0.025, 2.31, -0.05), vec3(0.025,2.33, -0.05), 0.015 ));



    float distCake = min(sdCylinder(p, vec3(0.0), vec3(0.0, 1.0, 0.0), 1.0, 0.3),
                         sdCylinder(p, vec3(0.0), vec3(0.0, 2.0, 0.0), 0.7, 0.3));

    float icing = -abs(sin(atan(p.x, p.z)*6.0)) * 0.125;
    float distIcing = min(sdCylinder(p, vec3(0.0, 0.6+icing, 0.0), vec3(0.0, 1.05, 0.0), 1.05, 0.3),
                          sdCylinder(p, vec3(0.0, 1.6+icing, 0.0), vec3(0.0, 2.05, 0.0), 0.75, 0.3));

    float distTable = sdPlane(p, vec4(0.0, 1.0, 0.0, 0.0));


    float distStrawberry = MAX_DIST;

    vec3 p2 = p;
    float a = mod(atan(p.z, p.x) + TAU*0.125*0.5, TAU*0.125) - TAU*0.125*0.5;
    p2.x = cos(a) * length(p.xz);
    p2.z = sin(a) * length(p.xz);
    float dimples = 0.0;
    float distBerry = smin(length(p2 - vec3(0.9, 1.25, 0.0)) - 0.1 + dimples,
                           length(p2 - vec3(0.9, 1.35, 0.0)) - 0.06 + dimples,
                           0.05);
    distStrawberry = min(distStrawberry, distBerry);

    vec3 pWhipped = vec3(0.9, 1.1, 0.0) - p2;
    pWhipped.xz *= rotate(pWhipped.y*10.0);
    distIcing = min(distIcing, sdBox(pWhipped, vec3(0.12)));
    pWhipped = vec3(0.6, 2.15, 0.0) - p2;
    pWhipped.xz *= rotate(pWhipped.y*10.0);
    distIcing = min(distIcing, sdBox(pWhipped, vec3(0.1)));
    pWhipped = vec3(0.0, 2.1, 0.0) - p;
    pWhipped.xz *= rotate(pWhipped.y*10.0);
    distIcing = min(distIcing, sdBox(pWhipped, vec3(0.25)));

    float distPlate = min(sdCylinder(p, vec3(0.0), vec3(0.0, 0.05, 0.0), 1.75, 0.2),
                          sdCylinder(p, vec3(0.0), vec3(0.0, 0.1, 0.0), 1.25-icing, 0.1));


    vec3 pCherry = p;
    pCherry.xz = abs(pCherry.xz);
    float distCherry = length(pCherry - vec3(0.3, 2.2, 0.3)) - 0.15;

    d.x = min(d.x, distTable);
    d.x = min(d.x, distCake);
    d.x = min(d.x, distIcing);
    d.x = min(d.x, distStrawberry);
    d.x = min(d.x, distStar);
    d.x = min(d.x, distPlate);
    d.x = min(d.x, distEyes);
    d.x = min(d.x, distCherry);

    if (d.x == distTable)      d.y = MTRL_TABLE;
    if (d.x == distCake)       d.y = MTRL_CAKE;
    if (d.x == distIcing)      d.y = MTRL_ICING;
    if (d.x == distStrawberry) d.y = MTRL_STRAWBERRY;
    if (d.x == distStar)       d.y = MTRL_STAR;
    if (d.x == distPlate)      d.y = MTRL_PLATE;
    if (d.x == distEyes)       d.y = MTRL_EYES;
    if (d.x == distCherry)     d.y = MTRL_CHERRY;

    return d;
}


vec2 rayMarch(vec3 rO, vec3 rD) {
	vec2 dO;

    float t = 0.;
    for(int i = 0; i < 100; i++) {
        if (t >= MAX_DIST) break;
        vec2 dS = getDist(rO + rD * t);
        t += dS.x;
        if (dS.x < MIN_DIST) {
            dO.y = dS.y;
            break;
        }
    }

    dO.x = t;
    return dO;
}

// Get shadow amount
float rayMarchShadow(vec3 rO, vec3 rD, float k) {
    float res = 1.0;
    float t = 0.0;
    for(int i = 0;i < 100; i++) {
        if (t >= MAX_DIST) break;
        float d = getDist(rO + rD * t).x;
        if (d < MIN_DIST) { return 0.0; }
        res = min(res, k*d/t);
        t += d;
    }
    return res;
}

// Get normal of point
vec3 getNormal(vec3 p) {
    const vec2 e = vec2(0.001, 0.0);
	vec3 n = getDist(p).x - vec3(
	         getDist(p - e.xyy).x,
			 getDist(p - e.yxy).x,
			 getDist(p - e.yyx).x);

	return normalize(n);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec3 col;

    vec2 uv = (fragCoord-iResolution.xy*0.5)/iResolution.y;

    vec2 dir = vec2(iTime*0.5, 0.5); // Spinning camera
    if (iMouse.z > 0.0) { // Mouse control
        dir = vec2((iMouse.x/iResolution.x - 0.5) * TAU,
                    iMouse.y/iResolution.y);
    }
    vec3 rO = vec3(sin(dir.x), dir.y, -cos(dir.x)) * 5.0; // Ray origin
    vec3 rT = vec3(0.0, 1.2, 0.0); // Ray target
    vec3 rD = camDirection(normalize(rT - rO), uv); // Ray direction

    vec2 res = rayMarch(rO, rD);

    if (res.x < MAX_DIST) {
        vec3 p = rO + rD * res.x;

        vec3 n = getNormal(p);
        vec3 nReflect = reflect(rD, n);
        float lightSpecular = max(dot(nReflect, LIGHT_DIR), 0.0);


        bool doLighting = true;

        if (res.y == MTRL_TABLE) { // Table
            float v = (floor(mod(p.x*2.0, 2.0)) + floor(mod(p.z*2.0, 2.0))) * 0.5;
            col = mix(COLOR_TABLE_1, COLOR_TABLE_2, v);
        } else if (res.y == MTRL_CAKE) { // Cake
            col = COLOR_CAKE;
        } else if (res.y == MTRL_ICING) { // Icing
            col = COLOR_ICING;
        } else if (res.y == MTRL_STRAWBERRY) { // Strawberry
            col = COLOR_STRAWBERRY;
            col += lightSpecular * 0.5;
        } else if (res.y == MTRL_STAR) { // Star
            col = COLOR_STAR;
            doLighting = false;
        } else if (res.y == MTRL_PLATE) { // Plate
            col = COLOR_PLATE;
            col += lightSpecular;
        } else if (res.y == MTRL_EYES) { // Star eyes
            col = vec3(0);
            col += lightSpecular;
        } else if (res.y == MTRL_CHERRY) { // Cherry
            col = mix(COLOR_CHERRY_1, COLOR_CHERRY_2, clamp(n.y + 0.5, 0.0, 1.0));
            col += lightSpecular * 0.25;
        }

        col = min(col, 1.0); // Clamp colors

        // Lighting
        if (doLighting) {
            float shade = max(dot(n, LIGHT_DIR), 0.0); // N dot L
            if (shade > 0.0) shade *= rayMarchShadow(p+n*0.1, LIGHT_DIR, 16.0); // Shadows

            col *= remap(shade, 0.0, 1.0, 0.8, 1.0);
        }

        col *= linearstep(FOG_END, FOG_START, length(p)); // Add "fog" fade
    }

    fragColor = vec4(col, 1.0); // Final output
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

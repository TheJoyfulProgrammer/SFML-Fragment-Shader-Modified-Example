/*
 * Original shader from: https://www.shadertoy.com/view/NlScRy
 */

#extension GL_OES_standard_derivatives : enable

#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// Emulate some GLSL ES 3.x
float trunc(float x) {
    return sign(x)*floor(abs(x));
}

// --------[ Original ShaderToy begins here ]---------- //
// 'Revised Reality' dean_the_coder (Twitter: @deanthecoder)
// https://www.shadertoy.com/view/NlScRy
// https://demozoo.org/graphics/307496/
// https://www.pouet.net/prod.php?which=91388
//
// Entered into the Revision 2022 4Kb Executable Graphics compo.
// (First ever compo entry!)
//
// Processed using GLSL Shader Shrinker, and compressed into an exe
// with Crinkler.
// (https://github.com/deanthecoder/GLSLShaderShrinker)
//
// Thanks to Evvvvil, Flopine, Nusan, BigWings, Iq, Shane
// and a bunch of others for sharing their knowledge!

#define LIGHT_RGB	vec3(1.2, 1., 1.)
#define SPOT_RGB	vec3(1.56, 1.1, 1.)
#define SKY_RGB	vec3(.45, .4, .35) * .05
#define ISLE_RGB	vec3(1, 1.4, 0)
#define R	iResolution
#define sat(x)	clamp(x, 0., 1.)
#define S(a, b, c)	smoothstep(a, b, c)
#define S01(a)	S(0., 1., a)
#define minH(a, b)	{ float h_ = a; if (h_ < h.x) h = vec2(h_, b); }
#define MN(a)	d = min(d, a)
#define Z0	0.

vec3 g;
float n31(vec3 p) {
	const vec3 s = vec3(7, 157, 113);

	// Thanks Shane - https://www.shadertoy.com/view/lstGRB
	vec3 ip = floor(p);
	p = fract(p);
	p = p * p * (3. - 2. * p);
	vec4 h = vec4(0, s.yz, s.y + s.z) + dot(ip, s);
	h = mix(fract(sin(h) * 43758.545), fract(sin(h + s.x) * 43758.545), p.x);
	h.xy = mix(h.xz, h.yw, p.y);
	return mix(h.x, h.y, p.z);
}

float fbm(vec3 p) {
	float a = 0.,
	      b = .5;
	for (float i = Z0; i < 4.; i++) {
		a += b * n31(p);
		b *= .5;
		p *= 2.;
	}

	return a * .5;
}

float smin(float a, float b, float k) {
	float h = sat(.5 + .5 * (b - a) / k);
	return mix(b, a, h) - k * h * (1. - h);
}

float min2(vec2 v) { return min(v.x, v.y); }

float max3(vec3 v) { return max(v.x, max(v.y, v.z)); }

bool intPlane(vec3 ro, vec3 rd, out float t) {
	float z = -rd.z;
	t = (ro.z - 6.) / z;
	return t >= 0. && abs(z) > 1e-4;
}

mat2 rot(float a) {
	// Thanks Fabrice.
	return mat2(cos(a + vec4(0, 11, 33, 0)));
}

float opRep(float p, float c) {
	float c2 = c * .5;
	return mod(p + c2, c) - c2;
}

float box(vec3 p, vec3 b) {
	vec3 q = abs(p) - b;
	return length(max(q, 0.)) + min(max3(q), 0.);
}

vec3 rayDir(vec2 uv) {
	vec3 f = vec3(.034, .15325, 0.9876),
	     r = vec3(0.9994, 0, -0.0344);
	return normalize(f * 1.1 + r * uv.x + cross(f, r) * uv.y);
}

float pie(vec3 q, float t, float r, float a){
    vec2 p = q.xy,
         c = vec2(sin(t), cos(t));
    p *= rot(a * -6.28);
    p.x = abs(p.x);
    float l = length(p),
          m = length(p-c*clamp(dot(p,c),0.0,r)),
          d = max(l - r,m*sign(c.y*p.x-c.x*p.y));
    return max(d, r - l - 0.2);
}

float logo(vec3 p) {
	p.y += .05;
	p.z += .2;
	p.xz *= rot(0.2);
	p.yz *= mat2(cos(.8 + vec4(0, 11, 33, 0)));

	// Inner circle.
	float l = length(p.xy),
	      d = abs(l - .3) - .1;
	MN(pie(p, .4, .55, .625));

	// Middle circle.
	MN(abs(l - .8) - .05);
	MN(pie(p, 1., .85, .05));
	MN(pie(p, 1., .85, .4));
	MN(pie(p, .6, .85, .8));
	MN(pie(p, .3, .72, .4));

	// Outer circle.
	MN(abs(l - 1.2) - .052);
	MN(pie(p, .6, 1.25, .7));
	MN(pie(p, .07, 1.3, .63));
	MN(pie(p, .2, 1.25, .5));

	// Crop depth.
	return smin(d - 0.01, abs(p.z) - .08, -.04) - .002 * n31(p * 40.);
}

float rip(vec2 p) { return 0.07 * pow(S(0.4, 0.05, length(p * vec2(1, 1.4))), 3.0); }

float exit(vec3 p) {
	p.x += 0.2;
	vec3 q = p;

	// E
	float f = box(q, vec3(0.06, 0.14, 0.1));
	q.x -= 0.03;
	q.y = abs(q.y) - 0.05;
	f = max(f, -box(q, vec3(0.06, 0.04, 1.)));

	// X
	q = p;
	q.x -= .16;
	q.xy = abs(q.xy);
	q.xy *= rot(-0.4);
	f = min(f, box(q, vec3(0.02, 0.15, 0.1)));

	// I
	q = p;
	q.x -= .15 * 2.;
	f = min(f, box(q, vec3(0.02, 0.15, 0.1)));

	// T
	q.x -= .14;
	f = min(f, box(q, vec3(0.02, 0.15, 0.1)));
	q.y -= 0.13;
	f = min(f, box(q, vec3(0.06, 0.04, 0.1)));
	return max(f, abs(p.y) - 0.12);
}

float bolt(vec3 p, vec3 b, float m) {
	p.x -= m;
	float h = clamp(dot(p, b) / dot(b, b), 0.0, 1.0);
	return length(p - b * h) - 0.009;
}

vec2 map(vec3 p) {
	// Screen.
	float d,
	      f = sin(length(p.xy * rot(-0.2) * vec2(15, 55)));
	f *= S(2., .5, abs(p.x)) * S(.7, .3, abs(p.y - .1));
	f *= .3 + .7 * S(0., .5, p.y);
	f *= .0024;
	f += rip(p.xy - vec2(-1.15, 0.3));
	f += rip(p.xy - vec2(-.72, 0.21));
	f += rip(p.xy - vec2(.75, -0.1));
	f += rip(p.xy - vec2(1.2, -0.15));
	vec2 h = vec2(box(p, vec3(1.8, .9, .1 + f)), 1);

	// Screen frame.
	minH(max(box(p, vec3(1.85, .95, .15)), -box(p, vec3(1.8, .9, 1))), 5);

	// Logo
	d = logo(p);
	g.x += .0025 / (.11 + d * d * d * d);
	minH(smin(d, h.x, .03), 2);

	// Stage top.
	minH(box(p + vec3(0, 1.2, -1), vec3(3, .05, 1)), 5);

	// Stage bottom.
	minH(box(p + vec3(0, 2.2, -1), vec3(2.8, 1, .9)) - .02, 6);

	// Hall.
	d = -box(p - vec3(0, 2.15, 0), vec3(12. + sin(p.z * 10.) * .01, 4. + .005 * n31(p * 50.), 19));

	// Steps.
	float ns = 0.0002 * n31(p * vec3(1, 300, 1)) + 0.008;
	for (float i = .1; i < .7; i += .1)
		MN(box(p + vec3(0, 1.2 + i, i - 1.), vec3(.6, .05, 1)) - ns);

	// Screen stand.
	vec3 q = p;
	q.x = abs(abs(q.x) - 1.5) - .1;
	q.y++;
	q.z--;
	MN(box(q, vec3(.001, 1, .01)) - .03);
	minH(d, -1);

	// Stage speakers.
	q = p;
	q.x = abs(q.x);
	q -= vec3(2.5, -1.1, .5);
	q.xz *= mat2(cos(.5 + vec4(0, 11, 33, 0)));
	f = q.z;
	q.yz *= mat2(cos(.6 + vec4(0, 11, 33, 0)));
	f = max(box(q, vec3(.3, .2, .2)), -f - .15);
	f = smin(f, -box(q + vec3(0.39, -0.14, 0), vec3(.1, 0.02, .06)), -0.02);
	ns = n31(p * 200.);
	minH(f - .01 - ns * 0.0005, 7);

	// Seats.
	if (p.z < 0.0) {
		q = p;
		q.x = abs(q.x) - 2.;
		q.x = abs(q.x) - .4;
		q.x = abs(q.x) - .4;
		q.x = abs(q.x) - .2;
		q.y += 1.8 - .3 * S(2.9, 8.8, trunc((p.z + .2) / -.6));
		q.z = opRep(q.z, .6);
		q.z += 0.04 * S(0.0, 0.2, p.y + 1.64);
		q.z += .12 * cos(q.x * 4.5) - 0.23125;
		f = box(q - vec3(.14, .2, .14), vec3(.05, .01, .12));
		f = min(box(q, vec3(.16 - .08 * S(0.28, 0.65, q.y), .45, .005)), f);
		f += .0006 * ns;
		f = max(p.z + 1., min(f, box(q - vec3(.14, .05, .14), vec3(.01, .14, .12))) - .02);
		minH(f * 0.9, 3);

		// Cup holders.
		q = p;
		q.x = abs(q.x) - 0.85;
		q.y += 1.58 - 0.33 * S(2.9, 8.8, trunc(p.z / -.6));
		q.z = opRep(q.z + 0.3, .6);
		f = abs(length(q.xz) - 0.05) - 0.002;
		f = smin(f, (abs(q.y) - 0.02), -0.006);
		minH(max(p.z + 1., f), 7);
	}

	// Lights.
	q = p;
	q.x = abs(abs(q.x) - 5.) - 2.5;
	q.y -= 6.2;
	q.z = opRep(q.z + 2., 8.);
	f = length(q - vec3(0, .2, 0)) - .3;
	g.x += .002 / (.001 + f * f);
	minH(f, 4);

	// Dolby speakers.
	q = p;
	q.z = opRep(p.z, 3.2);
	q.x = abs(q.x);
	q -= vec3(11.9, 4, 1);
	f = cos(q.y) * 0.2 + q.y * 0.1;
	f += sin(q.y * 50.) * 0.006;
	f = box(q, vec3(f * step(q.x, 0.0), .6, .5)) - 0.1;
	minH(f, 8);

	// Isle lights.
	q = p;
	q.x = abs(q.x);
	q += vec3(-0.71, 1.95, 1.85);
	q.z = abs(q.z) - .5;
	q.z = abs(q.z) - .25;
	f = box(q, vec3(0.005, .1, 0.03));
	g.y += .000004 / (.0001 + f * f);
	minH(f, 9);
	if (p.z > 10.0) {
		// EXITs.
		q = p;
		q.y += 0.8;
		q.z -= 18.8;
		f = exit(q - vec3(10.4 * sign(p.x), 1.3, 0)); // EXIT words.
		g.z += .00004 / (.00001 + f * f);
		minH(f, 9);
		q.x = abs(q.x) - 10.4;
		f = box(q, vec3(0.9, 0.95, .1)); // Frame
		f = min(f, box(q - vec3(0, 1.3, 0), vec3(.4, .15, .05))); // EXIT box.
		q.yz += 0.1;
		minH(max(f - 0.02, -box(q, vec3(0.8, 1, 0.2))), 8); // Cut-out.
		q.x = abs(q.x) - 0.4;
		q.z -= 0.12;
		minH(box(q, vec3(0.39, 1, 0.01)), 10); // Doors.
		q.z += 0.05;
		f = box(q, vec3(0.32, .01, 0.0));
		f = min(f, box(q - vec3(0.32, 0.04, 0.05), vec3(0.01, .04, 0.0)));
		minH(f - 0.03, 7); // Push-bar.
	}
	else {
		// Lightning.
		f = fbm(p * 8.) * .2;
		d = bolt(p + vec3(.71, .75, 1.85), vec3(-1, -2, 1), f);
		MN(bolt(p + vec3(-.8, .7, .8), vec3(0, -1.2, -0.1), f));
		minH(d, 11);
		g.x += (1. + 3. * S(0.07, .0, abs(p.y + 1.0))) * .00005 / (.001 + d * d);
	}

	return h;
}

vec3 N(vec3 p) {
	float h = dot(p, p) * .01;
    vec2 e = .005773 * vec2(1., -1.);
    return normalize(
        e.xyy * map(p + e.xyy * h).x +
        e.yyx * map(p + e.yyx * h).x +
        e.yxy * map(p + e.yxy * h).x +
        e.xxx * map(p + e.xxx * h).x);
}

float shadow(vec3 p) {
	float d,
	      s = 1.,
	      t = .05,
	      mxt = length(p - vec3(1, 1, -3.6));
	vec3 ld = normalize(vec3(1, 1, -3.6) - p);
	for (float i = Z0; i < 50.; i++) {
		d = map(t * ld + p).x;
		s = min(s, 15. * d / t);
		t += max(.02, d);
		if (mxt - t < .5 || s < .001) break;
	}

	return S01(s);
}

float aof(vec3 p, vec3 n, float h) { return sat(map(h * n + p).x / h); }

float fog(float d) { return exp(d * -.0035) + 0.1; }

vec3 plasma(vec2 p) {
	vec2 c = p + .5 * sin(34. / vec2(3, 5));
	return vec3(sin((sin(p.x * 4.) + sin(sqrt(50. * dot(c, c) + 35.))) * 3.141 - vec2(0, 11)) * .4 + .5, .7);
}

vec3 flr(vec3 c, vec3 p, inout vec3 n) {
	if (p.y > -1.84) return c;
	c = vec3(.01, .02, .1) + S(.2, .5, fbm(p * 10.)) * vec3(.1, .2, .1);
	p.x = abs(p.x);
	if (p.x > 0.715 && p.z < -.82) c = vec3(.01);
	else if (p.x > 0.7 && p.z < -.8) {
		c = vec3(.5);
		n = mix(n, vec3(0, 1, 0), 0.8);
	}

	return c;
}

vec3 lights(vec3 p, vec3 ro, vec3 rd, vec3 n, vec2 h) {
	float f;
	vec2 spe = vec2(10, 1);
	vec3 q,
	     ld = normalize(vec3(1, 1, -3.6) - p),
	     c = vec3(.45, .4, .35) * (.05 + .95 * step(p.y, 6.13)); // Darken ceiling.
	// Ceiling grid.
	if (min2(fract((p.xz + vec2(0, .5)) * 1.)) < 0.05) c += 0.01;

	// Colorize walls.
	c *= mix(vec3(1, .13, .13), vec3(1), step(abs(p.x), 11.95) * step(p.z, 18.9));

	// Floor pattern.
	c = flr(c, p, n);
	if (h.y == 3.) {
		// Chairs.
		c = vec3(.6, .07, .01);
		q = p;
		q.z += 1.5;
		q.x = abs(abs(q.x) - 2.) - .8;
		c += vec3(.48, 0, 0) * SPOT_RGB * S(.6, .5, length(q.xz));
		spe *= 0.5;
	}
	else if (h.y > 0.) {
		if (h.y == 1.) spe = vec2(200, 1);

		// plasma/white logo
		f = h.y - 1.;
		if (h.y == 2.) f -= S(-.5 + .3 * n31(p * 10.), -.1, p.z);
		c = mix(plasma(p.xy), vec3(.85), f);

		// Stage upper.
		if (h.y == 5.) {
			c *= .005;
			if (n.y >= .99) c += n31(p * 4.6);
		}

		// Stage lower.
		if (h.y == 6.) c = vec3(.234, .24, .12) * S(0., .1, fract(p.y * 12.));

		// Stage speakers.
		if (h.y == 7.) {
			c = vec3(.1);
			spe = vec2(1, 10);
		}

		// Dolby speakers.
		if (h.y == 8.) {
			c = vec3(.1 - n31(p * 20.) * 0.03);
			spe = vec2(20, 1);
		}

		if (h.y == 9.) c = ISLE_RGB;
		if (h.y == 10.) c = vec3(.3, 0.3, 0.4);
		if (h.y == 11.) return vec3(.9, .9, 1.);
	}

	else c += S(3., 1.5, length(p)) * S(.2, -.4, p.z) * plasma(p.xz * .4); // Plasma glow onto stage.
	// Ceiling light cones.
	float t;
	intPlane(ro, rd, t);
	if (t < length(p - ro)) {
		vec2 q = (ro + rd * t).xy;
		q.x = abs(abs(q.x) - 5.) - 2.5;
		q.y -= 6.;
		f = (S(1., 0., abs(q.x * 1.5) + q.y * .15) + S(1., 0., abs(q.x * 3.))) * S(-3.8, 4., q.y) * S(0.2, 0., q.y);

		// Dust.
		q *= 3.;
		vec2 u = floor(q);
		q = fract(q) - 0.5;
		q += n31(u.xyy) * 0.4;
		f += S(0.05 * n31(floor(p * 10.)), 0.0, length(q)) * f;
		c += SPOT_RGB * f;
	}

    // Darken near camera.
	c *= S(-5., -1., p.z);
	c *= 0.3 + 0.7 * S(22.1, 19.0, length(p));

    float _ao = mix(aof(p, n, .2), aof(p, n, 2.), .7);
    float
          l1 = sat(.1 + .9 * dot(ld, n)) * (.2 + .8 * shadow(p)),
          l2 = sat(.1 + .9 * dot(ld * vec3(-1, 1, -1), n)) * .3,
          l = l1 + (l2 + pow(sat(dot(rd, reflect(ld, n))), spe.x) * spe.y);
    l *= (1. - S(.7, 1., 1. + dot(rd, n)) * .4);
	return l * _ao * c * LIGHT_RGB;
}

vec3 scene(vec3 rd) {
	vec3 p = vec3(-.2, -.9, -5.8), ro = p;
	g = vec3(0);
	vec2 h;
	for (float i = Z0; i < 135.; i++) {
		h = map(p);
		if (abs(h.x) < .0015) break;
		p += h.x * rd;
	}

	vec3 gg = g.x * SPOT_RGB + g.y * ISLE_RGB + g.z * vec3(.1, 1, .1);
	return mix(SKY_RGB, gg + lights(p, ro, rd, N(p), h), fog(dot(p, p)));
}

void mainImage(out vec4 fragColor, vec2 uv) {
	vec2 v = uv.xy / R.xy;
	uv = (uv - .5 * R.xy) / R.y;
	vec3 c = scene(rayDir(uv));
	if (fwidth(c.r) > 0.05) {
		for (float dx = Z0; dx <= 1.; dx++)
			c += scene(rayDir(uv + vec2(dx - 0.5, 0) / R.xy));
		c /= 3.;
	}

	c *= pow(16. * v.x * v.y * (1. - v.x) * (1. - v.y), .4);
	fragColor = vec4(pow(sat(c), vec3(.6)), 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

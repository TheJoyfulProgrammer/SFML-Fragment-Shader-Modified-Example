/*
 * Original shader from: https://www.shadertoy.com/view/Nt2fzc
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

// --------[ Original ShaderToy begins here ]---------- //
// 'God's Front Porch' dean_the_coder (Twitter: @deanthecoder)
// https://www.shadertoy.com/view/Nt2fzc (YouTube: https://youtu.be/VXBp4hXvNG0)
//
// A 4Kb Graphics Executable for Shadow Party 2022.
// (2nd Place - Newschool Graphics)
//
// Processed by 'GLSL Shader Shrinker'
// (https://github.com/deanthecoder/GLSLShaderShrinker)
//
// Inspired by the song 'God's Front Porch' by The British IBM
// and Apollo 11.
// Michael Collins waited in moon orbit whilst the others got to
// land on the moon, so was the most isolated human in existence.
//
// The quote is actually from Gene Cernan on Apollo 17, but I
// figure I can be 'inspired' by what I like. :p
//
// As always, trying to improve my shader skillz. This time
// trying out some subtle effects such as glass shine,
// moon/light glare, and the 'viewing window'.
//
// Tricks to aid performance:
//   - Precalculate function results and simplify calculations
//     when possible (see GLSL Shader Shrinker).
//   - The SDF function only adds fine details if the ray
//     is near the surface of the ship.
//   - Shadow calculations exclude the moon.
//   - The window frame is a 2D effect.
//   - AA only applied on pixels where the neighbouring
//     pixel is a significantly different color.
//
// Thanks to Evvvvil, Flopine, Nusan, BigWings, Iq, Shane,
// totetmatt, Blackle, Dave Hoskins, byt3_m3chanic, tater,
// and a bunch of others for sharing their time and knowledge!

// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
#define AA	// Disable if your GPU is melting.

#define MIN_DIST	.0015
#define MAX_DIST	380.
#define MAX_STEPS	90.
#define MAX_RDIST	320.
#define MAX_RSTEPS	40.
#define SHADOW_STEPS	30.
#define LIGHT_RGB	vec3(2)
#define R	iResolution
#define Z0	0.
#define I0	0
#define sat(x)	clamp(x, 0., 1.)
#define S(a, b, c)	smoothstep(a, b, c)
#define S01(a)	S(0., 1., a)
#define minH(a, c, i)	{ float h_ = a; if (h_ < h.d) h = Hit(h_, c, i); }

float t = 0.;
struct Hit {
	float d;
	vec3 p;
	int id;
};

vec2 h22(vec2 p) {
	vec3 v = fract(p.xyx * vec3(.1031, .103, .0973));
	v += dot(v, v.yzx + 333.33);
	return fract((v.xx + v.yz) * v.zy);
}

float h31(vec3 p3) {
	p3 = fract(p3 * .1031);
	p3 += dot(p3, p3.yzx + 333.3456);
	return fract((p3.x + p3.y) * p3.z);
}

float h21(vec2 p) { return h31(p.xyx); }

float n31(vec3 p) {
	const vec3 s = vec3(7, 157, 113);

	// Thanks Shane - https://www.shadertoy.com/view/lstGRB
	vec3 ip = floor(p);
	p = fract(p);
	p = p * p * (3. - 2. * p);
	vec4 h = vec4(0, s.yz, 270) + dot(ip, s);
	h = mix(fract(sin(h) * 43758.545), fract(sin(h + s.x) * 43758.545), p.x);
	h.xy = mix(h.xz, h.yw, p.y);
	return mix(h.x, h.y, p.z);
}

vec3 n3331(vec3 p, vec3 s) {
    vec3 ns;
    for (int i = I0; i < 3; i++)
        ns[i] = n31(p * s[i]);
    return ns;
}

float fbm(vec3 p) {
	float a = 0.,
	      b = .5;
	for (float i = Z0; i < 5.; i++) {
		a += b * n31(p);
		b *= .5;
		p *= 2.;
	}

	return a * .5;
}

float min2(vec2 v) { return min(v.x, v.y); }

float max2(vec2 v) { return max(v.x, v.y); }

float max3(vec3 v) { return max(v.x, max(v.y, v.z)); }

mat2 rot(float a) {
	float c = cos(a),
	      s = sin(a);
	return mat2(c, s, -s, c);
}

float opRep(float p, float c) {
	float c2 = c * .5;
	return mod(p + c2, c) - c2;
}

vec3 opModPolar(vec3 p, float n, float o) {
	float angle = 3.141 / n,
	      a = mod(atan(p.y, p.z) + angle + o, 2. * angle) - angle;
	return vec3(p.x, length(p.yz) * vec2(cos(a), sin(a)));
}

float box(vec3 p, vec3 b) {
	vec3 q = abs(p) - b;
	return length(max(q, 0.)) + min(max3(q), 0.);
}

float cyl(vec3 p, vec2 hr) {
	vec2 d = abs(vec2(length(p.zy), p.x)) - hr;
	return min(max(d.x, d.y), 0.) + length(max(d, 0.));
}

float cone(vec3 p, float h, float r1, float r2) {
	vec2 q = vec2(length(p.yz), p.x),
	     k1 = vec2(r2, h),
	     k2 = vec2(r2 - r1, 2. * h),
	     ca = vec2(q.x - min(q.x, (q.y < 0.) ? r1 : r2), abs(q.y) - h),
	     cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0., 1.);
	return ((cb.x < 0. && ca.y < 0.) ? -1. : 1.) * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

vec3 rayDir(vec3 ro, vec2 uv) {
	vec3 f = normalize(-ro),
	     r = normalize(cross(vec3(0, 1, 0), f));
	return normalize(f + r * uv.x + cross(f, r) * uv.y);
}

vec3 sky(vec2 rd) {
	float n,
	      b = sat(1. - dot(rd, rd));
	rd *= 32.;
	n = h21(floor(rd));
	vec2 uv = fract(rd) + n * 1.6 - 1.3;
	return S(n * .001, 0., dot(uv, uv)) * .2 * n + vec3(pow(b, 12.));
}

float jet(vec3 q, float x) {
	float d = cone(q, .15, 0., .08 - .007 * (sin(x * 148.5) * .5 + .5));
	q.x -= .15;
	return max(d, .05 - length(q));
}

#define BODY_ID	1
#define BODYG_ID	2
#define CONE_ID	3
#define RADSEPS_ID	4
#define WINDOW_ID	5
#define ABOVE_ARE_REFLECTIVE	6
#define NOZZLE_ID	7
#define RADIATORS_ID	8
#define MOON_ID	9
#define WHITE_ID	10

Hit ship(vec3 p) {
	vec3 q;
	p.y -= .5;
	p.z += 8.;
	p.xy *= mat2(.99875, -.04998, .04998, .99875);
	p.xz *= mat2(.99022, .13954, -.13954, .99022);
	p.yz *= rot(1.3 + t / 60.);
	p.y += mix(3.5, 0., t / 20.);

	// Main body.
	float f, a,
	      d = cyl(p, vec2(2, 2.25));

	// Scimitar antenna.
	Hit h = Hit(cyl(p.zyx + vec3(0, 1.9, -.2), vec2(.34, .03)), p, WHITE_ID);

    if (d < 2.) {
		// We're near the main body - Add details.

        // Body bumps.
        q = p.zxy;
        q.xz *= rot(0.52);
        q.y = abs(abs(q.y + .48) - .36) - .36;
        minH(cyl(q, vec2(.15, 2.004)), p, BODYG_ID);

		// Rivets.
		q = p;
		q.x = opRep(q.x, .08);
		q = opModPolar(q, 18., 0.);
		q.z = abs(q.z) - .03;
		q.y -= 1.992;
		f = length(q) - .012;
		f = max(f, abs(p.x - .35) - 1.9);
		d = min(d, f);

		// Radiator separators.
		a = atan(p.y, p.z);
		f = cos(a * 8.);
		q = p;
		q.x += 1.9;
		minH(cyl(q, vec2(step(f + .5, 0.) * .03 + 1.99, .3)), p, RADSEPS_ID);

		// Radiator grills.
		a = abs(abs(p.x + .4) - 1.7) - .5;
		a += step(0., p.x) * step(a + 4.5, 2.1);
		f = min(1., step(0., f + .25) + step(2., q.x));
		float ox = q.x;
		q.x = opRep(q.x, .2);
		f = cyl(q, vec2(1.89 + (f - sat(a)) * .12, .015));
		f = min(max(f, abs(ox) - .3), max(f, abs(ox - 3.2) - .5));
		d = min(d, f);

		// RCS modules (aka steering thrusters).
		q = p;
		q.xzy = opModPolar(q, 4., .78);
		q.x++;
		q.z -= 2.;
		f = box(q, vec3(.24 - q.z * .3, .14 - q.z * .3, .2)); // Base
		minH(f, p, WHITE_ID);
		q.z -= .12;
		vec3 qq = q;
		q.x = abs(q.x) - .28;
		d = min(d, jet(q, p.x)); // Nozzle pair 1.
		q = qq.yxz;
		q.x = abs(q.x) - .14;
		d = min(d, jet(q, q.x)); // Nozzle pair 2.
	}

	// Nose cone.
	f = abs(abs(p.x + 3.3) - .9);
	f = step(.01, f) * .004;
	a = cone(p + vec3(3.7, 0, 0), 1.45, .55 - f, 2.01 - f);
	d = min(d, a);
	if (a < 1.)     {
		// We're near the nose cone - Add details.
		d += step(abs(p.x + 2.8), .01) * .004;

		// Pitch engines.
		q = p;
		q.x += 2.6;
		q = opModPolar(q, 5., -.22);
		q.z = abs(q.z) - .16;
		d += .004 * S(.12, .1, length(q.xz));

		// Nose windows.
		q = p + vec3(3.55 - .3 * step(-1., p.z), 0, 0);
		f = box(opModPolar(q, 5., .2), vec3(.18, 9, .18));
		d = min(max(d, .15 - f), a + .004);
		d = max(d, .05 - f);
		minH(a + .05, p, WINDOW_ID);

		// Docking point.
		q = p;
		q.x += 5.8;
		f = length(q) - .1; // End ball.
		q.x -= .35;
		f = min(f, cyl(q, vec2(.04, .3))); // Center rod.
		q.xzy = opModPolar(q, 4., 0.);
		q.z -= .4;
		q.x = -sqrt(q.x * q.x + .005);
		q.xz *= mat2(.70721, .707, -.707, .70721);
		f = min(f, max(cyl(q, vec2(.03, .5)), q.x)); // Slopey bits.
		d = min(d, f);
	}

	// Exhaust nozzle.
	q = p;
	q.x -= 3.7;
	f = .06 * S(.05, -.05, abs(q.x - .7));
	d = min(d, cone(q, 1.5, .5 + S(-1.2, 2., q.x), 1.25) - f);
	if (p.x > 0.) {
		// Directional antenna.
		q = p;
		q.xz -= 2.;
		f = cyl(q.zyx, vec2(.06, 1));
		q.x += .2;
		q.z--;
		float b = S(-.2, -.5, q.x) * .05 + .06;
		f = min(f, box(q, vec3(.5, b, b)));
		d = min(d, f);
		q.x += .5;
		q.yz = abs(q.yz) - .3;
		f = abs(length(q) - .53) - .015;
		f = max(f, .46 - q.x);
		d = min(d, f);
	}

	minH(d, p, BODY_ID);
	return h;
}

float moonSDF(vec3 p) {
	p += vec3(118, 164, -460);

	// Base moon radius.
	float r = length(p) - 4e2,
	      f = 0.;
	if (r > 10.) return r;

	// Add surface details.
	for (float c = .01; c <= .03; c += .01) {
		vec2 uv = p.xy * c,
		     dxy = h22(floor(uv)) * .5;
		uv = fract(uv) - .5 + dxy;
		float d = S(-.1, 0., length(uv) + (max2(dxy) - .5));
		d *= 3.1 - 127. * c + 17e2 * c * c;
		f += d;
	}

	return r - f - fbm(p * .1) * 4.;
}

Hit map(vec3 p) {
	Hit h = ship(p);
	minH(moonSDF(p), p, MOON_ID);
	return h;
}

vec3 N(vec3 p, float t) {
    float h = t * .25;
    vec2 e = .005773 * vec2(1., -1.);
    return normalize(
        e.xyy * map(p + e.xyy * h).d +
        e.yyx * map(p + e.yyx * h).d +
        e.yxy * map(p + e.yxy * h).d +
        e.xxx * map(p + e.xxx * h).d);
}

float shadow(vec3 p) {
	float d,
	      s = 1.,
	      t = .05,
	      mxt = length(p - vec3(-25, 45, -40));
	vec3 ld = normalize(vec3(-25, 45, -40) - p);
	for (float i = Z0; i < SHADOW_STEPS; i++) {
		d = ship(t * ld + p).d;
		s = min(s, 15. * d / t);
		t += max(.02, d);
		if (mxt - t < .5 || s < .001) break;
	}

	return S01(s);
}

// Quick 2-level ambient occlusion.
vec2 aof(vec3 p, vec3 n, vec2 h) {
    vec2 ao;
    for (int i = I0; i < 2; i++)
        ao[i] = ship(h[i] * n + p).d;
    return sat(ao / h);
}

bool reflecting = false;
vec3 lights(vec3 p, vec3 rd, inout vec3 n, Hit h, inout float r) {
	float ao, l1, l2, fre, spec,
	      freCutOff = .95,
	      sha = 1.,
	      l3c = 1.;
	vec3 c,
	     ld = normalize(vec3(-25, 45, -40) - p),
	     freRGB = vec3(0);
	vec2 spe = vec2(10, 1);
	if (h.id == MOON_ID) {
		l3c = 0.;
		spe.y = .04;
		c = vec3(49, 48, 46) / 85e2;
		c -= .004 * S(.7, 1., -n.z);
		freRGB = vec3(1);
		freCutOff = .5;
		if (reflecting) {
			// Less harsh fresnel when rendering a reflection.
			c *= 10.;
			freRGB = vec3(.2);
			freCutOff = .05;
		}
	}
	else {
		sha = shadow(p);
		float a = atan(h.p.y, h.p.z) / 6.28318 + .5;
        vec3 ns = n3331(h.p, vec3(4, 15, 40));
		if (h.p.x > 3.) {
			// Exhaust Nozzle
			if (h.p.x > 4.35) c = vec3(4.9, 4.8, 4.15) / 255.;
			else {
				float f = S(.2, 0., abs(fract(a * 12.) - .5)) * .2;
				f += S(4.4, 3., h.p.x);
				c = mix(vec3(176, 141, 87) / 85e2, vec3(176, 141, 87) / 2550., f);
				spe = vec2(5, 4);
			}

			c *= .7 + .3 * ns.y;
		}
		else {
			if (h.id != RADSEPS_ID) { if ((length(h.p.yz) < 2.1 && abs(h.p.x - 1.3) < .5) || abs(h.p.x + 1.9) < .3) h.id = WHITE_ID; }

			else if (abs(h.p.x + 1.8) + step(.22, fract(a * 8. + .6)) < .06) h.id = WHITE_ID;

			if (h.id == WINDOW_ID) {
				r = 1.;
				c = vec3(.01, .01, .013) * .24;
				spe = vec2(3, 30);
			}
			else if (h.p.x < -2.3) {
				// Nose cone.
				r = .8;
				float f = .1 * sin(a * 2e2);
				n.y += f * f;
				n += (ns.x - .5 + .1 * ns.y - .05) * .03;
				spe = vec2(50, 20);
				c = vec3(.001);
				c += pow(sat(dot(rd, reflect(ld, n))), 5.) * .03;
				c *= .7 + .15 * (ns.y + ns.z);
			}
			else if (h.id == WHITE_ID) {
				// White panels.
				c = vec3(.45);
				c *= .9 + .05 * (ns.y + ns.z);
				l3c = .1;
				sha = .6 + .4 * sha;
			}
			else {
				// Main body.
				r = .1;
				n += (ns.x - .5) * .03;
				spe = vec2(2, 3);
				c = vec3(27, 23, 21) / 255.;
				c += pow(sat(dot(rd, reflect(ld, n))), 5.) * .2;
				c *= .7 + .15 * (ns.y + ns.z);

				// Fake paneling.
				if (h.id == BODY_ID) {
					float fr, fb,
					      f = h21(floor(vec2(a * 18., h.p.x * 2.)));
					c += .04 * (f - .5);
					spe.y += f;

					// Flag.
					h.p.x += .65;
					h.p.z += .2;
					h.p.xz *= 1.5;
					f = S(.02, 0., max(abs(h.p.z - .35) - .32, abs(h.p.x + 1.1) - .2));
					fr = S(-.25, .25, sin(h.p.x * 1e2 - 1.));
					fb = S(.01, 0., h.p.x + 1.09) * S(.02, 0., .38 - h.p.z);
					c = mix(c, vec3(.1, 0, 0), fr * f);
					c = mix(c, vec3(0, 0, .03), fb * f);
					l3c *= (1. - fr * f);
					l3c *= (1. - fb * f);
				}
			}
		}
	}

    vec2 ao2 = aof(p, n, vec2(0.05, .5));
	ao = mix(ao2.x, ao2.y, .7);
	l1 = sat(.1 + .9 * dot(ld, n));
	l2 = sat(.3 + .7 * dot(-vec3(.23487, .32642, -.91558), n));
	fre = S(1., freCutOff, 1. + dot(rd, n));
	spec = pow(sat(dot(rd, reflect(ld, n))), spe.x) * spe.y;
	float spec2 = pow(sat(dot(rd, -n)), 40.) * l3c;
	l1 += spec;
	l1 *= .01 + .99 * sha;
	l2 *= ao;
	c = mix(freRGB, (l1 + l2) * c * LIGHT_RGB + spec2 * vec3(.14, .13, .1), fre);
	if (!reflecting) c += pow(sat(dot(rd, vec3(-.89443, .44721, 0))), 4.) * .2; // Glare.
	return c;
}

vec3 scene(vec3 p, vec3 rd) {
	// March the scene.
	float i,
	      d = 3.,
	      r = 0.;
	Hit h;
	for (float ii = Z0; ii < MAX_STEPS; ii++) {
		h = map(p);
		if (abs(h.d) < MIN_DIST || d > MAX_DIST) break;
		d += h.d;
		p += h.d * rd;
	}

	vec3 col,
	     n = N(p, d);
	if (d > MAX_DIST) return sky(rd.xy);
	col = lights(p, rd, n, h, r);
	if (r > 0.) {
		// We hit a reflective surface, so march reflection.
		rd = reflect(rd, n);
		p += n * .01;
		d = 0.;
		for (float ii = Z0; ii < MAX_RSTEPS; ii++) {
			h = map(p);
			if (abs(h.d) < MIN_DIST * d || d > MAX_RDIST) break;
			d += h.d;
			p += h.d * rd;
			i = ii;
		}

		// Add a hint of the reflected color.
		if (d < MAX_RDIST) {
			n = N(p, d);
			reflecting = true;
			col += r * lights(p, rd, n, h, i);
		}
	}

	return col;
}

void mainImage(out vec4 fragColor, vec2 fc) {
	t = mod(iTime, 35.);
	vec3 ro = vec3(-t / 15., 1. - t / 15., -20),
	     col = vec3(1);
	vec2 uv = (fc - .5 * R.xy) / R.y,
	     v = fc.xy / R.xy,
	     cp = vec2(uv.y * .4 - uv.x + .85, uv.x - uv.y + 1.1);
	col *= S(0., .05, min2(cp));
	if (col.r > 0.) {
		// Main scene.
		vec3 aa = scene(ro, rayDir(ro, uv));
#ifdef AA
		if (fwidth(aa.g) > .1) {
			for (float dx = -.5; dx <= .5; dx++) {
				for (float dy = -.5; dy <= .5; dy++)
					aa += scene(ro, rayDir(ro, uv + vec2(dx, dy) / R.xy));
			}

			aa *= 0.2;
		}
#endif

		col *= aa;
		cp = uv * mat2(.95534, -.29552, .29552, .95534);

		// Screen glare.
		col += pow(S(-.5, .1, uv.y) * S(.15, 0., abs(cp.x - .72) * (1.5 - uv.y)), 1.3) * vec3(.5, .8, 1) * .025;
	}
	else {
		// Viewing window.
		col = vec3(.03, .01, .01) * S(.1, -.1, min2(abs(cp + .1)));
		col += S(.03, -.03, abs(cp.x + .06)) * S(-.5, 0., uv.y) * vec3(.08, .04, .002);
	}

	col *= .5 + .5 * pow(16. * v.x * v.y * (1. - v.x) * (1. - v.y), .4);
	fragColor = vec4(pow(max(vec3(0), col), vec3(.45)) * sat(t), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

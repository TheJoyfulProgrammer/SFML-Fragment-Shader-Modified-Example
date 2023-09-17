/*
 * Original shader from: https://www.shadertoy.com/view/ssGfzd
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
#define time iTime
#define ZPOS -10. + 5. * time

float PI = acos(-1.);

mat2 rot2d(float a){
  float c = cos(a), s = sin(a);

  return mat2(c, s, -s, c);
}

float cyl(vec3 p, vec3 c){
  return length(p.xy - c.xy) - c.z;
}


vec3 thread(vec3 p, float m, float r, float n, float xm, float ym, float i) {
    p.z += (i * 2. * PI) / (m * n);
    p.x += xm * sin(p.z * m);
    p.y += ym * sin(p.z * m * (n - 1.));

    return p;
}

float dir1 = 1.;
float recbraid(vec3 p, float m, float r) {
    float d = 10.;
    const float n1 = 3.;
    const float n2 = 3.;

    for (float i = 0.; i < n1; i += 1.) {
        vec3 p1 = thread(p, m * .5, r, n1, 3., 3., i);
        p1.z += time * 5. * dir1;
        dir1 *= -1.;
        for (float j = 0.; j < n2; j += 1.) {
            p1.xy *= rot2d(time * .1);
            vec3 p2 = thread(p1, m * 2., r, n2, .7, .5, j);

            d = min(d, cyl(p2, vec3(0, 0, r)));
        }
    }

    return d;
}


vec3 glow = vec3(0, 0, 0);
float at = 0.;

float map(vec3 p) {
    float d = 10000.;

    vec3 offset = vec3(0, 5., 0);
    const float m = 4.;

    for (float i = 0.; i < m; i++) {
        vec3 pc = p;
        pc.xy *= rot2d(PI * cos(0.04 * pc.z * (i / m)));
        vec3 oc = offset;
        oc.xy *= rot2d(2. * PI * (i / m));
        float b = recbraid(pc - oc, 0.1, 0.05);
        d = min(d, b);
    }

    at += 1. / (d * 3.1);

    return d;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  vec3 col = vec3(0);
  vec3 ro = vec3(0, 0., ZPOS);
  vec3 rd = normalize(vec3(uv.x, uv.y, 1.));

  float d = 0.;
  vec3 glow = vec3(0);

  for (int i = 0; i < 100; i++) {
    vec3 p = ro + d * rd;
    float ds = map(p);

    if (ds < 0.01 || ds > 50.) {
      break;
    }
    d += ds * 1.;
//    glow += .007 * at * vec3(
    glow += .015 * at * vec3(
      .1,
      .0,
      .7
    );
  }

  vec3 p = ro + d * rd;
  vec2 e = vec2(0.01, 0);
  vec3 n = normalize(map(p) -
    vec3(
      map(p - e.xyy),
      map(p - e.yxy),
      map(p - e.yyx)
    )
  );

  vec3 lp = ro;
  vec3 tl = lp - p;
  vec3 tln = normalize(tl);
  float dif = dot(tln, n);

  col = 1.5 * vec3(dif);
  col = dif * glow;
  fragColor = vec4(col, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

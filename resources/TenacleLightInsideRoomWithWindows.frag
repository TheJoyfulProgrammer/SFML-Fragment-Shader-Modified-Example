/*
 * Original shader from: https://www.shadertoy.com/view/flt3WB
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
// "Trapped Light" by dr2 - 2021
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

#define AA  0  // (= 0/1) optional antialising

#if 0
#define VAR_ZERO min (iFrame, 0)
#else
#define VAR_ZERO 0
#endif

float PrBoxDf (vec3 p, vec3 b);
float PrBox2Df (vec2 p, vec2 b);
float PrRound4Box2Df (vec2 p, vec2 b, float r);
float PrRoundCylDf (vec3 p, float r, float rt, float h);
float PrCapsDf (vec3 p, float r, float h);
float PrConCylDf (vec3 p, vec2 cs, float r, float h);
float PrAnConCylDf (vec3 p, vec2 cs, float r, float w, float h);
mat3 StdVuMat (float el, float az);
vec2 Rot2D (vec2 q, float a);
float SmoothBump (float lo, float hi, float w, float x);
vec4 Hashv4v2 (vec2 p);
float Noisefv2 (vec2 p);
float Fbm1 (float p);
float Fbm2 (vec2 p);
vec3 VaryNf (vec3 p, vec3 n, float f);

vec3 sunDir = vec3(0.), qHit = vec3(0.), rmSize = vec3(0.), ltPos = vec3(0.), ltPosF = vec3(0.);
vec2 coneCs = vec2(0.);
float tCur = 0., dstFar = 0., szFac = 0., sLoop = 0., dLoop = 0., aLoop = 0., hBase = 0., lEnd = 0., tubRot = 0.;
float coneHt[2], coneRd[2];
int idObj;
const int idRm = 1, idBar = 2, idLit = 3, idLitF = 4, idTube = 5, idEx = 6, idEnd = 7, idCon = 8;
const float pi = 3.1415927;

#define DMINQ(id) if (d < dMin) { dMin = d;  idObj = id;  qHit = q; }

void SetObjConf ()
{
  float t;
  t = tCur / 30. + 0.5;
  tubRot = mod (15. * t, 2. * pi);
  t = mod (t, 1.);
  sLoop = (1. / 1.4) / (0.01 + 0.99 * SmoothBump (0.25, 0.75, 0.15, t));
  aLoop = 0.25 * pi / sLoop;
  dLoop = 6. * sLoop;
  lEnd = 1.;
  hBase = - (6. * (0.5 * pi) + 4. * lEnd) * (1. - SmoothBump (0.1, 0.9, 0.08, t));
  coneCs = sin (-0.17 * pi + 0.07 * pi * sin (1.5 * pi * tCur) + vec2 (0.5 * pi, 0.));
  coneHt[0] = 0.8 * coneCs.x;
  coneRd[0] = 0.3 - 0.8 * coneCs.y;
  coneHt[1] = 50. * 0.8 * coneCs.x;
  coneRd[1] = 0.95 * 0.3 - 0.8 * coneCs.y;
  szFac = 0.5;
  ltPos = vec3 (0., 2. * lEnd + 0.75 + coneHt[0], 0.);
  ltPos.xy = Rot2D (Rot2D (ltPos.xy - vec2 (dLoop, 0.), - aLoop), - (aLoop - 0.5 * pi)) +
     vec2 (0., dLoop);
  ltPos.xy = ltPos.yx * vec2 (1., -1.);
  ltPos.y += 2. * lEnd + hBase + 0.3;
  ltPos.xz = Rot2D (ltPos.xz, - tubRot);
  ltPos *= szFac;
}

float ObjDf (vec3 p)
{
  vec3 q, qq;
  float dMin, d, rCyl, rc, s, dc, dy, db;
  dMin = dstFar;
  q = p;
  q.y -= rmSize.y - 0.4;
  db = PrBoxDf (q, rmSize);
  d = abs (db) - 0.4;
  q.xz = mix (q.zx, q.xz, step (abs (q.z), abs (q.x)));
  d = max (max (d, - PrBox2Df (q.zy, vec2 (2.5, 5.))), min (2.5 - length (abs (q.xz) - 15.), q.y));
  DMINQ (idRm);
  d = min (length (vec2 (abs (q.x) - rmSize.x + 0.15, q.z)),
     length (vec2 (abs (q.x) - rmSize.x + 0.15, abs (q.y) - 1.8))) - 0.2;
  q = vec3 (abs (q.xz) - 15., q.y - rmSize.y + 0.15).xzy;
  d = max (min (d, min (length (q.xy), length (q.zy)) - 0.15), db);
  DMINQ (idBar);
  q = p - ltPosF;
  q.y -= 1.;
  d = PrCapsDf (q.xzy, 1., 0.5);
  DMINQ (idLitF);
  dMin /= szFac;
  p /= szFac;  // (from "Metallic Tubeworms")
  rCyl = 0.6;
  rc = 0.6;
  q = p;
  dy = - q.y;
  q.y -= 0.3;
  d = max (PrRoundCylDf (q.xzy, rCyl + 0.4, 0.1, 0.3), dy);
  DMINQ (idEx);
  q = p;
  q.y -= 2. * lEnd + hBase + 0.3;
  s = mod (3. * q.y + 0.5, 1.);
  d = max (max (PrRound4Box2Df (q.xz, vec2 (rCyl * (1. - 0.03 * SmoothBump (0.2, 0.8, 0.15, s))) -
     rc, rc), abs (q.y + lEnd) - lEnd - 0.01), dy);
  DMINQ (idEnd);
  q.xz = Rot2D (q.xz, tubRot);
  q.xy = Rot2D (q.yx * vec2 (-1., 1.) - vec2 (0., dLoop), aLoop - 0.5 * pi);
  s = mod (3. * dLoop * atan (q.y, - q.x) + 0.5, 1.);
  qq = q;
  dc = dot (vec2 (q.x, abs (q.y)), sin (aLoop + vec2 (0., 0.5 * pi)));
  q.xz = Rot2D (vec2 (length (q.xy) - dLoop, q.z), tubRot);
  d = max (max (PrRound4Box2Df (q.xz, vec2 (rCyl * (1. - 0.03 * SmoothBump (0.2, 0.8, 0.15, s)) -
     rc), rc), dc), dy);
  DMINQ (idTube);
  q = qq;
  q.xy = Rot2D (q.xy, aLoop) + vec2 (dLoop, 0.);
  q.xz = Rot2D (q.xz, - tubRot);
  s = mod (3. * q.y + 0.5, 1.);
  d = max (max (PrRound4Box2Df (q.xz, vec2 (rCyl * (1. - 0.03 * SmoothBump (0.2, 0.8, 0.15, s))) -
     rc, rc), abs (q.y - lEnd) - lEnd - 0.01), dy);
  DMINQ (idEnd);
  q.y -= 2. * lEnd + 0.1;
  d = PrRoundCylDf (q.xzy, rCyl + 0.1, 0.05, 0.05);
  DMINQ (idEx);
  q.y -= 0.2;
  d = PrCapsDf (q.xzy, 0.35, 0.25);
  DMINQ (idEx);
  q.y -= 0.4 + coneHt[0];
  d = PrAnConCylDf (q.xzy, coneCs, coneRd[0], 0.05, coneHt[0]);
  d = max (d, min (0.05 - min (abs (q.x), abs (q.z)), 0.5 * coneHt[0] -
     abs (q.y - 0.1 * coneHt[0])));
  DMINQ (idCon);
  d = PrCapsDf (q.xzy, 0.4, 0.2);
  DMINQ (idLit);
  dMin *= szFac;
  return dMin;
}

float ObjRay (vec3 ro, vec3 rd)
{
  float dHit, d;
  dHit = 0.;
  for (int j = VAR_ZERO; j < 120; j ++) {
    d = ObjDf (ro + dHit * rd);
    if (d < 0.001 || dHit > dstFar) break;
    dHit += d;
  }
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  vec2 e;
  e = vec2 (0.005, -0.005);
  for (int j = VAR_ZERO; j < 4; j ++) {
    v[j] = ObjDf (p + ((j < 2) ? ((j == 0) ? e.xxx : e.xyy) : ((j == 2) ? e.yxy : e.yyx)));
  }
  v.x = - v.x;
  return normalize (2. * v.yzw - dot (v, vec4 (1.)));
}

float TrObjDf (vec3 p)
{
  vec3 q;
  float dMin, d;
  dMin = dstFar / szFac;
  p /= szFac;
  q = p;
  q.y -= 2. * lEnd + hBase + 0.3;
  q.xz = Rot2D (q.xz, tubRot);
  q.xy = Rot2D (Rot2D (q.yx * vec2 (-1., 1.) - vec2 (0., dLoop), aLoop - 0.5 * pi), aLoop) +
     vec2 (dLoop, 0.);
  q.y -= 2. * lEnd + 0.75 + coneHt[0];
  d = max (PrConCylDf (q.xzy, coneCs, coneRd[1], coneHt[1]), coneHt[0] - q.y);
  DMINQ (idCon);
  dMin *= szFac;
  return dMin;
}

float TrObjRay (vec3 ro, vec3 rd)
{
  float dHit, d;
  dHit = 0.;
  for (int j = VAR_ZERO; j < 60; j ++) {
    d = TrObjDf (ro + dHit * rd);
    if (d < 0.001 || dHit > dstFar) break;
    dHit += d;
  }
  return dHit;
}

vec3 TrObjNf (vec3 p)
{
  vec4 v;
  vec2 e;
  e = vec2 (0.005, -0.005);
  for (int j = VAR_ZERO; j < 4; j ++) {
    v[j] = TrObjDf (p + ((j < 2) ? ((j == 0) ? e.xxx : e.xyy) : ((j == 2) ? e.yxy : e.yyx)));
  }
  v.x = - v.x;
  return normalize (2. * v.yzw - dot (v, vec4 (1.)));
}

float ObjSShadow (vec3 ro, vec3 rd, float dMax)
{
  float sh, d, h;
  int idObjT;
  sh = 1.;
  d = 0.01;
  idObjT = idObj;
  for (int j = VAR_ZERO; j < 30; j ++) {
    h = ObjDf (ro + d * rd);
    sh = min (sh, smoothstep (0., 0.05 * d, h));
    d += h;
    if (sh < 0.05 || d > dMax) break;
  }
  idObj = idObjT;
  return 0.7 + 0.3 * sh;
}

vec3 ShStagGrid (vec2 p)
{
  vec2 sp, ss;
  if (2. * floor (0.5 * floor (p.y)) != floor (p.y)) p.x += 0.5;
  sp = smoothstep (0.03, 0.07, abs (fract (p + 0.5) - 0.5));
  p = fract (p) - 0.5;
  ss = 0.3 * smoothstep (0.4, 0.5, abs (p.xy)) * sign (p.xy);
  if (abs (p.x) < abs (p.y)) ss.x = 0.;
  else ss.y = 0.;
  return vec3 (ss.x, sp.x * sp.y, ss.y);
}

vec4 ShStagGrid3d (vec3 p, vec3 vn)
{
  vec3 rg;
  if (abs (vn.x) > 0.99) {
    rg = ShStagGrid (p.zy);
    rg.xz *= sign (vn.x);
    if (rg.x == 0.) vn.xy = Rot2D (vn.xy, rg.z);
    else vn.xz = Rot2D (vn.xz, rg.x);
  } else if (abs (vn.y) > 0.99) {
    rg = ShStagGrid (p.zx);
    rg.xz *= sign (vn.y);
    if (rg.x == 0.) vn.yx = Rot2D (vn.yx, rg.z);
    else vn.yz = Rot2D (vn.yz, rg.x);
  } else if (abs (vn.z) > 0.99) {
    rg = ShStagGrid (p.xy);
    rg.xz *= sign (vn.z);
    if (rg.x == 0.) vn.zy = Rot2D (vn.zy, rg.z);
    else vn.zx = Rot2D (vn.zx, rg.x);
  }
  return vec4 (vn, rg.y);
}

vec3 SkyBgCol (vec3 ro, vec3 rd)
{
  vec3 col, clCol, skCol;
  vec2 q;
  float f, fd, ff, sd;
  if (rd.y > -0.02 && rd.y < 0.04 * Fbm1 (32. * atan (rd.z, - rd.x))) {
    col = vec3 (0.3, 0.4, 0.5);
  } else {
    q = 0.01 * (ro.xz + 2. * tCur + ((100. - ro.y) / rd.y) * rd.xz);
    ff = Fbm2 (q);
    f = smoothstep (0.2, 0.8, ff);
    fd = smoothstep (0.2, 0.8, Fbm2 (q + 0.01 * sunDir.xz)) - f;
    clCol = (0.7 + 0.5 * ff) * (vec3 (0.7) - 0.7 * vec3 (0.3, 0.3, 0.2) * sign (fd) *
       smoothstep (0., 0.05, abs (fd)));
    sd = max (dot (rd, sunDir), 0.);
    skCol = vec3 (0.3, 0.4, 0.8) + step (0.1, sd) * vec3 (1., 1., 0.9) *
       min (0.3 * pow (sd, 64.) + 0.5 * pow (sd, 2048.), 1.);
    col = mix (skCol, clCol, 0.1 + 0.9 * f * smoothstep (0.01, 0.1, rd.y));
  }
  return col;
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4, rg4;
  vec3 col, vn, roo, rdo, ltDir, ltAx;
  float dstGrnd, dstObj, dstTrObj, nDotL, sh, ltDst, att;
  SetObjConf ();
  ltPosF = vec3 (0., 2. * rmSize.y - 1.8, 0.);
  roo = ro;
  rdo = rd;
  dstObj = ObjRay (ro, rd);
  if (dstObj < dstFar) {
    ro += dstObj * rd;
    vn = ObjNf (ro);
    col4 = vec4 (1., 1., 0.9, 0.2);
    if (idObj == idTube || idObj == idEnd) {
      col4 = col4 * (0.93 + 0.07 * smoothstep (-0.1, 0., cos (32. * atan (qHit.z, - qHit.x))));
    } else if (idObj == idEx) {
      col4 *= 0.95;
    } else if (idObj == idCon) {
      col4 = (PrConCylDf (qHit.xzy, coneCs, coneRd[0], coneHt[0]) < 0.) ?
         vec4 (0.8 + 0.2 * sin (32. * pi * tCur), 0., 0., -1.) : col4 *
         (0.9 + 0.1 * smoothstep (-0.7, -0.6, cos (64. * qHit.y)));
    } else if (idObj == idBar) {
      col4 = vec4 (0.9, 0.5, 0.2, 0.1);
    } else if (idObj == idRm) {
      col4 = (abs (vn.y) < 0.99) ? vec4 (1., 1., 0.9, 0.2) : ((vn.y > 0.) ?
         vec4 (1., 0.8, 0.8, 0.2) : vec4 (0.8, 1., 0.8, 0.2) * (0.8 + 0.2 * smoothstep (0., 1.,
         length (ro.xz) - 1.)));
      rg4 = ShStagGrid3d (ro, vn);
      vn = rg4.xyz;
      vn = VaryNf (4. * ro, vn, 0.2);
      col4.rgb *= 0.9 + 0.1 * rg4.w;
    } else if (idObj == idLit) {
      col4 = vec4 (1., 1., 0.9, -1.);
    } else if (idObj == idLitF) {
      col4 = vec4 (1., 1., 0.9, -1.);
    }
    if (col4.a >= 0.) {
      ltDir = ltPosF - ro;
      ltDst = length (ltDir);
      ltDir = normalize (ltDir);
      att = 1. / (1. + 0.002 * ltDst * ltDst);
      sh = ObjSShadow (ro + 0.01 * vn, ltDir, ltDst - 2.);
      nDotL = max (dot (vn, ltDir), 0.);
      col = att * (col4.rgb * (0.2 + 0.8 * sh * nDotL * nDotL) +
         step (0.95, sh) * col4.a * pow (max (dot (ltDir, reflect (rd, vn)), 0.), 32.));
      if (idObj <= idBar) {
        ltDir = ltPos - ro;
        ltDst = length (ltDir);
        ltDir = normalize (ltDir);
        ltAx = vec3 (0., -1., 0.);
        ltAx.xy = Rot2D (ltAx.xy, -2. * aLoop);
        ltAx.xz = Rot2D (ltAx.xz, - tubRot);
        att = smoothstep (-0.1, 0.2, dot (ltAx, ltDir) - coneCs.x) *
           step (- dot (vn, ltDir), 0.) / (1. + 0.002 * ltDst * ltDst);
        col = mix (col, att * (col4.rgb * max (dot (vn, ltDir), 0.) +
           col4.a * pow (max (dot (ltDir, reflect (rd, vn)), 0.), 32.)), 0.5);
      }
    } else col = col4.rgb * (0.6 - 0.4 * dot (vn, rd));
  } else if (rd.y < 0.) {
    dstGrnd = - ro.y / rd.y;
    ro += dstGrnd * rd;
    col = 0.5 * mix (vec3 (0.8, 1., 0.5), vec3 (0.7, 0.9, 0.5), 0.2 +
       0.8 * smoothstep (0.3, 0.7, Fbm2 (4. * ro.xz)));
    vn = VaryNf (16. * ro, vec3 (0., 1., 0.), 1. - smoothstep (0.5, 0.8, dstGrnd / dstFar));
    col *= 0.2 + 0.8 * max (dot (vn, sunDir), 0.);
    col = mix (col, vec3 (0.3, 0.4, 0.5), pow (1. + rd.y, 16.));
  } else {
    col = SkyBgCol (ro, rd);
  }
  ro = roo;
  rd = rdo;
  dstTrObj = TrObjRay (ro, rd);
  if (dstTrObj < min (dstObj, dstFar)) {
    ro += dstTrObj * rd;
    vn = TrObjNf (ro);
    ltDst = length (ro - ltPos);
    att = 1. / (1. + 0.2 * ltDst * ltDst);
    col = mix (col, vec3 (1., 1., 0.8), 0.3 * max (- dot (vn, rd), 0.) *
       att * (1. - smoothstep (-0.3, -0.1, dstTrObj - dstObj)));
  }
  ltAx = vec3 (0., -1., 0.);
  ltAx.xy = Rot2D (ltAx.xy, -2. * aLoop);
  ltAx.xz = Rot2D (ltAx.xz, - tubRot);
  col = mix (col, vec3 (1., 1., 0.9), 0.15 * smoothstep (-0.1, 0.2,
     dot (ltAx, normalize (ltPos - roo)) - coneCs.x));
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd, col;
  vec2 canvas, uv, uvv;
  float el, az, zmFac, asp, sr;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  asp = canvas.x / canvas.y;
  el = 0.;
  az = 0.27 * pi;
  if (mPtr.z > 0.) {
    az += 2. * pi * mPtr.x;
    el += pi * mPtr.y;
  }
  el = clamp (el, -0.44 * pi, 0.45 * pi);
  vuMat = StdVuMat (el, az);
  rmSize = vec3 (20.4, 9.4, 20.4);
  ro = vec3 (-17., 9., -17.);
  sunDir = normalize (vec3 (1., 1., -1.));
  zmFac = 2.1;
  dstFar = 100.;
#if ! AA
  const float naa = 1.;
#else
  const float naa = 3.;
#endif
  col = vec3 (0.);
  sr = 2. * mod (dot (mod (floor (0.5 * (uv + 1.) * canvas), 2.), vec2 (1.)), 2.) - 1.;
  for (float a = float (VAR_ZERO); a < naa; a ++) {
    uvv = (uv + step (1.5, naa) * Rot2D (vec2 (0.5 / canvas.y, 0.),
       sr * (0.667 * a + 0.5) * pi)) / zmFac;
    rd = vuMat * normalize (vec3 ((2. * tan (0.5 * atan (uvv.x / asp))) * asp, uvv.y, 1.));
    col += (1. / naa) * ShowScene (ro, rd);
  }
  fragColor = vec4 (col, 1.);
}

float PrBoxDf (vec3 p, vec3 b)
{
  vec3 d;
  d = abs (p) - b;
  return min (max (d.x, max (d.y, d.z)), 0.) + length (max (d, 0.));
}

float PrBox2Df (vec2 p, vec2 b)
{
  vec2 d;
  d = abs (p) - b;
  return min (max (d.x, d.y), 0.) + length (max (d, 0.));
}

float PrRound4Box2Df (vec2 p, vec2 b, float r)
{
  p = max (abs (p) - b, 0.);
  return sqrt (length (p * p)) - r;
}

float PrRoundCylDf (vec3 p, float r, float rt, float h)
{
  return length (max (vec2 (length (p.xy) - r, abs (p.z) - h), 0.)) - rt;
}

float PrCapsDf (vec3 p, float r, float h)
{
  return length (p - vec3 (0., 0., clamp (p.z, - h, h))) - r;
}

float PrConCylDf (vec3 p, vec2 cs, float r, float h)
{
  return max (dot (vec2 (length (p.xy) - r, p.z), cs), abs (p.z) - h);
}

float PrAnConCylDf (vec3 p, vec2 cs, float r, float w, float h)
{
  return max (abs (dot (vec2 (length (p.xy) - r, p.z), cs)) - w, abs (p.z) - h);
}

mat3 StdVuMat (float el, float az)
{
  vec2 ori, ca, sa;
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  return mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
         mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
}

vec2 Rot2D (vec2 q, float a)
{
  vec2 cs;
  cs = sin (a + vec2 (0.5 * pi, 0.));
  return vec2 (dot (q, vec2 (cs.x, - cs.y)), dot (q.yx, cs));
}

float SmoothBump (float lo, float hi, float w, float x)
{
  return (1. - smoothstep (hi - w, hi + w, x)) * smoothstep (lo - w, lo + w, x);
}

const float cHashM = 43758.54;

vec2 Hashv2f (float p)
{
  return fract (sin (p + vec2 (0., 1.)) * cHashM);
}

vec2 Hashv2v2 (vec2 p)
{
  vec2 cHashVA2 = vec2 (37., 39.);
  return fract (sin (dot (p, cHashVA2) + vec2 (0., cHashVA2.x)) * cHashM);
}

vec4 Hashv4v2 (vec2 p)
{
  vec2 cHashVA2 = vec2 (37., 39);
  return fract (sin (dot (p, cHashVA2) + vec4 (0., cHashVA2.xy, cHashVA2.x + cHashVA2.y)) * cHashM);
}

float Noiseff (float p)
{
  vec2 t;
  float ip, fp;
  ip = floor (p);
  fp = fract (p);
  fp = fp * fp * (3. - 2. * fp);
  t = Hashv2f (ip);
  return mix (t.x, t.y, fp);
}

float Noisefv2 (vec2 p)
{
  vec2 t, ip, fp;
  ip = floor (p);
  fp = fract (p);
  fp = fp * fp * (3. - 2. * fp);
  t = mix (Hashv2v2 (ip), Hashv2v2 (ip + vec2 (0., 1.)), fp.y);
  return mix (t.x, t.y, fp.x);
}

float Fbm1 (float p)
{
  float f, a;
  f = 0.;
  a = 1.;
  for (int j = 0; j < 5; j ++) {
    f += a * Noiseff (p);
    a *= 0.5;
    p *= 2.;
  }
  return f * (1. / 1.9375);
}

float Fbm2 (vec2 p)
{
  float f, a;
  f = 0.;
  a = 1.;
  for (int j = 0; j < 5; j ++) {
    f += a * Noisefv2 (p);
    a *= 0.5;
    p *= 2.;
  }
  return f * (1. / 1.9375);
}

float Fbmn (vec3 p, vec3 n)
{
  vec3 s;
  float a;
  s = vec3 (0.);
  a = 1.;
  for (int j = 0; j < 5; j ++) {
    s += a * vec3 (Noisefv2 (p.yz), Noisefv2 (p.zx), Noisefv2 (p.xy));
    a *= 0.5;
    p *= 2.;
  }
  return dot (s, abs (n));
}

vec3 VaryNf (vec3 p, vec3 n, float f)
{
  vec4 v;
  vec3 g;
  vec2 e = vec2 (0.1, 0.);
  for (int j = VAR_ZERO; j < 4; j ++)
     v[j] = Fbmn (p + ((j < 2) ? ((j == 0) ? e.xyy : e.yxy) : ((j == 2) ? e.yyx : e.yyy)), n);
  g = v.xyz - v.w;
  return normalize (n + f * (g - n * dot (n, g)));
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

/*
 * Original shader from: https://www.shadertoy.com/view/Nl3cDf
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

/*FORK用の必要最小限関数（R050331版）by ニシタマオ*/
mat3 fM3RotateX(float nR){	return mat3( 1, 0, 0, 0, cos(nR),-sin(nR), 0, sin(nR), cos(nR));}
mat3 fM3RotateY(float nR){	return mat3( cos(nR), 0, sin(nR), 0, 1, 0,-sin(nR), 0, cos(nR));}
mat3 fM3RotateZ(float nR){	return mat3( cos(nR),-sin(nR), 0, sin(nR), cos(nR), 0, 0, 0, 1);}

mat3 fM3Rotate(vec3 V3R){
	mat3 M3R =mat3(1,0,0, 0,1,0, 0,0,1);
	M3R *=fM3RotateZ(V3R.z);
	M3R *=fM3RotateX(V3R.x);
	M3R *=fM3RotateY(V3R.y);
	return M3R;
}

mat3 fM3Rotate(vec2 V2R){
	return fM3Rotate(vec3(V2R, 0));
}

mat2 fM2Rotate(float nR){
	return mat2( cos(nR),-sin(nR), sin(nR), cos(nR));
}
/*ここまで*/

/*熊体形状生成機能、FORK用の簡易版（R050331版）by ニシタマオ*/
float fNCappedCylinder(vec4 VP, vec4 VA, vec4 VB){
	float NP, nRadius =VA.w;
	vec3 V3PA =VP.xyz -VA.xyz, V3BA =VB.xyz -VA.xyz;
	float nBABA =dot(V3BA, V3BA), nPABA =dot(V3PA, V3BA);
	float nX =length(V3PA *nBABA -V3BA *nPABA) -nRadius *nBABA;
	float nY =abs(nPABA -nBABA *0.5) -nBABA *0.5;
	float nXX =nX *nX, nYY =nY *nY;
	float nD =(max(nX, nY) <0.0)? -min(nXX, nYY *nBABA):((nX >0.0)? nXX:0.0) +((nY >0.0) ?nYY *nBABA :0.0);
	NP = sign(nD) *sqrt(abs(nD)) /nBABA;
	return NP;
}

float fNCapsule(vec4 VP, vec4 VA, vec4 VB){
	float NP, nRadius =VA.w;
	vec3 V3PA =VP.xyz -VA.xyz, V3BA =VB.xyz -VA.xyz;
	float nA =clamp(dot(V3PA, V3BA) /dot(V3BA, V3BA), 0.0, 1.0);
	vec3 V3P =V3PA -V3BA *nA;
	NP =length(V3P) -nRadius;
	return NP;
}

struct sskelton{
	vec4 VP_Cntr, VP_Body, VP_Shld, VP_Neck, VP_Head, VP_ArRU, VP_ArLU, VP_ArRL, VP_ArLL, VP_LeRU, VP_LeLU, VP_LeRL, VP_LeLL, VP_HndR, VP_HndL, VP_FotR, VP_FotL;
	vec4 VR_Cntr, VR_Body, VR_Shld, VR_Neck, VR_Head, VR_ArRU, VR_ArLU, VR_ArRL, VR_ArLL, VR_LeRU, VR_LeLU, VR_LeRL, VR_LeLL, VR_HndR, VR_HndL, VR_FotR, VR_FotL;

	vec4 VP;
	vec4  VMisc00, VMisc01, VMisc02, VMisc03;
	float nMisc00, nMisc01, nMisc02, nMisc03;
};

sskelton fSSkeltonMake(sskelton SS){
	SS.VR_Cntr.xyz;
	SS.VR_Body.xyz;
	SS.VR_Shld.xyz +=SS.VR_Body.xyz *SS.VR_Shld.w;
	SS.VR_Neck.xyz +=SS.VR_Shld.xyz *SS.VR_Neck.w;
	SS.VR_Head.xyz +=SS.VR_Neck.xyz *SS.VR_Head.w;

	SS.VR_ArRU.xyz +=SS.VR_Shld.xyz *SS.VR_ArRU.w;
	SS.VR_ArLU.xyz +=SS.VR_Shld.xyz *SS.VR_ArLU.w;

	SS.VR_ArRL.xyz +=SS.VR_ArRU.xyz *SS.VR_ArRL.w;
	SS.VR_ArLL.xyz +=SS.VR_ArLU.xyz *SS.VR_ArLL.w;

	SS.VR_HndR.xyz +=SS.VR_ArRL.xyz *SS.VR_HndR.w;
	SS.VR_HndL.xyz +=SS.VR_ArLL.xyz *SS.VR_HndL.w;

	SS.VR_LeRU.xyz +=SS.VR_Body.xyz *SS.VR_LeRU.w;
	SS.VR_LeLU.xyz +=SS.VR_Body.xyz *SS.VR_LeLU.w;

	SS.VR_LeRL.xyz +=SS.VR_LeRU.xyz *SS.VR_LeRL.w;
	SS.VR_LeLL.xyz +=SS.VR_LeLU.xyz *SS.VR_LeLL.w;

	SS.VR_FotR.xyz +=SS.VR_LeRL.xyz *SS.VR_FotR.w;
	SS.VR_FotL.xyz +=SS.VR_LeLL.xyz *SS.VR_FotL.w;

	SS.VP_Shld.xyz *=fM3Rotate(SS.VR_Body.xyz);
	SS.VP_Neck.xyz *=fM3Rotate(SS.VR_Shld.xyz);
	SS.VP_Head.xyz *=fM3Rotate(SS.VR_Neck.xyz);

	SS.VP_ArRU.xyz *=fM3Rotate(SS.VR_Shld.xyz);
	SS.VP_ArLU.xyz *=fM3Rotate(SS.VR_Shld.xyz);

	SS.VP_ArRL.xyz *=fM3Rotate(SS.VR_ArRU.xyz);
	SS.VP_ArLL.xyz *=fM3Rotate(SS.VR_ArLU.xyz);

	SS.VP_HndR.xyz *=fM3Rotate(SS.VR_ArRL.xyz);
	SS.VP_HndL.xyz *=fM3Rotate(SS.VR_ArLL.xyz);

	SS.VP_LeRU.xyz *=fM3Rotate(SS.VR_Body.xyz);
	SS.VP_LeLU.xyz *=fM3Rotate(SS.VR_Body.xyz);

	SS.VP_LeRL.xyz *=fM3Rotate(SS.VR_LeRU.xyz);
	SS.VP_LeLL.xyz *=fM3Rotate(SS.VR_LeLU.xyz);

	SS.VP_FotR.xyz *=fM3Rotate(SS.VR_LeRL.xyz);
	SS.VP_FotL.xyz *=fM3Rotate(SS.VR_LeLL.xyz);

	SS.VP_Body.xyz +=SS.VP_Cntr.xyz;
	SS.VP_Shld.xyz +=SS.VP_Body.xyz;
	SS.VP_Neck.xyz +=SS.VP_Shld.xyz;
	SS.VP_Head.xyz +=SS.VP_Neck.xyz;

	SS.VP_ArRU.xyz +=SS.VP_Shld.xyz;
	SS.VP_ArLU.xyz +=SS.VP_Shld.xyz;

	SS.VP_ArRL.xyz +=SS.VP_ArRU.xyz;
	SS.VP_ArLL.xyz +=SS.VP_ArLU.xyz;

	SS.VP_HndR.xyz +=SS.VP_ArRL.xyz;
	SS.VP_HndL.xyz +=SS.VP_ArLL.xyz;

	SS.VP_LeRU.xyz +=SS.VP_Body.xyz;
	SS.VP_LeLU.xyz +=SS.VP_Body.xyz;

	SS.VP_LeRL.xyz +=SS.VP_LeRU.xyz;
	SS.VP_LeLL.xyz +=SS.VP_LeLU.xyz;

	SS.VP_FotR.xyz +=SS.VP_LeRL.xyz;
	SS.VP_FotL.xyz +=SS.VP_LeLL.xyz;

	return SS;
}

sskelton fSSChange_Inbetween(sskelton SSP, sskelton SSN, float nIB){
	float nP = +nIB *0.5 +0.5, nN = -nIB *0.5 +0.5;
	sskelton SS =SSP;
	SS.VP_Cntr =	SSP.VP_Cntr *nP +SSN.VP_Cntr *nN;
	SS.VP_Body =	SSP.VP_Body *nP +SSN.VP_Body *nN;
	SS.VP_Shld =	SSP.VP_Shld *nP +SSN.VP_Shld *nN;
	SS.VP_Neck =	SSP.VP_Neck *nP +SSN.VP_Neck *nN;
	SS.VP_Head =	SSP.VP_Head *nP +SSN.VP_Head *nN;
	SS.VP_ArRU =	SSP.VP_ArRU *nP +SSN.VP_ArRU *nN;
	SS.VP_ArLU =	SSP.VP_ArLU *nP +SSN.VP_ArLU *nN;
	SS.VP_ArRL =	SSP.VP_ArRL *nP +SSN.VP_ArRL *nN;
	SS.VP_ArLL =	SSP.VP_ArLL *nP +SSN.VP_ArLL *nN;
	SS.VP_LeRU =	SSP.VP_LeRU *nP +SSN.VP_LeRU *nN;
	SS.VP_LeLU =	SSP.VP_LeLU *nP +SSN.VP_LeLU *nN;
	SS.VP_LeRL =	SSP.VP_LeRL *nP +SSN.VP_LeRL *nN;
	SS.VP_LeLL =	SSP.VP_LeLL *nP +SSN.VP_LeLL *nN;
	SS.VP_HndR =	SSP.VP_HndR *nP +SSN.VP_HndR *nN;
	SS.VP_HndL =	SSP.VP_HndL *nP +SSN.VP_HndL *nN;
	SS.VP_FotR =	SSP.VP_FotR *nP +SSN.VP_FotR *nN;
	SS.VP_FotL =	SSP.VP_FotL *nP +SSN.VP_FotL *nN;

	SS.VR_Cntr =	SSP.VR_Cntr *nP +SSN.VR_Cntr *nN;
	SS.VR_Body =	SSP.VR_Body *nP +SSN.VR_Body *nN;
	SS.VR_Shld =	SSP.VR_Shld *nP +SSN.VR_Shld *nN;
	SS.VR_Neck =	SSP.VR_Neck *nP +SSN.VR_Neck *nN;
	SS.VR_Head =	SSP.VR_Head *nP +SSN.VR_Head *nN;
	SS.VR_ArRU =	SSP.VR_ArRU *nP +SSN.VR_ArRU *nN;
	SS.VR_ArLU =	SSP.VR_ArLU *nP +SSN.VR_ArLU *nN;
	SS.VR_ArRL =	SSP.VR_ArRL *nP +SSN.VR_ArRL *nN;
	SS.VR_ArLL =	SSP.VR_ArLL *nP +SSN.VR_ArLL *nN;
	SS.VR_LeRU =	SSP.VR_LeRU *nP +SSN.VR_LeRU *nN;
	SS.VR_LeLU =	SSP.VR_LeLU *nP +SSN.VR_LeLU *nN;
	SS.VR_LeRL =	SSP.VR_LeRL *nP +SSN.VR_LeRL *nN;
	SS.VR_LeLL =	SSP.VR_LeLL *nP +SSN.VR_LeLL *nN;
	SS.VR_HndR =	SSP.VR_HndR *nP +SSN.VR_HndR *nN;
	SS.VR_HndL =	SSP.VR_HndL *nP +SSN.VR_HndL *nN;
	SS.VR_FotR =	SSP.VR_FotR *nP +SSN.VR_FotR *nN;
	SS.VR_FotL =	SSP.VR_FotL *nP +SSN.VR_FotL *nN;
	return SS;
}

void fExchangeV(inout vec4 VR, inout vec4 VL){
	vec4 Vtmp =VR;
	VR =VL, VL =Vtmp;
}

sskelton fSSChange_MirrorX(sskelton SS){
	SS.VR_Cntr.yz *=-1.0;
	SS.VR_Body.yz *=-1.0;
	SS.VR_Shld.yz *=-1.0;
	SS.VR_Neck.yz *=-1.0;
	SS.VR_Head.yz *=-1.0;
	SS.VR_ArRU.yz *=-1.0;
	SS.VR_ArLU.yz *=-1.0;
	SS.VR_ArRL.yz *=-1.0;
	SS.VR_ArLL.yz *=-1.0;
	SS.VR_LeRU.yz *=-1.0;
	SS.VR_LeLU.yz *=-1.0;
	SS.VR_LeRL.yz *=-1.0;
	SS.VR_LeLL.yz *=-1.0;
	SS.VR_HndR.yz *=-1.0;
	SS.VR_HndL.yz *=-1.0;
	SS.VR_FotR.yz *=-1.0;
	SS.VR_FotL.yz *=-1.0;
	fExchangeV(SS.VR_ArRU, SS.VR_ArLU);
	fExchangeV(SS.VR_ArRL, SS.VR_ArLL);
	fExchangeV(SS.VR_LeRU, SS.VR_LeLU);
	fExchangeV(SS.VR_LeRL, SS.VR_LeLL);
	fExchangeV(SS.VR_HndR, SS.VR_HndL);
	fExchangeV(SS.VR_FotR, SS.VR_FotL);

	SS.VP_Cntr.x *=-1.0;
	return SS;
}

sskelton fSSRChange_Multiple(sskelton SS, vec4 VD){
	SS.VR_Cntr *= VD;
	SS.VR_Body *= VD;
	SS.VR_Shld *= VD;
	SS.VR_Neck *= VD;
	SS.VR_Head *= VD;
	SS.VR_ArRU *= VD;
	SS.VR_ArLU *= VD;
	SS.VR_ArRL *= VD;
	SS.VR_ArLL *= VD;
	SS.VR_LeRU *= VD;
	SS.VR_LeLU *= VD;
	SS.VR_LeRL *= VD;
	SS.VR_LeLL *= VD;
	SS.VR_HndR *= VD;
	SS.VR_HndL *= VD;
	SS.VR_FotR *= VD;
	SS.VR_FotL *= VD;
	return SS;
}

sskelton fSSRChange_Multiple(sskelton SS, float nD){
	return fSSRChange_Multiple(SS, vec4(nD, nD, nD, 1));
}

vec3 fV3Attach(vec3 V3P, vec3 V3S, vec3 V3R){
	return (V3P -V3S) *fM3Rotate(-V3R);
}

/*筋肉部*/
float fNMusclePart01(vec4 VP, vec4 VA, vec4 VB){
	return fNCappedCylinder(VP, VA, VB);
}

float fNMusclePart02(vec4 VP, vec4 VA, vec4 VB){
	return fNCapsule(VP, VA, VB);
}

float fNMuscle_Animal00(sskelton SS){
	vec4 VP =SS.VP, VA, VB;
	float NP =1e+6;
	VP.xyz *=fM3Rotate(SS.VR_Cntr.xyz);

	VA =SS.VP_Body, VB =SS.VP_Shld;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_Neck, VB =SS.VP_Head;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_ArRU, VB =SS.VP_ArRL;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_ArRL, VB =SS.VP_HndR;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_ArLU, VB =SS.VP_ArLL;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_ArLL, VB =SS.VP_HndL;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_LeRU, VB =SS.VP_LeRL;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_LeRL, VB =SS.VP_FotR;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_LeLU, VB =SS.VP_LeLL;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	VA =SS.VP_LeLL, VB =SS.VP_FotL;
	NP =min(NP, fNMusclePart02(VP, VA, VB));
	return NP;
}

/*骨格部*/
sskelton fSSPSet_Bear01(sskelton SS){
	float nE =0.25;
	SS.VP_Cntr;
	SS.VP_Body =vec4(0,	0,	0,	1	) *nE;
	SS.VP_Shld =vec4(0,	1.5,	0,	0	) *nE;
	SS.VP_Neck =vec4(0,	0,	0,	0.7	) *nE;
	SS.VP_Head =vec4(0,	1,	0,	0	) *nE;
	SS.VP_ArRU =vec4(+0.8,	0,	0,	0.4	) *nE;
	SS.VP_ArLU =vec4(-0.8,-	0,	0,	0.4	) *nE;
	SS.VP_ArRL =vec4(0,	-1,	0,	0.3	) *nE;
	SS.VP_ArLL =vec4(0,	-1,	0,	0.3	) *nE;
	SS.VP_LeRU =vec4(+0.6,0,	0,	0.45	) *nE;
	SS.VP_LeLU =vec4(-0.6,0,	0,	0.45	) *nE;
	SS.VP_LeRL =vec4(0,	-1,	0,	0.4	) *nE;
	SS.VP_LeLL =vec4(0,	-1,	0,	0.4	) *nE;
	SS.VP_HndR =vec4(0,	-1,	0,	0	) *nE;
	SS.VP_HndL =vec4(0,	-1,	0,	0	) *nE;
	SS.VP_FotR =vec4(0,	-1,	0,	0	) *nE;
	SS.VP_FotL =vec4(0,	-1,	0,	0	) *nE;
	return SS;
}

/*関節部*/
sskelton fSSRSet_Bear01(sskelton SS){
	float nD =acos(-1.0) /180.0, nS =sin(SS.VP.w *acos(-1.0)), nSL =sin((SS.VP.w +30.0/180.0)*acos(-1.0)), nE =0.25;
	SS.VR_Cntr;
	SS.VR_Body =vec4(-90.0 +15.0 *nS,	0,	0,		0);
	SS.VR_Shld =vec4(0,			0,	0,		0);
	SS.VR_Neck =vec4(-45.0,			0,	0,		1);
	SS.VR_Head =vec4(0,			0,	0,		1);
	SS.VR_ArRU =vec4(30.0 +60.0 *nS,	0,	-5.0 +5.0 *nS,	1);
	SS.VR_ArLU =vec4(30.0 +60.0 *nSL,	0,	+5.0 -5.0 *nSL,	1);
	SS.VR_ArRL =vec4(15.0 +15.0 *nS,	0,	0,		1);
	SS.VR_ArLL =vec4(15.0 +15.0 *nSL,	0,	0,		1);
	SS.VR_LeRU =vec4(-15.0 -75.0 *nS,	0,	+5.0 -5.0 *nS,	0);
	SS.VR_LeLU =vec4(-15.0 -75.0 *nSL,	0,	-5.0 +5.0 *nSL,	0);
	SS.VR_LeRL =vec4(-30.0 +45.0 *nS,	0,	0,		1);
	SS.VR_LeLL =vec4(-30.0 +45.0 *nSL,	0,	0,		1);
	SS.VR_HndR =vec4(0,			0,	0,		1);
	SS.VR_HndL =vec4(0,			0,	0,		1);
	SS.VR_FotR =vec4(0,			0,	0,		1);
	SS.VR_FotL =vec4(0,			0,	0,		1);

	SS =fSSRChange_Multiple(SS, nD);

	SS.VP_Cntr.y =+sin((SS.VP.w -60.0/180.0) *acos(-1.0)) *nE;
	return SS;
}

/*小物部*/
float fNAttachment_HeadBear01(vec4 VP){
	float NP =1e+6, nPi, nA =0.25;
	vec3 V3P =VP.xyz;
	{
		nPi =length(V3P) -1.0 *nA;
		NP =min(NP, nPi);
		nPi =length(V3P -vec3(0,0,-1) *nA) -0.5 *nA;
		NP =min(NP, nPi);
		nPi =length(V3P -vec3(0,0.3,-1.4) *nA) -0.2 *nA;
		NP =min(NP, nPi);
		nPi =length(vec3(abs(V3P.x), V3P.yz) -vec3(0.4,0.5,-0.7) *nA) -0.15 *nA;
		NP =min(NP, nPi);
		nPi =length(vec3(abs(V3P.x), V3P.yz) -vec3(0.7,0.8,0.4) *nA) -0.3 *nA;
		nPi =max(nPi, -(V3P.z -0.4 *nA));
		NP =min(NP, nPi);
	}
	return NP;
}

/*衣装部*/
float fNOutfit_Bear01(sskelton SS){
	float NP =1e+6, nE =0.25;
	vec4 VP =SS.VP;
	VP.xyz *=fM3Rotate(SS.VR_Cntr.xyz);

	vec3 V3P;
	V3P =fV3Attach(VP.xyz, SS.VP_Head.xyz, SS.VR_Head.xyz);
	{
		float nPP;
		nPP =fNAttachment_HeadBear01(vec4(V3P, VP.w));
		NP =min(NP, nPP);
	}

	V3P =fV3Attach(VP.xyz, SS.VP_Body.xyz, SS.VR_Body.xyz);
	{
		float nPP;
		nPP =length(V3P -vec3(0,-0.6,1) *nE) -0.4 *nE;
		NP =min(NP, nPP);
	}

	return NP;
}

float fNBodyAndOutfit_Bear01(sskelton SS){
	SS =fSSPSet_Bear01( SS);
	SS =fSSkeltonMake( SS);
	return min(fNMuscle_Animal00(SS), fNOutfit_Bear01(SS));
}

/*総体部*/
float fNObject_WalkBear01(vec4 VP){
	sskelton SS;
	SS.VP =VP;
	SS =fSSRSet_Bear01( SS);
	return fNBodyAndOutfit_Bear01( SS);
}
/*ここまで*/

// --------[ Original ShaderToy begins here ]---------- //
float sdfPlane(vec3 p){
    return p.y + 0.5;
}

float sdfCircle(vec3 p){
    return length(p - vec3(0.,.5,0.)) - 1.2;
}

float sdfRect(vec3 p){
    vec3 b = vec3(1.,1.,1.);
    vec3 q = abs(p - vec3(0.,0.5,0.)) - b;
    return length(max(q,0.)) + min(max(q.x,max(q.y,q.z)),0.);
}

float sdfCombo(vec3 p){
    return min(sdfRect(p),sdfCircle(p));
}

float map(vec3 p){
	vec4 VP =vec4(p, time);
	VP.xz =mod(VP.xz +VP.w *vec2(1,2), 4.0) -2.0;
    return min(min(sdfPlane(p),sdfCombo(p)),fNObject_WalkBear01(VP));
}

float rayMatch(vec3 ro,vec3 rd){
    float d = 0.;
    for(int i = 0;i < 255;i++){
        vec3 p = ro + rd * d;
        float sd = map(p);
        d = d + sd;
        if(sd < 0.001 || d > 40.0){
            break;
        }
    }
    return d;
}

float shadow(vec3 ro,vec3 rd){
    float hit = 1.;
    float t = 0.02;

    for(int i = 0;i < 255;i++){
        vec3 p = ro + rd * t;
        float h = map(p);
        if(h < 0.001){
            return 0.;
        }
        t += h;
        hit = min(hit, 10. * h / t);
        if(t >= 10.0){
            break;
        }
    }
    return clamp(hit,0.,1.);
}

mat3 cameraToWorld(vec3 ro,vec3 lookAt){
    vec3 a = normalize(lookAt - ro);
    vec3 b = cross(vec3(0.,1.,0),a);
    vec3 c = cross(a,b);
    return mat3(b,c,a);
}

vec3 normal(vec3 p){
    float d = map(p);
    vec2 dd = vec2(0.001,0.);
    float dx = d - map(p - dd.xyy);
    float dy = d - map(p - dd.yxy);
    float dz = d - map(p - dd.yyx);
    return normalize(vec3(dx,dy,dz));
}

float disney_a(float f90,float k){
    return 1. + (f90 - 1.) * pow(1. - k,5.);
}

float disney_f90(float rough,float HdotL){
    return 0.5 + 2. * rough * HdotL * HdotL;
}

vec3 disney_diffuse(vec3 color,float rough,float HdotL,float NdotL,float NdotV){
    float f90 = disney_f90(rough,HdotL);
    return color / 3.14 * disney_a(f90,NdotL) * disney_a(f90,NdotV);
}

float ggx(float rough,float NdotH){
    float rr = rough * rough;
    float num = max(3.14 * pow(NdotH * NdotH * (rr - 1.) + 1.,2.),0.001);
    return rr / num;
}

float smith_ggx(float k,float d){
    return d / (d * (1. - k) + k);
}

float smith(float rough,float NdotV,float NdotL){
    float a = pow((rough + 1.) / 2.,2.);
    float k = a / 2.;
    return smith_ggx(k,NdotV) * smith_ggx(k,NdotL);
}

vec3 fresnel(vec3 f0,float HdotV){
    return f0 + (1. - f0) * pow(1. - HdotV,5.);
}

vec3 g_specular(vec3 baseColor,float rough,float NdotH,float NdotV,float NdotL,float HdotV){
    return ggx(rough,NdotH) * smith(rough,NdotV,NdotL) * fresnel(baseColor,HdotV) / (4. * NdotL * NdotV);
}


vec3 calLightColor(vec3 rd,vec3 p,vec3 n,vec3 lp,vec3 lc){
        vec3 sp = p + n * 0.002;
        vec3 col = vec3(0.);
        vec3 l = normalize(lp - p);
        vec3 v = normalize(-rd);
        vec3 h = normalize(l + v);

        float NdotL = clamp(dot(n,l),0.,1.);
        float HdotL = clamp(dot(h,l),0.,1.);
        float NdotV = clamp(dot(n,v),0.,1.);
        float NdotH = clamp(dot(n,h),0.,1.);
        float HdotV = clamp(dot(h,v),0.,1.);
        vec3 baseColor;
        if(sdfPlane(p) < 0.001){
            float k = mod(floor(p.x * 2.) + floor(p.z * 2.),2.);
            baseColor = 0.4 + k * vec3(0.6);
        }else{
            baseColor = vec3(0.77,0.78,0.78);
        }
        float rough = 0.2;

        float shadow = shadow(sp,l);
        vec3 diffuse = disney_diffuse(baseColor,rough,HdotL,NdotL,NdotV);
        vec3 specular = g_specular(baseColor,rough,NdotH,NdotV,NdotL,HdotV);
        vec3 k = shadow * clamp(diffuse + specular,0.,1.) * NdotL * 3.14;
        col += lc * k;
        return col;
}

vec3 rayMatchColor(in vec3 ro,in vec3 rd,out bool hit,out vec3 p,out vec3 n){
    vec3 col = vec3(0.);
    float d = rayMatch(ro,rd);
    if(d <= 40.0){
        p = ro + rd * d;
        n = normal(p);
        vec3 lp = vec3(0.,5.,-8.);
        vec3 lc = vec3(0.7,0.7,0.7);
        col += calLightColor(rd,p,n,lp,lc);
        vec3 lp2 = vec3(0.,2.,4.);
        vec3 lc2 = vec3(0.3,0.3,0.3);
        col += calLightColor(rd,p,n,lp2,lc2);
        hit = true;
    }else{
        hit = false;
    }
    return col;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy - 0.5;
    uv.x = uv.x * iResolution.x / iResolution.y;

    vec3 ro = vec3(5. * cos(iTime),3.,5. * sin(iTime));
    vec3 rd = cameraToWorld(ro,vec3(0.,0.,0.)) * vec3(uv,1.);

    vec3 col = vec3(0.);
    bool hit;
    vec3 p;
    vec3 n;
    col += rayMatchColor(ro,rd,hit,p,n);
    if(hit && sdfCombo(p) < 0.001){
        vec3 rro = p + n * 0.002;
        vec3 rrd = normalize(reflect(normalize(rd),n));
        vec3 pp;
        vec3 nn;
        vec3 rColor = rayMatchColor(rro,rrd,hit,pp,nn) * 0.64;
        col += rColor;
    }
    fragColor = vec4(col,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

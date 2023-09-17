/*
 * Original shader from: https://www.shadertoy.com/view/NlGcDh
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
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Francesco S. Spoto
//
// The total field is generated the sum of a baunch of 3D fields with a quintic falloff.
//
// First ray trace the scene (fields bounding spheres) to get the nearest total field point,
// then ray march inside it until the searched isosurface.
//
// I will use the quintic polinomial as falloff, that avoid discontinuities in the normals,
// as shown by IQ in https://www.shadertoy.com/view/ld2GRz (tnx 🙏).
//

// Define a very large value, will be used as infinity
#define INF 1e5
#define PI acos(-1.)

struct Hit
{
    float t;
    vec3 point;
    vec3 normal;
    vec3 color;
    int objId;
};

void swap(inout float x0, inout float x1)
{
    float tmp = x0;
    x0=x1;
    x1=tmp;
}

bool solveQuadratic(float a, float b, float c, out float x0, out float x1)
{
    float delta = b*b-4.*a*c;
    if (delta < 0.) return false;
    else if (delta == 0.)
    {
        x0 = x1 = -0.5*b/a;
    }
    else
    {
        float q = (b > 0.) ? -0.5 * (b + sqrt(delta)) : -0.5 * (b - sqrt(delta));
        x0 = q/a;
        x1 = c/q;
    }

    return true;
}

bool traceSphere(vec3 eye, vec3 ray, vec3 center, float radius, out Hit hit)
{
    float t0, t1;

    vec3 L = eye-center;
    float a = dot(ray,ray);
    float b = 2. * dot(ray,L);
    float c = dot(L,L) - (radius*radius);
    if (!solveQuadratic(a, b, c, t0, t1)) return false;

    if (t0 > t1) swap(t0, t1);

    if (t0 < 0.)
    {
        t0 = t1;  //if t0 is negative, let's use t1 instead
        if (t0 < 0.) return false;  //both t0 and t1 are negative
    }

    hit.t = t0;
    hit.point = eye + t0*ray;
    hit.normal = normalize(hit.point - center);

    return true;
}

struct Material
{
    vec3 Fresnel0;   // Fresnel value when the light incident angle is 0 (angle between surface normal and to light direction)
    float roughness; // Roughness in [0,1]
    vec3 albedo;
};

// Palette generator tnx Iq
vec3 getColor(vec3 a, vec3 b, vec3 c, vec3 d, float t)
{
    return a + b*cos(2.*PI*(t*c+d));
}

// Color palette
vec3 samplePalette(float t)
{
     vec3 a = vec3(0.5,0.5,0.5);
     vec3 b = vec3(.5,0.5,0.5);
     vec3 c = vec3(1.0,1.0,1.0);
     vec3 d = vec3(0.,0.2,0.4);

     return getColor(a,b,c,d,t);
}

Material getMaterial(int matId, int objId)
{
    Material mat;
    mat.albedo = vec3(1);
    mat.albedo = samplePalette(float(objId*60)/800.);
    return mat;
}

// Render a field hit.
vec3 render(vec3 eye, Hit hit)
{
    // No hit -> background
    if(hit.objId == -1) return vec3(0);

    // Get the material of the hitten object at the hitten point
    //Material mat = getMaterial(hit.objId, 6);
    Material mat;
    mat.albedo = hit.color;

    // Lights in the scene
    vec3 KeyLightPos = vec3(0,1,0);
    vec3 KeyLightColor = vec3(0.5,0.8,0.1);
    vec3 fillLightPos = vec3(0,1,0);
    vec3 fillLightColor = vec3(0.65);
    vec3 backLightPos = vec3(-1,-1,-1);
    vec3 backLightColor = vec3(0.5);

    vec3 ambientLight = vec3(0.1,0.1,0.1);

    // Vector used in the computation of lighting
    vec3 N = hit.normal;               // Surface normal
    vec3 L = normalize(KeyLightPos);   // To light dir
    vec3 V = normalize(eye-hit.point); // To eye vector
    vec3 H = normalize(V+L);           // Half vector between to light direction and to eye direction
    vec3 R = reflect(-L,N);

    // Compute different light components
    vec3 ambient = ambientLight * mat.albedo;
    vec3 diffuse = max(dot(N,L),0.) * KeyLightColor * mat.albedo;
    diffuse += max(dot(N,normalize(fillLightPos)),0.) * fillLightColor * mat.albedo;
    diffuse += max(dot(N,normalize(backLightPos)),0.) * backLightColor * mat.albedo;

    diffuse += 0.07*texture(iChannel0, R).xyz;
    float specular = pow(max(dot(R,V),0.),10.);
    float fresnel = 0.2 * pow(1.+dot(N,-V),4.);
    return diffuse + 0.4*specular + 2.*fresnel;
}

// A field function
struct Field
{
    vec3 position;
    float radius;
};

// Define the number of functions (scalar fields) that generate the total field
#define N_FIELDS 8
Field fields[N_FIELDS];
void init_fields() {
    fields[0] = Field(vec3(0,0,0),1.);
    fields[1] = Field(vec3(0,0,0),2.);
    fields[2] = Field(vec3(0,0,0),3.);
    fields[3] = Field(vec3(0,0,0),4.);
    fields[4] = Field(vec3(0,0,0),5.);
    fields[5] = Field(vec3(0,0,0),2.);
    fields[6] = Field(vec3(0,0,0),3.);
    fields[7] = Field(vec3(0,0,0),4.);
}

// Get the value of the falloff function and the derivative for a value of x in [0,1]
void getFalloff(float x, out float f)
{
    f = 0.;
    if(x<0.01||x>1.) return; // Field is 0 outside [0,1]

    // Quintic falloff 1-6x^5 - 15x^4 + 10x^3
    f = 1.-(x*x*x*(6.*x*x-15.*x + 10.));
}

// Get the falloff derivative
void getFalloffDerivative(float x, out float df)
{
    df = 0.;
    if(x<0.01||x>1.) return; // Field is 0 outside [0,1]

    // Quintic fallof derivative 1-(30x^4 - 60x^2 + 30x)
    df = -(x*x*(30.*x*x - 60.*x + 30.));
}

// Get the field values, return true if hit the isosurface of a give threshold
// return also the normal and the color in that point.
bool getFieldValues(vec3 p, float threshold, out float value, out vec3 normal, out vec3 color)
{
    normal = vec3(0);
    float f, df;
    value = 0.;

    // Compute the field generated from all the scalar field that we sum up ...
    for(int i=0;i<N_FIELDS;i++)
    {
        // The distance from the center of the field
		float r = length(p-fields[i].position);

        // Test against Bounding Sphere of the field
        if(length(p-fields[i].position)>fields[i].radius) continue;

        // The distance from the center of the function is normalized with the radius of the field
        float d = length((p-fields[i].position)/fields[i].radius);

        // Get the value of the falloff ...
        getFalloff(d, f);

        // ... and sum it to the total
        value += f;

        // Already choose a color in case this is a hit
        color = mix(color,samplePalette(float(i*50)/800.),f/2.);
    }

    // If the value of the field is greater than threshold we reach the isosurface,
    // so compute the normal
    if(value>=threshold)
    {
        float df=0.;

        // The resulting normal is the sum of all the gradient of the fields function summed up.
        // The gradient of a single field is the derivative of its falloff in this point (that is a scalar)
        // multiplied the normal vector to the surface, that is the differece between the current position
        // and the center of the field (it's a spherical field).
        for(int i=0;i<N_FIELDS;i++)
        {
            // Get the value of the falloff derivative in this point ...
            float d = length((p-fields[i].position)/fields[i].radius);
            getFalloffDerivative(d, df);

            // Compute the normal of this specific field in this position and sum to the others
            normal += df*normalize(fields[i].position-p);
        }

        // Normalize the result
        normal = normalize(normal);

        return true;
    }

    // Not reached the isosurface yet
    return false;
}


// Find the nearest distance from origin to the field generated by the spheres on the dir direction,
// return INF if the ray does not intersect the field
Hit rayTraceFieldBoudingSpheres(vec3 origin, vec3 dir)
{
    float minT = INF;
    float point;
    Hit hit, result;

    // Get nearest point from the spheres
    result.t = INF;
    for(int i=0; i<N_FIELDS; i++)
    {
        if(traceSphere(origin, dir, fields[i].position, fields[i].radius, hit) && hit.t<result.t)
        {
            result.t = hit.t;
            result.point = origin + result.t*dir;
            result.objId = 1;
        }
    }

    return result;
}

// Update the position of the objects in the scene
void updateField()
{
    for(int i=0; i<N_FIELDS; i++)
    {
        float id = float(i);
        float a = 2.;
        fields[i].position = vec3(a*sin((iTime*60.)/200.+id*244.),1.4*abs(sin(id*0.1*iTime+323.3))-1.,a*sin((iTime*60.)/100.+id*1724.)) * 2.;
    }
}

// Cast a ray into the scene
vec3 castRay(vec3 origin, vec3 dir)
{
    // Update the position of the fields in the scene
    updateField();

    vec3 fieldNormal;

    const float MAX_DISTANCE = 20.;
    const int MAX_ITERATIONS = 200;

    // getDistanceToField Ray-Trace the field spheres bounding boxes Get to the field nearest point, ray
    Hit hit = rayTraceFieldBoudingSpheres(origin, dir);

    float t = hit.t;
    if(t==INF) return vec3(1); // No hit -> return white background

    // Ray march inside the scalar field
    vec3 p;
    vec3 color;
    float value=0.;
    float threshold = 0.4;
    for(int i=0; i<MAX_ITERATIONS; i++)
    {
        if(t>MAX_DISTANCE) break; // No hit
        t+=0.05;
        p = origin + t*dir;

        if(getFieldValues(p, threshold, value, fieldNormal,color))
        {
            hit.t=t;
            hit.point=p;
            hit.normal=fieldNormal;
            hit.objId=1;
            hit.color=color;
            break;

        }
    }

    if(value < 0.4) return vec3(1); // No ray marcher hit -> return background white

    return render(origin,hit);
}

// This is function is executed for each pixel
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Change coordinates from [0,iResolution.x]X[0,iResolution.y] to [-1,1]X[-1,1]
    vec2 U = (2.*fragCoord.xy - iResolution.xy) / iResolution.x;

    // Right-handed camera reference system
    float tetha, phi;
    if(iMouse.z > 0.)
    {
        // Camera angle when clicking on the mouse
        tetha = clamp(iMouse.x/iResolution.x *2.*PI, 0.,2.*PI);
        phi = clamp(iMouse.y/iResolution.y*PI, 0.,PI);
    }
    else
    {
        // Camera angle when the mouse is not clicked
        tetha = mod(iTime,2.*PI);
        phi = PI*1./4.;
    }

    // Eye position
    vec3 eye = vec3(12.*cos(tetha)*sin(phi),12.*cos(phi),12.*sin(tetha)*sin(phi));

    // Target position
    vec3 target = vec3(0,0,0);

    // Camera reference frame
    vec3 ww = normalize(eye-target);
    vec3 uu = normalize(cross(vec3(0,1,0),ww));
    vec3 vv = normalize(cross(ww,uu));

    // Cast a ray from origin through pixel, into the scene
    float focalLength = 1.4;
    vec3 ray = normalize(U.x*uu + U.y*vv - focalLength*ww);
    fragColor = vec4(castRay(eye,ray),1.);

    // Gamma correction
    fragColor = pow(fragColor,vec4(0.45));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    init_fields();
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.;
}

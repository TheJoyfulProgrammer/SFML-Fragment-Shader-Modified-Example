/*
 * Original shader from: https://www.shadertoy.com/view/fsGBzW
 */

// Emulate some GLSL ES 3.x
#define round(x) (floor((x) + 0.5))

#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
/// A simple 2D landscape created using Perlin noise.


float random(vec2 _st)
{
    return fract(sin(dot(_st.xy,
                         vec2(0.630, 0.710))) *
        43759.329);
}

//柏林噪声
float noise(vec2 _st)
{
    vec2 i = floor(_st);
    vec2 f = fract(_st);


    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a) * u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 6

//布朗分形
float fbm(vec2 _st)
{
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0, 100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));

    for (int i = 0; i < NUM_OCTAVES; ++i)
    {
        v += a * noise(_st);
        //_st = mul(_st, rot) * 2.0 + shift;
        _st = _st*rot * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

vec3 FilterColor(vec3 color1, vec3 color2)
{
    //变亮
    //Y(亮度)=(0.299*R)+(0.587*G)+(0.114*B)
    //float brightness1 = (0.299 * color1.r) + (0.587 * color1.g) + (0.114 * color1.b);
    //float breghtness2 = (0.299 * color2.r) + (0.587 * color2.g) + (0.114 * color2.b);
    //return brightness1 > breghtness2 ? color1 : color2;

    //滤色
    return 1.0 - (1.0 - color1) * (1.0 - color2);
}

//USEFUL FUNCTIONS//
//RNG Returning a Float (0. to 1.)
float randomValue(vec2 uv)
{
    return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

//RNG Returning a Vec2 (0. to 1.)
vec2 randomVector(vec2 uv)
{
    vec3 a = fract(uv.xyx * vec3(123.34, 234.34, 345.65));
    a += dot(a, a + 34.45);
    return fract(vec2(a.x * a.y, a.y * a.z));
}

//RNG Returning a Diagonal Vec2 (4 Directions)
vec2 randomLimitedVector(vec2 uv)
{
    vec2 randomVector = randomVector(uv);
    return vec2(round(randomVector.x) * 2. - 1.,
                round(randomVector.y) * 2. - 1.);
}

//Map
float map(float value, float currentMin, float currentMax, float targetMin, float targetMax)
{
    return targetMin + (targetMax - targetMin) * ((value - currentMin) / (currentMax - currentMin));
}

//Smootherstep
float smootherstep(float value)
{
    return 6.0 * pow(value, 5.) - 15. * pow(value, 4.) + 10. * pow(value, 3.);
}

vec2 lengthdir(vec2 basePoint, float direction, float lngth)
{
    return basePoint + vec2(cos(direction) * lngth, sin(direction) * lngth);
}

//RGB to HSV Converter (Not My Code)
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


//DRAW FUNCTIONS//
//Draw a Line
void drawLine(vec2 uv, vec2 point1, vec2 point2, float thickness, float blur, inout float value)
{
    //Get Sides of a Triangle
    float a = distance(uv, point2);
    float b = distance(uv, point1);
    float c = distance(point1, point2);

    //Calculate Point's Distance from the Line
    float distanceFromLine = sqrt(abs(pow(a, 2.) - pow((pow(a, 2.) - pow(b, 2.) + pow(c, 2.)) / (2. * c), 2.)));

	//Get Pixel's Value
    float pixelValue = smoothstep(thickness + blur, thickness, distanceFromLine);
    pixelValue *= smoothstep(thickness + blur, thickness, a + b - c);
    value = mix(value, 1., pixelValue);
}

//Draw a Disk
void drawDisk(vec2 uv, vec2 position, float radius, float blur, vec3 colour, inout vec3 value)
{
    float pixelValue = smoothstep(radius + blur, radius, distance(position, uv));
    value = mix(value, colour, pixelValue);
}

//Draw a Disk with Return Value
float diskValue(vec2 uv, vec2 position, float radius, float blur)
{
    return smoothstep(radius + blur, radius, distance(position, uv));
}

//Perlin Noise
float perlinNoise(vec2 uv, float frequency, int octaves, float lacunarity, float persistence)
{
    float amplitude = 1.;
    float pixelValue = 0.;
    float maxValue = 0.;	//used to normalize the final value

    for (int octave = 0; octave < 8; octave ++)
    {
        if (octave >= octaves) break;

        //Get Pixel's Position Within the Cell && Cell's Position Within the Grid
        vec2 pixelPosition = fract(uv * frequency);
        vec2 cellPosition = floor(uv * frequency);

        //Get Gradient Vectors of the Cell's Points
        vec2 gradientVector1 = randomLimitedVector(cellPosition);
        vec2 gradientVector2 = randomLimitedVector(vec2(cellPosition.x + 1., cellPosition.y));
        vec2 gradientVector3 = randomLimitedVector(vec2(cellPosition.x, cellPosition.y + 1.));
        vec2 gradientVector4 = randomLimitedVector(vec2(cellPosition.x + 1., cellPosition.y + 1.));

        //Calculate Distance Vectors from the Cell's Points to the Pixel
        vec2 distanceVector1 = vec2(pixelPosition.x, - pixelPosition.y);
        vec2 distanceVector2 = vec2(- (1. - pixelPosition.x), - pixelPosition.y);
        vec2 distanceVector3 = vec2(pixelPosition.x, 1. - pixelPosition.y);
        vec2 distanceVector4 = vec2(- (1. - pixelPosition.x), 1. - pixelPosition.y);

        //Calculate Dot Product of the Gradient && Distance Vectors
        float dotProduct1 = dot(gradientVector1, distanceVector1);
        float dotProduct2 = dot(gradientVector2, distanceVector2);
        float dotProduct3 = dot(gradientVector3, distanceVector3);
        float dotProduct4 = dot(gradientVector4, distanceVector4);

        //Apply Smootherstep Function on the Pixel Position for Interpolation
        vec2 pixelPositionSmoothed = vec2(smootherstep(pixelPosition.x), smootherstep(pixelPosition.y));

        //Interpolate Between the Dot Products
        float interpolation1 = mix(dotProduct1, dotProduct2, pixelPositionSmoothed.x);
        float interpolation2 = mix(dotProduct3, dotProduct4, pixelPositionSmoothed.x);
        float interpolation3 = mix(interpolation1, interpolation2, pixelPositionSmoothed.y);

        pixelValue += (interpolation3 * 0.5 + 0.5) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return pixelValue / maxValue;
}

//Draw a Hill
void drawHill(vec2 uv, vec3 colour, float blur, float speed, float flatness, float xOffset, float yOffset, bool drawTrees, inout vec3 value, float frequency, int octaves, float lacunarity, float persistence)
{
    float noiseValue = perlinNoise(vec2(uv.x + xOffset + iTime * speed, 0.5), frequency, octaves, lacunarity, persistence) * flatness;
    float pixelValue = smoothstep(noiseValue, noiseValue - blur, uv.y - yOffset);
    value = mix(value, colour, pixelValue);
}

//Draw Fog
void drawFog(vec2 uv, vec2 yBorders, float speed, float density, float contrast, float frequency, int octaves, float lacunarity, float persistence, inout vec3 value)
{
    //return;
    //Get the Noise Value
    float noiseValue = perlinNoise(vec2(uv.x * 0.8 + iTime * speed, uv.y), frequency, octaves, lacunarity, persistence);
    float ampl = sin(texture(iChannel0,uv).x)*0.5+0.5;
    noiseValue*=ampl*sin(iTime)*0.25+1.0;
    //Create Gradient Masks
    float densityGradient = smoothstep(yBorders.y + 0.6, yBorders.y, uv.y);
    float whiteGradient = smoothstep(yBorders.x + 0.3, yBorders.x - 0.2, uv.y) * 0.3 * density;

    //Adjust the Value
    noiseValue = smoothstep(0.2, 0.7, noiseValue) * densityGradient * 0.75 * density + whiteGradient;
    noiseValue = clamp(map(noiseValue, 0., 1., 0. - contrast, 1.1) * densityGradient, 0., 1.);
    value = mix(value, vec3(noiseValue + 0.2), noiseValue);
    //value = vec3(noiseValue);
}


//MAIN//
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Remap the fragCoord
    vec2 uv = fragCoord / iResolution.y;
    //uv *= mat2(.707, -.707, .707, .707);

    float shake = sin(iTime)*0.015;
    uv *= mat2(cos(shake), -sin(shake), sin(shake), cos(shake));
    // zoomout/in
    uv*=sin(iTime/3.)*0.5+1.5;
    //uv *= mat2(cos(iTime)*0.5, -sin(iTime)*0.5, sin(iTime)*0.5, cos(iTime)*0.5);
    float aspectRatio = iResolution.y / iResolution.x;

    //Set the Colours
    vec3 skyColour1 = vec3(47./255.,90./255.,163./255.);//hsv2rgb(vec3(216. / 360., 17. / 100., 100. / 100.));
    vec3 skyColour2 = vec3(254./255.,193./255.,116./255.);//hsv2rgb(vec3(37. / 360., 34. / 100., 92. / 100.));
    //texture(iChannel0,uv).xyz;
    vec3 hillColour1 = hsv2rgb(vec3(200. / 360., 16. / 100., 59. / 100.));
    vec3 hillColour2 = hsv2rgb(vec3(15. / 360., 6. / 100., 30. / 100.));
    vec3 hillColour3 = hsv2rgb(vec3(194. / 360., 35. / 100., 28. / 100.));

    vec3 sunColour = vec3(45. / 360., 0. / 100., 100. / 100.);	//in HSV model

    // enable mouse
    //float my = (iMouse.y/iResolution.y)*1.0;
    float my = 0.;
    vec2 sunPosition = vec2(1.4-my, 0.45+my);

    //Set the Background Colour
    vec3 colourValue = mix(skyColour2, skyColour1, uv.y*1.82);




    //Draw the Sun

    sunColour.y = diskValue(uv, vec2(sunPosition.x, sunPosition.y - 0.15), 0.2, 0.8) * 0.4;
    colourValue *= hsv2rgb(sunColour);
    colourValue += diskValue(uv, vec2(sunPosition.x, sunPosition.y - 0.15), 0.1, 0.8) * 0.3;
    drawDisk(uv, sunPosition, 0.02, 0.005, vec3(1., 1., 1.), colourValue);

    bool drawTrees = false;
    //Draw the Hills && Fog

    // upper hill flatness
    float uhFlatness= 0.5;
    float ampl = sin(texture(iChannel1,uv).x)*0.5+0.5;
    drawHill(uv, hillColour1, 0.002, 0.1, uhFlatness, 6.8, 0.10, drawTrees, colourValue, 3., 6, 2., 0.5);
    drawFog(uv, vec2(0.35, 0.282), 0.12, 1., 0., 1.3, 6, 2., 0.5, colourValue);
    drawHill(uv, hillColour2, 0.0236/2., 0.2, 0.4, 2.0, 0.05, drawTrees, colourValue, 2., 5, 2., 0.5);
    drawFog(uv, vec2(0.25, 0.236), 0.25, 0.6, 0., 1.4, 6, 2., 0.5, colourValue);
    drawHill(uv, hillColour3, 0.0786*ampl, 0.5, 0.2, 4.0, - 0.05, drawTrees, colourValue, 0.9, 5, 1.9, 0.45);
    drawFog(uv, vec2(- 0.3, 0.2), 0.6, 0.4, 0., 1., 5, 2., 0.5, colourValue);

    // hills are overlapping the sun?
    // perlinNoise(vec2(uv.x + xOffset + iTime * speed, 0.5), frequency, octaves, lacunarity, persistence) * flatness;
    float hillNoiseValue = perlinNoise(vec2(sunPosition.x + 6.8 + iTime * 0.1, 0.5), 3., 6, 2., 0.5)*uhFlatness;
    float sunIntensity = smoothstep(hillNoiseValue - 0.03, hillNoiseValue + 0.03, sunPosition.y - 0.10)*.681;

    //Draw the Sun Glow

    sunColour.y = diskValue(uv, sunPosition, 0.2, 0.8) * 0.3 * sunIntensity;
	colourValue *= hsv2rgb(sunColour);
    colourValue += diskValue(uv, sunPosition, 0.3, 0.8) * 0.1 * sunIntensity;
    colourValue += diskValue(uv, sunPosition, 0.05, 0.5) * 0.15 * sunIntensity;
    colourValue += diskValue(uv, sunPosition, 0.01, 0.3) * 0.2 * sunIntensity;
    colourValue += hsv2rgb(sunColour) * 0.1 * sunIntensity;

    float highlight = smoothstep(1., 0.7, (colourValue.r + colourValue.g + colourValue.b) / 3.);

    //Make the Scene Darker
    colourValue -= ((1. - sunIntensity) * 0.1) * highlight;
    colourValue -= (1. - diskValue(uv, vec2(0.89, 0.5), 0.4, 1.7)) * 0.3;

    //Set the fragColor
    fragColor = vec4(colourValue, 1.);
    return;
    vec3 backcolor = colourValue;

    // 2d clouds
    uv.y = 1.0 - uv.y;

    uv.x=abs(uv.x);
    vec2 st = uv * 1.0*sin(ampl*ampl);
    st.x += iTime * 0.1;
    st.y -= sin(iTime) * 0.2;
    st += st * abs(iTime/300.0);
    vec3 color;

    vec2 q;
    q.x = fbm(st + 0.00 * iTime*5.0);
    q.y = fbm(st + vec2(1.0, 1.0));

    vec2 r;
    r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * sin(iTime)*5.0);
    r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * cos(iTime)*5.0);

    float f = fbm(st + r);

    color = mix(vec3(1.0, 1.0, 1.0),
                vec3(1.0, 1.0, 1.0),
                clamp((f * f) * 4.0, 0.0, 1.0));

    color = mix(color,
                vec3(1.0, 1.0, 1.0),
                clamp(length(q), 0.0, 1.0));

    color = mix(color,
                vec3(1.0, 1.0, 1.0),
                clamp(length(r.x), 0.0, 1.0));

    vec3 cloud = vec3((f * f * f + 0.3 * f * f + 0.5 * f) * color);

    cloud = mix(vec3(0.0, 0.0, 0.0), cloud, uv.y);

    fragColor = vec4(FilterColor(cloud, backcolor), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

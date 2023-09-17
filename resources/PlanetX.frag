// Modified on http://glslsandbox.com/e#20148.3

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float rand(vec2 co, float seed){
    return fract(sin(dot(co.xy + seed ,vec2(12.9898,78.233))) * 43758.5453);
}

/*
float perlinNoise(vec2 pos, float diameter, float seed){
	float height = 0.0;
	for (float iter = 1.0; iter <= 64.0; iter++) {
		float cellSize = (diameter / iter);
		vec2 snapPos = floor(pos / cellSize) * cellSize;
		vec2 percent = (pos - snapPos) / cellSize;
		float _noise1 = rand(snapPos, seed);
		float _noise2 = rand(floor(vec2(pos.x, pos.y + cellSize) / cellSize) * cellSize, seed);
		float _noise3 = rand(floor(vec2(pos.x + cellSize, pos.y + cellSize) / cellSize) * cellSize, seed);
		float _noise4 = rand(floor(vec2(pos.x + cellSize, pos.y) / cellSize) * cellSize, seed);
		float valTop = mix(_noise1, _noise4, percent.x);
		float valBottom = mix(_noise2, _noise3, percent.x);
		float valFinal = mix(valTop, valBottom, percent.y);
		if (iter > 1.0)
			valFinal = valFinal * 2.0 - 1.0;
		height += valFinal / iter;
	}
	return height;
}*/

vec3 makeJupiter(vec2 uv)
{
	float iteration = 10.;
	float timeScale = .2;
	vec2 zoom = vec2(23.,6.);
	vec2 offset = vec2(0,2.);
	
    vec2 point = uv * zoom + offset;
    float p_x = float(point.x); 
    float p_y = float(point.y);
    
    float a_x = .2;
    float a_y = .3;
    
    for(int i=1; i<int(10); i++){
        float float_i = float(i); 
        point.x+=a_x*sin(float_i*point.y+time*timeScale);
        point.y+=a_y*cos(float_i*point.x);
    }
    
    float r = sin(point.y)*.5+.4;
    float g = cos(point.y)*.5+.7;
    float b = cos(point.y)*.5+.8;
    
    r+=.3;
    
    r = cos(point.x+point.y+1.3)*.5+.5;
    g = sin(point.x+point.y+2.)*.5+.5;
    b = (sin(point.x+point.y+1.)+cos(point.x+point.y+1.))*.25+.5;
      
     
    r = pow(r,.8);
    g = pow(g,.8);
    b = pow(b,1.);
    
    vec3 col = vec3(r,g,b);
    col += vec3(.1);
    
    return col;
}

/*
vec2 distors(vec2 pos, float cellSize, float seed, float strongness) {
	float disX = perlinNoise(pos, cellSize, seed);
	float disY = perlinNoise(pos, cellSize, seed + 2.0);
	disX = disX * 2.0 - 1.0;
	disY = disY * 2.0 - 1.0;
	pos.x += disX * strongness;
	pos.y += disY * strongness;
	return pos;
}*/

void main( void ) {
	
	vec2 texCoord = gl_FragCoord.xy / resolution.xy;
	texCoord = vec2(texCoord.y,texCoord.x);
	vec2 position = ( gl_FragCoord.xy / resolution.xy ) + mouse / 4.0;
	
	vec2 center = resolution.xy / 2.;
	float dis = distance(center, gl_FragCoord.xy);
	float radius = resolution.y / 4.0;
	vec3 atmosphereColor = vec3(.7, .6, .5);
	if (dis < radius) {
		// Find planet coordinates
		vec2 posOnPlanet = (gl_FragCoord.xy - (center - radius));
		vec2 planetCoord = posOnPlanet / (radius * 2.0);
		
		// Spherify it
		planetCoord = planetCoord * 2.0 - 1.0;
		float sphereDis = length(planetCoord);
		sphereDis = 1.0 - pow(1.0 - sphereDis, .6);
		planetCoord = normalize(planetCoord) * sphereDis;
		planetCoord = (planetCoord + 1.0) / 2.0;
		
		// Calculate light amounts
		float light = pow(planetCoord.x, 2.0);
		float lightAtmosphere = pow(planetCoord.x, 1.5);
			
		// Render planet
		/*float h = perlinNoise(planetCoord * 128.0, 48.0, 14.0);
		vec3 surfaceColor = vec3(0, .25, .6);
		if (h > .6) {
			h = (h - .6) / .4;
			surfaceColor = mix(vec3(.4, .6, 0) * .8, vec3(.4, .7, 0) * .8, h);
		}
		else {
			h /= .6;
			float shoreLine = pow(h, 6.0);
			shoreLine = clamp(shoreLine, 0.0, .9);
			surfaceColor = mix(vec3(0, .25, .6), vec3(0, .25, .6) * 1.7, shoreLine);
		}
		
		// Clouds
		vec2 cloudCoordinates = distors(vec2(planetCoord.x * .4, planetCoord.y), 32.0, 15.0, 0.05);
		float cloud = perlinNoise(cloudCoordinates * 256.0, 32.0, 0.0);
		if (cloud > .3) {
			cloud -= .3;
			cloud = pow(cloud, 0.7);
			surfaceColor = mix(surfaceColor, vec3(1.0), cloud);
		}*/
		
		// Apply light
		vec3 surfaceColor = makeJupiter(texCoord);
		surfaceColor *= light;
		
		// Atmosphere
		float fresnelIntensity = pow(dis / radius, 4.0);
		vec3 fresnel = mix(surfaceColor, atmosphereColor, fresnelIntensity * lightAtmosphere);
		
		gl_FragColor = vec4(fresnel.rgb, 1);
	}
	else {
		// Render stars
		float starAmount = rand(gl_FragCoord.xy, 0.0);
		vec3 background = vec3(0, 0, 0);
		if (starAmount < .01) {
			float intensity = starAmount * 100.0 / 4.0;
			intensity = clamp(intensity, .1, .3);
			background = vec3(intensity);
		}
		
		// Atmosphere on top
		float outter = distance(center, gl_FragCoord.xy) / resolution.y;
		outter = 1.0 - outter;
		outter = clamp(outter, .5, .8);
		outter = (outter - .5) / .3;
		outter = pow(outter, 8.0);
		outter *= texCoord.x * 1.5;
		
		// Add atmosphere on top
		gl_FragColor = vec4(background + atmosphereColor * outter, 1);
	}
}
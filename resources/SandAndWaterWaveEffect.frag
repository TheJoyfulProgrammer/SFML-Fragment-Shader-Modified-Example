precision highp float;
precision highp int;

uniform float time;
uniform vec2 resolution;

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    float aspect = resolution.x / resolution.y;

    // Create the water color
    vec3 waterColor = vec3(0.2, 0.4, 0.5);
    vec3 sandColor = vec3(0.8, 0.7, 0.6);

    // Create the distortion effect
    float distortion = 0.05;
    float distortionX = sin(p.y * 10.0 + time * 2.0) * distortion;
    float distortionY = sin(p.x * 10.0 + time * 2.0) * distortion * aspect;
    p.x += distortionX;
    p.y += distortionY;

    // Create the wave effect
    float speed = 1.0;
    float frequency = 3.0;
    float amplitude = 0.1;
    float wave = sin(p.x * frequency + time * speed) * amplitude;
    p.y += wave;

    // Create the sand
    float sandLevel = -0.2;
    vec3 color = mix(waterColor, sandColor, smoothstep(sandLevel - 0.05, sandLevel + 0.05, p.y));

    // Output the color
    gl_FragColor = vec4(color, 1.0);
}

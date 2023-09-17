#ifdef GL_ES
precision mediump float;
#endif

uniform float time; // pass time as a variable
uniform vec2 resolution; // pass time as a variable



	void main()
	{
		
		vec2 uv = (gl_FragCoord.xy/resolution.xy)-0.5; // postion on the screen (adding moves down to the left bottom , - moves diagonally to the right top )
	
		float time = time * .1 + ((.3+.05*sin(time*.01))/(length(uv.xy)+.07))* 1.2; // changes the colour of the vortex and the speed of it 
		float si = sin(time);
		float co = cos(time);
		mat2 ma = mat2(co, si, -si, co);
	
		float c = 0.0;
		float v1 = 0.0; // changes the color to green
		float v2 = 0.0; // changes the color to blue 
		
		for (int i = 0; i < 110; i++)
		{
			float s = float(i) * .030; // changes the size of the particles
			vec3 p = s * vec3(uv.x,length(uv.y-abs(uv.x)), 0.5+sin(time*8.));
			p.xy *= ma;
			p += vec3(.02,.0, s-1.5-sin(time*.3)*0.9);
			for (int i = 0; i < 8; i++)
			{
				p = abs(p) / dot(p,p) - 0.659;
			}
			v1 += dot(p,p)*.0015 * (1.8+sin(length(uv.xy*13.0)+.5-time*.2));
			v2 += dot(p,p)*.0015 * (1.5+sin(length(uv.xy*13.5)+2.2-time*.3));
			c = length(p.xy*.5) * .35;
		}
		
		float len = length(uv);
		v1 *= smoothstep(.7, .0, len);
		v2 *= smoothstep(.6, .0, len);
		
		float re = clamp(c, 0.0, 1.0);
		float gr = clamp((v1+c)*.25, 0.0, 1.0);
		float bl = clamp(v2, 0.0, 1.0);
		vec3 col = vec3(re, gr, bl) + smoothstep(0.15, .0, len) * .9;
	
		gl_FragColor=vec4(col, 1.0);
	}
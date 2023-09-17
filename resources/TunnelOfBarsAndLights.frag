/*
 * Original shader from: https://www.shadertoy.com/view/dddXW7
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
#define main() mainImage( out vec4 fragColor, in vec2 fragCoord )
#define u_canvas iResolution
#define u_mouse iMouse
#define u_time iTime
#define gl_FragCoord fragCoord
#define gl_FragColor fragColor


const float PI = radians(180.);
//Камера
struct Camera {
	//Задаваемые параметры
	float fov, aspect;
	vec3  origin, target, up;
	//Расчетные параметры
	float factor;
	vec3  forward, right, position, coord;
};

//Параметры объекта
struct Object {
	float   distance;	//Последнее приближение к объекту сцены
	float 	id;			//id найденого объека сцены
};

//Луч
struct Ray {
	//Задаваемые параметры
	vec3  origin;		//Начало луча
	vec3  direction;	//Направление луча
	float near;			//Минимальное расстояние от камеры (начало сцены)
	float far;			//Максивальное расстояние от камеры (конец сцены)
	float epsilon;		//Точность обнаружения поверхности
	float steps;		//Максимальное число итераций
	float swing;
	//Вычисляемые параметры
	float distance; 	//Расстояние до объекта сцены от ray.origin в направлении ray.direction
	vec3  position; 	//Точка поверхности
	vec3  normal;		//Нормаль в точке поверхности
	bool  hit;			//Флаг нахождения точки поверхности с заданной точностью
	Object object;		//Параметры объекта (можно формировать непосредственно в карте расстояний)
};
//Формирование луча камеры
Ray lookAt (in vec2 uv, inout Camera cam) {
	//Расчетные характеристики камеры
	cam.factor 		= 1.0/tan(radians(cam.fov/2.));
	cam.forward 	= normalize(cam.target-cam.origin);
	#if 1
		//Правильно
		cam.right 		= normalize(cross(cam.forward, cam.up));
		cam.up 			= cross(cam.right, cam.forward);
	#else
		//Не правильно
		cam.right 		= normalize(cross(cam.up, cam.forward));
		cam.up 			= cross(cam.forward, cam.right);
	#endif
	cam.position 	= cam.origin + cam.factor * cam.forward;
	cam.coord 		= cam.position + uv.x * cam.right * cam.aspect + uv.y * cam.up;
	//Формирование луча
	Ray ray;
	{
		ray.origin 		= cam.origin;
		#if 1
			ray.direction 	= normalize(cam.coord - cam.origin);
		#else
			float angle = radians(cam.fov);
			ray.direction = normalize(vec3(sin(angle*0.5) * uv.x * cam.aspect,  sin(angle*0.5) * uv.y,  -cos(angle*0.5)));
		#endif
		//Умолчания
		ray.near		= 0.01;
		ray.far			= 100.;
		ray.epsilon		= 0.001;
		ray.steps		= 200.;
	}
	return ray;
}
//-------------------Функции позиционирования объектов сцены
void translate(inout vec3 p, vec3 dist) {
	p = p - dist;
}
void translate(inout vec2 p, vec2 dist) {
	p = p - dist;
}
void translate(inout float p, float dist) {
	p = p - dist;
}

//Вращение вокруг осей
mat3 rotate(vec3 r) {
	vec3 s = sin(r), c = cos(r);
	mat3 mx = mat3(1.0, 0.0, 0.0,    0.0, c.x, -s.x,   	0.0, s.x, c.x);
	mat3 my = mat3(c.y, 0.0, -s.y,   0.0, 1.0, 0.0,   	s.y, 0.0, c.y);
	mat3 mz = mat3(c.z, -s.z, 0.0,   s.z, c.z, 0.0,   	0.0, 0.0, 1.0);
   	return mx * my * mz;
}
void rotate(inout vec3 p, vec3 r) {
	mat3 tMat = rotate(r);
	p = tMat * p;
}
void rotateOrigin(inout vec3 p, vec3 r) {
	mat3 tMat = rotate(r);
	p = p * tMat;
}
void rotateX(inout vec3 p, float r) {
	mat3 tMat = rotate(vec3(r,0,0));
	p = tMat * p;
}
void rotateY(inout vec3 p, float r) {
	mat3 tMat = rotate(vec3(0,r,0));
	p = tMat * p;
}
void rotateZ(inout vec3 p, float r) {
	mat3 tMat = rotate(vec3(0,0,r));
	p = tMat * p;
}
//Отражение / Дублирование
void mirror(inout vec3 p, vec3 dist) {
	p = abs(p) - dist;
}
void mirror(inout vec2 p, vec2 dist) {
	p = abs(p) - dist;
}
void mirror(inout float p, float dist) {
	p = abs(p) - dist;
}
//Размножение. Возвращает центр ячейки с id=0.
float replica(inout float p, float d) {
    float id = floor(p/d + 0.5);
    p = mod(p + 0.5*d, d) - 0.5*d;
    return id;
}

vec2 replica(inout vec2 p, vec2 d) {
    vec2 id = floor(p/d + 0.5);
    p = mod(p + 0.5*d, d) - 0.5*d;
    return id;
}
vec3 replica(inout vec3 p, vec3 d) {
    vec3 id = floor(p/d + 0.5);
    p = mod(p + 0.5*d, d) - 0.5*d;
    return id;
}
float replicaLimit(inout float p, float d, float ida, float idb) {
	float id = floor(p/d + 0.5);
	p = p-d*clamp(floor(p/d + 0.5), ida, idb);
	return id;
}
vec2 replicaLimit(inout vec2 p, vec2 d, vec2 ida, vec2 idb) {
	vec2 id = floor(p/d + 0.5);
	p = p-d*clamp(floor(p/d + 0.5), ida, idb);
	return id;
}
vec3 replicaLimit(inout vec3 p, vec3 d, vec3 ida, vec3 idb) {
	vec3 id = floor(p/d + 0.5);
	p = p-d*clamp(floor(p/d + 0.5), ida, idb);
	return id;
}
float replicaAngle(inout vec2 p, float n, float off) {
	float a = 2.* PI /n;
	//polar
	p = vec2(atan(p.y, p.x), length(p.xy));
	float id = floor(mod(p.x + 0.5*a + off, 2.*PI)/a);
    p.x = mod(p.x + 0.5*a + off, a) - 0.5*a;
	p = p.y * vec2(cos(p.x),sin(p.x));
	return id;
}

//-------------------Функции сочетания расстояний до объектов сцены
//Сложение / Объединение / ИЛИ
float OR(float distA, float distB) {
	return mix(distA, distB, step(distB, distA)); //if (distB<distA) return distB; return distA;
}
//Умножение / Пересечение / И
float AND(float distA, float distB) {
	return mix(distA, distB, step(distA, distB)); //if (distB>distA) return distB; return distA;
}
//Мягкое сложение / Объединение / ИЛИ (k==0 без)
float OR(float distA, float distB, float k) {
	float h = clamp( 0.5 - 0.5*(distA-distB)/k, 0., 1. );
	return mix(distA, distB, 1.-h) - k*h*(1.-h);
}
//Мягкое умножение / Пересечение / И (k==0 без)
float AND(float distA, float distB, float k) {
	float h = clamp( 0.5 + 0.5*(distA-distB)/k, 0., 1. );
	return mix(distA, distB, 1.-h) + k*h*(1.-h);
}
//Исключение / НЕ
float NOT(float dist) {
	return -dist;
}
//-------------------Функции сочетания объектов сцены
//Сложение / Объединение / ИЛИ
Object OR(Object objectA, Object objectB) {
	if (objectB.distance<objectA.distance) return objectB;
	return objectA;
}
Object OR(Object objectA, Object objectB, float k) {
	Object object = objectA;
	if (objectB.distance<objectA.distance) object = objectB;
	if (k!=0.) object.distance = OR(objectA.distance, objectB.distance, k);
	return object;
}

//Умножение / Пересечение / И
Object AND(Object objectA, Object objectB) {
	if (objectB.distance>objectA.distance) return objectB;
	return objectA;
}
Object AND(Object objectA, Object objectB, float k) {
	Object object = objectA;
	if (objectB.distance>objectA.distance) object = objectB;
	if (k!=0.) object.distance = AND(objectA.distance, objectB.distance, k);
	return object;
}
//Исключение / НЕ
Object NOT(Object object) {
	object.distance = -object.distance;
	return object;
}
//-------------------функции расстояний до объектов

float dfBox(vec3 p, vec3 s) {
    p = abs(p)-s;
    return max(max(p.x,p.y),p.z);
}

float dfBall(vec3 p, float R) {
	return length(p) - R;
}

float dfCyl(vec2 p, float R) {
	return length(p) - R;
}

float dfBefore(float p, float h) {
	return p - h;
}
float dfAfter(float p, float h) {
	return -p - h;
}

vec3 path(float z) {
    return vec3(sin(z) * .6, cos(z * .5), z);
}

#define ID_LAMP 1.0
#define ID_TUNNEL 2.0

float glow_lamp = 0.;
float glow_tunnel = 0.;

float calcGlow = 1.;

float map(vec3 p, inout Object object) {
    vec3 q;

	object = Object(1e6,-1.);

    p.xy -= path(p.z).xy;
    p.z+=u_time;
	replica(p.z, 1.0);

	q = p;
	Object lamp = Object(1e6, ID_LAMP);
	translate(q.y, 0.5);
	mirror(q.x, 0.2);
	lamp.distance = dfBall(q, 0.015);
	glow_lamp += 0.01/pow(lamp.distance,1.8);
	lamp.distance = OR(lamp.distance, dfCyl(q.xy, 0.0));

	object = OR(object, lamp);

	q = p;
	Object tunnel = Object(1e6, ID_TUNNEL);
	float id = replica(q.z, 0.25);
	replicaAngle(q.xy,8.,0.);
	translate(q.x, 0.6);
	tunnel.distance = OR(tunnel.distance, dfBall(q, 0.015));
	rotateY(q, PI/2.);
	replicaAngle(q.xy,12.,0.);
	tunnel.distance = OR(tunnel.distance, dfCyl(q.yz, 0.));
	glow_tunnel += 0.001/pow(tunnel.distance,2.8)*calcGlow;
	tunnel.distance =  OR(tunnel.distance, dfCyl(q.yz, 0.004));

	object = OR(object, tunnel);

    return object.distance*0.4;
}
float map ( in vec3 p ) {
	Object object;
	return map (p, object);
}

vec3 mapNormal(vec3 p, float eps) {
    vec2 e = vec2(eps, 0);
    return normalize(map(p) - vec3(
        map(p-e.xyy),
        map(p-e.yxy),
        map(p-e.yyx)
	));
}

float rayMarch(inout Ray ray) {
    ray.distance = ray.near;
	float steps = 1.;
    for(int i=0; i<100; i++) {
        ray.position = ray.origin + ray.direction*ray.distance;
        ray.object.distance = map(ray.position, ray.object);
		ray.hit = ray.object.distance<ray.epsilon;
		if (ray.hit) break;
        ray.distance += ray.object.distance;
        if(ray.distance>ray.far) break;
		steps++;
		if (steps>ray.steps) break;
    }
	return steps;
}

vec3 lighting(Ray ray, vec3 lightPos, vec3 mColor) {
	vec3 lightDir = normalize(lightPos - ray.position);

	float sh = 1.;
	#if 0
		Ray ray1 = ray;
		{
			ray1.origin  	= ray.position;
			ray1.direction 	= lightDir;
			ray1.steps		= 50.;
			ray1.far		= 0.5;
		}
		rayMarch(ray1);
		sh = ray1.hit ? 0.1 : 1.;
	#endif

	float atten = 1. / pow(ray.distance,2.0);
	float ambient = 0.1;
	float diffuse = max(dot(ray.normal, lightDir), 0.);
	float specular = pow(max(0.0, dot(reflect(ray.direction, ray.normal), lightDir)),8.0);
	return (mColor * (ambient + diffuse*0.9) + specular) * atten * sh;
}

float demoTimer(float time, float intervalCount, float intervalDuration) {
    float interval_id = floor(time/intervalDuration);
	return mod(interval_id, intervalCount);
}

void main() {
	float aspect = u_canvas.x/u_canvas.y;
	vec2 uv = gl_FragCoord.xy/u_canvas.xy;
	uv = uv-0.5;

	vec2 mouse = u_mouse.xy/u_canvas.xy;
	if (mouse==vec2(0)) mouse = vec2(0.5);

	vec3 angle = vec3(
		-mix(-90., 90., mouse.y),
		 mix(-180.,180., mouse.x),
		 0.
	);

	Camera cam;
	{
		cam.fov     = 60.;
		cam.aspect  = aspect;
		cam.origin  = path(u_time-0.1);
		cam.target  = path(u_time+0.1);
		cam.up 		= vec3(0,1,0);
	}

	Ray ray = lookAt(uv, cam);
	{
		ray.near 	= 0.01;
		ray.far  	= 64.;
		ray.epsilon = 0.0001;
		ray.swing	= 1.; //0.8 + 0.1 * rnd(uv)
		ray.steps 	= 100.;

		rotateOrigin(ray.direction, radians(angle));
	}
	calcGlow = 1.;
	float steps = rayMarch(ray);

    vec3 col = vec3(0);

	#if 1
		if(ray.distance<ray.far) {
			calcGlow = 0.;
			ray.normal = mapNormal(ray.position, ray.epsilon*10.);

			vec3 lightPos = cam.origin/* + vec3(0.5)*/;

			vec3 mColor = vec3(1);
			if (ray.object.id==ID_LAMP) {
				mColor = vec3(1,0.6,0.2);
				col = lighting(ray, lightPos, mColor);
			} else if (ray.object.id==ID_TUNNEL) {
				mColor = vec3(0.1,0.6,1);
				col = lighting(ray, lightPos, mColor);
				col *= (1.-steps/ray.steps);
			}
		}
	#endif

	col += 0.045* glow_lamp * vec3(1,0.6,0.2);

	const float intervalCount = 5.;
	const float intervalDuration = 10.;
	float interval_id = demoTimer(u_time, intervalCount, intervalDuration);
	float glowFactor = mix(0.00000, 0.000035, interval_id/intervalCount);

	col += glowFactor * glow_tunnel * vec3(0.1,0.6,1);

    gl_FragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

#undef main
#undef gl_FragCoord
#undef gl_FragColor

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}

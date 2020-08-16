#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;
in vec4 object;
in vec3 normal;

//matrices
uniform mat4 mM;
uniform mat4 mVP;
uniform mat4 mLVP;

uniform vec4 selected;
out vec3 fragcolor;
out vec4 lpos;

/**
 * Phong
 */
vec3 phong(vec3 light, vec3 ver_position, vec3 ver_normal){
    vec3 ret = vec3(0.0);
    
    vec3 L = normalize(-light);
    float NdotL = clamp(dot(normalize(ver_normal), L), 0.0, 1.0);
   
   	//ambient
	ret += vec3(0.1);
	
	//diffuse
    ret += vec3(1.0) * NdotL;
    
    return log(vec3(1.0) + ret);
}

vec3 vec3fMod(vec3 a, vec3 b) {
    vec3 higher = vec3(greaterThan(a, b));
    vec3 mult = floor(a / b);
    return a * (1.0f - higher) + (a - b * mult) * higher;
}

void main() {
    vec3 objColor = object.x * vec3(0.5) + vec3(0.6);

    int marked = 1;

    for(int i = 0; i < 4; ++i)
        marked *= int(floor(selected[i] * 255.0 + 0.5) == floor(object[i] * 255.0 + 0.5));

    if (bool(marked))
        objColor = vec3(2.0, 1.5, 1.0);
    
    fragcolor = phong(vec3(1, 0.5, 1), vertex, normal) * objColor;
	vec3 shifted = (mM * vec4(vertex, 1.0)).xyz;
    lpos = mLVP * vec4(shifted, 1.0);
	gl_Position =  mVP * vec4(shifted, 1.0);
}

#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;
in vec3 normal;

//matrices
uniform mat4 mMVP;

out vec3 fragcolor;
out float hight;

/**
 * Phong
 */
vec3 phong(vec3 light, vec3 ver_position, vec3 ver_normal){
    vec3 ret = vec3(0.0);
    
    vec3 L = normalize(-light);
    float NdotL = clamp(dot(normalize(ver_normal), L), 0.0, 1.0);
   
   	//ambient
	ret += vec3(0.5);
	
	//diffuse
    ret += vec3(1.0) * NdotL;
    
    return log(vec3(1.0) + ret);
}

void main() {
    hight = vertex.z;
    fragcolor = phong(vec3(1, 0.5, 1), vertex, normal) * 0.3;
    gl_Position =  mMVP * vec4(vertex, 1.0);
}

precision mediump float;
precision highp int;

attribute vec3 vertex;
attribute vec3 normal;

//matrices
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

varying vec3 fragcolor;

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
    fragcolor = phong(vec3(1, 0.5, 1), vertex, normal);
    gl_Position =  mProj * mView * mWorld * vec4(vertex, 1.0);
}

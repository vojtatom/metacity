#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;
in vec4 object;
in vec3 normal;

//matrices
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

uniform vec4 selected;
out vec3 fragcolor;

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
    vec3 objColor = vec3(0.8); //object.xyz * vec3(2.0, 5.0, 10.0);

    int six[4];
    int oix[4];
    int marked = 1;

    for(int i = 0; i < 4; ++i)
        marked *= int(floor(selected[i] * 255.0 + 0.5) == floor(object[i] * 255.0 + 0.5));

    if (bool(marked))
        objColor = vec3(1.0);
    
    fragcolor = phong(vec3(1, 0.5, 1), vertex, normal) * objColor;
    gl_Position =  mProj * mView * mWorld * vec4(vertex, 1.0);
}

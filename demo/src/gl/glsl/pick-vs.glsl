#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;
in vec4 object;

//matrices
uniform mat4 mM;
uniform mat4 mVP;

out vec4 fragcolor;


void main() {
    fragcolor = vec4(object.xyzw);
	vec3 shifted = (mM * vec4(vertex, 1.0)).xyz;
	gl_Position =  mVP * vec4(shifted, 1.0);
}

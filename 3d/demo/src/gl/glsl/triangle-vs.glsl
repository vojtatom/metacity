#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;
out vec4 coord;

//matrices
uniform mat4 mM;
uniform mat4 mVP;

void main() {
	vec3 shifted = (mM * vec4(vertex, 1.0)).xyz;
    coord = mVP * vec4(shifted, 1.0);
	gl_Position = coord;
}

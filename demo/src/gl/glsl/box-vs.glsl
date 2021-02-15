#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;

uniform mat4 mM;
uniform mat4 mVP;

out vec3 fragColor;

void main()
{
	fragColor = vec3(0.64, 1.0, 0.98);
	vec3 shifted = (mM * vec4(vertex, 1.0)).xyz;
	gl_Position =  mVP * vec4(shifted, 1.0);
}
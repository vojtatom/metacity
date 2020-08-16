#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;

uniform mat4 mMVP;

out vec3 fragColor;

void main()
{
	fragColor = vec3(0.64, 1.0, 0.98);
	gl_Position =  mMVP * vec4(vertex, 1.0);
}
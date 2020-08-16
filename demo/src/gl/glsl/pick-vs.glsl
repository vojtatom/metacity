#version 300 es
precision highp float;
precision highp int;

in vec3 vertex;
in vec4 object;

//matrices
uniform mat4 mMVP;

out vec4 fragcolor;


void main() {
    fragcolor = vec4(object.xyzw);
    gl_Position =  mMVP * vec4(vertex, 1.0);
}

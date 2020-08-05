#version 300 es
precision highp float;
precision highp int;

in vec2 vertex;

//matrices
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

uniform float level;

out vec4 fragcolor;

void main() {
    fragcolor = vec4(1.0);
    gl_Position =  mProj * mView * mWorld * vec4(vertex, level, 1.0);
}

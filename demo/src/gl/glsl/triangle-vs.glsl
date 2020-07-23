precision mediump float;
precision highp int;

attribute vec3 vertex;

//matrices
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

void main() {
    gl_Position =  mProj * mView * vec4(vertex, 1.0);
}

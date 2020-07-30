precision mediump float;
precision highp int;

attribute vec3 vertex;
attribute vec4 object;

//matrices
uniform mat4 mView;
uniform mat4 mProj;

varying vec4 fragcolor;


void main() {
    fragcolor = vec4(object.xyzw);
    gl_Position =  mProj * mView * vec4(vertex, 1.0);
}

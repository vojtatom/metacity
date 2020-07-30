precision mediump float;
precision highp int;

attribute vec3 vertex;
attribute vec4 object;

//matrices
uniform mat4 mView;
uniform mat4 mProj;

varying vec4 fragcolor;


void main() {
    fragcolor = vec4(object.xyzw) * vec4(1.0, 5.0, 20.0, 1.0);
    gl_Position =  mProj * mView * vec4(vertex, 1.0);
}

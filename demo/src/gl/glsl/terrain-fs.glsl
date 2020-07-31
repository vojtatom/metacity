precision mediump float;
precision highp int;

varying vec3 fragcolor;

void main()
{
    gl_FragColor = vec4(fragcolor, 1.0);
}
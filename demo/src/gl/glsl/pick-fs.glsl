precision mediump float;
precision highp int;

varying vec4 fragcolor;

void main()
{
    gl_FragColor = vec4(fragcolor);
}
precision mediump float;
precision highp int;

varying vec3 fragColor;

void main()
{
    gl_FragColor = vec4(fragColor, 0.5);
}
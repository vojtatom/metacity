#version 300 es
precision highp float;
precision highp int;

in vec3 fragcolor;
out vec4 color;

void main()
{
    color = vec4(fragcolor, 1.0);
}
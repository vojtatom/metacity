#version 300 es
precision highp float;
precision highp int;

in vec4 fragcolor;
out vec4 color;

void main()
{
    color = vec4(fragcolor);
}
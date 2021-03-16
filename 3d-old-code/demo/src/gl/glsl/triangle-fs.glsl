#version 300 es
precision highp float;
precision highp int;


in vec4 coord;
out float color;

void main()
{
    color = coord.z / coord.w;
}
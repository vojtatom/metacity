#version 300 es
precision highp float;
precision highp int;

in vec4 fragcolor;
in float visible;
out vec4 color;

void main()
{

    if (visible < 0.9)
        discard;
        
    color = vec4(fragcolor);
}
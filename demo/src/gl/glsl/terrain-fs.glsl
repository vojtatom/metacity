#version 300 es
precision highp float;
precision highp int;

in vec3 fragcolor;
in float hight;


out vec4 color;

const float strip_width = 0.5; 

void main()
{
    int ihight = int(hight * (1.0 / strip_width)) % 10;
    vec3 outColor = fragcolor;
    if (ihight == 0)
    {
        outColor *= vec3(0.9);
    }

    color = vec4(vec3(1.0, 1.0, 0.8) * outColor, 1.0);
}